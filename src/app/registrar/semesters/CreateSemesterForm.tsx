"use client";

import { useActionState } from "react";
import { createSemester } from "./actions";
import type { ActionResult } from "./periods";

const INITIAL: ActionResult = { success: false };

async function action(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  return createSemester(formData);
}

export default function CreateSemesterForm() {
  const [state, formAction, pending] = useActionState(action, INITIAL);

  return (
    <form
      action={formAction}
      className="rounded-2xl bg-white border border-slate-200 p-6 shadow-md"
    >
      <h3 className="mb-4 text-lg font-black uppercase tracking-wide text-slate-700">
        Create New Semester
      </h3>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Name (e.g. Fall 2026)" name="name" required />
        <Field label="Term" name="term" placeholder="FALL / SPRING / SUMMER" required />
        <Field label="Year" name="year" type="number" defaultValue="2026" required />
        <Field
          label="Program Quota"
          name="programQuota"
          type="number"
          defaultValue="50"
        />
        <Field label="Start Date" name="startDate" type="date" required />
        <Field label="End Date" name="endDate" type="date" required />
      </div>

      {state.error && (
        <p className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-xs font-bold text-red-700">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="mt-4 rounded-lg bg-green-50 border border-green-200 px-4 py-2 text-xs font-bold text-green-700">
          Semester created.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-5 rounded-xl bg-[#0f172a] px-5 py-2.5 text-sm font-black text-white shadow-md hover:bg-[#1e293b] disabled:opacity-50"
      >
        {pending ? "Creating…" : "Create Semester"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
        {label}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20"
      />
    </label>
  );
}
