"use server";

import { prisma } from "@/src/lib/db";

const GRADE_POINTS: Record<string, number> = {
  A: 4.0,
  B: 3.0,
  C: 2.0,
  D: 1.0,
  F: 0.0,
};
const PASSING = new Set(["A", "B", "C", "D"]);
const STUDENT_WARNING_LIMIT = 3;
const STUDENT_FINE = 200;
const INSTRUCTOR_WARNING_LIMIT = 3;

export type GradingEvaluation = {
  studentsGraded: number;
  honorRollEntries: number;
  terminations: number;
  studentWarnings: number;
  warningRemovals: number;
  studentSuspensions: number;
  instructorWarnings: number;
  instructorSuspensions: number;
};

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

function avgGpa(grades: string[]): number {
  if (grades.length === 0) return 0;
  const total = grades.reduce((s, g) => s + (GRADE_POINTS[g] ?? 0), 0);
  return total / grades.length;
}

/**
 * Runs UC-4 + UC-9 end-of-semester logic when the semester transitions
 * GRADING -> COMPLETED. All writes happen inside the caller's transaction
 * so the period flip and academic outcomes either all land or all roll
 * back.
 *
 * Performance notes:
 * - Pulls every relevant enrollment for the cohort in a single query.
 * - Pulls cumulative enrollments for the same student set in one more
 *   query (no per-student round-trips).
 * - Honor-roll-removes-warning is done with a single SQL update that
 *   targets the oldest unflagged warning per student.
 */
