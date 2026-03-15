"use client";

import Link from "next/link";
import Button from "./Button";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-slate-800 bg-black px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
      {/* Background graphics */}
      <div className="pointer-events-none absolute inset-0">
        {/* Gradient orbs */}
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary-500/10 blur-[100px] animate-float" />
        <div className="absolute top-1/2 -left-32 h-64 w-64 rounded-full bg-sky-500/5 blur-[80px] animate-float" style={{ animationDelay: "-2s" }} />
        <div className="absolute bottom-0 right-1/4 h-48 w-48 rounded-full bg-emerald-500/5 blur-[60px] animate-float" style={{ animationDelay: "-4s" }} />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <div className="mb-6 flex flex-wrap gap-2 opacity-0 animate-fade-in-down">
            <span className="rounded-full border border-primary-500/50 bg-primary-500/10 px-3 py-1 text-xs font-medium text-primary-400">
              AI Engine
            </span>
            <span className="rounded-full border border-emerald-500/50 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
              No credit card required
            </span>
          </div>
          <h1 className="opacity-0 animate-fade-in-up text-3xl font-bold tracking-tight text-slate-100 sm:text-4xl md:text-5xl lg:text-6xl [animation-delay:100ms] [animation-fill-mode:both]">
            <span className="bg-gradient-to-r from-primary-400 to-primary-500 bg-clip-text text-transparent">
              Plainbot
            </span>
            <span className="mt-2 block text-lg font-normal text-slate-500 sm:text-xl md:text-2xl [animation-delay:100ms]">
              Powered by Plaincode
            </span>
          </h1>
          <p className="mt-6 opacity-0 animate-fade-in-up text-lg text-slate-400 [animation-delay:200ms] [animation-fill-mode:both]">
            Automatically create AI chatbots and voice bots trained on your website.
          </p>
          <p className="mt-3 opacity-0 animate-fade-in-up text-base text-slate-500 [animation-delay:250ms] [animation-fill-mode:both]">
            Resolve orders, create tickets, and forward conversations — all on autopilot.
          </p>
          <div className="mt-8 flex flex-wrap gap-4 opacity-0 animate-fade-in-up [animation-delay:350ms] [animation-fill-mode:both]">
            <Link href="/pricing">
              <Button variant="primary" className="min-w-[160px] transition-transform hover:scale-[1.02] active:scale-[0.98]">
                Start Free Trial
              </Button>
            </Link>
          </div>
          <div className="mt-8 flex flex-col gap-4 opacity-0 animate-fade-in-up [animation-delay:450ms] [animation-fill-mode:both]">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className="h-8 w-8 rounded-full border-2 border-slate-700 bg-slate-600 flex items-center justify-center text-xs text-slate-400 font-medium"
                  />
                ))}
              </span>
              <span className="text-sm text-slate-500">Trusted by 200 customers</span>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2 transition-transform hover:scale-105">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15">
                  <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-100">92%</p>
                  <p className="text-[11px] text-slate-500">Resolution rate</p>
                </div>
              </div>
              <div className="flex items-center gap-2 transition-transform hover:scale-105">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500/15">
                  <svg className="h-4 w-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-100">&lt; 5s</p>
                  <p className="text-[11px] text-slate-500">Avg response</p>
                </div>
              </div>
              <div className="flex items-center gap-2 transition-transform hover:scale-105">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/15">
                  <svg className="h-4 w-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-100">24/7</p>
                  <p className="text-[11px] text-slate-500">Availability</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
