import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Star } from "lucide-react";
import { getSession } from "@/src/lib/session";
import { prisma } from "@/src/lib/db";
import LogoutButton from "@/src/components/LogoutButton";
import ReviewForm from "./ReviewForm";

export default async function ReviewsPage() {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") redirect("/login");

  // Pull current-semester enrollments without a grade + the student's prior
  // reviews in one trip.
  const [enrollments, myReviews] = await Promise.all([
    prisma.enrollment.findMany({
      where: {
        userId: session.userId,
        grade: null,
        course: { semester: { isCurrent: true } },
      },
      include: {
        course: {
          include: {
            instructor: { select: { firstName: true, lastName: true } },
          },
        },
      },
    }),
    prisma.review.findMany({
      where: { authorId: session.userId },
      include: {
        course: {
          select: { code: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const reviewedCourseIds = new Set(myReviews.map((r) => r.courseId));
  const availableForReview = enrollments.filter(
    (e) => !reviewedCourseIds.has(e.courseId),
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 font-sans text-[#0f172a]">
      <nav className="sticky top-0 z-10 bg-[#0f172a] text-white shadow-xl border-b border-white/5">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-8 py-5">
          <Link
            href="/student/dashboard"
            className="flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-white"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-6">
            <span className="text-sm font-bold text-slate-300">
              {session.firstName} {session.lastName}
            </span>
            <LogoutButton />
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-8 py-10 space-y-8">
        <div className="rounded-2xl bg-gradient-to-r from-[#0f172a] to-[#1e3a8a] p-8 text-white shadow-xl">
          <div className="flex items-center gap-3">
            <Star size={28} className="text-yellow-300" />
            <h2 className="text-3xl font-black tracking-tight">
              Course Reviews
            </h2>
          </div>
          <p className="mt-2 text-sm text-blue-200 font-medium">
            Rate your in-progress courses. Reviews close once grades are posted.
          </p>
        </div>

        <section>
          <h3 className="mb-4 text-lg font-black uppercase tracking-wide text-slate-700">
            Available to Review
          </h3>
          {availableForReview.length === 0 ? (
            <div className="rounded-2xl bg-white border border-slate-200 p-6 text-center text-sm font-bold text-slate-400 shadow-sm">
              No active courses awaiting your review.
            </div>
          ) : (
            <div className="space-y-4">
              {availableForReview.map((e) => (
                <div
                  key={e.id}
                  className="rounded-2xl bg-white border border-slate-200 p-5 shadow-md"
                >
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Instructor:{" "}
                    {e.course.instructor
                      ? `${e.course.instructor.firstName} ${e.course.instructor.lastName}`
                      : "TBA"}
                  </p>
                  <div className="mt-3">
                    <ReviewForm
                      courseId={e.courseId}
                      courseCode={e.course.code}
                      courseName={e.course.name}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h3 className="mb-4 text-lg font-black uppercase tracking-wide text-slate-700">
            My Past Reviews
          </h3>
          {myReviews.length === 0 ? (
            <div className="rounded-2xl bg-white border border-slate-200 p-6 text-center text-sm font-bold text-slate-400 shadow-sm">
              You have not submitted any reviews yet.
            </div>
          ) : (
            <div className="space-y-3">
              {myReviews.map((r) => (
                <div
                  key={r.id}
                  className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-black text-[#0f172a]">
                      {r.course.code} — {r.course.name}
                    </p>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={
                            i < r.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-slate-300"
                          }
                        />
                      ))}
                    </div>
                  </div>
                  {r.comment && (
                    <p className="mt-2 text-sm text-slate-700">{r.comment}</p>
                  )}
                  {r.hidden && (
                    <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-red-600">
                      Hidden by taboo filter
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
