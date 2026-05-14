import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, GraduationCap, Calculator } from "lucide-react";
import { getSession } from "@/src/lib/session";
import { prisma } from "@/src/lib/db";
import LogoutButton from "@/src/components/LogoutButton";
import WhatIfClient from "./WhatIfClient";

export const metadata = { title: "What-If GPA Calculator" };

export default async function WhatIfPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "STUDENT") redirect("/dashboard");

  
  const enrollments = await prisma.enrollment.findMany({
    where: { userId: session.userId },
    include: {
      course: {
        select: {
          id: true,
          code: true,
          name: true,
          credits: true,
          semester: {
            select: { id: true, name: true, isCurrent: true },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });


  const completed = enrollments.filter(
    (e) => e.grade && ["A", "B", "C", "D", "F"].includes(e.grade)
  );

 
  const current = enrollments.filter(
    (e) => e.course.semester.isCurrent && !e.grade
  );

  const completedSemesterIds = new Set(
    completed.map((e) => e.course.semester.id)
  );
  const completedSemesterCount = completedSemesterIds.size;


  const historicalCourses = completed.map((e) => ({
    id: e.id,
    code: e.course.code,
    name: e.course.name,
    grade: e.grade as "A" | "B" | "C" | "D" | "F",
    semesterName: e.course.semester.name,
  }));

  const currentCourses = current.map((e) => ({
    id: e.id,
    code: e.course.code,
    name: e.course.name,
    credits: e.course.credits,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 font-sans text-[#0f172a]">
      {/* Nav */}
      <nav className="sticky top-0 z-10 bg-[#0f172a] text-white shadow-xl border-b border-white/5">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-8 py-5">
          <Link
            href="/student/dashboard"
            className="flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-white"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-800">
              <GraduationCap size={22} className="text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-black tracking-tight uppercase">
                Cuny<span className="text-blue-400">Zero</span>Lite
              </h1>
              <p className="text-[9px] uppercase tracking-[0.3em] text-blue-300 font-bold opacity-80">
                What-If Calculator
              </p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-8 py-10">
        {/* Header */}
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-[#0f172a] to-[#1e3a5f] p-8 text-white shadow-xl">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
              <Calculator size={28} />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight">
                What-If GPA Calculator
              </h2>
              <p className="mt-2 text-sm text-blue-200 font-medium max-w-2xl">
                Try out hypothetical grades for your current courses and see how
                your cumulative GPA would change — plus any honor-roll, warning,
                or termination thresholds you'd hit.
              </p>
            </div>
          </div>
        </div>

        <WhatIfClient
          historicalCourses={historicalCourses}
          currentCourses={currentCourses}
          completedSemesterCount={completedSemesterCount}
        />
      </main>
    </div>
  );
}
