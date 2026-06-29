import type { UUID } from "crypto";

export type UserRole = "customer" | "admin";

export interface User {
  id: UUID;
  email: string;
  name: string;
  phone?: string;
  avatar_url?: string;
  role: UserRole;
  created_at: string;
}

export interface Product {
  id: UUID;
  name: string;
  slug: string;
  description: string;
  category: ProductCategory;
  subcategory?: string;
  price: number;
  compare_price?: number;
  images: string[];
  sizes: string[];
  colors: ColorOption[];
  tags: string[];
  material?: string;
  care_instructions?: string;
  is_new: boolean;
  is_best_seller: boolean;
  is_sale: boolean;
  sale_percent?: number;
  stock: number;
  rating: number;
  review_count: number;
  created_at: string;
  updated_at: string;
}

export interface ColorOption {
  name: string;
  hex: string;
  image?: string;
}

export type ProductCategory =
  | "women-clothing"
  | "artificial-jewellery"
  | "new-arrivals"
  | "best-sellers"
  | "sale";

export interface CartItem {
  id: UUID;
  product_id: UUID;
  product: Product;
  quantity: number;
  size: string;
  color: string;
}

export interface WishlistItem {
  id: UUID;
  product_id: UUID;
  product: Product;
  created_at: string;
}

export interface OrderItem {
  id: UUID;
  product_id: UUID;
  product: {
    id: UUID;
    name: string;
    slug: string;
    images: string[];
    price: number;
  };
  quantity: number;
  size: string;
  color: string;
}

export interface Order {
  id: UUID;
  order_id: string;
  user_id: UUID;
  items: OrderItem[];
  shipping_address: Address;
  billing_address: Address;
  payment_method: "cod" | "razorpay";
  payment_status: "pending" | "paid" | "failed" | "refunded";
  order_status: OrderStatus;
  subtotal: number;
  shipping_charge: number;
  discount: number;
  coupon_code?: string;
  total: number;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  tracking_id?: string;
  courier_name?: string;
  estimated_delivery?: string;
  created_at: string;
  updated_at: string;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "out-for-delivery"
  | "delivered"
  | "cancelled"
  | "returned";

export interface Address {
  full_name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  is_default?: boolean;
}

export interface Coupon {
  id: UUID;
  code: string;
  description: string;
  discount_type: "percentage" | "flat";
  discount_value: number;
  min_order: number;
  max_discount?: number;
  usage_limit: number;
  used_count: number;
  is_active: boolean;
  expires_at: string;
  created_at: string;
}

export interface Banner {
  id: UUID;
  title: string;
  subtitle?: string;
  image: string;
  link?: string;
  is_active: boolean;
  order: number;
  created_at: string;
}

export interface Review {
  id: UUID;
  product_id: UUID;
  user_id: UUID;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface AnalyticsSummary {
  total_revenue: number;
  total_orders: number;
  total_customers: number;
  total_products: number;
  revenue_today: number;
  orders_today: number;
  revenue_month: number;
  orders_month: number;
  top_products: { name: string; sales: number; revenue: number }[];
  orders_by_status: { status: string; count: number }[];
  revenue_by_day: { date: string; revenue: number }[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
