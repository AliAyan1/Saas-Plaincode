"use client";

import AppShell from "@/components/AppShell";
import Card from "@/components/Card";
import Button from "@/components/Button";
import { useBot } from "@/components/BotContext";

export default function SettingsPage() {
  const { userPlan, setUserPlan } = useBot();

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-slate-100">Settings</h1>
        <p className="mt-1 text-slate-400">Manage bot and account settings.</p>

        <Card className="mt-6">
          <h2 className="text-sm font-semibold text-slate-200">Plan (demo)</h2>
          <p className="mt-1 text-xs text-slate-500">
            Switch plan to test Pro features like ticket tracking. Real plan comes from your account when we add auth.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant={userPlan === "free" ? "primary" : "outline"}
              onClick={() => setUserPlan("free")}
            >
              Free
            </Button>
            <Button
              variant={userPlan === "pro" ? "primary" : "outline"}
              onClick={() => setUserPlan("pro")}
            >
              Pro
            </Button>
          </div>
          {userPlan === "pro" && (
            <p className="mt-3 text-xs text-emerald-400">
              Pro active. Every query will create a ticket. View them on the dashboard or Tickets page.
            </p>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
