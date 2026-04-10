import { NextRequest, NextResponse } from "next/server";
import { getDbConnection } from "@/lib/db";
import { normalizePlanParam, planHasPaidConversationTier } from "@/lib/plans";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "private, no-store, max-age=0",
};

function truncateLabel(s: string): string {
  const t = s.trim();
  if (t.length <= 80) return t;
  return `${t.slice(0, 77)}…`;
}

/** Default bot name in DB — never show as paid "store" branding. */
function isGenericBotName(name: string): boolean {
  return /^plainbot$/i.test(name.trim());
}

function hostFromWebsiteUrl(url: string | null | undefined): string {
  const raw = (url || "").trim();
  if (!raw) return "";
  try {
    const u = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    return u.hostname.replace(/^www\./i, "") || "";
  } catch {
    return "";
  }
}

/** Paid widgets: store/site label only — never the Plainbot product name unless Free. */
function storeDisplayName(
  websiteTitle: string | null | undefined,
  chatbotName: string | null | undefined,
  websiteUrl: string | null | undefined
): string {
  const w = (websiteTitle || "").trim();
  if (w) return truncateLabel(w);
  const n = (chatbotName || "").trim();
  if (n && !isGenericBotName(n)) return truncateLabel(n);
  const host = hostFromWebsiteUrl(websiteUrl);
  if (host) return truncateLabel(host);
  return "Chat";
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

/** Public: embed script uses this for header title and Plainbot branding (Free only). */
export async function GET(req: NextRequest) {
  const chatbotId = req.nextUrl.searchParams.get("chatbotId")?.trim();
  if (!chatbotId) {
    return NextResponse.json(
      { error: "chatbotId required", headerTitle: "Plainbot", showPoweredBy: true },
      { status: 400, headers: corsHeaders }
    );
  }

  try {
    const conn = await getDbConnection();
    const [rows] = await conn.execute(
      `SELECT c.name AS name, c.website_title AS websiteTitle, c.website_url AS websiteUrl, u.plan AS plan
       FROM chatbots c
       INNER JOIN users u ON u.id = c.user_id
       WHERE c.id = ? AND c.is_active = 1`,
      [chatbotId]
    );
    await conn.end();

    const row = (rows as {
      name?: string | null;
      websiteTitle?: string | null;
      websiteUrl?: string | null;
      plan?: string | null;
    }[])[0];
    if (!row) {
      return NextResponse.json(
        { headerTitle: "Plainbot", showPoweredBy: true },
        { headers: corsHeaders }
      );
    }

    const paid = planHasPaidConversationTier(normalizePlanParam(row.plan));
    const headerTitle = paid
      ? storeDisplayName(row.websiteTitle, row.name, row.websiteUrl)
      : "Plainbot";

    return NextResponse.json(
      {
        headerTitle,
        showPoweredBy: !paid,
      },
      { headers: corsHeaders }
    );
  } catch (e) {
    console.error("widget-config:", e);
    return NextResponse.json(
      { headerTitle: "Plainbot", showPoweredBy: true },
      { status: 200, headers: corsHeaders }
    );
  }
}
