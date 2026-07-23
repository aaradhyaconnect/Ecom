import crypto from "crypto";

const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

export function isRazorpayConfigured(): boolean {
  return Boolean(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET);
}

export function getRazorpayKeyId(): string {
  if (!RAZORPAY_KEY_ID) throw new Error("Razorpay Key ID not configured");
  return RAZORPAY_KEY_ID;
}

export interface RazorpayOrderParams {
  amount: number;
  currency: string;
  receipt: string;
}

export interface RazorpayOrderResponse {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  currency: string;
  receipt: string;
  status: string;
  created_at: number;
}

async function razorpayRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay credentials not configured");
  }

  const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64");

  const res = await fetch(`https://api.razorpay.com/v1${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
      ...options.headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    const message = data?.error?.description || data?.error || "Razorpay API request failed";
    throw new Error(message);
  }

  return data as T;
}

export async function createRazorpayOrder(
  params: RazorpayOrderParams
): Promise<RazorpayOrderResponse> {
  return razorpayRequest<RazorpayOrderResponse>("/orders", {
    method: "POST",
    body: JSON.stringify({
      amount: Math.round(params.amount * 100),
      currency: params.currency,
      receipt: params.receipt,
    }),
  });
}

export async function fetchRazorpayOrder(
  orderId: string
): Promise<RazorpayOrderResponse> {
  return razorpayRequest<RazorpayOrderResponse>(`/orders/${orderId}`);
}

export function verifyRazorpaySignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): boolean {
  if (!RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay credentials not configured");
  }

  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  return expectedSignature === razorpaySignature;
}
