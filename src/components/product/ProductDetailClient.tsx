"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, Share2, Minus, Plus, Truck, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Rating } from "@/components/ui/Rating";
import { ProductCard } from "./ProductCard";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/format";
import { useCartStore } from "@/lib/store/cart";
import { useWishlistStore } from "@/lib/store/wishlist";
import { CATEGORIES } from "@/lib/constants/categories";
import toast from "react-hot-toast";
import type { Product } from "@/types";

interface ProductDetailClientProps {
  product: Product;
  relatedProducts?: Product[];
}

const categoryMap = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c.name]));

function parseColors(colors: Product["colors"]): { name: string; hex: string; image?: string }[] {
  if (Array.isArray(colors)) return colors;
  if (typeof colors === "string") {
    try { return JSON.parse(colors); } catch { return []; }
  }
  return [];
}

export function ProductDetailClient({
  product,
  relatedProducts = [],
}: ProductDetailClientProps) {
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || "");
  const colors = parseColors(product.colors);
  const [selectedColor, setSelectedColor] = useState(colors[0]?.name || "");
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

  const categoryName = categoryMap[product.category] || product.category.replace(/-/g, " ");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-[11px] text-charcoal-muted mb-8 tracking-wide">
        <Link href="/" className="hover:text-charcoal transition-colors">
          Home
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link
          href="/products/all"
          className="hover:text-charcoal transition-colors"
        >
          Shop
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link
          href={`/products/${product.category}`}
          className="hover:text-charcoal transition-colors capitalize"
        >
          {categoryName}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-charcoal font-medium truncate max-w-[200px]">
          {product.name}
        </span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14">
        {/* Images */}
        <div className="space-y-4">
          <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-ivory-dark group">
            {product.images?.[selectedImage] && (
              <Image
                src={product.images[selectedImage]}
                alt={product.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                preload
              />
            )}
            <div className="absolute top-4 left-4 flex flex-col gap-1.5">
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
                    "relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all duration-300",
                    idx === selectedImage
                      ? "border-charcoal"
                      : "border-transparent hover:border-ivory-dark"
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

        {/* Details */}
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-[11px] text-charcoal-muted uppercase tracking-[0.2em] mb-2">
              {categoryName}
              {product.subcategory && ` / ${product.subcategory}`}
            </p>
            <h1 className="text-2xl lg:text-3xl font-serif font-bold text-charcoal">
              {product.name}
            </h1>
            <div className="flex items-center gap-3 mt-3">
              <Rating
                rating={product.rating}
                reviewCount={product.review_count}
                size="md"
                showCount
              />
            </div>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-bold text-charcoal">
              {formatPrice(product.price)}
            </span>
            {product.compare_price && (
              <>
                <span className="text-lg text-charcoal-muted/40 line-through">
                  {formatPrice(product.compare_price)}
                </span>
                <Badge variant="sale">-{discount}%</Badge>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span
              className={cn(
                "w-2 h-2 rounded-full",
                inStock ? "bg-emerald-500" : "bg-red-500"
              )}
            />
            <span className="text-sm text-charcoal-muted">
              {lowStock
                ? `Only ${product.stock} left in stock`
                : inStock
                ? "In Stock"
                : "Out of Stock"}
            </span>
          </div>

          <hr className="border-ivory-dark" />

          {product.sizes.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-charcoal mb-3">
                Size: <span className="font-normal text-charcoal-muted">{selectedSize}</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={cn(
                      "px-4 py-2.5 rounded-lg text-sm font-medium border transition-all duration-300",
                      selectedSize === size
                        ? "bg-charcoal text-ivory border-charcoal"
                        : "border-ivory-dark text-charcoal-muted hover:border-charcoal/30"
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {colors.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-charcoal mb-3">
                Color:{" "}
                <span className="font-normal text-charcoal-muted">{selectedColor}</span>
              </h3>
              <div className="flex flex-wrap gap-3">
                {colors.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color.name)}
                    className={cn(
                      "relative w-10 h-10 rounded-full border-2 transition-all duration-300",
                      selectedColor === color.name
                        ? "border-charcoal scale-110"
                        : "border-ivory-dark hover:border-charcoal/30"
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
            <h3 className="text-sm font-semibold text-charcoal mb-3">Quantity</h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="w-10 h-10 rounded-lg border border-ivory-dark flex items-center justify-center hover:bg-ivory-dark/50 disabled:opacity-40 transition-colors"
              >
                <Minus className="h-4 w-4 text-charcoal-muted" />
              </button>
              <span className="w-12 text-center font-medium text-charcoal">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                disabled={quantity >= product.stock}
                className="w-10 h-10 rounded-lg border border-ivory-dark flex items-center justify-center hover:bg-ivory-dark/50 disabled:opacity-40 transition-colors"
              >
                <Plus className="h-4 w-4 text-charcoal-muted" />
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
              className={cn(inWishlist && "border-rose-400 text-rose-400")}
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

          <div className="flex items-center gap-2.5 text-sm text-charcoal-muted bg-ivory-dark/50 rounded-xl px-4 py-3">
            <Truck className="h-5 w-5 flex-shrink-0 text-gold-dark" />
            <span>Free shipping on orders above ₹499</span>
          </div>

          <hr className="border-ivory-dark" />

          <div>
            <h3 className="text-sm font-semibold text-charcoal mb-2">Description</h3>
            <p className="text-sm text-charcoal-muted leading-relaxed">
              {product.description}
            </p>
          </div>

          {product.material && (
            <div>
              <h3 className="text-sm font-semibold text-charcoal mb-1">Material</h3>
              <p className="text-sm text-charcoal-muted">{product.material}</p>
            </div>
          )}

          {product.care_instructions && (
            <div>
              <h3 className="text-sm font-semibold text-charcoal mb-1">Care Instructions</h3>
              <p className="text-sm text-charcoal-muted whitespace-pre-line">
                {product.care_instructions}
              </p>
            </div>
          )}

          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-ivory-dark text-charcoal-muted text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-20">
          <div className="flex items-center gap-3 mb-2">
            <span className="h-[1px] w-6 bg-gold/50" />
            <span className="text-[10px] uppercase tracking-[0.4em] text-gold-dark font-medium">
              You May Also Like
            </span>
          </div>
          <h2 className="text-2xl font-serif font-bold text-charcoal mb-8">
            Related Products
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
            {relatedProducts.map((rp) => (
              <ProductCard key={rp.id} product={rp} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
