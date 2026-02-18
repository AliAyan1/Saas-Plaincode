"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Card from "@/components/Card";
import Button from "@/components/Button";
import { useBot } from "@/components/BotContext";
import { useRouter } from "next/navigation";

function buildDescription(url: string | undefined, personality: string | null) {
  const base = url ? `An AI assistant for ${url}` : "An AI assistant for your ecommerce store";
  switch (personality) {
    case "Friendly":
      return `${base} that answers in a warm, conversational tone and helps customers quickly find products, orders, and support.`;
    case "Professional":
      return `${base} that replies with crisp, accurate, and on-brand messaging suitable for serious ecommerce operations.`;
    case "Sales-focused":
      return `${base} that nudges customers toward purchases, suggests relevant products, and reduces cart abandonment.`;
    case "Premium Luxury":
      return `${base} that feels like a personal concierge, ideal for luxury brands with high-touch customer experiences.`;
    default:
      return `${base} that can answer questions about products, shipping, and policies using your website content.`;
  }
}

export default function BotPreviewPage() {
  const router = useRouter();
  const { scrapedData, personality } = useBot();

  const description = buildDescription(scrapedData?.url, personality);

  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-80px)] bg-slate-950 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Preview your assistant</h1>
            <p className="mt-2 text-slate-400">
              Step 3 of 3 — Confirm the setup and jump into a live test chat.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="space-y-3">
              <h2 className="text-sm font-semibold text-slate-200">
                Configuration summary
              </h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-400">Website</dt>
                  <dd className="text-right text-slate-100">
                    {scrapedData?.url || "Not connected"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-400">Personality</dt>
                  <dd className="text-right text-slate-100">
                    {personality ?? "Not selected"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-400">Plan</dt>
                  <dd className="text-right text-primary-400">Starter (15 chats)</dd>
                </div>
              </dl>
            </Card>

            <Card className="space-y-3">
              <h2 className="text-sm font-semibold text-slate-200">
                Generated bot description
              </h2>
              <p className="text-sm text-slate-300">{description}</p>
            </Card>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button variant="secondary" onClick={() => router.push("/bot-personality")}>
              Back to personality
            </Button>
            <Button variant="primary" onClick={() => router.push("/test-chatbot")}>
              Test Chatbot
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

