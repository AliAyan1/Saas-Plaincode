import { NextRequest, NextResponse } from "next/server";
import { getDbConnection } from "@/lib/db";
import { getAuthFromCookie } from "@/lib/auth";
import { randomUUID } from "crypto";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthFromCookie();
    if (!auth?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chatbotId = req.nextUrl.searchParams.get("chatbotId")?.trim() || null;

    const conn = await getDbConnection();
    const joinSql = chatbotId
      ? " INNER JOIN conversations conv ON conv.id = forwarded_conversations.conversation_id AND conv.chatbot_id = ?"
      : "";
    const params: string[] = chatbotId ? [chatbotId, auth.userId] : [auth.userId];
    const [rows] = await conn.execute(
      `SELECT forwarded_conversations.id, forwarded_conversations.conversation_id AS conversationId, forwarded_conversations.customer, forwarded_conversations.preview, forwarded_conversations.forwarded_as AS forwardedAs, forwarded_conversations.ticket_ref AS ticketRef,
       forwarded_conversations.reply_text AS replyText, forwarded_conversations.replied_at AS repliedAt, forwarded_conversations.created_at AS createdAt
       FROM forwarded_conversations${joinSql} WHERE forwarded_conversations.user_id = ? ORDER BY forwarded_conversations.created_at DESC`,
      params
    );
    await conn.end();

    type Row = {
      id: string;
      conversationId: string;
      customer: string;
      preview: string;
      forwardedAs: string;
      ticketRef: string | null;
      replyText: string | null;
      repliedAt: string | null;
      createdAt: string;
    };

    const slaFor = (createdAt: string, repliedAt: string | null) => {
      if (repliedAt) return { slaStatus: "resolved" as const, slaPriority: 0 };
      const hours = (Date.now() - new Date(createdAt).getTime()) / 3_600_000;
      if (hours >= 24) return { slaStatus: "overdue" as const, slaPriority: 3 };
      if (hours >= 12) return { slaStatus: "critical" as const, slaPriority: 2 };
      if (hours >= 6) return { slaStatus: "high" as const, slaPriority: 1 };
      return { slaStatus: "waiting" as const, slaPriority: 0 };
    };

    const list = (rows as Row[]).map((r) => {
      const sla = slaFor(r.createdAt, r.repliedAt);
      return {
        id: r.id,
        conversationId: r.conversationId,
        customer: r.customer,
        preview: r.preview,
        forwardedAs: r.forwardedAs,
        ticketRef: r.ticketRef ?? null,
        replyText: r.replyText ?? null,
        repliedAt: r.repliedAt ?? null,
        createdAt: r.createdAt,
        slaStatus: sla.slaStatus,
        slaPriority: sla.slaPriority,
      };
    });

    list.sort((a, b) => {
      const openA = a.repliedAt ? 1 : 0;
      const openB = b.repliedAt ? 1 : 0;
      if (openA !== openB) return openA - openB;
      if (a.slaPriority !== b.slaPriority) return b.slaPriority - a.slaPriority;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    return NextResponse.json({ forwarded: list });
  } catch (err) {
    console.error("Forwarded list error:", err);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthFromCookie();
    if (!auth?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const conversationId = typeof body.conversationId === "string" ? body.conversationId.trim() : "";
    const chatbotId = typeof body.chatbotId === "string" ? body.chatbotId.trim() : null;
    const customer = typeof body.customer === "string" ? body.customer.trim() : "Customer";
    const customerEmail = typeof body.customerEmail === "string" ? body.customerEmail.trim() : null;
    const orderRef = typeof body.orderRef === "string" ? body.orderRef.trim() : null;
    const preview = typeof body.preview === "string" ? body.preview.trim() : "";
    const conversationText = typeof body.conversationText === "string" ? body.conversationText.trim() : "";

    if (!conversationId || !preview) {
      return NextResponse.json(
        { error: "conversationId and preview are required" },
        { status: 400 }
      );
    }

    const conn = await getDbConnection();
    const [existing] = await conn.execute(
      "SELECT id FROM forwarded_conversations WHERE conversation_id = ? AND user_id = ? LIMIT 1",
      [conversationId, auth.userId]
    );
    const existingRow = Array.isArray(existing) && existing.length > 0 ? (existing[0] as { id: string }) : null;
    const id = existingRow?.id ?? randomUUID();
    if (!existingRow) {
      await conn.execute(
        `INSERT INTO forwarded_conversations (id, user_id, conversation_id, customer, customer_email, preview, forwarded_as, ticket_ref)
         VALUES (?, ?, ?, ?, ?, ?, 'email', ?)`,
        [id, auth.userId, conversationId, customer, customerEmail || null, preview, orderRef || null]
      );
    }

    let forwardEmail: string | null = null;
    try {
      const [userRows] = await conn.execute(
        "SELECT forward_email FROM users WHERE id = ?",
        [auth.userId]
      );
      const ur = (userRows as { forward_email?: string }[])[0];
      forwardEmail = ur?.forward_email ?? null;
    } catch {
      // column may not exist before migration
    }

    if (!existingRow && forwardEmail) {
      let ticketRefForEmail: string | null = null;
      try {
        const [ticketRows] = await conn.execute(
          "SELECT ticket_ref FROM tickets WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 1",
          [conversationId]
        );
        const tr = (ticketRows as { ticket_ref: string }[])[0];
        if (tr) ticketRefForEmail = tr.ticket_ref;
      } catch {
        /* ignore */
      }
      const emailBody = [
        `Forwarded conversation`,
        ticketRefForEmail ? `Ticket: #${ticketRefForEmail}` : "",
        `Customer: ${customer}`,
        customerEmail ? `Email: ${customerEmail}` : "",
        orderRef ? `Order/Ref: ${orderRef}` : "",
        ``,
        `Preview: ${preview}`,
        ``,
        conversationText ? `Full conversation:\n${conversationText}` : "",
      ].filter(Boolean).join("\n");
      // Ticket # so support sees it; [conv:...] so inbound webhook can match the reply
      const subject = ticketRefForEmail
        ? `Forwarded Ticket #${ticketRefForEmail} [conv:${conversationId}] ${preview.slice(0, 40)}${preview.length > 40 ? "…" : ""}`
        : `Forwarded [conv:${conversationId}] ${preview.slice(0, 50)}${preview.length > 50 ? "…" : ""}`;
      if (process.env.RESEND_API_KEY) {
        try {
          const resendAbort = new AbortController();
          const resendTimeout = setTimeout(() => resendAbort.abort(), 60_000);
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
          console.error("Resend send failed:", e);
        }
      } else {
        console.log("[Forward to email] Forward email set; RESEND_API_KEY missing — email not sent.");
      }
    }

    await conn.execute(
      "UPDATE conversations SET status = 'forwarded' WHERE id = ?",
      [conversationId]
    );
    await conn.end();

    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error("Forwarded create error:", err);
    return NextResponse.json({ error: "Failed to forward" }, { status: 500 });
  }
}
