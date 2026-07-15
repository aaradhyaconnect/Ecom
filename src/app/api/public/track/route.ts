import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { trackShipment, trackByAWB } from "@/lib/shiprocket";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("order_id");
    const awbCode = searchParams.get("awb");
    const email = searchParams.get("email");

    if (!orderId && !awbCode) {
      return Response.json({ success: false, error: "order_id or awb parameter required" }, { status: 400 });
    }

    let order = null;

    if (orderId) {
      const { data } = await supabase
        .from("orders")
        .select("id, order_id, tracking_id, courier_name, estimated_delivery, shiprocket_shipment_id, order_status, items, shipping_address")
        .eq("order_id", orderId)
        .maybeSingle();
      order = data;
    } else if (awbCode) {
      const { data } = await supabase
        .from("orders")
        .select("id, order_id, tracking_id, courier_name, estimated_delivery, shiprocket_shipment_id, order_status, items, shipping_address")
        .eq("tracking_id", awbCode)
        .maybeSingle();
      order = data;
    }

    if (!order) {
      return Response.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    if (!order.shiprocket_shipment_id && !order.tracking_id) {
      return Response.json({
        success: true,
        data: {
          order_id: order.order_id,
          status: order.order_status,
          tracking_id: null,
          courier_name: null,
          estimated_delivery: null,
          events: [],
          shipping_address: order.shipping_address,
          items: order.items,
        },
      });
    }

    let trackingData = null;
    try {
      if (order.shiprocket_shipment_id) {
        trackingData = await trackShipment(Number(order.shiprocket_shipment_id));
      } else if (order.tracking_id) {
        trackingData = await trackByAWB(order.tracking_id);
      }
    } catch {
      // Shiprocket API may fail — return cached data
    }

    return Response.json({
      success: true,
      data: {
        order_id: order.order_id,
        status: order.order_status,
        tracking_id: order.tracking_id,
        courier_name: order.courier_name,
        estimated_delivery: order.estimated_delivery,
        current_status: trackingData?.current_status || trackingData?.shipment_status || order.order_status,
        current_location: trackingData?.current_location || null,
        track_url: trackingData?.track_url || null,
        events: trackingData?.tracking_data || [],
      },
    });
  } catch {
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
