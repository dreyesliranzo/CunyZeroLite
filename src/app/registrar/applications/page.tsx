import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, Sparkles, AlertTriangle } from "lucide-react";
import { getSession } from "@/src/lib/session";
import { prisma } from "@/src/lib/db";
import LogoutButton from "@/src/components/LogoutButton";
import ApplicationRowActions from "./ApplicationRowActions";

type SearchParams = Promise<{ status?: string }>;

export default async function ApplicationsPage(props: {
  searchParams: SearchParams;
}) {
  const session = await getSession();
  if (!session || session.role !== "REGISTRAR") redirect("/login");

  const { status } = await props.searchParams;
  const filter = status === "ACCEPTED" || status === "REJECTED" ? status : "PENDING";

  const [applications, currentSemester, totalStudents] = await Promise.all([
    prisma.application.findMany({
      where: { status: filter },
      orderBy: { createdAt: "desc" },
    }),
    prisma.semester.findFirst({ where: { isCurrent: true } }),
    prisma.user.count({
      where: { role: "STUDENT", terminated: false, graduated: false },
    }),
  ]);

  const quotaReached = currentSemester
    ? totalStudents >= currentSemester.programQuota
    : false;

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
            <FileText size={28} className="text-red-300" />
            <h2 className="text-3xl font-black tracking-tight">
              Visitor Applications
            </h2>
          </div>
          <p className="mt-2 text-sm text-red-200 font-medium">
            Review applications from prospective students and instructors.
          </p>
        </div>

        {quotaReached && filter === "PENDING" && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-xs font-bold text-amber-800">
            <AlertTriangle size={14} />
            Program quota reached ({totalStudents}/{currentSemester?.programQuota}).
            Approving more students requires manual override.
          </div>
        )}

        <div className="mb-6 flex items-center gap-2">
          <FilterTab href="/registrar/applications" label="Pending" active={filter === "PENDING"} />
          <FilterTab href="/registrar/applications?status=ACCEPTED" label="Accepted" active={filter === "ACCEPTED"} />
          <FilterTab href="/registrar/applications?status=REJECTED" label="Rejected" active={filter === "REJECTED"} />
        </div>

        <div className="overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-md">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Applicant</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-center">Prior GPA</th>
                <th className="px-4 py-3 text-left">Justification</th>
                <th className="px-4 py-3 text-center">Submitted</th>
                {filter === "PENDING" && <th className="px-4 py-3 text-right">Actions</th>}
                {filter === "REJECTED" && <th className="px-4 py-3 text-left">Reason</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {applications.map((app) => {
                const autoAcceptFlag =
                  app.type === "STUDENT" &&
                  (app.priorGpa ?? 0) > 3.0 &&
                  !quotaReached;
                const needsJustification =
                  app.type === "STUDENT" && (app.priorGpa ?? 0) > 3.0;
                return (
                  <tr key={app.id}>
                    <td className="px-4 py-3 font-bold text-[#0f172a]">
                      {app.firstName} {app.lastName}
                      {autoAcceptFlag && filter === "PENDING" && (
                        <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-emerald-700">
                          <Sparkles size={10} /> Auto
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest ${
                        app.type === "STUDENT"
                          ? "bg-blue-100 border border-blue-300 text-blue-700"
                          : "bg-purple-100 border border-purple-300 text-purple-700"
                      }`}>
                        {app.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{app.email}</td>
                    <td className="px-4 py-3 text-center text-xs font-bold text-slate-700">
                      {app.priorGpa !== null ? app.priorGpa.toFixed(2) : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 max-w-md">
                      {app.justification || "—"}
                    </td>
                    <td className="px-4 py-3 text-center text-[10px] text-slate-400 font-medium">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                    {filter === "PENDING" && (
                      <td className="px-4 py-3">
                        <ApplicationRowActions
                          applicationId={app.id}
                          needsJustification={needsJustification}
                        />
                      </td>
                    )}
                    {filter === "REJECTED" && (
                      <td className="px-4 py-3 text-xs text-slate-500 max-w-xs">
                        {app.rejectionReason || "—"}
                      </td>
                    )}
                  </tr>
                );
              })}
              {applications.length === 0 && (
                <tr>
                  <td
                    colSpan={filter === "PENDING" || filter === "REJECTED" ? 7 : 6}
                    className="px-4 py-10 text-center text-sm font-bold text-slate-400"
                  >
                    No {filter.toLowerCase()} applications.
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

function FilterTab({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-lg px-4 py-2 text-xs font-black uppercase tracking-widest ${
        active
          ? "bg-[#0f172a] text-white"
          : "bg-white border border-slate-300 text-slate-600 hover:bg-slate-50"
      }`}
    >
      {label}
    </Link>
  );
}
