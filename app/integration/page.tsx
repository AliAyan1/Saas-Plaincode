"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Card from "@/components/Card";
import Button from "@/components/Button";
import { useRouter } from "next/navigation";
import { useState } from "react";

const WIDGET_SNIPPET = `<script src="https://yourapp.com/widget.js"></script>`;

export default function IntegrationPage() {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(WIDGET_SNIPPET);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-80px)] bg-slate-950 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Integration</h1>
            <p className="mt-2 text-slate-400">
              Copy the script below to embed the widget on any ecommerce site, or open the
              demo website we&apos;ve included for this project.
            </p>
          </div>

          <Card className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-100">Option 1 — Copy script</h2>
            <div className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-xs font-mono text-slate-100">
              {WIDGET_SNIPPET}
            </div>
            <Button variant="secondary" onClick={handleCopy}>
              {copied ? "Copied!" : "Copy Script"}
            </Button>
          </Card>

          <Card className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-100">
              Option 2 — View demo website
            </h2>
            <p className="text-sm text-slate-400">
              We&apos;ve included a simple mock ecommerce storefront that already has the
              chatbot widget embedded so you can show the full experience to clients.
            </p>
            <Button variant="primary" onClick={() => router.push("/demo-website")}>
              Open Demo Website
            </Button>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
}

