"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { GraduationCap, BookOpen, CheckCircle2 } from "lucide-react";
import { submitApplication } from "./actions";
import type { ActionResult } from "./types";

const INITIAL: ActionResult = { success: false };

export default function ApplyForm() {
  const [type, setType] = useState<"STUDENT" | "INSTRUCTOR">("STUDENT");
  const [state, formAction, pending] = useActionState(
    async (_prev: ActionResult, formData: FormData) =>
      submitApplication(formData),
    INITIAL,
  );

  if (state.success) {
    return (
      <div className="rounded-2xl bg-white border border-emerald-200 p-8 shadow-md text-center">
        <CheckCircle2
          size={48}
          className="mx-auto mb-3 text-emerald-500"
        />
        <h3 className="text-xl font-black text-[#0f172a]">
          Application received
        </h3>
        <p className="mt-2 text-sm font-medium text-slate-600">{state.ok}</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-xl bg-[#0f172a] px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="rounded-2xl bg-white border border-slate-200 p-8 shadow-md"
    >
      <fieldset className="mb-6">
        <legend className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
          I am applying as a
        </legend>
        <div className="grid grid-cols-2 gap-3">
          <RoleOption
            value="STUDENT"
            label="Student"
            icon={<GraduationCap size={20} />}
            selected={type === "STUDENT"}
            onSelect={() => setType("STUDENT")}
          />
          <RoleOption
            value="INSTRUCTOR"
            label="Instructor"
            icon={<BookOpen size={20} />}
            selected={type === "INSTRUCTOR"}
            onSelect={() => setType("INSTRUCTOR")}
          />
        </div>
        <input type="hidden" name="type" value={type} />
      </fieldset>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="First Name" name="firstName" required />
        <Field label="Last Name" name="lastName" required />
        <Field
          label="Contact Email"
          name="email"
          type="email"
          required
          className="md:col-span-2"
        />
        {type === "STUDENT" && (
          <>
            <Field
              label="Prior GPA (0.0 - 4.0)"
              name="priorGpa"
              type="number"
              min={0}
              max={4}
              step={0.01}
              required
            />
            <div className="md:col-span-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Written Justification
                </span>
                <textarea
                  name="justification"
                  rows={4}
                  required
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20"
                  placeholder="Why do you want to enroll at CunyZeroLite?"
                />
              </label>
            </div>
          </>
        )}
      </div>

      {state.error && (
        <p className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-xs font-bold text-red-700">
          {state.error}
        </p>
      )}

      <div className="mt-6 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-[#0f172a] px-5 py-2.5 text-sm font-black text-white shadow-md hover:bg-[#1e293b] disabled:opacity-50"
        >
          {pending ? "Submitting…" : "Submit Application"}
        </button>
        <Link
          href="/"
          className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-700"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

function RoleOption({
  label,
  icon,
  selected,
  onSelect,
}: {
  value: string;
  label: string;
  icon: React.ReactNode;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-sm font-bold transition-all ${
        selected
          ? "border-[#0f172a] bg-[#0f172a] text-white"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
      }`}
    >
      {icon} {label}
    </button>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  min,
  max,
  step,
  className,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
        {label}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        min={min}
        max={max}
        step={step}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20"
      />
    </label>
  );
}
