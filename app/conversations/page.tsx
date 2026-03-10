"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import Card from "@/components/Card";
import { useBot } from "@/components/BotContext";

const statusStyles: Record<string, string> = {
  open: "bg-amber-500/15 text-amber-400",
  resolved: "bg-emerald-500/15 text-emerald-400",
  forwarded: "bg-sky-500/15 text-sky-400",
};

function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

export default function ConversationsPage() {
  useBot();
  const [conversations, setConversations] = useState<{ id: string; customer: string; preview: string; date: string; status: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.conversations)) {
          setConversations(
            data.conversations.map((c: { id: string; customer: string; preview: string; date: string; status: string }) => ({
              ...c,
              date: formatDate(c.date),
            }))
          );
        }
      })
      .catch(() => setConversations([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-slate-100">Conversations</h1>
        <p className="mt-1 text-slate-400">Live conversations from your chatbot (stored in database).</p>
        <Card className="mt-6">
          {loading ? (
            <p className="py-8 text-center text-slate-400">Loading…</p>
          ) : conversations.length === 0 ? (
            <p className="py-8 text-center text-slate-500">No conversations yet. Chat from the test chatbot or your site to see them here.</p>
          ) : (
            <ul className="divide-y divide-slate-700/80">
              {conversations.map((conv) => (
                <li
                  key={conv.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-slate-200">{conv.customer}</span>
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${statusStyles[conv.status] ?? "bg-slate-500/15 text-slate-400"}`}
                      >
                        {conv.status}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm text-slate-400">{conv.preview}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="shrink-0 text-xs text-slate-500">{conv.date}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
