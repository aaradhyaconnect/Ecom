import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/supabase/server";
import { trackShipment, trackByAWB } from "@/lib/shiprocket";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ("response" in auth) return auth.response;

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || searchParams.get("shipment_id");

    if (!q) {
      return Response.json({ success: false, error: "Query parameter required" }, { status: 400 });
    }

    let tracking;
    const trimmed = q.trim();

    if (/^\d+$/.test(trimmed)) {
      tracking = await trackShipment(Number(trimmed));
    } else {
      tracking = await trackByAWB(trimmed);
    }

    return Response.json({ success: true, data: tracking });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
