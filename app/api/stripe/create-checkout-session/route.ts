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

type CheckoutPlan = "growth" | "pro" | "agency";

function priceIdForPlan(plan: CheckoutPlan): string | undefined {
  if (plan === "growth") return process.env.STRIPE_PRICE_ID_GROWTH_MONTHLY;
  if (plan === "pro") return process.env.STRIPE_PRICE_ID_PRO_MONTHLY;
  return process.env.STRIPE_PRICE_ID_AGENCY_MONTHLY;
}

/**
 * Creates Stripe Checkout for Growth ($79), Pro ($149), or Agency ($299) when price IDs are configured.
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

  let checkoutPlan: CheckoutPlan = "growth";
  try {
    const body = await req.json();
    const p = typeof body?.plan === "string" ? body.plan.toLowerCase() : "";
    if (p === "pro" || p === "growth" || p === "agency") checkoutPlan = p;
  } catch {
    /* empty body */
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = priceIdForPlan(checkoutPlan);
  if (!secretKey || !priceId) {
    console.error(
      "STRIPE_SECRET_KEY or price ID not set for plan:",
      checkoutPlan,
      "(STRIPE_PRICE_ID_GROWTH_MONTHLY / STRIPE_PRICE_ID_PRO_MONTHLY / STRIPE_PRICE_ID_AGENCY_MONTHLY)"
    );
    return NextResponse.json(
      { error: "Stripe is not configured for this plan. Please try again later." },
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
      success_url: `${baseUrl}/dashboard?checkout=success`,
      cancel_url: `${baseUrl}/signup/payment?plan=${checkoutPlan}`,
      customer_email: auth.email,
      client_reference_id: auth.userId,
      metadata: {
        userId: auth.userId,
        checkoutPlan,
      },
      subscription_data: {
        metadata: {
          userId: auth.userId,
          checkoutPlan,
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
