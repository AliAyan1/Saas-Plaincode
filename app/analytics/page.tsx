"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Card from "@/components/Card";

export default function AnalyticsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-80px)] bg-slate-950 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-8">
          <header className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-100">
                Forwarded Conversations Analytics
              </h1>
              <p className="mt-2 text-sm text-slate-400">
                High-level view of escalations and handoffs from your ecommerce assistant.
              </p>
            </div>
          </header>

          <section className="grid gap-4 md:grid-cols-3">
            <Card className="bg-slate-900/80">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Total forwarded
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-50">842</p>
              <p className="mt-1 text-xs text-emerald-400">+12% vs last week</p>
              <p className="mt-3 text-xs text-slate-500">
                Total escalations this week
              </p>
            </Card>
            <Card className="bg-slate-900/80">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Sent to email
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-50">528</p>
              <p className="mt-1 text-xs text-slate-400">62.7% to support inbox</p>
            </Card>
            <Card className="bg-slate-900/80">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Live agent transfers
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-50">314</p>
              <p className="mt-1 text-xs text-slate-400">37.3% direct handoffs</p>
            </Card>
          </section>

          <section className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2 bg-slate-900/80">
              <h2 className="text-sm font-semibold text-slate-100">
                Handoff distribution
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Breakdown of reasons for conversation escalation.
              </p>
              <div className="mt-5 space-y-4 text-xs text-slate-300">
                <div>
                  <div className="flex justify-between">
                    <span>Refund request</span>
                    <span className="text-slate-400">42%</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-slate-800">
                    <div className="h-2 w-[42%] rounded-full bg-primary-500" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between">
                    <span>Frustrated customer</span>
                    <span className="text-slate-400">28%</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-slate-800">
                    <div className="h-2 w-[28%] rounded-full bg-orange-400" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between">
                    <span>Complex technical issue</span>
                    <span className="text-slate-400">15%</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-slate-800">
                    <div className="h-2 w-[15%] rounded-full bg-sky-400" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between">
                    <span>Out of scope inquiry</span>
                    <span className="text-slate-400">15%</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-slate-800">
                    <div className="h-2 w-[15%] rounded-full bg-slate-500" />
                  </div>
                </div>
              </div>
            </Card>

            <div className="space-y-4">
              <Card className="bg-slate-900/80">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Peak time
                </p>
                <p className="mt-3 text-lg font-semibold text-slate-50">
                  2:00 PM – 4:00 PM
                </p>
              </Card>
              <Card className="bg-slate-900/80">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Avg. response time
                </p>
                <p className="mt-3 text-lg font-semibold text-slate-50">4.2 minutes</p>
              </Card>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}

