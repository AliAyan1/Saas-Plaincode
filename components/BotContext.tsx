"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Personality =
  | "Friendly"
  | "Professional"
  | "Sales-focused"
  | "Premium Luxury";

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
}

export interface ScrapedData {
  url: string;
  title: string;
  description: string;
  content: string;
  products?: { name: string }[];
}

interface BotContextValue {
  scrapedData: ScrapedData | null;
  setScrapedData: (data: ScrapedData | null) => void;

  personality: Personality | null;
  setPersonality: (p: Personality | null) => void;

  conversationRemaining: number;
  setConversationRemaining: (n: number) => void;
  decrementConversations: () => void;

  messages: ChatMessage[];
  setMessages: (msgs: ChatMessage[]) => void;
  addMessage: (msg: Omit<ChatMessage, "id" | "createdAt"> & Partial<Pick<ChatMessage, "id" | "createdAt">>) => string;
  updateMessage: (id: string, patch: Partial<Pick<ChatMessage, "content">>) => void;
  clearMessages: () => void;
}

const BotContext = createContext<BotContextValue | undefined>(undefined);

const STORAGE_KEY = "bot-state-v1";

function safeParseJson<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

export function BotProvider({ children }: { children: ReactNode }) {
  const [scrapedData, setScrapedData] = useState<ScrapedData | null>(null);
  const [personality, setPersonality] = useState<Personality | null>(null);
  // 15 total, 3 already used => 12 remaining
  const [conversationRemaining, setConversationRemaining] = useState<number>(12);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Persist state client-side (still "no DB")
  useEffect(() => {
    if (typeof window === "undefined") return;
    const fromStorage = safeParseJson<{
      scrapedData: ScrapedData | null;
      personality: Personality | null;
      conversationRemaining: number;
      messages: ChatMessage[];
    }>(window.localStorage.getItem(STORAGE_KEY));

    if (fromStorage) {
      setScrapedData(fromStorage.scrapedData ?? null);
      setPersonality(fromStorage.personality ?? null);
      setConversationRemaining(
        typeof fromStorage.conversationRemaining === "number"
          ? fromStorage.conversationRemaining
          : 12
      );
      setMessages(Array.isArray(fromStorage.messages) ? fromStorage.messages : []);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        scrapedData,
        personality,
        conversationRemaining,
        messages,
      })
    );
  }, [scrapedData, personality, conversationRemaining, messages]);

  const decrementConversations = useCallback(() => {
    setConversationRemaining((prev) => (prev > 0 ? prev - 1 : 0));
  }, []);

  const addMessage = useCallback(
    (
      msg: Omit<ChatMessage, "id" | "createdAt"> &
        Partial<Pick<ChatMessage, "id" | "createdAt">>
    ) => {
      const id = msg.id ?? makeId(msg.role);
      const createdAt = msg.createdAt ?? Date.now();
      setMessages((prev) => [...prev, { id, createdAt, role: msg.role, content: msg.content }]);
      return id;
    },
    []
  );

  const updateMessage = useCallback((id: string, patch: Partial<Pick<ChatMessage, "content">>) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...patch } : m))
    );
  }, []);

  const clearMessages = useCallback(() => setMessages([]), []);

  const value = useMemo<BotContextValue>(
    () => ({
      scrapedData,
      setScrapedData,
      personality,
      setPersonality,
      conversationRemaining,
      setConversationRemaining,
      decrementConversations,
      messages,
      setMessages,
      addMessage,
      updateMessage,
      clearMessages,
    }),
    [
      scrapedData,
      personality,
      conversationRemaining,
      decrementConversations,
      messages,
      addMessage,
      updateMessage,
      clearMessages,
    ]
  );

  return <BotContext.Provider value={value}>{children}</BotContext.Provider>;
}

export function useBot() {
  const ctx = useContext(BotContext);
  if (!ctx) throw new Error("useBot must be used inside BotProvider");
  return ctx;
}

