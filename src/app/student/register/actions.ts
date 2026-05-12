"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/src/lib/db";
import { getSession } from "@/src/lib/session";
import { findConflict } from "./schedule";

type ActionResult = { success: boolean; error?: string; ok?: string };

const FAILED_GRADES = new Set(["F"]);
const MAX_COURSES = 4;

export async function registerForCourse(
  formData: FormData,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") {
    return { success: false, error: "Only students can register." };
  }

  const courseId = Number(formData.get("courseId"));
  if (!Number.isFinite(courseId) || courseId <= 0) {
    return { success: false, error: "Invalid course id." };
  }

  // Pull everything we need in one trip — student standing, target course,
  // current enrollments. The transactions/checks live in JS but the round-
  // trips are minimised.
  const [user, course] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        suspended: true,
        terminated: true,
        fineOwed: true,
        enrollments: {
          where: { course: { semester: { isCurrent: true } } },
          select: {
            id: true,
            courseId: true,
            status: true,
            course: {
              select: { id: true, code: true, name: true, schedule: true },
            },
          },
        },
        // For the "retake only if previously failed" rule
      },
    }),
    prisma.course.findUnique({
      where: { id: courseId },
      include: {
        semester: { select: { period: true, isCurrent: true } },
        _count: { select: { enrollments: true } },
      },
    }),
  ]);

  if (!user) return { success: false, error: "User not found." };
  if (!course) return { success: false, error: "Course not found." };

  // Active = not displaced by a cancelled course. Cancelled enrollments
  // open the UC-17 special re-registration window during RUNNING.
  const activeEnrollments = user.enrollments.filter((e) => e.status !== "CANCELLED");
  const cancelledEnrollments = user.enrollments.filter((e) => e.status === "CANCELLED");

  if (user.terminated) {
    return { success: false, error: "Your account is terminated." };
  }
  if (user.suspended) {
    return {
      success: false,
      error: "Your account is suspended. Pay outstanding fines before registering.",
    };
  }
  if (course.cancelled) {
    return { success: false, error: "This course is cancelled." };
  }
  if (!course.semester.isCurrent) {
    return { success: false, error: "Course is not in the current semester." };
  }
  const inRegularRegistration = course.semester.period === "REGISTRATION";
  const inSpecialReregistration =
    course.semester.period === "RUNNING" && cancelledEnrollments.length > 0;
  if (!inRegularRegistration && !inSpecialReregistration) {
    return {
      success: false,
      error: `Registration is closed (semester period: ${course.semester.period}).`,
    };
  }

  if (activeEnrollments.some((e) => e.courseId === course.id)) {
    return { success: false, error: "Already enrolled in this course." };
  }
  if (activeEnrollments.length >= MAX_COURSES) {
    return { success: false, error: `Already at max ${MAX_COURSES} courses.` };
  }

  // Retake rule — only allowed if prior attempt resulted in F
  const prior = await prisma.enrollment.findFirst({
    where: {
      userId: user.id,
      course: { code: course.code, NOT: { id: course.id } },
    },
    select: { grade: true },
  });
  if (prior && !FAILED_GRADES.has(prior.grade ?? "")) {
    return {
      success: false,
      error: "You can only retake a course you previously failed (F).",
    };
  }

  const conflict = findConflict(
    course.schedule,
    activeEnrollments.map((e) => ({
      id: e.course.id,
      code: e.course.code,
      name: e.course.name,
      schedule: e.course.schedule,
    })),
  );
  if (conflict) {
    return {
      success: false,
      error: `Schedule conflict with ${conflict.code} ${conflict.name}.`,
    };
  }

  // Course full → join waitlist instead
  if (course._count.enrollments >= course.maxStudents) {
    const lastPosition = await prisma.waitlist.aggregate({
      where: { courseId: course.id, status: "WAITING" },
      _max: { position: true },
    });
    const nextPosition = (lastPosition._max.position ?? 0) + 1;
    try {
      await prisma.waitlist.create({
        data: {
          userId: user.id,
          courseId: course.id,
          position: nextPosition,
          status: "WAITING",
        },
      });
    } catch {
      return { success: false, error: "Already on the waitlist." };
    }
    revalidatePath("/student/register");
    revalidatePath("/student/dashboard");
    return {
      success: true,
      ok: `Course full. Added to waitlist at position ${nextPosition}.`,
    };
  }

  await prisma.enrollment.create({
    data: { userId: user.id, courseId: course.id, status: "ENROLLED" },
  });

  revalidatePath("/student/register");
  revalidatePath("/student/dashboard");
  return { success: true, ok: `Registered for ${course.code}.` };
}

