import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  AlertTriangle,
  Users,
} from "lucide-react";
import { getSession } from "@/src/lib/session";
import { prisma } from "@/src/lib/db";
import LogoutButton from "@/src/components/LogoutButton";
import CourseRow from "./CourseRow";

export default async function RegisterPage() {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") redirect("/login");

  // Three queries in parallel: current semester, available courses (with
  // headcount), the student's own enrollment + waitlist state.
  const [currentSemester, courses, user] = await Promise.all([
    prisma.semester.findFirst({
      where: { isCurrent: true },
      select: { id: true, name: true, period: true },
    }),
    prisma.course.findMany({
      where: { semester: { isCurrent: true }, cancelled: false },
      include: {
        instructor: { select: { firstName: true, lastName: true } },
        _count: { select: { enrollments: true } },
      },
      orderBy: { code: "asc" },
    }),
    prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        suspended: true,
        terminated: true,
        fineOwed: true,
        enrollments: {
          where: { course: { semester: { isCurrent: true } } },
          select: { id: true, courseId: true },
        },
        waitlists: {
          where: { course: { semester: { isCurrent: true } } },
          select: { id: true, courseId: true, position: true, status: true },
        },
      },
    }),
  ]);

  if (!user) redirect("/login");

  const enrolledMap = new Map(user.enrollments.map((e) => [e.courseId, e.id]));
  const waitlistMap = new Map(
    user.waitlists
      .filter((w) => w.status === "WAITING")
      .map((w) => [w.courseId, { id: w.id, position: w.position }]),
  );
  const enrolledCount = user.enrollments.length;
  const registrationOpen = currentSemester?.period === "REGISTRATION";
  const blocked = user.suspended || user.terminated;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 font-sans text-[#0f172a]">
      <nav className="sticky top-0 z-10 bg-[#0f172a] text-white shadow-xl border-b border-white/5">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-5">
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

      <main className="mx-auto max-w-7xl px-8 py-10">
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-[#0f172a] to-[#1e3a8a] p-8 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <BookOpen size={28} className="text-blue-300" />
                <h2 className="text-3xl font-black tracking-tight">
                  Course Registration
                </h2>
              </div>
              <p className="mt-2 text-sm text-blue-200 font-medium">
                {currentSemester
                  ? `${currentSemester.name} — ${currentSemester.period.replace("_", " ")}`
                  : "No active semester"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black">{enrolledCount} / 4</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-300">
                Registered
              </p>
            </div>
          </div>
        </div>

        {!registrationOpen && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-xs font-bold text-amber-800">
            <AlertTriangle size={14} />
            Registration is closed for this semester. You can view courses but
            cannot register.
          </div>
        )}

        {blocked && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 border border-red-300 px-4 py-3 text-xs font-bold text-red-800">
            <AlertTriangle size={14} />
            {user.terminated
              ? "Your account is terminated."
              : `Your account is suspended${user.fineOwed > 0 ? ` and owes $${user.fineOwed.toFixed(2)}` : ""}.`}
          </div>
        )}

        {registrationOpen && enrolledCount < 2 && !blocked && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-xs font-bold text-blue-800">
            <AlertTriangle size={14} />
            You must register for at least 2 courses to remain in good standing.
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
                <th className="px-4 py-3 text-center">Seats</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {courses.map((c) => {
                const enrolled = enrolledMap.get(c.id);
                const waitlisted = waitlistMap.get(c.id);
                const full = c._count.enrollments >= c.maxStudents;

                let status: Parameters<typeof CourseRow>[0]["status"];
                if (enrolled !== undefined) {
                  status = { kind: "enrolled", enrollmentId: enrolled };
                } else if (waitlisted) {
                  status = {
                    kind: "waitlisted",
                    waitlistId: waitlisted.id,
                    position: waitlisted.position,
                  };
                } else if (blocked) {
                  status = { kind: "disabled", reason: "Account blocked" };
                } else if (enrolledCount >= 4) {
                  status = { kind: "disabled", reason: "Max 4 reached" };
                } else if (full) {
                  status = { kind: "full" };
                } else {
                  status = { kind: "available" };
                }

                return (
                  <tr key={c.id}>
                    <td className="px-4 py-3 font-black text-[#0f172a]">
                      {c.code}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">
                      {c.name}
                      <p className="text-[10px] text-slate-400 font-normal">
                        {c.credits} cr
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-600">
                      {c.instructor
                        ? `${c.instructor.firstName} ${c.instructor.lastName}`
                        : "TBA"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {c.schedule}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-bold ${
                          full ? "text-amber-600" : "text-slate-700"
                        }`}
                      >
                        <Users size={12} />
                        {c._count.enrollments}/{c.maxStudents}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <CourseRow
                          courseId={c.id}
                          status={status}
                          registrationOpen={!!registrationOpen && !blocked}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {courses.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm font-bold text-slate-400"
                  >
                    No courses available this semester.
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
