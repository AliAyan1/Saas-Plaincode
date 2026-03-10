"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Button from "@/components/Button";
import { useBot } from "@/components/BotContext";

interface ChatPanelProps {
  compact?: boolean;
  /** When true (snippet/embed): hide "Test your ecommerce assistant", conversation count, Dashboard/Integration links. */
  embed?: boolean;
}

export default function ChatPanel({ compact = false, embed = false }: ChatPanelProps) {
  const {
    scrapedData,
    personality,
    messages,
    addMessage,
    updateMessage,
    clearMessages,
    conversationRemaining,
    decrementConversations,
    addActivity,
    addTicket,
    userPlan,
    chatbotId,
  } = useBot();

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForwardForm, setShowForwardForm] = useState(false);
  const [forwardName, setForwardName] = useState("");
  const [forwardEmail, setForwardEmail] = useState("");
  const [forwardOrderRef, setForwardOrderRef] = useState("");
  const [forwardSubmitting, setForwardSubmitting] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);
  const greetingSentRef = useRef(false);
  const conversationIdRef = useRef<string | null>(null);
  const lastReplyShownRef = useRef<string | null>(null);
  const [supportReplyIds, setSupportReplyIds] = useState<Set<string>>(new Set());
  const [supportReplyMeta, setSupportReplyMeta] = useState<Map<string, { repliedAt: string | null }>>(new Map());
  const [currentTicketRef, setCurrentTicketRef] = useState<string | null>(null);
  const [ticketResolved, setTicketResolved] = useState(false);

  // Initial greeting once we know scraped data / personality
  useEffect(() => {
    if (greetingSentRef.current) return;
    if (messages.length > 0) return;
    const company =
      scrapedData?.title ||
      scrapedData?.url?.replace(/^https?:\/\//, "").replace(/\/$/, "") ||
      "your store";
    const greeting = `Hi, I'm your AI assistant for ${company}. How can I help you today?`;
    addMessage({ role: "assistant", content: greeting });
    greetingSentRef.current = true;
  }, [scrapedData, personality, messages.length, addMessage]);

  useEffect(() => {
    if (!endRef.current) return;
    endRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, loading]);

  useEffect(() => {
    if (messages.length === 0) {
      setCurrentTicketRef(null);
      setTicketResolved(false);
    }
  }, [messages.length]);

  // Poll for support reply when we have a conversation (so customer sees reply in chat)
  useEffect(() => {
    const cid = conversationIdRef.current;
    if (!cid) return;
    const poll = () => {
      fetch(`/api/forwarded/by-conversation?conversationId=${encodeURIComponent(cid)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.replyText && data.replyText !== lastReplyShownRef.current) {
            lastReplyShownRef.current = data.replyText;
            const id = addMessage({
              role: "assistant",
              content: data.replyText,
            });
            setSupportReplyIds((prev) => new Set(Array.from(prev).concat(id)));
            setSupportReplyMeta((prev) => new Map(prev).set(id, { repliedAt: data.repliedAt ?? null }));
            setTicketResolved(true);
          }
        })
        .catch(() => {});
    };
    poll();
    const t = setInterval(poll, 15000);
    return () => clearInterval(t);
  }, [messages.length, addMessage]);

  const handleForwardToEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const cid = conversationIdRef.current;
    if (!cid || !chatbotId) {
      setError("Start the conversation first so we can forward it.");
      return;
    }
    const name = forwardName.trim() || "Customer";
    const email = forwardEmail.trim();
    if (!email) {
      setError("Email is required to forward.");
      return;
    }
    setForwardSubmitting(true);
    setError(null);
    try {
      const conversationText = messages
        .map((m) => `${m.role === "user" ? "Customer" : "Assistant"}: ${m.content}`)
        .join("\n");
      const lastUser = [...messages].reverse().find((m) => m.role === "user");
      const res = await fetch("/api/forwarded", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: cid,
          chatbotId,
          customer: name,
          customerEmail: email,
          orderRef: forwardOrderRef.trim() || null,
          preview: lastUser?.content?.slice(0, 200) || "Conversation",
          conversationText,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to forward");
      }
      addMessage({
        role: "assistant",
        content: "Wait, our team is reviewing your request. You'll see their reply here when they respond.",
      });
      setShowForwardForm(false);
      setForwardName("");
      setForwardEmail("");
      setForwardOrderRef("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to forward");
    } finally {
      setForwardSubmitting(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const question = input.trim();
    if (!question) return;
    if (conversationRemaining <= 0) {
      setError("You've used all your conversations this month. Upgrade or renew from the dashboard to continue.");
      return;
    }

    const userId = addMessage({ role: "user", content: question });
    const assistantId = addMessage({ role: "assistant", content: "" });
    setInput("");
    setLoading(true);

    // Show typing indicator immediately for better perceived performance
    updateMessage(assistantId, { content: "..." });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify({
          question,
          personality,
          scrapedData,
          ...(chatbotId && { chatbotId }),
          ...(conversationIdRef.current && { conversationId: conversationIdRef.current }),
        }),
      });

      if (!res.ok) {
        if (res.status === 402) {
          try {
            const body = await res.json();
            if (body?.limitReached) {
              setError(
                body.plan === "pro"
                  ? "You've used all your Pro conversations this month. Renew your plan to continue."
                  : "You've used all your free conversations. Upgrade to Pro to continue."
              );
              updateMessage(assistantId, {
                content:
                  "You've reached your conversation limit for this month. Upgrade to Pro (or renew) from your dashboard to keep chatting.",
              });
              setLoading(false);
              return;
            }
          } catch {
            // fall through
          }
        }
        let message = "Something went wrong while contacting the AI.";
        try {
          const body = await res.json();
          if (body?.error) message = body.error;
        } catch {
          // ignore
        }
        throw new Error(message);
      }
      if (!res.body) {
        throw new Error("No response from the chatbot.");
      }

      const convId = res.headers.get("X-Conversation-Id");
      if (convId) conversationIdRef.current = convId;
      const ref = res.headers.get("X-Ticket-Ref");
      if (ref) setCurrentTicketRef(ref);

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let fullText = "";
      let chunkCount = 0;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (!chunk) continue;
        fullText += chunk;
        chunkCount++;
        // Update immediately on first chunk for instant feedback
        updateMessage(assistantId, { content: fullText || "..." });
      }

      // If AI requested forward to support (e.g. cancel order, refund), strip marker; backend already created ticket and sent email
      const forwardMarker = "[FORWARD_TO_SUPPORT]";
      if (fullText.includes(forwardMarker)) {
        const cleaned = fullText.replace(/\s*\[FORWARD_TO_SUPPORT\]\s*$/i, "").trim();
        updateMessage(assistantId, { content: cleaned || fullText });
        setShowForwardForm(true);
        addTicket({
          type: "forwarded_email",
          customer: "Chat user",
          queryPreview: question.length > 80 ? question.slice(0, 80) + "…" : question,
          outcome: "Forwarded to support",
          status: "open",
          conversationId: conversationIdRef.current ?? undefined,
        });
      }

      decrementConversations();
      addActivity({
        type: "resolved",
        title: "Chat query answered",
        detail: question.length > 60 ? question.slice(0, 60) + "…" : question,
      });
    } catch (err: any) {
      updateMessage(assistantId, {
        content:
          "Sorry, I couldn't generate a reply right now. Please try again in a moment.",
      });
      setError(err?.message || "Failed to reach the chatbot API.");
    } finally {
      setLoading(false);
    }
  };

  const disabled = loading || conversationRemaining <= 0;

  return (
    <div
      className={`flex flex-col rounded-2xl border border-slate-800 bg-slate-900/60 shadow-soft ${
        compact ? "h-[420px]" : "h-[560px]"
      }`}
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 px-4 py-3">
        {embed ? (
          <>
            <p className="text-sm font-semibold text-slate-100">Chat</p>
            <button
              type="button"
              onClick={clearMessages}
              className="text-xs text-slate-400 hover:text-slate-100"
            >
              Clear
            </button>
          </>
        ) : (
          <>
            <div>
              <p className="text-sm font-semibold text-slate-100">
                Test your ecommerce assistant
              </p>
              <p className="text-xs text-slate-400">
                {conversationRemaining} conversations remaining in your plan
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/dashboard">
                <Button variant="ghost" className="px-3 py-1.5 text-xs">
                  Dashboard
                </Button>
              </Link>
              <Link href="/integration">
                <Button variant="ghost" className="px-3 py-1.5 text-xs">
                  Integration
                </Button>
              </Link>
              <button
                type="button"
                onClick={clearMessages}
                className="text-xs text-slate-400 hover:text-slate-100"
              >
                Clear
              </button>
            </div>
          </>
        )}
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 text-sm">
        {showForwardForm && chatbotId && (
          <form onSubmit={handleForwardToEmail} className="mb-3 rounded-lg border border-slate-700 bg-slate-800/80 p-3 space-y-2">
            <p className="text-xs font-medium text-slate-200">Forward this conversation to support</p>
            <input
              type="text"
              placeholder="Your name"
              value={forwardName}
              onChange={(e) => setForwardName(e.target.value)}
              className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
            />
            <input
              type="email"
              placeholder="Your email *"
              value={forwardEmail}
              onChange={(e) => setForwardEmail(e.target.value)}
              required
              className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
            />
            <input
              type="text"
              placeholder="Order number (optional)"
              value={forwardOrderRef}
              onChange={(e) => setForwardOrderRef(e.target.value)}
              className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
            />
            <div className="flex gap-2">
              <Button type="submit" variant="primary" className="px-3 py-1.5 text-xs" disabled={forwardSubmitting}>
                {forwardSubmitting ? "Sending…" : "Send to support"}
              </Button>
              <button type="button" onClick={() => setShowForwardForm(false)} className="text-xs text-slate-400 hover:text-slate-100">
                Cancel
              </button>
            </div>
          </form>
        )}
        {!scrapedData && (
          <div className="mb-2 rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            <strong>No store data yet.</strong> The chatbot needs your website to be analyzed first. If you already entered a URL but saw a rate-limit or “access denied” error, the scrape didn’t complete—go to{" "}
            <a href="/create-bot" className="font-semibold text-primary-300 underline hover:text-primary-200">
              Connect your store
            </a>
            , try again or use a different URL, then come back here. You can also keep chatting with a generic assistant below.
          </div>
        )}
        {personality && (
          <div className="mb-1 text-xs text-slate-400">
            Personality: <span className="font-semibold text-slate-200">{personality}</span>
          </div>
        )}

        {messages.length === 0 && (
          <p className="text-xs text-slate-500">
            Ask something like{" "}
            <span className="italic text-slate-300">
              “What are your shipping and return policies?”
            </span>
            .
          </p>
        )}

        {messages.map((m, idx) => {
          const isSupportReply = supportReplyIds.has(m.id);
          const replyMeta = supportReplyMeta.get(m.id);
          const isFirstUserMessage = m.role === "user" && messages.findIndex((x) => x.role === "user") === idx;
          if (isSupportReply) {
            return (
              <div key={m.id}>
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-xl border border-sky-500/40 bg-sky-950/50 px-4 py-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-sky-400">
                      <span>Support reply</span>
                      {replyMeta?.repliedAt && (
                        <span className="text-slate-500 font-normal">
                          {new Date(replyMeta.repliedAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-200">
                      {m.content}
                    </p>
                  </div>
                </div>
              </div>
            );
          }
          return (
            <div key={m.id}>
              <div
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                    m.role === "user"
                      ? "bg-primary-600 text-white rounded-br-sm"
                      : "bg-slate-800 text-slate-100 rounded-bl-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap">
                    {m.role === "assistant"
                      ? m.content.replace(/\*+/g, "").replace(/• /g, "- ")
                      : m.content}
                  </p>
                </div>
              </div>
              {isFirstUserMessage && currentTicketRef && (
                <div className="mt-3 flex items-center gap-3 rounded-lg border border-sky-500/30 bg-sky-500/10 px-4 py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-sky-400/40 bg-sky-500/20 text-sky-400">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                  </span>
                  <div>
                    <p className="font-semibold text-slate-100">Creating ticket</p>
                    <p className="text-sm text-slate-400">Ticket #{currentTicketRef}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {ticketResolved && (
          <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/20 text-emerald-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <div>
              <p className="font-semibold text-slate-100">Ticket resolved</p>
              <p className="text-sm text-slate-400">Our team or the AI has responded.</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary-400" />
            Thinking...
          </div>
        )}

        <div ref={endRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t border-slate-800 px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            rows={compact ? 2 : 3}
            className="min-h-[44px] flex-1 resize-none rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder={
              conversationRemaining <= 0
                ? "You have used all free conversations."
                : "Ask a question about your store..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={disabled}
          />
          <Button
            type="submit"
            variant="primary"
            disabled={disabled || !input.trim()}
            className="shrink-0"
          >
            {conversationRemaining <= 0 ? "Upgrade" : loading ? "Sending..." : "Send"}
          </Button>
        </div>
        {error && (
          <p className="mt-2 text-xs text-red-400 bg-red-950/40 border border-red-900/40 rounded-lg px-2 py-1.5">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}

