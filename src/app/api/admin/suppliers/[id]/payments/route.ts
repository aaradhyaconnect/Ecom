import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission("customers", "view");
    if ("response" in auth) return auth.response;
    const { supabase } = auth;
    const { id } = await params;

    const { data, error } = await supabase
      .from("supplier_payments")
      .select("*, purchase_orders(po_number)")
      .eq("supplier_id", id)
      .order("paid_at", { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission("customers", "edit");
    if ("response" in auth) return auth.response;
    const { supabase, user } = auth;
    const { id } = await params;
    const body = await request.json();

    const payment = {
      supplier_id: id,
      po_id: body.po_id || null,
      amount: Number(body.amount) || 0,
      payment_method: body.payment_method || "bank_transfer",
      reference: body.reference || "",
      notes: body.notes || "",
      paid_at: body.paid_at || new Date().toISOString(),
      created_by: user.id,
      created_at: new Date().toISOString(),
    };

    if (payment.amount <= 0) {
      return NextResponse.json({ success: false, error: "Amount must be greater than 0" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("supplier_payments")
      .insert(payment)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
  }
}
