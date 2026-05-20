import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function adminMiddleware(req: NextRequest) {
  const token = await getToken({ req });
  const path = req.nextUrl.pathname;

  const isAdminRoute = path.startsWith("/admin");
  const isAdminApi = path.startsWith("/api/admin");

  const isAdmin = token?.role === "host" || token?.role === "pracownik";

  if (isAdminRoute && !isAdmin) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  if (isAdminApi) {
    if (!token) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    if (!isAdmin) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  return NextResponse.next();
}
