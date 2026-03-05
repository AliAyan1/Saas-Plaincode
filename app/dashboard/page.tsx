"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import Card from "@/components/Card";
import Button from "@/components/Button";
import { useBot } from "@/components/BotContext";

const TOTAL_CONVERSATIONS_FALLBACK = 100;

function formatTimeAgo(ms: number): string {
  const sec = Math.floor((Date.now() - ms) / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  return `${d}d ago`;
}

export default function DashboardPage() {
  const { scrapedData, personality, forwarded, recentActivity, userPlan, chatbotId, setScrapedData, setPersonality, setChatbotId } = useBot();
  const isPro = userPlan === "pro";
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<{ totalConversations: number; conversationLimit: number; remaining: number } | null>(null);
  const [activityFromApi, setActivityFromApi] = useState<{ id: string; type: string; title: string; detail: string; createdAt: number }[]>([]);
  const [forwardedCountFromApi, setForwardedCountFromApi] = useState<number | null>(null);
  const [ticketsFromApi, setTicketsFromApi] = useState<{ id: string; ticketRef: string; type: string; status: string; outcome: string | null; customer: string; queryPreview: string; createdAt: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState("");
  const [adminPersonality, setAdminPersonality] = useState<string>("Friendly");
  const [adminSaving, setAdminSaving] = useState(false);

  const totalConversations = stats?.totalConversations ?? 0;
  const limit = stats?.conversationLimit ?? TOTAL_CONVERSATIONS_FALLBACK;
  const remaining = stats?.remaining ?? limit;
  const isNewUser = scrapedData && personality;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [botRes, statsRes, activityRes, forwardedRes, ticketsRes] = await Promise.all([
          fetch("/api/chatbots/me"),
          fetch("/api/conversations/stats"),
          fetch("/api/activity"),
          fetch("/api/forwarded"),
          fetch("/api/tickets"),
        ]);
        if (cancelled) return;
        if (botRes.ok) {
          const botData = await botRes.json();
          if (botData.chatbot) {
            const c = botData.chatbot;
            setChatbotId(c.id);
            setAdminName(c.name || "");
            setAdminPersonality(c.personality || "Friendly");
            setScrapedData({
              url: c.websiteUrl || "",
              title: c.websiteTitle || "",
              description: c.websiteDescription || "",
              content: c.websiteContent || "",
              products: c.products || [],
            });
            setPersonality(c.personality || "Friendly");
          }
        }
        if (ticketsRes.ok) {
          const t = await ticketsRes.json();
          setTicketsFromApi(Array.isArray(t.tickets) ? t.tickets : []);
        }
        if (statsRes.ok) {
          const s = await statsRes.json();
          setStats({ totalConversations: s.totalConversations ?? 0, conversationLimit: s.conversationLimit ?? 100, remaining: s.remaining ?? 0 });
        }
        if (activityRes.ok) {
          const a = await activityRes.json();
          setActivityFromApi(Array.isArray(a.activity) ? a.activity : []);
        }
        if (forwardedRes.ok) {
          const f = await forwardedRes.json();
          setForwardedCountFromApi(Array.isArray(f.forwarded) ? f.forwarded.length : 0);
        }
      } catch (e) {
        console.error("Dashboard fetch error:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [setScrapedData, setPersonality, setChatbotId]);

  const displayActivity = activityFromApi.length > 0 ? activityFromApi : recentActivity;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const widgetSnippet = origin && chatbotId
    ? `<script src="${origin}/widget.js" data-bot-id="${chatbotId}"></script>`
    : `<script src="https://yourapp.com/widget.js" data-bot-id="YOUR_BOT_ID"></script>`;

  const handleCopySnippet = async () => {
    const snippet = origin && chatbotId
      ? `<script src="${origin}/widget.js" data-bot-id="${chatbotId}"></script>`
      : widgetSnippet;
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {isNewUser && (
          <section className="mb-8">
            <Card className="border-primary-500/30 bg-primary-500/5">
              <h2 className="text-sm font-semibold text-slate-200">
                Integration - Install your chatbot
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Copy this snippet and add it to your website (Custom, WooCommerce, or any site) to embed the chatbot. Paste before &lt;/body&gt; in your theme or layout. Conversations are stored in real time.
              </p>
              <div className="mt-4 rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-xs font-mono text-slate-100 break-all">
                {widgetSnippet}
              </div>
              <Button
                variant="secondary"
                className="mt-3"
                onClick={handleCopySnippet}
              >
                {copied ? "Copied!" : "Copy snippet"}
              </Button>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href="/integration">
                  <Button variant="ghost" className="text-primary-400 hover:text-primary-300">
                    Full integration guide
                  </Button>
                </Link>
                <Link href="/test-chatbot">
                  <Button variant="ghost" className="text-primary-400 hover:text-primary-300">
                    Test chatbot
                  </Button>
                </Link>
                <Link href="/bot-personality">
                  <Button variant="ghost" className="text-primary-400 hover:text-primary-300">
                    Change personality
                  </Button>
                </Link>
              </div>
            </Card>
          </section>
        )}

        <header className="mb-8">
          <h1 className="text-2xl font-bold text-slate-100">Main Dashboard</h1>
          <p className="mt-1 text-slate-400">
            Live overview of conversations, tickets, and activity. Every conversation creates a ticket.
          </p>
        </header>

        {loading ? (
          <p className="text-slate-400">Loading dashboard…</p>
        ) : (
          <>
            <section className="mb-8">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
                Primary metrics
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Conversations
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-100">{totalConversations}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    {remaining} remaining of {limit} (plan)
                  </p>
                </Card>
                <Card>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Resolved
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-100">
                    {ticketsFromApi.filter((t) => t.status === "resolved").length}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    Tickets resolved (AI or support)
                  </p>
                </Card>
                <Card>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Tickets
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-100">
                    {ticketsFromApi.length}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    Created & resolved (all plans)
                  </p>
                </Card>
                <Card>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Forwarded to email
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-100">
                    {forwardedCountFromApi !== null ? forwardedCountFromApi : forwarded.length}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">Free: conversations forwarded to your support email</p>
                </Card>
              </div>
            </section>

            <section className="mb-8 grid gap-6 lg:grid-cols-2">
              <Card>
                <h2 className="text-sm font-semibold text-slate-200">Conversations</h2>
                <p className="mt-2 text-slate-400">
                  Total: <span className="font-semibold text-slate-100">{totalConversations}</span> / {limit}.
                  <span className="ml-1 text-slate-400">{remaining} left in plan.</span>
                </p>
                <Link href="/conversations" className="mt-4 inline-block">
                  <Button variant="ghost" className="text-primary-400 hover:text-primary-300">
                    View conversations
                  </Button>
                </Link>
              </Card>
              <Card>
                <h2 className="text-sm font-semibold text-slate-200">Forwarded conversations</h2>
                <p className="mt-2 text-slate-400">
                  <span className="font-semibold text-slate-100">
                    {forwardedCountFromApi !== null ? forwardedCountFromApi : forwarded.length}
                  </span>{" "}
                  forwarded to email. Add a reply and the customer sees it in chat.
                </p>
                <Link href="/forwarded-conversations" className="mt-4 inline-block">
                  <Button variant="ghost" className="text-primary-400 hover:text-primary-300">
                    View forwarded
                  </Button>
                </Link>
              </Card>
              <Card>
                <h2 className="text-sm font-semibold text-slate-200">Tickets</h2>
                <p className="mt-2 text-slate-400">
                  <span className="font-semibold text-slate-100">{ticketsFromApi.length}</span> tickets (created & resolved).
                </p>
                <Link href="/tickets" className="mt-4 inline-block">
                  <Button variant="ghost" className="text-primary-400 hover:text-primary-300">
                    View all tickets
                  </Button>
                </Link>
              </Card>
            </section>

            {chatbotId && (
              <section className="mb-8">
                <Card>
                  <h2 className="text-sm font-semibold text-slate-200">Admin – Chatbot settings</h2>
                  <p className="mt-1 text-xs text-slate-400">Changes are saved automatically and go live on the chatbot.</p>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400">Chatbot name</label>
                      <input
                        type="text"
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        onBlur={() => {
                          const v = adminName.trim();
                          setAdminSaving(true);
                          fetch("/api/chatbots/me", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ name: v || undefined }),
                          })
                            .then(() => setAdminSaving(false))
                            .catch(() => setAdminSaving(false));
                        }}
                        className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                        placeholder="My Chatbot"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400">Personality</label>
                      <select
                        value={adminPersonality}
                        onChange={(e) => {
                          const v = e.target.value as "Friendly" | "Professional" | "Sales-focused" | "Premium Luxury";
                          setAdminPersonality(v);
                          setPersonality(v);
                          setAdminSaving(true);
                          fetch("/api/chatbots/me", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ personality: v }),
                          })
                            .then(() => setAdminSaving(false))
                            .catch(() => setAdminSaving(false));
                        }}
                        className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                      >
                        <option value="Friendly">Friendly</option>
                        <option value="Professional">Professional</option>
                        <option value="Sales-focused">Sales-focused</option>
                        <option value="Premium Luxury">Premium Luxury</option>
                      </select>
                    </div>
                    {adminSaving && <p className="text-xs text-slate-500">Saving…</p>}
                  </div>
                </Card>
              </section>
            )}

            <section id="recent" className="scroll-mt-4">
              <Card>
                <h2 className="text-sm font-semibold text-slate-200">Recent activity</h2>
                <ul className="mt-4 space-y-3">
                  {displayActivity.length === 0 ? (
                    <li className="rounded-lg border border-slate-700/80 bg-slate-800/40 p-4 text-center text-sm text-slate-500">
                      No activity yet. Chat with your bot or connect a store to see live updates.
                    </li>
                  ) : (
                    displayActivity.map((item) => (
                      <li
                        key={item.id}
                        className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-slate-700/80 bg-slate-800/40 p-3 text-sm"
                      >
                        <div>
                          <span
                            className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                              item.type === "resolved"
                                ? "bg-emerald-500/15 text-emerald-400"
                                : item.type === "forwarded"
                                  ? "bg-sky-500/15 text-sky-400"
                                  : item.type === "warning"
                                    ? "bg-amber-500/15 text-amber-400"
                                    : item.type === "system"
                                      ? "bg-slate-500/15 text-slate-400"
                                      : "bg-slate-500/15 text-slate-400"
                            }`}
                          >
                            {item.type.toUpperCase()}
                          </span>
                          <p className="mt-1 font-medium text-slate-200">{item.title}</p>
                          <p className="text-slate-400">{item.detail}</p>
                        </div>
                        <span className="shrink-0 text-xs text-slate-500">
                          {formatTimeAgo(item.createdAt)}
                        </span>
                      </li>
                    ))
                  )}
                </ul>
              </Card>
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
