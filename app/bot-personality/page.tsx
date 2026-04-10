"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import Card from "@/components/Card";
import Button from "@/components/Button";
import StepIndicator from "@/components/StepIndicator";
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

const LANGUAGES: { code: string; label: string }[] = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "pt", label: "Portuguese" },
  { code: "nl", label: "Dutch" },
  { code: "da", label: "Danish" },
  { code: "sv", label: "Swedish" },
  { code: "ar", label: "Arabic" },
  { code: "hi", label: "Hindi" },
  { code: "ja", label: "Japanese" },
  { code: "zh", label: "Chinese" },
];

export default function BotPersonalityPage() {
  const router = useRouter();
  const { scrapedData, personality, setPersonality, chatbotId } = useBot();
  const [guardRails, setGuardRails] = useState("");
  const [language, setLanguage] = useState("en");

  useEffect(() => {
    const q = chatbotId ? `?storeId=${encodeURIComponent(chatbotId)}` : "";
    fetch(`/api/chatbots/me${q}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.chatbot?.personality) setPersonality(data.chatbot.personality);
        if (typeof data.chatbot?.guardRails === "string") setGuardRails(data.chatbot.guardRails);
        if (data.chatbot?.language) setLanguage(data.chatbot.language);
      })
      .catch(() => {});
  }, [setPersonality, chatbotId]);

  const handleSelect = async (p: Personality) => {
    setPersonality(p);
    try {
      await fetch("/api/chatbots/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personality: p, ...(chatbotId ? { chatbotId } : {}) }),
      });
    } catch {
      // still update UI
    }
  };

  const handleLanguageChange = (code: string) => {
    setLanguage(code);
    fetch("/api/chatbots/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: code, ...(chatbotId ? { chatbotId } : {}) }),
    }).catch(() => {});
  };

  const handleContinue = async () => {
    try {
      await fetch("/api/chatbots/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personality: personality || undefined,
          guardRails,
          language,
          ...(chatbotId ? { chatbotId } : {}),
        }),
      });
    } catch {
      // continue anyway
    }
    router.push("/bot-preview");
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <StepIndicator currentStep={3} />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-400">
            Step 3: Train AI
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-100">
            Choose your bot personality
          </h1>
          <p className="mt-2 text-slate-400">
            Pick how your AI assistant should speak to customers.
          </p>
          {scrapedData && (
            <p className="mt-1 text-xs text-slate-500">
              Connected store:{" "}
              <span className="text-slate-300">{scrapedData.url}</span>
            </p>
          )}
        </div>

        <Card className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-100">Response language</h2>
          <p className="text-xs text-slate-400">
            The chatbot will always respond in this language.
          </p>
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="w-full max-w-xs rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>
        </Card>

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
                  <h2 className="text-sm font-semibold text-slate-100">
                    {p.title}
                  </h2>
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

        <Card className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-100">
            AI guard raises (optional)
          </h2>
          <p className="text-xs text-slate-400">
            Rules for how the AI should behave. One per line. Saved for this chatbot.
          </p>
          <textarea
            value={guardRails}
            onChange={(e) => setGuardRails(e.target.value)}
            placeholder="e.g. Always be polite. Never share competitor prices. Keep answers under 3 sentences."
            className="w-full min-h-[100px] rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-primary-500 focus:outline-none"
            rows={4}
          />
        </Card>

        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            You can change personality and guard raises later without re-scraping your website.
          </p>
          <Button
            variant="outline"
            onClick={handleContinue}
            disabled={!personality}
          >
            Continue to preview
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

