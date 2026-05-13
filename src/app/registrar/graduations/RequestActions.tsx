"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { approveGraduation, rejectGraduation } from "@/src/app/student/graduation/actions";

export default function RequestActions({ requestId }: { requestId: number }) {
  const [pending, startTransition] = useTransition();
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const approve = () => {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", String(requestId));
      const res = await approveGraduation(fd);
      if (!res.success) setError(res.error ?? "Failed.");
    });
  };

  const reject = () => {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", String(requestId));
      fd.set("reason", reason);
      const res = await rejectGraduation(fd);
      if (!res.success) setError(res.error ?? "Failed.");
    });
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={approve}
          disabled={pending}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          <Check size={12} /> Approve
        </button>
        <button
          type="button"
          onClick={() => (showReject ? reject() : setShowReject(true))}
          disabled={pending}
          className="flex items-center gap-1.5 rounded-lg bg-white border border-red-300 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          <X size={12} /> {showReject ? "Confirm Reject" : "Reject"}
        </button>
      </div>
      {showReject && (
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          placeholder="Reason (becomes warning text)…"
          className="w-64 rounded-lg border border-slate-300 px-2 py-1.5 text-xs font-medium"
        />
      )}
      {error && (
        <p className="text-[10px] font-bold text-red-600">{error}</p>
      )}
    </div>
  );
}
