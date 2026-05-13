"use client";

import { useActionState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { submitComplaint } from "../actions";

type ActionResult = { success: boolean; error?: string; ok?: string };
const INITIAL: ActionResult = { success: false };

type TargetOption = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
};

export default function ComplaintForm({
  targets,
}: {
  targets: TargetOption[];
}) {
  const [state, formAction, pending] = useActionState(
    async (_prev: ActionResult, formData: FormData) =>
      submitComplaint(formData),
    INITIAL,
  );

  if (state.success) {
    return (
      <div className="rounded-2xl bg-white border border-emerald-200 p-8 shadow-md text-center">
        <CheckCircle2 size={48} className="mx-auto mb-3 text-emerald-500" />
        <h3 className="text-xl font-black text-[#0f172a]">Complaint filed</h3>
        <p className="mt-2 text-sm font-medium text-slate-600">{state.ok}</p>
        <Link
          href="/complaints"
          className="mt-6 inline-block rounded-xl bg-[#0f172a] px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white"
        >
          View My Complaints
        </Link>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="rounded-2xl bg-white border border-slate-200 p-6 shadow-md"
    >
      <label className="flex flex-col gap-1.5">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Target User
        </span>
        <select
          name="targetId"
          required
          defaultValue=""
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20"
        >
          <option value="">Select a person</option>
          {targets.map((t) => (
            <option key={t.id} value={t.id}>
              {t.firstName} {t.lastName} ({t.role.toLowerCase()}) — {t.email}
            </option>
          ))}
        </select>
      </label>

      <label className="mt-4 flex flex-col gap-1.5">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Description
        </span>
        <textarea
          name="description"
          required
          rows={5}
          placeholder="Describe what happened. Be specific."
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20"
        />
      </label>

      {state.error && (
        <p className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-xs font-bold text-red-700">
          {state.error}
        </p>
      )}

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-[#0f172a] px-5 py-2.5 text-sm font-black text-white shadow-md hover:bg-[#1e293b] disabled:opacity-50"
        >
          {pending ? "Submitting…" : "File Complaint"}
        </button>
        <Link
          href="/complaints"
          className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-700"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
