"use client";

import { useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { saveGrade } from "../actions";

type Props = {
  courseId: number;
  enrollmentId: number;
  studentName: string;
  studentEmail: string;
  studentGpa: number;
  initialGrade: string | null;
  disabled: boolean;
};

const GRADES = ["A", "B", "C", "D", "F"];

export default function GradeRow({
  courseId,
  enrollmentId,
  studentName,
  studentEmail,
  studentGpa,
  initialGrade,
  disabled,
}: Props) {
  const [grade, setGrade] = useState<string>(initialGrade ?? "");
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (next: string) => {
    setGrade(next);
    setSaved(false);
    setError(null);
    if (!next) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("courseId", String(courseId));
      fd.set("enrollmentId", String(enrollmentId));
      fd.set("grade", next);
      const res = await saveGrade(fd);
      if (res.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      } else {
        setError(res.error ?? "Failed to save.");
      }
    });
  };

  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
      <div>
        <p className="text-sm font-bold text-[#0f172a]">{studentName}</p>
        <p className="text-[10px] text-slate-400 font-medium">
          GPA: {studentGpa.toFixed(2)} · {studentEmail}
        </p>
        {error && (
          <p className="mt-1 text-[10px] font-bold text-red-600">{error}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {saved && <CheckCircle2 size={16} className="text-emerald-500" />}
        <select
          value={grade}
          disabled={disabled || pending}
          onChange={(e) => handleChange(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-black text-[#0f172a] focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20 disabled:opacity-50"
        >
          <option value="">—</option>
          {GRADES.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
