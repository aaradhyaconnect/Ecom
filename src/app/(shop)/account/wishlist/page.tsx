"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingBag, Trash2, ArrowLeft } from "lucide-react";
import { useWishlistStore } from "@/lib/store/wishlist";
import { useCartStore } from "@/lib/store/cart";
import { useAuthStore } from "@/lib/store/auth";
import { useHydrated } from "@/hooks/useHydrated";
import { formatPrice } from "@/lib/utils/format";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import toast from "react-hot-toast";
import type { Product } from "@/types";

export default function WishlistPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();
  const mounted = useHydrated();
  const { items, removeItem } = useWishlistStore();
  const { addItem, items: cartItems } = useCartStore();

  useEffect(() => {
    if (!mounted) return;
    if (!user) {
      window.location.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [user, mounted, pathname, router]);

  const handleAddToCart = (product: Product) => {
    const size = product.sizes[0] || "M";
    let colors: { name: string }[] = [];
    if (Array.isArray(product.colors)) colors = product.colors;
    else if (typeof product.colors === "string") {
      try { colors = JSON.parse(product.colors); } catch { /* empty */ }
    }
    const color = colors[0]?.name || "Default";
    addItem(product, 1, size, color);
    toast.success(`${product.name} added to cart`);
  };

  const isProductInCart = (productId: string) => {
    return cartItems.some((item) => item.product_id === productId);
  };

  if (!mounted || !user) return null;

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <Heart className="h-20 w-20 text-charcoal/10 mb-6" />
        <h1 className="text-2xl font-serif font-bold text-charcoal mb-2">
          Your wishlist is empty
        </h1>
        <p className="text-charcoal-muted mb-8">
          Save your favorite items here
        </p>
        <Link href="/products/new-arrivals">
          <Button variant="outline" size="lg">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Explore Products
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <span className="text-xs uppercase tracking-[0.3em] text-gold-dark font-medium">Wishlist</span>
          <h1 className="text-2xl lg:text-3xl font-serif font-bold text-charcoal mt-1">
            My Wishlist ({items.length})
          </h1>
        </div>
        <Link
          href="/products/new-arrivals"
          className="text-xs uppercase tracking-[0.2em] text-charcoal-muted hover:text-charcoal transition-colors"
        >
          Continue Shopping
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {items.map((product) => {
          const discount = product.compare_price
            ? Math.round(
                ((product.compare_price - product.price) /
                  product.compare_price) *
                  100
              )
            : 0;
          const inCart = isProductInCart(product.id);

          return (
            <div key={product.id} className="group relative">
              <Link href={`/product/${product.slug}`} className="block">
                <div className="relative aspect-[3/4] bg-charcoal/5 mb-3">
                  {product.images?.[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <Image
                      src="/placeholder.svg"
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover"
                    />
                  )}

                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {product.is_new && <Badge variant="new">New</Badge>}
                    {product.is_sale && discount > 0 && (
                      <Badge variant="sale">-{discount}%</Badge>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      removeItem(product.id);
                      toast.success("Removed from wishlist");
                    }}
                    className="absolute top-2 right-2 p-2 bg-ivory/80 backdrop-blur-sm hover:scale-110 transition-all"
                  >
                    <Trash2 className="h-4 w-4 text-rose-500" />
                  </button>
                </div>
              </Link>

              <Link href={`/product/${product.slug}`} className="block">
                <h3 className="text-sm font-medium text-charcoal truncate group-hover:text-gold transition-colors">
                  {product.name}
                </h3>
                <p className="text-xs text-charcoal-muted mt-0.5 capitalize">
                  {product.category.replace("-", " ")}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-semibold text-charcoal">
                    {formatPrice(product.price)}
                  </span>
                  {product.compare_price && (
                    <span className="text-xs text-charcoal-muted/60 line-through">
                      {formatPrice(product.compare_price)}
                    </span>
                  )}
                </div>
              </Link>

              <Button
                variant={inCart ? "secondary" : "primary"}
                size="sm"
                fullWidth
                className="mt-3"
                onClick={() => handleAddToCart(product)}
                disabled={inCart}
              >
                <ShoppingBag className="h-3.5 w-3.5 mr-1.5" />
                {inCart ? "In Cart" : "Add to Cart"}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
