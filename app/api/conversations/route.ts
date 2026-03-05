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
    const [rows] = await conn.execute(
      `SELECT c.id, c.customer_name AS customerName, c.customer_email AS customerEmail,
       c.status, c.created_at AS createdAt,
       (SELECT content FROM chat_messages WHERE conversation_id = c.id AND role = 'user' ORDER BY created_at ASC LIMIT 1) AS preview
       FROM conversations c
       INNER JOIN chatbots b ON b.id = c.chatbot_id AND b.user_id = ?
       ORDER BY c.created_at DESC
       LIMIT 100`,
      [auth.userId]
    );
    await conn.end();

    const list = (rows as {
      id: string;
      customerName: string | null;
      customerEmail: string | null;
      status: string;
      createdAt: Date;
      preview: string | null;
    }[]).map((r) => ({
      id: r.id,
      customer: r.customerName || r.customerEmail || "Guest",
      preview: r.preview || "No messages",
      date: r.createdAt,
      status: r.status,
    }));

    return NextResponse.json({ conversations: list });
  } catch (err) {
    console.error("GET /api/conversations:", err);
    return NextResponse.json({ error: "Failed to load conversations." }, { status: 500 });
  }
}
