"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/src/lib/db";
import { getSession } from "@/src/lib/session";
import type { ActionResult } from "./types";

async function requireRegistrar(): Promise<ActionResult | null> {
  const session = await getSession();
  if (!session || session.role !== "REGISTRAR") {
    return { success: false, error: "Unauthorized." };
  }
  return null;
}

function parseId(formData: FormData, key: string): number | null {
  const raw = formData.get(key);
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function parseOptionalId(formData: FormData, key: string): number | null {
  const raw = String(formData.get(key) ?? "").trim();
  if (!raw) return null;
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : null;
}

type CourseFields = {
  code: string;
  name: string;
  credits: number;
  maxStudents: number;
  schedule: string;
  semesterId: number;
  instructorId: number | null;
};

function readFields(formData: FormData): CourseFields | string {
  const code = String(formData.get("code") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const schedule = String(formData.get("schedule") ?? "").trim();
  const credits = Number(formData.get("credits") ?? "3");
  const maxStudents = Number(formData.get("maxStudents") ?? "30");
  const semesterId = parseId(formData, "semesterId");
  const instructorId = parseOptionalId(formData, "instructorId");

  if (!code || !name || !schedule) {
    return "Code, name, and schedule are required.";
  }
  if (!semesterId) return "Please select a semester.";
  if (!Number.isFinite(credits) || credits < 1 || credits > 12) {
    return "Credits must be between 1 and 12.";
  }
  if (!Number.isFinite(maxStudents) || maxStudents < 1) {
    return "Max students must be at least 1.";
  }

  return { code, name, schedule, credits, maxStudents, semesterId, instructorId };
}

async function validateInstructor(
  instructorId: number | null,
): Promise<string | null> {
  if (instructorId === null) return null;
  const user = await prisma.user.findUnique({ where: { id: instructorId } });
  if (!user || user.role !== "INSTRUCTOR") {
    return "Selected instructor is not valid.";
  }
  if (user.suspended || user.fired) {
    return "Selected instructor is suspended or no longer active.";
  }
  return null;
}

export async function createCourse(formData: FormData): Promise<ActionResult> {
  const denied = await requireRegistrar();
  if (denied) return denied;

  const fields = readFields(formData);
  if (typeof fields === "string") return { success: false, error: fields };

  const semester = await prisma.semester.findUnique({
    where: { id: fields.semesterId },
  });
  if (!semester) return { success: false, error: "Semester not found." };

  const instructorError = await validateInstructor(fields.instructorId);
  if (instructorError) return { success: false, error: instructorError };

  const existing = await prisma.course.findFirst({
    where: { code: fields.code, semesterId: fields.semesterId },
  });
  if (existing) {
    return {
      success: false,
      error: `Course code "${fields.code}" already exists in ${semester.name}.`,
    };
  }

  await prisma.course.create({
    data: {
      code: fields.code,
      name: fields.name,
      credits: fields.credits,
      maxStudents: fields.maxStudents,
      schedule: fields.schedule,
      semesterId: fields.semesterId,
      instructorId: fields.instructorId ?? undefined,
    },
  });

  revalidatePath("/registrar/courses");
  revalidatePath("/registrar/dashboard");
  redirect("/registrar/courses");
}

export async function updateCourse(formData: FormData): Promise<ActionResult> {
  const denied = await requireRegistrar();
  if (denied) return denied;

  const id = parseId(formData, "id");
  if (!id) return { success: false, error: "Invalid course id." };

  const fields = readFields(formData);
  if (typeof fields === "string") return { success: false, error: fields };

  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) return { success: false, error: "Course not found." };

  const semester = await prisma.semester.findUnique({
    where: { id: fields.semesterId },
  });
  if (!semester) return { success: false, error: "Semester not found." };

  const instructorError = await validateInstructor(fields.instructorId);
  if (instructorError) return { success: false, error: instructorError };

  if (fields.code !== course.code || fields.semesterId !== course.semesterId) {
    const conflict = await prisma.course.findFirst({
      where: {
        code: fields.code,
        semesterId: fields.semesterId,
        NOT: { id },
      },
    });
    if (conflict) {
      return {
        success: false,
        error: `Course code "${fields.code}" already exists in ${semester.name}.`,
      };
    }
  }

  await prisma.course.update({
    where: { id },
    data: {
      code: fields.code,
      name: fields.name,
      credits: fields.credits,
      maxStudents: fields.maxStudents,
      schedule: fields.schedule,
      semesterId: fields.semesterId,
      instructorId: fields.instructorId,
    },
  });

  revalidatePath("/registrar/courses");
  revalidatePath("/registrar/dashboard");
  redirect("/registrar/courses");
}

async function setCancelled(
  formData: FormData,
  cancelled: boolean,
): Promise<ActionResult> {
  const denied = await requireRegistrar();
  if (denied) return denied;

  const id = parseId(formData, "id");
  if (!id) return { success: false, error: "Invalid course id." };

  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) return { success: false, error: "Course not found." };
  if (course.cancelled === cancelled) {
    return { success: true };
  }

  await prisma.course.update({ where: { id }, data: { cancelled } });

  revalidatePath("/registrar/courses");
  revalidatePath("/registrar/dashboard");
  return { success: true };
}

export async function cancelCourse(formData: FormData): Promise<ActionResult> {
  return setCancelled(formData, true);
}

export async function uncancelCourse(formData: FormData): Promise<ActionResult> {
  return setCancelled(formData, false);
}
