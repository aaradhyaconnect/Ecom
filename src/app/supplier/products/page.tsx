"use client";

import { useState, useEffect } from "react";
import { formatPrice } from "@/lib/utils/format";
import { Package } from "lucide-react";

interface SupplierProduct {
  id: string;
  supplier_sku: string;
  cost_price: number;
  lead_time_days: number;
  min_order_qty: number;
  products: {
    id: string;
    name: string;
    slug: string;
    price: number;
    stock: number;
    sku: string;
    images: string[];
  };
}

export default function SupplierProductsPage() {
  const [products, setProducts] = useState<SupplierProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/supplier/products");
      const data = await res.json();
      if (data.success) setProducts(data.data);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-ivory-dark/40 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-light tracking-wider">MY PRODUCTS</h1>
        <p className="text-sm text-charcoal-muted">Products assigned to you</p>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12 text-charcoal-muted">
          <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No products assigned yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ivory-dark/60 text-left">
                <th className="pb-3 font-medium text-charcoal-muted text-xs uppercase tracking-wider">Product</th>
                <th className="pb-3 font-medium text-charcoal-muted text-xs uppercase tracking-wider">SKU</th>
                <th className="pb-3 font-medium text-charcoal-muted text-xs uppercase tracking-wider">Cost Price</th>
                <th className="pb-3 font-medium text-charcoal-muted text-xs uppercase tracking-wider">Retail Price</th>
                <th className="pb-3 font-medium text-charcoal-muted text-xs uppercase tracking-wider">Stock</th>
                <th className="pb-3 font-medium text-charcoal-muted text-xs uppercase tracking-wider">Lead Time</th>
                <th className="pb-3 font-medium text-charcoal-muted text-xs uppercase tracking-wider">Min Order</th>
              </tr>
            </thead>
            <tbody>
              {products.map((sp) => (
                <tr key={sp.id} className="border-b border-ivory-dark/40">
                  <td className="py-3 font-medium">{sp.products.name}</td>
                  <td className="py-3 text-charcoal-muted">{sp.supplier_sku || sp.products.sku || "—"}</td>
                  <td className="py-3">{formatPrice(sp.cost_price)}</td>
                  <td className="py-3">{formatPrice(sp.products.price)}</td>
                  <td className="py-3">
                    <span className={sp.products.stock <= 0 ? "text-red-600" : ""}>
                      {sp.products.stock}
                    </span>
                  </td>
                  <td className="py-3 text-charcoal-muted">{sp.lead_time_days} days</td>
                  <td className="py-3 text-charcoal-muted">{sp.min_order_qty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
