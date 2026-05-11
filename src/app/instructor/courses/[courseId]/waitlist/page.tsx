import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, AlertTriangle } from "lucide-react";
import { getSession } from "@/src/lib/session";
import { prisma } from "@/src/lib/db";
import LogoutButton from "@/src/components/LogoutButton";
import AdmitButton from "./AdmitButton";

type Params = Promise<{ courseId: string }>;

export default async function WaitlistPage(props: { params: Params }) {
  const session = await getSession();
  if (!session || session.role !== "INSTRUCTOR") redirect("/login");

  const { courseId: raw } = await props.params;
  const courseId = Number(raw);
  if (!Number.isFinite(courseId)) notFound();

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      _count: { select: { enrollments: true } },
      waitlists: {
        where: { status: "WAITING" },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              gpa: true,
              suspended: true,
              terminated: true,
            },
          },
        },
        orderBy: { position: "asc" },
      },
    },
  });

  if (!course) notFound();
  if (course.instructorId !== session.userId) redirect("/instructor/dashboard");

  const atCapacity = course._count.enrollments >= course.maxStudents;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 font-sans text-[#0f172a]">
      <nav className="sticky top-0 z-10 bg-[#0f172a] text-white shadow-xl border-b border-white/5">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-8 py-5">
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

      <main className="mx-auto max-w-5xl px-8 py-10">
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-[#0f172a] to-[#0f3025] p-8 text-white shadow-xl">
          <div className="flex items-center gap-3">
            <Clock size={24} className="text-emerald-300" />
            <p className="text-xs font-black uppercase tracking-widest text-emerald-300">
              {course.code}
            </p>
          </div>
          <h2 className="mt-2 text-3xl font-black tracking-tight">
            {course.name} — Waitlist
          </h2>
          <p className="mt-1 text-sm text-emerald-200 font-medium">
            {course._count.enrollments} / {course.maxStudents} enrolled · {course.waitlists.length} waiting
          </p>
        </div>

        {atCapacity && course.waitlists.length > 0 && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-xs font-bold text-amber-800">
            <AlertTriangle size={14} />
            Course is at capacity. Admitting overrides the cap.
          </div>
        )}

        <div className="overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-md">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Position</th>
                <th className="px-4 py-3 text-left">Student</th>
                <th className="px-4 py-3 text-center">GPA</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {course.waitlists.map((w) => {
                const ineligible = w.user.suspended || w.user.terminated;
                return (
                  <tr key={w.id}>
                    <td className="px-4 py-3 font-black text-[#0f172a]">
                      #{w.position}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold">
                        {w.user.firstName} {w.user.lastName}
                      </p>
                      {ineligible && (
                        <p className="text-[10px] font-black text-red-600">
                          {w.user.suspended ? "Suspended" : "Terminated"} — cannot admit
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-xs font-bold text-slate-700">
                      {w.user.gpa.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {w.user.email}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <AdmitButton waitlistId={w.id} disabled={ineligible} />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {course.waitlists.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-sm font-bold text-slate-400"
                  >
                    No students on waitlist.
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
