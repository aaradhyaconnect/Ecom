import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/supabase/server";

export async function GET() {
  try {
    const auth = await requirePermission("reports", "view");
    if ("response" in auth) return auth.response;
    const { supabase } = auth;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { data: customers, error: custError } = await supabase
      .from("profiles")
      .select("id, name, email, created_at")
      .eq("role", "customer");

    if (custError) {
      return NextResponse.json(
        { success: false, error: custError.message },
        { status: 500 }
      );
    }

    const { data: orders, error: ordError } = await supabase
      .from("orders")
      .select("user_id, total, order_status, created_at");

    if (ordError) {
      return NextResponse.json(
        { success: false, error: ordError.message },
        { status: 500 }
      );
    }

    const custList = customers || [];
    const ordList = orders || [];
    const cancelledReturned = new Set(["cancelled", "returned"]);

    const totalCustomers = custList.length;
    const newThisMonth = custList.filter(
      (c) => new Date(c.created_at) >= new Date(monthStart)
    ).length;

    const customerOrders: Record<string, { total_spent: number; order_count: number; last_order: string }> = {};
    ordList.forEach((o) => {
      if (cancelledReturned.has(o.order_status)) return;
      if (!o.user_id) return;
      if (!customerOrders[o.user_id]) {
        customerOrders[o.user_id] = { total_spent: 0, order_count: 0, last_order: o.created_at };
      }
      customerOrders[o.user_id].total_spent += o.total || 0;
      customerOrders[o.user_id].order_count += 1;
      if (new Date(o.created_at) > new Date(customerOrders[o.user_id].last_order)) {
        customerOrders[o.user_id].last_order = o.created_at;
      }
    });

    const totalLifetimeValue = Object.values(customerOrders).reduce(
      (s, c) => s + c.total_spent,
      0
    );
    const avgLifetimeValue = totalCustomers > 0 ? totalLifetimeValue / totalCustomers : 0;

    const customersWithOrders = Object.keys(customerOrders).length;
    const repeatCustomers = Object.values(customerOrders).filter(
      (c) => c.order_count > 1
    ).length;
    const repeatCustomerRate =
      customersWithOrders > 0 ? (repeatCustomers / customersWithOrders) * 100 : 0;

    const topCustomers = custList
      .map((c) => {
        const stats = customerOrders[c.id] || { total_spent: 0, order_count: 0, last_order: "" };
        return {
          id: c.id,
          name: c.name || "Unknown",
          email: c.email || "",
          total_orders: stats.order_count,
          total_spent: stats.total_spent,
          last_order: stats.last_order,
        };
      })
      .sort((a, b) => b.total_spent - a.total_spent)
      .slice(0, 20);

    const newByDayMap: Record<string, number> = {};
    custList.forEach((c) => {
      const day = new Date(c.created_at).toISOString().split("T")[0];
      newByDayMap[day] = (newByDayMap[day] || 0) + 1;
    });

    const newByDay = Object.entries(newByDayMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          total_customers: totalCustomers,
          new_this_month: newThisMonth,
          avg_lifetime_value: avgLifetimeValue,
          repeat_customer_rate: repeatCustomerRate,
        },
        top_customers: topCustomers,
        new_by_day: newByDay,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
