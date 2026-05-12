import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { getSession } from "@/src/lib/session";
import { prisma } from "@/src/lib/db";
import LogoutButton from "@/src/components/LogoutButton";

export const metadata = { title: "Student Records" };

const PASSING = ["A", "B", "C", "D"];

export default async function RegistrarStudentsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "REGISTRAR") redirect("/dashboard");

  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    orderBy: { gpa: "desc" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      gpa: true,
      warnings: true,
      suspended: true,
      terminated: true,
      graduated: true,
      fineOwed: true,
    },
  });
  const passingCounts = await prisma.enrollment.groupBy({
    by: ["userId"],
    where: { grade: { in: PASSING } },
    _count: { _all: true },
  });
  const passingMap = new Map(passingCounts.map((r) => [r.userId, r._count._all]));

  const totals = {
    total: students.length,
    active: students.filter((s) => !s.suspended && !s.terminated && !s.graduated).length,
    suspended: students.filter((s) => s.suspended && !s.terminated).length,
    terminated: students.filter((s) => s.terminated).length,
    graduated: students.filter((s) => s.graduated).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 font-sans text-[#0f172a]">
      <nav className="sticky top-0 z-10 bg-[#0f172a] text-white shadow-xl border-b border-white/5">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-5">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-white">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-6">
            <span className="text-sm font-bold text-slate-300">{session.firstName} {session.lastName}</span>
            <LogoutButton />
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-8 py-10 space-y-6">
        <div className="rounded-2xl bg-gradient-to-r from-red-900 to-red-700 p-8 text-white shadow-xl">
          <div className="flex items-center gap-3">
            <Users size={28} className="text-red-200" />
            <h2 className="text-3xl font-black tracking-tight">Student Records</h2>
          </div>
          <p className="mt-2 text-sm text-red-100 font-medium">
            Read-only view of every student in the system, sorted by GPA.
          </p>
        </div>

        <div className="grid grid-cols-5 gap-3">
          <Stat label="Total" value={String(totals.total)} />
          <Stat label="Active" value={String(totals.active)} />
          <Stat label="Suspended" value={String(totals.suspended)} />
          <Stat label="Terminated" value={String(totals.terminated)} />
          <Stat label="Graduated" value={String(totals.graduated)} />
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 shadow-md overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 bg-slate-50">
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">GPA</th>
                <th className="px-6 py-3">Passing</th>
                <th className="px-6 py-3">Warnings</th>
                <th className="px-6 py-3">Fine</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const status = s.terminated
                  ? { label: "Terminated", cls: "bg-red-100 text-red-700 border-red-300" }
                  : s.suspended
                  ? { label: "Suspended", cls: "bg-amber-100 text-amber-700 border-amber-300" }
                  : s.graduated
                  ? { label: "Graduated", cls: "bg-emerald-100 text-emerald-700 border-emerald-300" }
                  : { label: "Active", cls: "bg-slate-100 text-slate-700 border-slate-300" };
                return (
                  <tr key={s.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-6 py-4 font-bold text-[#0f172a]">{s.firstName} {s.lastName}</td>
                    <td className="px-6 py-4 text-slate-600 text-xs">{s.email}</td>
                    <td className="px-6 py-4 font-black">{s.gpa.toFixed(2)}</td>
                    <td className="px-6 py-4 text-slate-600">{passingMap.get(s.id) ?? 0} / 8</td>
                    <td className="px-6 py-4 text-slate-600">{s.warnings}</td>
                    <td className="px-6 py-4 text-slate-600">${s.fineOwed.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${status.cls}`}>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-black text-[#0f172a]">{value}</p>
    </div>
  );
}
