import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import ApplyForm from "./ApplyForm";

export const metadata = {
  title: "Apply to CunyZeroLite",
};

export default function ApplyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 font-sans text-[#0f172a]">
      <nav className="sticky top-0 z-10 bg-[#0f172a] text-white shadow-xl border-b border-white/5">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-8 py-5">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-white"
          >
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <Link
            href="/login"
            className="text-xs font-black uppercase tracking-widest text-slate-300 hover:text-white"
          >
            Already have an account?
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-8 py-10">
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-[#0f172a] to-[#1e3a8a] p-8 text-white shadow-xl">
          <div className="flex items-center gap-3">
            <FileText size={28} className="text-blue-300" />
            <h2 className="text-3xl font-black tracking-tight">
              Apply to CunyZeroLite
            </h2>
          </div>
          <p className="mt-2 text-sm text-blue-200 font-medium">
            Visitors may apply for admission as a student or to teach as an
            instructor. The registrar reviews each application.
          </p>
        </div>

        <ApplyForm />
      </main>
    </div>
  );
}
