import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authMiddleware } from "./middleware/authMiddleware";
import { adminMiddleware } from "./middleware/adminMiddleware";
export { config } from "./middleware/config";

export default async function middleware(req: NextRequest) {
  try {
    const adminResult = await adminMiddleware(req);
    if (adminResult.status !== 200) {
      return adminResult;
    }

    const authResult = await authMiddleware(req);
    if (authResult.status !== 200) {
      return authResult;
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
