"use client";

import { useState } from "react";
import Image from "next/image";
import { Heart, Share2, Minus, Plus, Truck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Rating } from "@/components/ui/Rating";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/format";
import { useCartStore } from "@/lib/store/cart";
import { useWishlistStore } from "@/lib/store/wishlist";
import toast from "react-hot-toast";
import type { Product } from "@/types";

interface ProductDetailClientProps {
  product: Product;
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || "");
  const [selectedColor, setSelectedColor] = useState(product.colors[0]?.name || "");
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  const addItem = useCartStore((s) => s.addItem);
  const { isInWishlist, toggleItem } = useWishlistStore();
  const inWishlist = isInWishlist(product.id);

  const discount = product.compare_price
    ? Math.round(
        ((product.compare_price - product.price) / product.compare_price) * 100
      )
    : 0;
  const inStock = product.stock > 0;
  const lowStock = product.stock > 0 && product.stock <= 5;

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.error("Please select a size");
      return;
    }
    if (!selectedColor) {
      toast.error("Please select a color");
      return;
    }
    addItem(product, quantity, selectedSize, selectedColor);
    toast.success("Added to cart!");
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: product.name, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        <div className="space-y-4">
          <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-gray-100 group">
            {product.images?.[selectedImage] && (
              <Image
                src={product.images[selectedImage]}
                alt={product.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                preload
              />
            )}
            <div className="absolute top-3 left-3 flex flex-col gap-1">
              {product.is_new && <Badge variant="new">New</Badge>}
              {product.is_sale && discount > 0 && (
                <Badge variant="sale">-{discount}%</Badge>
              )}
              {product.is_best_seller && !product.is_sale && (
                <Badge variant="best">Best Seller</Badge>
              )}
            </div>
          </div>

          {product.images && product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={cn(
                    "relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors",
                    idx === selectedImage
                      ? "border-black"
                      : "border-transparent hover:border-gray-300"
                  )}
                >
                  <Image
                    src={img}
                    alt={`${product.name} ${idx + 1}`}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div>
            <p className="text-sm text-gray-500 capitalize mb-1">
              {product.category.replace("-", " ")}
              {product.subcategory && ` / ${product.subcategory}`}
            </p>
            <h1 className="text-2xl lg:text-3xl font-semibold">
              {product.name}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <Rating
                rating={product.rating}
                reviewCount={product.review_count}
                size="md"
                showCount
              />
            </div>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-bold">
              {formatPrice(product.price)}
            </span>
            {product.compare_price && (
              <>
                <span className="text-lg text-gray-400 line-through">
                  {formatPrice(product.compare_price)}
                </span>
                <Badge variant="sale">-{discount}%</Badge>
              </>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "w-2 h-2 rounded-full",
                  inStock ? "bg-green-500" : "bg-red-500"
                )}
              />
              <span className="text-sm text-gray-600">
                {lowStock
                  ? `Only ${product.stock} left in stock`
                  : inStock
                  ? "In Stock"
                  : "Out of Stock"}
              </span>
            </div>
          </div>

          <hr className="border-gray-200" />

          {product.sizes.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">
                Size: <span className="font-normal text-gray-500">{selectedSize}</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium border transition-colors",
                      selectedSize === size
                        ? "bg-black text-white border-black"
                        : "border-gray-300 text-gray-700 hover:border-gray-900"
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.colors.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">
                Color:{" "}
                <span className="font-normal text-gray-500">{selectedColor}</span>
              </h3>
              <div className="flex flex-wrap gap-3">
                {product.colors.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color.name)}
                    className={cn(
                      "relative w-10 h-10 rounded-full border-2 transition-colors",
                      selectedColor === color.name
                        ? "border-black scale-110"
                        : "border-gray-300 hover:border-gray-400"
                    )}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                    aria-label={color.name}
                  >
                    {color.image && (
                      <Image
                        src={color.image}
                        alt={color.name}
                        fill
                        sizes="40px"
                        className="object-cover rounded-full"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold mb-2">Quantity</h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                disabled={quantity >= product.stock}
                className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              size="lg"
              fullWidth
              onClick={handleAddToCart}
              disabled={!inStock}
            >
              {inStock ? "Add to Cart" : "Out of Stock"}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => toggleItem(product)}
              className={cn(inWishlist && "border-red-500 text-red-500")}
            >
              <Heart
                className="h-5 w-5"
                fill={inWishlist ? "currentColor" : "none"}
              />
            </Button>
            <Button variant="outline" size="lg" onClick={handleShare}>
              <Share2 className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3">
            <Truck className="h-5 w-5 flex-shrink-0" />
            <span>Free shipping on orders above ₹499</span>
          </div>

          <hr className="border-gray-200" />

          <div>
            <h3 className="text-sm font-semibold mb-2">Description</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {product.description}
            </p>
          </div>

          {product.material && (
            <div>
              <h3 className="text-sm font-semibold mb-1">Material</h3>
              <p className="text-sm text-gray-600">{product.material}</p>
            </div>
          )}

          {product.care_instructions && (
            <div>
              <h3 className="text-sm font-semibold mb-1">Care Instructions</h3>
              <p className="text-sm text-gray-600 whitespace-pre-line">
                {product.care_instructions}
              </p>
            </div>
          )}

          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
