"use client";

import Link from "next/link";
import { X, Plus, Minus, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useCartStore } from "@/lib/store/cart";
import { useUIStore } from "@/lib/store/ui";
import { formatPrice } from "@/lib/utils/format";
import { Button } from "@/components/ui/Button";

export function CartDrawer() {
  const { items, removeItem, updateQuantity, getSubtotal, getItemCount } = useCartStore();
  const { isCartOpen, closeCart } = useUIStore();

  return (
    <>
      {isCartOpen && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/50" onClick={closeCart} />
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Shopping Bag ({getItemCount()})</h2>
              <button onClick={closeCart} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="h-5 w-5" />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500 gap-4 p-8">
                <ShoppingBag className="h-16 w-16 text-gray-300" />
                <p className="text-lg">Your bag is empty</p>
                <Button variant="outline" onClick={closeCart}>
                  Continue Shopping
                </Button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-auto p-4 space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-4 bg-gray-50 rounded-xl p-3">
                      <div className="w-20 h-24 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                        {item.product.images?.[0] && (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/product/${item.product.slug}`}
                          onClick={closeCart}
                          className="text-sm font-medium text-gray-900 hover:underline line-clamp-2"
                        >
                          {item.product.name}
                        </Link>
                        <p className="text-xs text-gray-500 mt-1">
                          {item.color} / {item.size}
                        </p>
                        <p className="text-sm font-semibold mt-1">
                          {formatPrice(item.product.price)}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center border rounded-lg">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="p-1 hover:bg-gray-200"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="px-3 text-sm font-medium">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="p-1 hover:bg-gray-200"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-xs text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t p-4 space-y-4">
                  <div className="flex justify-between text-base font-semibold">
                    <span>Subtotal</span>
                    <span>{formatPrice(getSubtotal())}</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Shipping & taxes calculated at checkout
                  </p>
                  <Link href="/checkout" onClick={closeCart}>
                    <Button fullWidth size="lg">
                      Checkout
                    </Button>
                  </Link>
                  <button
                    onClick={closeCart}
                    className="w-full text-center text-sm text-gray-600 hover:text-black underline underline-offset-4"
                  >
                    Continue Shopping
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
