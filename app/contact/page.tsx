import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import type { Metadata } from "next";

const CONTACT_EMAIL = "hello@plainbot.io";
const CALENDLY_URL = "https://calendly.com/mahrukh-plaincode";

export const metadata: Metadata = {
  title: "Contact Us | Plainbot",
  description: "Get in touch with Plainbot. Email hello@plainbot.io for support, demos, or to talk to an expert.",
};

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-black">
        <section className="border-b border-slate-800 px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary-400">
              Get in touch
            </p>
            <h1 className="mt-4 text-3xl font-bold text-slate-100 sm:text-4xl">
              Contact Us
            </h1>
            <p className="mt-6 text-lg text-slate-400">
              Have a question, need a demo, or want to talk to an expert? We’re here to help.
            </p>

            <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/50 p-8">
              <p className="text-sm font-medium text-slate-500">Email</p>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="mt-2 inline-block text-xl font-semibold text-primary-400 hover:text-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-black rounded-lg"
              >
                {CONTACT_EMAIL}
              </a>
              <p className="mt-6 text-sm text-slate-500">
                We usually reply within 24 hours.
              </p>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <a
                href={CALENDLY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-w-[200px] items-center justify-center rounded-xl border-2 border-primary-500 bg-primary-500/10 px-6 py-3 text-base font-semibold text-primary-400 transition-all hover:bg-primary-500/20 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-black"
              >
                Schedule a demo
              </a>
            </div>
            <p className="mt-6 text-sm text-primary-400">PR compliant</p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
