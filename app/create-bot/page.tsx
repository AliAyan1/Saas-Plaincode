"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Card from "@/components/Card";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { useBot } from "@/components/BotContext";

export default function CreateBotPage() {
  const router = useRouter();
  const { setScrapedData } = useBot();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = url.trim();
    if (!trimmed) {
      setError("Please enter a valid website URL.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to scrape website. Please try another URL.");
      }

      const data = await res.json();
      setScrapedData({
        url: trimmed,
        title: data.title || "",
        description: data.description || "",
        content: data.content || "",
        products: Array.isArray(data.products) ? data.products : [],
      });
      // First show the real‑time product inventory view, then user can continue
      // to personality selection from there.
      router.push("/training-data");
    } catch (err: any) {
      setError(err?.message || "Something went wrong while scraping the website.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-80px)] bg-slate-950 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Connect your store</h1>
            <p className="mt-2 text-slate-400">
              Step 1 of 3 — Paste your ecommerce website URL. We&apos;ll automatically
              scrape your content and use it to train the assistant.
            </p>
          </div>

          <Card className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Store URL"
                type="url"
                placeholder="https://yourstore.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              {error && (
                <p className="text-sm text-red-400 bg-red-950/40 border border-red-900/40 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" disabled={loading}>
                  {loading ? "Scraping..." : "Scrape Website"}
                </Button>
                <p className="text-xs text-slate-500">
                  We only use this content for this demo session. Nothing is stored in a
                  database.
                </p>
              </div>
            </form>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
}

