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

export async function addTabooWord(
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireRegistrar();
  if (denied) return denied;

  const word = String(formData.get("word") ?? "")
    .trim()
    .toLowerCase();
  if (!word) return { success: false, error: "Word cannot be empty." };
  if (word.length > 50) return { success: false, error: "Word too long (max 50)." };

  // upsert avoids the read-then-write round-trip and lets the unique
  // constraint do the duplicate check.
  try {
    await prisma.tabooWord.create({ data: { word } });
  } catch {
    return { success: false, error: `"${word}" is already on the list.` };
  }

  revalidatePath("/registrar/taboo-words");
  return { success: true };
}

export async function deleteTabooWord(
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireRegistrar();
  if (denied) return denied;

  const id = Number(formData.get("id"));
  if (!Number.isFinite(id) || id <= 0) {
    return { success: false, error: "Invalid id." };
  }

  // deleteMany returns count = 0 on miss, no exception. Cheaper than a
  // separate exists check before delete.
  await prisma.tabooWord.deleteMany({ where: { id } });
  revalidatePath("/registrar/taboo-words");
  return { success: true };
}
