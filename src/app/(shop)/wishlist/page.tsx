"use client";

import Link from "next/link";
import { Heart, ShoppingBag, Trash2, ArrowLeft } from "lucide-react";
import { useWishlistStore } from "@/lib/store/wishlist";
import { useCartStore } from "@/lib/store/cart";
import { formatPrice } from "@/lib/utils/format";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import toast from "react-hot-toast";
import type { Product } from "@/types";

export default function WishlistPage() {
  const { items, removeItem } = useWishlistStore();
  const { addItem, isInCart, items: cartItems } = useCartStore();

  const handleAddToCart = (product: Product) => {
    const size = product.sizes[0] || "M";
    const color = product.colors[0]?.name || "Default";
    addItem(product, 1, size, color);
    toast.success(`${product.name} added to cart`);
  };

  const isProductInCart = (productId: string) => {
    return cartItems.some((item) => item.product_id === productId);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <Heart className="h-20 w-20 text-gray-300 mb-6" />
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Your wishlist is empty
        </h1>
        <p className="text-gray-500 mb-8">
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
        <h1 className="text-2xl lg:text-3xl font-semibold">
          My Wishlist ({items.length})
        </h1>
        <Link
          href="/products/new-arrivals"
          className="text-sm text-gray-600 hover:text-black underline underline-offset-4"
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
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 mb-3">
                  {product.images?.[0] && (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
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
                    className="absolute top-2 right-2 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:scale-110 transition-all"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              </Link>

              <Link href={`/product/${product.slug}`} className="block">
                <h3 className="text-sm font-medium text-gray-900 truncate group-hover:underline">
                  {product.name}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5 capitalize">
                  {product.category.replace("-", " ")}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-semibold">
                    {formatPrice(product.price)}
                  </span>
                  {product.compare_price && (
                    <span className="text-xs text-gray-400 line-through">
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
