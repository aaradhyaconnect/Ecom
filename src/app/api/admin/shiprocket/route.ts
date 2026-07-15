import { NextResponse } from "next/server";
import { requirePermission, createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const auth = await requirePermission("orders", "view");
    if ("response" in auth) return auth.response;

    const adminDb = await createAdminClient();

    const { data: statusCounts } = await adminDb
      .from("orders")
      .select("order_status")
      .then(({ data }) => {
        const counts: Record<string, number> = {
          pending: 0,
          confirmed: 0,
          processing: 0,
          packed: 0,
          shipped: 0,
          "out-for-delivery": 0,
          delivered: 0,
          cancelled: 0,
          returned: 0,
        };
        data?.forEach((row: { order_status: string }) => {
          if (counts[row.order_status] !== undefined) {
            counts[row.order_status]++;
          }
        });
        return { data: counts };
      });

    const { count: totalShipments } = await adminDb
      .from("orders")
      .select("*", { count: "exact", head: true })
      .not("shiprocket_shipment_id", "is", null);

    const { data: recentShipments } = await adminDb
      .from("orders")
      .select("id, order_id, shipping_address, order_status, tracking_id, courier_name, shiprocket_shipment_id, created_at, updated_at, total")
      .not("shiprocket_shipment_id", "is", null)
      .order("updated_at", { ascending: false })
      .limit(20);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          total: Object.values(statusCounts || {}).reduce((a: number, b: number) => a + b, 0),
          pending: (statusCounts?.pending || 0) + (statusCounts?.confirmed || 0) + (statusCounts?.processing || 0) + (statusCounts?.packed || 0),
          shipped: (statusCounts?.shipped || 0) + (statusCounts?.["out-for-delivery"] || 0),
          delivered: statusCounts?.delivered || 0,
          cancelled: statusCounts?.cancelled || 0,
          returned: statusCounts?.returned || 0,
          totalShipments: totalShipments || 0,
        },
        recentShipments: recentShipments || [],
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
