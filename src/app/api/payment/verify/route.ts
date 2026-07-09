import { NextRequest } from "next/server";
import { createAdminClient, createServerSupabase } from "@/lib/supabase/server";
import { getCashfreeOrder, getCashfreePayments } from "@/lib/cashfree";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { order_id } = body;

    if (!order_id) {
      return Response.json(
        { success: false, error: "Missing order_id" },
        { status: 400 }
      );
    }

    const adminDb = await createAdminClient();
    const { data: order, error: orderError } = await adminDb
      .from("orders")
      .select("id,user_id,cashfree_order_id,payment_status")
      .eq("id", order_id)
      .single();

    if (orderError || !order || order.user_id !== user.id) {
      return Response.json(
        { success: false, error: "Order could not be verified" },
        { status: 400 }
      );
    }

    if (order.payment_status === "paid") {
      return Response.json({
        success: true,
        message: "Payment already verified",
      });
    }

    if (!order.cashfree_order_id) {
      return Response.json(
        { success: false, error: "No Cashfree order found" },
        { status: 400 }
      );
    }

    const cfOrder = await getCashfreeOrder(order.cashfree_order_id);

    if (cfOrder.order_status === "PAID") {
      const payments = await getCashfreePayments(order.cashfree_order_id);
      const successfulPayment = payments.find(
        (p) => p.payment_status === "SUCCESS"
      );

      await adminDb
        .from("orders")
        .update({
          payment_status: "paid",
          order_status: "confirmed",
          cashfree_payment_id: successfulPayment?.cf_payment_id || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", order_id);

      return Response.json({
        success: true,
        message: "Payment verified successfully",
      });
    }

    if (cfOrder.order_status === "EXPIRED" || cfOrder.order_status === "TERMINATED") {
      await adminDb
        .from("orders")
        .update({
          payment_status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", order_id);

      return Response.json(
        { success: false, error: "Payment failed or expired" },
        { status: 400 }
      );
    }

    return Response.json(
      { success: false, error: "Payment is still pending" },
      { status: 400 }
    );
  } catch {
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
