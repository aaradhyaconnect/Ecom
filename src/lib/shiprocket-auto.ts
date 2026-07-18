import { createShipment, generateAWB, generateLabel } from "./shiprocket";
import { createAdminClient } from "./supabase/server";

interface AutoShipResult {
  success: boolean;
  shipment_id?: number;
  awb?: string;
  courier_name?: string;
  label_url?: string;
  error?: string;
}

export async function autoShipOrder(orderId: string): Promise<AutoShipResult> {
  const adminDb = await createAdminClient();

  const { data: order, error: fetchError } = await adminDb
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (fetchError || !order) {
    return { success: false, error: "Order not found" };
  }

  if (order.shiprocket_shipment_id) {
    return { success: false, error: "Already shipped" };
  }

  if (order.order_status === "cancelled" || order.order_status === "returned") {
    return { success: false, error: "Order cancelled/returned" };
  }

  if (!order.shipping_address?.street || !order.shipping_address?.pincode) {
    return { success: false, error: "Incomplete shipping address" };
  }

  const { data: pickupLoc } = await adminDb
    .from("pickup_locations")
    .select("pickup_location")
    .limit(1)
    .maybeSingle();

  const pickupLocation = pickupLoc?.pickup_location || "Primary";

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

  let shipment;
  try {
    shipment = await createShipment({
      order_id: order.order_id,
      order_date: new Date(order.created_at).toISOString().split("T")[0],
      pickup_location: pickupLocation,
      billing_customer_name: order.shipping_address.full_name || "",
      billing_address: order.shipping_address.street || "",
      billing_city: order.shipping_address.city || "",
      billing_state: order.shipping_address.state || "",
      billing_pincode: order.shipping_address.pincode || "",
      billing_email: order.billing_address?.email || "",
      billing_phone: order.shipping_address.phone || "",
      shipping_is_billing: true,
      order_items: orderItems,
      payment_method: order.payment_method === "cod" ? "COD" : "Prepaid",
      sub_total: Math.round(order.subtotal),
      length: 20,
      breadth: 15,
      height: 10,
      weight: 0.5,
    });
  } catch (err) {
    return {
      success: false,
      error: `Shipment creation failed: ${err instanceof Error ? err.message : "Unknown"}`,
    };
  }

  let awbData: { awb_code: string; courier_name: string } | null = null;
  if (shipment.courier_company_id) {
    try {
      awbData = await generateAWB(
        shipment.shipment_id,
        shipment.courier_company_id
      );
    } catch {
      // AWB can fail; shipment still created
    }
  }

  let labelUrl = "";
  try {
    const label = await generateLabel(shipment.shipment_id);
    labelUrl = label.label_url || "";
  } catch {
    // Label generation is best-effort
  }

  const updates: Record<string, unknown> = {
    shiprocket_shipment_id: shipment.shipment_id,
    tracking_id: awbData?.awb_code || shipment.awb_code || "",
    courier_name: awbData?.courier_name || shipment.courier_name || "",
    shipping_label_url: labelUrl,
    order_status: "shipped",
    updated_at: new Date().toISOString(),
  };

  const { error: updateError } = await adminDb
    .from("orders")
    .update(updates)
    .eq("id", orderId);

  if (updateError) {
    return { success: false, error: "Failed to update order" };
  }

  return {
    success: true,
    shipment_id: shipment.shipment_id,
    awb: updates.tracking_id as string,
    courier_name: updates.courier_name as string,
    label_url: labelUrl,
  };
}
