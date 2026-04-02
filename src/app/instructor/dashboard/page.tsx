import { redirect } from "next/navigation";
import { getSession } from "@/src/lib/session";
import { prisma } from "@/src/lib/db";
import Link from "next/link";
import LogoutButton from "@/src/components/LogoutButton";
import {
  GraduationCap,
  BookOpen,
  Users,
  AlertTriangle,
  Star,
  ClipboardList,
  User,
} from "lucide-react";

export default async function InstructorDashboard() {
  const session = await getSession();
  if (!session || session.role !== "INSTRUCTOR") redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      warningsReceived: { where: { removed: false } },
    },
  });

  if (!user) redirect("/login");

  const currentSemester = await prisma.semester.findFirst({
    where: { isCurrent: true },
  });

  const courses = await prisma.course.findMany({
    where: {
      instructorId: user.id,
      semester: { isCurrent: true },
    },
    include: {
      enrollments: {
        include: { user: true },
      },
      reviews: true,
      semester: true,
    },
  });

  const totalStudents = courses.reduce(
    (sum, c) => sum + c.enrollments.length,
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 font-sans text-[#0f172a]">
      {/* Nav */}
      <nav className="sticky top-0 z-10 bg-[#0f172a] text-white shadow-xl border-b border-white/5">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800">
              <BookOpen size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight uppercase">
                Cuny<span className="text-emerald-400">Zero</span>Lite
              </h1>
              <p className="text-[9px] uppercase tracking-[0.3em] text-emerald-300 font-bold opacity-80">
                Instructor Portal
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-sm font-bold text-slate-300">
              Prof. {user.lastName}
            </span>
            <LogoutButton />
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-8 py-10">
        {/* Welcome */}
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-[#0f172a] to-[#0f3025] p-8 text-white shadow-xl">
          <h2 className="text-3xl font-black tracking-tight">
            Welcome, Prof. {user.lastName}
          </h2>
          <p className="mt-2 text-sm text-emerald-200 font-medium">
            {currentSemester
              ? `${currentSemester.name} — ${currentSemester.period.replace("_", " ")}`
              : "No active semester"}
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-md border border-slate-200">
            <div className="flex items-center gap-3 mb-3">
              <BookOpen size={20} className="text-emerald-600" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                My Courses
              </span>
            </div>
            <p className="text-3xl font-black text-[#0f172a]">
              {courses.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-md border border-slate-200">
            <div className="flex items-center gap-3 mb-3">
              <Users size={20} className="text-blue-600" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Total Students
              </span>
            </div>
            <p className="text-3xl font-black text-[#0f172a]">
              {totalStudents}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-md border border-slate-200">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle
                size={20}
                className={
                  user.warningsReceived.length > 0
                    ? "text-red-500"
                    : "text-green-500"
                }
              />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Warnings
              </span>
            </div>
            <p className="text-3xl font-black text-[#0f172a]">
              {user.warningsReceived.length}
            </p>
          </div>
        </div>

        {/* Courses with Students */}
        <h3 className="mb-4 text-lg font-black uppercase tracking-wide text-slate-700">
          My Courses
        </h3>

        {courses.length === 0 ? (
          <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center shadow-md">
            <BookOpen size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-bold text-slate-400">
              No courses assigned this semester
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {courses.map((course) => {
              const avgRating =
                course.reviews.length > 0
                  ? course.reviews.reduce((s, r) => s + r.rating, 0) /
                    course.reviews.length
                  : null;

              return (
                <div
                  key={course.id}
                  className="rounded-2xl bg-white border border-slate-200 shadow-md overflow-hidden"
                >
                  {/* Course Header */}
                  <div className="bg-gradient-to-r from-[#0f172a] to-[#1e3a5f] p-6 text-white">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-emerald-300">
                          {course.code}
                        </p>
                        <p className="mt-1 text-xl font-bold">{course.name}</p>
                        <p className="mt-1 text-xs text-slate-300">
                          {course.schedule} &middot; {course.credits} credits
                          &middot; Max {course.maxStudents} students
                        </p>
                      </div>
                      <div className="text-right">
                        {avgRating !== null && (
                          <div className="flex items-center gap-1">
                            <Star size={14} className="text-yellow-400" />
                            <span className="text-sm font-bold">
                              {avgRating.toFixed(1)}
                            </span>
                          </div>
                        )}
                        <span
                          className={`mt-1 inline-block rounded-full px-3 py-1 text-[10px] font-black uppercase ${
                            course.cancelled
                              ? "bg-red-500/20 text-red-300"
                              : "bg-emerald-500/20 text-emerald-300"
                          }`}
                        >
                          {course.cancelled ? "Cancelled" : "Active"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Student List */}
                  <div className="p-6">
                    <p className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">
                      Enrolled Students ({course.enrollments.length})
                    </p>
                    {course.enrollments.length === 0 ? (
                      <p className="text-sm text-slate-400">
                        No students enrolled
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {course.enrollments.map((e) => (
                          <div
                            key={e.id}
                            className="flex items-center justify-between rounded-xl bg-slate-50 p-3"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                                <User size={14} className="text-blue-600" />
                              </div>
                              <div>
                                <p className="text-sm font-bold">
                                  {e.user.firstName} {e.user.lastName}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  GPA: {e.user.gpa.toFixed(2)} &middot;{" "}
                                  {e.user.email}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                                  e.grade
                                    ? "bg-blue-50 text-blue-600"
                                    : "bg-slate-100 text-slate-400"
                                }`}
                              >
                                {e.grade || "No grade"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Warnings */}
        {user.warningsReceived.length > 0 && (
          <div className="mt-8 rounded-2xl bg-red-50 border border-red-200 p-6">
            <h4 className="mb-3 text-xs font-black uppercase tracking-widest text-red-500">
              Active Warnings
            </h4>
            <div className="space-y-2">
              {user.warningsReceived.map((w) => (
                <div
                  key={w.id}
                  className="rounded-xl bg-white p-3 border border-red-100"
                >
                  <p className="text-xs font-bold text-red-700">{w.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
