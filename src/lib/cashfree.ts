export interface CashfreeOrderRequest {
  order_id: string;
  order_amount: number;
  order_currency: string;
  customer_details: {
    customer_id: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
  };
  order_meta?: {
    return_url?: string;
    notify_url?: string;
  };
}

export interface CashfreeOrderResponse {
  cf_order_id: string;
  order_id: string;
  order_status: string;
  order_amount: number;
  order_currency: string;
  payment_session_id: string;
  order_created_at: string;
}

export interface CashfreePaymentResponse {
  cf_payment_id: string;
  payment_id: string;
  order_id: string;
  payment_status: string;
  payment_amount: number;
  payment_method: string;
  payment_gateway: string;
  cf_session_id: string;
  payment_time: string;
}

async function cashfreeRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const appId = process.env.CASHFREE_APP_ID;
  const secretKey = process.env.CASHFREE_SECRET_KEY;
  const apiUrl = process.env.CASHFREE_API_URL || "https://api.cashfree.com/pg";

  if (!appId || !secretKey) {
    throw new Error("Cashfree credentials not configured");
  }

  const res = await fetch(`${apiUrl}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-client-id": appId,
      "x-client-secret": secretKey,
      "x-api-version": "2023-08-01",
      ...options.headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    const message =
      data?.message || data?.error || "Cashfree API request failed";
    throw new Error(message);
  }

  return data as T;
}

export async function createCashfreeOrder(
  params: CashfreeOrderRequest
): Promise<CashfreeOrderResponse> {
  return cashfreeRequest<CashfreeOrderResponse>("/orders", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function getCashfreeOrder(
  orderId: string
): Promise<CashfreeOrderResponse> {
  return cashfreeRequest<CashfreeOrderResponse>(`/orders/${orderId}`);
}

export async function getCashfreePayments(
  orderId: string
): Promise<CashfreePaymentResponse[]> {
  const data = await cashfreeRequest<{ payments: CashfreePaymentResponse[] }>(
    `/orders/${orderId}/payments`
  );
  return data.payments || [];
}

export function isCashfreeConfigured(): boolean {
  return Boolean(process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY);
}

export async function terminateCashfreeOrder(
  orderId: string
): Promise<void> {
  try {
    await cashfreeRequest(`/orders/${orderId}/terminate`, {
      method: "POST",
    });
  } catch {
    // Terminate is best-effort — don't fail checkout if it fails
  }
}
