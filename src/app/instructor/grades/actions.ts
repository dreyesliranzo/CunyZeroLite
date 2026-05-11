"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/src/lib/db";
import { getSession } from "@/src/lib/session";

type ActionResult = { success: boolean; error?: string; ok?: string };

const VALID_GRADES = new Set(["A", "B", "C", "D", "F"]);

export async function saveGrade(formData: FormData): Promise<ActionResult> {
  const session = await getSession();
  if (!session || session.role !== "INSTRUCTOR") {
    return { success: false, error: "Unauthorized." };
  }

  const courseId = Number(formData.get("courseId"));
  const enrollmentId = Number(formData.get("enrollmentId"));
  const grade = String(formData.get("grade") ?? "").trim().toUpperCase();

  if (!Number.isFinite(courseId) || !Number.isFinite(enrollmentId)) {
    return { success: false, error: "Invalid course or enrollment id." };
  }
  if (!VALID_GRADES.has(grade)) {
    return { success: false, error: "Grade must be one of A, B, C, D, F." };
  }

  // Single conditional update — verifies instructor owns the course AND
  // semester is in GRADING in one round-trip. Returns count = 0 on any miss.
  const result = await prisma.enrollment.updateMany({
    where: {
      id: enrollmentId,
      courseId,
      course: {
        instructorId: session.userId,
        semester: { period: "GRADING" },
      },
    },
    data: { grade },
  });

  if (result.count === 0) {
    return {
      success: false,
      error:
        "Cannot save grade. Verify you teach this course and the semester is in GRADING.",
    };
  }

  revalidatePath(`/instructor/grades/${courseId}`);
  revalidatePath("/instructor/dashboard");
  return { success: true, ok: `Saved ${grade}.` };
}
