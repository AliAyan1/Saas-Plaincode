import { NextResponse } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import { checkRateLimit, LIMITS } from "@/lib/rate-limit";
import Stripe from "stripe";

function getBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL;
  const url = typeof raw === "string" ? raw.trim() : "";
  if (url) return url.startsWith("http") ? url : `https://${url}`;
  return "http://localhost:3000";
}

/**
 * Create a Stripe Checkout Session for Pro plan ($500/month subscription).
 * User must be logged in and on Pro signup flow (plan=pro in session or they came from payment page).
 */
export async function POST(req: Request) {
  const rl = checkRateLimit(req, "stripe-checkout", 10);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }
  const auth = await getAuthFromCookie();
  if (!auth?.userId || !auth?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_ID_PRO_MONTHLY;
  if (!secretKey || !priceId) {
    console.error("STRIPE_SECRET_KEY or STRIPE_PRICE_ID_PRO_MONTHLY not set");
    return NextResponse.json(
      { error: "Stripe is not configured. Please try again later." },
      { status: 503 }
    );
  }

  const stripe = new Stripe(secretKey, { apiVersion: "2026-02-25.clover" });
  const baseUrl = getBaseUrl();

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/dashboard?pro=success`,
      cancel_url: `${baseUrl}/signup/payment`,
      customer_email: auth.email,
      client_reference_id: auth.userId,
      metadata: {
        userId: auth.userId,
      },
      subscription_data: {
        metadata: {
          userId: auth.userId,
        },
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe create-checkout-session error:", err);
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 500 }
    );
  }
}
