import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar as CalendarIcon, AlertTriangle } from "lucide-react";
import { getSession } from "@/src/lib/session";
import { prisma } from "@/src/lib/db";
import LogoutButton from "@/src/components/LogoutButton";
import { parseSchedule, formatHM, DAY_ORDER, DAY_LABEL, type Slot } from "./schedule";

const COURSE_COLOURS = [
  "bg-blue-500/90 border-blue-700",
  "bg-emerald-500/90 border-emerald-700",
  "bg-purple-500/90 border-purple-700",
  "bg-amber-500/90 border-amber-700",
  "bg-rose-500/90 border-rose-700",
  "bg-cyan-500/90 border-cyan-700",
  "bg-indigo-500/90 border-indigo-700",
  "bg-teal-500/90 border-teal-700",
];

const HOUR_START = 8; // 8 AM
const HOUR_END = 21; // 9 PM
const MIN_START = HOUR_START * 60;
const MIN_END = HOUR_END * 60;
const SLOT_HEIGHT_PX = 36; // pixels per hour

export default async function CalendarPage() {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") redirect("/login");

  const enrollments = await prisma.enrollment.findMany({
    where: {
      userId: session.userId,
      course: { semester: { isCurrent: true }, cancelled: false },
    },
    include: {
      course: {
        select: {
          id: true,
          code: true,
          name: true,
          schedule: true,
          instructor: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  // Build per-day slot list once. Each course gets a stable colour by index.
  type Block = {
    courseId: number;
    code: string;
    name: string;
    instructor: string;
    colour: string;
    slot: Slot;
  };

  const blocksByDay: Record<string, Block[]> = {};
  const unparsed: { code: string; schedule: string }[] = [];

  enrollments.forEach((e, i) => {
    const slots = parseSchedule(e.course.schedule);
    if (!slots) {
      unparsed.push({ code: e.course.code, schedule: e.course.schedule });
      return;
    }
    const colour = COURSE_COLOURS[i % COURSE_COLOURS.length];
    const instructor = e.course.instructor
      ? `${e.course.instructor.firstName} ${e.course.instructor.lastName}`
      : "TBA";
    slots.forEach((slot) => {
      const key = slot.day;
      if (!blocksByDay[key]) blocksByDay[key] = [];
      blocksByDay[key].push({
        courseId: e.course.id,
        code: e.course.code,
        name: e.course.name,
        instructor,
        colour,
        slot,
      });
    });
  });

  const totalMin = MIN_END - MIN_START;
  const gridHeight = SLOT_HEIGHT_PX * (HOUR_END - HOUR_START);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 font-sans text-[#0f172a]">
      <nav className="sticky top-0 z-10 bg-[#0f172a] text-white shadow-xl border-b border-white/5">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-5">
          <Link
            href="/student/dashboard"
            className="flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-white"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-6">
            <span className="text-sm font-bold text-slate-300">
              {session.firstName} {session.lastName}
            </span>
            <LogoutButton />
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-8 py-10">
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-[#0f172a] to-[#1e3a8a] p-8 text-white shadow-xl">
          <div className="flex items-center gap-3">
            <CalendarIcon size={28} className="text-blue-300" />
            <h2 className="text-3xl font-black tracking-tight">My Schedule</h2>
          </div>
          <p className="mt-2 text-sm text-blue-200 font-medium">
            Visual weekly view of your enrolled courses this semester.
          </p>
        </div>

        {enrollments.length === 0 ? (
          <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center shadow-md">
            <p className="text-sm font-bold text-slate-400">
              No courses enrolled this semester.
            </p>
            <Link
              href="/student/register"
              className="mt-4 inline-block rounded-xl bg-[#0f172a] px-4 py-2 text-xs font-black uppercase tracking-widest text-white"
            >
              Register for Courses
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-md">
            <div className="grid grid-cols-[60px_repeat(5,1fr)] gap-px bg-slate-200">
              {/* Header row */}
              <div className="bg-white" />
              {DAY_ORDER.map((d) => (
                <div
                  key={d}
                  className="bg-white py-2 text-center text-[10px] font-black uppercase tracking-widest text-slate-500"
                >
                  {DAY_LABEL[d]}
                </div>
              ))}

              {/* Hour gutter + day columns */}
              <div className="bg-white relative" style={{ height: gridHeight }}>
                {Array.from({ length: HOUR_END - HOUR_START }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute left-0 right-0 text-[9px] font-bold text-slate-400 text-right pr-1"
                    style={{ top: i * SLOT_HEIGHT_PX - 6 }}
                  >
                    {formatHM((HOUR_START + i) * 60)}
                  </div>
                ))}
              </div>
              {DAY_ORDER.map((d) => {
                const blocks = blocksByDay[d] ?? [];
                return (
                  <div
                    key={d}
                    className="bg-white relative"
                    style={{ height: gridHeight }}
                  >
                    {/* hour gridlines */}
                    {Array.from({ length: HOUR_END - HOUR_START }).map((_, i) => (
                      <div
                        key={i}
                        className="absolute left-0 right-0 border-t border-slate-100"
                        style={{ top: i * SLOT_HEIGHT_PX }}
                      />
                    ))}
                    {blocks.map((b, idx) => {
                      const top =
                        ((b.slot.startMin - MIN_START) / totalMin) * gridHeight;
                      const height =
                        ((b.slot.endMin - b.slot.startMin) / totalMin) * gridHeight;
                      if (top < 0 || top > gridHeight) return null;
                      return (
                        <div
                          key={`${b.courseId}-${idx}`}
                          className={`absolute left-1 right-1 rounded-md border ${b.colour} text-white p-1.5 overflow-hidden shadow-sm`}
                          style={{ top, height: Math.max(height, 28) }}
                          title={`${b.code} ${b.name} · ${b.instructor} · ${formatHM(b.slot.startMin)}-${formatHM(b.slot.endMin)}`}
                        >
                          <p className="text-[10px] font-black leading-tight">
                            {b.code}
                          </p>
                          <p className="text-[9px] font-medium leading-tight opacity-90 truncate">
                            {b.name}
                          </p>
                          <p className="text-[8px] font-medium leading-tight opacity-80">
                            {formatHM(b.slot.startMin)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {unparsed.length > 0 && (
              <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-xs font-bold text-amber-800">
                <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                <div>
                  Could not place {unparsed.length} course
                  {unparsed.length !== 1 ? "s" : ""} on the grid:{" "}
                  {unparsed.map((u) => `${u.code} (${u.schedule})`).join(", ")}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
