import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, GraduationCap, Calculator } from "lucide-react";
import { getSession } from "@/src/lib/session";
import { prisma } from "@/src/lib/db";
import LogoutButton from "@/src/components/LogoutButton";

export const metadata = { title: "Grades & Transcript" };

const GRADE_POINTS: Record<string, number> = { A: 4, B: 3, C: 2, D: 1, F: 0 };
const PASSING = ["A", "B", "C", "D"];

const GRADE_BADGE: Record<string, string> = {
  A: "bg-emerald-100 text-emerald-700 border-emerald-300",
  B: "bg-blue-100 text-blue-700 border-blue-300",
  C: "bg-amber-100 text-amber-700 border-amber-300",
  D: "bg-orange-100 text-orange-700 border-orange-300",
  F: "bg-red-100 text-red-700 border-red-300",
};

export default async function GradesTranscriptPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "STUDENT") redirect("/dashboard");

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: session.userId },
    include: {
      course: {
        select: {
          code: true,
          name: true,
          credits: true,
          schedule: true,
          cancelled: true,
          instructor: { select: { firstName: true, lastName: true } },
          semester: { select: { id: true, name: true, year: true, term: true, period: true } },
        },
      },
    },
    orderBy: [{ course: { semester: { year: "desc" } } }, { course: { code: "asc" } }],
  });

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { firstName: true, lastName: true, gpa: true, warnings: true, fineOwed: true },
  });

  const bySemester = new Map<number, { name: string; year: number; term: string; period: string; rows: typeof enrollments }>();
  for (const e of enrollments) {
    const sid = e.course.semester.id;
    if (!bySemester.has(sid)) {
      bySemester.set(sid, {
        name: e.course.semester.name,
        year: e.course.semester.year,
        term: e.course.semester.term,
        period: e.course.semester.period,
        rows: [],
      });
    }
    bySemester.get(sid)!.rows.push(e);
  }

  const completed = enrollments.filter((e) => e.grade);
  const passing = enrollments.filter((e) => e.grade && PASSING.includes(e.grade)).length;
  const totalPoints = completed.reduce((s, e) => s + (GRADE_POINTS[e.grade!] ?? 0), 0);
  const cumulativeGpa = completed.length > 0 ? totalPoints / completed.length : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 font-sans text-[#0f172a]">
      <nav className="sticky top-0 z-10 bg-[#0f172a] text-white shadow-xl border-b border-white/5">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-8 py-5">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-white">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-6">
            <span className="text-sm font-bold text-slate-300">{session.firstName} {session.lastName}</span>
            <LogoutButton />
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-8 py-10 space-y-6">
        <div className="rounded-2xl bg-gradient-to-r from-[#0f172a] to-[#1e3a8a] p-8 text-white shadow-xl">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3">
                <GraduationCap size={28} className="text-blue-300" />
                <h2 className="text-3xl font-black tracking-tight">Grades & Transcript</h2>
              </div>
              <p className="mt-2 text-sm text-blue-200 font-medium">
                Official record of your academic performance.
              </p>
            </div>
            <Link
              href="/student/what-if"
              className="flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 px-5 py-3 text-xs font-black uppercase tracking-widest text-white transition-all hover:-translate-y-0.5 shadow-lg"
            >
              <Calculator size={16} />
              Try What-If Calculator
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <Stat label="Cumulative GPA" value={cumulativeGpa.toFixed(2)} />
          <Stat label="Passing Courses" value={`${passing} / 8`} />
          <Stat label="Active Warnings" value={String(user?.warnings ?? 0)} />
          <Stat label="Outstanding Fine" value={`$${(user?.fineOwed ?? 0).toFixed(2)}`} />
        </div>

        {bySemester.size === 0 ? (
          <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center">
            <p className="text-sm font-medium text-slate-500">No enrollments on record yet.</p>
          </div>
        ) : (
          [...bySemester.entries()].map(([sid, sem]) => {
            const semCompleted = sem.rows.filter((e) => e.grade);
            const semPoints = semCompleted.reduce((s, e) => s + (GRADE_POINTS[e.grade!] ?? 0), 0);
            const semGpa = semCompleted.length > 0 ? semPoints / semCompleted.length : null;

            return (
              <div key={sid} className="rounded-2xl bg-white border border-slate-200 shadow-md overflow-hidden">
                <div className="flex items-center justify-between bg-slate-50 px-6 py-4 border-b border-slate-200">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">{sem.period}</p>
                    <h3 className="text-lg font-black text-[#0f172a]">{sem.name}</h3>
                  </div>
                  {semGpa !== null && (
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Semester GPA</p>
                      <p className="text-2xl font-black text-blue-700">{semGpa.toFixed(2)}</p>
                    </div>
                  )}
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                      <th className="px-6 py-3">Course</th>
                      <th className="px-6 py-3">Instructor</th>
                      <th className="px-6 py-3">Schedule</th>
                      <th className="px-6 py-3">Credits</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sem.rows.map((e) => (
                      <tr key={e.id} className="border-b border-slate-100 last:border-0">
                        <td className="px-6 py-4">
                          <p className="font-black text-[#0f172a]">{e.course.code}</p>
                          <p className="text-xs text-slate-500">{e.course.name}</p>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {e.course.instructor ? `Prof. ${e.course.instructor.lastName}` : "TBA"}
                        </td>
                        <td className="px-6 py-4 text-slate-600 text-xs font-medium">{e.course.schedule}</td>
                        <td className="px-6 py-4 text-slate-600">{e.course.credits}</td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                            {e.course.cancelled ? "Cancelled" : e.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {e.grade ? (
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border font-black text-sm ${GRADE_BADGE[e.grade] ?? "bg-slate-100 text-slate-500"}`}>
                              {e.grade}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">In progress</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })
        )}
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-black text-[#0f172a]">{value}</p>
    </div>
  );
}
