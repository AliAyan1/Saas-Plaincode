import { NextResponse } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import { sendProWelcomeEmail } from "@/lib/send-welcome-emails";

export async function POST() {
  const auth = await getAuthFromCookie();
  if (!auth?.userId || !auth?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (auth.plan !== "pro" && auth.plan !== "custom") {
    return NextResponse.json({ error: "Pro or Custom plan required" }, { status: 400 });
  }
  const result = await sendProWelcomeEmail(auth.email, auth.email.split("@")[0]);
  if (!result.ok) {
    return NextResponse.json({ error: result.error || "Failed to send email" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
