"use server";

import { prisma } from "@/src/lib/db";

/**
 * Files a complaint by a student or instructor against another user.
 *
 * @param filerId The ID of the user filing the complaint (student or instructor).
 * @param targetId The ID of the user the complaint is against.
 * @param description The detailed description of the complaint.
 * @param filerRole The role of the user filing the complaint (to ensure authorization).
 * @returns An object indicating success or failure, with a message.
 */
export async function fileComplaint(
  filerId: number,
  targetId: number,
  description: string,
  filerRole: string, // Expecting 'STUDENT' or 'INSTRUCTOR' as a string
) {
  if (!description || description.trim().length === 0) {
    return { success: false, error: "Complaint description cannot be empty." };
  }

  if (filerId === targetId) {
    return { success: false, error: "Cannot file a complaint against yourself." };
  }

  // Define allowed roles for filing complaints
  const allowedFilerRoles = ["STUDENT", "INSTRUCTOR"];
  if (!allowedFilerRoles.includes(filerRole)) {
    return { success: false, error: "Invalid filer role provided. Only 'STUDENT' or 'INSTRUCTOR' can file complaints." };
  }

  try {
    // 1. Verify filer exists and has the correct role
    const filer = await prisma.user.findUnique({
      where: { id: filerId },
      select: { id: true, role: true },
    });

    if (!filer) {
      return { success: false, error: "Filer not found." };
    }

    if (filer.role !== filerRole || !allowedFilerRoles.includes(filer.role)) {
      return { success: false, error: "Unauthorized: Only students or instructors can file complaints." };
    }

    // 2. Verify target exists
    const target = await prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true },
    });

    if (!target) {
      return { success: false, error: "Target user not found." };
    }

    // 3. Create the complaint
    const complaint = await prisma.complaint.create({
      data: {
        description: description.trim(),
        filerId: filerId,
        targetId: targetId,
        status: "PENDING", // Default status as per schema
      },
    });

    return {
      success: true,
      message: `Complaint filed successfully (ID: ${complaint.id}). It is now pending review by the Registrar.`,
      complaintId: complaint.id,
    };
  } catch (error) {
    console.error("Error filing complaint:", error);
    // More specific error handling could be added here, e.g., for database constraints
    return { success: false, error: "Failed to file complaint due to a server error." };
  }
}
