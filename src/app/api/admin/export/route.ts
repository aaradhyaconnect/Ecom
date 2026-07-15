import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const auth = await requirePermission("reports", "view");
    if ("response" in auth) return auth.response;
    const { supabase } = auth;

    const url = new URL(request.url);
    const type = url.searchParams.get("type"); // "products", "orders", "customers"

    if (!type || !["products", "orders", "customers"].includes(type)) {
      return NextResponse.json({ success: false, error: "Invalid export type" }, { status: 400 });
    }

    let csv = "";
    let filename = "";

    if (type === "products") {
      const { data } = await supabase.from("products").select("name, slug, category, price, compare_price, stock, rating, review_count, is_new, is_best_seller, is_sale, created_at").order("created_at", { ascending: false });
      csv = "Name,Slug,Category,Price,Compare Price,Stock,Rating,Reviews,New,Best Seller,Sale,Created\n";
      (data || []).forEach(p => {
        csv += `"${(p.name||'').replace(/"/g,'""')}","${p.slug}","${p.category}",${p.price},${p.compare_price || 0},${p.stock},${p.rating || 0},${p.review_count || 0},${p.is_new},${p.is_best_seller},${p.is_sale},"${p.created_at}"\n`;
      });
      filename = "products.csv";
    } else if (type === "orders") {
      const { data } = await supabase.from("orders").select("order_id, user_id, payment_method, payment_status, order_status, subtotal, shipping_charge, discount, total, created_at").order("created_at", { ascending: false });
      csv = "Order ID,User ID,Payment Method,Payment Status,Order Status,Subtotal,Shipping,Discount,Total,Created\n";
      (data || []).forEach(o => {
        csv += `"${o.order_id}","${o.user_id}","${o.payment_method}","${o.payment_status}","${o.order_status}",${o.subtotal},${o.shipping_charge},${o.discount},${o.total},"${o.created_at}"\n`;
      });
      filename = "orders.csv";
    } else if (type === "customers") {
      const { data } = await supabase.from("profiles").select("id, email, name, phone, role, created_at").order("created_at", { ascending: false });
      csv = "ID,Email,Name,Phone,Role,Created\n";
      (data || []).forEach(c => {
        csv += `"${c.id}","${c.email || ''}","${c.name || ''}","${c.phone || ''}","${c.role}","${c.created_at}"\n`;
      });
      filename = "customers.csv";
    }

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
