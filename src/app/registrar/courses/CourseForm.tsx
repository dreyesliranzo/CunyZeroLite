"use client";

import { useActionState } from "react";
import type { ActionResult } from "./types";

const INITIAL: ActionResult = { success: false };

type SemesterOption = {
  id: number;
  name: string;
  period: string;
};

type InstructorOption = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
};

type Props = {
  action: (formData: FormData) => Promise<ActionResult>;
  semesters: SemesterOption[];
  instructors: InstructorOption[];
  initial?: {
    id?: number;
    code?: string;
    name?: string;
    credits?: number;
    maxStudents?: number;
    schedule?: string;
    semesterId?: number;
    instructorId?: number | null;
  };
  submitLabel: string;
};

export default function CourseForm({
  action,
  semesters,
  instructors,
  initial,
  submitLabel,
}: Props) {
  const [state, formAction, pending] = useActionState(
    async (_prev: ActionResult, formData: FormData) => action(formData),
    INITIAL,
  );

  return (
    <form
      action={formAction}
      className="rounded-2xl bg-white border border-slate-200 p-6 shadow-md"
    >
      {initial?.id !== undefined && (
        <input type="hidden" name="id" value={initial.id} />
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Course Code (e.g. CS101)"
          name="code"
          defaultValue={initial?.code}
          required
        />
        <Field
          label="Course Name"
          name="name"
          defaultValue={initial?.name}
          required
        />
        <Field
          label="Credits"
          name="credits"
          type="number"
          min={1}
          max={12}
          defaultValue={String(initial?.credits ?? 3)}
          required
        />
        <Field
          label="Max Students"
          name="maxStudents"
          type="number"
          min={1}
          defaultValue={String(initial?.maxStudents ?? 30)}
          required
        />
        <Field
          label="Schedule (e.g. MWF 10:00-11:00)"
          name="schedule"
          defaultValue={initial?.schedule}
          required
        />
        <Select
          label="Semester"
          name="semesterId"
          defaultValue={initial?.semesterId ? String(initial.semesterId) : ""}
          required
          options={semesters.map((s) => ({
            value: String(s.id),
            label: `${s.name} — ${s.period.replace("_", " ")}`,
          }))}
          placeholder="Select a semester"
        />
        <Select
          label="Instructor (optional)"
          name="instructorId"
          defaultValue={
            initial?.instructorId !== undefined && initial.instructorId !== null
              ? String(initial.instructorId)
              : ""
          }
          options={instructors.map((i) => ({
            value: String(i.id),
            label: `${i.firstName} ${i.lastName} (${i.email})`,
          }))}
          placeholder="Unassigned"
        />
      </div>

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
          {pending ? "Saving…" : submitLabel}
        </button>
        <a
          href="/registrar/courses"
          className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-700"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  defaultValue,
  min,
  max,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  min?: number;
  max?: number;
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
        min={min}
        max={max}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20"
      />
    </label>
  );
}

function Select({
  label,
  name,
  options,
  defaultValue,
  required,
  placeholder,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  defaultValue?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
        {label}
      </span>
      <select
        name={name}
        required={required}
        defaultValue={defaultValue}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
