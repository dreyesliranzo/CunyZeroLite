"use server";

import { prisma } from "@/src/lib/db";

const MIN_STUDENTS_PER_COURSE = 3;
const MIN_COURSES_PER_STUDENT = 2;

export type RunningEvaluation = {
  cancelledCourses: number;
  warnedInstructors: number;
  suspendedInstructors: number;
  warnedStudents: number;
  displacedStudents: number;
};

/**
 * Runs UC-17 enforcement when a semester transitions into RUNNING:
 *   - cancel courses with fewer than 3 enrolled students
 *   - warn instructors of cancelled courses
 *   - suspend instructors whose every course in this semester is cancelled
 *   - warn students enrolled in fewer than 2 active courses
 *
 * All writes happen in one transaction so the period flip and the
 * downstream effects either all land or all roll back. Reads use groupBy
 * so headcounts are computed in a single SQL query each rather than N+1.
 */
export async function evaluateRunningPeriod(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  semesterId: number,
): Promise<RunningEvaluation> {
  // 1. Per-course enrollment count for this semester
  const courseCounts = await tx.enrollment.groupBy({
    by: ["courseId"],
    where: { course: { semesterId } },
    _count: { _all: true },
  });
  const enrollmentByCourse = new Map(
    courseCounts.map((row) => [row.courseId, row._count._all]),
  );

  // 2. All non-cancelled courses for this semester
  const allCourses = await tx.course.findMany({
    where: { semesterId, cancelled: false },
    select: { id: true, code: true, instructorId: true },
  });

  const toCancel = allCourses.filter(
    (c) => (enrollmentByCourse.get(c.id) ?? 0) < MIN_STUDENTS_PER_COURSE,
  );
  const cancelIds = toCancel.map((c) => c.id);

  let displacedStudents = 0;
  if (cancelIds.length > 0) {
    await tx.course.updateMany({
      where: { id: { in: cancelIds } },
      data: { cancelled: true },
    });
    // Mark affected enrollments as CANCELLED so they no longer count
    // as active and the student is eligible for the special
    // re-registration window during RUNNING (UC-17 spec).
    const affected = await tx.enrollment.findMany({
      where: { courseId: { in: cancelIds }, status: "ENROLLED" },
      select: { userId: true },
    });
    if (affected.length > 0) {
      await tx.enrollment.updateMany({
        where: { courseId: { in: cancelIds }, status: "ENROLLED" },
        data: { status: "CANCELLED" },
      });
      displacedStudents = new Set(affected.map((a) => a.userId)).size;
    }
  }

  // 3. Warn instructors of cancelled courses (skip nulls / dupes)
  const instructorWarnings = toCancel
    .filter((c): c is typeof c & { instructorId: number } => c.instructorId !== null)
    .map((c) => ({
      userId: c.instructorId,
      reason: `Course ${c.code} cancelled — fewer than ${MIN_STUDENTS_PER_COURSE} enrolled.`,
    }));
  if (instructorWarnings.length > 0) {
    await tx.warning.createMany({ data: instructorWarnings });
    const ids = Array.from(new Set(instructorWarnings.map((w) => w.userId)));
    await tx.user.updateMany({
      where: { id: { in: ids } },
      data: { warnings: { increment: 1 } },
    });
  }

  // 4. Suspend instructors whose every course in this semester is now
  // cancelled. Compare uncancelled count after the bulk update.
  const remainingByInstructor = await tx.course.groupBy({
    by: ["instructorId"],
    where: { semesterId, cancelled: false, instructorId: { not: null } },
    _count: { _all: true },
  });
  const stillTeachingInstructors = new Set(
    remainingByInstructor.map((r) => r.instructorId).filter(Boolean) as number[],
  );

  const candidateSuspendIds = Array.from(
    new Set(
      toCancel
        .filter((c) => c.instructorId !== null)
        .map((c) => c.instructorId as number),
    ),
  );
  const suspendIds = candidateSuspendIds.filter(
    (id) => !stillTeachingInstructors.has(id),
  );

  if (suspendIds.length > 0) {
    await tx.user.updateMany({
      where: { id: { in: suspendIds } },
      data: { suspended: true },
    });
  }

  // 5. Warn students with < 2 active enrollments in this semester. Active
  // means the underlying course is not cancelled — recompute after step 2.
  const activeCounts = await tx.enrollment.groupBy({
    by: ["userId"],
    where: {
      course: { semesterId, cancelled: false },
    },
    _count: { _all: true },
  });
  const activeByStudent = new Map(
    activeCounts.map((r) => [r.userId, r._count._all]),
  );

  // We also want to warn students who have 0 active enrollments. Pull the
  // full student set once and combine.
  const allStudents = await tx.user.findMany({
    where: {
      role: "STUDENT",
      terminated: false,
      graduated: false,
      suspended: false,
    },
    select: { id: true },
  });

  const studentsToWarn = allStudents
    .map((s) => s.id)
    .filter((id) => (activeByStudent.get(id) ?? 0) < MIN_COURSES_PER_STUDENT);

  if (studentsToWarn.length > 0) {
    const data = studentsToWarn.map((userId) => ({
      userId,
      reason: `Enrolled in fewer than ${MIN_COURSES_PER_STUDENT} active courses for this semester.`,
    }));
    await tx.warning.createMany({ data });
    await tx.user.updateMany({
      where: { id: { in: studentsToWarn } },
      data: { warnings: { increment: 1 } },
    });
  }

  return {
    cancelledCourses: toCancel.length,
    warnedInstructors: instructorWarnings.length,
    suspendedInstructors: suspendIds.length,
    warnedStudents: studentsToWarn.length,
    displacedStudents,
  };
}
