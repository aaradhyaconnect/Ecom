export const SITE = {
  name: "Arcon Style",
  tagline: "Elevate Your Style",
  description: "Premium self-designed clothing and exquisite artificial jewellery for the modern trendsetter.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  email: "hello@arconstyle.com",
  phone: "+91 12345 67890",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "911234567890",
  address: "123 Fashion Street, Boutique Lane, Mumbai - 400001, India",
  social: {
    instagram: "https://instagram.com/arconstyle",
    facebook: "https://facebook.com/arconstyle",
    twitter: "https://twitter.com/arconstyle",
    pinterest: "https://pinterest.com/arconstyle",
  },
} as const;

export const SHIPPING = {
  THRESHOLD: 999,
  CHARGE: 49,
} as const;

export const NAV_LINKS = [
  { href: "/products/women-clothing", label: "Women's Clothing" },
  { href: "/products/artificial-jewellery", label: "Jewellery" },
  { href: "/products/new-arrivals", label: "New Arrivals" },
  { href: "/products/best-sellers", label: "Best Sellers" },
  { href: "/products/sale", label: "Sale" },
] as const;

export const FOOTER_LINKS = {
  shop: [
    { href: "/products/women-clothing", label: "Women's Clothing" },
    { href: "/products/artificial-jewellery", label: "Artificial Jewellery" },
    { href: "/products/new-arrivals", label: "New Arrivals" },
    { href: "/products/best-sellers", label: "Best Sellers" },
    { href: "/products/sale", label: "Sale" },
  ],
  customer: [
    { href: "/account", label: "My Account" },
    { href: "/account/orders", label: "My Orders" },
    { href: "/account/wishlist", label: "Wishlist" },
    { href: "/cart", label: "Shopping Cart" },
  ],
  help: [
    { href: "/contact", label: "Contact Us" },
    { href: "/shipping", label: "Shipping & Delivery" },
    { href: "/returns", label: "Returns & Refunds" },
    { href: "/faq", label: "FAQ" },
    { href: "/size-guide", label: "Size Guide" },
  ],
  company: [
    { href: "/about", label: "About Us" },
    { href: "/careers", label: "Careers" },
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
  ],
} as const;
