"use client";

import { useActionState } from "react";
import type { ActionResult } from "./types";

const INITIAL: ActionResult = { success: false };

type Variant = "danger" | "secondary";

const VARIANT_CLASS: Record<Variant, string> = {
  danger:
    "border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50",
  secondary:
    "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50",
};

type Props = {
  courseId: number;
  label: string;
  variant: Variant;
  action: (formData: FormData) => Promise<ActionResult>;
};

export default function CourseRowActions({
  courseId,
  label,
  variant,
  action,
}: Props) {
  const [state, formAction, pending] = useActionState(
    async (_prev: ActionResult, formData: FormData) => action(formData),
    INITIAL,
  );

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="id" value={courseId} />
      <button
        type="submit"
        disabled={pending}
        className={`rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${VARIANT_CLASS[variant]}`}
      >
        {pending ? "…" : label}
      </button>
      {state.error && (
        <p className="text-[10px] font-bold text-red-600">{state.error}</p>
      )}
    </form>
  );
}
