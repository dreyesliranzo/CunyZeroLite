"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Check, AlertTriangle, Star } from "lucide-react";

export type CourseOption = {
  id: number;
  code: string;
  name: string;
  credits: number;
  schedule: string;
  seatsLeft: number;
  instructor: string;
  alreadyPassed: boolean;
  alreadyEnrolled: boolean;
};

const DAY_LABELS: Record<string, string> = {
  M: "Mon", T: "Tue", W: "Wed", Th: "Thu", F: "Fri",
};
const DAY_ORDER = ["M", "T", "W", "Th", "F"];
// Schedule grid: 8 AM (8) to 6 PM (18)
const HOUR_START = 8;
const HOUR_END = 18;
const HOURS = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);

type ParsedSlot = {
  days: string[];      // e.g. ["M", "W", "F"]
  startHour: number;   // decimal — 10 or 14.5
  endHour: number;
  raw: string;
};

// Parse "MWF 10-11" / "TTh 9-10:30" / "MWF 1-2"
function parseSchedule(raw: string): ParsedSlot | null {
  const m = raw.trim().match(/^([MTWRFhTu]+)\s+(\d{1,2}(?::\d{2})?)\s*-\s*(\d{1,2}(?::\d{2})?)$/i);
  if (!m) return null;

  const dayPart = m[1];
  const days: string[] = [];
  let i = 0;
  while (i < dayPart.length) {
    if (dayPart[i] === "T" && dayPart[i + 1] === "h") {
      days.push("Th");
      i += 2;
    } else if ("MTWF".includes(dayPart[i])) {
      days.push(dayPart[i]);
      i += 1;
    } else {
      i += 1;
    }
  }

  const parseHour = (s: string) => {
    const [h, mm] = s.split(":");
    return Number(h) + (mm ? Number(mm) / 60 : 0);
  };
  let startHour = parseHour(m[2]);
  let endHour = parseHour(m[3]);
  // Heuristic: if start < 8 it's PM (e.g. "1-2" means 13:00-14:00 since 1 AM is implausible)
  if (startHour < 8) startHour += 12;
  if (endHour <= startHour) endHour += 12;

  return { days, startHour, endHour, raw };
}

const PALETTE = [
  "bg-blue-500 border-blue-600",
  "bg-emerald-500 border-emerald-600",
  "bg-purple-500 border-purple-600",
  "bg-amber-500 border-amber-600",
  "bg-rose-500 border-rose-600",
  "bg-indigo-500 border-indigo-600",
];

function colorFor(idx: number) {
  return PALETTE[idx % PALETTE.length];
}

function detectConflicts(picked: { course: CourseOption; slot: ParsedSlot | null }[]) {
  const conflicts = new Set<number>();
  for (let i = 0; i < picked.length; i++) {
    for (let j = i + 1; j < picked.length; j++) {
      const a = picked[i].slot;
      const b = picked[j].slot;
      if (!a || !b) continue;
      const sharedDays = a.days.filter((d) => b.days.includes(d));
      if (sharedDays.length === 0) continue;
      if (a.startHour < b.endHour && b.startHour < a.endHour) {
        conflicts.add(picked[i].course.id);
        conflicts.add(picked[j].course.id);
      }
    }
  }
  return conflicts;
}

