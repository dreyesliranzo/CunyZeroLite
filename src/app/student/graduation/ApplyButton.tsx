"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { applyForGraduation } from "./actions";

export default function ApplyButton({ premature }: { premature: boolean }) {
  const [pending, startTransition] = useTransition();
  const [confirmed, setConfirmed] = useState(!premature);
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const res = await applyForGraduation();
      if (!res.success) setError(res.error ?? "Failed.");
    });
  };

  if (premature && !confirmed) {
    return (
      <div className="rounded-2xl bg-amber-50 border border-amber-300 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle size={22} className="text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-black text-amber-800">
              You have not completed 8 passing courses yet.
            </p>
            <p className="mt-1 text-xs text-amber-700 font-medium">
              Submitting now is considered a "reckless application." If the
              registrar rejects, you will receive a warning on your record.
            </p>
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={() => setConfirmed(true)}
                className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-black uppercase tracking-widest text-white hover:bg-amber-700"
              >
                I understand, continue
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={submit}
        disabled={pending}
        className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-black text-white shadow-md hover:bg-emerald-700 disabled:opacity-50"
      >
        <CheckCircle2 size={16} /> {pending ? "Submitting…" : "Submit Graduation Request"}
      </button>
      {error && (
        <p className="mt-3 text-xs font-bold text-red-700">{error}</p>
      )}
    </div>
  );
}
