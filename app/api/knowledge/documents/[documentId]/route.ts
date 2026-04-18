import { NextResponse } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import { getDbConnection } from "@/lib/db";

export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  { params }: { params: { documentId: string } }
) {
  const auth = await getAuthFromCookie();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const documentId = params.documentId?.trim();
  if (!documentId) {
    return NextResponse.json({ error: "Missing document id" }, { status: 400 });
  }

  const conn = await getDbConnection();
  try {
    const [rows] = await conn.execute(
      `SELECT d.id FROM chatbot_documents d
       INNER JOIN chatbots c ON c.id = d.chatbot_id
       WHERE d.id = ? AND c.user_id = ?`,
      [documentId, auth.userId]
    );
    if ((rows as { id: string }[]).length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await conn.execute("DELETE FROM chatbot_documents WHERE id = ?", [documentId]);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === "ER_NO_SUCH_TABLE") {
      return NextResponse.json({ error: "Documents table not available. Run database migration." }, { status: 503 });
    }
    throw e;
  } finally {
    await conn.end();
  }
}
