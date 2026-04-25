import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { getSession } from "@/src/lib/session";
import { prisma } from "@/src/lib/db";
import LogoutButton from "@/src/components/LogoutButton";
import CourseForm from "../CourseForm";
import { createCourse } from "../actions";

export default async function NewCoursePage() {
  const session = await getSession();
  if (!session || session.role !== "REGISTRAR") redirect("/login");

  const [semesters, instructors] = await Promise.all([
    prisma.semester.findMany({
      where: { period: { not: "COMPLETED" } },
      orderBy: [{ year: "desc" }, { startDate: "desc" }],
    }),
    prisma.user.findMany({
      where: { role: "INSTRUCTOR", suspended: false, fired: false },
      orderBy: { lastName: "asc" },
    }),
  ]);

  const currentSemester = semesters.find((s) => s.isCurrent);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 font-sans text-[#0f172a]">
      <nav className="sticky top-0 z-10 bg-[#0f172a] text-white shadow-xl border-b border-white/5">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-5">
          <Link
            href="/registrar/courses"
            className="flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-white"
          >
            <ArrowLeft size={16} /> Back to Courses
          </Link>
          <div className="flex items-center gap-6">
            <span className="text-sm font-bold text-slate-300">
              {session.firstName} {session.lastName}
            </span>
            <LogoutButton />
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-8 py-10">
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-[#0f172a] to-[#3b1225] p-8 text-white shadow-xl">
          <div className="flex items-center gap-3">
            <BookOpen size={28} className="text-red-300" />
            <h2 className="text-3xl font-black tracking-tight">New Course</h2>
          </div>
        </div>

        <CourseForm
          action={createCourse}
          semesters={semesters}
          instructors={instructors}
          initial={{ semesterId: currentSemester?.id }}
          submitLabel="Create Course"
        />
      </main>
    </div>
  );
}
