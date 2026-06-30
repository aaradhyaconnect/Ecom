# HAINJU — Product Requirements Document

## 1. Overview

| Field | Value |
|---|---|
| **Product Name** | HAINJU |
| **Tagline** | Premium designer clothing & artificial jewellery |
| **Type** | E-Commerce Progressive Web App |
| **Target Market** | Fashion-conscious women aged 20–40, India & International |
| **Business Model** | D2C (self-designed clothing) + curated resale (artificial jewellery) |

## 2. Brand Identity

| Element | Specification |
|---|---|
| **Design Language** | Minimal, premium, editorial |
| **Primary** | Ivory White (`#FFFFF0`) |
| **Accent** | Champagne Gold (`#D4AF37` / `#C5A55A`) |
| **Dark** | Matte Black (`#1A1A1A`) |
| **Typography** | Serif (headings: Playfair Display), Sans-serif (body: Inter) |
| **Tone** | Sophisticated, aspirational, warm |

## 3. Technical Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS v4 |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth (Email/Password, Google OAuth, OTP) |
| **Storage** | Cloudflare R2 (product images) |
| **Payments** | Razorpay |
| **Shipping** | Shiprocket |
| **State** | Zustand (persisted) |
| **Animations** | Framer Motion |
| **Icons** | Lucide React |
| **Deployment** | Vercel |

## 4. Pages & Routes

| Route | Page | Type |
|---|---|---|
| `/` | Home | Server + Client |
| `/products/[category]` | Shop / Category Listing | Server + Client |
| `/search` | Search Results | Dynamic |
| `/product/[id]` | Product Detail | Dynamic |
| `/wishlist` | Wishlist | Static |
| `/cart` | Cart | Static |
| `/checkout` | Checkout | Static |
| `/orders` | Order History | Static |
| `/order/[id]` | Order Detail | Dynamic |
| `/profile` | User Profile | Static |
| `/login` | Login | Static |
| `/register` | Register | Static |
| `/verify-otp` | OTP Verification | Static |
| `/admin` | Dashboard | Dynamic |
| `/admin/products` | Manage Products | Dynamic |
| `/admin/orders` | Manage Orders | Dynamic |
| `/admin/coupons` | Manage Coupons | Dynamic |
| `/admin/banners` | Manage Banners | Dynamic |
| `/admin/customers` | Manage Customers | Dynamic |
| `/admin/analytics` | Analytics | Dynamic |
| `/admin/login` | Admin Login | Dynamic |

## 5. Features by Page

### 5.1 Home (`/`)
- Hero banner carousel (3 slides, auto-rotate)
- Category showcase (Women's Clothing, Jewellery)
- Features section (Free Shipping, Easy Returns, etc.)
- Newsletter signup
- Product section (New Arrivals / Best Sellers)

### 5.2 Shop / Category (`/products/[category]`)
- Filter sidebar: size, color, price range, category
- Sort: Newest, Price (asc/desc), Rating, Popular
- Product grid with hover effects
- Pagination (12 per page)
- Search by keyword

### 5.3 Product Detail (`/product/[id]`)
- Multiple images with zoom on hover
- Size selector (XS–XXL)
- Color selector with swatches
- Price with compare-at price
- Add to cart / Buy now
- Wishlist toggle
- Share button
- Rating / reviews

### 5.4 Wishlist (`/wishlist`)
- Grid of saved products
- Remove from wishlist
- Move to cart
- Empty state illustration

### 5.5 Cart (`/cart`)
- Line items with quantity +/- 
- Size / color display
- Remove item
- Coupon code input
- Subtotal / discount / total
- Proceed to checkout

### 5.6 Checkout (`/checkout`)
- Address form (name, phone, address, city, state, pincode)
- Saved addresses selector (if logged in)
- Payment method: COD or Razorpay
- Order summary
- Place order → creates order in DB + redirects to confirmation

### 5.7 Order Tracking (`/order/[id]`)
- Status timeline (Confirmed → Shipped → Out for Delivery → Delivered)
- Tracking ID with Shiprocket link
- Cancel button (if eligible)
- Order summary

### 5.8 Profile (`/profile`)
- Edit name, phone, avatar
- Address book (add/edit/delete)
- Recent orders list

### 5.9 Admin Dashboard (`/admin`)
- **Dashboard**: Total revenue, orders, customers, growth charts
- **Products**: Table with CRUD, search, status toggles
- **Orders**: Table with status filter, update status, view details
- **Coupons**: CRUD for discount codes
- **Banners**: CRUD for hero banners
- **Customers**: List with order count, total spend
- **Analytics**: Revenue trends, top products, category breakdown

## 6. Database Schema (Supabase)

| Table | Key Columns |
|---|---|
| `profiles` | id, email, name, phone, avatar_url, role (customer/admin) |
| `products` | id, name, slug, description, category, price, compare_price, images[], sizes[], colors[], tags[], stock, rating |
| `orders` | id, order_id, user_id, items[], address, payment_method, payment_status, order_status, subtotal, total, coupon_code |
| `coupons` | id, code, description, discount_type (%/flat), discount_value, min_order, max_discount, usage_limit |
| `banners` | id, title, subtitle, image, link, order |
| `cart_items` | id, user_id, product_id, quantity, size, color |
| `wishlist_items` | id, user_id, product_id |
| `reviews` | id, product_id, user_id, rating, comment |

## 7. API Routes

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/auth/login` | POST | Email/password login |
| `/api/auth/register` | POST | Create account |
| `/api/auth/google` | POST | Google OAuth |
| `/api/auth/send-otp` | POST | Send OTP |
| `/api/auth/verify-otp` | POST | Verify OTP |
| `/api/products` | GET | List products (with filters) |
| `/api/products/[id]` | GET | Product detail |
| `/api/cart` | GET/POST/PATCH/DELETE | Cart CRUD |
| `/api/wishlist` | GET/POST/DELETE | Wishlist CRUD |
| `/api/checkout` | POST | Create order |
| `/api/payment/verify` | POST | Verify Razorpay payment |
| `/api/orders` | GET | User's orders |
| `/api/orders/[id]` | GET | Order detail |
| `/api/coupons/[code]` | GET | Validate coupon |
| `/api/admin/login` | POST | Admin auth |
| `/api/admin/analytics` | GET | Dashboard stats |
| `/api/admin/products` | GET/POST/PUT/DELETE | Admin product CRUD |
| `/api/admin/orders` | GET | All orders |
| `/api/admin/orders/[id]` | PATCH | Update order status |
| `/api/admin/coupons` | GET/POST/PUT/DELETE | Coupon CRUD |
| `/api/admin/banners` | GET/POST/PUT/DELETE | Banner CRUD |
| `/api/admin/customers` | GET | Customer list |

## 8. Non-Functional Requirements

| Requirement | Target |
|---|---|
| **Lighthouse Performance** | ≥ 90 |
| **Lighthouse PWA** | Pass all checks |
| **First Contentful Paint** | < 1.5s |
| **Time to Interactive** | < 3.5s |
| **SEO** | Perfect Lighthouse SEO score |
| **Mobile responsiveness** | All breakpoints 320px – 1920px |
| **Offline support** | Service worker caches static assets |
| **Installability** | PWA manifest + service worker |

## 9. Future Scope

- Product reviews and ratings UI
- Size guide / fit assistant
- AI-powered recommendations
- Multi-language support
- International shipping
- Loyalty program / rewards
- Back-in-stock notifications
- Abandoned cart recovery emails
- Blog / editorial content
