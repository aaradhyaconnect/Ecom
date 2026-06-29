"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store/cart";
import { useAuthStore } from "@/lib/store/auth";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice, generateOrderId } from "@/lib/utils/format";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
import toast from "react-hot-toast";
import type { Address } from "@/types";

interface FormErrors {
  [key: string]: string;
}

const SHIPPING_THRESHOLD = 499;
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
  const { items, getSubtotal, clearCart } = useCartStore();
  const { user } = useAuthStore();
  useAuth();

  const [address, setAddress] = useState<Address>(initialAddress);
  const [errors, setErrors] = useState<FormErrors>({});
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "razorpay">("cod");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const subtotal = getSubtotal();
  const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_CHARGE;
  const total = subtotal + shipping;

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
      if ((window as any).Razorpay) {
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
      router.push("/login");
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
        subtotal,
        shipping_charge: shipping,
        total,
        coupon_code: undefined as string | undefined,
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
          handler: async function (response: any) {
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

        const razorpay = new (window as any).Razorpay(options);
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
        <p className="text-lg text-gray-500 mb-4">Your cart is empty</p>
        <Link href="/products/new-arrivals">
          <Button variant="outline">Continue Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl lg:text-3xl font-semibold mb-8">Checkout</h1>

      <div className="grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-8">
          <div className="bg-white border rounded-xl p-6">
            <h2 className="font-semibold text-lg mb-4">Shipping Address</h2>
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

          <div className="bg-white border rounded-xl p-6">
            <h2 className="font-semibold text-lg mb-4">Payment Method</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:border-black transition-colors has-[:checked]:border-black has-[:checked]:bg-gray-50">
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={paymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
                  className="accent-black"
                />
                <div>
                  <p className="font-medium text-sm">Cash on Delivery</p>
                  <p className="text-xs text-gray-500">Pay when you receive</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:border-black transition-colors has-[:checked]:border-black has-[:checked]:bg-gray-50">
                <input
                  type="radio"
                  name="payment"
                  value="razorpay"
                  checked={paymentMethod === "razorpay"}
                  onChange={() => setPaymentMethod("razorpay")}
                  className="accent-black"
                />
                <div>
                  <p className="font-medium text-sm">Razorpay</p>
                  <p className="text-xs text-gray-500">Pay via UPI, Card, Net Banking</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white border rounded-xl p-6 space-y-4 sticky top-24">
            <h2 className="font-semibold text-lg">Order Summary</h2>

            <div className="space-y-3 max-h-64 overflow-auto">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 text-sm">
                  <div className="w-14 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {item.product.images?.[0] && (
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.product.name}</p>
                    <p className="text-gray-500 text-xs">
                      {item.color} / {item.size} x {item.quantity}
                    </p>
                    <p className="font-semibold mt-0.5">
                      {formatPrice(item.product.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span>
                  {shipping === 0 ? (
                    <span className="text-green-600">Free</span>
                  ) : (
                    formatPrice(shipping)
                  )}
                </span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold text-base">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            {errors._form && (
              <p className="text-xs text-red-500">{errors._form}</p>
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

            <p className="text-xs text-gray-500 text-center">
              By placing this order, you agree to our{" "}
              <Link href="/terms" className="underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
