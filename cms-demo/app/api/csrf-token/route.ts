import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { randomBytes, createHmac } from "crypto";
import { cookies } from "next/headers";

const CSRF_SECRET =
  process.env.CSRF_SECRET || "your-secret-key-change-in-production";
const CSRF_TOKEN_EXPIRY = 60 * 60 * 1000;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "host") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const timestamp = Date.now().toString();
    const randomPart = randomBytes(24).toString("hex");
    const tokenData = `${timestamp}:${randomPart}`;

    const signature = createHmac("sha256", CSRF_SECRET)
      .update(tokenData)
      .digest("hex");

    const csrfToken = Buffer.from(`${tokenData}:${signature}`).toString(
      "base64"
    );

    const cookieStore = cookies();
    cookieStore.set("csrf-token", csrfToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: CSRF_TOKEN_EXPIRY / 1000,
      path: "/",
    });

    return NextResponse.json({
      success: true,
      expiresAt: Date.now() + CSRF_TOKEN_EXPIRY,
    });
  } catch (error) {
    console.error("Error generating CSRF token:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
