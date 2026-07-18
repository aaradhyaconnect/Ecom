import { Resend } from "resend";
import { SITE } from "@/lib/constants/site";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = `${SITE.name} <${process.env.EMAIL_FROM_ADDRESS || "orders@g2istyle.com"}>`;

function formatPrice(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function baseLayout(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FAF9F6;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF9F6;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:4px;overflow:hidden;">
  <tr><td style="background:#111111;padding:24px 40px;text-align:center;">
    <h1 style="color:#ffffff;font-size:20px;letter-spacing:2px;margin:0;font-weight:400;">${SITE.name.toUpperCase()}</h1>
  </td></tr>
  <tr><td style="padding:40px;">${content}</td></tr>
  <tr><td style="background:#F8F8F8;padding:24px 40px;text-align:center;border-top:1px solid #E5E5E5;">
    <p style="color:#999999;font-size:12px;margin:0;">© ${new Date().getFullYear()} ${SITE.name}. All rights reserved.</p>
    <p style="color:#999999;font-size:12px;margin:8px 0 0;">${SITE.address}</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

type OrderItem = {
  name?: string;
  quantity?: number;
  price?: number;
  size?: string;
  color?: string;
};

type OrderEmailData = {
  orderId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  subtotal: number;
  shippingCharge: number;
  discount: number;
  total: number;
  paymentMethod: string;
  shippingAddress: {
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    phone?: string;
  };
};

export async function sendOrderConfirmation(data: OrderEmailData) {
  if (!resend) return;

  const itemsHtml = data.items
    .map(
      (item) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #F0F0F0;color:#333;font-size:14px;">
        ${item.name || "Product"} × ${item.quantity || 1}
        ${item.size ? `<span style="color:#999;"> — Size: ${item.size}</span>` : ""}
        ${item.color ? `<span style="color:#999;"> — Color: ${item.color}</span>` : ""}
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #F0F0F0;text-align:right;color:#333;font-size:14px;">
        ${formatPrice((item.price || 0) * (item.quantity || 1))}
      </td>
    </tr>`
    )
    .join("");

  const content = `
    <h2 style="color:#111;font-size:22px;margin:0 0 8px;">Order Confirmed</h2>
    <p style="color:#666;font-size:14px;margin:0 0 24px;">Thank you for your order, ${data.customerName}!</p>

    <div style="background:#F8F8F8;padding:16px;border-radius:4px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#666;">Order ID</p>
      <p style="margin:4px 0 0;font-size:16px;color:#111;font-weight:600;">${data.orderId}</p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <thead>
        <tr style="border-bottom:2px solid #111;">
          <th style="padding:8px 0;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#999;">Item</th>
          <th style="padding:8px 0;text-align:right;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#999;">Total</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr><td style="padding:6px 0;color:#666;font-size:14px;">Subtotal</td><td style="padding:6px 0;text-align:right;color:#333;font-size:14px;">${formatPrice(data.subtotal)}</td></tr>
      <tr><td style="padding:6px 0;color:#666;font-size:14px;">Shipping</td><td style="padding:6px 0;text-align:right;color:#333;font-size:14px;">${data.shippingCharge === 0 ? "Free" : formatPrice(data.shippingCharge)}</td></tr>
      ${data.discount > 0 ? `<tr><td style="padding:6px 0;color:#666;font-size:14px;">Discount</td><td style="padding:6px 0;text-align:right;color:#16a34a;font-size:14px;">-${formatPrice(data.discount)}</td></tr>` : ""}
      <tr><td style="padding:12px 0 6px;border-top:2px solid #111;color:#111;font-size:16px;font-weight:600;">Total</td><td style="padding:12px 0 6px;border-top:2px solid #111;text-align:right;color:#111;font-size:16px;font-weight:600;">${formatPrice(data.total)}</td></tr>
    </table>

    <div style="margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#999;">Shipping Address</p>
      <p style="margin:0;color:#333;font-size:14px;line-height:1.6;">
        ${data.shippingAddress.name || data.customerName}<br/>
        ${data.shippingAddress.address || ""}<br/>
        ${data.shippingAddress.city || ""}, ${data.shippingAddress.state || ""} — ${data.shippingAddress.pincode || ""}<br/>
        Phone: ${data.shippingAddress.phone || "N/A"}
      </p>
    </div>

    <div style="background:#F8F8F8;padding:16px;border-radius:4px;">
      <p style="margin:0;font-size:13px;color:#666;">Payment Method</p>
      <p style="margin:4px 0 0;font-size:14px;color:#111;text-transform:uppercase;">${data.paymentMethod}</p>
    </div>

    <p style="color:#666;font-size:13px;margin:24px 0 0;">We'll send you another email when your order ships. You can track your order anytime from your account.</p>
  `;

  await resend.emails.send({
    from: FROM,
    to: data.customerEmail,
    subject: `Order Confirmed — ${data.orderId}`,
    html: baseLayout(content),
  });
}

type StatusEmailData = {
  orderId: string;
  customerName: string;
  customerEmail: string;
  status: string;
  trackingId?: string;
  courierName?: string;
  estimatedDelivery?: string;
  trackingUrl?: string;
};

export async function sendOrderStatusUpdate(data: StatusEmailData) {
  if (!resend) return;

  const statusLabels: Record<string, string> = {
    confirmed: "Your order has been confirmed",
    processing: "Your order is being processed",
    packed: "Your order has been packed and is ready to ship",
    shipped: "Your order has been shipped",
    "out-for-delivery": "Your order is out for delivery",
    delivered: "Your order has been delivered",
    cancelled: "Your order has been cancelled",
    returned: "Your order has been returned",
  };

  const subject: Record<string, string> = {
    confirmed: "Order Confirmed",
    processing: "Order Processing",
    packed: "Order Packed",
    shipped: "Order Shipped",
    "out-for-delivery": "Out for Delivery",
    delivered: "Order Delivered",
    cancelled: "Order Cancelled",
    returned: "Order Returned",
  };

  const trackingHtml =
    data.status === "shipped" || data.status === "out-for-delivery"
      ? `
    <div style="background:#F8F8F8;padding:16px;border-radius:4px;margin-bottom:24px;">
      <p style="margin:0 0 8px;font-size:13px;color:#666;">Tracking Details</p>
      ${data.trackingId ? `<p style="margin:0;font-size:14px;color:#111;">Tracking ID: <strong>${data.trackingId}</strong></p>` : ""}
      ${data.courierName ? `<p style="margin:4px 0;font-size:14px;color:#111;">Courier: ${data.courierName}</p>` : ""}
      ${data.estimatedDelivery ? `<p style="margin:4px 0;font-size:14px;color:#111;">Estimated Delivery: ${data.estimatedDelivery}</p>` : ""}
      ${data.trackingUrl ? `<p style="margin:8px 0 0;"><a href="${data.trackingUrl}" style="color:#D4AF37;text-decoration:underline;font-size:14px;">Track your order →</a></p>` : ""}
    </div>`
      : "";

  const content = `
    <h2 style="color:#111;font-size:22px;margin:0 0 8px;">${subject[data.status] || "Order Update"}</h2>
    <p style="color:#666;font-size:14px;margin:0 0 8px;">Hi ${data.customerName},</p>
    <p style="color:#333;font-size:15px;margin:0 0 24px;">${statusLabels[data.status] || "Your order status has been updated."}</p>

    <div style="background:#F8F8F8;padding:16px;border-radius:4px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#666;">Order ID</p>
      <p style="margin:4px 0 0;font-size:16px;color:#111;font-weight:600;">${data.orderId}</p>
    </div>

    ${trackingHtml}

    <p style="color:#666;font-size:13px;margin:24px 0 0;">You can view your order details anytime from your account.</p>
  `;

  await resend.emails.send({
    from: FROM,
    to: data.customerEmail,
    subject: `${subject[data.status] || "Order Update"} — ${data.orderId}`,
    html: baseLayout(content),
  });
}
