import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/supabase/server";
import { logActivity } from "@/lib/utils/activity";

export async function GET(request: Request) {
  try {
    const auth = await requirePermission("customers", "view");
    if ("response" in auth) return auth.response;
    const { supabase } = auth;

    const url = new URL(request.url);
    const search = url.searchParams.get("search") || "";
    const page = Number(url.searchParams.get("page")) || 1;
    const limit = Number(url.searchParams.get("limit")) || 50;
    const offset = (page - 1) * limit;

    let query = supabase
      .from("suppliers")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (search) {
      const escaped = search.replace(/[%_\\]/g, "\\$&");
      query = query.or(
        `name.ilike.%${escaped}%,contact_name.ilike.%${escaped}%,email.ilike.%${escaped}%`
      );
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      total: count || 0,
      page,
      limit,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requirePermission("customers", "edit");
    if ("response" in auth) return auth.response;
    const { supabase } = auth;

    const body = await request.json();
    const supplier = {
      name: body.name,
      contact_name: body.contact_name || "",
      email: body.email || "",
      phone: body.phone || "",
      address: body.address || "",
      city: body.city || "",
      state: body.state || "",
      pincode: body.pincode || "",
      gst_number: body.gst_number || "",
      pan_number: body.pan_number || "",
      bank_name: body.bank_name || "",
      bank_account: body.bank_account || "",
      ifsc_code: body.ifsc_code || "",
      notes: body.notes || "",
      is_active: body.is_active ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("suppliers")
      .insert(supplier)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    await logActivity({
      action: "supplier_created",
      entity: "supplier",
      entityId: data.id,
      userId: auth.user?.id,
      after: { name: data.name, contact_name: data.contact_name, email: data.email },
    });

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }
}
