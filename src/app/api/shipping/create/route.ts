import { NextRequest } from "next/server";
import { requireAdmin, createAdminClient } from "@/lib/supabase/server";
import { createShipment, generateAWB } from "@/lib/shiprocket";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ("response" in auth) return auth.response;

    const body = await request.json();
    const { order_id } = body;

    if (!order_id) {
      return Response.json(
        { success: false, error: "Order ID is required" },
        { status: 400 }
      );
    }

    const adminDb = await createAdminClient();
    const { data: order, error: orderError } = await adminDb
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      return Response.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    if (order.order_status === "cancelled" || order.order_status === "returned") {
      return Response.json(
        { success: false, error: "Cannot ship a cancelled or returned order" },
        { status: 400 }
      );
    }

    if (order.shiprocket_shipment_id) {
      return Response.json(
        { success: false, error: "Shipment already created for this order" },
        { status: 400 }
      );
    }

    const { data: pickupLocations } = await adminDb
      .from("pickup_locations")
      .select("*")
      .limit(1)
      .maybeSingle();

    const pickupLocation = pickupLocations?.pickup_location || "Primary";

    const orderItems = (order.items || []).map(
      (item: { product: { name: string; id: string; price: number }; quantity: number }) => ({
        name: item.product?.name || "Product",
        sku: item.product?.id || "",
        units: item.quantity || 1,
        selling_price: Math.round(item.product?.price || 0),
      })
    );

    const paymentMethod: "Prepaid" | "COD" = order.payment_method === "cod" ? "COD" : "Prepaid";

    const shipmentParams = {
      order_id: order.order_id,
      order_date: new Date(order.created_at).toISOString().split("T")[0],
      pickup_location: pickupLocation,
      billing_customer_name: order.shipping_address.full_name,
      billing_address: order.shipping_address.street,
      billing_city: order.shipping_address.city,
      billing_state: order.shipping_address.state,
      billing_pincode: order.shipping_address.pincode,
      billing_email: order.billing_address?.email || "",
      billing_phone: order.shipping_address.phone,
      shipping_is_billing: true,
      order_items: orderItems,
      payment_method: paymentMethod,
      sub_total: Math.round(order.subtotal),
      length: 20,
      breadth: 15,
      height: 10,
      weight: 0.5,
    };

    const shipment = await createShipment(shipmentParams);

    let awbData = null;
    if (shipment.courier_company_id) {
      try {
        awbData = await generateAWB(shipment.shipment_id, shipment.courier_company_id);
      } catch {
        // AWB generation may fail; shipment is still created
      }
    }

    const updates: Record<string, unknown> = {
      shiprocket_shipment_id: shipment.shipment_id,
      tracking_id: awbData?.awb_code || shipment.awb_code || "",
      courier_name: awbData?.courier_name || shipment.courier_name || "",
      order_status: "shipped",
      updated_at: new Date().toISOString(),
    };

    const { data: updatedOrder, error: updateError } = await adminDb
      .from("orders")
      .update(updates)
      .eq("id", order_id)
      .select()
      .single();

    if (updateError) {
      return Response.json(
        { success: false, error: "Order updated but failed to save tracking details" },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      data: updatedOrder,
      message: "Shipment created successfully",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
