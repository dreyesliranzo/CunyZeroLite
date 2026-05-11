import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ClipboardList, AlertCircle } from "lucide-react";
import { getSession } from "@/src/lib/session";
import { prisma } from "@/src/lib/db";
import LogoutButton from "@/src/components/LogoutButton";

export default async function GradesIndexPage() {
  const session = await getSession();
  if (!session || session.role !== "INSTRUCTOR") redirect("/login");

  const courses = await prisma.course.findMany({
    where: {
      instructorId: session.userId,
      cancelled: false,
      semester: { isCurrent: true },
    },
    include: {
      semester: true,
      enrollments: { select: { id: true, grade: true } },
    },
    orderBy: { code: "asc" },
  });

  const period = courses[0]?.semester.period ?? null;
  const isGrading = period === "GRADING";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 font-sans text-[#0f172a]">
      <nav className="sticky top-0 z-10 bg-[#0f172a] text-white shadow-xl border-b border-white/5">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-5">
          <Link
            href="/instructor/dashboard"
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

      <main className="mx-auto max-w-7xl px-8 py-10">
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-[#0f172a] to-[#0f3025] p-8 text-white shadow-xl">
          <div className="flex items-center gap-3">
            <ClipboardList size={28} className="text-emerald-300" />
            <h2 className="text-3xl font-black tracking-tight">
              Grade Submission
            </h2>
          </div>
          <p className="mt-2 text-sm text-emerald-200 font-medium">
            Assign final letter grades to enrolled students.
          </p>
        </div>

        {!isGrading && period && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-xs font-bold text-amber-800">
            <AlertCircle size={14} />
            Grading is only allowed during the GRADING period (current:{" "}
            {period.replace("_", " ")}).
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {courses.map((c) => {
            const total = c.enrollments.length;
            const graded = c.enrollments.filter((e) => e.grade).length;
            const complete = total > 0 && graded === total;
            return (
              <Link
                key={c.id}
                href={`/instructor/grades/${c.id}`}
                className="rounded-2xl bg-white border border-slate-200 p-6 shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-emerald-600">
                      {c.code}
                    </p>
                    <p className="mt-1 text-lg font-black text-[#0f172a]">
                      {c.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 font-medium">
                      {c.schedule}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-[#0f172a]">
                      {graded}/{total}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Graded
                    </p>
                    {complete && (
                      <span className="mt-1 inline-block rounded-full bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-emerald-700">
                        Complete
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
          {courses.length === 0 && (
            <div className="md:col-span-2 rounded-2xl bg-white border border-slate-200 p-10 text-center shadow-md">
              <p className="text-sm font-bold text-slate-400">
                No courses to grade this semester.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
