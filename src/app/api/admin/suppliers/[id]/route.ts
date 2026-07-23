import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/supabase/server";
import { logActivity } from "@/lib/utils/activity";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission("customers", "view");
    if ("response" in auth) return auth.response;
    const { supabase } = auth;
    const { id } = await params;

    const { data: supplier, error } = await supabase
      .from("suppliers")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !supplier) {
      return NextResponse.json({ success: false, error: "Supplier not found" }, { status: 404 });
    }

    const { data: products } = await supabase
      .from("supplier_products")
      .select("*, products(name, slug, price, stock, images)")
      .eq("supplier_id", id)
      .order("created_at", { ascending: false });

    const { data: purchaseOrders } = await supabase
      .from("purchase_orders")
      .select("id, po_number, status, total, expected_date, created_at")
      .eq("supplier_id", id)
      .order("created_at", { ascending: false })
      .limit(20);

    const { data: payments } = await supabase
      .from("supplier_payments")
      .select("id, amount, payment_method, reference, paid_at")
      .eq("supplier_id", id)
      .order("paid_at", { ascending: false })
      .limit(20);

    const totalPaid = (payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalPO = (purchaseOrders || []).reduce((sum, po) => sum + (po.total || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        ...supplier,
        products: products || [],
        purchase_orders: purchaseOrders || [],
        payments: payments || [],
        total_paid: totalPaid,
        total_purchase_orders: totalPO,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission("customers", "edit");
    if ("response" in auth) return auth.response;
    const { supabase } = auth;
    const { id } = await params;
    const body = await request.json();

    const allowedFields = [
      "name", "contact_name", "email", "phone", "address", "city", "state",
      "pincode", "gst_number", "pan_number", "bank_name", "bank_account",
      "ifsc_code", "notes", "is_active",
    ] as const;

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const key of allowedFields) {
      if (key in body) updates[key] = body[key];
    }

    const { data, error } = await supabase
      .from("suppliers")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    await logActivity({
      action: "supplier_updated",
      entity: "supplier",
      entityId: id,
      userId: auth.user?.id,
      before: { name: body.name, contact_name: body.contact_name, email: body.email, is_active: body.is_active },
      after: { name: data.name, contact_name: data.contact_name, email: data.email, is_active: data.is_active },
    });

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission("customers", "edit");
    if ("response" in auth) return auth.response;
    const { supabase } = auth;
    const { id } = await params;

    const { data: activePOs } = await supabase
      .from("purchase_orders")
      .select("id")
      .eq("supplier_id", id)
      .in("status", ["draft", "sent", "confirmed"])
      .limit(1);

    if (activePOs && activePOs.length > 0) {
      return NextResponse.json(
        { success: false, error: "Cannot deactivate supplier with active purchase orders. Complete or cancel them first." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("suppliers")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    await logActivity({
      action: "supplier_deactivated",
      entity: "supplier",
      entityId: id,
      userId: auth.user?.id,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
