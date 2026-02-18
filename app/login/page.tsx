"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import Input from "@/components/Input";
import Card from "@/components/Card";
import Logo from "@/components/Logo";
import GoogleIcon from "@/components/GoogleIcon";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const redirectTo = useMemo(() => {
    if (typeof window === "undefined") return "/dashboard";
    const params = new URLSearchParams(window.location.search);
    return params.get("from") || "/dashboard";
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const DEMO_EMAIL = "demo@ecommerce.ai";
    const DEMO_PASSWORD = "123456";

    if (email.trim() === DEMO_EMAIL && password === DEMO_PASSWORD) {
      setLoading(true);
      try {
        document.cookie = "mock-auth=1; path=/; max-age=86400";
        window.localStorage.setItem("mock-auth", "1");
      } catch {
        // ignore
      }
      router.push(redirectTo);
      return;
    }

    setError("Invalid credentials. Use demo@ecommerce.ai / 123456.");
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <header className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 text-slate-100">
            <Logo size="md" />
            <span className="text-base font-semibold sm:text-lg">
              Ecommerce Support in One Click
            </span>
          </Link>
          <p className="text-sm text-slate-400">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-medium text-primary-400 hover:text-primary-300">
              Sign up
            </Link>
          </p>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md p-8 shadow-soft-lg">
          <div className="mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2 text-slate-100">
              <Logo size="sm" />
              <span className="font-semibold">Ecommerce Support in One Click</span>
            </Link>
            <h1 className="mt-6 text-2xl font-bold text-slate-100">Welcome back</h1>
            <p className="mt-2 text-slate-400">
              Enter your credentials to access your dashboard.
            </p>
          </div>

          <Button
            variant="secondary"
            fullWidth
            className="flex items-center justify-center gap-2"
          >
            <GoogleIcon />
            Continue with Google
          </Button>

          <div className="my-6 flex items-center gap-4">
            <span className="h-px flex-1 bg-slate-600" />
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              or
            </span>
            <span className="h-px flex-1 bg-slate-600" />
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Email Address"
              type="email"
              placeholder="name@company.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-medium text-slate-300">Password</label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary-400 hover:text-primary-300"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <p className="text-sm text-red-400 bg-red-950/40 border border-red-900/40 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            <Button type="submit" variant="primary" fullWidth disabled={loading}>
              {loading ? "Logging in..." : "Log in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            By logging in, you agree to our{" "}
            <Link href="/terms" className="text-primary-400 hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-primary-400 hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </Card>
      </main>

      <footer className="py-4 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} Ecommerce Support in One Click. All rights reserved.
      </footer>
    </div>
  );
}
