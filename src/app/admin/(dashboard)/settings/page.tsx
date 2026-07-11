"use client";

import { useState, useEffect } from "react";
import { Save, Store, Mail, Phone, MapPin, Globe, Search as SearchIcon, CreditCard, Truck, ImageIcon, Shield } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import toast from "react-hot-toast";
import { MultiImageUpload } from "@/components/ui/ImageUpload";

interface StoreSettings {
  store_name: string;
  store_description: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  currency: string;
  currency_symbol: string;
  tax_rate: number;
  shipping_fee: number;
  free_shipping_min: number;
  social_instagram: string;
  social_facebook: string;
  social_twitter: string;
  social_youtube: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  logo_url: string;
  favicon_url: string;
  gst_number: string;
  gst_rate: number;
  promo_popup_enabled: boolean;
  promo_popup_title: string;
  promo_popup_subtitle: string;
  promo_popup_image: string;
  promo_popup_link: string;
  email_from_name: string;
  email_from_address: string;
  razorpay_key_id: string;
  razorpay_key_secret: string;
  cashfree_app_id: string;
  cashfree_secret_key: string;
  shiprocket_email: string;
  shiprocket_password: string;
}

const defaults: StoreSettings = {
  store_name: "Arcon Style",
  store_description: "Premium Designer Clothing & Jewellery",
  contact_email: "hello@arconstyle.com",
  contact_phone: "",
  address: "",
  currency: "INR",
  currency_symbol: "₹",
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
  logo_url: "",
  favicon_url: "",
  gst_number: "",
  gst_rate: 0,
  promo_popup_enabled: false,
  promo_popup_title: "",
  promo_popup_subtitle: "",
  promo_popup_image: "",
  promo_popup_link: "",
  email_from_name: "Arcon Style",
  email_from_address: "hello@arconstyle.com",
  razorpay_key_id: "",
  razorpay_key_secret: "",
  cashfree_app_id: "",
  cashfree_secret_key: "",
  shiprocket_email: "",
  shiprocket_password: "",
};

