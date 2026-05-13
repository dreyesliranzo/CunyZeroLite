import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, ClipboardList, Users } from "lucide-react";
import { getSession } from "@/src/lib/session";
import { prisma } from "@/src/lib/db";
import LogoutButton from "@/src/components/LogoutButton";

export const metadata = { title: "My Courses" };

export default async function InstructorCoursesPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "INSTRUCTOR") redirect("/dashboard");

  const courses = await prisma.course.findMany({
    where: { instructorId: session.userId },
    include: {
      semester: { select: { name: true, period: true, year: true, isCurrent: true } },
      _count: { select: { enrollments: true, waitlists: true, reviews: true } },
      reviews: { where: { hidden: false }, select: { rating: true } },
    },
    orderBy: [{ semester: { year: "desc" } }, { code: "asc" }],
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 font-sans text-[#0f172a]">
      <nav className="sticky top-0 z-10 bg-[#0f172a] text-white shadow-xl border-b border-white/5">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-8 py-5">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-white">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-6">
            <span className="text-sm font-bold text-slate-300">{session.firstName} {session.lastName}</span>
            <LogoutButton />
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-8 py-10 space-y-6">
        <div className="rounded-2xl bg-gradient-to-r from-emerald-900 to-emerald-700 p-8 text-white shadow-xl">
          <div className="flex items-center gap-3">
            <BookOpen size={28} className="text-emerald-200" />
            <h2 className="text-3xl font-black tracking-tight">My Courses</h2>
          </div>
          <p className="mt-2 text-sm text-emerald-100 font-medium">
            Every section you have ever taught — current and past terms.
          </p>
        </div>

        {courses.length === 0 ? (
          <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center">
            <p className="text-sm font-medium text-slate-500">You are not assigned to any courses yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {courses.map((c) => {
              const ratings = c.reviews.map((r) => r.rating);
              const avg = ratings.length > 0 ? ratings.reduce((s, r) => s + r, 0) / ratings.length : null;
              return (
                <div key={c.id} className="rounded-2xl bg-white border border-slate-200 p-6 shadow-md">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-black text-[#0f172a]">{c.code}</h3>
                        <span className="text-sm font-medium text-slate-600">{c.name}</span>
                        {c.cancelled && (
                          <span className="rounded-full bg-red-100 border border-red-300 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-red-700">
                            Cancelled
                          </span>
                        )}
                        {c.semester.isCurrent && (
                          <span className="rounded-full bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-emerald-700">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-medium">
                        {c.semester.name} · {c.schedule} · {c.credits} credits · cap {c.maxStudents}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Link
                        href={`/instructor/grades/${c.id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black uppercase tracking-widest text-white hover:bg-emerald-700"
                      >
                        <ClipboardList size={12} /> Grades
                      </Link>
                      <Link
                        href={`/instructor/courses/${c.id}/waitlist`}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50"
                      >
                        <Users size={12} /> Waitlist
                      </Link>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <Stat label="Enrolled" value={String(c._count.enrollments)} />
                    <Stat label="Waitlisted" value={String(c._count.waitlists)} />
                    <Stat
                      label="Avg Rating"
                      value={avg !== null ? `${avg.toFixed(2)} ★` : "—"}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-0.5 text-base font-black text-[#0f172a]">{value}</p>
    </div>
  );
}
