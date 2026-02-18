import { NextRequest, NextResponse } from "next/server";
import { load } from "cheerio";

export const runtime = "nodejs";
export const maxDuration = 25; // allow time for fetch + parse on Vercel

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const url = typeof body.url === "string" ? body.url.trim() : "";
    if (!url) {
      return NextResponse.json({ error: "Missing url in body." }, { status: 400 });
    }
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return NextResponse.json(
        { error: "URL must start with http:// or https://" },
        { status: 400 }
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; EcommerceSupportBot/1.0; +https://example.com)",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL (${response.status}). Please check the URL and try again.` },
        { status: 502 }
      );
    }

    const html = await response.text();
    const $ = load(html);

    const title = $("title").first().text().trim() ?? "";
    let description =
      $('meta[name="description"]').attr("content")?.trim() ?? "";
    if (!description) {
      description = $('meta[property="og:description"]').attr("content")?.trim() ?? "";
    }

    const texts: string[] = [];

    for (const tagName of ["h1", "h2", "h3", "h4"]) {
      $(tagName).each((_, el) => {
        const text = $(el).text().replace(/\s+/g, " ").trim();
        if (text) texts.push(`${tagName.toUpperCase()}: ${text}`);
      });
    }

    $("p").each((_, el) => {
      const text = $(el).text().replace(/\s+/g, " ").trim();
      if (text) texts.push(text);
    });

    $("li").each((_, el) => {
      const text = $(el).text().replace(/\s+/g, " ").trim();
      if (text) texts.push(`• ${text}`);
    });

    $("td, th").each((_, el) => {
      const text = $(el).text().replace(/\s+/g, " ").trim();
      if (text) texts.push(text);
    });

    const candidateTexts = new Set<string>();

    $('[itemtype*="Product"] [itemprop="name"]').each((_, el) => {
      const t = $(el).text().replace(/\s+/g, " ").trim();
      if (t) candidateTexts.add(t);
    });

    [".product-title", ".product-name", ".product-card__title"].forEach(
      (cls) => {
        $(cls).each((_, el) => {
          const t = $(el).text().replace(/\s+/g, " ").trim();
          if (t) candidateTexts.add(t);
        });
      }
    );

    if (candidateTexts.size === 0) {
      ["h3", "h4"].forEach((tagName) => {
        $(tagName).each((_, el) => {
          const t = $(el).text().replace(/\s+/g, " ").trim();
          if (t) candidateTexts.add(t);
        });
      });
    }

    const products = Array.from(candidateTexts)
      .slice(0, 10)
      .map((name) => ({ name }));

    const content = texts.join("\n\n");

    return NextResponse.json({
      title,
      description,
      content,
      products,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("abort") || message.includes("fetch")) {
      return NextResponse.json(
        { error: "Request timed out or URL could not be reached. Please try again." },
        { status: 504 }
      );
    }
    console.error("Scrape API error:", err);
    return NextResponse.json(
      { error: "Unexpected error while scraping website." },
      { status: 500 }
    );
  }
}
