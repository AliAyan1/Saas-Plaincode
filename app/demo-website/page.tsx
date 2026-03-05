"use client";

import Link from "next/link";
import ChatWidget from "@/components/ChatWidget";

const PRODUCTS = [
  {
    name: "NovaGlow Hydrating Serum",
    price: "$39",
    tag: "Bestseller",
    description: "Hyaluronic acid & vitamin C for all-day hydration and a healthy glow.",
    gradient: "from-amber-900/40 via-slate-800 to-slate-900",
  },
  {
    name: "Cloud Silk Moisturizer",
    price: "$32",
    tag: "New",
    description: "Lightweight, non-greasy formula. Perfect for all skin types.",
    gradient: "from-sky-900/30 via-slate-800 to-slate-900",
  },
  {
    name: "Night Repair Oil",
    price: "$48",
    tag: "Premium",
    description: "Overnight nourishment with natural oils and peptides.",
    gradient: "from-violet-900/30 via-slate-800 to-slate-900",
  },
  {
    name: "Daily SPF 30 Gel",
    price: "$28",
    description: "Invisible finish, no white cast. Protects and hydrates.",
    gradient: "from-emerald-900/30 via-slate-800 to-slate-900",
  },
];

export default function DemoWebsitePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-slate-100">
              NovaGlow
            </span>
            <span className="rounded bg-primary-500/20 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary-400">
              Demo
            </span>
          </Link>
          <nav className="flex items-center gap-6">
            <a href="#products" className="text-sm text-slate-400 transition hover:text-slate-100">
              Shop
            </a>
            <a href="#about" className="text-sm text-slate-400 transition hover:text-slate-100">
              About
            </a>
            <Link
              href="/dashboard"
              className="text-sm text-slate-400 transition hover:text-primary-400"
            >
              Back to app
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-slate-800/80">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-950/20 via-slate-950 to-slate-950" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,var(--tw-gradient-stops))] from-primary-500/10 via-transparent to-transparent" />
          <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-sm font-medium uppercase tracking-wider text-primary-400">
                Skincare that works
              </p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-50 sm:text-5xl lg:text-6xl">
                Glow from the inside out
              </h1>
              <p className="mt-5 text-lg text-slate-400">
                Clean, effective formulas for every skin type. Free shipping on orders over $50. Questions? Our AI assistant is here to help — tap the chat button.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href="#products"
                  className="inline-flex items-center justify-center rounded-xl bg-primary-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-500/25 transition hover:bg-primary-400"
                >
                  Shop now
                </a>
                <a
                  href="#about"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-600 bg-slate-800/50 px-5 py-3 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
                >
                  Our story
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Trust strip */}
        <section className="border-b border-slate-800/80 bg-slate-900/30">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 text-sm text-slate-400">
              <span className="flex items-center gap-2">
                <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Free shipping over $50
              </span>
              <span className="flex items-center gap-2">
                <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                30-day returns
              </span>
              <span className="flex items-center gap-2">
                <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Cruelty-free
              </span>
            </div>
          </div>
        </section>

        {/* Products */}
        <section id="products" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">
              Best sellers
            </h2>
            <p className="mt-2 text-slate-400">
              Formulas loved by thousands
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PRODUCTS.map((product) => (
              <article
                key={product.name}
                className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 transition hover:border-slate-700 hover:bg-slate-900/80"
              >
                <div className={`aspect-[3/4] w-full bg-gradient-to-b ${product.gradient}`} />
                <div className="p-4 sm:p-5">
                  {product.tag && (
                    <span className="inline-block rounded-full bg-primary-500/20 px-2 py-0.5 text-xs font-medium text-primary-400">
                      {product.tag}
                    </span>
                  )}
                  <h3 className="mt-2 font-semibold text-slate-100 group-hover:text-primary-400">
                    {product.name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-400 line-clamp-2">
                    {product.description}
                  </p>
                  <p className="mt-3 text-lg font-bold text-primary-400">
                    {product.price}
                  </p>
                  <button
                    type="button"
                    className="mt-3 w-full rounded-lg border border-slate-600 py-2 text-sm font-medium text-slate-200 transition hover:border-primary-500 hover:bg-primary-500/10 hover:text-primary-400"
                  >
                    Add to bag
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* About / CTA */}
        <section id="about" className="border-t border-slate-800/80 bg-slate-900/20">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">
                Clean ingredients, real results
              </h2>
              <p className="mt-4 text-slate-400">
                We believe great skincare doesn’t need a long ingredient list. Every product is formulated to be effective, gentle, and transparent. Need help choosing or have a question? Use the chat in the corner — we’re here for you.
              </p>
              <Link
                href="/dashboard"
                className="mt-8 inline-block text-sm font-medium text-primary-400 hover:underline"
              >
                ← Return to dashboard
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-800/80 px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
              <span className="text-sm font-semibold text-slate-300">
                NovaGlow
              </span>
              <div className="flex gap-6 text-sm text-slate-500">
                <a href="#products" className="hover:text-slate-300">Shop</a>
                <a href="#about" className="hover:text-slate-300">About</a>
                <Link href="/dashboard" className="hover:text-primary-400">App</Link>
              </div>
            </div>
            <p className="mt-6 text-center text-xs text-slate-600">
              Demo storefront — chat button in the corner uses your configured chatbot.
            </p>
          </div>
        </footer>
      </main>

      <ChatWidget />
    </div>
  );
}
