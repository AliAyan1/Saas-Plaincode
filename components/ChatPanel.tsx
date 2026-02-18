"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Button from "@/components/Button";
import { useBot } from "@/components/BotContext";

interface ChatPanelProps {
  compact?: boolean;
}

export default function ChatPanel({ compact = false }: ChatPanelProps) {
  const {
    scrapedData,
    personality,
    messages,
    addMessage,
    updateMessage,
    clearMessages,
    conversationRemaining,
    decrementConversations,
  } = useBot();

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const greetingSentRef = useRef(false);

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const question = input.trim();
    if (!question) return;
    if (conversationRemaining <= 0) {
      setError("You have used all 15 conversations. Upgrade required.");
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
        }),
      });

      if (!res.ok || !res.body) {
        let message = "Something went wrong while contacting the AI.";
        try {
          const body = await res.json();
          if (body?.error) message = body.error;
        } catch {
          // ignore
        }
        throw new Error(message);
      }

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

      decrementConversations();
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
      <header className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-slate-100">
            Test your ecommerce assistant
          </p>
          <p className="text-xs text-slate-400">
            {conversationRemaining} / 15 conversations remaining in Starter plan
          </p>
        </div>
        <button
          type="button"
          onClick={clearMessages}
          className="text-xs text-slate-400 hover:text-slate-100"
        >
          Clear
        </button>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 text-sm">
        {!scrapedData && (
          <div className="mb-2 rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            Website content has not been scraped yet. Go to{" "}
            <span className="font-semibold">Create Bot</span> to connect a URL, or
            continue chatting with a generic assistant.
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

        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                m.role === "user"
                  ? "bg-primary-600 text-white rounded-br-sm"
                  : "bg-slate-800 text-slate-100 rounded-bl-sm"
              }`}
            >
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
          </div>
        ))}

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

