import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { getSession } from "@/src/lib/session";
import { prisma } from "@/src/lib/db";
import LogoutButton from "@/src/components/LogoutButton";
import ScheduleBuilderClient, { type CourseOption } from "./ScheduleBuilderClient";

export const metadata = { title: "Schedule Builder" };

const PASSING = ["A", "B", "C", "D"];

export default async function ScheduleBuilderPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "STUDENT") redirect("/dashboard");

  const currentSemester = await prisma.semester.findFirst({
    where: { isCurrent: true },
  });
  if (!currentSemester) {
    return (
      <NoTermShell name={`${session.firstName} ${session.lastName}`}>
        No active semester is set right now. Check back when registration opens.
      </NoTermShell>
    );
  }

  const [availableCourses, myEnrollments, mySemesterEnrollments] = await Promise.all([
    prisma.course.findMany({
      where: { semesterId: currentSemester.id, cancelled: false },
      include: {
        instructor: { select: { firstName: true, lastName: true } },
        _count: { select: { enrollments: true } },
      },
      orderBy: { code: "asc" },
    }),
    prisma.enrollment.findMany({
      where: { userId: session.userId },
      select: { course: { select: { code: true } }, grade: true },
    }),
    prisma.enrollment.findMany({
      where: {
        userId: session.userId,
        course: { semesterId: currentSemester.id },
      },
      select: { courseId: true },
    }),
  ]);

  const passedCodes = new Set(
    myEnrollments.filter((e) => e.grade && PASSING.includes(e.grade)).map((e) => e.course.code),
  );
  const currentlyEnrolledIds = new Set(mySemesterEnrollments.map((e) => e.courseId));

  const options: CourseOption[] = availableCourses.map((c) => ({
    id: c.id,
    code: c.code,
    name: c.name,
    credits: c.credits,
    schedule: c.schedule,
    seatsLeft: c.maxStudents - c._count.enrollments,
    instructor: c.instructor ? `Prof. ${c.instructor.lastName}` : "TBA",
    alreadyPassed: passedCodes.has(c.code),
    alreadyEnrolled: currentlyEnrolledIds.has(c.id),
  }));

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
        <div className="rounded-2xl bg-gradient-to-r from-[#0f172a] to-[#1e3a8a] p-8 text-white shadow-xl">
          <div className="flex items-center gap-3">
            <CalendarDays size={28} className="text-blue-300" />
            <h2 className="text-3xl font-black tracking-tight">Schedule Builder</h2>
          </div>
          <p className="mt-2 text-sm text-blue-200 font-medium">
            Preview a hypothetical week for {currentSemester.name}. Toggle courses on the left;
            conflicts highlight in red. When you're happy, head to registration.
          </p>
        </div>

        <ScheduleBuilderClient options={options} />
      </main>
    </div>
  );
}

function NoTermShell({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 font-sans text-[#0f172a]">
      <nav className="sticky top-0 z-10 bg-[#0f172a] text-white shadow-xl border-b border-white/5">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-8 py-5">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-white">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-6">
            <span className="text-sm font-bold text-slate-300">{name}</span>
            <LogoutButton />
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-3xl px-8 py-10">
        <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center">
          <p className="text-sm font-medium text-slate-500">{children}</p>
        </div>
      </main>
    </div>
  );
}
