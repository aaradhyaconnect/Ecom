import { NextResponse } from "next/server";
import { requirePermission, createAdminClient } from "@/lib/supabase/server";
import { cancelShipment } from "@/lib/shiprocket";
import { logActivity } from "@/lib/utils/activity";

export async function POST(request: Request) {
  try {
    const auth = await requirePermission("orders", "edit");
    if ("response" in auth) return auth.response;

    const body = await request.json();
    const { shipment_id, order_id } = body;

    if (!shipment_id || !order_id) {
      return NextResponse.json(
        { success: false, error: "shipment_id and order_id are required" },
        { status: 400 }
      );
    }

    const result = await cancelShipment(shipment_id);

    const adminDb = await createAdminClient();
    await adminDb
      .from("orders")
      .update({
        order_status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", order_id);

    await logActivity(
      "shipment_cancelled",
      "order",
      order_id,
      { shipment_id, reason: result.message },
      auth.user.id
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
