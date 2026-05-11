"use server";

import { prisma } from "@/src/lib/db";

/**
 * Assigns a grade to a specific enrollment within a course taught by an instructor.
 *
 * @param instructorId The ID of the instructor attempting to assign the grade.
 * @param courseId The ID of the course the enrollment belongs to.
 * @param enrollmentId The ID of the enrollment to update.
 * @param grade The grade to assign (e.g., "A", "B+", "F").
 * @returns An object indicating success or failure, with a message.
 */
export async function assignGradeToEnrollment(
  instructorId: number,
  courseId: number,
  enrollmentId: number,
  grade: string,
) {
  try {
    // 1. Verify that the instructor teaches this course
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        instructorId: instructorId,
      },
    });

    if (!course) {
      return { success: false, error: "Instructor does not teach this course or course not found." };
    }

    // 2. Verify that the enrollment belongs to this course
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        id: enrollmentId,
        courseId: courseId,
      },
    });

    if (!enrollment) {
      return { success: false, error: "Enrollment not found for this course." };
    }

    // 3. Update the grade for the enrollment
    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { grade: grade },
    });

    return { success: true, message: `Grade '${grade}' assigned to enrollment ${enrollmentId} in course ${course.name}.` };
  } catch (error) {
    console.error("Error assigning grade:", error);
    return { success: false, error: "Failed to assign grade due to a server error." };
  }
}
