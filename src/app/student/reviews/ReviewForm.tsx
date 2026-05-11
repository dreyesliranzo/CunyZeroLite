"use client";

import { useActionState, useState } from "react";
import { Star, Send } from "lucide-react";
import { submitReview } from "./actions";

type ActionResult = { success: boolean; error?: string; ok?: string };
const INITIAL: ActionResult = { success: false };

export default function ReviewForm({
  courseId,
  courseCode,
  courseName,
}: {
  courseId: number;
  courseCode: string;
  courseName: string;
}) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [state, formAction, pending] = useActionState(
    async (_prev: ActionResult, formData: FormData) => submitReview(formData),
    INITIAL,
  );

  if (state.success) {
    return (
      <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm font-bold text-emerald-800">
        {state.ok}
      </div>
    );
  }

  const display = hover || rating;

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="rating" value={rating} />
      <p className="text-sm font-bold text-[#0f172a]">
        {courseCode} — {courseName}
      </p>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className="p-1"
            aria-label={`${n} stars`}
          >
            <Star
              size={22}
              className={
                n <= display
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-slate-300"
              }
            />
          </button>
        ))}
      </div>
      <textarea
        name="comment"
        rows={3}
        placeholder="Optional comment…"
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20"
      />
      {state.error && (
        <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs font-bold text-red-700">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending || rating === 0}
        className="flex items-center gap-2 rounded-xl bg-[#0f172a] px-4 py-2 text-xs font-black uppercase tracking-widest text-white hover:bg-[#1e293b] disabled:opacity-50"
      >
        <Send size={12} /> {pending ? "Submitting…" : "Submit Review"}
      </button>
    </form>
  );
}
