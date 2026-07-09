export const CATEGORIES = [
  { id: "women-clothing", name: "Women's Clothing", slug: "women-clothing", image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&h=800&fit=crop" },
  { id: "artificial-jewellery", name: "Artificial Jewellery", slug: "artificial-jewellery", image: "https://images.unsplash.com/photo-1515562141589-67f0d727b750?w=600&h=800&fit=crop" },
  { id: "new-arrivals", name: "New Arrivals", slug: "new-arrivals", image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=800&fit=crop" },
  { id: "best-sellers", name: "Best Sellers", slug: "best-sellers", image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&h=800&fit=crop" },
  { id: "sale", name: "Sale", slug: "sale", image: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=600&h=800&fit=crop" },
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
  { id: "cashfree", name: "Pay Online (Card/UPI/Net Banking/Wallets)", icon: "CreditCard" },
] as const;