function Section({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-white/5 border border-ivory-dark/60 dark:border-white/10 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="h-4 w-4 text-charcoal-muted dark:text-white/50" />
        <h2 className="text-[13px] font-semibold text-charcoal dark:text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<StoreSettings>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "payment" | "shipping" | "email" | "marketing" | "branding">("general");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/settings");
        const data = await res.json();
        if (data.success) setSettings({ ...defaults, ...data.data });
      } catch { /* ok */ }
      finally { setLoading(false); }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) toast.success("Settings saved!");
      else toast.error(data.error || "Failed to save");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const update = (key: keyof StoreSettings, value: string | number | boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-charcoal-muted dark:text-white/50 text-sm">Loading settings...</div>;
  }

  const tabs = [
    { id: "general" as const, label: "General", icon: Store },
    { id: "payment" as const, label: "Payment", icon: CreditCard },
    { id: "shipping" as const, label: "Shipping", icon: Truck },
    { id: "email" as const, label: "Email", icon: Mail },
    { id: "marketing" as const, label: "Marketing", icon: Globe },
    { id: "branding" as const, label: "Branding", icon: ImageIcon },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase tracking-[0.3em] text-gold-dark font-medium">Configuration</span>
          <h1 className="text-2xl font-serif font-bold text-charcoal dark:text-white mt-1">Store Settings</h1>
          <p className="text-[13px] text-charcoal-muted dark:text-white/60 mt-0.5">Configure your store details and preferences</p>
        </div>
        <Button onClick={handleSave} isLoading={saving} size="sm">
          <Save className="h-3.5 w-3.5 mr-1.5" /> Save Changes
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white dark:bg-white/5 border border-ivory-dark/60 dark:border-white/10 rounded-xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-[13px] font-medium rounded-lg transition-colors ${
              activeTab === tab.id
                ? "bg-charcoal text-ivory dark:bg-gold/20 dark:text-gold-light"
                : "text-charcoal-muted dark:text-white/60 hover:bg-ivory-dark/40 dark:hover:bg-white/5"
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* General Tab */}
      {activeTab === "general" && (
        <div className="space-y-4">
          <Section icon={Store} title="Store Information">
            <div className="space-y-4">
              <Input label="Store Name" value={settings.store_name} onChange={(e) => update("store_name", e.target.value)} />
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1.5">Description</label>
                <textarea value={settings.store_description} onChange={(e) => update("store_description", e.target.value)} rows={2} className="w-full border border-ivory-dark/60 dark:border-white/10 px-4 py-2.5 text-sm focus:border-gold/60 focus:ring-0 outline-none bg-ivory dark:bg-white/5 text-gray-900 dark:text-white rounded-lg" />
              </div>
            </div>
          </Section>
          <Section icon={Mail} title="Contact Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Contact Email" type="email" value={settings.contact_email} onChange={(e) => update("contact_email", e.target.value)} icon={<Mail className="h-4 w-4" />} />
              <Input label="Contact Phone" value={settings.contact_phone} onChange={(e) => update("contact_phone", e.target.value)} icon={<Phone className="h-4 w-4" />} />
            </div>
            <div className="mt-4">
              <Input label="Store Address" value={settings.address} onChange={(e) => update("address", e.target.value)} icon={<MapPin className="h-4 w-4" />} />
            </div>
          </Section>
          <Section icon={Shield} title="Tax / GST">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input label="GST Number" value={settings.gst_number} onChange={(e) => update("gst_number", e.target.value)} placeholder="22AAAAA0000A1Z5" />
              <Input label="GST Rate (%)" type="number" value={settings.gst_rate} onChange={(e) => update("gst_rate", Number(e.target.value))} />
              <Input label="Currency Symbol" value={settings.currency_symbol} onChange={(e) => update("currency_symbol", e.target.value)} />
            </div>
          </Section>
        </div>
      )}

      {/* Payment Tab */}
      {activeTab === "payment" && (
        <div className="space-y-4">
          <Section icon={CreditCard} title="Razorpay">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Key ID" value={settings.razorpay_key_id} onChange={(e) => update("razorpay_key_id", e.target.value)} placeholder="rzp_live_..." />
              <Input label="Key Secret" value={settings.razorpay_key_secret} onChange={(e) => update("razorpay_key_secret", e.target.value)} type="password" />
            </div>
          </Section>
          <Section icon={CreditCard} title="Cashfree">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="App ID" value={settings.cashfree_app_id} onChange={(e) => update("cashfree_app_id", e.target.value)} />
              <Input label="Secret Key" value={settings.cashfree_secret_key} onChange={(e) => update("cashfree_secret_key", e.target.value)} type="password" />
            </div>
          </Section>
        </div>
      )}

      {/* Shipping Tab */}
      {activeTab === "shipping" && (
        <div className="space-y-4">
          <Section icon={Truck} title="Shipping Configuration">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input label="Shipping Fee (₹)" type="number" value={settings.shipping_fee} onChange={(e) => update("shipping_fee", Number(e.target.value))} />
              <Input label="Free Shipping Min (₹)" type="number" value={settings.free_shipping_min} onChange={(e) => update("free_shipping_min", Number(e.target.value))} />
              <Input label="Currency" value={settings.currency} onChange={(e) => update("currency", e.target.value)} />
            </div>
          </Section>
          <Section icon={Truck} title="Shiprocket">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Email" type="email" value={settings.shiprocket_email} onChange={(e) => update("shiprocket_email", e.target.value)} />
              <Input label="Password" type="password" value={settings.shiprocket_password} onChange={(e) => update("shiprocket_password", e.target.value)} />
            </div>
          </Section>
        </div>
      )}

      {/* Email Tab */}
      {activeTab === "email" && (
        <div className="space-y-4">
          <Section icon={Mail} title="Email Settings">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="From Name" value={settings.email_from_name} onChange={(e) => update("email_from_name", e.target.value)} />
              <Input label="From Address" type="email" value={settings.email_from_address} onChange={(e) => update("email_from_address", e.target.value)} />
            </div>
          </Section>
        </div>
      )}

      {/* Marketing Tab */}
      {activeTab === "marketing" && (
        <div className="space-y-4">
          <Section icon={Globe} title="Promotional Popup">
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.promo_popup_enabled}
                  onChange={(e) => update("promo_popup_enabled", e.target.checked)}
                  className="rounded border-ivory-dark dark:border-white/20 accent-gold"
                />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Enable promotional popup</span>
              </label>
              {settings.promo_popup_enabled && (
                <div className="space-y-4 pl-6 border-l-2 border-gold/30">
                  <Input label="Popup Title" value={settings.promo_popup_title} onChange={(e) => update("promo_popup_title", e.target.value)} />
                  <Input label="Subtitle" value={settings.promo_popup_subtitle} onChange={(e) => update("promo_popup_subtitle", e.target.value)} />
                  <Input label="Button Link" value={settings.promo_popup_link} onChange={(e) => update("promo_popup_link", e.target.value)} placeholder="https://..." />
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1.5">Popup Image</label>
                    <MultiImageUpload
                      value={settings.promo_popup_image ? [settings.promo_popup_image] : []}
                      onChange={(urls) => update("promo_popup_image", urls[0] || "")}
                      folder="promos"
                      maxImages={1}
                    />
                  </div>
                </div>
              )}
            </div>
          </Section>
          <Section icon={Globe} title="Social Media">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Instagram URL" value={settings.social_instagram} onChange={(e) => update("social_instagram", e.target.value)} placeholder="https://instagram.com/..." />
              <Input label="Facebook URL" value={settings.social_facebook} onChange={(e) => update("social_facebook", e.target.value)} placeholder="https://facebook.com/..." />
              <Input label="Twitter URL" value={settings.social_twitter} onChange={(e) => update("social_twitter", e.target.value)} placeholder="https://twitter.com/..." />
              <Input label="YouTube URL" value={settings.social_youtube} onChange={(e) => update("social_youtube", e.target.value)} placeholder="https://youtube.com/..." />
            </div>
          </Section>
        </div>
      )}

      {/* Branding Tab */}
      {activeTab === "branding" && (
        <div className="space-y-4">
          <Section icon={ImageIcon} title="Logo & Branding">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1.5">Store Logo</label>
                <MultiImageUpload
                  value={settings.logo_url ? [settings.logo_url] : []}
                  onChange={(urls) => update("logo_url", urls[0] || "")}
                  folder="branding"
                  maxImages={1}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1.5">Favicon</label>
                <MultiImageUpload
                  value={settings.favicon_url ? [settings.favicon_url] : []}
                  onChange={(urls) => update("favicon_url", urls[0] || "")}
                  folder="branding"
                  maxImages={1}
                />
              </div>
            </div>
          </Section>
          <Section icon={SearchIcon} title="SEO Defaults">
            <div className="space-y-4">
              <Input label="Default Meta Title" value={settings.seo_title} onChange={(e) => update("seo_title", e.target.value)} />
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1.5">Default Meta Description</label>
                <textarea value={settings.seo_description} onChange={(e) => update("seo_description", e.target.value)} rows={2} className="w-full border border-ivory-dark/60 dark:border-white/10 px-4 py-2.5 text-sm focus:border-gold/60 focus:ring-0 outline-none bg-ivory dark:bg-white/5 text-gray-900 dark:text-white rounded-lg" />
              </div>
              <Input label="Keywords (comma separated)" value={settings.seo_keywords} onChange={(e) => update("seo_keywords", e.target.value)} />
            </div>
          </Section>
        </div>
      )}

      <div className="flex justify-end pb-4">
        <Button onClick={handleSave} isLoading={saving}>
          <Save className="h-4 w-4 mr-2" /> Save All Settings
        </Button>
      </div>
    </div>
  );
}
