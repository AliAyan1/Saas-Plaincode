"use client";

import { useState } from "react";
import ChatPanel from "@/components/ChatPanel";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {open && (
        <div className="mb-3 w-[320px] sm:w-[380px]">
          <ChatPanel compact />
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-soft hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-slate-900"
      >
        {open ? "Close Assistant" : "Chat with Assistant"}
      </button>
    </div>
  );
}

