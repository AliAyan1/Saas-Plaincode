import { NextRequest, NextResponse } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import { getDbConnection } from "@/lib/db";
import { PDFParse } from "pdf-parse";
import { checkRateLimit, LIMITS } from "@/lib/rate-limit";

const ALLOWED_TYPES = ["application/pdf", "text/plain"];
const ALLOWED_EXT = [".pdf", ".txt"];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_TEXT_LENGTH = 200_000; // cap stored text to avoid huge DB fields

async function extractTextFromFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const name = (file.name || "").toLowerCase();

  if (name.endsWith(".txt") || file.type === "text/plain") {
    return buffer.toString("utf-8").slice(0, MAX_TEXT_LENGTH);
  }

  // PDF
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    await parser.destroy();
    return (result?.text || "").slice(0, MAX_TEXT_LENGTH);
  } catch (e) {
    await parser.destroy().catch(() => {});
    throw e;
  }
}

export async function POST(req: NextRequest) {
  const auth = await getAuthFromCookie();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rl = checkRateLimit(req, "upload", LIMITS.upload);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many uploads. Try again in a minute." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file || !file.size) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 400 });
    }

    const name = (file.name || "").toLowerCase();
    const okType = ALLOWED_TYPES.includes(file.type) || ALLOWED_EXT.some((ext) => name.endsWith(ext));
    if (!okType) {
      return NextResponse.json({ error: "Only PDF and TXT files are allowed" }, { status: 400 });
    }

    const text = await extractTextFromFile(file);
    if (!text || !text.trim()) {
      return NextResponse.json({ error: "No text could be extracted from this file" }, { status: 400 });
    }

    const conn = await getDbConnection();
    const [rows] = await conn.execute(
      "SELECT id FROM chatbots WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
      [auth.userId]
    );
    const bots = rows as { id: string }[];
    await conn.end();

    if (bots.length === 0) {
      return NextResponse.json({ error: "No chatbot found. Create a bot first (e.g. connect your store)." }, { status: 400 });
    }

    const chatbotId = bots[0].id;
    const conn2 = await getDbConnection();
    try {
      await conn2.execute(
        "UPDATE chatbots SET uploaded_docs_text = ? WHERE id = ?",
        [text.trim(), chatbotId]
      );
    } catch (updateErr: unknown) {
      const e = updateErr as { code?: string };
      if (e?.code === "ER_BAD_FIELD_ERROR") {
        return NextResponse.json({
          ok: true,
          name: file.name,
          size: file.size,
          warning: "Database needs migration (run: node scripts/migrate.js) for the AI to use this document.",
        });
      }
      throw updateErr;
    } finally {
      await conn2.end();
    }

    return NextResponse.json({
      ok: true,
      name: file.name,
      size: file.size,
      message: "Document saved. The AI will use it to answer questions (e.g. how many products you have).",
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