export default function ScheduleBuilderClient({ options }: { options: CourseOption[] }) {
  const initial = new Set(options.filter((o) => o.alreadyEnrolled).map((o) => o.id));
  const [selected, setSelected] = useState<Set<number>>(initial);

  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const picked = useMemo(
    () =>
      [...selected].map((id) => {
        const course = options.find((o) => o.id === id)!;
        return { course, slot: parseSchedule(course.schedule) };
      }),
    [selected, options],
  );

  const conflicts = useMemo(() => detectConflicts(picked), [picked]);

  const totalCredits = picked.reduce((s, p) => s + p.course.credits, 0);
  const tooMany = selected.size > 4;
  const tooFew = selected.size > 0 && selected.size < 2;

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      {/* Left: course picker */}
      <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Available Courses</h3>
          <span className="text-xs font-bold text-slate-500">{selected.size} picked · {totalCredits} cr</span>
        </div>
        {options.length === 0 ? (
          <p className="text-sm font-medium text-slate-400 italic">No active courses for this term.</p>
        ) : (
          <ul className="space-y-2">
            {options.map((c, idx) => {
              const isSelected = selected.has(c.id);
              const isConflicting = conflicts.has(c.id);
              const slot = parseSchedule(c.schedule);
              const unparseable = !slot;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => toggle(c.id)}
                    className={`w-full text-left rounded-xl border p-3 transition-all ${
                      isSelected
                        ? isConflicting
                          ? "border-red-400 bg-red-50"
                          : "border-blue-500 bg-blue-50"
                        : "border-slate-200 bg-slate-50 hover:bg-white hover:border-blue-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`inline-block w-2.5 h-2.5 rounded-sm ${colorFor(idx).split(" ")[0]}`} />
                          <p className="text-sm font-black text-[#0f172a]">{c.code}</p>
                          {c.alreadyEnrolled && (
                            <span className="rounded bg-blue-100 text-blue-700 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest">
                              Enrolled
                            </span>
                          )}
                          {c.alreadyPassed && (
                            <span className="rounded bg-emerald-100 text-emerald-700 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest">
                              Passed
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 font-medium truncate">{c.name}</p>
                        <p className="text-[11px] text-slate-500 font-medium mt-1">
                          {c.schedule} · {c.instructor} · {c.seatsLeft} left
                        </p>
                        {unparseable && (
                          <p className="text-[10px] text-amber-700 font-bold mt-1">⚠ schedule format not parseable</p>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        {isSelected ? (
                          isConflicting ? (
                            <AlertTriangle size={18} className="text-red-600" />
                          ) : (
                            <Check size={18} className="text-blue-600" />
                          )
                        ) : (
                          <Plus size={18} className="text-slate-400" />
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Right: weekly grid */}
      <div className="space-y-4">
        {/* Status banner */}
        {(tooMany || tooFew || conflicts.size > 0) && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs font-medium text-amber-800 space-y-0.5">
              {conflicts.size > 0 && <p>• Time conflicts detected ({conflicts.size / 2} pair{conflicts.size / 2 !== 1 ? "s" : ""}).</p>}
              {tooMany && <p>• Maximum 4 courses per term — you have {selected.size} picked.</p>}
              {tooFew && <p>• Minimum 2 courses required to avoid a warning.</p>}
            </div>
          </div>
        )}
        {selected.size > 0 && conflicts.size === 0 && !tooMany && !tooFew && (
          <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 flex items-center gap-3">
            <Star size={18} className="text-emerald-600" />
            <p className="text-xs font-bold text-emerald-800">Looks good. {selected.size} course{selected.size !== 1 ? "s" : ""}, {totalCredits} credits, no conflicts.</p>
          </div>
        )}

        {/* Weekly grid */}
        <div className="rounded-2xl bg-white border border-slate-200 shadow-md overflow-hidden">
          <div className="grid" style={{ gridTemplateColumns: "60px repeat(5, 1fr)" }}>
            {/* Header row */}
            <div className="bg-slate-50 border-b border-slate-200" />
            {DAY_ORDER.map((d) => (
              <div key={d} className="bg-slate-50 border-b border-l border-slate-200 px-2 py-3 text-center">
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">{DAY_LABELS[d]}</p>
              </div>
            ))}
            {/* Hour rows */}
            {HOURS.map((hour) => (
              <Row
                key={hour}
                hour={hour}
                picked={picked}
                conflicts={conflicts}
              />
            ))}
          </div>
        </div>

        <Link
          href="/student/register"
          className="block w-full text-center rounded-2xl bg-blue-600 py-5 text-sm font-black uppercase tracking-[0.2em] text-white shadow-xl hover:bg-blue-500"
        >
          Like this plan? Register Now →
        </Link>
      </div>
    </div>
  );
}

function Row({
  hour,
  picked,
  conflicts,
}: {
  hour: number;
  picked: { course: CourseOption; slot: ParsedSlot | null }[];
  conflicts: Set<number>;
}) {
  const fmtHour = (h: number) => {
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${h12} ${ampm}`;
  };

  return (
    <>
      <div className="border-b border-slate-100 px-2 py-3 text-right">
        <p className="text-[10px] font-bold text-slate-400">{fmtHour(hour)}</p>
      </div>
      {DAY_ORDER.map((d) => {
        const items = picked
          .map((p, idx) => ({ p, idx }))
          .filter(({ p }) => p.slot && p.slot.days.includes(d) && hour >= p.slot.startHour && hour < p.slot.endHour);
        return (
          <div key={d} className="border-b border-l border-slate-100 min-h-[44px] relative">
            {items.map(({ p, idx }) => {
              const isStart = p.slot && hour === Math.floor(p.slot.startHour);
              if (!isStart) return null;
              const conflict = conflicts.has(p.course.id);
              const colorClass = conflict
                ? "bg-red-500 border-red-600 text-white"
                : `${colorFor(idx)} text-white`;
              const span = (p.slot!.endHour - p.slot!.startHour);
              return (
                <div
                  key={p.course.id}
                  className={`absolute inset-x-1 rounded-md border p-1.5 text-[10px] font-bold ${colorClass}`}
                  style={{ top: 2, height: `calc(${span * 100}% - 4px)` }}
                >
                  <p className="truncate font-black">{p.course.code}</p>
                  <p className="truncate text-white/80">{p.course.schedule}</p>
                </div>
              );
            })}
          </div>
        );
      })}
    </>
  );
}
