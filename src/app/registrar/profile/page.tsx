export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/src/lib/session";
import { prisma } from "@/src/lib/db";
import Link from "next/link";
import LogoutButton from "@/src/components/LogoutButton";
import {
  GraduationCap,
  Users,
  BookOpen,
  AlertTriangle,
  Clock,
  FileText,
  Settings,
  Shield,
  UserPlus,
} from "lucide-react";

export default async function RegistrarProfile() {
  const session = await getSession();
  if (!session || session.role !== "REGISTRAR") redirect("/login");

  const [
    totalStudents,
    totalInstructors,
    totalCourses,
    pendingApplications,
    pendingComplaints,
    pendingGraduations,
    currentSemester,
    activeWarnings,
    suspendedStudents,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({ where: { role: "INSTRUCTOR" } }),
    prisma.course.count({
      where: { semester: { isCurrent: true }, cancelled: false },
    }),
    prisma.application.count({ where: { status: "PENDING" } }),
    prisma.complaint.count({ where: { status: "PENDING" } }),
    prisma.graduationRequest.count({ where: { status: "PENDING" } }),
    prisma.semester.findFirst({ where: { isCurrent: true } }),
    prisma.warning.count({ where: { removed: false } }),
    prisma.user.count({ where: { suspended: true } }),
  ]);

  const topStudents = await prisma.user.findMany({
    where: { role: "STUDENT", terminated: false },
    orderBy: { gpa: "desc" },
    take: 5,
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 font-sans text-[#0f172a]">
      {/* Nav */}
      <nav className="sticky top-0 z-10 bg-[#0f172a] text-white shadow-xl border-b border-white/5">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-red-800">
              <Shield size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight uppercase">
                Cuny<span className="text-red-400">Zero</span>Lite
              </h1>
              <p className="text-[9px] uppercase tracking-[0.3em] text-red-300 font-bold opacity-80">
                Registrar Portal
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors">
              Dashboard
            </Link>
            <span className="text-sm font-bold text-slate-300">
              {session.firstName} {session.lastName}
            </span>
            <LogoutButton />
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-8 py-10">
        {/* Welcome */}
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-[#0f172a] to-[#3b1225] p-8 text-white shadow-xl">
          <h2 className="text-3xl font-black tracking-tight">
            Registrar Dashboard
          </h2>
          <p className="mt-2 text-sm text-red-200 font-medium">
            {currentSemester
              ? `${currentSemester.name} — ${currentSemester.period.replace("_", " ")}`
              : "No active semester"}
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard
            icon={<Users size={20} className="text-blue-600" />}
            label="Students"
            value={totalStudents}
          />
          <StatCard
            icon={<Users size={20} className="text-green-600" />}
            label="Instructors"
            value={totalInstructors}
          />
          <StatCard
            icon={<BookOpen size={20} className="text-purple-600" />}
            label="Active Courses"
            value={totalCourses}
          />
          <StatCard
            icon={<AlertTriangle size={20} className="text-red-600" />}
            label="Active Warnings"
            value={activeWarnings}
          />
        </div>

        {/* Pending Items */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <PendingCard
            icon={<UserPlus size={20} className="text-blue-600" />}
            label="Pending Applications"
            count={pendingApplications}
            href="/registrar/applications"
          />
          <PendingCard
            icon={<FileText size={20} className="text-orange-600" />}
            label="Pending Complaints"
            count={pendingComplaints}
            href="/registrar/complaints"
          />
          <PendingCard
            icon={<GraduationCap size={20} className="text-green-600" />}
            label="Graduation Requests"
            count={pendingGraduations}
            href="/registrar/graduations"
          />
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* Quick Actions */}
          <div>
            <h3 className="mb-4 text-lg font-black uppercase tracking-wide text-slate-700">
              Management
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <ActionCard
                icon={<Clock size={24} className="text-blue-600" />}
                title="Semester Management"
                desc="Manage semester periods and transitions"
                href="/registrar/semesters"
              />
              <ActionCard
                icon={<BookOpen size={24} className="text-purple-600" />}
                title="Course Management"
                desc="Create and manage courses"
                href="/registrar/courses"
              />
              <ActionCard
                icon={<Users size={24} className="text-green-600" />}
                title="Student Records"
                desc="View all student records and info"
                href="/registrar/students"
              />
              <ActionCard
                icon={<Settings size={24} className="text-slate-600" />}
                title="Taboo Words"
                desc="Manage the taboo word filter"
                href="/registrar/taboo-words"
              />
            </div>
          </div>

          {/* Top Students */}
          <div>
            <h3 className="mb-4 text-lg font-black uppercase tracking-wide text-slate-700">
              Top Students
            </h3>
            <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-md">
              <div className="space-y-3">
                {topStudents.map((s, i) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-xl p-3 hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-black text-blue-600">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-bold">
                          {s.firstName} {s.lastName}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {s.email}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-black text-blue-600">
                      {s.gpa.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {suspendedStudents > 0 && (
              <Link
                href="/registrar/students"
                className="mt-4 block rounded-2xl bg-red-50 border border-red-200 p-5 hover:bg-red-100 transition-colors"
              >
                <p className="text-xs font-black uppercase tracking-widest text-red-500">
                  {suspendedStudents} Suspended Student
                  {suspendedStudents !== 1 ? "s" : ""}
                </p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-red-400">
                  Click to clear fine &amp; reinstate
                </p>
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-md border border-slate-200">
      <div className="flex items-center gap-3 mb-3">
        {icon}
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          {label}
        </span>
      </div>
      <p className="text-3xl font-black text-[#0f172a]">{value}</p>
    </div>
  );
}

function PendingCard({
  icon,
  label,
  count,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-2xl bg-white border border-slate-200 p-6 shadow-md hover:shadow-lg transition-shadow"
    >
      {icon}
      <div>
        <p className="text-2xl font-black text-[#0f172a]">{count}</p>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          {label}
        </p>
      </div>
    </Link>
  );
}

function ActionCard({
  icon,
  title,
  desc,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl bg-white border border-slate-200 p-6 shadow-md hover:shadow-lg transition-shadow"
    >
      <div className="mb-3">{icon}</div>
      <h4 className="font-black text-[#0f172a]">{title}</h4>
      <p className="mt-1 text-xs text-slate-400 font-medium">{desc}</p>
    </Link>
  );
}
