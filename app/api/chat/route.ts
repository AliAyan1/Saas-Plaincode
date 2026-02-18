import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const modelFromEnv = process.env.OPENAI_MODEL || "gpt-4o-mini";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const question = typeof body.question === "string" ? body.question : "";
    const personality = typeof body.personality === "string" ? body.personality : null;
    const scrapedData = body.scrapedData as
      | {
          url?: string;
          title?: string;
          description?: string;
          content?: string;
          products?: { name?: string }[];
        }
      | null;

    if (!question) {
      return NextResponse.json({ error: "Missing question in body." }, { status: 400 });
    }

    const contentPieces: string[] = [];
    if (scrapedData?.title) contentPieces.push(`Title: ${scrapedData.title}`);
    if (scrapedData?.description) {
      contentPieces.push(`Meta description: ${scrapedData.description}`);
    }
    if (scrapedData?.content) contentPieces.push(`Page content:\n${scrapedData.content}`);

    if (Array.isArray(scrapedData?.products) && scrapedData!.products!.length > 0) {
      const productLines = scrapedData!.products!
        .map((p) => p.name)
        .filter(Boolean)
        .join(", ");
      if (productLines) {
        contentPieces.push(`Detected products: ${productLines}`);
      }
    }

    const websiteContext =
      contentPieces.length > 0
        ? contentPieces.join("\n\n")
        : "No website content was provided. You do not know anything specific about this store.";

    // Optimized shorter prompt for faster processing
    const systemPrompt = `AI customer support assistant. Personality: ${personality || "Friendly"}.

Answer using website content first. If not found, use general ecommerce knowledge with note: "(Based on general best practices, not specific store data.)"

Website: ${websiteContext}`.trim();

    const completion = await client.chat.completions.create({
      model: modelFromEnv,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ],
      temperature: 0.2, // Lower temperature for faster, more focused responses
      max_tokens: 500, // Limit response length for faster generation
      stream: true,
      stream_options: { include_usage: false }, // Reduce overhead
    });

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send first chunk immediately to reduce perceived latency
          let firstChunkSent = false;
          for await (const part of completion) {
            const delta = part.choices[0]?.delta?.content || "";
            if (!delta) continue;
            // Enqueue immediately without buffering
            controller.enqueue(encoder.encode(delta));
            if (!firstChunkSent) {
              firstChunkSent = true;
              // Force flush first chunk immediately
              await new Promise(resolve => setTimeout(resolve, 0));
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

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json(
      { error: "Unexpected error while generating reply." },
      { status: 500 }
    );
  }
}

