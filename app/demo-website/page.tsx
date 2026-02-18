"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Card from "@/components/Card";
import Button from "@/components/Button";
import ChatWidget from "@/components/ChatWidget";

export default function DemoWebsitePage() {
  return (
    <>
      <Navbar />
      <main className="relative min-h-[calc(100vh-80px)] bg-slate-950 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-8">
          <header>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-400">
              Demo storefront
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-100">
              NovaGlow Hydrating Serum
            </h1>
            <p className="mt-2 max-w-2xl text-slate-400">
              A simple fake ecommerce page to showcase how the chatbot widget appears on a
              real store. Use this screen in demos with your clients.
            </p>
          </header>

          <div className="grid gap-8 md:grid-cols-2">
            <Card className="space-y-4">
              <div className="aspect-[4/3] w-full rounded-xl bg-gradient-to-br from-slate-700 to-slate-900" />
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-100">
                  NovaGlow Hydrating Serum
                </p>
                <p className="text-2xl font-bold text-primary-400">$39.00</p>
              </div>
              <p className="text-sm text-slate-400">
                Lightweight serum infused with hyaluronic acid and vitamin C for
                all‑day hydration and a healthy glow.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button>Add to Cart</Button>
                <Button variant="outline">View details</Button>
              </div>
            </Card>

            <Card className="space-y-3">
              <h2 className="text-sm font-semibold text-slate-100">
                Why this page exists
              </h2>
              <p className="text-sm text-slate-400">
                This is a mock ecommerce product page so you can show how the chatbot
                behaves on a real storefront — without connecting to a live production
                site. The floating widget in the bottom-right corner is using the same
                configuration as your main chatbot.
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-400">
                <li>Ask questions about products, shipping, and returns.</li>
                <li>Show how the assistant understands real website content.</li>
                <li>Demonstrate the full experience in just a few clicks.</li>
              </ul>
            </Card>
          </div>
        </div>

        <ChatWidget />
      </main>
      <Footer />
    </>
  );
}

