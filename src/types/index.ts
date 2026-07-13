export type UserRole = "customer" | "admin";

export type StaffRole = "super_admin" | "admin" | "staff";

export type PermissionAction = "view" | "create" | "edit" | "delete";

export type PermissionModule =
  | "products"
  | "orders"
  | "customers"
  | "inventory"
  | "marketing"
  | "reports"
  | "settings"
  | "users"
  | "categories";

export type Permissions = Record<PermissionModule, Record<PermissionAction, boolean>>;

export const DEFAULT_PERMISSIONS: Permissions = {
  products:  { view: true, create: true, edit: true, delete: false },
  orders:    { view: true, create: false, edit: true, delete: false },
  customers: { view: true, create: false, edit: false, delete: false },
  inventory: { view: true, create: false, edit: true, delete: false },
  marketing: { view: true, create: true, edit: true, delete: false },
  reports:   { view: true, create: false, edit: false, delete: false },
  settings:  { view: false, create: false, edit: false, delete: false },
  users:     { view: false, create: false, edit: false, delete: false },
  categories:{ view: true, create: true, edit: true, delete: false },
};

export const SUPER_ADMIN_PERMISSIONS: Permissions = {
  products:  { view: true, create: true, edit: true, delete: true },
  orders:    { view: true, create: false, edit: true, delete: true },
  customers: { view: true, create: false, edit: true, delete: true },
  inventory: { view: true, create: true, edit: true, delete: true },
  marketing: { view: true, create: true, edit: true, delete: true },
  reports:   { view: true, create: false, edit: false, delete: false },
  settings:  { view: true, create: false, edit: true, delete: false },
  users:     { view: true, create: true, edit: true, delete: true },
  categories:{ view: true, create: true, edit: true, delete: true },
};

export interface StaffUser {
  id: string;
  user_id: string;
  display_name: string;
  username: string;
  role: StaffRole;
  permissions: Partial<Permissions>;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar_url?: string;
  role: UserRole;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
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
  stock: number;
  rating: number;
  review_count: number;
  sku?: string;
  barcode?: string;
  seo_title?: string;
  seo_description?: string;
  status: "draft" | "published" | "archived";
  cost_price?: number;
  stock_alert: number;
  video_url?: string;
  sale_percent?: number;
  is_prebook: boolean;
  prebook_amount?: number;
  prebook_note?: string;
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

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  product_id: string;
  product: Product;
  quantity: number;
  size: string;
  color: string;
}

export interface WishlistItem {
  id: string;
  product_id: string;
  product: Product;
  created_at: string;
}

export interface OrderItem {
  id: string;
  product_id: string;
  product: {
    id: string;
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
  id: string;
  order_id: string;
  user_id: string;
  items: OrderItem[];
  shipping_address: Address;
  billing_address: Address;
  payment_method: "cod" | "razorpay" | "cashfree" | "upi";
  payment_status: "pending" | "paid" | "failed" | "refunded";
  order_status: OrderStatus;
  subtotal: number;
  shipping_charge: number;
  discount: number;
  coupon_code?: string;
  total: number;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  cashfree_order_id?: string;
  cashfree_payment_id?: string;
  tracking_id?: string;
  courier_name?: string;
  estimated_delivery?: string;
  shiprocket_shipment_id?: number;
  awb_code?: string;
  is_prebook: boolean;
  prebook_amount: number;
  balance_amount: number;
  prebook_status?: "confirmed" | "ready_to_ship" | "shipped" | "delivered" | "balance_collected";
  prebook_note?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "packed"
  | "shipped"
  | "out-for-delivery"
  | "delivered"
  | "cancelled"
  | "returned";

export interface OrderNote {
  id: string;
  order_id: string;
  note: string;
  is_internal: boolean;
  created_by: string | null;
  created_at: string;
}

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
  id: string;
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
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  link?: string;
  is_active: boolean;
  order: number;
  text_position?: "left" | "right";
  created_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  user_name: string;
  rating: number;
  comment: string;
  is_approved: boolean;
  created_at: string;
}

export interface StockHistory {
  id: string;
  product_id: string;
  change_type: "set" | "increase" | "decrease" | "order" | "return" | "adjustment";
  quantity_before: number;
  quantity_after: number;
  quantity_change: number;
  reason?: string;
  order_id?: string;
  performed_by: string | null;
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
  revenue_last_month: number;
  orders_last_month: number;
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
