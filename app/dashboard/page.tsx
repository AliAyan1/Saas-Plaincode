"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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

function DashboardContent() {
  const searchParams = useSearchParams();
  const { scrapedData, personality, forwarded, recentActivity, userPlan, chatbotId, setScrapedData, setPersonality, setChatbotId, setConversationRemaining, setUserPlan } = useBot();
  const isPro = userPlan === "pro";
  const isProOrCustom = userPlan === "pro" || userPlan === "custom";
  const isBusiness = userPlan === "business";
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<{ totalConversations: number; conversationLimit: number; remaining: number } | null>(null);
  const [activityFromApi, setActivityFromApi] = useState<{ id: string; type: string; title: string; detail: string; createdAt: number }[]>([]);
  const [forwardedCountFromApi, setForwardedCountFromApi] = useState<number | null>(null);
  const [ticketsFromApi, setTicketsFromApi] = useState<{ id: string; ticketRef: string; type: string; status: string; outcome: string | null; customer: string; queryPreview: string; createdAt: number }[]>([]);
  const [loading, setLoading] = useState(true);

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
          const remaining = Math.max(0, s.remaining ?? 0);
          setStats({ totalConversations: s.totalConversations ?? 0, conversationLimit: s.conversationLimit ?? 100, remaining });
          setConversationRemaining(remaining);
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
  }, [setScrapedData, setPersonality, setChatbotId, setConversationRemaining]);

  // After Stripe success redirect, refetch to sync Pro plan (webhook may have just run)
  useEffect(() => {
    if (searchParams.get("pro") !== "success") return;
    const t = setTimeout(async () => {
      const [meRes, statsRes] = await Promise.all([
        fetch("/api/me"),
        fetch("/api/conversations/stats"),
      ]);
      if (meRes.ok) {
        const me = await meRes.json();
        if (me?.plan === "pro") setUserPlan("pro");
      }
      if (statsRes.ok) {
        const s = await statsRes.json();
        setConversationRemaining(Math.max(0, s.remaining ?? 0));
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [searchParams, setUserPlan, setConversationRemaining]);

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

  const showProEmptyState = isProOrCustom && !loading && !chatbotId;
  const limitReached = !loading && stats && remaining <= 0;
  const CALENDLY_URL = "https://calendly.com/mahrukh-plaincode";

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {limitReached && (
          <Card className="mb-8 border-amber-500/40 bg-amber-500/10">
            <h2 className="text-lg font-semibold text-amber-200">
              {isProOrCustom ? "You've used all your conversations this month" : "You've used all your free conversations"}
            </h2>
            <p className="mt-2 text-slate-300">
              {isProOrCustom
                ? "Renew your plan to keep your chatbot live and get 500 more conversations."
                : "Upgrade to Pro to get 500 conversations per month. Your dashboard and all conversations stay the same."}
            </p>
            <Link href="/dashboard/upgrade">
              <Button variant="primary" className="mt-4">
                {isProOrCustom ? "Renew plan" : "Upgrade to Pro"}
              </Button>
            </Link>
          </Card>
        )}

        {showProEmptyState && (
          <Card className="mb-8 border-primary-500/30 bg-primary-500/10">
            <h2 className="text-lg font-semibold text-primary-400">We&apos;re setting up your custom chatbot</h2>
            <p className="mt-2 text-slate-300">
              In about 7 days you&apos;ll see your working chatbot and snippet here. Our team will reach out to schedule a call and get you live.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Check your email for the Calendly link to book a time with our experts.
            </p>
          </Card>
        )}

        {isPro && chatbotId && isNewUser && (
          <Card className="mb-8 border-primary-500/30 bg-primary-500/10">
            <h2 className="text-lg font-semibold text-primary-400">Do you want a custom solution?</h2>
            <p className="mt-2 text-slate-300">
              Schedule a call with our team to tailor your chatbot and integrate with your database.
            </p>
            <a
              href={CALENDLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block"
            >
              <Button variant="primary">Schedule a meeting</Button>
            </a>
          </Card>
        )}

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
              <div className="mt-3 flex flex-col items-start gap-3">
                <Button
                  variant="secondary"
                  onClick={handleCopySnippet}
                >
                  {copied ? "Copied!" : "Copy snippet"}
                </Button>
                <div className="flex flex-wrap gap-2">
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

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <AppShell>
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-slate-400">Loading dashboard…</p>
        </div>
      </AppShell>
    }>
      <DashboardContent />
    </Suspense>
  );
}
