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
    const [rows] = await conn.execute(
      `SELECT id, name, website_url AS websiteUrl, website_title AS websiteTitle,
       website_description AS websiteDescription, website_content AS websiteContent,
       products_json AS productsJson, personality, is_active AS isActive, created_at AS createdAt
       FROM chatbots WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
      [auth.userId]
    );
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
    if (updates.length === 0) {
      await conn.end();
      return NextResponse.json({ chatbot: null });
    }
    values.push(chatbotId);
    await conn.execute(
      `UPDATE chatbots SET ${updates.join(", ")} WHERE id = ?`,
      values
    );
    await conn.end();

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PATCH /api/chatbots/me:", err);
    return NextResponse.json({ error: "Failed to update chatbot." }, { status: 500 });
  }
}
