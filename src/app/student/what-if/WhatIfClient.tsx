"use client";

import { useMemo, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Award,
  XCircle,
  CheckCircle2,
  RotateCcw,
  Info,
} from "lucide-react";


const GRADE_POINTS: Record<Letter, number> = {
  A: 4,
  B: 3,
  C: 2,
  D: 1,
  F: 0,
};

type Letter = "A" | "B" | "C" | "D" | "F";

type HistoricalCourse = {
  id: number;
  code: string;
  name: string;
  grade: Letter;
  semesterName: string;
};

type CurrentCourse = {
  id: number;
  code: string;
  name: string;
  credits: number;
};

type Selection = Letter | "—";

type Props = {
  historicalCourses: HistoricalCourse[];
  currentCourses: CurrentCourse[];
  completedSemesterCount: number;
};

const GRADE_BADGE: Record<Letter, string> = {
  A: "bg-emerald-100 text-emerald-700 border-emerald-300",
  B: "bg-blue-100 text-blue-700 border-blue-300",
  C: "bg-amber-100 text-amber-700 border-amber-300",
  D: "bg-orange-100 text-orange-700 border-orange-300",
  F: "bg-red-100 text-red-700 border-red-300",
};

export default function WhatIfClient({
  historicalCourses,
  currentCourses,
  completedSemesterCount,
}: Props) {
  
  const [picks, setPicks] = useState<Record<number, Selection>>(() =>
    Object.fromEntries(currentCourses.map((c) => [c.id, "—" as Selection]))
  );

  // ----- Compute live GPAs -----
  const stats = useMemo(() => {

    const currentCodes = new Set(currentCourses.map((c) => c.code));
    const retakenCodes = new Set(
      historicalCourses
        .filter((h) => currentCodes.has(h.code))
        .map((h) => h.code)
    );

  
    const effectiveHistorical = historicalCourses.filter(
      (h) => !retakenCodes.has(h.code)
    );
    const historicalPoints = effectiveHistorical.reduce(
      (sum, c) => sum + GRADE_POINTS[c.grade],
      0
    );
    const historicalCount = effectiveHistorical.length;
    const historicalGpa =
      historicalCount > 0 ? historicalPoints / historicalCount : 0;

    // For display, also compute the "true" historical GPA (with retaken Fs
    // still counted) so we can show the user the comparison.
    const trueHistoricalPoints = historicalCourses.reduce(
      (sum, c) => sum + GRADE_POINTS[c.grade],
      0
    );
    const trueHistoricalCount = historicalCourses.length;
    const trueHistoricalGpa =
      trueHistoricalCount > 0 ? trueHistoricalPoints / trueHistoricalCount : 0;

    // Hypothetical semester (only courses the user has picked a grade for)
    const picked = currentCourses
      .map((c) => ({ course: c, grade: picks[c.id] }))
      .filter((p): p is { course: CurrentCourse; grade: Letter } => p.grade !== "—");

    const semesterPoints = picked.reduce(
      (sum, p) => sum + GRADE_POINTS[p.grade],
      0
    );
    const semesterCount = picked.length;
    const semesterGpa = semesterCount > 0 ? semesterPoints / semesterCount : 0;

    // Projected cumulative uses the retake-adjusted historical
    const projectedPoints = historicalPoints + semesterPoints;
    const projectedCount = historicalCount + semesterCount;
    const projectedGpa =
      projectedCount > 0 ? projectedPoints / projectedCount : 0;

    const gpaChange = projectedGpa - trueHistoricalGpa;

  
    const historicalFailedCodes = new Set(
      historicalCourses.filter((c) => c.grade === "F").map((c) => c.code)
    );
    const hypotheticalFailedCodes = picked
      .filter((p) => p.grade === "F")
      .map((p) => p.course.code);
    const doubleFail = hypotheticalFailedCodes.some((code) =>
      historicalFailedCodes.has(code)
    );

    return {
      historicalGpa: trueHistoricalGpa,
      historicalCount: trueHistoricalCount,
      semesterGpa,
      semesterCount,
      projectedGpa,
      projectedCount,
      gpaChange,
      doubleFail,
      retakenCodes,
      allPicked: semesterCount === currentCourses.length && currentCourses.length > 0,
    };
  }, [picks, currentCourses, historicalCourses]);


  const alerts = useMemo(() => {
    const out: {
      level: "danger" | "warning" | "success" | "info";
      title: string;
      message: string;
    }[] = [];

    if (stats.semesterCount === 0) {
      out.push({
        level: "info",
        title: "Pick some grades to start",
        message:
          "Choose a hypothetical letter grade for each current course on the right to see your projected GPA and any academic-standing flags.",
      });
      return out;
    }

    // Termination: double-fail of the same course
    if (stats.doubleFail) {
      out.push({
        level: "danger",
        title: "Auto-termination risk: same-course double fail",
        message:
          "You'd be failing a course you previously failed. Per UC-9, this triggers automatic termination from the program.",
      });
    }

    // Termination: cumulative GPA below 2.0
    if (stats.projectedGpa < 2.0 && stats.projectedCount > 0) {
      out.push({
        level: "danger",
        title: "Auto-termination risk: cumulative GPA below 2.0",
        message: `Your projected cumulative GPA (${stats.projectedGpa.toFixed(
          2
        )}) is below 2.0. Per UC-9, this triggers automatic termination.`,
      });
    } else if (stats.projectedGpa >= 2.0 && stats.projectedGpa <= 2.25) {
      // Warning band
      out.push({
        level: "warning",
        title: "Academic warning + registrar interview required",
        message: `Cumulative GPA between 2.0 and 2.25 (yours: ${stats.projectedGpa.toFixed(
          2
        )}) triggers a warning and a mandatory interview with the registrar.`,
      });
    }

    // Honor roll: semester GPA above 3.75 (only if all courses are picked, so it's a complete semester)
    if (stats.allPicked && stats.semesterGpa > 3.75) {
      out.push({
        level: "success",
        title: "Semester Honor Roll!",
        message: `Your semester GPA (${stats.semesterGpa.toFixed(
          2
        )}) is above 3.75. You'd be added to the honor roll — and one honor can cancel one active warning.`,
      });
    }

    // Honor roll: cumulative > 3.5 with more than one completed semester
    // (a complete current semester would make this the 2nd+)
    if (
      stats.allPicked &&
      stats.projectedGpa > 3.5 &&
      completedSemesterCount >= 1
    ) {
      out.push({
        level: "success",
        title: "Overall Honor Roll!",
        message: `Cumulative GPA above 3.5 across multiple semesters (yours: ${stats.projectedGpa.toFixed(
          2
        )}) qualifies you for overall honor-roll status.`,
      });
    }

    // Positive-but-not-honor neutral message
    if (
      stats.projectedGpa > 2.25 &&
      stats.projectedGpa <= 3.5 &&
      !stats.doubleFail
    ) {
      out.push({
        level: "info",
        title: "Good academic standing",
        message: `Projected cumulative GPA of ${stats.projectedGpa.toFixed(
          2
        )} — no warnings, no honors. Solid.`,
      });
    }

    return out;
  }, [stats, completedSemesterCount]);

  function setPick(courseId: number, grade: Selection) {
    setPicks((p) => ({ ...p, [courseId]: grade }));
  }

  function reset() {
    setPicks(
      Object.fromEntries(currentCourses.map((c) => [c.id, "—" as Selection]))
    );
  }

 
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      {/* Left column: course list + grade pickers */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-black uppercase tracking-wide text-slate-700">
            Current Courses
          </h3>
          {stats.semesterCount > 0 && (
            <button
              onClick={reset}
              className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <RotateCcw size={14} /> Reset
            </button>
          )}
        </div>

        {currentCourses.length === 0 ? (
          <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center shadow-md">
            <Info size={36} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-bold text-slate-500 mb-1">
              No active courses to project
            </p>
            <p className="text-xs text-slate-400 font-medium">
              Once you're enrolled in courses for the current semester, you'll
              be able to try out hypothetical grades here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {currentCourses.map((c) => {
              const pick = picks[c.id];
              const isRetake = stats.retakenCodes.has(c.code);
              return (
                <div
                  key={c.id}
                  className="rounded-2xl bg-white border border-slate-200 p-5 shadow-md"
                >
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-black uppercase tracking-widest text-blue-600">
                          {c.code}
                        </p>
                        {isRetake && (
                          <span className="rounded-md bg-purple-100 border border-purple-200 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-purple-700">
                            Retake
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm font-bold text-[#0f172a] truncate">
                        {c.name}
                      </p>
                      <p className="text-xs text-slate-400 font-medium">
                        {c.credits} credits
                        {isRetake && " · replaces your previous grade"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(["A", "B", "C", "D", "F"] as Letter[]).map((g) => {
                      const active = pick === g;
                      return (
                        <button
                          key={g}
                          onClick={() => setPick(c.id, active ? "—" : g)}
                          className={`h-10 w-10 rounded-xl border text-sm font-black transition-all ${
                            active
                              ? GRADE_BADGE[g] + " shadow-md scale-105"
                              : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                          }`}
                          aria-pressed={active}
                          aria-label={`Set hypothetical grade ${g} for ${c.code}`}
                        >
                          {g}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Historical context */}
        {historicalCourses.length > 0 && (
          <>
            <h3 className="mb-4 mt-10 text-lg font-black uppercase tracking-wide text-slate-700">
              Locked Historical Grades
            </h3>
            <div className="rounded-2xl bg-white/70 border border-slate-200 p-5 shadow-sm">
              <p className="mb-3 text-xs text-slate-500 font-medium">
                These already count toward your cumulative GPA and can't be
                changed here.
              </p>
              <ul className="space-y-2">
                {historicalCourses.map((c) => {
                  const superseded = stats.retakenCodes.has(c.code);
                  return (
                    <li
                      key={c.id}
                      className={`flex items-center justify-between gap-3 py-1 border-b border-slate-100 last:border-0 ${
                        superseded ? "opacity-50" : ""
                      }`}
                    >
                      <div className="min-w-0">
                        <span className="text-xs font-black tracking-widest text-slate-400">
                          {c.code}
                        </span>
                        <span
                          className={`ml-3 text-sm font-bold text-[#0f172a] ${
                            superseded ? "line-through" : ""
                          }`}
                        >
                          {c.name}
                        </span>
                        <span className="ml-2 text-xs text-slate-400">
                          ({c.semesterName})
                        </span>
                        {superseded && (
                          <span className="ml-2 rounded-md bg-slate-200 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-slate-600">
                            Retaking
                          </span>
                        )}
                      </div>
                      <span
                        className={`rounded-md border px-2 py-0.5 text-xs font-black ${GRADE_BADGE[c.grade]}`}
                      >
                        {c.grade}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </>
        )}
      </div>

      {/* Right column: live results */}
      <aside className="space-y-6 lg:sticky lg:top-24 h-fit">
        {/* Projected GPA card */}
        <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-md">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
            Projected Cumulative GPA
          </p>
          <div className="flex items-end gap-3">
            <p className="text-5xl font-black text-[#0f172a] tabular-nums">
              {stats.projectedGpa.toFixed(2)}
            </p>
            {stats.semesterCount > 0 && stats.historicalCount > 0 && (
              <span
                className={`mb-2 flex items-center gap-1 text-xs font-black ${
                  stats.gpaChange >= 0 ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {stats.gpaChange >= 0 ? (
                  <TrendingUp size={14} />
                ) : (
                  <TrendingDown size={14} />
                )}
                {stats.gpaChange >= 0 ? "+" : ""}
                {stats.gpaChange.toFixed(2)}
              </span>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-400 font-medium">
            Based on {stats.projectedCount} graded course
            {stats.projectedCount === 1 ? "" : "s"}
          </p>
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
              Historical
            </p>
            <p className="mt-1 text-xl font-black text-[#0f172a] tabular-nums">
              {stats.historicalGpa.toFixed(2)}
            </p>
            <p className="text-[10px] text-slate-400 font-medium">
              {stats.historicalCount} course
              {stats.historicalCount === 1 ? "" : "s"}
            </p>
          </div>
          <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
              This Semester
            </p>
            <p className="mt-1 text-xl font-black text-[#0f172a] tabular-nums">
              {stats.semesterCount > 0 ? stats.semesterGpa.toFixed(2) : "—"}
            </p>
            <p className="text-[10px] text-slate-400 font-medium">
              {stats.semesterCount} of {currentCourses.length} picked
            </p>
          </div>
        </div>

        {/* Alerts */}
        <div className="space-y-3">
          {alerts.map((a, i) => {
            const styles = {
              danger: "bg-rose-50 border-rose-200 text-rose-800",
              warning: "bg-amber-50 border-amber-200 text-amber-800",
              success: "bg-emerald-50 border-emerald-200 text-emerald-800",
              info: "bg-blue-50 border-blue-200 text-blue-800",
            }[a.level];

            const Icon = {
              danger: XCircle,
              warning: AlertTriangle,
              success: Award,
              info: a.level === "info" && stats.semesterCount > 0
                ? CheckCircle2
                : Info,
            }[a.level];

            return (
              <div
                key={i}
                className={`rounded-2xl border p-4 shadow-sm ${styles}`}
              >
                <div className="flex items-start gap-3">
                  <Icon size={20} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-black mb-1">{a.title}</p>
                    <p className="text-xs font-medium leading-relaxed opacity-90">
                      {a.message}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Disclaimer */}
        <p className="text-[10px] text-slate-400 font-medium leading-relaxed px-2">
          This is a what-if projection only. Real grades are assigned by your
          instructors during the grading period, and academic standing is
          evaluated by the system when the semester completes.
        </p>
      </aside>
    </div>
  );
}