import { redirect } from "next/navigation";
import Link from "next/link";
import { Calendar, Clock, ArrowLeft, CheckCircle2 } from "lucide-react";
import { getSession } from "@/src/lib/session";
import { prisma } from "@/src/lib/db";
import LogoutButton from "@/src/components/LogoutButton";
import { advancePeriod, setCurrentSemester } from "./actions";
import { PERIODS, type Period } from "./periods";
import CreateSemesterForm from "./CreateSemesterForm";
import SemesterActionButton from "./SemesterActionButton";

const PERIOD_LABEL: Record<Period, string> = {
  CLASS_SETUP: "Class Set-up",
  REGISTRATION: "Course Registration",
  RUNNING: "Class Running",
  GRADING: "Grading",
  COMPLETED: "Completed",
};

const PERIOD_COLOR: Record<Period, string> = {
  CLASS_SETUP: "bg-slate-100 text-slate-700 border-slate-300",
  REGISTRATION: "bg-blue-100 text-blue-800 border-blue-300",
  RUNNING: "bg-purple-100 text-purple-800 border-purple-300",
  GRADING: "bg-amber-100 text-amber-800 border-amber-300",
  COMPLETED: "bg-emerald-100 text-emerald-800 border-emerald-300",
};

const NEXT_LABEL: Record<Period, string | null> = {
  CLASS_SETUP: "Open Registration",
  REGISTRATION: "Start Class Running",
  RUNNING: "Begin Grading",
  GRADING: "Complete Semester",
  COMPLETED: null,
};

export default async function SemestersPage() {
  const session = await getSession();
  if (!session || session.role !== "REGISTRAR") redirect("/login");

  const semesters = await prisma.semester.findMany({
    orderBy: [{ year: "desc" }, { startDate: "desc" }],
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 font-sans text-[#0f172a]">
      {/* Nav */}
      <nav className="sticky top-0 z-10 bg-[#0f172a] text-white shadow-xl border-b border-white/5">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-5">
          <Link
            href="/registrar/dashboard"
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
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-[#0f172a] to-[#3b1225] p-8 text-white shadow-xl">
          <div className="flex items-center gap-3">
            <Calendar size={28} className="text-red-300" />
            <h2 className="text-3xl font-black tracking-tight">
              Semester Management
            </h2>
          </div>
          <p className="mt-2 text-sm text-red-200 font-medium">
            Advance semester periods and create future semesters.
          </p>
        </div>

        <h3 className="mb-4 text-lg font-black uppercase tracking-wide text-slate-700">
          All Semesters ({semesters.length})
        </h3>

        <div className="mb-10 space-y-4">
          {semesters.map((s) => {
            const period = s.period as Period;
            const isValidPeriod = (PERIODS as readonly string[]).includes(
              period,
            );
            const nextLabel = isValidPeriod ? NEXT_LABEL[period] : null;
            const colorClass = isValidPeriod
              ? PERIOD_COLOR[period]
              : "bg-slate-100 text-slate-700 border-slate-300";
            const periodLabel = isValidPeriod
              ? PERIOD_LABEL[period]
              : s.period;

            return (
              <div
                key={s.id}
                className={`rounded-2xl border p-6 shadow-md ${
                  s.isCurrent
                    ? "border-blue-400 bg-white ring-2 ring-blue-200"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h4 className="text-xl font-black text-[#0f172a]">
                        {s.name}
                      </h4>
                      {s.isCurrent && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-white">
                          <CheckCircle2 size={10} /> Current
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest ${colorClass}`}
                      >
                        <Clock size={10} /> {periodLabel}
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-medium text-slate-500">
                      {s.term} · {s.year} ·{" "}
                      {s.startDate.toISOString().slice(0, 10)} →{" "}
                      {s.endDate.toISOString().slice(0, 10)} · Quota{" "}
                      {s.programQuota}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-start gap-3">
                    {nextLabel && (
                      <SemesterActionButton
                        semesterId={s.id}
                        label={nextLabel}
                        action={advancePeriod}
                      />
                    )}
                    {!s.isCurrent && period !== "COMPLETED" && (
                      <SemesterActionButton
                        semesterId={s.id}
                        label="Set as Current"
                        variant="secondary"
                        action={setCurrentSemester}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {semesters.length === 0 && (
            <div className="rounded-2xl bg-white border border-dashed border-slate-300 p-10 text-center">
              <p className="text-sm font-bold text-slate-500">
                No semesters yet. Create one below.
              </p>
            </div>
          )}
        </div>

        <CreateSemesterForm />
      </main>
    </div>
  );
}
