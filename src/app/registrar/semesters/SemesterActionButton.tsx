"use client";

import { useActionState } from "react";
import type { ActionResult } from "./periods";

const INITIAL: ActionResult = { success: false };

type Variant = "primary" | "secondary";

const VARIANT_CLASS: Record<Variant, string> = {
  primary:
    "bg-[#0f172a] text-white hover:bg-[#1e293b] shadow-md disabled:opacity-50",
  secondary:
    "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 shadow-sm disabled:opacity-50",
};

type Props = {
  semesterId: number;
  label: string;
  variant?: Variant;
  action: (formData: FormData) => Promise<ActionResult>;
};

export default function SemesterActionButton({
  semesterId,
  label,
  variant = "primary",
  action,
}: Props) {
  const [state, formAction, pending] = useActionState(
    async (_prev: ActionResult, formData: FormData) => action(formData),
    INITIAL,
  );

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="semesterId" value={semesterId} />
      <button
        type="submit"
        disabled={pending}
        className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest ${VARIANT_CLASS[variant]}`}
      >
        {pending ? "…" : label}
      </button>
      {state.error && (
        <p className="text-[10px] font-bold text-red-600">{state.error}</p>
      )}
      {state.ok && (
        <p className="max-w-xs text-right text-[10px] font-bold text-emerald-700">
          {state.ok}
        </p>
      )}
    </form>
  );
}
