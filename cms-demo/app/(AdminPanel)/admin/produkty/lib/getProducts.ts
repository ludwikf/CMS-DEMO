import { cookies } from "next/headers";

interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
  template?: string;
}

interface PaginationResponse {
  products: any[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export async function getProducts(params: PaginationParams = {}) {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", params.page.toString());
    if (params.limit) searchParams.set("limit", params.limit.toString());
    if (params.search) searchParams.set("search", params.search);
    if (params.category) searchParams.set("category", params.category);
    if (params.status) searchParams.set("status", params.status);
    if (params.template) searchParams.set("template", params.template);

    const url = `${
      process.env.NEXTAUTH_URL || "http://localhost:3000"
    }/api/admin/products${
      searchParams.toString() ? `?${searchParams.toString()}` : ""
    }`;

    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        Cookie: cookieHeader,
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch products: ${res.status}`);
    }

    const data: PaginationResponse = await res.json();
    return data;
  } catch (error) {
    console.error("Error fetching products:", error);
    return {
      products: [],
      pagination: {
        page: 1,
        limit: 10,
        totalCount: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
  }
}
