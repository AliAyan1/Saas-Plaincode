"use client";

import Link from "next/link";
import { FormEvent, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Button from "@/components/Button";
import Input from "@/components/Input";
import Card from "@/components/Card";
import Logo from "@/components/Logo";

function SignupContent() {
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan");
  const plan = planParam === "pro" ? "pro" : planParam === "custom" ? "custom" : "free";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    const name = (fd.get("name") as string)?.trim() || null;
    const email = (fd.get("email") as string)?.trim()?.toLowerCase() ?? "";
    const password = (fd.get("password") as string) ?? "";

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, plan }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Signup failed.");
        setLoading(false);
        return;
      }
      const userPlan = data.user?.plan === "pro" ? "pro" : data.user?.plan === "custom" ? "custom" : "free";
      try {
        const raw = window.localStorage.getItem("bot-state-v2");
        const state = raw ? JSON.parse(raw) : {};
        window.localStorage.setItem("bot-state-v2", JSON.stringify({ ...state, userPlan }));
      } catch {
        /* ignore */
      }
      if (data.redirectToPayment) {
        window.location.href = "/signup/payment";
      } else if (data.redirectTo) {
        window.location.href = data.redirectTo;
      } else {
        window.location.href = "/onboarding/store-type";
      }
    } catch {
      setError("Signup failed. Try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <header className="border-b border-slate-800 bg-black">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 text-slate-100">
            <Logo size="md" />
            <span className="text-base font-semibold sm:text-lg">
              Plainbot
            </span>
          </Link>
          <p className="text-sm text-slate-400">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary-400 hover:text-primary-300">
              Log in
            </Link>
          </p>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md p-8 shadow-soft-lg">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-slate-100">Create your account</h1>
            <p className="mt-2 text-slate-400">
              Get started with your 14-day free trial.
            </p>
            {plan === "pro" && (
              <p className="mt-2 text-sm text-primary-400 font-medium">
                You’re signing up for the Pro plan ($500/month).
              </p>
            )}
            {plan === "custom" && (
              <p className="mt-2 text-sm text-primary-400 font-medium">
                You're signing up for Custom — we'll send a Calendly link. Payment after the meeting.
              </p>
            )}
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              name="name"
              label="Full Name"
              type="text"
              placeholder="Jane Doe"
              autoComplete="name"
              required
            />
            <Input
              name="email"
              label="Business Email"
              type="email"
              placeholder="jane@company.com"
              autoComplete="email"
              required
            />
            <Input
              name="companyName"
              label="Company Name"
              type="text"
              placeholder="Acme E-commerce"
              autoComplete="organization"
            />
            <Input
              name="password"
              label="Password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              minLength={6}
              required
            />
            {error && (
              <p className="text-sm text-red-400 bg-red-950/40 border border-red-900/40 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-700 text-primary-500 focus:ring-primary-500"
              />
              <span className="text-sm text-slate-400">
                I manage an e-commerce store and agree to the{" "}
                <Link href="/terms" className="text-primary-400 hover:underline">
                  Terms of Service
                </Link>
                .
              </span>
            </label>
            <Button type="submit" variant="primary" fullWidth disabled={loading}>
              {loading ? "Creating..." : "Create Account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            By signing up, you agree to our 14-day trial and{" "}
            <Link href="/privacy" className="text-primary-400 hover:underline">
              Privacy Policy
            </Link>
            .
          </p>

          <p className="mt-4 text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary-400 hover:text-primary-300">
              Log in
            </Link>
          </p>
        </Card>
      </main>

      <footer className="py-4 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} Plainbot. All rights reserved.
      </footer>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col bg-black items-center justify-center">
        <p className="text-slate-400">Loading…</p>
      </div>
    }>
      <SignupContent />
    </Suspense>
  );
}
