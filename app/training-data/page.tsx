"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Card from "@/components/Card";
import Button from "@/components/Button";
import { useBot } from "@/components/BotContext";
import { useRouter } from "next/navigation";

export default function TrainingDataPage() {
  const router = useRouter();
  const { scrapedData } = useBot();
  const products =
    scrapedData?.products && scrapedData.products.length > 0
      ? scrapedData.products
      : null;

  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-80px)] bg-slate-950 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-8">
          <header className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-100">Knowledge Engine</h1>
              <p className="mt-2 text-sm text-slate-400">
                Visual overview of pages crawled and product inventory your assistant is
                trained on.
              </p>
              {scrapedData?.url && (
                <p className="mt-1 text-xs text-slate-500">
                  Latest crawl source:{" "}
                  <span className="text-slate-200">{scrapedData.url}</span>
                </p>
              )}
            </div>
            <div className="text-xs text-slate-400 text-right">
              <p>
                Data health:{" "}
                <span className="font-semibold text-emerald-400">
                  {products ? "98.2%" : "Waiting for crawl"}
                </span>
              </p>
              <p className="mt-1">
                Last sync: <span className="text-slate-200">Just now (session)</span>
              </p>
            </div>
          </header>

          <section className="grid gap-6 lg:grid-cols-2">
            <Card className="bg-slate-900/80">
              <h2 className="text-sm font-semibold text-slate-100">Knowledge map</h2>
              <p className="mt-1 text-xs text-slate-500">
                High-level view of which key pages have been fully trained.
              </p>
              <div className="mt-5 space-y-3 text-xs">
                {[
                  { label: "Home (root)", status: "Fully trained" },
                  { label: "About us", status: "Fully trained" },
                  { label: "FAQ & Support", status: "Syncing" },
                  { label: "Policies / Privacy policy", status: "Fully trained" },
                  { label: "Policies / Refund policy", status: "Outdated" },
                  { label: "Contact", status: "Fully trained" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-lg bg-slate-950/60 px-3 py-2"
                  >
                    <span className="text-slate-200">{item.label}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        item.status === "Fully trained"
                          ? "bg-emerald-500/15 text-emerald-300"
                          : item.status === "Syncing"
                          ? "bg-orange-500/15 text-orange-300"
                          : "bg-amber-500/15 text-amber-300"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="bg-slate-900/80">
              <h2 className="text-sm font-semibold text-slate-100">Product inventory</h2>
              <p className="mt-1 text-xs text-slate-500">
                Snapshot of catalog items detected from your latest crawl.
              </p>
              <div className="mt-4 space-y-3 text-xs">
                {products ? (
                  products.map((p, idx) => (
                    <div
                      key={p.name + idx.toString()}
                      className="flex items-center justify-between rounded-lg bg-slate-950/60 px-3 py-2"
                    >
                      <div>
                        <p className="text-slate-200">{p.name}</p>
                        <p className="text-[11px] text-slate-500">
                          Imported from crawl • Item #{idx + 1}
                        </p>
                      </div>
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                        Active
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">
                    No products detected yet. Connect a store URL from the Create Bot step
                    to populate this inventory.
                  </p>
                )}
              </div>
            </Card>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <p className="text-xs text-slate-500">
              Products are detected in real time from your latest website crawl.
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => router.push("/create-bot")}
              >
                Back to URL input
              </Button>
              <Button
                variant="primary"
                onClick={() => router.push("/bot-personality")}
                disabled={!scrapedData}
              >
                Continue to Personality
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

