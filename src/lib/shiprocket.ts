const SHIPROCKET_API_URL = process.env.SHIPROCKET_API_URL || "https://apiv2.shiprocket.in/v1/external";

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAuthToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;

  if (!email || !password) {
    throw new Error("Shiprocket credentials not configured");
  }

  const res = await fetch(`${SHIPROCKET_API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to authenticate with Shiprocket");
  }

  const data = await res.json();
  cachedToken = {
    token: data.token,
    expiresAt: Date.now() + (data.expires_in || 25 * 60) * 1000,
  };
  return data.token;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();
  const res = await fetch(`${SHIPROCKET_API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || data.error || "Shiprocket API request failed");
  }

  return data as T;
}

export interface CreateShipmentParams {
  order_id: string;
  order_date: string;
  pickup_location: string;
  billing_customer_name: string;
  billing_last_name?: string;
  billing_address: string;
  billing_city: string;
  billing_state: string;
  billing_pincode: string;
  billing_email: string;
  billing_phone: string;
  shipping_is_billing: boolean;
  shipping_customer_name?: string;
  shipping_address?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_pincode?: string;
  shipping_email?: string;
  shipping_phone?: string;
  order_items: { name: string; sku: string; units: number; selling_price: number }[];
  payment_method: "Prepaid" | "COD";
  sub_total: number;
  length?: number;
  breadth?: number;
  height?: number;
  weight?: number;
}

export interface ShiprocketOrderResponse {
  order_id: number;
  shipment_id: number;
  status: string;
  onboarding_completed_now: number;
  awb_code: string;
  courier_company_id: number;
  courier_name: string;
}

export interface ShiprocketTrackResponse {
  track_url: string;
  shipment_status: string;
  pickup_date: string | null;
  delivered_date: string | null;
  awb_code: string;
  current_status: string;
  status_code: number;
  etd: string;
  current_location: string | null;
  estimated_delivery: string | null;
  tracking_data: { status: string; location: string; date: string }[];
}

export async function createShipment(
  params: CreateShipmentParams
): Promise<ShiprocketOrderResponse> {
  const data = await apiRequest<ShiprocketOrderResponse>(
    "/orders/create/adhoc",
    {
      method: "POST",
      body: JSON.stringify(params),
    }
  );
  return data;
}

export async function generateAWB(
  shipmentId: number,
  courierId: number
): Promise<{ awb_code: string; courier_name: string; status: string }> {
  const data = await apiRequest<{ awb_code: string; courier_name: string; status: string }>(
    "/courier/assign/awb",
    {
      method: "POST",
      body: JSON.stringify({
        shipment_id: shipmentId,
        courier_id: courierId,
      }),
    }
  );
  return data;
}

export async function trackShipment(
  shipmentId: number
): Promise<ShiprocketTrackResponse> {
  const data = await apiRequest<ShiprocketTrackResponse>(
    `/courier/track?shipment_id=${shipmentId}`
  );
  return data;
}

export async function trackByAWB(awbCode: string): Promise<ShiprocketTrackResponse> {
  const data = await apiRequest<ShiprocketTrackResponse>(
    `/courier/track/awb/${awbCode}`
  );
  return data;
}

export async function trackByOrderId(orderId: number): Promise<ShiprocketTrackResponse> {
  const data = await apiRequest<ShiprocketTrackResponse>(
    `/courier/track/shipment/${orderId}`
  );
  return data;
}

export async function getPickupLocations(): Promise<
  { pickup_location: string; address: string; phone: string; email: string }[]
> {
  const data = await apiRequest<{
    data: { pickup_location: string; address: string; phone: string; email: string }[];
  }>("/settings/company/pickup");
  return data.data || [];
}

export async function getCourierServiceability(
  pickupPostcode: string,
  deliveryPostcode: string,
  weight: number
): Promise<{ courier_company_id: number; courier_name: string; rate: number; estimated_delivery_days: number }[]> {
  const data = await apiRequest<{
    data: { available_courier_companies: { courier_company_id: number; courier_name: string; rate: number; estimated_delivery_days: number }[] };
  }>(
    `/courier/serviceability/?pickup_postcode=${pickupPostcode}&delivery_postcode=${deliveryPostcode}&weight=${weight}&cod=0`
  );
  return data.data?.available_courier_companies || [];
}

export async function cancelShipment(
  shipmentId: number
): Promise<{ status: string; message: string }> {
  return apiRequest("/orders/cancel/shipment", {
    method: "POST",
    body: JSON.stringify({ shipment_id: shipmentId }),
  });
}

export async function generateLabel(
  shipmentId: number
): Promise<{ label_url: string }> {
  return apiRequest("/courier/generate/label", {
    method: "POST",
    body: JSON.stringify({ shipment_id: shipmentId }),
  });
}

export async function generateManifest(
  shipmentId: number
): Promise<{ manifest_url: string }> {
  return apiRequest("/courier/generate/manifest", {
    method: "POST",
    body: JSON.stringify({ shipment_id: shipmentId }),
  });
}

export async function returnShipment(
  shipmentId: number,
  reason: string
): Promise<{ status: string }> {
  return apiRequest("/orders/create/return", {
    method: "POST",
    body: JSON.stringify({ shipment_id: shipmentId, reason }),
  });
}

export async function getOrderDetails(
  shiprocketOrderId: number
): Promise<Record<string, unknown>> {
  return apiRequest(`/orders/show/${shiprocketOrderId}`);
}

export async function getShipmentList(params?: {
  page?: number;
  per_page?: number;
  status?: string;
}): Promise<{ data: Record<string, unknown>[]; total: number }> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.per_page) query.set("per_page", String(params.per_page));
  if (params?.status) query.set("status", params.status);
  return apiRequest(`/orders?${query.toString()}`);
}
