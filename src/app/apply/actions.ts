"use server";

import { prisma } from "@/src/lib/db";
import type { ActionResult } from "./types";

function makeEmail(firstName: string, lastName: string) {
  const cleanFirst = firstName.trim().toLowerCase();
  const cleanLast = lastName.trim().toLowerCase().replace(/[^a-z]/g, "");
  return `${cleanFirst[0] ?? ""}${cleanLast}00@cuny.edu`;
}

function makeTempPassword() {
  return Math.random().toString(36).slice(2, 10);
}

export async function submitApplication(
  formData: FormData,
): Promise<ActionResult> {
  const type = String(formData.get("type") ?? "").trim().toUpperCase();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const emailRaw = String(formData.get("email") ?? "").trim().toLowerCase();
  const justification = String(formData.get("justification") ?? "").trim();
  const priorGpaRaw = String(formData.get("priorGpa") ?? "").trim();

  if (type !== "STUDENT" && type !== "INSTRUCTOR") {
    return { success: false, error: "Please select a role to apply for." };
  }
  if (!firstName || !lastName) {
    return { success: false, error: "First and last name are required." };
  }
  if (!emailRaw || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) {
    return { success: false, error: "A valid contact email is required." };
  }

  let priorGpa: number | null = null;
  if (type === "STUDENT") {
    if (!priorGpaRaw) {
      return { success: false, error: "Prior GPA is required for student applications." };
    }
    const parsed = Number(priorGpaRaw);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 4) {
      return { success: false, error: "Prior GPA must be between 0.0 and 4.0." };
    }
    priorGpa = parsed;
    if (!justification) {
      return { success: false, error: "Please provide a written justification." };
    }
  }

  const generatedEmail = makeEmail(firstName, lastName);
  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ email: emailRaw }, { email: generatedEmail }] },
  });
  if (existingUser) {
    return {
      success: false,
      error: "A user with this name or email is already in the system.",
    };
  }

  const duplicate = await prisma.application.findFirst({
    where: { email: emailRaw, status: "PENDING" },
  });
  if (duplicate) {
    return {
      success: false,
      error: "A pending application already exists for this email.",
    };
  }

  // Spec rule: STUDENT applications with GPA > 3.0 should be auto-accepted
  // when the program quota is not full. INSTRUCTOR applications still need
  // manual review by the registrar.
  let autoAccepted = false;
  let createdUser: { email: string; tempPassword: string } | null = null;

  if (type === "STUDENT" && priorGpa !== null && priorGpa > 3.0) {
    const currentSemester = await prisma.semester.findFirst({
      where: { isCurrent: true },
      select: { programQuota: true },
    });
    const activeStudents = await prisma.user.count({
      where: { role: "STUDENT", terminated: false, graduated: false },
    });
    const quota = currentSemester?.programQuota ?? 50;
    if (activeStudents < quota) {
      autoAccepted = true;
    }
  }

  if (autoAccepted) {
    const tempPassword = makeTempPassword();
    const user = await prisma.user.create({
      data: {
        email: generatedEmail,
        username: generatedEmail,
        password: tempPassword,
        firstName,
        lastName,
        role: "STUDENT",
        gpa: priorGpa ?? 0,
        mustChangePassword: true,
      },
    });
    await prisma.application.create({
      data: {
        type,
        status: "ACCEPTED",
        firstName,
        lastName,
        email: emailRaw,
        priorGpa,
        justification: justification || null,
        userId: user.id,
      },
    });
    createdUser = { email: generatedEmail, tempPassword };
    return {
      success: true,
      ok: `Application auto-approved (GPA ${priorGpa!.toFixed(2)} > 3.0). Your login email is ${createdUser.email} and temporary password is ${createdUser.tempPassword}. You will be asked to change it on first sign-in.`,
    };
  }

  await prisma.application.create({
    data: {
      type,
      status: "PENDING",
      firstName,
      lastName,
      email: emailRaw,
      priorGpa,
      justification: justification || null,
    },
  });

  return {
    success: true,
    ok: "Application submitted. The registrar will review it shortly.",
  };
}
