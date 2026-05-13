"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/src/lib/db";
import { getSession } from "@/src/lib/session";

type ActionResult = { success: boolean; error?: string };

async function requireRegistrar(): Promise<ActionResult | null> {
  const session = await getSession();
  if (!session || session.role !== "REGISTRAR") {
    return { success: false, error: "Unauthorized." };
  }
  return null;
}

function makeEmail(firstName: string, lastName: string) {
  const cleanFirst = firstName.trim().toLowerCase();
  const cleanLast = lastName.trim().toLowerCase().replace(/[^a-z]/g, "");
  return `${cleanFirst[0] ?? ""}${cleanLast}00@cuny.edu`;
}

function makeTempPassword() {
  return "TempPass" + Math.floor(1000 + Math.random() * 9000);
}

export async function approveApplication(
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireRegistrar();
  if (denied) return denied;

  const id = Number(formData.get("id"));
  if (!Number.isFinite(id) || id <= 0) {
    return { success: false, error: "Invalid application id." };
  }

  const app = await prisma.application.findUnique({ where: { id } });
  if (!app) return { success: false, error: "Application not found." };
  if (app.status !== "PENDING") {
    return { success: false, error: "Application is no longer pending." };
  }

  const generatedEmail = makeEmail(app.firstName, app.lastName);
  const conflict = await prisma.user.findFirst({
    where: { OR: [{ email: generatedEmail }, { username: generatedEmail }] },
  });
  if (conflict) {
    return {
      success: false,
      error: `Generated email ${generatedEmail} already in use. Manual review needed.`,
    };
  }

  const tempPassword = makeTempPassword();

  const user = await prisma.user.create({
    data: {
      email: generatedEmail,
      username: generatedEmail,
      password: tempPassword,
      firstName: app.firstName,
      lastName: app.lastName,
      role: app.type === "INSTRUCTOR" ? "INSTRUCTOR" : "STUDENT",
      gpa: app.priorGpa ?? 0.0,
      mustChangePassword: true,
    },
  });

  await prisma.application.update({
    where: { id },
    data: { status: "ACCEPTED", userId: user.id },
  });

  revalidatePath("/registrar/applications");
  revalidatePath("/registrar/dashboard");
  return { success: true };
}

export async function rejectApplication(
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireRegistrar();
  if (denied) return denied;

  const id = Number(formData.get("id"));
  if (!Number.isFinite(id) || id <= 0) {
    return { success: false, error: "Invalid application id." };
  }
  const reason = String(formData.get("reason") ?? "").trim();

  const app = await prisma.application.findUnique({ where: { id } });
  if (!app) return { success: false, error: "Application not found." };
  if (app.status !== "PENDING") {
    return { success: false, error: "Application is no longer pending." };
  }

  const isQualifiedStudent =
    app.type === "STUDENT" && (app.priorGpa ?? 0) > 3.0;
  if (isQualifiedStudent && !reason) {
    return {
      success: false,
      error: "A written justification is required to reject a qualified student (GPA > 3.0).",
    };
  }

  await prisma.application.update({
    where: { id },
    data: { status: "REJECTED", rejectionReason: reason || null },
  });

  revalidatePath("/registrar/applications");
  revalidatePath("/registrar/dashboard");
  return { success: true };
}
