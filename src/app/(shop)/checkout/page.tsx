"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { useCartStore } from "@/lib/store/cart";
import { useAuthStore } from "@/lib/store/auth";
import { useAuth } from "@/hooks/useAuth";
import { useHydrated } from "@/hooks/useHydrated";
import { formatPrice } from "@/lib/utils/format";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import { fireConfetti } from "@/lib/utils/confetti";
import { cn } from "@/lib/utils/cn";
import { Check, ChevronRight, Truck, CreditCard, MapPin, ClipboardCheck, ArrowLeft } from "lucide-react";
import type { Address } from "@/types";

declare global {
  interface Window {
    Cashfree?: (options: { mode: string }) => {
      checkout: (options: {
        paymentSessionId: string;
        redirectTarget: string;
      }) => Promise<void>;
    };
  }
}

interface FormErrors {
  [key: string]: string;
}

import { SHIPPING } from "@/lib/constants/site";

const { THRESHOLD: SHIPPING_THRESHOLD, CHARGE: SHIPPING_CHARGE } = SHIPPING;

const STEPS = [
  { id: 1, label: "Address", icon: MapPin },
  { id: 2, label: "Delivery", icon: Truck },
  { id: 3, label: "Payment", icon: CreditCard },
  { id: 4, label: "Review", icon: ClipboardCheck },
] as const;

type Step = (typeof STEPS)[number]["id"];

const initialAddress: Address = {
  full_name: "",
  phone: "",
  street: "",
  city: "",
  state: "",
  pincode: "",
};

function CheckoutContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { items, getSubtotal, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const mounted = useHydrated();
  const authLoading = useAuthStore((s) => s.loading);
  useAuth();

  const [step, setStep] = useState<Step>(1);
  const [address, setAddress] = useState<Address>(initialAddress);
  const [errors, setErrors] = useState<FormErrors>({});
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "cashfree" | "upi">("cod");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
    discount_type: "percentage" | "flat";
    max_discount?: number;
  } | null>(null);
  const [couponInput, setCouponInput] = useState(searchParams.get("coupon")?.trim().toUpperCase() || "");
  const [couponError, setCouponError] = useState("");
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);

  const isBuyNow = searchParams.get("buyNow") === "true";
  const checkoutItems = isBuyNow && items.length > 0 ? [items[items.length - 1]] : items;

  const subtotal = isBuyNow
    ? checkoutItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0)
    : getSubtotal();

  const prebookDepositTotal = checkoutItems.reduce((acc, item) => {
    if (item.product.is_prebook) {
      return acc + (item.product.prebook_amount || item.product.price) * item.quantity;
    }
    return acc;
  }, 0);
  const hasPrebookItems = checkoutItems.some((item) => item.product.is_prebook);
  const regularItemsTotal = checkoutItems
    .filter((item) => !item.product.is_prebook)
    .reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const payNowSubtotal = prebookDepositTotal + regularItemsTotal;
  const totalBalanceDue = hasPrebookItems
    ? checkoutItems.reduce((acc, item) => {
        if (item.product.is_prebook) {
          const deposit = item.product.prebook_amount || item.product.price;
          return acc + Math.max(0, item.product.price - deposit) * item.quantity;
        }
        return acc;
      }, 0)
    : 0;

  const shipping = payNowSubtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_CHARGE;
  const couponCode = searchParams.get("coupon")?.trim().toUpperCase();

  const discount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discount_type === "flat") return appliedCoupon.discount;
    const calculated = (payNowSubtotal * appliedCoupon.discount) / 100;
    return appliedCoupon.max_discount
      ? Math.min(calculated, appliedCoupon.max_discount)
      : calculated;
  }, [appliedCoupon, payNowSubtotal]);

  const total = Math.max(0, payNowSubtotal + shipping - discount);

  useEffect(() => {
    if (!couponCode) return;
    fetch(`/api/coupons/${couponCode}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          if (payNowSubtotal < data.data.min_order) {
            setCouponError(`Minimum order value is ${formatPrice(data.data.min_order)}`);
            return;
          }
          setCouponError("");
          setAppliedCoupon(data.data);
        } else {
          setCouponError(data.error || "Invalid coupon");
        }
      })
      .catch(() => {
        setCouponError("Failed to validate coupon");
      });
  }, [couponCode, payNowSubtotal]);

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

  const validateAddress = (): boolean => {
    const errs: FormErrors = {};
    if (!address.full_name.trim()) errs.full_name = "Full name is required";
    if (!address.phone.trim()) errs.phone = "Phone is required";
    else if (!/^[6-9]\d{9}$/.test(address.phone)) errs.phone = "Enter a valid 10-digit phone number";
    if (!address.street.trim()) errs.street = "Street address is required";
    if (!address.city.trim()) errs.city = "City is required";
    if (!address.state.trim()) errs.state = "State is required";
    if (!address.pincode.trim()) errs.pincode = "Pincode is required";
    else if (!/^\d{6}$/.test(address.pincode)) errs.pincode = "Enter a valid 6-digit pincode";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponError("");
    try {
      const res = await fetch(`/api/coupons/${couponInput.trim().toUpperCase()}`);
      const data = await res.json();
      if (data.success) {
        if (payNowSubtotal < data.data.min_order) {
          setCouponError(`Minimum order value is ${formatPrice(data.data.min_order)}`);
          return;
        }
        setAppliedCoupon(data.data);
        toast.success("Coupon applied!");
      } else {
        setCouponError(data.error || "Invalid coupon");
      }
    } catch {
      setCouponError("Failed to validate coupon");
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError("");
  };

  const loadCashfreeScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Cashfree) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://sdk.cashfree.com/js/ui/2.0.0/cashfree.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error("Please log in to place an order");
      window.location.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (checkoutItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setIsPlacingOrder(true);

    try {
      const payload = {
        items: checkoutItems.map((item) => ({
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
        coupon_code: appliedCoupon?.code,
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
        fireConfetti();
        if (isBuyNow) {
          const { removeItem } = useCartStore.getState();
          checkoutItems.forEach((item) => removeItem(item.id));
        } else {
          clearCart();
        }
        setPlacedOrderId(data.data.id);
        setOrderPlaced(true);
        setIsPlacingOrder(false);
        return;
      }

      if (paymentMethod === "cashfree" || paymentMethod === "upi") {
        const loaded = await loadCashfreeScript();
        if (!loaded) {
          toast.error("Failed to load payment gateway");
          setIsPlacingOrder(false);
          return;
        }

        const paymentSessionId = data.data.cashfree_order?.payment_session_id;
        if (!paymentSessionId) {
          toast.error("Payment session not created");
          setIsPlacingOrder(false);
          return;
        }

        const mode = process.env.NEXT_PUBLIC_CASHFREE_MODE === "production" ? "production" : "sandbox";
        const cashfree = window.Cashfree?.({ mode });
        if (!cashfree) {
          toast.error("Payment gateway not loaded. Please refresh and try again.");
          setIsPlacingOrder(false);
          return;
        }
        await cashfree.checkout({ paymentSessionId, redirectTarget: "_self" });
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
      setIsPlacingOrder(false);
    }
  };

  const goNext = () => {
    if (step === 1 && !validateAddress()) return;
    if (step < 4) setStep((step + 1) as Step);
  };

  const goBack = () => {
    if (step > 1) setStep((step - 1) as Step);
  };

  if (!mounted || authLoading || !user) return null;

  if (checkoutItems.length === 0 && !orderPlaced) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <p className="text-charcoal-muted mb-4">Your cart is empty</p>
        <Link href="/products/new-arrivals">
          <Button variant="outline">Continue Shopping</Button>
        </Link>
      </div>
    );
  }

  if (orderPlaced && placedOrderId) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-serif font-bold text-charcoal mb-2">Order Placed!</h1>
        <p className="text-charcoal-muted mb-1">Thank you for your order.</p>
        <p className="text-sm text-charcoal-muted mb-6">
          Order ID: <span className="font-mono font-medium text-charcoal">#{placedOrderId.slice(0, 8)}</span>
        </p>
        <div className="flex gap-3">
          <Link href={`/account/orders/${placedOrderId}`}>
            <Button>View Order</Button>
          </Link>
          <Link href="/products/all">
            <Button variant="outline">Continue Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Step Indicator */}
      <div className="mb-8">
        <span className="text-xs uppercase tracking-[0.3em] text-gold-dark font-medium">Checkout</span>
        <h1 className="text-2xl lg:text-3xl font-serif font-bold text-charcoal mt-1">
          {isBuyNow ? "Buy Now" : "Complete Your Order"}
        </h1>

        <div className="flex items-center gap-2 mt-6">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isCompleted = step > s.id;
            return (
              <div key={s.id} className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (isCompleted) setStep(s.id);
                  }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-xs font-medium transition-all",
                    isActive && "bg-charcoal text-ivory",
                    isCompleted && "bg-charcoal/10 text-charcoal cursor-pointer hover:bg-charcoal/20",
                    !isActive && !isCompleted && "bg-ivory-dark/50 text-charcoal-muted"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Icon className="h-3.5 w-3.5" />
                  )}
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <ChevronRight className="h-3 w-3 text-charcoal-muted/40" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3">
          {/* Step 1: Address */}
          {step === 1 && (
            <div className="bg-ivory border border-ivory-dark p-6 animate-in fade-in">
              <div className="mb-4">
                <span className="text-xs uppercase tracking-[0.3em] text-gold-dark font-medium">Step 1</span>
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
              <div className="mt-6 flex justify-end">
                <Button onClick={goNext}>Continue to Delivery</Button>
              </div>
            </div>
          )}

          {/* Step 2: Delivery */}
          {step === 2 && (
            <div className="bg-ivory border border-ivory-dark p-6 animate-in fade-in">
              <div className="mb-4">
                <span className="text-xs uppercase tracking-[0.3em] text-gold-dark font-medium">Step 2</span>
                <h2 className="font-serif font-bold text-lg text-charcoal mt-1">Delivery Method</h2>
                <div className="w-6 h-[1px] bg-gold/40 mt-1.5" />
              </div>
              <div className="space-y-3">
                <div className="p-4 border-2 border-charcoal bg-charcoal/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Truck className="h-5 w-5 text-charcoal" />
                      <div>
                        <p className="font-medium text-sm text-charcoal">Standard Delivery</p>
                        <p className="text-xs text-charcoal-muted">
                          {payNowSubtotal >= SHIPPING_THRESHOLD
                            ? "Free — your order qualifies!"
                            : `${formatPrice(SHIPPING_CHARGE)} delivery charge`}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-charcoal">3–7 business days</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-4 bg-ivory-dark/30 border border-ivory-dark">
                <p className="text-xs text-charcoal-muted">
                  <span className="font-medium text-charcoal">Shipping to:</span>{" "}
                  {address.full_name}, {address.street}, {address.city}, {address.state} — {address.pincode}
                </p>
              </div>
              <div className="mt-6 flex justify-between">
                <Button variant="outline" onClick={goBack}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <Button onClick={goNext}>Continue to Payment</Button>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === 3 && (
            <div className="bg-ivory border border-ivory-dark p-6 animate-in fade-in">
              <div className="mb-4">
                <span className="text-xs uppercase tracking-[0.3em] text-gold-dark font-medium">Step 3</span>
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
                    value="upi"
                    checked={paymentMethod === "upi"}
                    onChange={() => setPaymentMethod("upi")}
                    className="accent-gold text-gold"
                  />
                  <div>
                    <p className="font-medium text-sm text-charcoal">UPI Payment</p>
                    <p className="text-xs text-charcoal-muted">Google Pay, PhonePe, Paytm, BHIM</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-4 border border-ivory-dark cursor-pointer hover:border-gold transition-colors has-[:checked]:border-gold has-[:checked]:bg-gold/5">
                  <input
                    type="radio"
                    name="payment"
                    value="cashfree"
                    checked={paymentMethod === "cashfree"}
                    onChange={() => setPaymentMethod("cashfree")}
                    className="accent-gold text-gold"
                  />
                  <div>
                    <p className="font-medium text-sm text-charcoal">Card / Net Banking / Wallets</p>
                    <p className="text-xs text-charcoal-muted">Visa, Mastercard, RuPay, Net Banking</p>
                  </div>
                </label>
              </div>
              <div className="mt-6 flex justify-between">
                <Button variant="outline" onClick={goBack}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <Button onClick={goNext}>Review Order</Button>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="bg-ivory border border-ivory-dark p-6 animate-in fade-in">
              <div className="mb-4">
                <span className="text-xs uppercase tracking-[0.3em] text-gold-dark font-medium">Step 4</span>
                <h2 className="font-serif font-bold text-lg text-charcoal mt-1">Review Your Order</h2>
                <div className="w-6 h-[1px] bg-gold/40 mt-1.5" />
              </div>

              {/* Items */}
              <div className="space-y-3 mb-6">
                {checkoutItems.map((item) => (
                  <div key={item.id} className="flex gap-3 text-sm">
                    <div className="w-14 h-16 bg-charcoal/5 flex-shrink-0 overflow-hidden">
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
                        {[item.size, item.color].filter(Boolean).join(" / ")} × {item.quantity}
                      </p>
                      <p className="font-semibold text-charcoal mt-0.5">
                        {formatPrice(item.product.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Shipping Address */}
              <div className="border-t border-ivory-dark pt-4 mb-4">
                <p className="text-xs font-bold uppercase tracking-wider text-charcoal-muted mb-2">Ship To</p>
                <p className="text-sm text-charcoal">{address.full_name}</p>
                <p className="text-sm text-charcoal-muted">{address.street}</p>
                <p className="text-sm text-charcoal-muted">{address.city}, {address.state} — {address.pincode}</p>
                <p className="text-sm text-charcoal-muted">Phone: {address.phone}</p>
              </div>

              {/* Payment */}
              <div className="border-t border-ivory-dark pt-4 mb-4">
                <p className="text-xs font-bold uppercase tracking-wider text-charcoal-muted mb-2">Payment</p>
                <p className="text-sm text-charcoal">
                  {paymentMethod === "cod" && "Cash on Delivery"}
                  {paymentMethod === "upi" && "UPI Payment"}
                  {paymentMethod === "cashfree" && "Card / Net Banking / Wallets"}
                </p>
              </div>

              {/* Coupon */}
              <div className="border-t border-ivory-dark pt-4 mb-4">
                <p className="text-xs font-bold uppercase tracking-wider text-charcoal-muted mb-2">Coupon</p>
                {appliedCoupon ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-green-600 font-medium">{appliedCoupon.code} applied</span>
                    <button onClick={handleRemoveCoupon} className="text-xs text-rose-500 hover:underline">
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter coupon code"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      className="flex-1 px-3 py-2 border border-ivory-dark bg-white text-sm text-charcoal placeholder:text-charcoal-muted/50 focus:outline-none focus:border-gold"
                    />
                    <Button variant="outline" size="sm" onClick={handleApplyCoupon}>
                      Apply
                    </Button>
                  </div>
                )}
                {couponError && <p className="text-xs text-rose-500 mt-1">{couponError}</p>}
              </div>

              <div className="mt-6 flex justify-between">
                <Button variant="outline" onClick={goBack}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <Button
                  onClick={handlePlaceOrder}
                  isLoading={isPlacingOrder}
                >
                  {paymentMethod === "cod" && hasPrebookItems
                    ? `Place Order — ${formatPrice(total)} deposit`
                    : paymentMethod === "cod"
                    ? "Place Order"
                    : `Pay ${formatPrice(total)}`}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-2">
          <div className="bg-ivory border border-ivory-dark p-6 space-y-4 sticky top-24">
            <div>
              <span className="text-xs uppercase tracking-[0.3em] text-gold-dark font-medium">Summary</span>
              <h2 className="font-serif font-bold text-xl text-charcoal mt-1">Order Summary</h2>
              <div className="w-8 h-[1px] bg-gold/40 mt-2" />
            </div>

            <div className="space-y-3 max-h-64 overflow-auto">
              {checkoutItems.map((item) => (
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
                      {[item.color, item.size].filter(Boolean).join(" / ")} × {item.quantity}
                    </p>
                    <p className="font-semibold text-charcoal mt-0.5">
                      {formatPrice(item.product.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-ivory-dark pt-4 space-y-2 text-sm">
              {hasPrebookItems && (
                <div className="flex justify-between text-charcoal-muted">
                  <span>Product Total</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-charcoal-muted">Subtotal{hasPrebookItems ? " (Pay Now)" : ""}</span>
                <span className="text-charcoal">{formatPrice(payNowSubtotal)}</span>
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
              <div className="border-t border-ivory-dark pt-2 flex justify-between font-semibold text-base text-charcoal">
                <span>Pay Now</span>
                <span>{formatPrice(total)}</span>
              </div>
              {totalBalanceDue > 0 && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg mt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-amber-700 font-medium">Balance Due on Delivery</span>
                    <span className="text-amber-700 font-semibold">{formatPrice(totalBalanceDue)}</span>
                  </div>
                </div>
              )}
            </div>

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

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-charcoal border-t-transparent" /></div>}>
      <CheckoutContent />
    </Suspense>
  );
}
