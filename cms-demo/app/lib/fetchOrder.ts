import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { headers } from "next/headers";

export async function fetchOrder(orderId: string) {
  const headersList = headers();
  const cookie = headersList.get("cookie");
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error("User is not authenticated");
  }

  const userId = session.user.id;
  let order;
  try {
    const requestHeaders = new Headers();
    if (cookie) {
      requestHeaders.append("Cookie", cookie);
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/user/orders/${orderId}?userId=${userId}`,
      {
        method: "GET",
        credentials: "include",
        headers: requestHeaders,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch order: ${response.statusText}`);
    }

    order = await response.json();
  } catch (error) {
    throw new Error(`Fetching order failed`);
  }

  return order;
}
