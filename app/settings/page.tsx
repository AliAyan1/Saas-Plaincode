"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import Card from "@/components/Card";
import Button from "@/components/Button";
import { useBot } from "@/components/BotContext";

const PERSONALITIES = ["Friendly", "Professional", "Sales-focused", "Premium Luxury"] as const;

const LANGUAGES = [
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

export default function SettingsPage() {
  const { userPlan, setUserPlan } = useBot();

  const [forwardEmail, setForwardEmail] = useState("");
  const [forwardEmailSaving, setForwardEmailSaving] = useState(false);
  const [forwardEmailMessage, setForwardEmailMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const [personality, setPersonality] = useState<string>("Friendly");
  const [personalitySaving, setPersonalitySaving] = useState(false);
  const [personalityMessage, setPersonalityMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const [language, setLanguage] = useState("en");

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfMessage, setPdfMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/users/forward-email")
      .then((r) => r.json())
      .then((data) => {
        if (data.forwardEmail != null) setForwardEmail(data.forwardEmail || "");
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/chatbots/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.chatbot?.personality) setPersonality(data.chatbot.personality);
        if (data.chatbot?.language) setLanguage(data.chatbot.language);
      })
      .catch(() => {});
  }, []);

  const handleSaveForwardEmail = () => {
    setForwardEmailMessage(null);
    setForwardEmailSaving(true);
    fetch("/api/users/forward-email", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ forwardEmail: forwardEmail.trim() }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setForwardEmailMessage({ type: "error", text: data.error });
        } else {
          setForwardEmailMessage({ type: "ok", text: "Forward email saved." });
        }
      })
      .catch(() => setForwardEmailMessage({ type: "error", text: "Failed to save." }))
      .finally(() => setForwardEmailSaving(false));
  };

  const handleSavePersonality = (value: string) => {
    if (!PERSONALITIES.includes(value as (typeof PERSONALITIES)[number])) return;
    setPersonality(value);
    setPersonalityMessage(null);
    setPersonalitySaving(true);
    fetch("/api/chatbots/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personality: value }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setPersonalityMessage({ type: "error", text: data.error });
        } else {
          setPersonalityMessage({ type: "ok", text: "Personality saved." });
        }
      })
      .catch(() => setPersonalityMessage({ type: "error", text: "Failed to save." }))
      .finally(() => setPersonalitySaving(false));
  };

  const handlePdfUpload = () => {
    if (!pdfFile) {
      setPdfMessage({ type: "error", text: "Choose a file first." });
      return;
    }
    setPdfMessage(null);
    setPdfUploading(true);
    const formData = new FormData();
    formData.append("file", pdfFile);
    fetch("/api/knowledge/upload", { method: "POST", body: formData })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setPdfMessage({ type: "error", text: data.error });
        } else {
          setPdfMessage({ type: "ok", text: data.message || data.warning || `${pdfFile.name} uploaded. The AI will use it when answering.` });
          setPdfFile(null);
        }
      })
      .catch(() => setPdfMessage({ type: "error", text: "Upload failed." }))
      .finally(() => setPdfUploading(false));
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-slate-100">Settings</h1>
        <p className="mt-1 text-slate-400">Manage forward email, chatbot personality, and AI training documents.</p>

        {/* Forward email */}
        <Card className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-200">Forward email</h2>
          <p className="text-xs text-slate-500">
            When conversations are forwarded, they can be sent to this inbox. Leave blank to disable.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="email"
              value={forwardEmail}
              onChange={(e) => setForwardEmail(e.target.value)}
              placeholder="support@yourstore.com"
              className="min-w-[220px] rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            <Button
              variant="primary"
              disabled={forwardEmailSaving}
              onClick={handleSaveForwardEmail}
            >
              {forwardEmailSaving ? "Saving…" : "Save"}
            </Button>
          </div>
          {forwardEmailMessage && (
            <p className={`text-xs ${forwardEmailMessage.type === "ok" ? "text-emerald-400" : "text-red-400"}`}>
              {forwardEmailMessage.text}
            </p>
          )}
        </Card>

        {/* Personality */}
        <Card className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-200">Chatbot personality</h2>
          <p className="text-xs text-slate-500">
            Tone of the AI when replying to customers.
          </p>
          <div className="flex flex-wrap gap-2">
            {PERSONALITIES.map((p) => (
              <Button
                key={p}
                variant={personality === p ? "primary" : "outline"}
                disabled={personalitySaving}
                onClick={() => handleSavePersonality(p)}
              >
                {p}
              </Button>
            ))}
          </div>
          {personalityMessage && (
            <p className={`text-xs ${personalityMessage.type === "ok" ? "text-emerald-400" : "text-red-400"}`}>
              {personalityMessage.text}
            </p>
          )}
        </Card>

        {/* Language */}
        <Card className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-200">Chatbot response language</h2>
          <p className="text-xs text-slate-500">
            The chatbot will always reply in this language.
          </p>
          <select
            value={language}
            onChange={(e) => {
              const v = e.target.value;
              setLanguage(v);
              fetch("/api/chatbots/me", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ language: v }),
              }).catch(() => {});
            }}
            className="w-full max-w-xs rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>
        </Card>

        {/* Extra PDF / TXT for AI training */}
        <Card className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-200">Extra documents for AI training</h2>
          <p className="text-xs text-slate-500">
            Upload PDFs or TXT files (product lists, FAQs, policies). The AI will use them automatically when answering — e.g. &quot;how many products do you have?&quot; from your catalog.
          </p>
          <div className="rounded-lg border border-dashed border-slate-600 bg-slate-900/50 p-4 space-y-3">
            <input
              type="file"
              accept=".pdf,.txt,application/pdf,text/plain"
              className="block w-full text-sm text-slate-400 file:mr-3 file:rounded file:border-0 file:bg-primary-500/20 file:px-3 file:py-2 file:text-primary-400"
              onChange={(e) => {
                const f = e.target.files?.[0];
                setPdfFile(f || null);
                setPdfMessage(null);
              }}
            />
            {pdfFile && <p className="text-xs text-slate-400">Selected: {pdfFile.name}</p>}
            <Button
              type="button"
              variant="secondary"
              disabled={pdfUploading || !pdfFile}
              onClick={handlePdfUpload}
            >
              {pdfUploading ? "Uploading…" : "Upload document"}
            </Button>
            {pdfMessage && (
              <p className={`text-xs ${pdfMessage.type === "ok" ? "text-emerald-400" : "text-red-400"}`}>
                {pdfMessage.text}
              </p>
            )}
          </div>
        </Card>

        {/* Plan (demo) */}
        <Card>
          <h2 className="text-sm font-semibold text-slate-200">Plan (demo)</h2>
          <p className="mt-1 text-xs text-slate-500">
            Switch plan to test Pro features like ticket tracking. Real plan comes from your account when we add auth.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant={userPlan === "free" ? "primary" : "outline"}
              onClick={() => setUserPlan("free")}
            >
              Free
            </Button>
            <Button
              variant={userPlan === "pro" ? "primary" : "outline"}
              onClick={() => setUserPlan("pro")}
            >
              Pro
            </Button>
          </div>
          {userPlan === "pro" && (
            <p className="mt-3 text-xs text-emerald-400">
              Pro active. Every query will create a ticket. View them on the dashboard or Tickets page.
            </p>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
