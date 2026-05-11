import { redirect } from "next/navigation";
import { getSession } from "@/src/lib/session";
import { prisma } from "@/src/lib/db";
import Link from "next/link";
import LogoutButton from "@/src/components/LogoutButton";
import {
  GraduationCap,
  BookOpen,
  AlertTriangle,
  Star,
  DollarSign,
  User,
  ClipboardList,
  MessageSquare,
  Award,
  Calendar,
  Compass,
} from "lucide-react";

export default async function StudentDashboard() {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      enrollments: {
        include: {
          course: {
            include: { instructor: true, semester: true },
          },
        },
      },
      warningsReceived: { where: { removed: false } },
      honorRollEntries: true,
    },
  });

  if (!user) redirect("/login");

  const currentSemester = await prisma.semester.findFirst({
    where: { isCurrent: true },
  });

  const currentEnrollments = user.enrollments.filter(
    (e) => e.course.semester.isCurrent
  );
  const pastEnrollments = user.enrollments.filter(
    (e) => !e.course.semester.isCurrent
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 font-sans text-[#0f172a]">
      {/* Nav */}
      <nav className="sticky top-0 z-10 bg-[#0f172a] text-white shadow-xl border-b border-white/5">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-800">
              <GraduationCap size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight uppercase">
                Cuny<span className="text-blue-400">Zero</span>Lite
              </h1>
              <p className="text-[9px] uppercase tracking-[0.3em] text-blue-300 font-bold opacity-80">
                Student Portal
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-sm font-bold text-slate-300">
              {user.firstName} {user.lastName}
            </span>
            <LogoutButton />
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-8 py-10">
        {/* Welcome Banner */}
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-[#0f172a] to-[#1e3a5f] p-8 text-white shadow-xl">
          <h2 className="text-3xl font-black tracking-tight">
            Welcome, {user.firstName}
          </h2>
          <p className="mt-2 text-sm text-blue-200 font-medium">
            {currentSemester
              ? `${currentSemester.name} — ${currentSemester.period.replace("_", " ")}`
              : "No active semester"}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-2xl bg-white p-6 shadow-md border border-slate-200">
            <div className="flex items-center gap-3 mb-3">
              <Star size={20} className="text-blue-600" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                GPA
              </span>
            </div>
            <p className="text-3xl font-black text-[#0f172a]">
              {user.gpa.toFixed(2)}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-md border border-slate-200">
            <div className="flex items-center gap-3 mb-3">
              <BookOpen size={20} className="text-blue-600" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Courses
              </span>
            </div>
            <p className="text-3xl font-black text-[#0f172a]">
              {currentEnrollments.length}
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

          <div className="rounded-2xl bg-white p-6 shadow-md border border-slate-200">
            <div className="flex items-center gap-3 mb-3">
              <DollarSign
                size={20}
                className={
                  user.fineOwed > 0 ? "text-red-500" : "text-green-500"
                }
              />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Balance
              </span>
            </div>
            <p className="text-3xl font-black text-[#0f172a]">
              ${user.fineOwed.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Honor Roll Badge */}
        {user.honorRollEntries.length > 0 && (
          <div className="mb-8 flex items-center gap-3 rounded-2xl bg-amber-50 border border-amber-200 p-5">
            <Award size={24} className="text-amber-600" />
            <div>
              <p className="font-black text-amber-800 uppercase text-sm tracking-wide">
                Honor Roll Student
              </p>
              <p className="text-xs text-amber-600 font-medium">
                {user.honorRollEntries.length} honor(s) earned
              </p>
            </div>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* Current Courses */}
          <div>
            <h3 className="mb-4 text-lg font-black uppercase tracking-wide text-slate-700">
              Current Courses
            </h3>
            {currentEnrollments.length === 0 ? (
              <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center shadow-md">
                <BookOpen size={40} className="mx-auto text-slate-300 mb-3" />
                <p className="text-sm font-bold text-slate-400">
                  No courses enrolled this semester
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {currentEnrollments.map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="rounded-2xl bg-white border border-slate-200 p-6 shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-blue-600">
                          {enrollment.course.code}
                        </p>
                        <p className="mt-1 text-lg font-bold text-[#0f172a]">
                          {enrollment.course.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-400 font-medium">
                          {enrollment.course.schedule} &middot;{" "}
                          {enrollment.course.credits} credits
                          {enrollment.course.instructor &&
                            ` · Prof. ${enrollment.course.instructor.lastName}`}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                          enrollment.status === "ENROLLED"
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-slate-100 text-slate-500 border border-slate-200"
                        }`}
                      >
                        {enrollment.status}
                      </span>
                    </div>
                    {enrollment.grade && (
                      <p className="mt-3 text-sm font-bold">
                        Grade:{" "}
                        <span className="text-blue-600">
                          {enrollment.grade}
                        </span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Past Courses */}
            {pastEnrollments.length > 0 && (
              <>
                <h3 className="mb-4 mt-10 text-lg font-black uppercase tracking-wide text-slate-700">
                  Past Courses
                </h3>
                <div className="space-y-3">
                  {pastEnrollments.map((enrollment) => (
                    <div
                      key={enrollment.id}
                      className="rounded-2xl bg-white/70 border border-slate-200 p-5 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                            {enrollment.course.code}
                          </span>
                          <span className="ml-3 text-sm font-bold text-[#0f172a]">
                            {enrollment.course.name}
                          </span>
                          <span className="ml-2 text-xs text-slate-400">
                            ({enrollment.course.semester.name})
                          </span>
                        </div>
                        <span className="text-sm font-black text-blue-600">
                          {enrollment.grade || "—"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Links */}
            <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-md">
              <h4 className="mb-4 text-xs font-black uppercase tracking-widest text-slate-400">
                Quick Actions
              </h4>
              <div className="space-y-2">
                <Link
                  href="/student/register"
                  className="flex items-center gap-3 rounded-xl p-3 text-sm font-bold text-[#0f172a] hover:bg-slate-50 transition-colors"
                >
                  <ClipboardList size={18} className="text-blue-600" />
                  Course Registration
                </Link>
                <Link
                  href="/student/reviews"
                  className="flex items-center gap-3 rounded-xl p-3 text-sm font-bold text-[#0f172a] hover:bg-slate-50 transition-colors"
                >
                  <MessageSquare size={18} className="text-blue-600" />
                  Write Reviews
                </Link>
                <Link
                  href="/student/calendar"
                  className="flex items-center gap-3 rounded-xl p-3 text-sm font-bold text-[#0f172a] hover:bg-slate-50 transition-colors"
                >
                  <Calendar size={18} className="text-blue-600" />
                  Weekly Schedule
                </Link>
                <Link
                  href="/complaints/new"
                  className="flex items-center gap-3 rounded-xl p-3 text-sm font-bold text-[#0f172a] hover:bg-slate-50 transition-colors"
                >
                  <AlertTriangle size={18} className="text-blue-600" />
                  File Complaint
                </Link>
                <Link
                  href="/student/graduation"
                  className="flex items-center gap-3 rounded-xl p-3 text-sm font-bold text-[#0f172a] hover:bg-slate-50 transition-colors"
                >
                  <GraduationCap size={18} className="text-blue-600" />
                  Apply for Graduation
                </Link>
                <Link
                  href="/student/tutorial"
                  className="flex items-center gap-3 rounded-xl p-3 text-sm font-bold text-[#0f172a] hover:bg-slate-50 transition-colors"
                >
                  <Compass size={18} className="text-blue-600" />
                  Tutorial
                </Link>
              </div>
            </div>

            {/* Warnings */}
            {user.warningsReceived.length > 0 && (
              <div className="rounded-2xl bg-red-50 border border-red-200 p-6 shadow-md">
                <h4 className="mb-3 text-xs font-black uppercase tracking-widest text-red-500">
                  Active Warnings
                </h4>
                <div className="space-y-2">
                  {user.warningsReceived.map((w) => (
                    <div
                      key={w.id}
                      className="rounded-xl bg-white p-3 border border-red-100"
                    >
                      <p className="text-xs font-bold text-red-700">
                        {w.reason}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Profile Card */}
            <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-md">
              <h4 className="mb-4 text-xs font-black uppercase tracking-widest text-slate-400">
                Profile
              </h4>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <User size={24} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-bold text-[#0f172a]">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-slate-400 font-medium">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
