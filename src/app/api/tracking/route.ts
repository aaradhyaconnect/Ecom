import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const orderId = searchParams.get("order_id");

    if (!orderId) {
      return NextResponse.json({ error: "order_id is required" }, { status: 400 });
    }

    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the order and verify ownership
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, tracking_id, courier_name, estimated_delivery, shiprocket_shipment_id, order_status")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // If no tracking info yet, return basic status
    if (!order.tracking_id) {
      return NextResponse.json({
        success: true,
        data: {
          status: order.order_status,
          tracking_id: null,
          courier_name: null,
          estimated_delivery: null,
          tracking_url: null,
          events: [],
        },
      });
    }

    // Try to get live tracking from Shiprocket (if shipment ID exists)
    let trackingEvents: { status: string; location: string; timestamp: string }[] = [];

    if (order.shiprocket_shipment_id) {
      try {
        // Get Shiprocket token
        const shiprocketRes = await fetch("https://apiv2.shiprocket.in/v1/external/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: process.env.SHIPROCKET_EMAIL,
            password: process.env.SHIPROCKET_PASSWORD,
          }),
        });
        const shiprocketData = await shiprocketRes.json();

        if (shiprocketData.token) {
          const trackRes = await fetch(
            `https://apiv2.shiprocket.in/v1/external/courier/track/shipment/${order.shiprocket_shipment_id}`,
            {
              headers: { Authorization: `Bearer ${shiprocketData.token}` },
            }
          );
          const trackData = await trackRes.json();

          if (trackData.tracking_data?.tracking_history) {
            trackingEvents = trackData.tracking_data.tracking_history.map(
              (event: { status: string; location: string; activity_date: string }) => ({
                status: event.status,
                location: event.location,
                timestamp: event.activity_date,
              })
            );
          }
        }
      } catch {
        // Shiprocket API failed, return basic tracking info
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        status: order.order_status,
        tracking_id: order.tracking_id,
        courier_name: order.courier_name,
        estimated_delivery: order.estimated_delivery,
        tracking_url: `https://shiprocket.co/tracking/${order.tracking_id}`,
        events: trackingEvents,
      },
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
