"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/src/lib/db";
import { getSession } from "@/src/lib/session";

type ActionResult = { success: boolean; error?: string; ok?: string };

// Replace each occurrence of any taboo word (case-insensitive, whole word)
// with asterisks of the same length. Returns the masked text and how many
// distinct hits we found.
function maskTaboo(
  comment: string,
  taboo: string[],
): { masked: string; hits: number } {
  if (!comment || taboo.length === 0) return { masked: comment, hits: 0 };
  // One regex compiled once per request, much cheaper than looping replace.
  const escaped = taboo.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`\\b(${escaped.join("|")})\\b`, "gi");
  let hits = 0;
  const masked = comment.replace(re, (match) => {
    hits += 1;
    return "*".repeat(match.length);
  });
  return { masked, hits };
}

export async function submitReview(
  formData: FormData,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") {
    return { success: false, error: "Only students can review courses." };
  }

  const courseId = Number(formData.get("courseId"));
  const rating = Number(formData.get("rating"));
  const commentRaw = String(formData.get("comment") ?? "").trim();

  if (!Number.isFinite(courseId) || courseId <= 0) {
    return { success: false, error: "Invalid course id." };
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { success: false, error: "Rating must be 1-5 stars." };
  }

  // Three reads in parallel: enrollment proof, existing review, taboo list.
  const [enrollment, existingReview, tabooWords] = await Promise.all([
    prisma.enrollment.findFirst({
      where: { userId: session.userId, courseId },
      select: { id: true, grade: true },
    }),
    prisma.review.findUnique({
      where: { authorId_courseId: { authorId: session.userId, courseId } },
      select: { id: true },
    }),
    prisma.tabooWord.findMany({ select: { word: true } }),
  ]);

  if (!enrollment) {
    return { success: false, error: "You are not enrolled in this course." };
  }
  if (enrollment.grade) {
    return { success: false, error: "Grades have been posted; reviews are closed for this course." };
  }
  if (existingReview) {
    return { success: false, error: "You have already reviewed this course." };
  }

  const { masked, hits } = maskTaboo(
    commentRaw,
    tabooWords.map((t) => t.word),
  );

  const hidden = hits >= 3;
  const warningCount = hits === 0 ? 0 : hits >= 3 ? 2 : 1;

  // One transaction for: create review (possibly hidden), increment student
  // warnings + insert Warning rows, recalc course avg, warn instructor if
  // avg < 2.0.
  await prisma.$transaction(async (tx) => {
    await tx.review.create({
      data: {
        authorId: session.userId,
        courseId,
        rating,
        comment: hits > 0 ? masked : commentRaw || null,
        hidden,
      },
    });

    if (warningCount > 0) {
      const reason =
        hits >= 3
          ? `Review for course #${courseId} contained ${hits} taboo words and was hidden.`
          : `Review for course #${courseId} contained ${hits} taboo word${hits !== 1 ? "s" : ""} (masked).`;
      // createMany not supported on SQLite for nested in tx; loop is fine
      // for the small N here (1 or 2).
      for (let i = 0; i < warningCount; i++) {
        await tx.warning.create({
          data: { userId: session.userId, reason },
        });
      }
      await tx.user.update({
        where: { id: session.userId },
        data: { warnings: { increment: warningCount } },
      });
    }

    // Course avg from visible reviews
    const stats = await tx.review.aggregate({
      where: { courseId, hidden: false },
      _avg: { rating: true },
      _count: { _all: true },
    });
    const avg = stats._avg.rating ?? null;

    if (avg !== null && avg < 2.0 && stats._count._all >= 1) {
      const course = await tx.course.findUnique({
        where: { id: courseId },
        select: { instructorId: true, code: true },
      });
      if (course?.instructorId) {
        await tx.warning.create({
          data: {
            userId: course.instructorId,
            reason: `${course.code} average rating fell below 2.0 (current: ${avg.toFixed(2)}).`,
          },
        });
      }
    }
  });

  revalidatePath("/student/reviews");
  revalidatePath("/home");
  revalidatePath("/");

  return {
    success: true,
    ok: hidden
      ? `Review submitted but hidden due to ${hits} taboo words. 2 warnings issued.`
      : hits > 0
        ? `Review submitted with ${hits} taboo word${hits !== 1 ? "s" : ""} masked. 1 warning issued.`
        : "Review submitted.",
  };
}
