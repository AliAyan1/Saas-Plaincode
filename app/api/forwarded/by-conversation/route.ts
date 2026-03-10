import { NextRequest, NextResponse } from "next/server";
import { getDbConnection } from "@/lib/db";

const corsHeaders = { "Access-Control-Allow-Origin": "*" };

export const dynamic = "force-dynamic";

/** Public: get support reply for a conversation (so chat/widget can show support reply) */
export async function GET(req: NextRequest) {
  try {
    const conversationId = req.nextUrl.searchParams.get("conversationId");
    if (!conversationId) {
      return NextResponse.json({ error: "conversationId required" }, { status: 400, headers: corsHeaders });
    }

    const conn = await getDbConnection();
    const [rows] = await conn.execute(
      "SELECT reply_text AS replyText, replied_at AS repliedAt FROM forwarded_conversations WHERE conversation_id = ? AND reply_text IS NOT NULL AND reply_text != '' ORDER BY replied_at DESC LIMIT 1",
      [conversationId]
    );
    await conn.end();

    const row = (rows as { replyText: string; repliedAt: string }[])[0];
    if (!row) {
      return NextResponse.json({ replyText: null, repliedAt: null }, { headers: corsHeaders });
    }

    return NextResponse.json(
      { replyText: row.replyText, repliedAt: row.repliedAt },
      { headers: corsHeaders }
    );
  } catch (err) {
    console.error("Forwarded by-conversation error:", err);
    return NextResponse.json({ error: "Failed to load" }, { status: 500, headers: corsHeaders });
  }
}
