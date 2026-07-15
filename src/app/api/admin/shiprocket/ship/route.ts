import { NextResponse } from "next/server";
import { requirePermission, createAdminClient } from "@/lib/supabase/server";
import { createShipment, generateAWB } from "@/lib/shiprocket";

export async function POST(request: Request) {
  try {
    const auth = await requirePermission("orders", "edit");
    if ("response" in auth) return auth.response;

    const body = await request.json();
    const { order_ids } = body;

    if (!Array.isArray(order_ids) || order_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: "order_ids array required" },
        { status: 400 }
      );
    }

    const adminDb = await createAdminClient();
    const results: {
      order_id: string;
      success: boolean;
      error?: string;
      awb?: string;
    }[] = [];

    for (const orderId of order_ids.slice(0, 20)) {
      try {
        const { data: order } = await adminDb
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .single();

        if (!order) {
          results.push({ order_id: orderId, success: false, error: "Not found" });
          continue;
        }

        if (order.shiprocket_shipment_id) {
          results.push({
            order_id: orderId,
            success: false,
            error: "Already shipped",
          });
          continue;
        }

        if (order.order_status === "cancelled" || order.order_status === "returned") {
          results.push({
            order_id: orderId,
            success: false,
            error: "Cannot ship cancelled/returned order",
          });
          continue;
        }

        const orderItems = (order.items || []).map(
          (item: {
            product?: { name?: string; id?: string; price?: number };
            quantity?: number;
          }) => ({
            name: item.product?.name || "Product",
            sku: item.product?.id || "",
            units: item.quantity || 1,
            selling_price: Math.round(item.product?.price || 0),
          })
        );

        const shipment = await createShipment({
          order_id: order.order_id,
          order_date: new Date(order.created_at).toISOString().split("T")[0],
          pickup_location: "Primary",
          billing_customer_name:
            order.shipping_address?.full_name || "",
          billing_address: order.shipping_address?.street || "",
          billing_city: order.shipping_address?.city || "",
          billing_state: order.shipping_address?.state || "",
          billing_pincode: order.shipping_address?.pincode || "",
          billing_email: order.billing_address?.email || "",
          billing_phone: order.shipping_address?.phone || "",
          shipping_is_billing: true,
          order_items: orderItems,
          payment_method:
            order.payment_method === "cod" ? "COD" : "Prepaid",
          sub_total: Math.round(order.subtotal),
          weight: 0.5,
        });

        let awbData = null;
        if (shipment.courier_company_id) {
          try {
            awbData = await generateAWB(
              shipment.shipment_id,
              shipment.courier_company_id
            );
          } catch {
            // AWB generation may fail; shipment is still created
          }
        }

        await adminDb
          .from("orders")
          .update({
            shiprocket_shipment_id: shipment.shipment_id,
            tracking_id:
              awbData?.awb_code || shipment.awb_code || "",
            courier_name:
              awbData?.courier_name || shipment.courier_name || "",
            order_status: "shipped",
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId);

        results.push({
          order_id: orderId,
          success: true,
          awb: awbData?.awb_code || "",
        });
      } catch (err: unknown) {
        results.push({
          order_id: orderId,
          success: false,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({ success: true, data: results });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
