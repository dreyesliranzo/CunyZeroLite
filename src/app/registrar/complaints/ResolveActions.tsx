"use client";

import { useState, useTransition } from "react";
import { resolveComplaint } from "@/src/app/complaints/actions";

type Action = "WARN" | "DEREGISTER" | "DISMISS" | "WARN_FILER";

export default function ResolveActions({
  complaintId,
  targetRole,
}: {
  complaintId: number;
  targetRole: string;
}) {
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const run = (action: Action) => {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", String(complaintId));
      fd.set("action", action);
      fd.set("note", note);
      const res = await resolveComplaint(fd);
      if (!res.success) setError(res.error ?? "Failed.");
    });
  };

  const showDeregister = targetRole === "STUDENT";

  return (
    <div className="space-y-2">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder="Resolution note (optional for warn/dismiss)…"
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900"
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => run("WARN")}
          className="rounded-lg bg-amber-500 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white hover:bg-amber-600 disabled:opacity-50"
        >
          Warn Target
        </button>
        {showDeregister && (
          <button
            type="button"
            disabled={pending}
            onClick={() => run("DEREGISTER")}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white hover:bg-red-700 disabled:opacity-50"
          >
            De-register
          </button>
        )}
        <button
          type="button"
          disabled={pending}
          onClick={() => run("WARN_FILER")}
          className="rounded-lg bg-white border border-amber-300 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-amber-700 hover:bg-amber-50 disabled:opacity-50"
        >
          Warn Filer
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => run("DISMISS")}
          className="rounded-lg bg-white border border-slate-300 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          Dismiss
        </button>
      </div>
      {error && (
        <p className="text-[10px] font-bold text-red-600">{error}</p>
      )}
    </div>
  );
}
