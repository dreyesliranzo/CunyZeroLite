"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/src/lib/db";
import { getSession } from "@/src/lib/session";

type ActionResult = { success: boolean; error?: string; ok?: string };

export async function applyForGraduation(): Promise<ActionResult> {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") {
    return { success: false, error: "Only students can apply for graduation." };
  }

  const existing = await prisma.graduationRequest.findFirst({
    where: { userId: session.userId, status: "PENDING" },
    select: { id: true },
  });
  if (existing) {
    return { success: false, error: "You already have a pending graduation request." };
  }

  await prisma.graduationRequest.create({
    data: { userId: session.userId, status: "PENDING" },
  });

  revalidatePath("/student/graduation");
  revalidatePath("/registrar/graduations");
  revalidatePath("/registrar/dashboard");
  return { success: true, ok: "Graduation request submitted." };
}

export async function approveGraduation(
  formData: FormData,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session || session.role !== "REGISTRAR") {
    return { success: false, error: "Unauthorized." };
  }

  const id = Number(formData.get("id"));
  if (!Number.isFinite(id) || id <= 0) {
    return { success: false, error: "Invalid request id." };
  }

  // One transaction: flip request status + set graduated on user. Atomic so
  // we never end up with a graduated student and a pending request, or vice
  // versa.
  const req = await prisma.graduationRequest.findUnique({
    where: { id },
    select: { id: true, userId: true, status: true },
  });
  if (!req) return { success: false, error: "Request not found." };
  if (req.status !== "PENDING") {
    return { success: false, error: "Request is no longer pending." };
  }

  await prisma.$transaction([
    prisma.graduationRequest.update({
      where: { id },
      data: { status: "APPROVED" },
    }),
    prisma.user.update({
      where: { id: req.userId },
      data: { graduated: true },
    }),
  ]);

  revalidatePath("/registrar/graduations");
  revalidatePath("/registrar/dashboard");
  return { success: true };
}

export async function rejectGraduation(
  formData: FormData,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session || session.role !== "REGISTRAR") {
    return { success: false, error: "Unauthorized." };
  }

  const id = Number(formData.get("id"));
  const reason = String(formData.get("reason") ?? "").trim();
  if (!Number.isFinite(id) || id <= 0) {
    return { success: false, error: "Invalid request id." };
  }

  const req = await prisma.graduationRequest.findUnique({
    where: { id },
    select: { id: true, userId: true, status: true },
  });
  if (!req) return { success: false, error: "Request not found." };
  if (req.status !== "PENDING") {
    return { success: false, error: "Request is no longer pending." };
  }

  // Reject: per UC-13, "reckless" rejection issues a student warning.
  await prisma.$transaction([
    prisma.graduationRequest.update({
      where: { id },
      data: { status: "REJECTED" },
    }),
    prisma.warning.create({
      data: {
        userId: req.userId,
        reason: `Reckless graduation application. ${reason}`.trim(),
      },
    }),
    prisma.user.update({
      where: { id: req.userId },
      data: { warnings: { increment: 1 } },
    }),
  ]);

  revalidatePath("/registrar/graduations");
  revalidatePath("/registrar/dashboard");
  return { success: true };
}
