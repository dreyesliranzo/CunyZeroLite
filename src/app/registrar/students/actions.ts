"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/src/lib/session";
import { prisma } from "@/src/lib/db";

type ActionResult = { success: boolean; error?: string; ok?: string };

export async function clearFineAndReinstate(formData: FormData): Promise<ActionResult> {
  const session = await getSession();
  if (!session || session.role !== "REGISTRAR") {
    return { success: false, error: "Only registrars can clear fines." };
  }

  const userId = Number(formData.get("userId"));
  if (!Number.isFinite(userId) || userId <= 0) {
    return { success: false, error: "Invalid user id." };
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, suspended: true, terminated: true, fineOwed: true },
  });
  if (!target) return { success: false, error: "User not found." };
  if (target.role !== "STUDENT") {
    return { success: false, error: "Only student fines can be cleared here." };
  }
  if (target.terminated) {
    return { success: false, error: "Terminated accounts cannot be reinstated." };
  }
  if (target.fineOwed <= 0 && !target.suspended) {
    return { success: false, error: "No fine to clear and account is not suspended." };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { fineOwed: 0, suspended: false },
  });

  revalidatePath("/registrar/students");
  return { success: true, ok: "Fine cleared and account reinstated." };
}
