import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User as UserIcon, Mail, Shield, KeyRound, ChevronRight, IdCard, CalendarClock } from "lucide-react";
import { getSession } from "@/src/lib/session";
import { prisma } from "@/src/lib/db";
import LogoutButton from "@/src/components/LogoutButton";

export const metadata = { title: "Account" };

const ROLE_LABEL: Record<string, string> = {
  STUDENT: "Student",
  INSTRUCTOR: "Instructor",
  REGISTRAR: "Registrar",
};

const ROLE_DETAIL_HREF: Record<string, string> = {
  STUDENT: "/student/profile",
  INSTRUCTOR: "/instructor/profile",
  REGISTRAR: "/registrar/profile",
};

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      username: true,
      role: true,
      createdAt: true,
      mustChangePassword: true,
    },
  });
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 font-sans text-[#0f172a]">
      <nav className="sticky top-0 z-10 bg-[#0f172a] text-white shadow-xl border-b border-white/5">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-8 py-5">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-white">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <LogoutButton />
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-8 py-10 space-y-6">
        <div className="rounded-2xl bg-gradient-to-r from-[#0f172a] to-[#1e3a8a] p-8 text-white shadow-xl">
          <div className="flex items-center gap-3">
            <UserIcon size={28} className="text-blue-300" />
            <h2 className="text-3xl font-black tracking-tight">Account</h2>
          </div>
          <p className="mt-2 text-sm text-blue-200 font-medium">
            Identity and account settings — common to every CunyZeroLite role.
          </p>
        </div>

        {user.mustChangePassword && (
          <div className="rounded-2xl bg-amber-50 border border-amber-300 p-5 flex items-start gap-3">
            <KeyRound size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-black text-amber-800">Password change required</p>
              <p className="text-xs text-amber-700 font-medium mt-0.5">
                You're using a temporary password. Change it before continuing.
              </p>
            </div>
          </div>
        )}

        <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-md">
          <h3 className="mb-5 text-xs font-black uppercase tracking-widest text-slate-400">Identity</h3>
          <ul className="divide-y divide-slate-100">
            <Field icon={<UserIcon size={16} className="text-blue-600" />} label="Full Name" value={`${user.firstName} ${user.lastName}`} />
            <Field icon={<Mail size={16} className="text-blue-600" />} label="Email / Username" value={user.email} />
            <Field icon={<Shield size={16} className="text-blue-600" />} label="Role" value={ROLE_LABEL[user.role] ?? user.role} />
            <Field icon={<IdCard size={16} className="text-blue-600" />} label="User ID" value={`#${session.userId}`} />
            <Field icon={<CalendarClock size={16} className="text-blue-600" />} label="Account Created" value={new Date(user.createdAt).toLocaleDateString()} />
          </ul>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-md">
          <h3 className="mb-5 text-xs font-black uppercase tracking-widest text-slate-400">Account Actions</h3>
          <div className="space-y-2">
            <ActionLink
              href={ROLE_DETAIL_HREF[user.role] ?? "/dashboard"}
              icon={<UserIcon size={18} className="text-blue-600" />}
              label="View Detailed Profile"
              hint={`Open the ${ROLE_LABEL[user.role] ?? user.role} dashboard view`}
            />
            <ActionLink
              href="/change-password"
              icon={<KeyRound size={18} className="text-blue-600" />}
              label="Change Password"
              hint="Update your portal credentials"
            />
            <ActionLink
              href="/dashboard"
              icon={<ChevronRight size={18} className="text-blue-600" />}
              label="Back to Dashboard"
              hint="Return to your main dashboard"
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <li className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</span>
      </div>
      <span className="text-sm font-bold text-[#0f172a]">{value}</span>
    </li>
  );
}

function ActionLink({ href, icon, label, hint }: { href: string; icon: React.ReactNode; label: string; hint: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 hover:bg-white hover:border-blue-300 transition-colors"
    >
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="text-sm font-black text-[#0f172a]">{label}</p>
          <p className="text-xs text-slate-500 font-medium">{hint}</p>
        </div>
      </div>
      <ChevronRight size={16} className="text-slate-400" />
    </Link>
  );
}
