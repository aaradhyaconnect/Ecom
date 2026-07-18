import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/supabase/server";
import { logActivity } from "@/lib/utils/activity";

export async function GET() {
  try {
    const auth = await requirePermission("settings", "view");
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
      store_name: "G2I Style",
      store_description: "Premium Designer Clothing & Jewellery",
      contact_email: "hello@g2istyle.com",
      contact_phone: "",
      address: "",
      currency: "INR",
      currency_symbol: "₹",
      tax_rate: 0,
      gst_number: "",
      gst_rate: 0,
      shipping_fee: 0,
      free_shipping_min: 0,
      social_instagram: "",
      social_facebook: "",
      social_twitter: "",
      social_youtube: "",
      seo_title: "G2I Style - Premium Designer Clothing & Jewellery",
      seo_description: "Shop premium designer clothing and artificial jewellery at G2I Style.",
      seo_keywords: "fashion, clothing, jewellery, designer, women",
      logo_url: "",
      favicon_url: "",
      promo_popup_enabled: false,
      promo_popup_title: "",
      promo_popup_subtitle: "",
      promo_popup_button_text: "Shop Now",
      promo_popup_link: "",
      razorpay_key_id: "",
      razorpay_key_secret: "",
      cashfree_app_id: "",
      cashfree_secret_key: "",
      shiprocket_email: "",
      shiprocket_password: "",
      email_from_name: "",
      email_from_address: "",
    };

    // Strip secrets before returning (never send to client)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { razorpay_key_secret, cashfree_secret_key, shiprocket_password, ...safeSettings } = settings;

    return NextResponse.json({ success: true, data: safeSettings });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requirePermission("settings", "edit");
    if ("response" in auth) return auth.response;
    const { supabase, user } = auth;

    const body = await request.json();

    const ALLOWED_FIELDS = [
      "store_name", "store_description", "contact_email", "contact_phone", "address",
      "currency", "currency_symbol", "tax_rate", "gst_number", "gst_rate",
      "gst_enabled", "tax_inclusive",
      "shipping_fee", "free_shipping_min",
      "social_instagram", "social_facebook", "social_twitter", "social_youtube",
      "seo_title", "seo_description", "seo_keywords",
      "logo_url", "favicon_url",
      "promo_popup_enabled", "promo_popup_title", "promo_popup_subtitle",
      "promo_popup_button_text", "promo_popup_link",
      "razorpay_key_id", "razorpay_key_secret",
      "cashfree_app_id", "cashfree_secret_key",
      "shiprocket_email", "shiprocket_password",
      "email_from_name", "email_from_address",
      "low_stock_threshold", "low_stock_alert_email",
      "maintenance_mode", "maintenance_message",
    ] as const;

    // Secret fields: only overwrite if user actually provided a non-empty value
    const SECRET_FIELDS = ["razorpay_key_secret", "cashfree_secret_key", "shiprocket_password"];

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const key of ALLOWED_FIELDS) {
      if (key in body) {
        // Skip secret fields if value is empty string (preserve existing)
        if (SECRET_FIELDS.includes(key) && body[key] === "") continue;
        updates[key] = body[key];
      }
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

    await logActivity("settings_updated", "settings", "1", { fields: Object.keys(updates) }, user?.id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
