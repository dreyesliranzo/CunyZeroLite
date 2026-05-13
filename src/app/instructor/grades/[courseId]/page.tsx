import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ClipboardList, AlertCircle } from "lucide-react";
import { getSession } from "@/src/lib/session";
import { prisma } from "@/src/lib/db";
import LogoutButton from "@/src/components/LogoutButton";
import GradeRow from "./GradeRow";

type Params = Promise<{ courseId: string }>;

export default async function CourseGradesPage(props: { params: Params }) {
  const session = await getSession();
  if (!session || session.role !== "INSTRUCTOR") redirect("/login");

  const { courseId: courseIdRaw } = await props.params;
  const courseId = Number(courseIdRaw);
  if (!Number.isFinite(courseId)) notFound();

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      semester: true,
      enrollments: {
        include: { user: true },
        orderBy: [{ user: { lastName: "asc" } }, { user: { firstName: "asc" } }],
      },
    },
  });
  if (!course) notFound();
  if (course.instructorId !== session.userId) {
    redirect("/instructor/dashboard");
  }

  const isGrading = course.semester.period === "GRADING";
  const graded = course.enrollments.filter((e) => e.grade).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 font-sans text-[#0f172a]">
      <nav className="sticky top-0 z-10 bg-[#0f172a] text-white shadow-xl border-b border-white/5">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-8 py-5">
          <Link
            href="/instructor/grades"
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

      <main className="mx-auto max-w-5xl px-8 py-10">
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-[#0f172a] to-[#0f3025] p-8 text-white shadow-xl">
          <div className="flex items-center gap-3">
            <ClipboardList size={24} className="text-emerald-300" />
            <p className="text-xs font-black uppercase tracking-widest text-emerald-300">
              {course.code} · {course.semester.name}
            </p>
          </div>
          <h2 className="mt-2 text-3xl font-black tracking-tight">
            {course.name}
          </h2>
          <p className="mt-1 text-sm text-emerald-200 font-medium">
            {graded}/{course.enrollments.length} graded · period:{" "}
            {course.semester.period.replace("_", " ")}
          </p>
        </div>

        {!isGrading && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-xs font-bold text-amber-800">
            <AlertCircle size={14} />
            Grade selection disabled. Semester must be in GRADING period.
          </div>
        )}

        <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-md">
          <p className="mb-4 text-xs font-black uppercase tracking-widest text-slate-400">
            Enrolled Students ({course.enrollments.length})
          </p>
          {course.enrollments.length === 0 ? (
            <p className="text-sm text-slate-400">No students enrolled.</p>
          ) : (
            <div className="space-y-2">
              {course.enrollments.map((e) => (
                <GradeRow
                  key={e.id}
                  courseId={course.id}
                  enrollmentId={e.id}
                  studentName={`${e.user.firstName} ${e.user.lastName}`}
                  studentEmail={e.user.email}
                  studentGpa={e.user.gpa}
                  initialGrade={e.grade}
                  disabled={!isGrading}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
