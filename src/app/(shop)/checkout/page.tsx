"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCartStore } from "@/lib/store/cart";
import { useAuthStore } from "@/lib/store/auth";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice } from "@/lib/utils/format";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import type { Address } from "@/types";

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string | undefined;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name: string; email: string | undefined; contact: string };
  theme: { color: string };
  handler: (response: RazorpayResponse) => void;
  modal: { ondismiss: () => void };
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
}

interface FormErrors {
  [key: string]: string;
}

const SHIPPING_THRESHOLD = 999;
const SHIPPING_CHARGE = 49;

const initialAddress: Address = {
  full_name: "",
  phone: "",
  street: "",
  city: "",
  state: "",
  pincode: "",
};

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { items, getSubtotal, clearCart } = useCartStore();
  const { user } = useAuthStore();
  useAuth();

  const [address, setAddress] = useState<Address>(initialAddress);
  const [errors, setErrors] = useState<FormErrors>({});
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "razorpay">("cod");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
    discount_type: "percentage" | "flat";
    max_discount?: number;
  } | null>(null);
  const [couponError, setCouponError] = useState("");

  const subtotal = getSubtotal();
  const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_CHARGE;
  const couponCode = searchParams.get("coupon")?.trim().toUpperCase();

  const discount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discount_type === "flat") return appliedCoupon.discount;
    const calculated = (subtotal * appliedCoupon.discount) / 100;
    return appliedCoupon.max_discount
      ? Math.min(calculated, appliedCoupon.max_discount)
      : calculated;
  }, [appliedCoupon, subtotal]);

  const total = Math.max(0, subtotal + shipping - discount);

  useEffect(() => {
    if (!couponCode) return;
    fetch(`/api/coupons/${couponCode}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          if (subtotal < data.data.min_order) {
            setCouponError(`Minimum order value is ${formatPrice(data.data.min_order)}`);
            return;
          }
          setAppliedCoupon(data.data);
        }
      })
      .catch(() => {});
  }, [couponCode, subtotal]);

  const updateAddress = (field: keyof Address, value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const errs: FormErrors = {};

    if (!address.full_name.trim()) errs.full_name = "Full name is required";
    if (!address.phone.trim()) errs.phone = "Phone is required";
    else if (!/^[6-9]\d{9}$/.test(address.phone))
      errs.phone = "Enter a valid 10-digit phone number";

    if (!address.street.trim()) errs.street = "Street address is required";
    if (!address.city.trim()) errs.city = "City is required";
    if (!address.state.trim()) errs.state = "State is required";

    if (!address.pincode.trim()) errs.pincode = "Pincode is required";
    else if (!/^\d{6}$/.test(address.pincode))
      errs.pincode = "Enter a valid 6-digit pincode";

    if (items.length === 0) {
      errs._form = "Your cart is empty";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePlaceOrder = async () => {
    if (!validate()) return;

    if (!user) {
      toast.error("Please log in to place an order");
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    setIsPlacingOrder(true);

    try {
      const payload = {
        items: items.map((item) => ({
          product_id: item.product_id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          image: item.product.images?.[0] || "",
        })),
        shipping_address: address,
        payment_method: paymentMethod,
        coupon_code: couponCode,
      };

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!data.success) {
        toast.error(data.error || "Failed to place order");
        setIsPlacingOrder(false);
        return;
      }

      if (paymentMethod === "cod") {
        toast.success("Order placed successfully!");
        clearCart();
        router.push(`/orders/${data.data.id}`);
        return;
      }

      if (paymentMethod === "razorpay") {
        const loaded = await loadRazorpayScript();
        if (!loaded) {
          toast.error("Failed to load payment gateway");
          setIsPlacingOrder(false);
          return;
        }

        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: data.data.razorpay_order.amount,
          currency: "INR",
          name: "HAINJU",
          description: `Order ${data.data.order_id}`,
          order_id: data.data.razorpay_order.id,
          prefill: {
            name: address.full_name,
            email: user.email,
            contact: address.phone,
          },
          theme: { color: "#000000" },
          handler: async function (response: RazorpayResponse) {
            try {
              const verifyRes = await fetch("/api/payment/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  order_id: data.data.id,
                }),
              });

              const verifyData = await verifyRes.json();

              if (verifyData.success) {
                toast.success("Payment successful! Order placed.");
                clearCart();
                router.push(`/orders/${data.data.id}`);
              } else {
                toast.error("Payment verification failed");
              }
            } catch {
              toast.error("Payment verification failed");
            }
          },
          modal: {
            ondismiss: () => {
              setIsPlacingOrder(false);
              toast.error("Payment cancelled");
            },
          },
        };

        const razorpay = new (window.Razorpay!)(options);
        razorpay.open();
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <p className="text-charcoal-muted mb-4">Your cart is empty</p>
        <Link href="/products/new-arrivals">
          <Button variant="outline">Continue Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <span className="text-xs uppercase tracking-[0.3em] text-gold-dark font-medium">Checkout</span>
        <h1 className="text-2xl lg:text-3xl font-serif font-bold text-charcoal mt-1">Complete Your Order</h1>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-8">
          <div className="bg-ivory border border-ivory-dark p-6">
            <div className="mb-4">
              <span className="text-xs uppercase tracking-[0.3em] text-gold-dark font-medium">Details</span>
              <h2 className="font-serif font-bold text-lg text-charcoal mt-1">Shipping Address</h2>
              <div className="w-6 h-[1px] bg-gold/40 mt-1.5" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input
                  label="Full Name"
                  placeholder="John Doe"
                  value={address.full_name}
                  onChange={(e) => updateAddress("full_name", e.target.value)}
                  error={errors.full_name}
                />
              </div>
              <Input
                label="Phone"
                placeholder="9876543210"
                value={address.phone}
                onChange={(e) => updateAddress("phone", e.target.value)}
                error={errors.phone}
                maxLength={10}
              />
              <div className="sm:col-span-2">
                <Input
                  label="Street Address"
                  placeholder="123 Main Street, Apartment 4B"
                  value={address.street}
                  onChange={(e) => updateAddress("street", e.target.value)}
                  error={errors.street}
                />
              </div>
              <Input
                label="City"
                placeholder="Mumbai"
                value={address.city}
                onChange={(e) => updateAddress("city", e.target.value)}
                error={errors.city}
              />
              <Input
                label="State"
                placeholder="Maharashtra"
                value={address.state}
                onChange={(e) => updateAddress("state", e.target.value)}
                error={errors.state}
              />
              <Input
                label="Pincode"
                placeholder="400001"
                value={address.pincode}
                onChange={(e) => updateAddress("pincode", e.target.value)}
                error={errors.pincode}
                maxLength={6}
              />
            </div>
          </div>

          <div className="bg-ivory border border-ivory-dark p-6">
            <div className="mb-4">
              <span className="text-xs uppercase tracking-[0.3em] text-gold-dark font-medium">Payment</span>
              <h2 className="font-serif font-bold text-lg text-charcoal mt-1">Payment Method</h2>
              <div className="w-6 h-[1px] bg-gold/40 mt-1.5" />
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-4 border border-ivory-dark cursor-pointer hover:border-gold transition-colors has-[:checked]:border-gold has-[:checked]:bg-gold/5">
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={paymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
                  className="accent-gold text-gold"
                />
                <div>
                  <p className="font-medium text-sm text-charcoal">Cash on Delivery</p>
                  <p className="text-xs text-charcoal-muted">Pay when you receive</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-4 border border-ivory-dark cursor-pointer hover:border-gold transition-colors has-[:checked]:border-gold has-[:checked]:bg-gold/5">
                <input
                  type="radio"
                  name="payment"
                  value="razorpay"
                  checked={paymentMethod === "razorpay"}
                  onChange={() => setPaymentMethod("razorpay")}
                  className="accent-gold text-gold"
                />
                <div>
                  <p className="font-medium text-sm text-charcoal">Razorpay</p>
                  <p className="text-xs text-charcoal-muted">Pay via UPI, Card, Net Banking</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-ivory border border-ivory-dark p-6 space-y-4 sticky top-24">
            <div>
              <span className="text-xs uppercase tracking-[0.3em] text-gold-dark font-medium">Summary</span>
              <h2 className="font-serif font-bold text-xl text-charcoal mt-1">Order Summary</h2>
              <div className="w-8 h-[1px] bg-gold/40 mt-2" />
            </div>

            <div className="space-y-3 max-h-64 overflow-auto">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 text-sm">
                  <div className="w-14 h-16 bg-charcoal/5 flex-shrink-0">
                    {item.product.images?.[0] && (
                      <Image
                        src={item.product.images[0]}
                        alt={item.product.name}
                        width={56}
                        height={64}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-charcoal truncate">{item.product.name}</p>
                    <p className="text-charcoal-muted text-xs">
                      {item.color} / {item.size} x {item.quantity}
                    </p>
                    <p className="font-semibold text-charcoal mt-0.5">
                      {formatPrice(item.product.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

              <div className="border-t border-ivory-dark pt-4 space-y-2 text-sm">
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
                  <span>Discount ({appliedCoupon?.code})</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              {couponCode && !appliedCoupon && !couponError && (
                <p className="text-xs text-charcoal-muted">Validating coupon...</p>
              )}
              {couponError && (
                <p className="text-xs text-rose-500">{couponError}</p>
              )}
              <div className="border-t border-ivory-dark pt-2 flex justify-between font-semibold text-base text-charcoal">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            {errors._form && (
              <p className="text-xs text-rose-500">{errors._form}</p>
            )}

            <Button
              fullWidth
              size="lg"
              onClick={handlePlaceOrder}
              isLoading={isPlacingOrder}
            >
              {paymentMethod === "cod"
                ? "Place Order"
                : `Pay ${formatPrice(total)}`}
            </Button>

            <p className="text-xs text-charcoal-muted text-center">
              By placing this order, you agree to our{" "}
              <Link href="/terms" className="underline hover:text-charcoal">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="underline hover:text-charcoal">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
