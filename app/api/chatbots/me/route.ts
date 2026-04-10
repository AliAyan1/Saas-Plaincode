import { NextRequest, NextResponse } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import { getDbConnection } from "@/lib/db";
import { storeLimitForPlan } from "@/lib/plans";

type Personality = "Friendly" | "Professional" | "Sales-focused" | "Premium Luxury";

type BotRow = {
  id: string;
  name: string;
  websiteUrl: string;
  websiteTitle: string | null;
  websiteDescription: string | null;
  websiteContent: string | null;
  productsJson: string | null;
  personality: Personality;
  language?: string | null;
  guardRails: string | null;
  isActive: number;
  createdAt: Date;
};

function parseProducts(productsJson: string | null): { name: string }[] {
  if (!productsJson) return [];
  try {
    const parsed = JSON.parse(productsJson);
    const arr = Array.isArray(parsed) ? parsed : parsed?.products ? parsed.products : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function toChatbotResponse(c: BotRow) {
  const products = parseProducts(c.productsJson);
  return {
    id: c.id,
    name: c.name,
    websiteUrl: c.websiteUrl,
    websiteTitle: c.websiteTitle ?? "",
    websiteDescription: c.websiteDescription ?? "",
    websiteContent: c.websiteContent ?? "",
    products,
    personality: c.personality,
    language: c.language ?? "en",
    guardRails: c.guardRails ?? "",
    isActive: !!c.isActive,
    createdAt: c.createdAt,
  };
}

function labelStore(c: BotRow): string {
  const t = c.websiteTitle?.trim();
  if (t) return t.length > 40 ? `${t.slice(0, 37)}…` : t;
  try {
    const host = c.websiteUrl.replace(/^https?:\/\//, "").split("/")[0];
    return host || c.name || "Store";
  } catch {
    return c.name || "Store";
  }
}

export async function GET(req: NextRequest) {
  const auth = await getAuthFromCookie();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const storeIdParam = req.nextUrl.searchParams.get("storeId")?.trim() || null;

  try {
    const conn = await getDbConnection();

    const [planRows] = await conn.execute("SELECT plan FROM users WHERE id = ?", [auth.userId]);
    const plan = (planRows as { plan: string }[])[0]?.plan ?? "free";
    const storeLimit = storeLimitForPlan(plan);

    let list: BotRow[] = [];
    try {
      const [raw] = await conn.execute(
        `SELECT id, name, website_url AS websiteUrl, website_title AS websiteTitle,
         website_description AS websiteDescription, website_content AS websiteContent,
         products_json AS productsJson, personality, language, guard_rails AS guardRails,
         is_active AS isActive, created_at AS createdAt
         FROM chatbots WHERE user_id = ? ORDER BY created_at DESC`,
        [auth.userId]
      );
      list = (Array.isArray(raw) ? raw : []) as BotRow[];
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e?.code === "ER_BAD_FIELD_ERROR") {
        const [raw] = await conn.execute(
          `SELECT id, name, website_url AS websiteUrl, website_title AS websiteTitle,
           website_description AS websiteDescription, website_content AS websiteContent,
           products_json AS productsJson, personality, is_active AS isActive, created_at AS createdAt
           FROM chatbots WHERE user_id = ? ORDER BY created_at DESC`,
          [auth.userId]
        );
        const rawRows = (Array.isArray(raw) ? raw : []) as Record<string, unknown>[];
        list = rawRows.map((r) => ({ ...r, guardRails: "", language: "en" })) as BotRow[];
      } else throw err;
    }

    await conn.end();

    const storeCount = list.length;
    const chatbotsSummary = list.map((c) => ({
      id: c.id,
      name: c.name,
      label: labelStore(c),
      websiteUrl: c.websiteUrl,
    }));

    if (list.length === 0) {
      return NextResponse.json({
        chatbot: null,
        chatbots: [],
        storeLimit,
        storeCount: 0,
        plan,
      });
    }

    let active = list[0];
    if (storeIdParam && list.some((b) => b.id === storeIdParam)) {
      active = list.find((b) => b.id === storeIdParam)!;
    }

    return NextResponse.json({
      chatbot: toChatbotResponse(active),
      chatbots: chatbotsSummary,
      storeLimit,
      storeCount,
      plan,
    });
  } catch (err) {
    console.error("GET /api/chatbots/me:", err);
    return NextResponse.json({ error: "Failed to load chatbot." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await getAuthFromCookie();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const targetChatbotId =
      typeof body.chatbotId === "string" && body.chatbotId.trim() ? body.chatbotId.trim() : null;
    const personality =
      typeof body.personality === "string" &&
      ["Friendly", "Professional", "Sales-focused", "Premium Luxury"].includes(body.personality)
        ? body.personality
        : null;
    const name = typeof body.name === "string" ? body.name.trim() : null;
    const language = typeof body.language === "string" ? body.language.trim().slice(0, 20) : null;
    const guardRails = typeof body.guardRails === "string" ? body.guardRails.trim() : null;

    const conn = await getDbConnection();

    let chatbotId = targetChatbotId;
    if (chatbotId) {
      const [owned] = await conn.execute(
        "SELECT id FROM chatbots WHERE id = ? AND user_id = ?",
        [chatbotId, auth.userId]
      );
      if ((owned as { id: string }[]).length === 0) {
        chatbotId = null;
      }
    }
    if (!chatbotId) {
      const [rows] = await conn.execute(
        "SELECT id FROM chatbots WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
        [auth.userId]
      );
      const list = rows as { id: string }[];
      if (list.length === 0) {
        await conn.end();
        return NextResponse.json({ error: "No chatbot found. Create one from Create Bot first." }, { status: 404 });
      }
      chatbotId = list[0].id;
    }

    const updates: string[] = [];
    const values: (string | number | null)[] = [];
    if (personality) {
      updates.push("personality = ?");
      values.push(personality);
    }
    if (name !== null && name !== "") {
      updates.push("name = ?");
      values.push(name);
    }
    if (guardRails !== null) {
      updates.push("guard_rails = ?");
      values.push(guardRails === "" ? null : guardRails);
    }
    if (language !== null) {
      updates.push("language = ?");
      values.push(language || "en");
    }
    if (updates.length === 0) {
      await conn.end();
      return NextResponse.json({ chatbot: null });
    }
    values.push(chatbotId);
    try {
      await conn.execute(`UPDATE chatbots SET ${updates.join(", ")} WHERE id = ?`, values);
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e?.code === "ER_BAD_FIELD_ERROR") {
        for (const col of ["guard_rails = ?", "language = ?"]) {
          const idx = updates.indexOf(col);
          if (idx !== -1) {
            updates.splice(idx, 1);
            values.splice(idx, 1);
            values[values.length - 1] = chatbotId;
            break;
          }
        }
        if (updates.length > 0) {
          await conn.execute(`UPDATE chatbots SET ${updates.join(", ")} WHERE id = ?`, values);
        }
      } else throw err;
    }
    await conn.end();

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PATCH /api/chatbots/me:", err);
    return NextResponse.json({ error: "Failed to update chatbot." }, { status: 500 });
  }
}
