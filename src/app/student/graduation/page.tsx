import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, GraduationCap, Clock, CheckCircle2, XCircle } from "lucide-react";
import { getSession } from "@/src/lib/session";
import { prisma } from "@/src/lib/db";
import LogoutButton from "@/src/components/LogoutButton";
import ApplyButton from "./ApplyButton";

const PASSING = ["A", "B", "C", "D"];

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-amber-100 border border-amber-300 text-amber-700",
  APPROVED: "bg-emerald-100 border border-emerald-300 text-emerald-700",
  REJECTED: "bg-red-100 border border-red-300 text-red-700",
};

export default async function GraduationPage() {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") redirect("/login");

  // Pull student standing + passing-course count + request history in one trip
  const [user, passingCount, requests] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        graduated: true,
        suspended: true,
        terminated: true,
        fineOwed: true,
        gpa: true,
      },
    }),
    prisma.enrollment.count({
      where: { userId: session.userId, grade: { in: PASSING } },
    }),
    prisma.graduationRequest.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!user) redirect("/login");

  const pendingRequest = requests.find((r) => r.status === "PENDING");
  const meetsRequirement = passingCount >= 8;
  const hasHold = user.suspended || user.terminated || user.fineOwed > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 font-sans text-[#0f172a]">
      <nav className="sticky top-0 z-10 bg-[#0f172a] text-white shadow-xl border-b border-white/5">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-8 py-5">
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

      <main className="mx-auto max-w-3xl px-8 py-10 space-y-6">
        <div className="rounded-2xl bg-gradient-to-r from-[#0f172a] to-[#1e3a8a] p-8 text-white shadow-xl">
          <div className="flex items-center gap-3">
            <GraduationCap size={28} className="text-blue-300" />
            <h2 className="text-3xl font-black tracking-tight">Graduation</h2>
          </div>
          <p className="mt-2 text-sm text-blue-200 font-medium">
            Apply to graduate after completing 8 courses with passing grades.
          </p>
        </div>

        {user.graduated && (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-6 text-center">
            <CheckCircle2 size={40} className="mx-auto text-emerald-500" />
            <p className="mt-2 text-lg font-black text-emerald-800">
              Congratulations, you have graduated.
            </p>
          </div>
        )}

        <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-md">
          <div className="grid gap-4 grid-cols-3">
            <Stat label="Passing Courses" value={`${passingCount} / 8`} ok={meetsRequirement} />
            <Stat label="GPA" value={user.gpa.toFixed(2)} ok={user.gpa >= 2.0} />
            <Stat label="Holds" value={hasHold ? "Yes" : "None"} ok={!hasHold} />
          </div>
        </div>

        {!user.graduated && !pendingRequest && (
          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-md">
            <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">
              Submit
            </h3>
            <ApplyButton premature={!meetsRequirement} />
          </div>
        )}

        {pendingRequest && (
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5 flex items-center gap-3">
            <Clock size={20} className="text-amber-600" />
            <p className="text-sm font-bold text-amber-800">
              Your graduation request is pending registrar review.
            </p>
          </div>
        )}

        {requests.length > 0 && (
          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-md">
            <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">
              Request History
            </h3>
            <ul className="divide-y divide-slate-100">
              {requests.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-2">
                  <span className="text-xs text-slate-500 font-medium">
                    Submitted {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest ${STATUS_BADGE[r.status]}`}
                  >
                    {r.status === "REJECTED" ? (
                      <span className="inline-flex items-center gap-1">
                        <XCircle size={10} /> Rejected
                      </span>
                    ) : (
                      r.status
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}

function Stat({
  label,
  value,
  ok,
}: {
  label: string;
  value: string;
  ok: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <p
        className={`mt-1 text-2xl font-black ${
          ok ? "text-emerald-600" : "text-red-600"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
