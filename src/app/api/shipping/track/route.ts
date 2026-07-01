import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/supabase/server";
import { trackShipment } from "@/lib/shiprocket";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ("response" in auth) return auth.response;

    const { searchParams } = new URL(request.url);
    const shipmentId = searchParams.get("shipment_id");

    if (!shipmentId) {
      return Response.json(
        { success: false, error: "shipment_id is required" },
        { status: 400 }
      );
    }

    const tracking = await trackShipment(Number(shipmentId));

    return Response.json({ success: true, data: tracking });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
