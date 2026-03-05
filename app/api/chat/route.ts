import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getDbConnection } from "@/lib/db";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

const modelFromEnv = process.env.OPENAI_MODEL || "gpt-4o-mini";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function buildWebsiteContext(scrapedData: {
  url?: string;
  title?: string;
  description?: string;
  content?: string;
  products?: { name?: string; price?: string }[];
} | null): string {
  if (!scrapedData) return "No website content was provided. You do not know anything specific about this store.";
  const parts: string[] = [];

  parts.push("=== STORE KNOWLEDGE (use this as your only source of truth for this store) ===");
  if (scrapedData.title) parts.push(`Store name/title: ${scrapedData.title}`);
  if (scrapedData.url) parts.push(`Store URL (for internal reference only; do not include URLs in your replies): ${scrapedData.url.replace(/\/$/, "")}`);
  if (scrapedData.description) parts.push(`Short description: ${scrapedData.description}`);

  if (Array.isArray(scrapedData.products) && scrapedData.products.length > 0) {
    parts.push("\nPRODUCT CATALOG (use this to answer what the store sells and what TYPES or CATEGORIES of products they offer):");
    parts.push("When asked 'what types of products/footwear/apparel do you sell?' or 'which categories?', infer types from the product names and content below. Do not say 'not available' if you can reasonably derive types from this list.");
    const prices = scrapedData.products.map((p) => p.price).filter((v): v is string => typeof v === "string" && v.length > 0);
    const numericPrices = prices
      .map((s) => parseFloat(s.replace(/[^0-9.]/g, "")))
      .filter((n) => !Number.isNaN(n) && n > 0);
    if (numericPrices.length > 0) {
      const low = Math.min(...numericPrices);
      const high = Math.max(...numericPrices);
      const sym = prices[0]?.match(/£|€/) ? (prices[0].includes("£") ? "£" : "€") : "$";
      parts.push(`APPROXIMATE PRICE RANGE (use for rough price answers): ${sym}${low} to ${sym}${high}. When asked about price ranges, give this rough range—exact prices are not required.`);
    } else {
      parts.push("When asked about PRICE or PRICE RANGE: use any prices mentioned in WEBSITE CONTENT below. If none, say we don't have price details in this chat and they can check our website. Do not include URLs in your reply.");
    }
    scrapedData.products.forEach((p, i) => {
      const name = p.name?.trim();
      if (name) parts.push(`  ${i + 1}. ${name}${p.price ? ` — ${p.price}` : ""}`);
    });
  } else {
    parts.push("\nPRODUCT CATALOG: (none in this data — use store title, description, and WEBSITE CONTENT below to describe what the store sells and what it is about)");
  }

  if (scrapedData.content && scrapedData.content.trim().length > 0) {
    parts.push("\nWEBSITE CONTENT (policies, FAQs, shipping, returns, general info):");
    const content = scrapedData.content.trim();
    parts.push(content.length > 8000 ? content.slice(0, 8000) + "\n[...]" : content);
  }

  return parts.join("\n");
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured on the server." },
      { status: 500, headers: corsHeaders }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const question = typeof body.question === "string" ? body.question.trim() : "";
    const chatbotId = typeof body.chatbotId === "string" ? body.chatbotId.trim() : null;
    const conversationIdParam = typeof body.conversationId === "string" ? body.conversationId.trim() : null;

    if (!question) {
      return NextResponse.json({ error: "Missing question in body." }, { status: 400, headers: corsHeaders });
    }

    let personality = typeof body.personality === "string" ? body.personality : null;
    let scrapedData = body.scrapedData as {
      url?: string;
      title?: string;
      description?: string;
      content?: string;
      products?: { name?: string; price?: string }[];
    } | null;

    let conversationId: string | null = null;
    let persistMessages = false;
    let ticketRef: string | null = null;

    if (chatbotId) {
      const conn = await getDbConnection();
      const [rows] = await conn.execute(
        `SELECT id, user_id AS userId, personality, website_url AS websiteUrl, website_title AS websiteTitle, website_description AS websiteDescription,
         website_content AS websiteContent, products_json AS productsJson FROM chatbots WHERE id = ? AND is_active = 1`,
        [chatbotId]
      );
      const bots = rows as { id: string; userId: string; personality: string; websiteUrl: string | null; websiteTitle: string | null; websiteDescription: string | null; websiteContent: string | null; productsJson: string | null }[];
      await conn.end();
      const botUserId = bots[0]?.userId;

      if (bots.length === 0) {
        return NextResponse.json({ error: "Chatbot not found or inactive." }, { status: 404, headers: corsHeaders });
      }
      const bot = bots[0];
      personality = bot.personality || "Friendly";
      let products: { name?: string; price?: string }[] = [];
      if (bot.productsJson) {
        try {
          const parsed = JSON.parse(bot.productsJson);
          products = Array.isArray(parsed) ? parsed : (parsed?.products || []);
        } catch {
          /* ignore */
        }
      }
      scrapedData = {
        url: bot.websiteUrl ?? undefined,
        title: bot.websiteTitle ?? undefined,
        description: bot.websiteDescription ?? undefined,
        content: bot.websiteContent ?? undefined,
        products,
      };
      persistMessages = true;

      const conn2 = await getDbConnection();
      if (conversationIdParam) {
        const [convRows] = await conn2.execute(
          "SELECT id FROM conversations WHERE id = ? AND chatbot_id = ?",
          [conversationIdParam, chatbotId]
        );
        if ((convRows as { id: string }[]).length > 0) conversationId = conversationIdParam;
      }
      if (!conversationId) {
        conversationId = randomUUID();
        await conn2.execute(
          "INSERT INTO conversations (id, chatbot_id, status) VALUES (?, ?, 'open')",
          [conversationId, chatbotId]
        );
        if (botUserId) {
          const ticketId = randomUUID();
          ticketRef = "TK-" + ticketId.slice(0, 8).toUpperCase();
          await conn2.execute(
            `INSERT INTO tickets (id, user_id, conversation_id, ticket_ref, type, customer, query_preview, status)
             VALUES (?, ?, ?, ?, 'ai_resolved', ?, ?, 'open')`,
            [ticketId, botUserId, conversationId, ticketRef, "Chat user", question.slice(0, 500) || "Conversation"]
          );
        }
      }
      const userMsgId = randomUUID();
      await conn2.execute(
        "INSERT INTO chat_messages (id, conversation_id, role, content) VALUES (?, ?, 'user', ?)",
        [userMsgId, conversationId, question]
      );
      await conn2.end();
    }

    const websiteContext = buildWebsiteContext(scrapedData);
    const personalityLabel = personality || "Friendly";
    const systemPrompt = `You are the AI assistant for this store. You speak as the store: use "we", "our website", "we offer". Your tone is professional, clear, and ${personalityLabel.toLowerCase()} where appropriate.

Your knowledge base is limited to the WEBSITE DATA below. Provide accurate, helpful responses based only on that data.

VOICE AND URL RULE:
- Always speak as the store: "We offer...", "On our website we have...", "We sell these types of...". Describe what we offer and what we have.
- Do NOT include or write URLs at the end of your responses. Do not say "visit https://..." or paste the website link. Just describe what we offer (products, types, prices, policies) in your own words without giving a URL.

PRIORITIES (in order): 1. Accuracy  2. Clarity  3. Professionalism  4. Relevance

RESPONSE RULES:
- Never fabricate missing information (e.g. do not invent product names or prices that are not in the data).
- When the user asks about product TYPES, CATEGORIES, or what we sell: answer in first person (e.g. "We offer...", "On our website we have...") and infer from the PRODUCT CATALOG and WEBSITE CONTENT. Summarize types/categories. Do not say "not available" if you can reasonably derive types from the list or content.
- When the user asks about PRICE or PRICE RANGE: give a rough range in first person (e.g. "Our products are typically in the $X–$Y range"). Use APPROXIMATE PRICE RANGE or prices in the data. Do not end with a URL.
- Maximize small data: infer types, categories, and price level when possible. Give concise answers. Do not append URLs—just describe what we offer.
- Only if the question asks for something truly not present in the data, say: "This information is not available on our website."
- Do not speculate about unrelated topics. Do not say "based on the provided content" or mention training data.

INTELLIGENT EXTRACTION:
- Extract relevant parts from the data; summarize cleanly; remove redundancy.
- Keep important details: product names, types/categories, prices, features, contact details, policies. Do not include URLs in your reply.

STRUCTURED ANSWERING:

If the question relates to products, types, or price → answer as the store: (1) What we offer (types/categories). (2) Rough price range when you have it. (3) Product names or features when relevant. Do not end with a URL. Use PRODUCT CATALOG and WEBSITE CONTENT below.

If the question relates to services → provide: Service name • What it includes • Who it is for (only from the data).

If the question relates to contact → provide: Email • Phone • Address • Social links (use the CONTACT / REACH THE STORE section below when present).

If multiple answers exist → organize in bullet points.

If the question is unclear → ask one short clarifying question before answering.

FORWARD TO SUPPORT (important):
- When the user clearly needs something only a human can do (order cancellation, refund, return outside policy, complaint, account change, dispute, or anything that requires human support), give a brief helpful reply (e.g. "We can't process cancellations from here, but our team will help you.") and at the very end of your reply add exactly this on a new line: [FORWARD_TO_SUPPORT]. This marker will be removed before the user sees it; the chat will then offer to forward the conversation to support.
- For normal product/price/policy questions, do NOT add [FORWARD_TO_SUPPORT].

TONE: Professional, clear, helpful, business-aligned, confident.`;

    const fullPrompt = `${systemPrompt}

=== WEBSITE DATA (your only source — use this and nothing else) ===

${websiteContext}

=== END WEBSITE DATA ===`.trim();

    const completion = await client.chat.completions.create({
      model: modelFromEnv,
      messages: [
        { role: "system", content: fullPrompt },
        { role: "user", content: question },
      ],
      temperature: 0.25,
      max_tokens: 600,
      stream: true,
      stream_options: { include_usage: false },
    });

    const encoder = new TextEncoder();
    const chunks: string[] = [];

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let firstChunkSent = false;
          for await (const part of completion) {
            const delta = part.choices[0]?.delta?.content || "";
            if (!delta) continue;
            chunks.push(delta);
            controller.enqueue(encoder.encode(delta));
            if (!firstChunkSent) {
              firstChunkSent = true;
              await new Promise((r) => setTimeout(r, 0));
            }
          }
          if (persistMessages && conversationId && chunks.length > 0) {
            const rawContent = chunks.join("");
            const assistantContent = rawContent.replace(/\s*\[FORWARD_TO_SUPPORT\]\s*$/i, "").trim();
            try {
              const conn = await getDbConnection();
              const assistantMsgId = randomUUID();
              await conn.execute(
                "INSERT INTO chat_messages (id, conversation_id, role, content) VALUES (?, ?, 'assistant', ?)",
                [assistantMsgId, conversationId, assistantContent]
              );
              await conn.execute(
                "UPDATE tickets SET status = 'resolved', outcome = 'Resolved by AI' WHERE conversation_id = ?",
                [conversationId]
              );
              await conn.end();
            } catch (err) {
              console.error("Failed to persist assistant message:", err);
            }
          }
        } catch (err) {
          console.error("Streaming error:", err);
          controller.error(err);
          return;
        }
        controller.close();
      },
    });

    const headers: Record<string, string> = {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
    if (conversationId) headers["X-Conversation-Id"] = conversationId;
    if (ticketRef) headers["X-Ticket-Ref"] = ticketRef;

    return new Response(stream, { headers });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json(
      { error: "Unexpected error while generating reply." },
      { status: 500, headers: corsHeaders }
    );
  }
}
