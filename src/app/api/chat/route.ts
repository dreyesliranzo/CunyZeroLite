import { NextRequest, NextResponse } from "next/server";
import { getAIResponse } from "@/src/lib/ai";
import { getSession } from "@/src/lib/session";
import { prisma } from "@/src/lib/db";

const PASSING = ["A", "B", "C", "D"];

async function buildStudentContext(userId: number): Promise<string> {
  const [user, enrollments, passingCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true, lastName: true, email: true,
        gpa: true, warnings: true, suspended: true, terminated: true,
        graduated: true, fineOwed: true,
      },
    }),
    prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            code: true, name: true, schedule: true,
            semester: { select: { name: true, period: true } },
            instructor: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.enrollment.count({
      where: { userId, grade: { in: PASSING } },
    }),
  ]);
  if (!user) return "";

  const current = enrollments.filter((e) => e.status === "ENROLLED");
  const past = enrollments.filter((e) => e.grade);

  const fmtCourse = (e: typeof enrollments[0]) =>
    `${e.course.code} ${e.course.name} — ${e.course.semester.name}` +
    (e.course.instructor ? ` (Prof. ${e.course.instructor.lastName})` : "") +
    (e.grade ? ` [grade: ${e.grade}]` : ` [schedule: ${e.course.schedule}]`);

  return [
    `Role: STUDENT`,
    `Name: ${user.firstName} ${user.lastName}`,
    `Email: ${user.email}`,
    `Current GPA: ${user.gpa.toFixed(2)}`,
    `Active warnings: ${user.warnings}`,
    `Suspended: ${user.suspended ? "yes" : "no"}`,
    `Terminated: ${user.terminated ? "yes" : "no"}`,
    `Graduated: ${user.graduated ? "yes" : "no"}`,
    `Fine owed: $${user.fineOwed.toFixed(2)}`,
    `Passing courses completed: ${passingCount} of 8 required for graduation`,
    `Eligible to apply for graduation: ${passingCount >= 8 ? "yes" : "no (under 8 passing)"}`,
    ``,
    `Current enrollments (${current.length}):`,
    ...current.map((e) => `  - ${fmtCourse(e)}`),
    ``,
    `Past completed courses (${past.length}):`,
    ...past.map((e) => `  - ${fmtCourse(e)}`),
  ].join("\n");
}

async function buildInstructorContext(userId: number): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true, lastName: true, email: true, warnings: true, fired: true },
  });
  const courses = await prisma.course.findMany({
    where: { instructorId: userId },
    include: {
      semester: { select: { name: true, period: true } },
      _count: { select: { enrollments: true } },
      reviews: { where: { hidden: false }, select: { rating: true } },
    },
    orderBy: [{ semester: { year: "desc" } }, { code: "asc" }],
  });
  if (!user) return "";

  const fmtCourse = (c: typeof courses[0]) => {
    const ratings = c.reviews.map((r) => r.rating);
    const avg = ratings.length > 0
      ? (ratings.reduce((s, r) => s + r, 0) / ratings.length).toFixed(2)
      : "no reviews";
    return `${c.code} ${c.name} — ${c.semester.name}` +
      ` [${c._count.enrollments} enrolled, avg rating ${avg}]` +
      (c.cancelled ? " (CANCELLED)" : "");
  };

  return [
    `Role: INSTRUCTOR`,
    `Name: ${user.firstName} ${user.lastName}`,
    `Email: ${user.email}`,
    `Active warnings: ${user.warnings}`,
    `Fired: ${user.fired ? "yes" : "no"}`,
    ``,
    `Courses taught (${courses.length}):`,
    ...courses.map((c) => `  - ${fmtCourse(c)}`),
  ].join("\n");
}

async function buildRegistrarContext(): Promise<string> {
  const [pendingApps, pendingComplaints, pendingGrads, currentSemester, totalUsers, totalCourses] =
    await Promise.all([
      prisma.application.count({ where: { status: "PENDING" } }),
      prisma.complaint.count({ where: { status: "PENDING" } }),
      prisma.graduationRequest.count({ where: { status: "PENDING" } }),
      prisma.semester.findFirst({ where: { isCurrent: true } }),
      prisma.user.count(),
      prisma.course.count(),
    ]);

  return [
    `Role: REGISTRAR`,
    ``,
    `Pending queue counts:`,
    `  - Visitor applications awaiting review: ${pendingApps}`,
    `  - Complaints awaiting processing: ${pendingComplaints}`,
    `  - Graduation requests awaiting decision: ${pendingGrads}`,
    ``,
    `Current semester: ${currentSemester?.name ?? "none"} (period: ${currentSemester?.period ?? "n/a"})`,
    `Total users in system: ${totalUsers}`,
    `Total courses in system: ${totalCourses}`,
  ].join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const { message, chatType } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const session = await getSession();
    let userContext: string | undefined;
    let resolvedType: "home" | "portal" = chatType === "portal" ? "portal" : "home";

    if (session) {
      resolvedType = "portal";
      if (session.role === "STUDENT") userContext = await buildStudentContext(session.userId);
      else if (session.role === "INSTRUCTOR") userContext = await buildInstructorContext(session.userId);
      else if (session.role === "REGISTRAR") userContext = await buildRegistrarContext();
    }

    const reply = await getAIResponse(message.trim(), resolvedType, userContext);
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to get a response. Please try again." },
      { status: 500 }
    );
  }
}
