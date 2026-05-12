"use client";

import { MessageCircle } from "lucide-react";

export default function AskAICard() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("chat:open"))}
      className="group rounded-[2rem] border border-slate-300 bg-white p-10 shadow-sm transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border-b-4 hover:border-b-blue-600 block text-left w-full"
    >
      <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
        <MessageCircle />
      </div>
      <h4 className="text-lg font-black tracking-tight text-slate-900 mb-4">Ask the AI Assistant</h4>
      <p className="text-sm leading-relaxed text-slate-500 font-medium">
        Open the chat widget for instant answers about admissions, policies, and getting started.
      </p>
    </button>
  );
}
