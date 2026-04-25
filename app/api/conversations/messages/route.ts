import { NextRequest, NextResponse } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import { getDbConnection } from "@/lib/db";

export const runtime = "nodejs";

/**
 * Load chat messages for a conversation (owner-only). Used to hydrate the test widget after page refresh.
 */
export async function GET(req: NextRequest) {
  const auth = await getAuthFromCookie();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversationId = req.nextUrl.searchParams.get("conversationId")?.trim() ?? "";
  const chatbotId = req.nextUrl.searchParams.get("chatbotId")?.trim() ?? "";
  if (!conversationId || !chatbotId) {
    return NextResponse.json({ error: "conversationId and chatbotId are required" }, { status: 400 });
  }

  const conn = await getDbConnection();
  try {
    const [convCheck] = await conn.execute(
      `SELECT c.id
       FROM conversations c
       INNER JOIN chatbots b ON b.id = c.chatbot_id
       WHERE c.id = ? AND b.id = ? AND b.user_id = ?`,
      [conversationId, chatbotId, auth.userId]
    );
    if ((convCheck as { id: string }[]).length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const [rows] = await conn.execute(
      `SELECT cm.id, cm.role, cm.content
       FROM chat_messages cm
       WHERE cm.conversation_id = ?
       ORDER BY cm.created_at ASC`,
      [conversationId]
    );
    const list = (rows as { id: string; role: string; content: string }[]).map((r) => ({
      id: r.id,
      role: r.role === "user" || r.role === "assistant" ? r.role : "assistant",
      content: typeof r.content === "string" ? r.content : "",
    }));
    return NextResponse.json({ messages: list });
  } finally {
    await conn.end();
  }
}
