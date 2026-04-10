"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import Card from "@/components/Card";
import Button from "@/components/Button";
import { useBot } from "@/components/BotContext";

type ForwardedItem = {
  id: string;
  conversationId: string;
  customer: string;
  preview: string;
  forwardedAs: string;
  ticketRef: string | null;
  replyText: string | null;
  repliedAt: string | null;
  createdAt: string;
};

export default function ForwardedConversationsPage() {
  const { chatbotId } = useBot();
  const [list, setList] = useState<ForwardedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchList = () => {
    setLoading(true);
    const q = chatbotId ? `?chatbotId=${encodeURIComponent(chatbotId)}` : "";
    fetch(`/api/forwarded${q}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.forwarded)) setList(data.forwarded);
      })
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchList();
  }, [chatbotId]);

  const handleSaveReply = async (id: string) => {
    if (!replyDraft.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/forwarded/${id}/reply`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replyText: replyDraft.trim() }),
      });
      if (res.ok) {
        setReplyingId(null);
        setReplyDraft("");
        fetchList();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-slate-100">Forwarded conversations</h1>
        <p className="mt-1 text-slate-400">
          Conversations forwarded to your support email (free plan). Add a reply and the customer will see it in chat.
        </p>
        <Card className="mt-6">
          {loading ? (
            <p className="py-8 text-center text-slate-400">Loading…</p>
          ) : list.length === 0 ? (
            <p className="py-8 text-center text-slate-500">
              No forwarded conversations yet. Forward from the Conversations tab or when the AI can&apos;t help (e.g. order cancellation).
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-700/80 text-sm">
                <thead className="bg-slate-900/80">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">Customer</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">Preview</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">When</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">Reply</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/80 bg-slate-900/40">
                  {list.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-slate-100">{item.customer}</td>
                      <td className="px-4 py-3 text-slate-400 max-w-xs">
                        <span className="line-clamp-2">{item.preview}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {new Date(item.createdAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                      </td>
                      <td className="px-4 py-3">
                        {item.replyText ? (
                          <div className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-slate-200">
                            <p className="text-xs text-slate-500 mb-1">Your reply (shown in chat)</p>
                            <p className="whitespace-pre-wrap">{item.replyText}</p>
                            {item.repliedAt && (
                              <p className="mt-1 text-xs text-slate-500">
                                {new Date(item.repliedAt).toLocaleString()}
                              </p>
                            )}
                          </div>
                        ) : replyingId === item.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={replyDraft}
                              onChange={(e) => setReplyDraft(e.target.value)}
                              placeholder="e.g. Your order has been cancelled. Confirmation email sent."
                              rows={3}
                              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-primary-500 focus:outline-none"
                            />
                            <div className="flex gap-2">
                              <Button
                                variant="primary"
                                className="px-3 py-1 text-xs"
                                disabled={saving || !replyDraft.trim()}
                                onClick={() => handleSaveReply(item.id)}
                              >
                                {saving ? "Saving…" : "Save reply"}
                              </Button>
                              <Button
                                variant="ghost"
                                className="px-3 py-1 text-xs"
                                onClick={() => { setReplyingId(null); setReplyDraft(""); }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            className="px-3 py-1 text-xs"
                            onClick={() => { setReplyingId(item.id); setReplyDraft(""); }}
                          >
                            Add reply
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
