import { NextResponse } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import { getDbConnection } from "@/lib/db";

export async function GET() {
  const auth = await getAuthFromCookie();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const conn = await getDbConnection();
    const [userRow] = await conn.execute(
      "SELECT conversation_limit AS conversationLimit FROM users WHERE id = ?",
      [auth.userId]
    );
    const limit = (userRow as { conversationLimit: number }[])[0]?.conversationLimit ?? 100;

    const [countRow] = await conn.execute(
      `SELECT COUNT(*) AS total FROM conversations c
       INNER JOIN chatbots b ON b.id = c.chatbot_id AND b.user_id = ?`,
      [auth.userId]
    );
    const total = (countRow as { total: number }[])[0]?.total ?? 0;

    await conn.end();

    return NextResponse.json({
      totalConversations: total,
      conversationLimit: limit,
      remaining: Math.max(0, limit - total),
    });
  } catch (err) {
    console.error("GET /api/conversations/stats:", err);
    return NextResponse.json({ error: "Failed to load stats." }, { status: 500 });
  }
}
