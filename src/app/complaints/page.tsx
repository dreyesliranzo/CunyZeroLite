import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileWarning, Plus } from "lucide-react";
import { getSession } from "@/src/lib/session";
import { prisma } from "@/src/lib/db";
import LogoutButton from "@/src/components/LogoutButton";

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-amber-100 border border-amber-300 text-amber-700",
  RESOLVED: "bg-emerald-100 border border-emerald-300 text-emerald-700",
  DISMISSED: "bg-slate-100 border border-slate-300 text-slate-600",
};

export default async function MyComplaintsPage() {
  const session = await getSession();
  if (!session || (session.role !== "STUDENT" && session.role !== "INSTRUCTOR")) {
    redirect("/login");
  }

  // Two filtered lists in one trip
  const [filed, received] = await Promise.all([
    prisma.complaint.findMany({
      where: { filerId: session.userId },
      include: {
        target: {
          select: { firstName: true, lastName: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.complaint.findMany({
      where: { targetId: session.userId },
      include: {
        filer: {
          select: { firstName: true, lastName: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const dashboard =
    session.role === "STUDENT" ? "/dashboard" : "/instructor/dashboard";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 font-sans text-[#0f172a]">
      <nav className="sticky top-0 z-10 bg-[#0f172a] text-white shadow-xl border-b border-white/5">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-8 py-5">
          <Link
            href={dashboard}
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

      <main className="mx-auto max-w-5xl px-8 py-10 space-y-8">
        <div className="rounded-2xl bg-gradient-to-r from-[#0f172a] to-[#3b1225] p-8 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileWarning size={28} className="text-red-300" />
              <h2 className="text-3xl font-black tracking-tight">
                My Complaints
              </h2>
            </div>
            <Link
              href="/complaints/new"
              className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white hover:bg-white/20 backdrop-blur"
            >
              <Plus size={14} /> New
            </Link>
          </div>
        </div>

        <Section title="Filed by me" emptyMsg="No complaints filed yet.">
          {filed.map((c) => (
            <Card
              key={c.id}
              status={c.status}
              who={`Against ${c.target.firstName} ${c.target.lastName}`}
              description={c.description}
              resolution={c.resolution}
              createdAt={c.createdAt}
            />
          ))}
        </Section>

        <Section title="Filed against me" emptyMsg="No complaints received.">
          {received.map((c) => (
            <Card
              key={c.id}
              status={c.status}
              who={`From ${c.filer.firstName} ${c.filer.lastName}`}
              description={c.description}
              resolution={c.resolution}
              createdAt={c.createdAt}
            />
          ))}
        </Section>
      </main>
    </div>
  );
}

function Section({
  title,
  emptyMsg,
  children,
}: {
  title: string;
  emptyMsg: string;
  children: React.ReactNode;
}) {
  const items = Array.isArray(children) ? children : [children];
  return (
    <section>
      <h3 className="mb-4 text-lg font-black uppercase tracking-wide text-slate-700">
        {title}
      </h3>
      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-2xl bg-white border border-slate-200 p-6 text-sm font-bold text-slate-400 text-center shadow-sm">
            {emptyMsg}
          </div>
        ) : (
          items
        )}
      </div>
    </section>
  );
}

function Card({
  status,
  who,
  description,
  resolution,
  createdAt,
}: {
  status: string;
  who: string;
  description: string;
  resolution: string | null;
  createdAt: Date;
}) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-black text-[#0f172a]">{who}</p>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest ${STATUS_BADGE[status] ?? STATUS_BADGE.PENDING}`}
        >
          {status}
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-700">{description}</p>
      {resolution && (
        <p className="mt-2 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-600 font-medium">
          <span className="font-black uppercase tracking-widest text-slate-400 mr-2">
            Resolution
          </span>
          {resolution}
        </p>
      )}
      <p className="mt-2 text-[10px] text-slate-400 font-medium">
        Filed {new Date(createdAt).toLocaleDateString()}
      </p>
    </div>
  );
}
