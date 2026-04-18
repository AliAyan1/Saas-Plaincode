import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getDbConnection } from "@/lib/db";
import { randomUUID } from "crypto";
import { checkRateLimit, LIMITS } from "@/lib/rate-limit";
import { sendLimitReachedEmail } from "@/lib/usage-emails";
import { getMergedUploadedDocsText } from "@/lib/knowledge-documents";

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
  uploadedDocsText?: string;
} | null): string {
  if (!scrapedData) return "No website content was provided. You do not know anything specific about this store.";
  const parts: string[] = [];

  parts.push("=== STORE KNOWLEDGE (use this as your only source of truth for this store) ===");
  if (scrapedData.title) parts.push(`Store name/title: ${scrapedData.title}`);
  if (scrapedData.url) parts.push(`Store URL (for internal reference only; do not include URLs in your replies): ${scrapedData.url.replace(/\/$/, "")}`);
  if (scrapedData.description) parts.push(`Short description: ${scrapedData.description}`);

  const hasUploadedDocs = scrapedData.uploadedDocsText && scrapedData.uploadedDocsText.trim().length > 0;
  if (hasUploadedDocs) {
    const doc = (scrapedData.uploadedDocsText ?? "").trim();
    parts.push("\nUPLOADED DOCUMENTS (from PDF/TXT the store owner provided — use this to answer product count, product names, and any facts mentioned here):");
    parts.push("When the user asks 'how many products do you have?' or similar, infer from this document (e.g. count list items, or use a number stated in the text). Answer in first person (e.g. 'We have around X products.'). Do not say 'this information is not available' if this document contains product or catalog information.");
    parts.push(doc.length > 15000 ? doc.slice(0, 15000) + "\n[...]" : doc);
  }

  if (Array.isArray(scrapedData.products) && scrapedData.products.length > 0) {
    const productCount = scrapedData.products.length;
    parts.push("\nPRODUCT COUNT: This catalog contains " + productCount + " product(s). When the user asks 'how many products do you have?' or similar, use this number and answer in first person (e.g. 'We have " + productCount + " products.').");
    parts.push("\nPRODUCT CATALOG (use this to answer what the store sells, how many products, and what TYPES or CATEGORIES they offer):");
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
  } else if (!hasUploadedDocs) {
    parts.push("\nPRODUCT CATALOG: (no product list in this data — use store title, description, and WEBSITE CONTENT or UPLOADED DOCUMENTS above to describe what the store sells. If WEBSITE CONTENT or UPLOADED DOCUMENTS mention a number of products or a list, use that to answer 'how many products?' when possible.)");
  } else {
    parts.push("\nPRODUCT CATALOG: (no scraped product list — use UPLOADED DOCUMENTS above to answer how many products, product names, and categories. Do not say information is not available if the uploaded document describes products.)");
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
  const rl = checkRateLimit(req, "chat", LIMITS.chat);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429, headers: { ...corsHeaders, "Retry-After": String(rl.retryAfter) } }
    );
  }
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
      uploadedDocsText?: string;
    } | null;

    let conversationId: string | null = null;
    let persistMessages = false;
    let ticketRef: string | null = null;
    let botUserId: string | null = null;

    if (chatbotId) {
      const conn = await getDbConnection();
      type BotRow = { id: string; userId: string; personality: string; language?: string | null; guardRails?: string | null; uploadedDocsText?: string | null; websiteUrl: string | null; websiteTitle: string | null; websiteDescription: string | null; websiteContent: string | null; productsJson: string | null };
      let bots: BotRow[];
      try {
        const [rows] = await conn.execute(
          `SELECT id, user_id AS userId, personality, language, guard_rails AS guardRails, uploaded_docs_text AS uploadedDocsText, website_url AS websiteUrl, website_title AS websiteTitle, website_description AS websiteDescription,
           website_content AS websiteContent, products_json AS productsJson FROM chatbots WHERE id = ? AND is_active = 1`,
          [chatbotId]
        );
        bots = rows as BotRow[];
      } catch (err: unknown) {
        const e = err as { code?: string };
        if (e?.code === "ER_BAD_FIELD_ERROR") {
          const [rows] = await conn.execute(
            `SELECT id, user_id AS userId, personality, website_url AS websiteUrl, website_title AS websiteTitle, website_description AS websiteDescription,
             website_content AS websiteContent, products_json AS productsJson FROM chatbots WHERE id = ? AND is_active = 1`,
            [chatbotId]
          );
          bots = (rows as Record<string, unknown>[]).map((r) => ({ ...r, guardRails: null, uploadedDocsText: null, language: "en" })) as BotRow[];
        } else throw err;
      }

      if (bots.length === 0) {
        await conn.end();
        return NextResponse.json({ error: "Chatbot not found or inactive." }, { status: 404, headers: corsHeaders });
      }
      const bot = bots[0];
      botUserId = bot.userId ?? null;
      let mergedUploadedDocs: string | undefined;
      try {
        const merged = await getMergedUploadedDocsText(conn, chatbotId, bot.uploadedDocsText);
        mergedUploadedDocs = merged.trim() ? merged : undefined;
      } finally {
        await conn.end();
      }

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
        uploadedDocsText: mergedUploadedDocs,
      };
      if (bot.guardRails && bot.guardRails.trim()) {
        (scrapedData as { guardRails?: string }).guardRails = bot.guardRails.trim();
      }
      (scrapedData as { language?: string }).language = bot.language ?? "en";
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
        const period =
          new Date().getFullYear() +
          "-" +
          String(new Date().getMonth() + 1).padStart(2, "0");
        const [userRows] = await conn2.execute(
          "SELECT conversation_limit AS conversationLimit, plan, email, name, limit_reached_period AS limitReachedPeriod FROM users WHERE id = ?",
          [botUserId]
        );
        const u = (userRows as {
          conversationLimit?: number | null;
          plan?: string;
          email?: string;
          name?: string | null;
          limitReachedPeriod?: string | null;
        }[])[0];
        const rawLimit = u?.conversationLimit;
        const unlimited = rawLimit === null || rawLimit === undefined;
        const limit = unlimited ? Number.POSITIVE_INFINITY : (rawLimit ?? 100);
        const [usageRows] = await conn2.execute(
          "SELECT count_used AS countUsed FROM conversation_usage WHERE user_id = ? AND period_month = ?",
          [botUserId, period]
        );
        const countUsed = (usageRows as { countUsed?: number }[])[0]?.countUsed ?? 0;
        if (!unlimited && countUsed >= limit) {
          const paid =
            u?.plan === "growth" ||
            u?.plan === "pro" ||
            u?.plan === "agency" ||
            u?.plan === "custom" ||
            u?.plan === "business";
          if (u?.limitReachedPeriod !== period && u?.email) {
            sendLimitReachedEmail(u.email, paid ? "pro" : "free", u.name ?? null).catch((e) =>
              console.error("[Chat] Limit-reached email error:", e)
            );
            await conn2.execute(
              "UPDATE users SET limit_reached_period = ? WHERE id = ?",
              [period, botUserId]
            );
          }
          await conn2.end();
          return NextResponse.json(
            {
              error: paid
                ? "You've used all your conversations this month. Renew your plan to continue."
                : "Your free plan conversations are used up. Upgrade to a paid plan to continue.",
              limitReached: true,
              plan: paid ? "paid" : "free",
            },
            { status: 402, headers: corsHeaders }
          );
        }
        conversationId = randomUUID();
        await conn2.execute(
          "INSERT INTO conversations (id, chatbot_id, status) VALUES (?, ?, 'open')",
          [conversationId, chatbotId]
        );
        await conn2.execute(
          "INSERT INTO conversation_usage (id, user_id, period_month, count_used) VALUES (?, ?, ?, 1) ON DUPLICATE KEY UPDATE count_used = count_used + 1",
          [randomUUID(), botUserId, period]
        );
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
    const guardRailsText = (scrapedData as { guardRails?: string } | null)?.guardRails?.trim();
    const languageCode = (scrapedData as { language?: string } | null)?.language?.trim() || "en";
    const languageNames: Record<string, string> = { en: "English", es: "Spanish", fr: "French", de: "German", it: "Italian", pt: "Portuguese", nl: "Dutch", da: "Danish", sv: "Swedish", ar: "Arabic", hi: "Hindi", ja: "Japanese", zh: "Chinese" };
    const languageName = languageNames[languageCode] || languageCode;
    const languageRule = languageCode !== "en" ? `\nLANGUAGE: You must respond only in ${languageName}. All your replies must be in ${languageName}.\n` : "";
    let systemPrompt = `You are the AI assistant for this store. You speak as the store: use "we", "our website", "we offer". Your tone is professional, clear, and ${personalityLabel.toLowerCase()} where appropriate.${languageRule}


Your knowledge base is limited to the WEBSITE DATA below. Provide accurate, helpful responses based only on that data.

VOICE AND URL RULE:
- Always speak as the store: "We offer...", "On our website we have...", "We sell these types of...". Describe what we offer and what we have.
- Do NOT include or write URLs at the end of your responses. Do not say "visit https://..." or paste the website link. Just describe what we offer (products, types, prices, policies) in your own words without giving a URL.

PRIORITIES (in order): 1. Accuracy  2. Clarity  3. Professionalism  4. Relevance

RESPONSE RULES:
- Never fabricate missing information (e.g. do not invent product names or prices that are not in the data).
- When the user asks "how many products do you have?" or "how many products?": use the PRODUCT COUNT or count the items in the PRODUCT CATALOG below. Answer in first person (e.g. "We have X products."). Do NOT say "not available" if the catalog lists any products.
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
- When the user needs something only a human can do (e.g. cancel my order, my order is late, where is my order, refund, return, complaint, account change, dispute), do NOT add [FORWARD_TO_SUPPORT] immediately. First ask for their name, email, and/or order ID (or whatever helps—e.g. "To help you, could you share your name, email, or order number?"). Once the user has provided at least one of these (name, email, or order/ref), reply with a short message like: "I've forwarded this to our support team. Please wait—our support agent will reply here soon." and at the very end of that reply add exactly this on a new line: [FORWARD_TO_SUPPORT]. This marker is removed from what the user sees; the conversation is then forwarded to your support email and a ticket is created. The customer will see support replies in this chat.
- For normal product/price/policy questions, do NOT add [FORWARD_TO_SUPPORT].

TONE: Professional, clear, helpful, business-aligned, confident.`;
    if (guardRailsText) {
      systemPrompt += `\n\nGUARD RAISES (follow these rules for this chatbot):\n${guardRailsText}`;
    }

    const fullPrompt = `${systemPrompt}

=== WEBSITE DATA (your only source — use this and nothing else) ===

${websiteContext}

=== END WEBSITE DATA ===`.trim();

    const openaiTimeoutMs = 60_000;
    const openaiAbort = new AbortController();
    const openaiTimeout = setTimeout(() => openaiAbort.abort(), openaiTimeoutMs);

    const completion = await client.chat.completions.create(
      {
        model: modelFromEnv,
        messages: [
          { role: "system", content: fullPrompt },
          { role: "user", content: question },
        ],
        temperature: 0.25,
        max_tokens: 600,
        stream: true,
        stream_options: { include_usage: false },
      },
      { signal: openaiAbort.signal }
    );

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
          clearTimeout(openaiTimeout);
          if (persistMessages && conversationId && chunks.length > 0) {
            const rawContent = chunks.join("");
            const hasForwardMarker = /\[FORWARD_TO_SUPPORT\]/i.test(rawContent);
            const assistantContent = rawContent.replace(/\s*\[FORWARD_TO_SUPPORT\]\s*$/i, "").trim();
            try {
              const conn = await getDbConnection();
              const assistantMsgId = randomUUID();
              await conn.execute(
                "INSERT INTO chat_messages (id, conversation_id, role, content) VALUES (?, ?, 'assistant', ?)",
                [assistantMsgId, conversationId, assistantContent]
              );
              if (hasForwardMarker && botUserId) {
                const [existingFwd] = await conn.execute(
                  "SELECT id FROM forwarded_conversations WHERE conversation_id = ? LIMIT 1",
                  [conversationId]
                );
                const alreadyForwarded = Array.isArray(existingFwd) && existingFwd.length > 0;
                if (!alreadyForwarded) {
                  const [msgRows] = await conn.execute(
                    "SELECT role, content FROM chat_messages WHERE conversation_id = ? ORDER BY created_at ASC",
                    [conversationId]
                  );
                  const msgs = (msgRows as { role: string; content: string }[]) || [];
                  const conversationText = msgs.map((m) => `${m.role === "user" ? "Customer" : "Assistant"}: ${m.content}`).join("\n");
                  const lastUser = [...msgs].reverse().find((m) => m.role === "user");
                  const preview = (lastUser?.content || question || "Conversation").slice(0, 500);
                  const customer = "Chat user";
                  const ticketId = randomUUID();
                  const ticketRefVal = "TK-" + ticketId.slice(0, 8).toUpperCase();
                  await conn.execute(
                    `INSERT INTO tickets (id, user_id, conversation_id, ticket_ref, type, customer, query_preview, status)
                     VALUES (?, ?, ?, ?, 'forwarded_email', ?, ?, 'open')`,
                    [ticketId, botUserId, conversationId, ticketRefVal, customer, preview]
                  );
                  await conn.execute(
                    `INSERT INTO forwarded_conversations (id, user_id, conversation_id, customer, customer_email, preview, forwarded_as, ticket_ref)
                     VALUES (?, ?, ?, ?, NULL, ?, 'email', ?)`,
                    [randomUUID(), botUserId, conversationId, customer, preview, ticketRefVal]
                  );
                  const [userRows] = await conn.execute("SELECT forward_email FROM users WHERE id = ?", [botUserId]);
                  const forwardEmail = (userRows as { forward_email?: string }[])[0]?.forward_email ?? null;
                  if (forwardEmail && process.env.RESEND_API_KEY) {
                    const emailBody = [
                      "Forwarded conversation (AI could not handle — needs human support)",
                      `Ticket: #${ticketRefVal}`,
                      `Customer: ${customer}`,
                      "",
                      `Preview: ${preview}`,
                      "",
                      conversationText ? `Full conversation:\n${conversationText}` : "",
                    ].filter(Boolean).join("\n");
                    const subject = `Forwarded Ticket #${ticketRefVal} [conv:${conversationId}] ${preview.slice(0, 40)}${preview.length > 40 ? "…" : ""}`;
                    const resendAbort = new AbortController();
                    const resendTimeout = setTimeout(() => resendAbort.abort(), 60_000);
                    try {
                      const res = await fetch("https://api.resend.com/emails", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                        },
                        body: JSON.stringify({
                          from: process.env.EMAIL_FROM || "onboarding@resend.dev",
                          to: forwardEmail,
                          subject,
                          text: emailBody,
                        }),
                        signal: resendAbort.signal,
                      });
                      clearTimeout(resendTimeout);
                      if (!res.ok) {
                        const err = await res.json().catch(() => ({}));
                        console.error("Resend send failed:", res.status, err);
                      }
                    } catch (e) {
                      clearTimeout(resendTimeout);
                      console.error("Resend send failed:", e);
                    }
                  } else if (forwardEmail) {
                    console.log("[Forward to email] Forward email set; RESEND_API_KEY missing — email not sent.");
                  }
                }
                await conn.execute("UPDATE conversations SET status = 'forwarded' WHERE id = ?", [conversationId]);
              } else {
                await conn.execute(
                  "UPDATE tickets SET status = 'resolved', outcome = 'Resolved by AI' WHERE conversation_id = ?",
                  [conversationId]
                );
              }
              await conn.end();
            } catch (err) {
              console.error("Failed to persist assistant message:", err);
            }
          }
        } catch (err) {
          clearTimeout(openaiTimeout);
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
