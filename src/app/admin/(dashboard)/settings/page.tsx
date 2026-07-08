"use client";

import { useState, useEffect } from "react";
import { Save, Store, Mail, Phone, MapPin, DollarSign, Globe, Search as SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import toast from "react-hot-toast";

interface StoreSettings {
  store_name: string;
  store_description: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  currency: string;
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
}

const defaults: StoreSettings = {
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

export default function SettingsPage() {
  const [settings, setSettings] = useState<StoreSettings>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  const update = (key: keyof StoreSettings, value: string | number) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-charcoal-muted text-sm">Loading settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase tracking-[0.3em] text-gold-dark font-medium">Configuration</span>
          <h1 className="text-2xl font-serif font-bold text-charcoal mt-1">Store Settings</h1>
          <p className="text-[13px] text-charcoal-muted mt-0.5">Configure your store details and preferences</p>
        </div>
        <Button onClick={handleSave} isLoading={saving} size="sm">
          <Save className="h-3.5 w-3.5 mr-1.5" /> Save Changes
        </Button>
      </div>

      {/* Store Info */}
      <div className="bg-white border border-ivory-dark/60 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Store className="h-4 w-4 text-charcoal-muted" />
          <h2 className="text-[13px] font-semibold text-charcoal">Store Information</h2>
        </div>
        <div className="space-y-4">
          <Input label="Store Name" value={settings.store_name} onChange={(e) => update("store_name", e.target.value)} />
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5">Description</label>
            <textarea value={settings.store_description} onChange={(e) => update("store_description", e.target.value)} rows={2} className="w-full border border-ivory-dark/60 px-4 py-2.5 text-sm focus:border-gold/60 focus:ring-0 outline-none bg-ivory text-charcoal" />
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="bg-white border border-ivory-dark/60 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="h-4 w-4 text-charcoal-muted" />
          <h2 className="text-[13px] font-semibold text-charcoal">Contact Information</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Contact Email" type="email" value={settings.contact_email} onChange={(e) => update("contact_email", e.target.value)} icon={<Mail className="h-4 w-4" />} />
          <Input label="Contact Phone" value={settings.contact_phone} onChange={(e) => update("contact_phone", e.target.value)} icon={<Phone className="h-4 w-4" />} />
        </div>
        <div className="mt-4">
          <Input label="Store Address" value={settings.address} onChange={(e) => update("address", e.target.value)} icon={<MapPin className="h-4 w-4" />} />
        </div>
      </div>

      {/* Shipping & Tax */}
      <div className="bg-white border border-ivory-dark/60 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="h-4 w-4 text-charcoal-muted" />
          <h2 className="text-[13px] font-semibold text-charcoal">Shipping & Tax</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input label="Currency" value={settings.currency} onChange={(e) => update("currency", e.target.value)} />
          <Input label="Tax Rate (%)" type="number" value={settings.tax_rate} onChange={(e) => update("tax_rate", Number(e.target.value))} />
          <Input label="Shipping Fee (₹)" type="number" value={settings.shipping_fee} onChange={(e) => update("shipping_fee", Number(e.target.value))} />
        </div>
        <div className="mt-4">
          <Input label="Free Shipping Minimum (₹)" type="number" value={settings.free_shipping_min} onChange={(e) => update("free_shipping_min", Number(e.target.value))} />
        </div>
      </div>

      {/* Social Links */}
      <div className="bg-white border border-ivory-dark/60 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="h-4 w-4 text-charcoal-muted" />
          <h2 className="text-[13px] font-semibold text-charcoal">Social Media</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Instagram URL" value={settings.social_instagram} onChange={(e) => update("social_instagram", e.target.value)} placeholder="https://instagram.com/..." />
          <Input label="Facebook URL" value={settings.social_facebook} onChange={(e) => update("social_facebook", e.target.value)} placeholder="https://facebook.com/..." />
          <Input label="Twitter URL" value={settings.social_twitter} onChange={(e) => update("social_twitter", e.target.value)} placeholder="https://twitter.com/..." />
          <Input label="YouTube URL" value={settings.social_youtube} onChange={(e) => update("social_youtube", e.target.value)} placeholder="https://youtube.com/..." />
        </div>
      </div>

      {/* SEO */}
      <div className="bg-white border border-ivory-dark/60 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <SearchIcon className="h-4 w-4 text-charcoal-muted" />
          <h2 className="text-[13px] font-semibold text-charcoal">SEO Defaults</h2>
        </div>
        <div className="space-y-4">
          <Input label="Default Meta Title" value={settings.seo_title} onChange={(e) => update("seo_title", e.target.value)} />
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5">Default Meta Description</label>
            <textarea value={settings.seo_description} onChange={(e) => update("seo_description", e.target.value)} rows={2} className="w-full border border-ivory-dark/60 px-4 py-2.5 text-sm focus:border-gold/60 focus:ring-0 outline-none bg-ivory text-charcoal" />
          </div>
          <Input label="Keywords (comma separated)" value={settings.seo_keywords} onChange={(e) => update("seo_keywords", e.target.value)} />
        </div>
      </div>

      <div className="flex justify-end pb-4">
        <Button onClick={handleSave} isLoading={saving}>
          <Save className="h-4 w-4 mr-2" /> Save All Settings
        </Button>
      </div>
    </div>
  );
}
