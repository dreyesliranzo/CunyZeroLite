"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { admitFromWaitlist } from "@/src/app/student/register/actions";

export default function AdmitButton({
  waitlistId,
  disabled,
}: {
  waitlistId: number;
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending || disabled}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const fd = new FormData();
            fd.set("waitlistId", String(waitlistId));
            const res = await admitFromWaitlist(fd);
            if (!res.success) setError(res.error ?? "Failed.");
          });
        }}
        className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        <Check size={12} /> Admit
      </button>
      {error && (
        <p className="text-[10px] font-bold text-red-600">{error}</p>
      )}
    </div>
  );
}
