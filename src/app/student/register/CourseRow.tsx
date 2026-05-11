"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Plus, X, Clock } from "lucide-react";
import {
  registerForCourse,
  dropCourse,
  leaveWaitlist,
} from "./actions";

type CourseStatus =
  | { kind: "available" }
  | { kind: "enrolled"; enrollmentId: number }
  | { kind: "waitlisted"; waitlistId: number; position: number }
  | { kind: "full" }
  | { kind: "disabled"; reason: string };

export default function CourseRow({
  courseId,
  status,
  registrationOpen,
}: {
  courseId: number;
  status: CourseStatus;
  registrationOpen: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok?: string; error?: string }>({});

  const register = () => {
    setFeedback({});
    startTransition(async () => {
      const fd = new FormData();
      fd.set("courseId", String(courseId));
      const res = await registerForCourse(fd);
      if (res.success) setFeedback({ ok: res.ok });
      else setFeedback({ error: res.error });
    });
  };

  const drop = (enrollmentId: number) => {
    setFeedback({});
    startTransition(async () => {
      const fd = new FormData();
      fd.set("enrollmentId", String(enrollmentId));
      const res = await dropCourse(fd);
      if (res.success) setFeedback({ ok: res.ok });
      else setFeedback({ error: res.error });
    });
  };

  const leave = (waitlistId: number) => {
    setFeedback({});
    startTransition(async () => {
      const fd = new FormData();
      fd.set("waitlistId", String(waitlistId));
      await leaveWaitlist(fd);
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      {status.kind === "enrolled" && (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-emerald-700">
            <CheckCircle2 size={10} /> Enrolled
          </span>
          {registrationOpen && (
            <button
              type="button"
              onClick={() => drop(status.enrollmentId)}
              disabled={pending}
              className="rounded-lg border border-red-300 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              Drop
            </button>
          )}
        </div>
      )}
      {status.kind === "waitlisted" && (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-amber-700">
            <Clock size={10} /> Waitlist #{status.position}
          </span>
          <button
            type="button"
            onClick={() => leave(status.waitlistId)}
            disabled={pending}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Leave
          </button>
        </div>
      )}
      {(status.kind === "available" || status.kind === "full") && registrationOpen && (
        <button
          type="button"
          onClick={register}
          disabled={pending}
          className="flex items-center gap-1 rounded-lg bg-[#0f172a] px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white hover:bg-[#1e293b] disabled:opacity-50"
        >
          {status.kind === "full" ? (
            <>
              <Clock size={12} /> Join Waitlist
            </>
          ) : (
            <>
              <Plus size={12} /> Register
            </>
          )}
        </button>
      )}
      {status.kind === "disabled" && (
        <span className="text-[10px] font-bold text-slate-400">{status.reason}</span>
      )}
      {feedback.ok && (
        <p className="text-[10px] font-bold text-emerald-600">{feedback.ok}</p>
      )}
      {feedback.error && (
        <p className="max-w-xs text-right text-[10px] font-bold text-red-600">
          <X className="inline" size={10} /> {feedback.error}
        </p>
      )}
    </div>
  );
}
