import { NextRequest, NextResponse } from "next/server";
import { getDbConnection } from "@/lib/db";
import { conversationLimitForPlan, normalizePlanParam } from "@/lib/plans";

const DEV_ONLY = process.env.NODE_ENV !== "production";

export async function GET() {
  if (!DEV_ONLY) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }
  try {
    const conn = await getDbConnection();
    const [userRows] = await conn.execute(
      "SELECT id, email, name, plan, conversation_limit AS conversationLimit, created_at AS createdAt FROM users ORDER BY created_at DESC"
    );
    const users = userRows as { id: string; email: string; name: string | null; plan: string; conversationLimit: number; createdAt: string }[];
    const [chatbotRows] = await conn.execute(
      "SELECT id, user_id AS userId, name, website_url AS websiteUrl FROM chatbots ORDER BY created_at DESC"
    );
    const chatbotsByUser = (chatbotRows as { id: string; userId: string; name: string; websiteUrl: string }[]).reduce(
      (acc, c) => {
        if (!acc[c.userId]) acc[c.userId] = [];
        acc[c.userId].push({ id: c.id, name: c.name, websiteUrl: c.websiteUrl });
        return acc;
      },
      {} as Record<string, { id: string; name: string; websiteUrl: string }[]>
    );
    let endpointsByUser: Record<string, { id: string; name: string; baseUrl: string; authType: string }[]> = {};
    try {
      const [epRows] = await conn.execute(
        "SELECT id, user_id AS userId, name, base_url AS baseUrl, auth_type AS authType FROM user_external_endpoints WHERE is_active = 1"
      );
      endpointsByUser = (epRows as { id: string; userId: string; name: string; baseUrl: string; authType: string }[]).reduce(
        (acc, e) => {
          if (!acc[e.userId]) acc[e.userId] = [];
          acc[e.userId].push({ id: e.id, name: e.name, baseUrl: e.baseUrl, authType: e.authType });
          return acc;
        },
        {} as Record<string, { id: string; name: string; baseUrl: string; authType: string }[]>
      );
    } catch {
      /* user_external_endpoints table may not exist yet; run migration 003 */
    }
    await conn.end();
    const usersWithChatbots = users.map((u) => ({
      ...u,
      chatbots: chatbotsByUser[u.id] || [],
      endpoints: endpointsByUser[u.id] || [],
    }));
    return NextResponse.json({ users: usersWithChatbots });
  } catch (err) {
    console.error("Manual preview users error:", err);
    return NextResponse.json({ error: "Failed to load users" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!DEV_ONLY) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const userId = typeof body.userId === "string" ? body.userId.trim() : "";
    const raw = typeof body.plan === "string" ? body.plan.toLowerCase().trim() : "";
    const allowed = new Set(["free", "growth", "pro", "agency", "custom", "business"]);
    const plan = allowed.has(raw) ? normalizePlanParam(raw) : null;
    if (!userId || !plan) {
      return NextResponse.json(
        { error: "userId and plan (free|growth|pro|agency) required" },
        { status: 400 }
      );
    }
    const conn = await getDbConnection();
    const convLimit = conversationLimitForPlan(plan);
    await conn.execute("UPDATE users SET plan = ?, conversation_limit = ? WHERE id = ?", [
      plan,
      convLimit,
      userId,
    ]);
    await conn.end();
    return NextResponse.json({ ok: true, plan });
  } catch (err) {
    console.error("Manual preview set plan error:", err);
    return NextResponse.json({ error: "Failed to update plan" }, { status: 500 });
  }
}
