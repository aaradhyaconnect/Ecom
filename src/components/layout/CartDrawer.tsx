"use client";

import Link from "next/link";
import { X, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
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
          <div className="fixed inset-0 bg-charcoal/40 backdrop-blur-[2px]" onClick={closeCart} />
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-ivory shadow-2xl flex flex-col animate-in slide-in-from-right">
            <div className="flex items-center justify-between p-6 border-b border-ivory-dark">
              <div className="flex items-center gap-3">
                <ShoppingBag className="h-4 w-4 text-charcoal-muted" />
                <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-charcoal">
                  Shopping Bag ({getItemCount()})
                </h2>
              </div>
              <button onClick={closeCart} className="p-2 hover:bg-ivory-dark rounded-full transition-colors">
                <X className="h-4 w-4 text-charcoal-muted" />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-charcoal-muted gap-5 p-8">
                <div className="w-20 h-20 rounded-full bg-ivory-dark flex items-center justify-center">
                  <ShoppingBag className="h-8 w-8 text-charcoal-muted/40" />
                </div>
                <p className="text-lg font-medium text-charcoal">Your bag is empty</p>
                <p className="text-sm text-charcoal-muted">Discover something you love</p>
                <Button variant="outline" onClick={closeCart} className="mt-2 border-charcoal/20 text-charcoal hover:bg-charcoal hover:text-ivory text-xs uppercase tracking-[0.15em]">
                  Continue Shopping
                </Button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-auto p-4 space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-4 bg-white p-3 border border-ivory-dark/50">
                      <div className="w-20 h-24 overflow-hidden bg-ivory-dark flex-shrink-0">
                        {item.product.images?.[0] && (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col">
                        <Link
                          href={`/product/${item.product.slug}`}
                          onClick={closeCart}
                          className="text-sm font-medium text-charcoal hover:text-gold-dark transition-colors line-clamp-2"
                        >
                          {item.product.name}
                        </Link>
                        <p className="text-[10px] text-charcoal-muted mt-1 uppercase tracking-wider">
                          {item.color} / {item.size}
                        </p>
                        <p className="text-sm font-bold mt-auto">
                          {formatPrice(item.product.price)}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center border border-ivory-dark">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="p-1.5 hover:bg-ivory-dark transition-colors"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="px-3 text-xs font-medium">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="p-1.5 hover:bg-ivory-dark transition-colors"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-[10px] text-charcoal-muted hover:text-rose-500 uppercase tracking-wider transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-ivory-dark p-6 space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-charcoal-muted uppercase tracking-wider text-[11px]">Subtotal</span>
                    <span className="font-bold text-charcoal">{formatPrice(getSubtotal())}</span>
                  </div>
                  <p className="text-[10px] text-charcoal-muted">
                    Shipping & taxes calculated at checkout
                  </p>
                  <Link href="/checkout" onClick={closeCart}>
                    <Button fullWidth size="lg" className="bg-charcoal text-ivory hover:bg-charcoal-light text-xs uppercase tracking-[0.15em] font-semibold">
                      Checkout <ArrowRight className="h-3.5 w-3.5 ml-2" />
                    </Button>
                  </Link>
                  <button
                    onClick={closeCart}
                    className="w-full text-center text-[11px] text-charcoal-muted hover:text-charcoal uppercase tracking-[0.15em] transition-colors"
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
