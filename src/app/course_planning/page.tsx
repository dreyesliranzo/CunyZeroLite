import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, GraduationCap, CheckCircle2, Clock, Plus, AlertTriangle } from "lucide-react";
import { getSession } from "@/src/lib/session";
import { prisma } from "@/src/lib/db";
import LogoutButton from "@/src/components/LogoutButton";

export const metadata = { title: "Degree Planner" };

const PASSING = ["A", "B", "C", "D"];
const REQUIRED_FOR_GRAD = 8;

export default async function DegreePlannerPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "STUDENT") redirect("/dashboard");

  const [user, allEnrollments, currentSemester] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { firstName: true, lastName: true, gpa: true, graduated: true },
    }),
    prisma.enrollment.findMany({
      where: { userId: session.userId },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
            credits: true,
            schedule: true,
            cancelled: true,
            instructor: { select: { firstName: true, lastName: true } },
            semester: { select: { name: true, period: true, isCurrent: true } },
          },
        },
      },
    }),
    prisma.semester.findFirst({ where: { isCurrent: true } }),
  ]);
  if (!user) redirect("/login");

  const passedCourseCodes = new Set(
    allEnrollments
      .filter((e) => e.grade && PASSING.includes(e.grade))
      .map((e) => e.course.code),
  );
  const inProgressCourseCodes = new Set(
    allEnrollments
      .filter((e) => e.status === "ENROLLED" && !e.grade)
      .map((e) => e.course.code),
  );

  const passedEnrollments = allEnrollments.filter(
    (e) => e.grade && PASSING.includes(e.grade),
  );
  const inProgressEnrollments = allEnrollments.filter(
    (e) => e.status === "ENROLLED" && !e.grade,
  );
  const failedEnrollments = allEnrollments.filter((e) => e.grade === "F");

  // Available courses for the current semester that the student hasn't passed
  // and isn't currently enrolled in.
  const availableCourses = currentSemester
    ? await prisma.course.findMany({
        where: {
          semesterId: currentSemester.id,
          cancelled: false,
        },
        include: {
          instructor: { select: { firstName: true, lastName: true } },
          _count: { select: { enrollments: true } },
        },
        orderBy: { code: "asc" },
      })
    : [];
  const recommendable = availableCourses.filter(
    (c) => !passedCourseCodes.has(c.code) && !inProgressCourseCodes.has(c.code),
  );
  const retakable = availableCourses.filter((c) =>
    failedEnrollments.some((e) => e.course.code === c.code),
  );

  const remaining = Math.max(0, REQUIRED_FOR_GRAD - passedEnrollments.length);
  const projectedAfterCurrent = passedEnrollments.length + inProgressEnrollments.length;
  const progressPct = Math.min(100, (passedEnrollments.length / REQUIRED_FOR_GRAD) * 100);

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
        <div className="rounded-2xl bg-gradient-to-r from-[#0f172a] to-[#1e3a8a] p-8 text-white shadow-xl">
          <div className="flex items-center gap-3">
            <GraduationCap size={28} className="text-blue-300" />
            <h2 className="text-3xl font-black tracking-tight">Degree Planner</h2>
          </div>
          <p className="mt-2 text-sm text-blue-200 font-medium">
            Track progress toward graduation — {REQUIRED_FOR_GRAD} passing courses required.
          </p>
        </div>

        {/* Progress bar */}
        <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Graduation Progress</p>
              <p className="mt-1 text-2xl font-black text-[#0f172a]">
                {passedEnrollments.length} <span className="text-slate-400 text-lg">/ {REQUIRED_FOR_GRAD}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">After Current Term</p>
              <p className="mt-1 text-2xl font-black text-blue-700">{projectedAfterCurrent}</p>
            </div>
          </div>
          <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="mt-3 text-xs font-medium text-slate-500">
            {user.graduated
              ? "Congratulations — you have graduated."
              : remaining === 0
              ? "You meet the course requirement. Apply to graduate from your dashboard."
              : `${remaining} more passing course${remaining !== 1 ? "s" : ""} to be eligible to apply for graduation.`}
          </p>
        </div>

        {/* Completed */}
        <Section
          title="Completed (Passing)"
          icon={<CheckCircle2 size={20} className="text-emerald-600" />}
          accent="border-l-emerald-500"
          empty="No passing courses on record yet."
        >
          {passedEnrollments.map((e) => (
            <CourseRow
              key={e.id}
              code={e.course.code}
              name={e.course.name}
              credits={e.course.credits}
              tag={`${e.course.semester.name} · grade ${e.grade}`}
              instructor={e.course.instructor ? `Prof. ${e.course.instructor.lastName}` : undefined}
            />
          ))}
        </Section>

        {/* In Progress */}
        <Section
          title="In Progress (this term)"
          icon={<Clock size={20} className="text-blue-600" />}
          accent="border-l-blue-500"
          empty="You are not currently enrolled in any courses."
        >
          {inProgressEnrollments.map((e) => (
            <CourseRow
              key={e.id}
              code={e.course.code}
              name={e.course.name}
              credits={e.course.credits}
              tag={`${e.course.semester.name} · ${e.course.schedule}`}
              instructor={e.course.instructor ? `Prof. ${e.course.instructor.lastName}` : undefined}
            />
          ))}
        </Section>

        {/* Must Retake */}
        {retakable.length > 0 && (
          <Section
            title="Should Retake (failed)"
            icon={<AlertTriangle size={20} className="text-amber-600" />}
            accent="border-l-amber-500"
            empty=""
          >
            {retakable.map((c) => (
              <CourseRow
                key={c.id}
                code={c.code}
                name={c.name}
                credits={c.credits}
                tag={`Available now · cap ${c.maxStudents - c._count.enrollments} seat${c.maxStudents - c._count.enrollments !== 1 ? "s" : ""} left`}
                instructor={c.instructor ? `Prof. ${c.instructor.lastName}` : undefined}
              />
            ))}
          </Section>
        )}

        {/* Recommended Next */}
        <Section
          title={`Available This Term (${currentSemester?.name ?? ""})`}
          icon={<Plus size={20} className="text-indigo-600" />}
          accent="border-l-indigo-500"
          empty="No new courses available this term."
        >
          {recommendable.map((c) => (
            <CourseRow
              key={c.id}
              code={c.code}
              name={c.name}
              credits={c.credits}
              tag={`${c.schedule} · ${c.maxStudents - c._count.enrollments} seat${c.maxStudents - c._count.enrollments !== 1 ? "s" : ""} left`}
              instructor={c.instructor ? `Prof. ${c.instructor.lastName}` : undefined}
            />
          ))}
        </Section>

        <Link
          href="/student/register"
          className="block w-full text-center rounded-2xl bg-blue-600 py-5 text-sm font-black uppercase tracking-[0.2em] text-white shadow-xl hover:bg-blue-500"
        >
          Go to Course Registration →
        </Link>
      </main>
    </div>
  );
}

function Section({
  title,
  icon,
  accent,
  empty,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  accent: string;
  empty: string;
  children: React.ReactNode;
}) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : !!children;
  return (
    <div className={`rounded-2xl bg-white border border-slate-200 border-l-4 ${accent} p-6 shadow-md`}>
      <div className="flex items-center gap-3 mb-4">
        {icon}
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">{title}</h3>
      </div>
      {hasChildren ? <ul className="divide-y divide-slate-100">{children}</ul> : (
        <p className="text-sm font-medium text-slate-400 italic">{empty}</p>
      )}
    </div>
  );
}

function CourseRow({
  code,
  name,
  credits,
  tag,
  instructor,
}: {
  code: string;
  name: string;
  credits: number;
  tag: string;
  instructor?: string;
}) {
  return (
    <li className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-black text-[#0f172a]">{code} <span className="text-slate-500 font-medium">— {name}</span></p>
        <p className="text-xs text-slate-500 font-medium mt-0.5">{tag}{instructor ? ` · ${instructor}` : ""}</p>
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">{credits} cr</span>
    </li>
  );
}
