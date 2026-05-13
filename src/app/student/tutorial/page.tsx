import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
} from "lucide-react";
import { getSession } from "@/src/lib/session";
import LogoutButton from "@/src/components/LogoutButton";
import { STEPS } from "./steps";

type SearchParams = Promise<{ step?: string }>;

export default async function TutorialPage(props: {
  searchParams: SearchParams;
}) {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") redirect("/login");

  const { step: stepRaw } = await props.searchParams;
  const requested = Number(stepRaw ?? "1");
  if (!Number.isFinite(requested) || requested < 1 || requested > STEPS.length) {
    notFound();
  }

  const step = STEPS[requested - 1];
  const prevHref = requested > 1 ? `/student/tutorial?step=${requested - 1}` : null;
  const nextHref =
    requested < STEPS.length ? `/student/tutorial?step=${requested + 1}` : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 font-sans text-[#0f172a]">
      <nav className="sticky top-0 z-10 bg-[#0f172a] text-white shadow-xl border-b border-white/5">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-8 py-5">
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

      <main className="mx-auto max-w-3xl px-8 py-10">
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-[#0f172a] to-[#1e3a8a] p-6 text-white shadow-xl">
          <div className="flex items-center gap-3">
            <Compass size={24} className="text-blue-300" />
            <p className="text-xs font-black uppercase tracking-widest text-blue-300">
              Student Tutorial · Step {step.id} of {STEPS.length}
            </p>
          </div>
          <h2 className="mt-2 text-2xl font-black tracking-tight">
            {step.title}
          </h2>
        </div>

        {/* Progress dots */}
        <div className="mb-6 flex items-center justify-center gap-2">
          {STEPS.map((s) => (
            <Link
              key={s.id}
              href={`/student/tutorial?step=${s.id}`}
              className={`h-2 w-12 rounded-full transition-colors ${
                s.id === step.id
                  ? "bg-[#0f172a]"
                  : s.id < step.id
                    ? "bg-emerald-400"
                    : "bg-slate-300"
              }`}
              aria-label={`Step ${s.id}: ${s.title}`}
            />
          ))}
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-8 shadow-md">
          <p className="text-base text-slate-700 leading-relaxed">{step.blurb}</p>

          <ul className="mt-6 space-y-3">
            {step.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle2
                  size={18}
                  className="mt-0.5 flex-shrink-0 text-emerald-500"
                />
                <span className="text-sm text-slate-700">{b}</span>
              </li>
            ))}
          </ul>

          {step.cta && (
            <Link
              href={step.cta.href}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white hover:bg-blue-700"
            >
              <BookOpen size={14} /> {step.cta.label}
            </Link>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between">
          {prevHref ? (
            <Link
              href={prevHref}
              className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft size={14} /> Previous
            </Link>
          ) : (
            <span />
          )}
          {nextHref ? (
            <Link
              href={nextHref}
              className="flex items-center gap-2 rounded-xl bg-[#0f172a] px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white hover:bg-[#1e293b]"
            >
              Next <ArrowRight size={14} />
            </Link>
          ) : (
            <Link
              href="/student/dashboard"
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white hover:bg-emerald-700"
            >
              <CheckCircle2 size={14} /> Done
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
