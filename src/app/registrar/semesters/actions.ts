"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/src/lib/db";
import { getSession } from "@/src/lib/session";
import type { ActionResult, Period } from "./periods";
import { evaluateRunningPeriod } from "./runningRules";

const NEXT_PERIOD: Record<Period, Period | null> = {
  CLASS_SETUP: "REGISTRATION",
  REGISTRATION: "RUNNING",
  RUNNING: "GRADING",
  GRADING: "COMPLETED",
  COMPLETED: null,
};

async function requireRegistrar(): Promise<ActionResult | null> {
  const session = await getSession();
  if (!session || session.role !== "REGISTRAR") {
    return { success: false, error: "Unauthorized." };
  }
  return null;
}

function getSemesterId(formData: FormData): number | null {
  const raw = formData.get("semesterId");
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export async function advancePeriod(formData: FormData): Promise<ActionResult> {
  const denied = await requireRegistrar();
  if (denied) return denied;

  const id = getSemesterId(formData);
  if (!id) return { success: false, error: "Invalid semester id." };

  const semester = await prisma.semester.findUnique({ where: { id } });
  if (!semester) return { success: false, error: "Semester not found." };

  const next = NEXT_PERIOD[semester.period as Period];
  if (!next) {
    return { success: false, error: "Semester is already completed." };
  }

  // Wrap the period flip + UC-17 enforcement in one transaction so the
  // semester never ends up in RUNNING with un-enforced rules.
  const summary = await prisma.$transaction(async (tx) => {
    await tx.semester.update({
      where: { id },
      data: {
        period: next,
        ...(next === "COMPLETED" ? { isCurrent: false } : {}),
      },
    });
    if (next === "RUNNING") {
      return evaluateRunningPeriod(tx, id);
    }
    return null;
  });

  revalidatePath("/registrar/semesters");
  revalidatePath("/registrar/dashboard");
  revalidatePath("/registrar/courses");

  if (summary) {
    const parts = [
      summary.cancelledCourses > 0 && `${summary.cancelledCourses} course${summary.cancelledCourses !== 1 ? "s" : ""} cancelled`,
      summary.warnedInstructors > 0 && `${summary.warnedInstructors} instructor warning${summary.warnedInstructors !== 1 ? "s" : ""}`,
      summary.suspendedInstructors > 0 && `${summary.suspendedInstructors} instructor${summary.suspendedInstructors !== 1 ? "s" : ""} suspended`,
      summary.warnedStudents > 0 && `${summary.warnedStudents} student warning${summary.warnedStudents !== 1 ? "s" : ""}`,
    ].filter(Boolean) as string[];
    return {
      success: true,
      ok: parts.length > 0 ? `Now RUNNING. ${parts.join(", ")}.` : "Now RUNNING. No changes triggered.",
    };
  }

  return { success: true };
}

export async function setCurrentSemester(
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireRegistrar();
  if (denied) return denied;

  const id = getSemesterId(formData);
  if (!id) return { success: false, error: "Invalid semester id." };

  const semester = await prisma.semester.findUnique({ where: { id } });
  if (!semester) return { success: false, error: "Semester not found." };
  if (semester.period === "COMPLETED") {
    return {
      success: false,
      error: "Cannot set a completed semester as current.",
    };
  }

  await prisma.$transaction([
    prisma.semester.updateMany({
      where: { isCurrent: true },
      data: { isCurrent: false },
    }),
    prisma.semester.update({
      where: { id },
      data: { isCurrent: true },
    }),
  ]);

  revalidatePath("/registrar/semesters");
  revalidatePath("/registrar/dashboard");
  return { success: true };
}

export async function createSemester(
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireRegistrar();
  if (denied) return denied;

  const name = String(formData.get("name") ?? "").trim();
  const term = String(formData.get("term") ?? "").trim();
  const yearRaw = String(formData.get("year") ?? "").trim();
  const startRaw = String(formData.get("startDate") ?? "").trim();
  const endRaw = String(formData.get("endDate") ?? "").trim();
  const quotaRaw = String(formData.get("programQuota") ?? "50").trim();

  if (!name || !term || !yearRaw || !startRaw || !endRaw) {
    return { success: false, error: "All fields except quota are required." };
  }

  const year = Number(yearRaw);
  const programQuota = Number(quotaRaw);
  const startDate = new Date(startRaw);
  const endDate = new Date(endRaw);

  if (!Number.isFinite(year) || year < 2000 || year > 2100) {
    return { success: false, error: "Year must be between 2000 and 2100." };
  }
  if (!Number.isFinite(programQuota) || programQuota < 1) {
    return { success: false, error: "Program quota must be a positive number." };
  }
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return { success: false, error: "Invalid start or end date." };
  }
  if (endDate <= startDate) {
    return { success: false, error: "End date must be after start date." };
  }

  const existing = await prisma.semester.findUnique({ where: { name } });
  if (existing) {
    return {
      success: false,
      error: "A semester with that name already exists.",
    };
  }

  await prisma.semester.create({
    data: {
      name,
      term,
      year,
      startDate,
      endDate,
      programQuota,
      period: "CLASS_SETUP",
      isCurrent: false,
    },
  });

  revalidatePath("/registrar/semesters");
  return { success: true };
}
