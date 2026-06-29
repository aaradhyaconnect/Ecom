<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# HAINJU - E-Commerce PWA

## Architecture
- **Framework**: Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- **Database**: Supabase (PostgreSQL + Auth)
- **Storage**: Cloudflare R2 (images)
- **Payments**: Razorpay
- **Shipping**: Shiprocket
- **State**: Zustand (persisted)
- **Styling**: Tailwind CSS v4 with `@theme inline`

## Key Next.js 16 Rules
- `params` and `searchParams` are Promises — must be `await`ed everywhere
- `cookies()` and `headers()` are async — must be `await`ed
- `middleware.ts` renamed to `proxy.ts` — export named `proxy`
- `next/image` uses `preload` instead of `priority`
- Viewport metadata exported separately from `metadata`
- `next lint` removed — use eslint directly (`npm run lint`)

## Project Structure
```
src/
  app/
    (auth)/            - Login, Register, Verify OTP
    (shop)/            - Cart, Checkout, Orders, Profile, Products, Search, Wishlist
    admin/             - Full admin panel (products, orders, coupons, banners, customers, analytics)
    api/               - All API route handlers
    proxy.ts           - Route protection (auth + admin guard)
    manifest.ts        - PWA manifest
    layout.tsx         - Root layout (fonts, SEO, metadata)
    providers.tsx      - Client providers (Header, Footer, Toast, WhatsApp)
  components/
    ui/                - Button, Input, Modal, Badge, Skeleton, Select, Rating, Toast
    layout/            - Header, Footer, CartDrawer, SearchModal, WhatsAppButton
    product/           - ProductCard, ProductGrid, ProductDetailClient, ProductListingClient
    home/              - HeroBanner, CategoryShowcase, Features, Newsletter, ProductSection
  lib/
    supabase/          - client.ts, server.ts, middleware.ts, queries.ts
    store/             - cart.ts, wishlist.ts, auth.ts, ui.ts (Zustand)
    utils/             - cn.ts, format.ts
    constants/         - categories.ts, site.ts
  types/               - index.ts (all TypeScript interfaces)
  hooks/               - useAuth.ts, useDebounce.ts
```

## Commands
- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run lint` — Run ESLint
- `npm start` — Start production server

## Environment Variables
Copy `.env.local` and fill real values for:
- Supabase URL + Anon Key
- Razorpay Key ID + Secret
- Shiprocket credentials
- Cloudflare R2 credentials
- Google OAuth Client ID
- VAPID keys for push notifications

## Database Setup
1. Run `supabase/migrations/00001_initial_schema.sql` in Supabase SQL editor
2. Run `supabase/seed.sql` for sample data
3. Enable Google OAuth in Supabase Auth settings
4. Create a profile for yourself: `INSERT INTO profiles ... role: 'admin'`
