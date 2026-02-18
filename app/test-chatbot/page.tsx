"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Card from "@/components/Card";
import ChatPanel from "@/components/ChatPanel";
import { useBot } from "@/components/BotContext";

export default function TestChatbotPage() {
  const { scrapedData } = useBot();

  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-80px)] bg-slate-950 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Test chatbot</h1>
            <p className="mt-2 text-slate-400">
              Chat with your assistant in real time using live OpenAI responses.
            </p>
          </div>

          {scrapedData && (
            <Card className="text-xs text-slate-400">
              <p>
                Using content from:{" "}
                <span className="text-slate-200">{scrapedData.url}</span>
              </p>
              <p className="mt-1 line-clamp-2">
                {scrapedData.description || scrapedData.title}
              </p>
            </Card>
          )}

          <ChatPanel />
        </div>
      </main>
      <Footer />
    </>
  );
}

