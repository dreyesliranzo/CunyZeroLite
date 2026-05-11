import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, GraduationCap, AlertTriangle } from "lucide-react";
import { getSession } from "@/src/lib/session";
import { prisma } from "@/src/lib/db";
import LogoutButton from "@/src/components/LogoutButton";
import RequestActions from "./RequestActions";

const PASSING = ["A", "B", "C", "D"];

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-amber-100 border border-amber-300 text-amber-700",
  APPROVED: "bg-emerald-100 border border-emerald-300 text-emerald-700",
  REJECTED: "bg-red-100 border border-red-300 text-red-700",
};

type SearchParams = Promise<{ status?: string }>;

export default async function GraduationsPage(props: {
  searchParams: SearchParams;
}) {
  const session = await getSession();
  if (!session || session.role !== "REGISTRAR") redirect("/login");

  const { status } = await props.searchParams;
  const filter =
    status === "APPROVED" || status === "REJECTED" ? status : "PENDING";

  // For each request we want the student's standing + passing-course count.
  // Fetch the requests joined to user, then run one groupBy for counts.
  const requests = await prisma.graduationRequest.findMany({
    where: { status: filter },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          gpa: true,
          suspended: true,
          fineOwed: true,
          warnings: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const userIds = requests.map((r) => r.userId);
  const passingCounts =
    userIds.length === 0
      ? []
      : await prisma.enrollment.groupBy({
          by: ["userId"],
          where: { userId: { in: userIds }, grade: { in: PASSING } },
          _count: { _all: true },
        });
  const passingMap = new Map(
    passingCounts.map((row) => [row.userId, row._count._all]),
  );

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
            <GraduationCap size={28} className="text-red-300" />
            <h2 className="text-3xl font-black tracking-tight">
              Graduation Requests
            </h2>
          </div>
          <p className="mt-2 text-sm text-red-200 font-medium">
            Approve students who meet requirements; reject reckless filings (issues a warning).
          </p>
        </div>

        <div className="mb-6 flex items-center gap-2">
          <Tab href="/registrar/graduations" label="Pending" active={filter === "PENDING"} />
          <Tab href="/registrar/graduations?status=APPROVED" label="Approved" active={filter === "APPROVED"} />
          <Tab href="/registrar/graduations?status=REJECTED" label="Rejected" active={filter === "REJECTED"} />
        </div>

        <div className="overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-md">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Student</th>
                <th className="px-4 py-3 text-center">GPA</th>
                <th className="px-4 py-3 text-center">Passing Courses</th>
                <th className="px-4 py-3 text-center">Holds</th>
                <th className="px-4 py-3 text-center">Submitted</th>
                {filter === "PENDING" && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map((r) => {
                const passing = passingMap.get(r.userId) ?? 0;
                const hasHold = r.user.suspended || r.user.fineOwed > 0;
                const eligible = passing >= 8 && !hasHold;
                return (
                  <tr key={r.id}>
                    <td className="px-4 py-3">
                      <p className="font-black text-[#0f172a]">
                        {r.user.firstName} {r.user.lastName}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {r.user.email}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-sm font-black ${r.user.gpa >= 2.0 ? "text-slate-700" : "text-red-600"}`}>
                        {r.user.gpa.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-sm font-black ${passing >= 8 ? "text-emerald-600" : "text-red-600"}`}>
                        {passing} / 8
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-xs">
                      {hasHold ? (
                        <span className="inline-flex items-center gap-1 text-red-700 font-bold">
                          <AlertTriangle size={12} />
                          {r.user.suspended && "Suspended "}
                          {r.user.fineOwed > 0 && `$${r.user.fineOwed.toFixed(2)} fine`}
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-bold">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-[10px] text-slate-400 font-medium">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    {filter === "PENDING" && (
                      <td className="px-4 py-3">
                        <div className="flex flex-col items-end gap-1">
                          {!eligible && (
                            <p className="text-[10px] font-bold text-amber-700">
                              Reckless — rejection issues warning
                            </p>
                          )}
                          <RequestActions requestId={r.id} />
                        </div>
                      </td>
                    )}
                    {filter !== "PENDING" && (
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest ${STATUS_BADGE[r.status]}`}
                        >
                          {r.status}
                        </span>
                      </td>
                    )}
                  </tr>
                );
              })}
              {requests.length === 0 && (
                <tr>
                  <td
                    colSpan={filter === "PENDING" ? 6 : 5}
                    className="px-4 py-10 text-center text-sm font-bold text-slate-400"
                  >
                    No {filter.toLowerCase()} graduation requests.
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

function Tab({
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
