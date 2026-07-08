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
      store_name: "Arcon Style",
      store_description: "Premium Designer Clothing & Jewellery",
      contact_email: "hello@arconstyle.com",
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
      seo_title: "Arcon Style - Premium Designer Clothing & Jewellery",
      seo_description: "Shop premium designer clothing and artificial jewellery at Arcon Style.",
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

    const ALLOWED_FIELDS = [
      "store_name", "store_description", "contact_email", "contact_phone", "address",
      "currency", "tax_rate", "shipping_fee", "free_shipping_min",
      "social_instagram", "social_facebook", "social_twitter", "social_youtube",
      "seo_title", "seo_description", "seo_keywords",
    ] as const;

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const key of ALLOWED_FIELDS) {
      if (key in body) updates[key] = body[key];
    }

    const { data: existing } = await supabase
      .from("store_settings")
      .select("id")
      .eq("id", 1)
      .single();

    if (existing) {
      const { error } = await supabase
        .from("store_settings")
        .update(updates)
        .eq("id", 1);

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
    } else {
      const { error } = await supabase
        .from("store_settings")
        .insert({ id: 1, ...updates, created_at: new Date().toISOString() });

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
