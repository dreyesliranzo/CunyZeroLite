"use client";

import { useTransition } from "react";
import { clearFineAndReinstate } from "./actions";

export default function ClearFineButton({ userId }: { userId: number }) {
  const [isPending, startTransition] = useTransition();

  const onClick = () => {
    if (!confirm("Mark the fine paid and reinstate this student?")) return;
    const fd = new FormData();
    fd.set("userId", String(userId));
    startTransition(async () => {
      const result = await clearFineAndReinstate(fd);
      if (!result.success) alert(result.error ?? "Failed to clear fine.");
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
    >
      {isPending ? "Clearing…" : "Clear Fine & Reinstate"}
    </button>
  );
}
