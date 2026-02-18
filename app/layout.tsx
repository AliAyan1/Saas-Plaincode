import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ecommerce Support in One Click | AI Customer Support for E-commerce",
  description:
    "Automatically create AI chatbots and voice bots trained on your website.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased min-h-screen bg-slate-950 text-slate-100 font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
