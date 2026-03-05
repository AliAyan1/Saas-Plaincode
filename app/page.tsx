import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Button from "@/components/Button";
import Card from "@/components/Card";
import AiDemoSection from "@/components/AiDemoSection";
import LandingChatSection from "@/components/LandingChatSection";
import HeroSection from "@/components/HeroSection";
import AnimatedSection from "@/components/AnimatedSection";

export default function HomePage() {
  return (
    <>
      <Navbar />

      <main>
        {/* Hero */}
        <HeroSection />

        {/* How It Works */}
        <section id="how-it-works" className="border-b border-slate-800 bg-black px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <AnimatedSection variant="fade-up">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary-400">
                How It Works
              </p>
              <h2 className="mt-2 text-3xl font-bold text-slate-100 sm:text-4xl">
                Go live in 3 simple steps
              </h2>
            </AnimatedSection>
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
              ].map((item, idx) => (
                <AnimatedSection key={item.step} variant="fade-up" delay={150 + idx * 100}>
                  <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-500 text-lg font-bold text-white shadow-soft transition-transform hover:scale-110">
                      {item.step}
                    </div>
                    <Card className="mt-4 flex-1 w-full transition-all hover:border-primary-500/30 hover:shadow-soft-lg">
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
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-slate-800 bg-black px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <AnimatedSection variant="fade-up">
              <h2 className="text-3xl font-bold text-slate-100 sm:text-4xl">
                Everything you need to automate
              </h2>
              <p className="mt-4 max-w-2xl text-lg text-slate-400">
                Stop drowning in tickets. Get a world-class support layer for a fraction of the cost.
              </p>
            </AnimatedSection>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                  title: "100 Free Conversations",
                  description:
                    "Start with 100 free conversations per month. No credit card required.",
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
                  title: "Ticket Creation",
                  description:
                    "AI automatically creates support tickets when queries need follow-up or human review.",
                  icon: (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                    />
                  ),
                },
                {
                  title: "Forward to Email",
                  description:
                    "Forward entire conversations to your team's inbox with one click.",
                  icon: (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
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
              ].map((f, idx) => (
                <AnimatedSection key={f.title} variant="fade-up" delay={100 + idx * 80}>
                  <Card className="h-full transition-all hover:scale-[1.02] hover:border-primary-500/30 hover:shadow-soft-lg">
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
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* AI Demo */}
        <AiDemoSection />

        {/* Live chat + dashboard preview */}
        <LandingChatSection />

        {/* Pricing */}
        <section id="pricing" className="relative border-t border-slate-800 bg-slate-900/30 px-4 py-16 sm:px-6 lg:px-8 lg:py-24 overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-primary-500/5 blur-[120px]" />
          </div>
          <div className="relative mx-auto max-w-7xl">
            <AnimatedSection variant="fade-up">
              <h2 className="text-3xl font-bold text-slate-100 sm:text-4xl">
                Transparent pricing
              </h2>
              <p className="mt-4 text-lg text-slate-400">
                Start for free and scale as your shop grows.
              </p>
            </AnimatedSection>
            <div className="mt-12 grid gap-8 lg:grid-cols-2 max-w-4xl mx-auto">
              {[
                {
                  name: "Free",
                  sub: "",
                  price: "$0",
                  period: "/mo",
                  features: [
                    "100 conversations/month",
                    "1 chatbot",
                    "Website scraping",
                  ],
                  cta: "Start Free Trial",
                  variant: "outline" as const,
                  recommended: false,
                },
                {
                  name: "Pro",
                  sub: "",
                  price: "$99",
                  period: "/mo",
                  features: [
                    "Forward full conversations to email",
                    "Automatic ticket creation",
                    "Increased conversion",
                    "Email support",
                    "Standard integration (add other integrations)",
                    "500 conversations/month",
                    "Unlimited chatbots",
                  ],
                  cta: "Get Started",
                  variant: "primary" as const,
                  recommended: true,
                },
              ].map((plan, idx) => (
                <AnimatedSection key={plan.name} variant="scale-in" delay={150 + idx * 100}>
                <Card
                  className={`relative flex flex-col transition-all hover:scale-[1.02] ${
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
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative border-t border-slate-800 bg-black px-4 py-16 sm:px-6 lg:px-8 lg:py-20 overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-primary-500/10 blur-[120px] animate-glow-pulse" />
          </div>
          <AnimatedSection variant="fade-up" className="relative mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold text-slate-100 sm:text-4xl">
              Ready to automate your store?
            </h2>
            <p className="mt-4 text-lg text-slate-400">
              Start your free trial. Setup takes less than 2 minutes.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link href="/signup">
                <Button variant="primary" className="min-w-[160px] transition-transform hover:scale-105 active:scale-95">
                  Get Started Free
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" className="min-w-[160px] transition-transform hover:scale-105 active:scale-95">
                  Talk to an Expert
                </Button>
              </Link>
            </div>
            <p className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500">
              <span className="text-primary-400">Secure & GDPR compliant</span>
            </p>
          </AnimatedSection>
        </section>
      </main>

      <Footer />
    </>
  );
}
