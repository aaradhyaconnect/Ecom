export const CATEGORIES = [
  { id: "women-clothing", name: "Women's Clothing", slug: "women-clothing", image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&h=800&fit=crop&q=80" },
  { id: "artificial-jewellery", name: "Artificial Jewellery", slug: "artificial-jewellery", image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&h=800&fit=crop&q=80" },
  { id: "new-arrivals", name: "New Arrivals", slug: "new-arrivals", image: "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=600&h=800&fit=crop&q=80" },
  { id: "best-sellers", name: "Best Sellers", slug: "best-sellers", image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&h=800&fit=crop&q=80" },
  { id: "sale", name: "Sale", slug: "sale", image: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=600&h=800&fit=crop&q=80" },
] as const;

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
  { value: "popular", label: "Most Popular" },
] as const;

export const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"] as const;

export const ORDER_STATUSES = [
  { value: "pending", label: "Pending", color: "text-yellow-600 bg-yellow-50" },
  { value: "confirmed", label: "Confirmed", color: "text-blue-600 bg-blue-50" },
  { value: "processing", label: "Processing", color: "text-cyan-600 bg-cyan-50" },
  { value: "packed", label: "Packed", color: "text-indigo-600 bg-indigo-50" },
  { value: "shipped", label: "Shipped", color: "text-purple-600 bg-purple-50" },
  { value: "out-for-delivery", label: "Out for Delivery", color: "text-orange-600 bg-orange-50" },
  { value: "delivered", label: "Delivered", color: "text-green-600 bg-green-50" },
  { value: "cancelled", label: "Cancelled", color: "text-rose-600 bg-rose-50" },
  { value: "returned", label: "Returned", color: "text-charcoal-muted bg-ivory-dark" },
] as const;

export const PAYMENT_METHODS = [
  { id: "cod", name: "Cash on Delivery", icon: "Banknote" },
  { id: "upi", name: "UPI (Google Pay, PhonePe, BHIM)", icon: "Smartphone" },
  { id: "cashfree", name: "Card / Net Banking / Wallets", icon: "CreditCard" },
] as const;
