const R2 = 'https://pub-5f274d699fd14be18a8456b06f1732ec.r2.dev';

export const CATEGORIES = [
  { id: "women-clothing", name: "Women's Clothing", slug: "women-clothing", image: `${R2}/categories/women-clothing.webp` },
  { id: "artificial-jewellery", name: "Artificial Jewellery", slug: "artificial-jewellery", image: `${R2}/categories/artificial-jewellery.webp` },
  { id: "new-arrivals", name: "New Arrivals", slug: "new-arrivals", image: `${R2}/categories/new-arrivals.webp` },
  { id: "best-sellers", name: "Best Sellers", slug: "best-sellers", image: `${R2}/categories/best-sellers.webp` },
  { id: "sale", name: "Sale", slug: "sale", image: `${R2}/categories/sale.webp` },
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
  { value: "shipped", label: "Shipped", color: "text-purple-600 bg-purple-50" },
  { value: "out-for-delivery", label: "Out for Delivery", color: "text-orange-600 bg-orange-50" },
  { value: "delivered", label: "Delivered", color: "text-green-600 bg-green-50" },
  { value: "cancelled", label: "Cancelled", color: "text-rose-600 bg-rose-50" },
  { value: "returned", label: "Returned", color: "text-charcoal-muted bg-ivory-dark" },
] as const;

export const PAYMENT_METHODS = [
  { id: "cod", name: "Cash on Delivery", icon: "Banknote" },
  { id: "razorpay", name: "Pay Online (Card/UPI/Net Banking)", icon: "CreditCard" },
] as const;
