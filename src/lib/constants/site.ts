export const SITE = {
  name: "HAINJU",
  tagline: "Elevate Your Style",
  description: "Premium self-designed clothing and exquisite artificial jewellery for the modern trendsetter.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  email: "hello@hainju.com",
  phone: "+91 12345 67890",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "911234567890",
  address: "123 Fashion Street, Boutique Lane, Mumbai - 400001, India",
  social: {
    instagram: "https://instagram.com/hainju",
    facebook: "https://facebook.com/hainju",
    twitter: "https://twitter.com/hainju",
    pinterest: "https://pinterest.com/hainju",
  },
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
    { href: "/profile", label: "My Account" },
    { href: "/orders", label: "My Orders" },
    { href: "/wishlist", label: "Wishlist" },
    { href: "/cart", label: "Shopping Cart" },
  ],
  help: [
    { href: "/contact", label: "Contact Us" },
    { href: "/shipping", label: "Shipping & Delivery" },
    { href: "/returns", label: "Returns & Exchanges" },
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
