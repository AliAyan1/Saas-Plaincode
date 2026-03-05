import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-black">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} Plaincode&apos;s AI Chatbot. All rights reserved.
          </p>
          <nav className="flex flex-wrap items-center justify-center gap-6">
            <Link
              href="/privacy"
              className="text-sm text-slate-400 hover:text-primary-400"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-slate-400 hover:text-primary-400"
            >
              Terms
            </Link>
            <Link
              href="/contact"
              className="text-sm text-slate-400 hover:text-primary-400"
            >
              Contact
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
