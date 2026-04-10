"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

type Chatbot = { id: string; name: string; websiteUrl: string };
type Endpoint = { id: string; name: string; baseUrl: string; authType: string };
type BillingPlanUi = "free" | "growth" | "pro" | "agency";

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  plan: string;
  conversationLimit?: number | null;
  createdAt: string;
  chatbots?: Chatbot[];
  endpoints?: Endpoint[];
};

function displayPlan(u: UserRow): BillingPlanUi {
  const p = (u.plan || "free").toLowerCase();
  if (p === "growth") return "growth";
  if (p === "pro" || p === "business") return "pro";
  if (p === "agency" || p === "custom") return "agency";
  return "free";
}

const PLAN_ORDER: BillingPlanUi[] = ["free", "growth", "pro", "agency"];

const PLAN_LABEL: Record<BillingPlanUi, string> = {
  free: "Free",
  growth: "Growth",
  pro: "Pro",
  agency: "Agency",
};

export default function ManualPreviewPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addingEndpointFor, setAddingEndpointFor] = useState<string | null>(null);
  const [makingChatbotFor, setMakingChatbotFor] = useState<string | null>(null);
  const [endpointForm, setEndpointForm] = useState({ name: "", baseUrl: "", authType: "none", authValue: "" });
  const [chatbotForm, setChatbotForm] = useState({ websiteUrl: "https://example.com", name: "Plainbot" });

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/manual-preview/users");
      if (!res.ok) {
        if (res.status === 404) setError("Manual preview is only available when you run the app locally (npm run dev).");
        else setError("Failed to load users.");
        setUsers([]);
        return;
      }
      const data = await res.json();
      setUsers(Array.isArray(data.users) ? data.users : []);
    } catch {
      setError("Failed to load users.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const setPlan = async (userId: string, plan: BillingPlanUi) => {
    setUpdating(userId);
    try {
      const res = await fetch("/api/manual-preview/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, plan }),
      });
      if (res.ok) await fetchUsers();
    } finally {
      setUpdating(null);
    }
  };

  const addEndpoint = async (userId: string) => {
    if (!endpointForm.name.trim() || !endpointForm.baseUrl.trim()) return;
    setUpdating(userId);
    try {
      const res = await fetch(`/api/manual-preview/users/${encodeURIComponent(userId)}/endpoints`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: endpointForm.name.trim(),
          baseUrl: endpointForm.baseUrl.trim(),
          authType: endpointForm.authType,
          authValue: endpointForm.authValue.trim() || undefined,
        }),
      });
      if (res.ok) {
        setAddingEndpointFor(null);
        setEndpointForm({ name: "", baseUrl: "", authType: "none", authValue: "" });
        await fetchUsers();
      }
    } finally {
      setUpdating(null);
    }
  };

  const createChatbot = async (userId: string) => {
    setMakingChatbotFor(userId);
    try {
      const res = await fetch(`/api/manual-preview/users/${encodeURIComponent(userId)}/create-chatbot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          websiteUrl: chatbotForm.websiteUrl.trim() || "https://example.com",
          name: chatbotForm.name.trim() || "Plainbot",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMakingChatbotFor(null);
        setChatbotForm({ websiteUrl: "https://example.com", name: "Plainbot" });
        await fetchUsers();
      } else {
        setError(data.error || "Failed to create chatbot.");
      }
    } finally {
      setMakingChatbotFor(null);
    }
  };

  const usersByPlan = PLAN_ORDER.reduce(
    (acc, plan) => {
      acc[plan] = users.filter((u) => displayPlan(u) === plan);
      return acc;
    },
    {} as Record<BillingPlanUi, UserRow[]>
  );

  const impersonateUrl = (userId: string) => `/api/manual-preview/impersonate?userId=${encodeURIComponent(userId)}`;

  const formatConvLimit = (u: UserRow) => {
    if (u.conversationLimit == null) return "Unlimited";
    return String(u.conversationLimit);
  };

  return (
    <div className="min-h-screen bg-black text-slate-100">
      <header className="border-b border-slate-800 px-4 py-4">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-xl font-bold text-slate-100">Manual preview</h1>
          <p className="mt-1 text-sm text-slate-500">
            All users grouped by plan (Free, Growth, Pro, Agency). Legacy <code className="text-slate-400">custom</code> shows under Agency. For Agency, add API endpoints and &quot;Make chatbot & go live&quot; as needed.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <section className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
          <h2 className="text-lg font-semibold text-slate-200">Test the flow</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/pricing" className="inline-flex rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600">
              Choose plan (Pricing)
            </Link>
            <Link href="/signup" className="inline-flex rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700">
              Sign up
            </Link>
            <Link href="/login" className="inline-flex rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700">
              Log in
            </Link>
          </div>
        </section>

        {error && (
          <p className="mt-6 rounded-lg border border-amber-800/50 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">
            {error}
          </p>
        )}

        {loading ? (
          <p className="mt-8 text-sm text-slate-500">Loading users…</p>
        ) : (
          <>
            <section className="mt-8 rounded-xl border border-slate-700 bg-slate-900/50 p-6">
              <h2 className="text-lg font-semibold text-slate-200">All users</h2>
              <p className="mt-2 text-sm text-slate-400">
                Total <span className="font-medium text-slate-200">{users.length}</span>
                {" · "}
                {PLAN_ORDER.map((p) => (
                  <span key={p} className="mr-3">
                    {PLAN_LABEL[p]}: <span className="text-slate-200">{usersByPlan[p].length}</span>
                  </span>
                ))}
              </p>
              <button
                type="button"
                onClick={() => fetchUsers()}
                className="mt-3 text-sm text-primary-400 hover:text-primary-300"
              >
                Refresh list
              </button>
            </section>

            {PLAN_ORDER.map((sectionPlan) => {
              const list = usersByPlan[sectionPlan];
              const isAgency = sectionPlan === "agency";
              const borderClass = isAgency ? "border-primary-500/30" : "border-slate-700";
              const titleClass = isAgency ? "text-primary-400" : "text-slate-200";

              return (
                <section key={sectionPlan} className={`mt-8 rounded-xl border ${borderClass} bg-slate-900/50 p-6`}>
                  <h2 className={`text-lg font-semibold ${titleClass}`}>
                    {PLAN_LABEL[sectionPlan]} ({list.length})
                  </h2>
                  {isAgency && (
                    <p className="mt-1 text-sm text-slate-500">
                      Add their API endpoints (their DB), then &quot;Make chatbot & go live&quot;. Use &quot;View dashboard&quot; for snippet and live dashboard.
                    </p>
                  )}
                  {!isAgency && (
                    <p className="mt-1 text-sm text-slate-500">
                      Conv limit from DB (monthly). Switch plan with the buttons on each row.
                    </p>
                  )}

                  {list.length === 0 ? (
                    <p className="mt-4 text-sm text-slate-500">No {PLAN_LABEL[sectionPlan]} users.</p>
                  ) : isAgency ? (
                    <ul className="mt-4 space-y-6">
                      {list.map((u) => {
                        const hasChatbot = u.chatbots && u.chatbots.length > 0;
                        const showEndpointForm = addingEndpointFor === u.id;
                        const showChatbotForm = makingChatbotFor === u.id;
                        const cur = displayPlan(u);
                        return (
                          <li key={u.id} className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="font-medium text-slate-200">{u.email}</p>
                                {u.name && <p className="text-sm text-slate-500">{u.name}</p>}
                                <p className="mt-1 text-xs text-slate-500">
                                  DB plan: <code className="text-slate-400">{u.plan}</code>
                                  {" · "}
                                  Conv limit: <span className="text-slate-400">{formatConvLimit(u)}/mo</span>
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <a
                                  href={impersonateUrl(u.id)}
                                  className="inline-flex rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600"
                                >
                                  View dashboard
                                </a>
                                <div className="flex flex-wrap justify-end gap-1">
                                  {PLAN_ORDER.map((p) => (
                                    <button
                                      key={p}
                                      type="button"
                                      disabled={!!updating || cur === p}
                                      onClick={() => setPlan(u.id, p)}
                                      className={`rounded px-2 py-1 text-xs disabled:opacity-40 ${
                                        cur === p ? "bg-slate-600 text-slate-100" : "text-slate-500 hover:bg-slate-700 hover:text-slate-200"
                                      }`}
                                    >
                                      {updating === u.id ? "…" : PLAN_LABEL[p]}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {u.chatbots && u.chatbots.length > 0 && (
                              <div className="mt-3">
                                <p className="text-xs font-medium text-slate-500">Chatbots</p>
                                {u.chatbots.map((c) => (
                                  <p key={c.id} className="text-sm text-slate-400">
                                    {c.name} — {c.websiteUrl || "—"} <span className="text-slate-600">(id: {c.id})</span>
                                  </p>
                                ))}
                              </div>
                            )}

                            <div className="mt-3">
                              <p className="text-xs font-medium text-slate-500">Their API endpoints (DB)</p>
                              {u.endpoints && u.endpoints.length > 0 ? (
                                <ul className="mt-1 space-y-1 text-sm text-slate-400">
                                  {u.endpoints.map((e) => (
                                    <li key={e.id}>
                                      {e.name} — {e.baseUrl} <span className="text-slate-600">({e.authType})</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="mt-1 text-xs text-slate-500">No endpoints yet</p>
                              )}
                              {!showEndpointForm ? (
                                <button
                                  type="button"
                                  className="mt-2 text-sm text-primary-400 hover:text-primary-300"
                                  onClick={() => setAddingEndpointFor(u.id)}
                                >
                                  + Add endpoint
                                </button>
                              ) : (
                                <div className="mt-3 space-y-2 rounded-lg border border-slate-600 bg-slate-900/50 p-3">
                                  <input
                                    type="text"
                                    placeholder="Name (e.g. Products API)"
                                    value={endpointForm.name}
                                    onChange={(e) => setEndpointForm((f) => ({ ...f, name: e.target.value }))}
                                    className="w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500"
                                  />
                                  <input
                                    type="url"
                                    placeholder="Base URL (e.g. https://api.theirstore.com)"
                                    value={endpointForm.baseUrl}
                                    onChange={(e) => setEndpointForm((f) => ({ ...f, baseUrl: e.target.value }))}
                                    className="w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500"
                                  />
                                  <select
                                    value={endpointForm.authType}
                                    onChange={(e) => setEndpointForm((f) => ({ ...f, authType: e.target.value }))}
                                    className="w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200"
                                  >
                                    <option value="none">No auth</option>
                                    <option value="bearer">Bearer token</option>
                                    <option value="api_key_header">API key (header)</option>
                                    <option value="basic">Basic auth</option>
                                  </select>
                                  {(endpointForm.authType === "bearer" || endpointForm.authType === "api_key_header" || endpointForm.authType === "basic") && (
                                    <input
                                      type="password"
                                      placeholder="Token or key"
                                      value={endpointForm.authValue}
                                      onChange={(e) => setEndpointForm((f) => ({ ...f, authValue: e.target.value }))}
                                      className="w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500"
                                    />
                                  )}
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      className="rounded bg-primary-500 px-3 py-1.5 text-sm text-white hover:bg-primary-600 disabled:opacity-50"
                                      disabled={!!updating}
                                      onClick={() => addEndpoint(u.id)}
                                    >
                                      Save
                                    </button>
                                    <button
                                      type="button"
                                      className="rounded border border-slate-600 px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200"
                                      onClick={() => {
                                        setAddingEndpointFor(null);
                                        setEndpointForm({ name: "", baseUrl: "", authType: "none", authValue: "" });
                                      }}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>

                            {!hasChatbot && (
                              <div className="mt-4">
                                {!showChatbotForm ? (
                                  <button
                                    type="button"
                                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
                                    onClick={() => setMakingChatbotFor(u.id)}
                                  >
                                    Make chatbot & go live
                                  </button>
                                ) : (
                                  <div className="space-y-2 rounded-lg border border-slate-600 bg-slate-900/50 p-3">
                                    <input
                                      type="url"
                                      placeholder="Store / website URL"
                                      value={chatbotForm.websiteUrl}
                                      onChange={(e) => setChatbotForm((f) => ({ ...f, websiteUrl: e.target.value }))}
                                      className="w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Chatbot name"
                                      value={chatbotForm.name}
                                      onChange={(e) => setChatbotForm((f) => ({ ...f, name: e.target.value }))}
                                      className="w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500"
                                    />
                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        className="rounded bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-500 disabled:opacity-50"
                                        disabled={!!makingChatbotFor}
                                        onClick={() => createChatbot(u.id)}
                                      >
                                        {makingChatbotFor === u.id ? "Creating…" : "Create & go live"}
                                      </button>
                                      <button
                                        type="button"
                                        className="rounded border border-slate-600 px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200"
                                        onClick={() => setMakingChatbotFor(null)}
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            {hasChatbot && (
                              <p className="mt-3 text-xs text-emerald-400">Chatbot live — they can see snippet on View dashboard.</p>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <ul className="mt-4 space-y-3">
                      {list.map((u) => {
                        const cur = displayPlan(u);
                        return (
                          <li
                            key={u.id}
                            className="flex flex-col gap-3 rounded-lg border border-slate-700/80 bg-slate-800/30 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
                          >
                            <div className="min-w-0 flex-1">
                              <div>
                                <span className="text-slate-200">{u.email}</span>
                                {u.name && <span className="ml-2 text-sm text-slate-500">{u.name}</span>}
                              </div>
                              <p className="mt-1 text-xs text-slate-500">
                                DB: <code className="text-slate-400">{u.plan}</code>
                                {" · "}
                                {formatConvLimit(u)} conv/mo
                                {u.chatbots && u.chatbots.length > 0 && (
                                  <span className="text-slate-600"> · {u.chatbots.length} chatbot(s)</span>
                                )}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <a
                                href={impersonateUrl(u.id)}
                                className="inline-flex rounded-lg bg-primary-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-600"
                              >
                                View dashboard
                              </a>
                              <div className="flex flex-wrap gap-1">
                                {PLAN_ORDER.map((p) => (
                                  <button
                                    key={p}
                                    type="button"
                                    disabled={!!updating || cur === p}
                                    onClick={() => setPlan(u.id, p)}
                                    className={`rounded px-2 py-1 text-xs disabled:opacity-40 ${
                                      cur === p ? "bg-slate-600 text-slate-100" : "text-slate-500 hover:bg-slate-700 hover:text-slate-200"
                                    }`}
                                  >
                                    {updating === u.id ? "…" : PLAN_LABEL[p]}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              );
            })}
          </>
        )}
      </main>
    </div>
  );
}
