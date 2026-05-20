import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { headers } from "next/headers";

export async function fetchProductById(id: string) {
  try {
    const session = await getServerSession(authOptions);
    const headersList = headers();
    const cookie = headersList.get("cookie");

    if (!session) {
      return null;
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const requestHeaders = new Headers();
    if (cookie) {
      requestHeaders.append("Cookie", cookie);
    }

    const res = await fetch(`${baseUrl}/api/admin/products/${id}`, {
      cache: "no-store",
      credentials: "include",
      headers: requestHeaders,
    });

    if (!res.ok) {
      return null;
    }

    return await res.json();
  } catch (error) {
    return null;
  }
}
