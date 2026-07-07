import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/server";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if ("response" in auth) return auth.response;
    const { supabase } = auth;

    const { data, error } = await supabase
      .from("store_settings")
      .select("*")
      .eq("id", 1)
      .single();

    if (error && error.code !== "PGRST116") {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Return defaults if no settings exist
    const settings = data || {
      store_name: "HAINJU",
      store_description: "Premium Designer Clothing & Jewellery",
      contact_email: "hello@hainju.com",
      contact_phone: "",
      address: "",
      currency: "INR",
      tax_rate: 0,
      shipping_fee: 0,
      free_shipping_min: 0,
      social_instagram: "",
      social_facebook: "",
      social_twitter: "",
      social_youtube: "",
      seo_title: "HAINJU - Premium Designer Clothing & Jewellery",
      seo_description: "Shop premium designer clothing and artificial jewellery at HAINJU.",
      seo_keywords: "fashion, clothing, jewellery, designer, women",
    };

    return NextResponse.json({ success: true, data: settings });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireAdmin();
    if ("response" in auth) return auth.response;
    const { supabase } = auth;

    const body = await request.json();

    const { data: existing } = await supabase
      .from("store_settings")
      .select("id")
      .eq("id", 1)
      .single();

    if (existing) {
      const { error } = await supabase
        .from("store_settings")
        .update({ ...body, updated_at: new Date().toISOString() })
        .eq("id", 1);

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
    } else {
      const { error } = await supabase
        .from("store_settings")
        .insert({ id: 1, ...body, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
