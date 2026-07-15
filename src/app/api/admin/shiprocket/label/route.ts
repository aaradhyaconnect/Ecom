import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/supabase/server";
import { generateLabel } from "@/lib/shiprocket";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission("orders", "view");
    if ("response" in auth) return auth.response;

    const { searchParams } = new URL(request.url);
    const shipmentId = searchParams.get("shipment_id");

    if (!shipmentId) {
      return NextResponse.json(
        { success: false, error: "shipment_id is required" },
        { status: 400 }
      );
    }

    const result = await generateLabel(Number(shipmentId));

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
