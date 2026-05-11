"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/src/lib/db";
import { getSession } from "@/src/lib/session";

type ActionResult = { success: boolean; error?: string; ok?: string };

export async function submitComplaint(
  formData: FormData,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session || (session.role !== "STUDENT" && session.role !== "INSTRUCTOR")) {
    return { success: false, error: "Only students or instructors can file complaints." };
  }

  const targetId = Number(formData.get("targetId"));
  const description = String(formData.get("description") ?? "").trim();

  if (!Number.isFinite(targetId) || targetId <= 0) {
    return { success: false, error: "Please select a target user." };
  }
  if (targetId === session.userId) {
    return { success: false, error: "You cannot file a complaint against yourself." };
  }
  if (!description) {
    return { success: false, error: "Please describe the complaint." };
  }

  // Single existence check — combined with create via referential integrity
  // would be cleaner, but we want a friendly error message.
  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true, role: true },
  });
  if (!target) return { success: false, error: "Target user not found." };

  await prisma.complaint.create({
    data: {
      filerId: session.userId,
      targetId,
      description,
      status: "PENDING",
    },
  });

  revalidatePath("/complaints");
  revalidatePath("/registrar/complaints");
  revalidatePath("/registrar/dashboard");
  return { success: true, ok: "Complaint submitted for registrar review." };
}

type Resolution = "WARN" | "DEREGISTER" | "DISMISS" | "WARN_FILER";

export async function resolveComplaint(
  formData: FormData,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session || session.role !== "REGISTRAR") {
    return { success: false, error: "Unauthorized." };
  }

  const id = Number(formData.get("id"));
  const action = String(formData.get("action") ?? "") as Resolution;
  const note = String(formData.get("note") ?? "").trim();

  if (!Number.isFinite(id) || id <= 0) {
    return { success: false, error: "Invalid complaint id." };
  }
  if (!["WARN", "DEREGISTER", "DISMISS", "WARN_FILER"].includes(action)) {
    return { success: false, error: "Invalid action." };
  }

  const complaint = await prisma.complaint.findUnique({
    where: { id },
    include: {
      target: { select: { id: true, role: true, warnings: true } },
      filer: { select: { id: true, role: true } },
    },
  });
  if (!complaint) return { success: false, error: "Complaint not found." };
  if (complaint.status !== "PENDING") {
    return { success: false, error: "Complaint already resolved." };
  }

  // Single transaction = atomic. Grouping all writes minimises DB round-trips
  // (one BEGIN/COMMIT) and prevents partial state if anything fails.
  await prisma.$transaction(async (tx) => {
    if (action === "DISMISS") {
      await tx.complaint.update({
        where: { id },
        data: { status: "DISMISSED", resolution: note || "Dismissed." },
      });
      return;
    }

    if (action === "WARN_FILER") {
      const reason = note || `Unjustified complaint against user #${complaint.targetId}`;
      await tx.warning.create({
        data: { userId: complaint.filerId, reason },
      });
      await tx.user.update({
        where: { id: complaint.filerId },
        data: { warnings: { increment: 1 } },
      });
      await tx.complaint.update({
        where: { id },
        data: { status: "RESOLVED", resolution: `Filer warned. ${note}`.trim() },
      });
      return;
    }

    if (action === "WARN") {
      await tx.warning.create({
        data: {
          userId: complaint.targetId,
          reason: note || `Complaint by user #${complaint.filerId}`,
        },
      });
      const updated = await tx.user.update({
        where: { id: complaint.targetId },
        data: { warnings: { increment: 1 } },
        select: { warnings: true, role: true },
      });
      // 3rd warning → student auto-suspends + fineOwed
      if (updated.role === "STUDENT" && updated.warnings >= 3) {
        await tx.user.update({
          where: { id: complaint.targetId },
          data: { suspended: true, fineOwed: { increment: 200 } },
        });
      }
      await tx.complaint.update({
        where: { id },
        data: { status: "RESOLVED", resolution: `Warning issued. ${note}`.trim() },
      });
      return;
    }

    if (action === "DEREGISTER") {
      // Drop all current-semester enrollments for the target student.
      await tx.enrollment.deleteMany({
        where: {
          userId: complaint.targetId,
          course: { semester: { isCurrent: true } },
        },
      });
      await tx.complaint.update({
        where: { id },
        data: { status: "RESOLVED", resolution: `De-registered. ${note}`.trim() },
      });
    }
  });

  revalidatePath("/registrar/complaints");
  revalidatePath("/registrar/dashboard");
  return { success: true };
}