export async function dropCourse(formData: FormData): Promise<ActionResult> {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") {
    return { success: false, error: "Only students can drop courses." };
  }

  const enrollmentId = Number(formData.get("enrollmentId"));
  if (!Number.isFinite(enrollmentId) || enrollmentId <= 0) {
    return { success: false, error: "Invalid enrollment id." };
  }

  // Conditional delete: must be the student's own enrollment, current
  // semester, registration period. count == 0 means rejected.
  const result = await prisma.enrollment.deleteMany({
    where: {
      id: enrollmentId,
      userId: session.userId,
      course: { semester: { isCurrent: true, period: "REGISTRATION" } },
    },
  });

  if (result.count === 0) {
    return {
      success: false,
      error: "Cannot drop. You can only drop your own courses during REGISTRATION.",
    };
  }

  revalidatePath("/student/register");
  revalidatePath("/student/dashboard");
  return { success: true, ok: "Course dropped." };
}

export async function leaveWaitlist(formData: FormData): Promise<ActionResult> {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") {
    return { success: false, error: "Unauthorized." };
  }
  const waitlistId = Number(formData.get("waitlistId"));
  if (!Number.isFinite(waitlistId) || waitlistId <= 0) {
    return { success: false, error: "Invalid id." };
  }

  await prisma.waitlist.deleteMany({
    where: { id: waitlistId, userId: session.userId },
  });
  revalidatePath("/student/register");
  return { success: true };
}

export async function admitFromWaitlist(
  formData: FormData,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session || session.role !== "INSTRUCTOR") {
    return { success: false, error: "Unauthorized." };
  }

  const waitlistId = Number(formData.get("waitlistId"));
  if (!Number.isFinite(waitlistId) || waitlistId <= 0) {
    return { success: false, error: "Invalid id." };
  }

  const entry = await prisma.waitlist.findUnique({
    where: { id: waitlistId },
    include: {
      user: { select: { id: true, suspended: true, terminated: true } },
      course: { select: { id: true, instructorId: true } },
    },
  });
  if (!entry) return { success: false, error: "Waitlist entry not found." };
  if (entry.course.instructorId !== session.userId) {
    return { success: false, error: "Not your course." };
  }
  if (entry.status !== "WAITING") {
    return { success: false, error: "Entry is not waiting." };
  }
  if (entry.user.suspended || entry.user.terminated) {
    return {
      success: false,
      error: "Student is suspended or terminated; cannot admit.",
    };
  }

  // Atomic: set waitlist status, create enrollment, shift positions of
  // remaining WAITING entries down by one.
  await prisma.$transaction(async (tx) => {
    await tx.waitlist.update({
      where: { id: waitlistId },
      data: { status: "ADMITTED" },
    });
    await tx.enrollment.create({
      data: {
        userId: entry.userId,
        courseId: entry.courseId,
        status: "ENROLLED",
      },
    });
    await tx.waitlist.updateMany({
      where: {
        courseId: entry.courseId,
        status: "WAITING",
        position: { gt: entry.position },
      },
      data: { position: { decrement: 1 } },
    });
  });

  revalidatePath(`/instructor/courses/${entry.courseId}/waitlist`);
  return { success: true };
}
