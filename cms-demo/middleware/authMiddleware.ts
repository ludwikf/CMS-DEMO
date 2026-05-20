import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function authMiddleware(req: NextRequest) {
  const token = await getToken({ req });
  const path = req.nextUrl.pathname;

  const protectedPrefixes = [
    "/nowe-zamowienie",
    "/zamowienia",
    "/koszyk",
  ];

  const publicRoutes = ["/"];

  const requiresAuth = protectedPrefixes.some((prefix) =>
    path.startsWith(prefix)
  );

  if (requiresAuth && !token?.id) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  if (publicRoutes.includes(path) && token?.id) {
    return NextResponse.redirect(new URL("/nowe-zamowienie", req.nextUrl));
  }

  return NextResponse.next();
}
