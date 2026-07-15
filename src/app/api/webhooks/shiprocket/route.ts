import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { awb, current_status, order_id } = body;

    if (!awb) {
      return new Response("OK");
    }

    const { data: order } = await supabase
      .from("orders")
      .select("id, order_status")
      .eq("tracking_id", awb)
      .maybeSingle();

    if (!order) {
      return new Response("OK");
    }

    const statusMap: Record<string, string> = {
      "delivered": "delivered",
      "cancelled": "cancelled",
      "returned": "returned",
      "undelivered": "processing",
      "in-transit": "shipped",
      "out-for-delivery": "shipped",
      "pending": "processing",
    };

    const newStatus = statusMap[current_status?.toLowerCase()] || order.order_status;

    await supabase
      .from("orders")
      .update({
        order_status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    return new Response("OK");
  } catch {
    return new Response("OK");
  }
}
