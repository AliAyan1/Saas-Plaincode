import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Button from "@/components/Button";
import Card from "@/components/Card";

export default function HomePage() {
  return (
    <>
      <Navbar />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-slate-800 bg-slate-950 px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 lg:items-center">
              <div className="max-w-2xl">
                <div className="mb-6 flex flex-wrap gap-2">
                  <span className="rounded-full border border-primary-500/50 bg-primary-500/10 px-3 py-1 text-xs font-medium text-primary-400">
                    AI Engine
                  </span>
                  <span className="rounded-full border border-emerald-500/50 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                    No credit card required
                  </span>
                </div>
                <h1 className="text-4xl font-bold tracking-tight text-slate-100 sm:text-5xl lg:text-6xl">
                  AI Customer Support for E-commerce{" "}
                  <span className="bg-gradient-to-r from-primary-400 to-primary-500 bg-clip-text text-transparent">
                    — In One Click
                  </span>
                </h1>
                <p className="mt-6 text-lg text-slate-400">
                  Automatically create AI chatbots and voice bots trained on your website.
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Link href="/signup">
                    <Button variant="primary" className="min-w-[160px]">
                      Start Free Trial
                    </Button>
                  </Link>
                  <Link href="#pricing">
                    <Button variant="outline" className="min-w-[140px]">
                      View Pricing
                    </Button>
                  </Link>
                </div>
                <p className="mt-6 flex items-center gap-2 text-sm text-slate-500">
                  <span className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <span
                        key={i}
                        className="h-8 w-8 rounded-full border-2 border-slate-700 bg-slate-600"
                      />
                    ))}
                  </span>
                  Trusted by 2,000+ stores
                </p>
              </div>
              <div className="relative hidden lg:block">
                <div className="aspect-video rounded-2xl border border-slate-700 bg-slate-800/50 shadow-soft-lg flex items-center justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-500/20">
                    <svg
                      className="h-8 w-8 text-primary-400"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="border-b border-slate-800 bg-slate-950 px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary-400">
              How It Works
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-100 sm:text-4xl">
              Go live in 3 simple steps
            </h2>
            <div className="mt-12 grid gap-8 sm:grid-cols-3">
              {[
                {
                  step: 1,
                  title: "Enter your website URL",
                  description:
                    "Paste your store URL and we’ll discover and index your pages automatically.",
                  icon: (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  ),
                },
                {
                  step: 2,
                  title: "Customize chatbot personality",
                  description:
                    "Set tone, FAQs, and behavior so the bot matches your brand.",
                  icon: (
                    <>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </>
                  ),
                },
                {
                  step: 3,
                  title: "Integrate and go live",
                  description:
                    "Add one snippet to your site or connect your help center. You’re live.",
                  icon: (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  ),
                },
              ].map((item) => (
                <div key={item.step} className="flex flex-col items-center text-center sm:items-start sm:text-left">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-500 text-lg font-bold text-white shadow-soft">
                    {item.step}
                  </div>
                  <Card className="mt-4 flex-1 w-full">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-500/20 text-primary-400">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        {item.icon}
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-100">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-slate-400">{item.description}</p>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-slate-800 bg-slate-950 px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-3xl font-bold text-slate-100 sm:text-4xl">
              Everything you need to automate
            </h2>
            <p className="mt-4 max-w-2xl text-lg text-slate-400">
              Stop drowning in tickets. Get a world-class support layer for a fraction of the cost.
            </p>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  title: "Website URL Scraping",
                  description:
                    "We crawl your site and product pages so the AI knows your catalog and policies.",
                  icon: (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9a9 9 0 009-9m-9 9a9 9 0 009 9m-9-9a9 9 0 009-9"
                    />
                  ),
                },
                {
                  title: "AI Chatbot & Voice Bot",
                  description:
                    "Deploy chat and voice agents that resolve issues and upsell 24/7.",
                  icon: (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0V8m0 0H6"
                    />
                  ),
                },
                {
                  title: "15 Free Conversations",
                  description:
                    "Start with 15 free conversations per month. No credit card required.",
                  icon: (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  ),
                },
                {
                  title: "One-Click Integration",
                  description:
                    "Add a script tag or install our app. No coding or complex setup.",
                  icon: (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  ),
                },
              ].map((f) => (
                <Card key={f.title} className="h-full">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/20 text-primary-400">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      {f.icon}
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-100">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-slate-400">{f.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="border-t border-slate-800 bg-slate-900/50 px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-3xl font-bold text-slate-100 sm:text-4xl">
              Transparent pricing
            </h2>
            <p className="mt-4 text-lg text-slate-400">
              Start for free and scale as your shop grows.
            </p>
            <div className="mt-12 grid gap-8 lg:grid-cols-3">
              {[
                {
                  name: "Starter",
                  sub: "Free",
                  price: "$0",
                  period: "/mo",
                  features: [
                    "15 conversations/month",
                    "1 chatbot",
                    "Website scraping",
                    "Email support",
                  ],
                  cta: "Start Free Trial",
                  variant: "outline" as const,
                  recommended: false,
                },
                {
                  name: "Business",
                  sub: "",
                  price: "$99",
                  period: "/mo",
                  features: [
                    "500 conversations/month",
                    "Unlimited chatbots",
                    "Voice + chat",
                    "Priority support",
                  ],
                  cta: "Get Started",
                  variant: "primary" as const,
                  recommended: true,
                },
                {
                  name: "Pro",
                  sub: "",
                  price: "$299",
                  period: "/mo",
                  features: [
                    "Unlimited conversations",
                    "Custom integrations",
                    "Dedicated success manager",
                    "SLA & compliance",
                  ],
                  cta: "Contact Sales",
                  variant: "outline" as const,
                  recommended: false,
                },
              ].map((plan) => (
                <Card
                  key={plan.name}
                  className={`relative flex flex-col ${
                    plan.recommended
                      ? "ring-2 ring-primary-500 shadow-soft-lg"
                      : ""
                  }`}
                >
                  {plan.recommended && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary-500 px-3 py-1 text-xs font-semibold text-white">
                      Recommended
                    </div>
                  )}
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-slate-100">
                      {plan.price}
                    </span>
                    <span className="text-slate-400">{plan.period}</span>
                  </div>
                  <h3 className="mt-2 text-xl font-semibold text-slate-100">
                    {plan.name}
                    {plan.sub && (
                      <span className="ml-2 text-sm font-normal text-slate-400">
                        ({plan.sub})
                      </span>
                    )}
                  </h3>
                  <ul className="mt-6 flex-1 space-y-3">
                    {plan.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-center gap-2 text-slate-400"
                      >
                        <svg
                          className="h-5 w-5 shrink-0 text-primary-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8">
                    <Link href={plan.recommended ? "/signup" : "/signup"}>
                      <Button
                        variant={plan.variant}
                        fullWidth
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

        {/* CTA */}
        <section className="border-t border-slate-800 bg-slate-950 px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold text-slate-100 sm:text-4xl">
              Ready to automate your store?
            </h2>
            <p className="mt-4 text-lg text-slate-400">
              Start your free trial. Setup takes less than 2 minutes.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link href="/signup">
                <Button variant="primary" className="min-w-[160px]">
                  Get Started Free
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" className="min-w-[160px]">
                  Talk to an Expert
                </Button>
              </Link>
            </div>
            <p className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500">
              <span className="text-primary-400">Secure & GDPR compliant</span>
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
