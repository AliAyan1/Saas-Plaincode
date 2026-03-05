"use client";

import Card from "@/components/Card";
import Button from "@/components/Button";
import { useBot } from "@/components/BotContext";
import { useRouter } from "next/navigation";

function statusClass(status: string) {
  if (status === "Fully trained") return "bg-emerald-500/15 text-emerald-300";
  if (status === "Syncing") return "bg-orange-500/15 text-orange-300";
  return "bg-amber-500/15 text-amber-300";
}

export default function TrainingDataContent() {
  const router = useRouter();
  const { scrapedData } = useBot();
  const products =
    scrapedData?.products && scrapedData.products.length > 0
      ? scrapedData.products
      : null;
  const websiteFeed = scrapedData?.content || "";

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">
            Website feeds and sitemap
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Visual overview of pages crawled, product inventory, and an
            AI-generated feed of your website content. All stored locally in
            this demo (no external database yet).
          </p>
          {scrapedData?.url && (
            <p className="mt-1 text-xs text-slate-500">
              Latest crawl source:{" "}
              <span className="text-slate-200">{scrapedData.url}</span>
            </p>
          )}
        </div>
        <div className="text-right text-xs text-slate-400">
          <p>
            Data health:{" "}
            <span className="font-semibold text-emerald-400">
              {products ? "98.2%" : "Waiting for crawl"}
            </span>
          </p>
          <p className="mt-1">
            Last sync:{" "}
            <span className="text-slate-200">Just now (session)</span>
          </p>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-slate-900/80">
          <h2 className="text-sm font-semibold text-slate-100">
            Sitemap / knowledge map
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            High-level view of which key pages have been fully trained. Treat
            this as a lightweight sitemap of your most important
            customer-facing pages.
          </p>
          <div className="mt-5 space-y-3 text-xs">
            {[
              { label: "Home (root)", status: "Fully trained" },
              { label: "About us", status: "Fully trained" },
              { label: "FAQ and Support", status: "Syncing" },
              { label: "Policies / Privacy policy", status: "Fully trained" },
              { label: "Policies / Refund policy", status: "Outdated" },
              { label: "Contact", status: "Fully trained" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-lg bg-slate-900/60 px-3 py-2"
              >
                <span className="text-slate-200">{item.label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusClass(item.status)}`}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="bg-slate-900/80">
          <h2 className="text-sm font-semibold text-slate-100">
            Product inventory
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Snapshot of catalog items detected from your latest crawl.
          </p>
            <div className="mt-4 space-y-3 text-xs">
              {products ? (
                products.map((p, idx) => (
                  <div
                    key={p.name + idx.toString()}
                    className="flex items-center justify-between rounded-lg bg-slate-900/60 px-3 py-2"
                  >
                    <div>
                      <p className="text-slate-200">{p.name}</p>
                      <p className="text-[11px] text-slate-500">
                        Imported from crawl - Item #{idx + 1}
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                      Active
                    </span>
                  </div>
                ))
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">
                    No products detected yet. Connect a store URL from the Create Bot step or add
                    products manually.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="text-xs"
                    onClick={() => router.push("/training-data/manual-products")}
                  >
                    Add products with AI
                  </Button>
                </div>
              )}
            </div>
        </Card>
      </section>

      <section className="mt-6">
        <Card className="bg-slate-900/80">
          <h2 className="text-sm font-semibold text-slate-100">
            Website feed
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Raw text feed extracted from your website (headings, paragraphs,
            lists, tables). This is what the AI uses as its base knowledge
            about your store.
          </p>
          {websiteFeed ? (
            <div className="mt-4 max-h-72 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/40 p-3 text-xs text-slate-300 whitespace-pre-wrap">
              {(() => {
                const cleaned = websiteFeed.replace(/\*+/g, "").replace(/• /g, "- ");
                if (cleaned.length <= 6000) return cleaned;
                const cut = cleaned.slice(0, 6000);
                const lastSpace = cut.lastIndexOf(" ");
                return lastSpace > 5500 ? cut.slice(0, lastSpace) : cut;
              })()}
              {websiteFeed.length > 6000 && (
                <span className="block pt-2 text-[11px] text-slate-500">
                  truncated for preview. Full content is still available to the
                  AI.
                </span>
              )}
            </div>
          ) : (
            <p className="mt-4 text-xs text-slate-500">
              Website content will appear here after a successful crawl.
            </p>
          )}
        </Card>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <p className="text-xs text-slate-500">
          Products are detected in real time from your latest website crawl.
        </p>
        <div className="flex flex-wrap gap-3">
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
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard")}
          >
            Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
