import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/server";
import type { Order } from "@/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if ("response" in auth) return auth.response;
    const { supabase } = auth;
    const { id } = await params;

    const { data, error } = await supabase
      .from("orders")
      .select("*, profiles(name, email, phone)")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: data as Order });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if ("response" in auth) return auth.response;
    const { supabase } = auth;
    const { id } = await params;

    const body = await request.json();

    if (!body.order_status) {
      return NextResponse.json(
        { success: false, error: "order_status is required" },
        { status: 400 }
      );
    }

    const validStatuses = [
      "pending",
      "confirmed",
      "shipped",
      "out-for-delivery",
      "delivered",
      "cancelled",
      "returned",
    ];

    if (!validStatuses.includes(body.order_status)) {
      return NextResponse.json(
        { success: false, error: "Invalid order status" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      order_status: body.order_status,
      updated_at: new Date().toISOString(),
    };

    if (body.tracking_id) updateData.tracking_id = body.tracking_id;
    if (body.courier_name) updateData.courier_name = body.courier_name;
    if (body.estimated_delivery) updateData.estimated_delivery = body.estimated_delivery;

    const { data, error } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data as Order,
      message: "Order updated successfully",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
