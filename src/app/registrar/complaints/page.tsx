import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileWarning, AlertTriangle } from "lucide-react";
import { getSession } from "@/src/lib/session";
import { prisma } from "@/src/lib/db";
import LogoutButton from "@/src/components/LogoutButton";
import ResolveActions from "./ResolveActions";

type SearchParams = Promise<{ status?: string }>;

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-amber-100 border border-amber-300 text-amber-700",
  RESOLVED: "bg-emerald-100 border border-emerald-300 text-emerald-700",
  DISMISSED: "bg-slate-100 border border-slate-300 text-slate-600",
};

export default async function RegistrarComplaintsPage(props: {
  searchParams: SearchParams;
}) {
  const session = await getSession();
  if (!session || session.role !== "REGISTRAR") redirect("/login");

  const { status } = await props.searchParams;
  const filter =
    status === "RESOLVED" || status === "DISMISSED" ? status : "PENDING";

  const complaints = await prisma.complaint.findMany({
    where: { status: filter },
    include: {
      filer: {
        select: { firstName: true, lastName: true, role: true, email: true },
      },
      target: {
        select: {
          firstName: true,
          lastName: true,
          role: true,
          email: true,
          warnings: true,
          suspended: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

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
            <FileWarning size={28} className="text-red-300" />
            <h2 className="text-3xl font-black tracking-tight">
              Complaints
            </h2>
          </div>
          <p className="mt-2 text-sm text-red-200 font-medium">
            Process complaints between students and instructors.
          </p>
        </div>

        <div className="mb-6 flex items-center gap-2">
          <Tab href="/registrar/complaints" label="Pending" active={filter === "PENDING"} />
          <Tab href="/registrar/complaints?status=RESOLVED" label="Resolved" active={filter === "RESOLVED"} />
          <Tab href="/registrar/complaints?status=DISMISSED" label="Dismissed" active={filter === "DISMISSED"} />
        </div>

        <div className="space-y-4">
          {complaints.map((c) => (
            <div
              key={c.id}
              className="rounded-2xl bg-white border border-slate-200 p-6 shadow-md"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Filed {new Date(c.createdAt).toLocaleDateString()}
                  </p>
                  <p className="mt-1 text-sm font-black text-[#0f172a]">
                    {c.filer.firstName} {c.filer.lastName}
                    <span className="ml-1 text-xs text-slate-400 font-medium">
                      ({c.filer.role.toLowerCase()})
                    </span>
                    <span className="mx-2 text-slate-300">→</span>
                    {c.target.firstName} {c.target.lastName}
                    <span className="ml-1 text-xs text-slate-400 font-medium">
                      ({c.target.role.toLowerCase()})
                    </span>
                  </p>
                  {c.target.role === "STUDENT" && (
                    <p className="mt-1 text-[10px] font-bold text-slate-500">
                      Target standing: {c.target.warnings} warning{c.target.warnings !== 1 ? "s" : ""}
                      {c.target.suspended ? " · suspended" : ""}
                    </p>
                  )}
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest ${STATUS_BADGE[c.status]}`}
                >
                  {c.status}
                </span>
              </div>

              <p className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-700">
                {c.description}
              </p>

              {filter === "PENDING" && (
                <>
                  {c.target.role === "STUDENT" && c.target.warnings >= 2 && (
                    <p className="mt-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-600">
                      <AlertTriangle size={12} /> Next warning will auto-suspend this student
                    </p>
                  )}
                  <div className="mt-4">
                    <ResolveActions complaintId={c.id} targetRole={c.target.role} />
                  </div>
                </>
              )}

              {c.resolution && filter !== "PENDING" && (
                <p className="mt-3 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-800 font-medium">
                  <span className="font-black uppercase tracking-widest mr-2">Resolution</span>
                  {c.resolution}
                </p>
              )}
            </div>
          ))}
          {complaints.length === 0 && (
            <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center shadow-md">
              <p className="text-sm font-bold text-slate-400">
                No {filter.toLowerCase()} complaints.
              </p>
            </div>
          )}
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
