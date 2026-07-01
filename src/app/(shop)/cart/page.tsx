"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, Tag } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";
import { useAuthStore } from "@/lib/store/auth";
import { formatPrice } from "@/lib/utils/format";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";

const SHIPPING_THRESHOLD = 999;
const SHIPPING_CHARGE = 49;

export default function CartPage() {
  const { items, removeItem, updateQuantity, getSubtotal } = useCartStore();
  const { user } = useAuthStore();
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
    discount_type: "percentage" | "flat";
    max_discount?: number;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");

  const subtotal = getSubtotal();
  const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_CHARGE;

  const discount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discount_type === "flat") return appliedCoupon.discount;
    const calculated = (subtotal * appliedCoupon.discount) / 100;
    return appliedCoupon.max_discount
      ? Math.min(calculated, appliedCoupon.max_discount)
      : calculated;
  }, [appliedCoupon, subtotal]);

  const total = Math.max(0, subtotal + shipping - discount);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError("");
    setAppliedCoupon(null);

    try {
      const res = await fetch(`/api/coupons/${couponCode.trim().toUpperCase()}`);
      const data = await res.json();

      if (!data.success) {
        setCouponError(data.error || "Invalid coupon");
        return;
      }

      if (subtotal < data.data.min_order) {
        setCouponError(`Minimum order value is ${formatPrice(data.data.min_order)}`);
        return;
      }

      setAppliedCoupon(data.data);
      toast.success("Coupon applied!");
    } catch {
      setCouponError("Failed to validate coupon");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  };

  const handleSaveCart = async () => {
    if (!user) return;
    try {
      await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
    } catch {
      // silent
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <ShoppingBag className="h-20 w-20 text-charcoal/10 mb-6" />
        <h1 className="text-2xl font-serif font-bold text-charcoal mb-2">Your cart is empty</h1>
        <p className="text-charcoal-muted mb-8">Looks like you haven&apos;t added anything yet</p>
        <Link href="/products/new-arrivals">
          <Button variant="outline" size="lg">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Continue Shopping
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <span className="text-xs uppercase tracking-[0.3em] text-gold-dark font-medium">Cart</span>
          <h1 className="text-2xl lg:text-3xl font-serif font-bold text-charcoal mt-1">
            Shopping Cart ({items.length})
          </h1>
        </div>
        <Link
          href="/products/new-arrivals"
          className="text-xs uppercase tracking-[0.2em] text-charcoal-muted hover:text-charcoal transition-colors"
        >
          Continue Shopping
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 bg-ivory border border-ivory-dark p-4"
            >
              <div className="w-24 h-32 overflow-hidden bg-charcoal/5 flex-shrink-0">
                {item.product.images?.[0] && (
                  <Image
                    src={item.product.images[0]}
                    alt={item.product.name}
                    width={96}
                    height={128}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>

              <div className="flex-1 min-w-0">
                  <Link
                    href={`/product/${item.product.slug}`}
                    className="text-sm font-medium text-charcoal hover:text-gold transition-colors line-clamp-2"
                  >
                    {item.product.name}
                  </Link>
                  <p className="text-xs text-charcoal-muted mt-1">
                    {item.color} / {item.size}
                  </p>
                  <p className="text-sm font-semibold text-charcoal mt-1">
                    {formatPrice(item.product.price)}
                  </p>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border border-ivory-dark">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1.5 hover:bg-charcoal/5 transition-colors"
                      >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="px-4 text-sm font-medium min-w-[2rem] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-1.5 hover:bg-charcoal/5 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      removeItem(item.id);
                      handleSaveCart();
                      toast.success("Item removed");
                    }}
                    className="p-2 text-charcoal-muted hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <p className="font-semibold">
                  {formatPrice(item.product.price * item.quantity)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="bg-ivory border border-ivory-dark p-6 space-y-4">
            <div>
              <span className="text-xs uppercase tracking-[0.3em] text-gold-dark font-medium">Summary</span>
              <h2 className="font-serif font-bold text-xl text-charcoal mt-1">Order Summary</h2>
              <div className="w-8 h-[1px] bg-gold/40 mt-2" />
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-charcoal-muted">Subtotal</span>
                <span className="text-charcoal">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal-muted">Shipping</span>
                <span>
                  {shipping === 0 ? (
                    <span className="text-green-600 font-medium">Free</span>
                  ) : (
                    <span className="text-charcoal">{formatPrice(shipping)}</span>
                  )}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              {subtotal < SHIPPING_THRESHOLD && subtotal > 0 && (
                <p className="text-xs text-charcoal-muted">
                  Add {formatPrice(SHIPPING_THRESHOLD - subtotal)} more for free shipping
                </p>
              )}
              <div className="border-t border-ivory-dark pt-3 flex justify-between font-semibold text-base text-charcoal">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <div className="border-t border-ivory-dark pt-4">
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-green-50 text-green-700 px-3 py-2 text-sm">
                  <span className="font-medium">{appliedCoupon.code}</span>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-green-600 hover:text-green-800"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal-muted" />
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Coupon code"
                        className="w-full pl-9 pr-3 py-2 border border-ivory-dark bg-ivory text-sm focus:outline-none focus:border-gold text-charcoal placeholder:text-charcoal-muted/50"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleApplyCoupon}
                      isLoading={couponLoading}
                      disabled={!couponCode.trim()}
                    >
                      Apply
                    </Button>
                  </div>
                  {couponError && (
                    <p className="text-xs text-rose-500">{couponError}</p>
                  )}
                </div>
              )}
            </div>

            <Link href={appliedCoupon ? `/checkout?coupon=${encodeURIComponent(appliedCoupon.code)}` : "/checkout"}>
              <Button fullWidth size="lg">
                Proceed to Checkout
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
