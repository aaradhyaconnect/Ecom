import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/supabase/server";
import { logActivity } from "@/lib/utils/activity";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission("orders", "edit");
    if ("response" in auth) return auth.response;
    const { supabase, user } = auth;
    const { id } = await params;
    const body = await request.json();

    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    if (order.order_status !== "cancelled") {
      return NextResponse.json(
        { success: false, error: "Can only refund cancelled orders" },
        { status: 400 }
      );
    }

    if (order.payment_method === "cod") {
      return NextResponse.json(
        { success: false, error: "COD orders cannot be refunded online" },
        { status: 400 }
      );
    }

    if (order.refund_status === "completed") {
      return NextResponse.json(
        { success: false, error: "Order already refunded" },
        { status: 400 }
      );
    }

    const refundAmount = body.amount || order.total;

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        refund_amount: refundAmount,
        refund_status: "completed",
        refund_id: body.refund_id || `REF-${Date.now()}`,
        refund_date: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    await logActivity("refund_processed", "order", id, {
      amount: refundAmount,
      refund_id: body.refund_id,
    }, user?.id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
