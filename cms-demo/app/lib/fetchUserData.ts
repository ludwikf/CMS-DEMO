import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { headers } from "next/headers";
import ApiError from "../components/ApiError";

export async function fetchUserData() {
  const session = await getServerSession(authOptions);
  const headersList = headers();
  const cookie = headersList.get("cookie");

  if (!session) {
    return;
  }

  const id = session.user.id;
  let userData;

  try {
    const requestHeaders = new Headers();
    if (cookie) {
      requestHeaders.append("Cookie", cookie);
    }
    const data = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/user/profile/${id}`,
      {
        method: "GET",
        cache: "no-cache",
        credentials: "include",
        headers: requestHeaders,
      }
    );
    if (!data.ok) {
      throw new Error(`Failed to fetch user data: ${data.statusText}`);
    }
    userData = await data.json();
  } catch (error) {
    throw new Error(`Fetching user data failed`);
  }

  return userData;
}
