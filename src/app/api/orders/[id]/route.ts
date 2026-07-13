import { NextResponse } from "next/server";
import { createServerSupabase, createAdminClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabase();
    const { id } = await params;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabase();
    const { id } = await params;
    const body = await request.json();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (body.action !== "cancel") {
      return NextResponse.json(
        { success: false, error: "Invalid action" },
        { status: 400 }
      );
    }

    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    if (!["pending", "confirmed"].includes(order.order_status)) {
      return NextResponse.json(
        { success: false, error: `Cannot cancel order with status "${order.order_status}"` },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update({ order_status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    // Always restore stock on cancellation
    const adminDb = await createAdminClient();
    for (const item of order.items) {
      const { data: product } = await adminDb
        .from("products")
        .select("stock")
        .eq("id", item.product_id)
        .single();
      if (product) {
        const newStock = product.stock + item.quantity;
        await adminDb
          .from("products")
          .update({ stock: newStock })
          .eq("id", item.product_id)
          .eq("stock", product.stock);
        await adminDb.from("stock_history").insert({
          product_id: item.product_id,
          change_type: "return",
          quantity_before: product.stock,
          quantity_after: newStock,
          quantity_change: item.quantity,
          reason: `Order cancelled by customer — ${order.order_id}`,
          order_id: order.id,
          performed_by: user.id,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Order cancelled successfully",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
