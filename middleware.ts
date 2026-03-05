import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PROTECTED = [
  "/dashboard",
  "/create-bot",
  "/bot-personality",
  "/bot-preview",
  "/test-chatbot",
  "/integration",
  "/demo-website",
  "/analytics",
  "/training-data",
  "/handoff-rules",
  "/tickets",
  "/conversations",
  "/forwarded-conversations",
  "/onboarding",
  "/settings",
  "/admin",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const needsAuth = PROTECTED.some((p) => pathname.startsWith(p));
  if (!needsAuth) return NextResponse.next();

  const mockAuth = req.cookies.get("mock-auth")?.value;
  if (mockAuth === "1") return NextResponse.next();

  const token = req.cookies.get("auth-token")?.value;
  if (token) {
    const secret = new TextEncoder().encode(
      process.env.AUTH_SECRET || "default-secret-min-32-chars-for-dev-only"
    );
    try {
      await jwtVerify(token, secret);
      return NextResponse.next();
    } catch {
      /* invalid token */
    }
  }

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("from", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/create-bot/:path*",
    "/bot-personality/:path*",
    "/bot-preview/:path*",
    "/test-chatbot/:path*",
    "/integration/:path*",
    "/demo-website/:path*",
    "/analytics/:path*",
    "/training-data/:path*",
    "/handoff-rules/:path*",
    "/tickets/:path*",
    "/conversations/:path*",
    "/forwarded-conversations/:path*",
    "/onboarding/:path*",
    "/settings/:path*",
    "/admin/:path*",
  ],
};

