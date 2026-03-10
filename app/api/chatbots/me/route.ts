import { NextRequest, NextResponse } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import { getDbConnection } from "@/lib/db";
import { randomUUID } from "crypto";

type Personality = "Friendly" | "Professional" | "Sales-focused" | "Premium Luxury";

export async function GET() {
  const auth = await getAuthFromCookie();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const conn = await getDbConnection();
    let rows: unknown[];
    try {
      const [raw] = await conn.execute(
        `SELECT id, name, website_url AS websiteUrl, website_title AS websiteTitle,
         website_description AS websiteDescription, website_content AS websiteContent,
         products_json AS productsJson, personality, language, guard_rails AS guardRails,
         is_active AS isActive, created_at AS createdAt
         FROM chatbots WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
        [auth.userId]
      );
      rows = Array.isArray(raw) ? raw : [];
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e?.code === "ER_BAD_FIELD_ERROR") {
        const [raw] = await conn.execute(
          `SELECT id, name, website_url AS websiteUrl, website_title AS websiteTitle,
           website_description AS websiteDescription, website_content AS websiteContent,
           products_json AS productsJson, personality, is_active AS isActive, created_at AS createdAt
           FROM chatbots WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
          [auth.userId]
        );
        const rawRows = Array.isArray(raw) ? raw : [];
        rows = (rawRows as Record<string, unknown>[]).map((r) => ({ ...r, guardRails: "", language: "en" }));
      } else throw err;
    }
    await conn.end();

    const list = rows as {
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
    }[];

    if (list.length === 0) {
      return NextResponse.json({ chatbot: null });
    }

    const c = list[0];
    let products: { name: string }[] = [];
    if (c.productsJson) {
      try {
        const parsed = JSON.parse(c.productsJson);
        products = Array.isArray(parsed) ? parsed : (parsed?.products ? parsed.products : []);
      } catch {
        /* ignore */
      }
    }

    return NextResponse.json({
      chatbot: {
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
      },
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
    const personality = typeof body.personality === "string" &&
      ["Friendly", "Professional", "Sales-focused", "Premium Luxury"].includes(body.personality)
      ? body.personality
      : null;
    const name = typeof body.name === "string" ? body.name.trim() : null;
    const language = typeof body.language === "string" ? body.language.trim().slice(0, 20) : null;
    const guardRails = typeof body.guardRails === "string" ? body.guardRails.trim() : null;

    const conn = await getDbConnection();
    const [rows] = await conn.execute(
      "SELECT id FROM chatbots WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
      [auth.userId]
    );
    const list = rows as { id: string }[];
    if (list.length === 0) {
      await conn.end();
      return NextResponse.json({ error: "No chatbot found. Create one from Create Bot first." }, { status: 404 });
    }

    const chatbotId = list[0].id;
    const updates: string[] = [];
    const values: (string | number)[] = [];
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
      await conn.execute(
        `UPDATE chatbots SET ${updates.join(", ")} WHERE id = ?`,
        values
      );
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
          await conn.execute(
            `UPDATE chatbots SET ${updates.join(", ")} WHERE id = ?`,
            values
          );
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
