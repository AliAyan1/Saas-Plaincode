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
      `SELECT id, type, title, detail, created_at AS createdAt
       FROM activity_log WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
      [auth.userId]
    );
    await conn.end();

    const list = (rows as { id: string; type: string; title: string; detail: string | null; createdAt: Date }[]).map(
      (r) => ({
        id: r.id,
        type: r.type,
        title: r.title,
        detail: r.detail || "",
        createdAt: new Date(r.createdAt).getTime(),
      })
    );

    return NextResponse.json({ activity: list });
  } catch (err) {
    console.error("GET /api/activity:", err);
    return NextResponse.json({ error: "Failed to load activity." }, { status: 500 });
  }
}
