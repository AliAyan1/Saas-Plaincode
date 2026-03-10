"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Button from "@/components/Button";
import Card from "@/components/Card";

const CheckIcon = () => (
  <svg className="h-5 w-5 shrink-0 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

export default function PricingPage() {
  const plans = [
    {
      id: "free",
      name: "Free",
      price: "$0",
      period: "/month",
      tagline: "Perfect for trying us out",
      features: [
        "100 conversations per month",
        "1 chatbot",
        "Website scraping",
        "Email when limit reached, upgrade anytime",
        "Same dashboard — upgrade to get more conversations",
      ],
      cta: "Start Free",
      href: "/signup?plan=free",
      variant: "outline" as const,
      recommended: false,
    },
    {
      id: "pro",
      name: "Pro",
      price: "$500",
      period: "/month",
      tagline: "Same as Free, more conversations",
      features: [
        "500 conversations per month",
        "Everything in Free (1 chatbot, website scraping)",
        "Forward full conversations to email",
        "Email when limit reached — renew same or other plan",
        "Same dashboard, just 500 conversations",
      ],
      cta: "Get Started",
      href: "/signup?plan=pro",
      variant: "primary" as const,
      recommended: false,
    },
    {
      id: "custom",
      name: "Custom",
      price: "Custom",
      period: "",
      tagline: "Full custom integration",
      features: [
        "Custom integration with your systems",
        "Schedule a meeting via Calendly",
        "Your chatbot will be live in 7 days",
        "Payment after the meeting — no upfront integration",
        "Dashboard opens with setup status",
      ],
      cta: "Schedule a meeting",
      href: "/signup?plan=custom",
      variant: "primary" as const,
      recommended: true,
    },
  ];

  return (
    <>
      <Navbar />
      <main className="bg-black">
        <section className="border-b border-slate-800 bg-black px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight text-slate-100 sm:text-4xl lg:text-5xl">
                Simple, transparent pricing
              </h1>
              <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-400">
                Choose the plan that fits your business. Start free, upgrade when you need more.
              </p>
            </div>

            <div className="mt-12 grid gap-8 sm:grid-cols-3 lg:gap-10">
              {plans.map((plan) => (
                <Card
                  key={plan.id}
                  className={`relative flex flex-col overflow-hidden ${
                    plan.recommended
                      ? "ring-2 ring-primary-500 shadow-soft-lg bg-slate-800/80 border-primary-500/50"
                      : "border-slate-700 bg-slate-800/60"
                  }`}
                >
                  {plan.recommended && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-primary-600" />
                  )}
                  {plan.recommended && (
                    <div className="absolute top-4 right-4">
                      <span className="rounded-full bg-primary-500 px-3 py-1 text-xs font-semibold text-white">
                        Most popular
                      </span>
                    </div>
                  )}
                  <div className="pt-6 pb-2">
                    <h2 className="text-xl font-bold text-slate-100">{plan.name}</h2>
                    <p className="mt-1 text-sm text-slate-500">{plan.tagline}</p>
                    <div className="mt-6 flex items-baseline gap-1">
                      <span className="text-4xl font-bold tracking-tight text-slate-100">
                        {plan.price}
                      </span>
                      {plan.period && (
                        <span className="text-slate-500">{plan.period}</span>
                      )}
                    </div>
                  </div>
                  <ul className="flex-1 space-y-3 py-6 border-t border-slate-700">
                    {plan.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-3 text-slate-300"
                      >
                        <CheckIcon />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="pt-4">
                    <Link href={plan.href} className="block">
                      <Button
                        variant={plan.variant}
                        fullWidth
                        className={plan.recommended ? "shadow-soft" : ""}
                      >
                        {plan.cta}
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
