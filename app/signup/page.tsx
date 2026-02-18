"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import Input from "@/components/Input";
import Card from "@/components/Card";
import Logo from "@/components/Logo";
import GoogleIcon from "@/components/GoogleIcon";

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      document.cookie = "mock-auth=1; path=/; max-age=86400";
      window.localStorage.setItem("mock-auth", "1");
    } catch {
      // ignore
    }
    router.push("/dashboard");
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
          </div>

          <Button
            variant="secondary"
            fullWidth
            className="mb-6 flex items-center justify-center gap-2"
          >
            <GoogleIcon />
            Continue with Google
          </Button>

          <div className="mb-6 flex items-center gap-4">
            <span className="h-px flex-1 bg-slate-600" />
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              or continue with email
            </span>
            <span className="h-px flex-1 bg-slate-600" />
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Full Name"
              type="text"
              placeholder="Jane Doe"
              autoComplete="name"
            />
            <Input
              label="Business Email"
              type="email"
              placeholder="jane@company.com"
              autoComplete="email"
            />
            <Input
              label="Company Name"
              type="text"
              placeholder="Acme E-commerce"
              autoComplete="organization"
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
            />
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
        © {new Date().getFullYear()} Ecommerce Support in One Click. All rights reserved.
      </footer>
    </div>
  );
}