export async function evaluateGradingPeriod(
  tx: Tx,
  semesterId: number,
): Promise<GradingEvaluation> {
  const summary: GradingEvaluation = {
    studentsGraded: 0,
    honorRollEntries: 0,
    terminations: 0,
    studentWarnings: 0,
    warningRemovals: 0,
    studentSuspensions: 0,
    instructorWarnings: 0,
    instructorSuspensions: 0,
  };

  // --- 1. Per-course instructor accountability -----------------------------

  const courses = await tx.course.findMany({
    where: { semesterId, cancelled: false },
    select: {
      id: true,
      code: true,
      instructorId: true,
      enrollments: { select: { grade: true } },
    },
  });

  type InstrWarning = { userId: number; reason: string };
  const instructorWarnings: InstrWarning[] = [];

  for (const c of courses) {
    if (!c.instructorId) continue;
    const grades = c.enrollments.map((e) => e.grade).filter(Boolean) as string[];
    const total = c.enrollments.length;

    if (total > 0 && grades.length < total) {
      instructorWarnings.push({
        userId: c.instructorId,
        reason: `Course ${c.code}: ${total - grades.length} of ${total} students ungraded at end of GRADING.`,
      });
    }

    if (grades.length > 0) {
      const classAvg = avgGpa(grades);
      if (classAvg > 3.5 || classAvg < 2.5) {
        instructorWarnings.push({
          userId: c.instructorId,
          reason: `Course ${c.code}: class GPA ${classAvg.toFixed(2)} is outside the acceptable 2.5–3.5 range.`,
        });
      }
    }
  }

  if (instructorWarnings.length > 0) {
    await tx.warning.createMany({ data: instructorWarnings });
    // Tally warnings per instructor for the counter increment + suspend
    // cascade.
    const perInstructor = new Map<number, number>();
    for (const w of instructorWarnings) {
      perInstructor.set(w.userId, (perInstructor.get(w.userId) ?? 0) + 1);
    }
    summary.instructorWarnings = instructorWarnings.length;

    // One read of current counts so we can tell who crosses the limit.
    const ids = Array.from(perInstructor.keys());
    const current = await tx.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, warnings: true },
    });

    const toSuspend: number[] = [];
    for (const u of current) {
      const after = u.warnings + (perInstructor.get(u.id) ?? 0);
      if (after >= INSTRUCTOR_WARNING_LIMIT) toSuspend.push(u.id);
    }

    // Bulk increments: one updateMany per delta value (small set, usually 1).
    const deltaGroups = new Map<number, number[]>();
    for (const [userId, delta] of perInstructor) {
      const list = deltaGroups.get(delta) ?? [];
      list.push(userId);
      deltaGroups.set(delta, list);
    }
    for (const [delta, userIds] of deltaGroups) {
      await tx.user.updateMany({
        where: { id: { in: userIds } },
        data: { warnings: { increment: delta } },
      });
    }
    if (toSuspend.length > 0) {
      await tx.user.updateMany({
        where: { id: { in: toSuspend } },
        data: { suspended: true },
      });
      summary.instructorSuspensions = toSuspend.length;
    }
  }

  // --- 2. Per-student academic evaluation ---------------------------------

  // All enrollments graded this semester
  const semesterEnrollments = await tx.enrollment.findMany({
    where: {
      course: { semesterId },
      grade: { not: null },
    },
    select: {
      userId: true,
      grade: true,
      course: { select: { code: true } },
    },
  });

  if (semesterEnrollments.length === 0) {
    return summary;
  }

  const semesterGradesByStudent = new Map<number, string[]>();
  for (const e of semesterEnrollments) {
    const list = semesterGradesByStudent.get(e.userId) ?? [];
    list.push(e.grade as string);
    semesterGradesByStudent.set(e.userId, list);
  }
  summary.studentsGraded = semesterGradesByStudent.size;

  const studentIds = Array.from(semesterGradesByStudent.keys());

  // All graded enrollments (every semester) for those students — for
  // cumulative GPA + double-fail detection. One round-trip.
  const allGraded = await tx.enrollment.findMany({
    where: {
      userId: { in: studentIds },
      grade: { not: null },
    },
    select: {
      userId: true,
      grade: true,
      course: { select: { code: true, semesterId: true } },
    },
  });

  const cumulativeByStudent = new Map<number, string[]>();
  const failsByStudentCourse = new Map<string, number>(); // key: `${uid}:${code}`
  const semesterCountByStudent = new Map<number, Set<number>>();
  for (const e of allGraded) {
    const cum = cumulativeByStudent.get(e.userId) ?? [];
    cum.push(e.grade as string);
    cumulativeByStudent.set(e.userId, cum);

    if (e.grade === "F") {
      const key = `${e.userId}:${e.course.code}`;
      failsByStudentCourse.set(key, (failsByStudentCourse.get(key) ?? 0) + 1);
    }

    const semSet = semesterCountByStudent.get(e.userId) ?? new Set();
    semSet.add(e.course.semesterId);
    semesterCountByStudent.set(e.userId, semSet);
  }

  // Pull current student standing once
  const students = await tx.user.findMany({
    where: { id: { in: studentIds }, role: "STUDENT" },
    select: {
      id: true,
      warnings: true,
      terminated: true,
      suspended: true,
      graduated: true,
    },
  });
  const standingById = new Map(students.map((s) => [s.id, s]));

  const terminationIds: number[] = [];
  const studentWarningRows: { userId: number; reason: string }[] = [];
  const honorRollRows: { userId: number; semesterId: number; type: string }[] = [];
  const gpaUpdates: { userId: number; gpa: number }[] = [];

  for (const userId of studentIds) {
    const standing = standingById.get(userId);
    if (!standing || standing.terminated || standing.graduated) continue;

    const cumGrades = cumulativeByStudent.get(userId) ?? [];
    const semGrades = semesterGradesByStudent.get(userId) ?? [];
    const cumGpa = avgGpa(cumGrades);
    const semGpa = avgGpa(semGrades);
    const semCount = semesterCountByStudent.get(userId)?.size ?? 1;

    gpaUpdates.push({ userId, gpa: cumGpa });

    // Double-fail detection: any (uid, code) pair counted twice
    const doubleFail = Array.from(failsByStudentCourse.entries()).some(
      ([key, count]) =>
        key.startsWith(`${userId}:`) && count >= 2,
    );

    if (doubleFail) {
      terminationIds.push(userId);
      continue; // termination short-circuits warnings/honor
    }

    if (cumGpa < 2.0) {
      terminationIds.push(userId);
      continue;
    }

    if (cumGpa >= 2.0 && cumGpa < 2.25) {
      studentWarningRows.push({
        userId,
        reason: `Cumulative GPA ${cumGpa.toFixed(2)} is in the 2.00–2.25 probation range. Schedule an interview with the registrar.`,
      });
    }

    if (semGpa > 3.75) {
      honorRollRows.push({
        userId,
        semesterId,
        type: "SEMESTER",
      });
    }
    if (semCount > 1 && cumGpa > 3.5) {
      honorRollRows.push({
        userId,
        semesterId,
        type: "OVERALL",
      });
    }
  }

  // --- 3. Apply student-level outcomes ------------------------------------

  if (gpaUpdates.length > 0) {
    // One updateMany per distinct GPA value would be wasteful; loop is fine
    // for the small student count (~10 in the seed) but we batch via
    // grouping identical GPAs.
    const byGpa = new Map<number, number[]>();
    for (const u of gpaUpdates) {
      const key = Math.round(u.gpa * 1000); // dedupe to 3 decimals
      const list = byGpa.get(key) ?? [];
      list.push(u.userId);
      byGpa.set(key, list);
    }
    for (const [key, userIds] of byGpa) {
      await tx.user.updateMany({
        where: { id: { in: userIds } },
        data: { gpa: key / 1000 },
      });
    }
  }

  if (terminationIds.length > 0) {
    await tx.user.updateMany({
      where: { id: { in: terminationIds } },
      data: { terminated: true },
    });
    summary.terminations = terminationIds.length;
  }

  if (studentWarningRows.length > 0) {
    await tx.warning.createMany({ data: studentWarningRows });
    summary.studentWarnings = studentWarningRows.length;
  }

  if (honorRollRows.length > 0) {
    // SQLite createMany has no skipDuplicates. To stay idempotent, fetch
    // the existing (userId, semesterId, type) keys for this cohort and
    // filter the rows we'd insert.
    const existing = await tx.honorRoll.findMany({
      where: {
        semesterId,
        userId: { in: studentIds },
      },
      select: { userId: true, type: true },
    });
    const existingKeys = new Set(existing.map((e) => `${e.userId}:${e.type}`));
    const newRows = honorRollRows.filter(
      (r) => !existingKeys.has(`${r.userId}:${r.type}`),
    );
    if (newRows.length > 0) {
      await tx.honorRoll.createMany({ data: newRows });
    }
    summary.honorRollEntries = newRows.length;

    // Auto-remove one warning per honor roll: pick the oldest active
    // warning per honored student and flag it removed. Done one student at
    // a time because we need findFirst+update; the cohort is small so this
    // is acceptable.
    for (const row of honorRollRows) {
      const oldest = await tx.warning.findFirst({
        where: { userId: row.userId, removed: false },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });
      if (oldest) {
        await tx.warning.update({
          where: { id: oldest.id },
          data: { removed: true },
        });
        // Mark the honor roll entry as having been used.
        await tx.honorRoll.updateMany({
          where: {
            userId: row.userId,
            semesterId: row.semesterId,
            type: row.type,
          },
          data: { usedToRemoveWarning: true },
        });
        summary.warningRemovals += 1;
      }
    }
  }

  // Increment student warning counters in bulk
  if (studentWarningRows.length > 0) {
    const perStudent = new Map<number, number>();
    for (const w of studentWarningRows) {
      perStudent.set(w.userId, (perStudent.get(w.userId) ?? 0) + 1);
    }
    const deltaGroups = new Map<number, number[]>();
    for (const [userId, delta] of perStudent) {
      const list = deltaGroups.get(delta) ?? [];
      list.push(userId);
      deltaGroups.set(delta, list);
    }
    for (const [delta, userIds] of deltaGroups) {
      await tx.user.updateMany({
        where: { id: { in: userIds } },
        data: { warnings: { increment: delta } },
      });
    }
  }

  // Cascade: any student now at >= 3 warnings (not removed) → suspend
  // with fine. Read once after counter updates + warning removals.
  const updatedStudents = await tx.user.findMany({
    where: {
      id: { in: studentIds },
      role: "STUDENT",
      terminated: false,
      suspended: false,
    },
    select: { id: true, warnings: true },
  });
  // Use the actual active warning count (warnings field gets out of sync
  // when honor roll removes one). Recompute from Warning table for
  // anyone near the limit.
  const candidateIds = updatedStudents
    .filter((s) => s.warnings >= STUDENT_WARNING_LIMIT)
    .map((s) => s.id);

  if (candidateIds.length > 0) {
    const activeCounts = await tx.warning.groupBy({
      by: ["userId"],
      where: { userId: { in: candidateIds }, removed: false },
      _count: { _all: true },
    });
    const toSuspend = activeCounts
      .filter((c) => c._count._all >= STUDENT_WARNING_LIMIT)
      .map((c) => c.userId);

    if (toSuspend.length > 0) {
      await tx.user.updateMany({
        where: { id: { in: toSuspend } },
        data: { suspended: true, fineOwed: { increment: STUDENT_FINE } },
      });
      summary.studentSuspensions = toSuspend.length;
    }
  }

  return summary;
}
