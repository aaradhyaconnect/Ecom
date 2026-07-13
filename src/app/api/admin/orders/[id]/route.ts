import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/server";
import { sendOrderStatusUpdate } from "@/lib/email";
import type { Order } from "@/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if ("response" in auth) return auth.response;
    const { supabase } = auth;
    const { id } = await params;

    const { data, error } = await supabase
      .from("orders")
      .select("*, profiles(name, email, phone)")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: data as Order });
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
    const auth = await requireAdmin();
    if ("response" in auth) return auth.response;
    const { supabase } = auth;
    const { id } = await params;

    const body = await request.json();

    if (!body.order_status && !body.prebook_status) {
      return NextResponse.json(
        { success: false, error: "order_status or prebook_status is required" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.prebook_status) {
      const validPrebookStatuses = ["confirmed", "ready_to_ship", "shipped", "delivered", "balance_collected"];
      if (!validPrebookStatuses.includes(body.prebook_status)) {
        return NextResponse.json(
          { success: false, error: "Invalid prebook status" },
          { status: 400 }
        );
      }
      updateData.prebook_status = body.prebook_status;
    }

    if (body.order_status) {
      const validStatuses = [
        "pending",
        "confirmed",
        "processing",
        "packed",
        "shipped",
        "out-for-delivery",
        "delivered",
        "cancelled",
        "returned",
      ];

      if (!validStatuses.includes(body.order_status)) {
        return NextResponse.json(
          { success: false, error: "Invalid order status" },
          { status: 400 }
        );
      }

      const VALID_TRANSITIONS: Record<string, string[]> = {
        pending: ["confirmed", "cancelled"],
        confirmed: ["processing", "packed", "cancelled"],
        processing: ["packed", "cancelled"],
        packed: ["shipped", "cancelled"],
        shipped: ["out-for-delivery"],
        "out-for-delivery": ["delivered"],
        delivered: ["returned"],
        cancelled: [],
        returned: [],
      };

      const { data: currentOrder } = await supabase
        .from("orders")
        .select("order_status")
        .eq("id", id)
        .single();

      if (currentOrder && !VALID_TRANSITIONS[currentOrder.order_status]?.includes(body.order_status)) {
        return NextResponse.json(
          { success: false, error: `Cannot transition from "${currentOrder.order_status}" to "${body.order_status}"` },
          { status: 400 }
        );
      }

      updateData.order_status = body.order_status;
    }

    if (body.tracking_id != null) updateData.tracking_id = body.tracking_id || null;
    if (body.courier_name != null) updateData.courier_name = body.courier_name || null;
    if (body.estimated_delivery != null) updateData.estimated_delivery = body.estimated_delivery || null;
    if (body.shiprocket_shipment_id != null) updateData.shiprocket_shipment_id = body.shiprocket_shipment_id;

    const { data, error } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    if (body.order_status === "cancelled" || body.order_status === "returned") {
      const { data: fullOrder } = await supabase
        .from("orders")
        .select("items, order_id")
        .eq("id", id)
        .single();
      if (fullOrder) {
        for (const item of fullOrder.items) {
          if (item._is_prebook) continue;
          const { data: product } = await supabase
            .from("products")
            .select("stock")
            .eq("id", item.product_id)
            .single();
          if (product) {
            const newStock = product.stock + item.quantity;
            await supabase
              .from("products")
              .update({ stock: newStock })
              .eq("id", item.product_id)
              .eq("stock", product.stock);
            await supabase.from("stock_history").insert({
              product_id: item.product_id,
              change_type: "return",
              quantity_before: product.stock,
              quantity_after: newStock,
              quantity_change: item.quantity,
              reason: `${body.order_status === "cancelled" ? "Order cancelled" : "Order returned"} — ${fullOrder.order_id}`,
              order_id: id,
              performed_by: auth.user?.id || null,
            });
          }
        }
      }
    }

    // Send status update email (non-blocking)
    if (body.order_status && data) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, email")
        .eq("id", data.user_id)
        .single();

      if (profile?.email) {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://arconstyle.com";
        sendOrderStatusUpdate({
          orderId: data.order_id,
          customerName: profile.name || "Customer",
          customerEmail: profile.email,
          status: body.order_status,
          trackingId: body.tracking_id || data.tracking_id || undefined,
          courierName: body.courier_name || data.courier_name || undefined,
          estimatedDelivery: body.estimated_delivery || data.estimated_delivery || undefined,
          trackingUrl: body.tracking_id ? `${siteUrl}/account/orders/${data.id}` : undefined,
        }).catch(() => {});
      }
    }

    return NextResponse.json({
      success: true,
      data: data as Order,
      message: "Order updated successfully",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
