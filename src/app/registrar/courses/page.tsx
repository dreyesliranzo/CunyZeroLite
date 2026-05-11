import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Plus, Users, AlertCircle } from "lucide-react";
import { getSession } from "@/src/lib/session";
import { prisma } from "@/src/lib/db";
import LogoutButton from "@/src/components/LogoutButton";
import CourseRowActions from "./CourseRowActions";
import { cancelCourse, uncancelCourse } from "./actions";

type SearchParams = Promise<{ semester?: string }>;

export default async function CoursesPage(props: {
  searchParams: SearchParams;
}) {
  const session = await getSession();
  if (!session || session.role !== "REGISTRAR") redirect("/login");

  const { semester: semesterParam } = await props.searchParams;

  const semesters = await prisma.semester.findMany({
    orderBy: [{ year: "desc" }, { startDate: "desc" }],
  });

  const currentSemester = semesters.find((s) => s.isCurrent) ?? semesters[0];
  const selectedSemesterId = semesterParam
    ? Number(semesterParam)
    : currentSemester?.id;

  const selectedSemester = selectedSemesterId
    ? semesters.find((s) => s.id === selectedSemesterId)
    : null;

  const courses = selectedSemesterId
    ? await prisma.course.findMany({
        where: { semesterId: selectedSemesterId },
        include: {
          instructor: true,
          _count: { select: { enrollments: true } },
        },
        orderBy: { code: "asc" },
      })
    : [];

  const isSetupPeriod = selectedSemester?.period === "CLASS_SETUP";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 font-sans text-[#0f172a]">
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

      <main className="mx-auto max-w-7xl px-8 py-10">
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-[#0f172a] to-[#3b1225] p-8 text-white shadow-xl">
          <div className="flex items-center gap-3">
            <BookOpen size={28} className="text-red-300" />
            <h2 className="text-3xl font-black tracking-tight">
              Course Management
            </h2>
          </div>
          <p className="mt-2 text-sm text-red-200 font-medium">
            Create courses, assign instructors, set schedules and class size.
          </p>
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <form className="flex items-center gap-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Semester
            </label>
            <select
              name="semester"
              defaultValue={String(selectedSemesterId ?? "")}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900 focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20"
            >
              {semesters.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.isCurrent ? "(current)" : ""}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50"
            >
              Apply
            </button>
          </form>

          <Link
            href="/registrar/courses/new"
            className="flex items-center gap-2 rounded-xl bg-[#0f172a] px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-md hover:bg-[#1e293b]"
          >
            <Plus size={14} /> New Course
          </Link>
        </div>

        {selectedSemester && !isSetupPeriod && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-xs font-bold text-amber-800">
            <AlertCircle size={14} />
            This semester is in{" "}
            <span className="font-black">
              {selectedSemester.period.replace("_", " ")}
            </span>
            . Course set-up is normally only allowed during the Class Set-up
            period.
          </div>
        )}

        <div className="overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-md">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Code</th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Instructor</th>
                <th className="px-4 py-3 text-left">Schedule</th>
                <th className="px-4 py-3 text-center">Enrolled</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {courses.map((c) => (
                <tr key={c.id} className={c.cancelled ? "opacity-60" : ""}>
                  <td className="px-4 py-3 font-black text-[#0f172a]">
                    {c.code}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-700">
                    {c.name}
                    <p className="text-[10px] text-slate-400 font-normal">
                      {c.credits} credit{c.credits !== 1 ? "s" : ""}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-xs font-medium text-slate-600">
                    {c.instructor
                      ? `${c.instructor.firstName} ${c.instructor.lastName}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {c.schedule}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700">
                      <Users size={12} />
                      {c._count.enrollments}/{c.maxStudents}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {c.cancelled ? (
                      <span className="inline-flex rounded-full bg-red-100 border border-red-300 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-red-700">
                        Cancelled
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-emerald-700">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/registrar/courses/${c.id}/edit`}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50"
                      >
                        Edit
                      </Link>
                      {c.cancelled ? (
                        <CourseRowActions
                          courseId={c.id}
                          label="Reinstate"
                          variant="secondary"
                          action={uncancelCourse}
                        />
                      ) : (
                        <CourseRowActions
                          courseId={c.id}
                          label="Cancel"
                          variant="danger"
                          action={cancelCourse}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {courses.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-sm font-bold text-slate-400"
                  >
                    No courses in this semester yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
