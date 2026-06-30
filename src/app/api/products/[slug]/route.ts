import { NextRequest } from "next/server";
import { getProduct } from "@/lib/supabase/queries";
import type { Product } from "@/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const data = await getProduct(slug);
    return Response.json({ success: true, data: data as Product });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Product not found";
    return Response.json({ success: false, error: message }, { status: 404 });
  }
}
