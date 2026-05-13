import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileWarning } from "lucide-react";
import { getSession } from "@/src/lib/session";
import { prisma } from "@/src/lib/db";
import LogoutButton from "@/src/components/LogoutButton";
import ComplaintForm from "./ComplaintForm";

export default async function NewComplaintPage() {
  const session = await getSession();
  if (!session || (session.role !== "STUDENT" && session.role !== "INSTRUCTOR")) {
    redirect("/login");
  }

  // Filers complain about the other party (students about instructors and
  // vice versa, plus students vs students). Filter self out.
  const targets = await prisma.user.findMany({
    where: {
      id: { not: session.userId },
      role: { in: ["STUDENT", "INSTRUCTOR"] },
      terminated: false,
      fired: false,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
    },
    orderBy: [{ role: "asc" }, { lastName: "asc" }],
  });

  const dashboard =
    session.role === "STUDENT" ? "/student/dashboard" : "/instructor/dashboard";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 font-sans text-[#0f172a]">
      <nav className="sticky top-0 z-10 bg-[#0f172a] text-white shadow-xl border-b border-white/5">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-8 py-5">
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

      <main className="mx-auto max-w-3xl px-8 py-10">
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-[#0f172a] to-[#3b1225] p-8 text-white shadow-xl">
          <div className="flex items-center gap-3">
            <FileWarning size={28} className="text-red-300" />
            <h2 className="text-3xl font-black tracking-tight">
              File a Complaint
            </h2>
          </div>
          <p className="mt-2 text-sm text-red-200 font-medium">
            Submit a complaint about another student or instructor. The
            registrar reviews each filing.
          </p>
        </div>
        <ComplaintForm targets={targets} />
      </main>
    </div>
  );
}
