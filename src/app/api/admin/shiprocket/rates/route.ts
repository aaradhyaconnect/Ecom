import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/supabase/server";
import { getCourierServiceability } from "@/lib/shiprocket";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission("orders", "view");
    if ("response" in auth) return auth.response;

    const { searchParams } = new URL(request.url);
    const pickup = searchParams.get("pickup");
    const delivery = searchParams.get("delivery");
    const weight = searchParams.get("weight");

    if (!pickup || !delivery || !weight) {
      return NextResponse.json(
        { success: false, error: "pickup, delivery, and weight are required" },
        { status: 400 }
      );
    }

    const couriers = await getCourierServiceability(
      pickup,
      delivery,
      parseFloat(weight)
    );

    return NextResponse.json({ success: true, data: couriers });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
