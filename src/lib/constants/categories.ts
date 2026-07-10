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
  { value: "rating", label: "Best Rated" },
  { value: "popular", label: "Most Popular" },
] as const;

export const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"] as const;

export const ORDER_STATUSES = [
  { value: "pending", label: "Pending", color: "text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-500/15" },
  { value: "confirmed", label: "Confirmed", color: "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-500/15" },
  { value: "processing", label: "Processing", color: "text-cyan-600 bg-cyan-50 dark:text-cyan-400 dark:bg-cyan-500/15" },
  { value: "packed", label: "Packed", color: "text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-500/15" },
  { value: "shipped", label: "Shipped", color: "text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-500/15" },
  { value: "out-for-delivery", label: "Out for Delivery", color: "text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-500/15" },
  { value: "delivered", label: "Delivered", color: "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-500/15" },
  { value: "cancelled", label: "Cancelled", color: "text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-500/15" },
  { value: "returned", label: "Returned", color: "text-charcoal-muted bg-ivory-dark dark:text-white/60 dark:bg-white/10" },
] as const;

export const PAYMENT_METHODS = [
  { id: "cod", name: "Cash on Delivery", icon: "Banknote" },
  { id: "upi", name: "UPI (Google Pay, PhonePe, BHIM)", icon: "Smartphone" },
  { id: "cashfree", name: "Card / Net Banking / Wallets", icon: "CreditCard" },
] as const;
