import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDbConnection } from "@/lib/db";
import { createToken, setAuthCookie } from "@/lib/auth";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email as string)?.trim()?.toLowerCase();
    const password = body.password as string;
    const name = (body.name as string)?.trim() || null;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const conn = await getDbConnection();

    const [existing] = await conn.execute(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );
    const rows = existing as { id: string }[];

    if (rows.length > 0) {
      await conn.end();
      return NextResponse.json(
        { error: "Email already registered. Log in instead." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = randomUUID();

    await conn.execute(
      "INSERT INTO users (id, email, password_hash, name, plan, conversation_limit) VALUES (?, ?, ?, ?, 'free', 100)",
      [userId, email, passwordHash, name]
    );

    await conn.end();

    const token = createToken({
      userId,
      email,
      plan: "free",
    });

    await setAuthCookie(token);

    return NextResponse.json({
      ok: true,
      user: { id: userId, email, name, plan: "free" },
    });
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json(
      { error: "Signup failed. Try again." },
      { status: 500 }
    );
  }
}
