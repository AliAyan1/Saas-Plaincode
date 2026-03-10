import { NextResponse } from "next/server";
import { getDbConnection } from "@/lib/db";
import { getAuthFromCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await getAuthFromCookie();
    if (!auth?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conn = await getDbConnection();
    const userId = auth.userId;

    // Week boundaries (UTC): this week and last week
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const startOfThisWeek = new Date(now);
    startOfThisWeek.setUTCDate(now.getUTCDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    startOfThisWeek.setUTCHours(0, 0, 0, 0);
    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setUTCDate(startOfLastWeek.getUTCDate() - 7);
    const thisWeekStr = startOfThisWeek.toISOString().slice(0, 19).replace("T", " ");
    const lastWeekStr = startOfLastWeek.toISOString().slice(0, 19).replace("T", " ");

    // Total forwarded this week
    const [totalRows] = await conn.execute(
      "SELECT COUNT(*) AS total FROM forwarded_conversations WHERE user_id = ? AND created_at >= ?",
      [userId, thisWeekStr]
    );
    const totalForwarded = Number((totalRows as { total: number }[])[0]?.total ?? 0);

    // Total last week (for % change)
    const [lastWeekRows] = await conn.execute(
      "SELECT COUNT(*) AS total FROM forwarded_conversations WHERE user_id = ? AND created_at >= ? AND created_at < ?",
      [userId, lastWeekStr, thisWeekStr]
    );
    const totalLastWeek = Number((lastWeekRows as { total: number }[])[0]?.total ?? 0);
    let percentChange = 0;
    if (totalLastWeek > 0) {
      percentChange = Math.round(((totalForwarded - totalLastWeek) / totalLastWeek) * 100);
    } else if (totalForwarded > 0) {
      percentChange = 100;
    }

    // Sent to email vs live agent (this week)
    const [emailRows] = await conn.execute(
      "SELECT COUNT(*) AS c FROM forwarded_conversations WHERE user_id = ? AND created_at >= ? AND forwarded_as = 'email'",
      [userId, thisWeekStr]
    );
    const sentToEmail = Number((emailRows as { c: number }[])[0]?.c ?? 0);
    const liveAgentTransfers = totalForwarded - sentToEmail;
    const emailPct = totalForwarded > 0 ? Math.round((sentToEmail / totalForwarded) * 1000) / 10 : 0;
    const livePct = totalForwarded > 0 ? Math.round((liveAgentTransfers / totalForwarded) * 1000) / 10 : 0;

    // Handoff distribution: use ticket types for forwarded (this week)
    const [typeRows] = await conn.execute(
      `SELECT type, COUNT(*) AS c FROM tickets
       WHERE user_id = ? AND created_at >= ? AND type IN ('forwarded_email', 'forwarded_human', 'escalated', 'other')
       GROUP BY type`,
      [userId, thisWeekStr]
    );
    const typeCounts = (typeRows as { type: string; c: number }[]) || [];
    const totalTickets = typeCounts.reduce((s, r) => s + r.c, 0);
    const distribution = [
      { label: "Refund request", type: "forwarded_email", pct: 0 },
      { label: "Frustrated customer", type: "forwarded_human", pct: 0 },
      { label: "Complex technical issue", type: "escalated", pct: 0 },
      { label: "Out of scope inquiry", type: "other", pct: 0 },
    ].map((d) => {
      const row = typeCounts.find((r) => r.type === d.type);
      const c = row ? row.c : 0;
      const pct = totalTickets > 0 ? Math.round((c / totalTickets) * 100) : 0;
      return { ...d, count: c, pct };
    });
    // If no ticket data, use email vs ticket as fallback (two buckets)
    if (totalTickets === 0 && totalForwarded > 0) {
      distribution[0].pct = emailPct;
      distribution[0].label = "Sent to email";
      distribution[1].pct = livePct;
      distribution[1].label = "Live agent transfer";
      distribution[2].pct = 0;
      distribution[3].pct = 0;
    }

    // Peak hour (this week) from forwarded_conversations
    const [hourRows] = await conn.execute(
      `SELECT HOUR(created_at) AS hour, COUNT(*) AS c FROM forwarded_conversations
       WHERE user_id = ? AND created_at >= ?
       GROUP BY HOUR(created_at) ORDER BY c DESC LIMIT 1`,
      [userId, thisWeekStr]
    );
    const peakRow = (hourRows as { hour: number; c: number }[])[0];
    let peakTime = "—";
    if (peakRow && peakRow.c > 0) {
      const h = peakRow.hour;
      const h2 = Math.min(h + 2, 23);
      const fmt = (hour: number) => {
        const h12 = hour % 12 || 12;
        const ampm = hour < 12 ? "AM" : "PM";
        return `${h12}:00 ${ampm}`;
      };
      peakTime = `${fmt(h)} – ${fmt(h2)}`;
    }

    // Avg response time (replied_at - created_at) in minutes, if column exists
    let avgResponseMinutes: number | null = null;
    try {
      const [avgRows] = await conn.execute(
        `SELECT AVG(TIMESTAMPDIFF(MINUTE, created_at, replied_at)) AS avg_min
         FROM forwarded_conversations WHERE user_id = ? AND created_at >= ? AND replied_at IS NOT NULL`,
        [userId, thisWeekStr]
      );
      const avgVal = (avgRows as { avg_min: number | null }[])[0]?.avg_min;
      if (avgVal != null && !Number.isNaN(avgVal)) avgResponseMinutes = Math.round(avgVal * 10) / 10;
    } catch {
      // replied_at column may not exist
    }

    await conn.end();

    return NextResponse.json({
      totalForwarded,
      percentChange,
      sentToEmail,
      liveAgentTransfers,
      emailPct,
      livePct,
      distribution,
      peakTime,
      avgResponseMinutes,
    });
  } catch (err) {
    console.error("Analytics forwarded error:", err);
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}
