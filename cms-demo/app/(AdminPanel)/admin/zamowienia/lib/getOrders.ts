import { cookies } from "next/headers";
import { Order } from "../types";

interface GetOrdersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  deliveryMethod?: string;
}

interface OrdersResponse {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export async function getOrders(params: GetOrdersParams = {}) {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", params.page.toString());
    if (params.limit) searchParams.set("limit", params.limit.toString());
    if (params.search) searchParams.set("search", params.search);
    if (params.status) searchParams.set("status", params.status);
    if (params.deliveryMethod)
      searchParams.set("deliveryMethod", params.deliveryMethod);

    const url = `${
      process.env.NEXTAUTH_URL || "http://localhost:3000"
    }/api/admin/orders${
      searchParams.toString() ? `?${searchParams.toString()}` : ""
    }`;

    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        Cookie: cookieHeader,
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch orders: ${res.status}`);
    }

    const data: OrdersResponse = await res.json();
    return data;
  } catch (error) {
    console.error("Error fetching orders:", error);
    return {
      orders: [],
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
