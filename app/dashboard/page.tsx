"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Card from "@/components/Card";
import Button from "@/components/Button";
import { useBot } from "@/components/BotContext";

export default function DashboardPage() {
  const { scrapedData, conversationRemaining, personality } = useBot();
  const total = 15;
  const used = total - conversationRemaining;

  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-80px)] bg-slate-950 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-8">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-100">Main Dashboard</h1>
              <p className="mt-1 text-slate-400">
                Monitor your ecommerce support assistant at a glance.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/create-bot">
                <Button variant="primary">Create / Connect Bot</Button>
              </Link>
              <Link href="/test-chatbot">
                <Button variant="outline">Test Chatbot</Button>
              </Link>
              <Link href="/integration">
                <Button variant="ghost">Integration</Button>
              </Link>
            </div>
          </header>

          <section className="grid gap-6 md:grid-cols-4">
            <Card className="md:col-span-2">
              <p className="text-xs uppercase tracking-wide text-slate-400">Bot Name</p>
              <p className="mt-2 text-xl font-semibold text-slate-100">
                My Store Assistant
              </p>
              <p className="mt-3 text-sm text-slate-400">
                Plan:{" "}
                <span className="font-medium text-primary-400">Starter</span>
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Status:{" "}
                <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400">
                  Active
                </span>
              </p>
              <p className="mt-4 text-sm text-slate-400">
                Personality:{" "}
                <span className="font-medium text-slate-200">
                  {personality ?? "Not selected"}
                </span>
              </p>
            </Card>

            <Card>
              <p className="text-xs uppercase tracking-wide text-slate-400">Website Connected</p>
              <p className="mt-3 text-lg font-semibold text-slate-100">
                {scrapedData ? "Yes" : "No"}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                {scrapedData?.url || "Connect your store to get started."}
              </p>
            </Card>

            <Card>
              <p className="text-xs uppercase tracking-wide text-slate-400">Conversations Used</p>
              <p className="mt-3 text-lg font-semibold text-slate-100">
                {used} / {total}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                {conversationRemaining} remaining in Starter plan.
              </p>
            </Card>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <Card>
              <h2 className="text-sm font-semibold text-slate-200">Quick actions</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Link href="/create-bot">
                  <Button fullWidth variant="secondary">
                    Connect Website
                  </Button>
                </Link>
                <Link href="/bot-personality">
                  <Button fullWidth variant="ghost">
                    Set Personality
                  </Button>
                </Link>
                <Link href="/bot-preview">
                  <Button fullWidth variant="ghost">
                    Preview Bot
                  </Button>
                </Link>
                <Link href="/demo-website">
                  <Button fullWidth variant="ghost">
                    View Demo Website
                  </Button>
                </Link>
                <Link href="/analytics">
                  <Button fullWidth variant="ghost">
                    View Analytics
                  </Button>
                </Link>
              </div>
            </Card>

            <Card>
              <h2 className="text-sm font-semibold text-slate-200">Status summary</h2>
              <ul className="mt-4 space-y-3 text-sm text-slate-400">
                <li>
                  Bot is{" "}
                  <span className="text-emerald-400">ready to answer</span>{" "}
                  up to 15 questions.
                </li>
                <li>
                  Website content:{" "}
                  {scrapedData ? "Scraped and stored for this session." : "Not scraped yet."}
                </li>
                <li>Upgrade path: Pro & Enterprise (mock for now).</li>
              </ul>
            </Card>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
