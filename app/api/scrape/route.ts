import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const url = typeof body.url === "string" ? body.url : "";
    if (!url) {
      return NextResponse.json({ error: "Missing url in body." }, { status: 400 });
    }

    const python = spawn("python", ["python/scraper.py", url]);

    let stdout = "";
    let stderr = "";

    python.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    python.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    const exitCode: number = await new Promise((resolve) => {
      python.on("close", (code) => resolve(code ?? 0));
    });

    if (exitCode !== 0) {
      console.error("Scraper error:", stderr || stdout);
      return NextResponse.json(
        { error: "Scraper failed. Please check the URL and try again." },
        { status: 500 }
      );
    }

    let parsed: any;
    try {
      parsed = JSON.parse(stdout);
    } catch (err) {
      console.error("Failed to parse scraper output:", err, stdout);
      return NextResponse.json(
        { error: "Failed to parse scraper output." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      title: parsed.title ?? "",
      description: parsed.description ?? "",
      content: parsed.content ?? "",
      products: Array.isArray(parsed.products) ? parsed.products : [],
    });
  } catch (err) {
    console.error("Scrape API error:", err);
    return NextResponse.json(
      { error: "Unexpected error while scraping website." },
      { status: 500 }
    );
  }
}

