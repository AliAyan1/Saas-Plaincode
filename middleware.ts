import { NextRequest, NextResponse } from "next/server";

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
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const needsAuth = PROTECTED.some((p) => pathname.startsWith(p));
  if (!needsAuth) return NextResponse.next();

  const cookie = req.cookies.get("mock-auth")?.value;
  if (cookie === "1") return NextResponse.next();

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
  ],
};

