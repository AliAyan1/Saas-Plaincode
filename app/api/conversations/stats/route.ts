import { NextResponse } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import { getDbConnection } from "@/lib/db";

/** Current month YYYY-MM for usage period */
function currentPeriod(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export async function GET() {
  const auth = await getAuthFromCookie();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const conn = await getDbConnection();
    const period = currentPeriod();
    const [userRow] = await conn.execute(
      "SELECT conversation_limit AS conversationLimit FROM users WHERE id = ?",
      [auth.userId]
    );
    const limit = (userRow as { conversationLimit: number }[])[0]?.conversationLimit ?? 100;

    const [usageRow] = await conn.execute(
      "SELECT count_used AS countUsed FROM conversation_usage WHERE user_id = ? AND period_month = ?",
      [auth.userId, period]
    );
    const countUsed = (usageRow as { countUsed: number }[])[0]?.countUsed ?? 0;

    await conn.end();

    return NextResponse.json({
      totalConversations: countUsed,
      conversationLimit: limit,
      remaining: Math.max(0, limit - countUsed),
      period,
    });
  } catch (err) {
    console.error("GET /api/conversations/stats:", err);
    return NextResponse.json({ error: "Failed to load stats." }, { status: 500 });
  }
}
