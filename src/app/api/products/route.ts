import { type NextRequest } from "next/server";
import { getProducts } from "@/lib/supabase/queries";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const category = searchParams.get("category") || undefined;
    const search = searchParams.get("search") || undefined;
    const sort = searchParams.get("sort") || undefined;
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 20;
    const minPrice = searchParams.get("minPrice")
      ? Number(searchParams.get("minPrice"))
      : undefined;
    const maxPrice = searchParams.get("maxPrice")
      ? Number(searchParams.get("maxPrice"))
      : undefined;
    const sizes = searchParams.get("sizes")?.split(",").filter(Boolean);
    const colors = searchParams.get("colors")?.split(",").filter(Boolean);

    const result = await getProducts({
      category,
      search,
      sort,
      page,
      limit,
      minPrice,
      maxPrice,
      sizes,
      colors,
    });

    return Response.json({
      success: true,
      data: result,
    });
  } catch (_error) {
    const message =
      _error instanceof Error ? _error.message : "Failed to fetch products";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
