"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Card from "@/components/Card";
import Button from "@/components/Button";
import { useBot, Personality } from "@/components/BotContext";
import { useRouter } from "next/navigation";

const PERSONALITIES: { id: Personality; title: string; description: string }[] = [
  {
    id: "Friendly",
    title: "Friendly",
    description: "Warm, casual tone that feels like chatting with a human.",
  },
  {
    id: "Professional",
    title: "Professional",
    description: "Clear, concise, and on-brand for serious ecommerce stores.",
  },
  {
    id: "Sales-focused",
    title: "Sales-focused",
    description: "Always nudging towards conversion, upsells, and cross-sells.",
  },
  {
    id: "Premium Luxury",
    title: "Premium Luxury",
    description: "High-end, concierge-style tone for luxury brands.",
  },
];

export default function BotPersonalityPage() {
  const router = useRouter();
  const { scrapedData, personality, setPersonality } = useBot();

  const handleSelect = (p: Personality) => {
    setPersonality(p);
    router.push("/bot-preview");
  };

  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-80px)] bg-slate-950 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Choose your bot personality</h1>
            <p className="mt-2 text-slate-400">
              Step 2 of 3 — Pick how your AI assistant should speak to customers.
            </p>
            {scrapedData && (
              <p className="mt-1 text-xs text-slate-500">
                Connected store:{" "}
                <span className="text-slate-300">{scrapedData.url}</span>
              </p>
            )}
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {PERSONALITIES.map((p) => {
              const selected = personality === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelect(p.id)}
                  className="text-left"
                >
                  <Card
                    className={`h-full transition-colors ${
                      selected ? "border-primary-500 bg-primary-500/10" : ""
                    }`}
                  >
                    <h2 className="text-sm font-semibold text-slate-100">{p.title}</h2>
                    <p className="mt-2 text-sm text-slate-400">{p.description}</p>
                    {selected && (
                      <p className="mt-3 text-xs font-medium text-primary-400">
                        Selected
                      </p>
                    )}
                  </Card>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              You can change personality later without re-scraping your website.
            </p>
            <Button
              variant="outline"
              onClick={() => router.push("/bot-preview")}
              disabled={!personality}
            >
              Continue to preview
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

