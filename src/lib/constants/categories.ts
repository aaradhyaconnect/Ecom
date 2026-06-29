export const CATEGORIES = [
  { id: "women-clothing", name: "Women's Clothing", slug: "women-clothing", image: "/images/categories/women-clothing.jpg" },
  { id: "artificial-jewellery", name: "Artificial Jewellery", slug: "artificial-jewellery", image: "/images/categories/jewellery.jpg" },
  { id: "new-arrivals", name: "New Arrivals", slug: "new-arrivals", image: "/images/categories/new-arrivals.jpg" },
  { id: "best-sellers", name: "Best Sellers", slug: "best-sellers", image: "/images/categories/best-sellers.jpg" },
  { id: "sale", name: "Sale", slug: "sale", image: "/images/categories/sale.jpg" },
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
  { value: "cancelled", label: "Cancelled", color: "text-red-600 bg-red-50" },
  { value: "returned", label: "Returned", color: "text-gray-600 bg-gray-50" },
] as const;

export const PAYMENT_METHODS = [
  { id: "cod", name: "Cash on Delivery", icon: "Banknote" },
  { id: "razorpay", name: "Pay Online (Card/UPI/Net Banking)", icon: "CreditCard" },
] as const;
