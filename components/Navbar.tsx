"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Button from "./Button";
import Logo from "./Logo";

const APP_ROUTES = [
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

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const isAppArea = APP_ROUTES.some((p) => pathname.startsWith(p));

  const handleLogout = () => {
    try {
      document.cookie = "mock-auth=; path=/; max-age=0";
      window.localStorage.removeItem("mock-auth");
    } catch {
      // ignore
    }
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/95 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-slate-100 no-underline"
        >
          <Logo size="md" />
          <span className="text-base font-semibold leading-tight sm:text-lg">
            Ecommerce Support in One Click
          </span>
        </Link>

        <div className="flex items-center gap-3 sm:gap-4">
          {isAppArea ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-slate-300 hover:text-slate-100"
              >
                Dashboard
              </Link>
              <Link
                href="/create-bot"
                className="text-sm font-medium text-slate-300 hover:text-slate-100"
              >
                Create Bot
              </Link>
              <Link
                href="/integration"
                className="text-sm font-medium text-slate-300 hover:text-slate-100"
              >
                Integration
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="text-sm font-semibold text-slate-400 hover:text-slate-100"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-slate-400 hover:text-slate-100"
              >
                Login
              </Link>
              <Link href="/signup">
                <Button variant="primary">Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
