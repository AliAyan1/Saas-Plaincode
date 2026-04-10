"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import Card from "@/components/Card";
import Button from "@/components/Button";
import { useBot } from "@/components/BotContext";
import { nearLimitConversationThreshold, UNLIMITED_CONVERSATIONS_DISPLAY } from "@/lib/plans";
import { CUSTOM_PLAN_CALENDLY_URL } from "@/lib/calendly";

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
  const {
    scrapedData,
    personality,
    forwarded,
    recentActivity,
    userPlan,
    chatbotId,
    setScrapedData,
    setPersonality,
    setChatbotId,
    setConversationRemaining,
    setUserPlan,
    setStores,
    setStoreLimit,
  } = useBot();
  const isPaidPlan =
    userPlan === "growth" ||
    userPlan === "pro" ||
    userPlan === "agency" ||
    userPlan === "custom" ||
    userPlan === "business";
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<{
    totalConversations: number;
    conversationLimit: number | null;
    remaining: number | null;
    unlimited: boolean;
  } | null>(null);
  const [activityFromApi, setActivityFromApi] = useState<{ id: string; type: string; title: string; detail: string; createdAt: number }[]>([]);
  const [forwardedCountFromApi, setForwardedCountFromApi] = useState<number | null>(null);
  const [ticketsFromApi, setTicketsFromApi] = useState<{ id: string; ticketRef: string; type: string; status: string; outcome: string | null; customer: string; queryPreview: string; createdAt: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgradeBusy, setUpgradeBusy] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);

  const totalConversations = stats?.totalConversations ?? 0;
  const statsUnlimited = stats?.unlimited ?? false;
  const limit = statsUnlimited ? null : (stats?.conversationLimit ?? TOTAL_CONVERSATIONS_FALLBACK);
  const remaining = statsUnlimited
    ? UNLIMITED_CONVERSATIONS_DISPLAY
    : (stats?.remaining ?? limit ?? TOTAL_CONVERSATIONS_FALLBACK);
  const isNewUser = scrapedData && personality;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const storeParam = chatbotId ? `?storeId=${encodeURIComponent(chatbotId)}` : "";
        const botFilter = chatbotId ? `?chatbotId=${encodeURIComponent(chatbotId)}` : "";
        const [botRes, statsRes, activityRes, forwardedRes, ticketsRes] = await Promise.all([
          fetch(`/api/chatbots/me${storeParam}`),
          fetch("/api/conversations/stats"),
          fetch(`/api/activity${botFilter}`),
          fetch(`/api/forwarded${botFilter}`),
          fetch(`/api/tickets${botFilter}`),
        ]);
        if (cancelled) return;
        if (botRes.ok) {
          const botData = await botRes.json();
          if (Array.isArray(botData.chatbots)) setStores(botData.chatbots);
          if (botData.storeLimit !== undefined) setStoreLimit(botData.storeLimit);
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
          if (s.unlimited) {
            setStats({
              totalConversations: s.totalConversations ?? 0,
              conversationLimit: null,
              remaining: null,
              unlimited: true,
            });
            setConversationRemaining(UNLIMITED_CONVERSATIONS_DISPLAY);
          } else {
            const rem = Math.max(0, s.remaining ?? 0);
            setStats({
              totalConversations: s.totalConversations ?? 0,
              conversationLimit: s.conversationLimit ?? 100,
              remaining: rem,
              unlimited: false,
            });
            setConversationRemaining(rem);
          }
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
  }, [chatbotId, setScrapedData, setPersonality, setChatbotId, setConversationRemaining, setStores, setStoreLimit]);

  const handleSelfServeUpgrade = async (target: "growth" | "pro") => {
    setUpgradeError(null);
    setUpgradeBusy(true);
    try {
      if (target === "growth") {
        const res = await fetch("/api/stripe/create-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan: "growth" }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.url) {
          setUpgradeError(typeof data.error === "string" ? data.error : "Could not start checkout.");
          setUpgradeBusy(false);
          return;
        }
        window.location.href = data.url as string;
        return;
      }

      const res = await fetch("/api/stripe/upgrade-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetPlan: "pro" }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.useCheckout) {
        const res2 = await fetch("/api/stripe/create-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan: "pro" }),
        });
        const d2 = await res2.json().catch(() => ({}));
        if (!res2.ok || !d2.url) {
          setUpgradeError(typeof d2.error === "string" ? d2.error : "Could not start checkout.");
          setUpgradeBusy(false);
          return;
        }
        window.location.href = d2.url as string;
        return;
      }
      if (!res.ok || !data.ok) {
        setUpgradeError(typeof data.error === "string" ? data.error : "Upgrade failed.");
        setUpgradeBusy(false);
        return;
      }
      setUserPlan("pro");
      window.location.href = "/dashboard?upgrade=success";
    } catch {
      setUpgradeError("Something went wrong.");
      setUpgradeBusy(false);
    }
  };

  // After Stripe checkout redirect or in-app subscription upgrade, refresh plan from DB
  useEffect(() => {
    const ok =
      searchParams.get("checkout") === "success" ||
      searchParams.get("pro") === "success" ||
      searchParams.get("upgrade") === "success";
    if (!ok) return;
    const t = setTimeout(async () => {
      await fetch("/api/auth/refresh-session", { method: "POST" });
      const [meRes, statsRes] = await Promise.all([
        fetch("/api/me"),
        fetch("/api/conversations/stats"),
      ]);
      if (meRes.ok) {
        const me = await meRes.json();
        if (me?.plan === "growth" || me?.plan === "pro" || me?.plan === "agency") {
          setUserPlan(me.plan);
        }
      }
      if (statsRes.ok) {
        const s = await statsRes.json();
        if (s.unlimited) {
          setConversationRemaining(UNLIMITED_CONVERSATIONS_DISPLAY);
        } else {
          setConversationRemaining(Math.max(0, s.remaining ?? 0));
        }
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

  const showAgencyOnboarding = userPlan === "agency" && !loading && !chatbotId;
  const limitReached = !loading && stats && !stats.unlimited && (stats.remaining ?? 0) <= 0;

  const nearThreshold =
    stats && !stats.unlimited && stats.conversationLimit != null
      ? nearLimitConversationThreshold(stats.conversationLimit)
      : null;
  const hasHeadroom = Boolean(stats && !stats.unlimited && (stats.remaining ?? 0) > 0);
  const showFreeNearLimit =
    !loading &&
    userPlan === "free" &&
    hasHeadroom &&
    nearThreshold !== null &&
    stats !== null &&
    stats.totalConversations >= nearThreshold;
  const showGrowthNearLimit =
    !loading &&
    userPlan === "growth" &&
    hasHeadroom &&
    nearThreshold !== null &&
    stats !== null &&
    stats.totalConversations >= nearThreshold;

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {upgradeError && (
          <p className="mb-4 rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-2 text-sm text-red-300">
            {upgradeError}
          </p>
        )}

        {showFreeNearLimit && (
          <Card className="mb-8 border-primary-500/40 bg-primary-500/10">
            <h2 className="text-lg font-semibold text-primary-200">
              You&apos;re nearly at your limit — upgrade to Growth and never get cut off.
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              You&apos;ve used {stats?.totalConversations ?? 0} of {stats?.conversationLimit ?? 100} conversations this month. Upgrade in one step with Stripe — no calls required.
            </p>
            <Button
              variant="primary"
              className="mt-4"
              disabled={upgradeBusy}
              onClick={() => handleSelfServeUpgrade("growth")}
            >
              {upgradeBusy ? "Redirecting…" : "Upgrade to Growth"}
            </Button>
          </Card>
        )}

        {showGrowthNearLimit && (
          <Card className="mb-8 border-primary-500/40 bg-primary-500/10">
            <h2 className="text-lg font-semibold text-primary-200">
              You&apos;re nearly at your limit — upgrade to Pro for more headroom.
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              You&apos;ve used {stats?.totalConversations ?? 0} of {stats?.conversationLimit ?? 1000} conversations this month. Move to Pro with one click (your subscription updates in Stripe).
            </p>
            <Button
              variant="primary"
              className="mt-4"
              disabled={upgradeBusy}
              onClick={() => handleSelfServeUpgrade("pro")}
            >
              {upgradeBusy ? "Working…" : "Upgrade to Pro"}
            </Button>
          </Card>
        )}

        {limitReached && (
          <Card className="mb-8 border-amber-500/40 bg-amber-500/10">
            <h2 className="text-lg font-semibold text-amber-200">
              {userPlan === "free"
                ? "You've used all your free conversations"
                : isPaidPlan
                  ? "You've used all your conversations this month"
                  : "You've used all your free conversations"}
            </h2>
            <p className="mt-2 text-slate-300">
              {userPlan === "free"
                ? "Upgrade to Growth for 1,000 conversations per month. Continue with Stripe — your chat history stays put."
                : userPlan === "growth"
                  ? "Upgrade to Pro for 3,000 conversations per month, or wait until your limit resets next month."
                  : isPaidPlan
                    ? "Renew your subscription to keep your chatbot live and reset your monthly conversations."
                    : "Upgrade to a paid plan for more conversations each month."}
            </p>
            {userPlan === "free" && (
              <Button
                variant="primary"
                className="mt-4"
                disabled={upgradeBusy}
                onClick={() => handleSelfServeUpgrade("growth")}
              >
                {upgradeBusy ? "Redirecting…" : "Upgrade to Growth (Stripe)"}
              </Button>
            )}
            {userPlan === "growth" && (
              <Button
                variant="primary"
                className="mt-4"
                disabled={upgradeBusy}
                onClick={() => handleSelfServeUpgrade("pro")}
              >
                {upgradeBusy ? "Working…" : "Upgrade to Pro (Stripe)"}
              </Button>
            )}
            {(userPlan === "pro" || userPlan === "agency" || userPlan === "custom" || userPlan === "business") && (
              <Link href="/pricing">
                <Button variant="primary" className="mt-4">
                  {userPlan === "pro" ? "View plans & billing" : "View plans"}
                </Button>
              </Link>
            )}
          </Card>
        )}

        {showAgencyOnboarding && (
          <Card className="mb-8 border-primary-500/30 bg-primary-500/10">
            <h2 className="text-lg font-semibold text-primary-400">Create your first chatbot</h2>
            <p className="mt-2 text-slate-300">
              You&apos;re on Agency — add a store URL and go live from your dashboard whenever you&apos;re ready. Your install snippet appears here once a chatbot exists.
            </p>
            <Link href="/create-bot" className="mt-4 inline-block">
              <Button variant="primary">Create chatbot</Button>
            </Link>
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
                    {statsUnlimited
                      ? "Unlimited conversations this month (Agency)"
                      : `${stats?.remaining ?? 0} remaining of ${limit} (plan)`}
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
                  Total: <span className="font-semibold text-slate-100">{totalConversations}</span>
                  {statsUnlimited ? (
                    <span className="ml-1 text-slate-400">· Unlimited monthly conversations</span>
                  ) : (
                    <>
                      {" "}
                      / {limit}.<span className="ml-1 text-slate-400">{stats?.remaining ?? 0} left in plan.</span>
                    </>
                  )}
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

        <div className="mt-10 border-t border-slate-800/80 pt-6 text-center">
          <a
            href={CUSTOM_PLAN_CALENDLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex rounded-md border border-slate-700 bg-slate-900/40 px-3 py-1.5 text-xs text-slate-400 transition hover:border-slate-600 hover:text-primary-400"
          >
            Need a custom plan? Talk to us
          </a>
        </div>
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
