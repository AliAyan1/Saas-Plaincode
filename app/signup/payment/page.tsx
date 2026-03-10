"use client";

import Link from "next/link";
import { useState } from "react";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Logo from "@/components/Logo";

export default function SignupPaymentPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayWithStripe = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not start checkout. Try again.");
        setLoading(false);
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError("Invalid response from server.");
    } catch {
      setError("Something went wrong. Try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <header className="border-b border-slate-800 bg-black">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 text-slate-100">
            <Logo size="md" />
            <span className="text-base font-semibold sm:text-lg">Plainbot</span>
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md p-8 shadow-soft-lg">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-slate-100">Complete your Pro setup</h1>
            <p className="mt-2 text-slate-400">
              Pro plan: $500/month. You'll be charged automatically each month. After payment you can create your chatbot from the dashboard.
            </p>
          </div>

          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 text-center">
            <p className="text-sm text-slate-400">
              We’ll send you a Secure payment by Stripe. Your card will be charged $500 now and then every month until you cancel.
            </p>
          </div>

          {error && (
            <p className="mt-4 text-sm text-red-400 bg-red-950/40 border border-red-900/40 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <Button
            type="button"
            variant="primary"
            fullWidth
            className="mt-6"
            disabled={loading}
            onClick={handlePayWithStripe}
          >
            {loading ? "Redirecting…" : "Pay $500/month with Stripe"}
          </Button>

          <p className="mt-6 text-center text-xs text-slate-500">
            You’ll see your dashboard next. We’re setting up your custom chatbot — you’ll see your working chatbot and snippet there.
          </p>
        </Card>
      </main>

      <footer className="py-4 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} Plainbot. All rights reserved.
      </footer>
    </div>
  );
}
