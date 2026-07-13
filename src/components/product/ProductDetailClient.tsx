"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, Share2, Minus, Plus, Truck, ChevronRight, Check, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Rating } from "@/components/ui/Rating";
import { ProductCard } from "./ProductCard";
import { ZoomImage } from "./ZoomImage";
import { RecentlyViewed } from "./RecentlyViewed";
import { ReviewForm } from "./ReviewForm";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/format";
import { useCartStore } from "@/lib/store/cart";
import { useWishlistStore } from "@/lib/store/wishlist";
import { useAuthStore } from "@/lib/store/auth";
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
  const [activeTab, setActiveTab] = useState<"description" | "specifications" | "shipping">("description");

  const addItem = useCartStore((s) => s.addItem);
  const { isInWishlist, toggleItem } = useWishlistStore();
  const inWishlist = isInWishlist(product.id);
  const { addProduct } = useRecentlyViewed();
  const user = useAuthStore((s) => s.user);

  // Reviews state
  const [reviews, setReviews] = useState<{ id: string; user_name: string; rating: number; comment: string; created_at: string }[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews?product_id=${product.id}`);
      const data = await res.json();
      if (data.success) setReviews(data.data);
    } catch { /* ok */ }
    finally { setLoadingReviews(false); }
  }, [product.id]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  useEffect(() => {
    addProduct(product);
  }, [product, addProduct]);

  const discount = product.compare_price
    ? Math.round(
        ((product.compare_price - product.price) / product.compare_price) * 100
      )
    : 0;
  const inStock = product.is_prebook || product.stock > 0;
  const lowStock = !product.is_prebook && product.stock > 0 && product.stock <= 5;

  const validateSelection = () => {
    if (!user) {
      toast.error("Please log in to continue");
      window.location.replace(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return false;
    }
    if (product.sizes.length > 0 && !selectedSize) {
      toast.error("Please select a size");
      return false;
    }
    if (colors.length > 0 && !selectedColor) {
      toast.error("Please select a color");
      return false;
    }
    return true;
  };

  const handleAddToCart = () => {
    if (!validateSelection()) return;
    addItem(product, quantity, selectedSize || "default", selectedColor || "default");
    toast.success("Added to cart!");
  };

  const handleBuyNow = () => {
    if (!validateSelection()) return;
    addItem(product, quantity, selectedSize || "default", selectedColor || "default");
    window.location.href = "/checkout?buyNow=true";
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 lg:pb-8">
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
        {/* Images - Vertical Gallery */}
        <div className="flex gap-4 animate-in slide-up">
          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="hidden lg:flex flex-col gap-3 overflow-y-auto max-h-[600px] scrollbar-hide">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={cn(
                    "relative w-20 h-20 overflow-hidden flex-shrink-0 rounded-lg transition-all duration-300",
                    idx === selectedImage
                      ? "ring-2 ring-charcoal ring-offset-2 ring-offset-ivory"
                      : "opacity-60 hover:opacity-100"
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

          {/* Main Image */}
          <div className="flex-1 relative aspect-[3/4] overflow-hidden bg-beige rounded-xl group">
            {product.images?.[selectedImage] ? (
              <ZoomImage
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-full"
              />
            ) : (
              <Image
                src="/placeholder.svg"
                alt={product.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
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
              {product.is_prebook && (
                <Badge variant="warning">Pre-Order — Arriving Soon</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Thumbnails */}
        {product.images && product.images.length > 1 && (
          <div className="flex lg:hidden gap-2 overflow-x-auto pb-2 -mx-4 px-4">
            {product.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(idx)}
                className={cn(
                  "relative w-16 h-16 overflow-hidden flex-shrink-0 rounded-lg transition-all duration-300",
                  idx === selectedImage
                    ? "ring-2 ring-charcoal ring-offset-2 ring-offset-ivory"
                    : "opacity-60"
                )}
              >
                <Image
                  src={img}
                  alt={`${product.name} ${idx + 1}`}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Details */}
        <div className="flex flex-col gap-5 stagger-children">
          <div className="animate-in slide-up">
            <p className="text-[10px] text-charcoal-muted uppercase tracking-[0.25em] mb-2">
              {categoryName}
              {product.subcategory && ` / ${product.subcategory}`}
            </p>
            <h1 className="text-2xl lg:text-3xl font-serif font-bold text-charcoal leading-tight">
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

          <div className="animate-in slide-up flex items-baseline gap-3">
            <span className="text-2xl font-bold text-charcoal tracking-tight">
              {formatPrice(product.price)}
            </span>
            {product.compare_price && (
              <span className="text-base text-charcoal-muted line-through">
                {formatPrice(product.compare_price)}
              </span>
            )}
            {product.compare_price && (
              <span className="text-[11px] font-semibold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-sm">
                SAVE {discount}%
              </span>
            )}
          </div>

          <div className="animate-in slide-up flex items-center gap-2">
            <span
              className={cn(
                "w-2 h-2 rounded-full",
                inStock ? "bg-emerald-500" : "bg-rose-500"
              )}
            />
            <span className="text-[13px] text-charcoal-muted">
              {product.is_prebook
                ? "Pre-Order — Arriving Soon"
                : lowStock
                ? `Only ${product.stock} left in stock`
                : inStock
                ? "In Stock"
                : "Out of Stock"}
            </span>
          </div>

          <hr className="border-ivory-dark/80 animate-in slide-up" />

          {product.sizes.length > 0 ? (
            <div className="animate-in slide-up">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-semibold text-charcoal">
                  Size: <span className="font-normal text-charcoal-muted">{selectedSize}</span>
                </h3>
                <Link
                  href="/size-guide"
                  className="text-[10px] text-charcoal-muted hover:text-gold-dark uppercase tracking-wider transition-colors underline underline-offset-4"
                >
                  Size Guide
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={cn(
                      "px-4 py-2.5 text-[13px] font-medium border rounded-lg transition-all duration-300",
                      selectedSize === size
                        ? "bg-charcoal text-ivory border-charcoal"
                        : "border-ivory-dark text-charcoal-muted hover:border-charcoal/20"
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="animate-in slide-up">
              <h3 className="text-[13px] font-semibold text-charcoal mb-1">Size</h3>
              <p className="text-[13px] text-charcoal-muted">One Size</p>
            </div>
          )}

          {colors.length > 0 ? (
            <div className="animate-in slide-up">
              <h3 className="text-[13px] font-semibold text-charcoal mb-3">
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
                        : "border-ivory-dark hover:border-charcoal/20"
                    )}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                    aria-label={color.name}
                  >
                    {selectedColor === color.name && (
                      <Check className="absolute inset-0 m-auto h-4 w-4" style={{ color: color.hex === "#FFFFFF" || color.hex === "#FFFFF0" ? "#1A1A1A" : "#FFFFFF" }} />
                    )}
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
          ) : (
            <div className="animate-in slide-up">
              <h3 className="text-[13px] font-semibold text-charcoal mb-1">Color</h3>
              <p className="text-[13px] text-charcoal-muted">Classic</p>
            </div>
          )}

          <div className="animate-in slide-up">
            <h3 className="text-[13px] font-semibold text-charcoal mb-3">Quantity</h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="w-10 h-10 border border-ivory-dark rounded-lg flex items-center justify-center hover:bg-ivory-dark/50 disabled:opacity-40 transition-colors"
              >
                <Minus className="h-4 w-4 text-charcoal-muted" />
              </button>
              <span className="w-12 text-center font-medium text-charcoal">{quantity}</span>
              <button
                onClick={() => setQuantity(product.is_prebook ? quantity + 1 : Math.min(product.stock, quantity + 1))}
                disabled={!product.is_prebook && quantity >= product.stock}
                className="w-10 h-10 border border-ivory-dark rounded-lg flex items-center justify-center hover:bg-ivory-dark/50 disabled:opacity-40 transition-colors"
              >
                <Plus className="h-4 w-4 text-charcoal-muted" />
              </button>
            </div>
          </div>

          <div className="animate-in slide-up flex gap-3">
            <Button
              size="lg"
              fullWidth
              onClick={handleAddToCart}
              disabled={!inStock}
            >
              {product.is_prebook
                ? `Pre-Book Now — Pay ${formatPrice(product.prebook_amount || 0)}`
                : inStock
                ? "Add to Cart"
                : "Out of Stock"}
            </Button>
            <Button
              size="lg"
              fullWidth
              variant="outline"
              onClick={handleBuyNow}
              disabled={!inStock}
            >
              {product.is_prebook ? "Pre-Book Now" : "Buy Now"}
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

          {product.is_prebook && (
            <div className="animate-in slide-up flex items-center gap-2.5 text-[13px] text-charcoal-muted bg-amber-50 border border-amber-200 px-4 py-3 rounded-lg">
              <span className="text-amber-600 font-medium">{formatPrice(product.prebook_amount || 0)}</span>
              <span>paid now &middot; remaining {formatPrice(product.price - (product.prebook_amount || 0))} due on delivery</span>
            </div>
          )}

          <div className="animate-in slide-up flex items-center gap-2.5 text-[13px] text-charcoal-muted bg-ivory-dark/30 px-4 py-3 rounded-lg">
            <Truck className="h-5 w-5 flex-shrink-0 text-gold-dark" />
            <span>Free shipping on orders above ₹999</span>
          </div>

          <hr className="border-ivory-dark/80 animate-in slide-up" />

          {/* Tabs */}
          <div className="animate-in slide-up">
            <div className="flex border-b border-ivory-dark/80">
              {(["description", "specifications", "shipping"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.15em] transition-colors border-b-2 -mb-[1px]",
                    activeTab === tab
                      ? "border-charcoal text-charcoal"
                      : "border-transparent text-charcoal-muted hover:text-charcoal"
                  )}
                >
                  {tab === "description" ? "Description" : tab === "specifications" ? "Specifications" : "Shipping & Returns"}
                </button>
              ))}
            </div>

            <div className="py-4">
              {activeTab === "description" && (
                <div className="space-y-4">
                  <p className="text-[13px] text-charcoal-muted leading-relaxed">
                    {product.description}
                  </p>
                  {product.material && (
                    <div>
                      <h4 className="text-[12px] font-semibold text-charcoal mb-1">Material</h4>
                      <p className="text-[13px] text-charcoal-muted">{product.material}</p>
                    </div>
                  )}
                  {product.care_instructions && (
                    <div>
                      <h4 className="text-[12px] font-semibold text-charcoal mb-1">Care Instructions</h4>
                      <p className="text-[13px] text-charcoal-muted whitespace-pre-line">{product.care_instructions}</p>
                    </div>
                  )}
                  {product.tags && product.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {product.tags.map((tag) => (
                        <span key={tag} className="px-3 py-1 bg-ivory-dark/50 text-charcoal-muted text-[11px] rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "specifications" && (
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b border-ivory-dark/50 text-[13px]">
                    <span className="text-charcoal-muted">Category</span>
                    <span className="text-charcoal font-medium capitalize">{product.category.replace(/-/g, " ")}</span>
                  </div>
                  {product.subcategory && (
                    <div className="flex justify-between py-2 border-b border-ivory-dark/50 text-[13px]">
                      <span className="text-charcoal-muted">Subcategory</span>
                      <span className="text-charcoal font-medium">{product.subcategory}</span>
                    </div>
                  )}
                  {product.material && (
                    <div className="flex justify-between py-2 border-b border-ivory-dark/50 text-[13px]">
                      <span className="text-charcoal-muted">Material</span>
                      <span className="text-charcoal font-medium">{product.material}</span>
                    </div>
                  )}
                  {product.sizes.length > 0 && (
                    <div className="flex justify-between py-2 border-b border-ivory-dark/50 text-[13px]">
                      <span className="text-charcoal-muted">Sizes Available</span>
                      <span className="text-charcoal font-medium">{product.sizes.join(", ")}</span>
                    </div>
                  )}
                  {colors.length > 0 && (
                    <div className="flex justify-between py-2 border-b border-ivory-dark/50 text-[13px]">
                      <span className="text-charcoal-muted">Colors</span>
                      <span className="text-charcoal font-medium">{colors.map((c) => c.name).join(", ")}</span>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "shipping" && (
                <div className="space-y-4 text-[13px] text-charcoal-muted">
                  <div>
                    <h4 className="font-semibold text-charcoal mb-1">Shipping</h4>
                    <p>Free shipping on orders above ₹999. Standard delivery takes 3–7 business days.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-charcoal mb-1">Returns</h4>
                    <p>We offer easy 7-day returns on all unworn items with original tags. To initiate a return, visit your order history and select the item.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-charcoal mb-1">Refunds</h4>
                    <p>Refunds are processed within 5–7 business days after the return is received and inspected.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-16">
        <div className="flex items-center gap-3 mb-2">
          <span className="h-[1px] w-6 bg-gold/40" />
          <span className="text-[10px] uppercase tracking-[0.4em] text-gold-dark font-medium">
            Reviews
          </span>
        </div>
        <h2 className="text-2xl font-serif font-bold text-charcoal mb-8">
          Customer Reviews
        </h2>

        {/* Review Summary */}
        <div className="flex items-center gap-6 mb-8 p-6 bg-ivory border border-ivory-dark/60 shadow-sm">
          <div className="text-center">
            <p className="text-4xl font-bold text-charcoal">{product.rating.toFixed(1)}</p>
            <div className="flex gap-0.5 mt-1 justify-center">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={`h-4 w-4 ${s <= Math.round(product.rating) ? "fill-gold text-gold" : "text-charcoal/20"}`} />
              ))}
            </div>
            <p className="text-xs text-charcoal-muted mt-1">{product.review_count} reviews</p>
          </div>
          <div className="flex-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = reviews.filter((r) => r.rating === star).length;
              const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-charcoal-muted w-3">{star}</span>
                  <Star className="h-3 w-3 fill-gold text-gold" />
                  <div className="flex-1 h-1.5 bg-ivory-dark/50 overflow-hidden">
                    <div className="h-full bg-gold" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-charcoal-muted w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Review Form */}
        {user && <ReviewForm productId={product.id} onReviewSubmitted={fetchReviews} />}

        {/* Reviews List */}
        <div className="mt-8 space-y-4">
          {loadingReviews ? (
            <p className="text-sm text-charcoal-muted text-center py-8">Loading reviews...</p>
          ) : reviews.length === 0 ? (
            <p className="text-sm text-charcoal-muted text-center py-8">No reviews yet. Be the first to review this product!</p>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="bg-ivory border border-ivory-dark/60 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-charcoal text-ivory flex items-center justify-center text-xs font-bold">
                      {review.user_name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-charcoal">{review.user_name}</span>
                  </div>
                  <span className="text-xs text-charcoal-muted">{new Date(review.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
                <div className="flex gap-0.5 mb-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`h-3.5 w-3.5 ${s <= review.rating ? "fill-gold text-gold" : "text-charcoal/20"}`} />
                  ))}
                </div>
                {review.comment && <p className="text-sm text-charcoal-muted">{review.comment}</p>}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-20">
          <div className="flex items-center gap-3 mb-2">
            <span className="h-[1px] w-6 bg-gold/40" />
            <span className="text-[10px] uppercase tracking-[0.4em] text-gold-dark font-medium">
              You May Also Like
            </span>
          </div>
          <h2 className="text-2xl font-serif font-bold text-charcoal mb-8">
            Related Products
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 stagger-children">
            {relatedProducts.map((rp) => (
              <ProductCard key={rp.id} product={rp} />
            ))}
          </div>
        </div>
      )}

      <RecentlyViewed />

      {/* Mobile Sticky Add to Cart */}
      <div className="fixed bottom-0 left-0 right-0 bg-ivory/95 backdrop-blur-sm border-t border-ivory-dark/80 p-4 flex items-center gap-3 lg:hidden z-[60]">
        <div className="flex-1 min-w-0">
          <p className="text-lg font-bold text-charcoal">
            {product.is_prebook ? formatPrice(product.prebook_amount || 0) : formatPrice(product.price)}
          </p>
          {product.is_prebook && product.prebook_amount && (
            <p className="text-xs text-amber-600">Deposit — {formatPrice(product.price - product.prebook_amount)} due on delivery</p>
          )}
          {!product.is_prebook && product.compare_price && (
            <p className="text-xs text-charcoal-muted line-through">{formatPrice(product.compare_price)}</p>
          )}
        </div>
        <Button
          size="sm"
          onClick={handleBuyNow}
          disabled={!inStock}
          variant="outline"
          className="flex-shrink-0"
        >
          {product.is_prebook ? "Pre-Book" : "Buy Now"}
        </Button>
        <Button
          size="sm"
          onClick={handleAddToCart}
          disabled={!inStock}
          className="flex-shrink-0"
        >
          {product.is_prebook ? "Pre-Book Now" : inStock ? "Add to Cart" : "Out of Stock"}
        </Button>
      </div>
    </div>
  );
}
