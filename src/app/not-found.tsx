import Link from "next/link";
import { GraduationCap, Home, LayoutDashboard, FileText, MessageCircle } from "lucide-react";

export const metadata = {
  title: "Page Not Found",
};

const QUICK_LINKS = [
  {
    href: "/home",
    icon: <Home size={20} className="text-blue-700" />,
    title: "Public Home",
    desc: "Top-rated classes, top GPAs, and admissions info.",
  },
  {
    href: "/dashboard",
    icon: <LayoutDashboard size={20} className="text-blue-700" />,
    title: "My Dashboard",
    desc: "Sign in and head to your personal portal.",
  },
  {
    href: "/apply",
    icon: <FileText size={20} className="text-blue-700" />,
    title: "Apply for Admission",
    desc: "Submit a student or instructor application.",
  },
  {
    href: "/calendar",
    icon: <GraduationCap size={20} className="text-blue-700" />,
    title: "Academic Calendar",
    desc: "See semester start, finals, and key dates.",
  },
];

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#e2e8f0] text-[#0f172a] font-sans relative overflow-hidden">
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.4]"
        style={{ backgroundImage: `radial-gradient(#94a3b8 1px, transparent 1px)`, backgroundSize: "32px 32px" }}
      />

      <header className="relative z-10 bg-[#0f172a] text-white border-b border-white/5">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-8 py-5">
          <Link href="/home" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-800">
              <GraduationCap size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight uppercase leading-none">
                Cuny<span className="text-blue-500">Zero</span>Lite
              </h1>
              <p className="text-[9px] uppercase tracking-[0.3em] text-blue-300 font-bold opacity-80 mt-0.5">
                Institutional Technology
              </p>
            </div>
          </Link>
          <Link
            href="/home"
            className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white"
          >
            Back to Home
          </Link>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-3xl px-8 pt-24 pb-12 text-center">
        <p className="text-xs font-black uppercase tracking-[0.4em] text-blue-700 mb-4">
          Error 404
        </p>
        <h2 className="text-[8rem] leading-none font-black tracking-tighter text-[#0f172a] mb-6">
          404
        </h2>
        <p className="text-2xl font-black tracking-tight text-[#0f172a] mb-4">
          This class isn't in the catalog.
        </p>
        <p className="text-base text-slate-600 font-medium max-w-xl mx-auto leading-relaxed">
          The page you tried to reach doesn't exist, was moved, or hasn't been registered yet.
          Try one of the destinations below — or ask the AI assistant in the corner.
        </p>
      </section>

      <section className="relative z-10 mx-auto max-w-5xl px-8 pb-32">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group rounded-2xl border border-slate-300 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-b-4 hover:border-b-blue-600 block"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 group-hover:bg-blue-100 transition-colors">
                {link.icon}
              </div>
              <h3 className="text-sm font-black tracking-tight text-slate-900 mb-2">
                {link.title}
              </h3>
              <p className="text-xs leading-relaxed text-slate-500 font-medium">
                {link.desc}
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-10 flex items-center justify-center gap-3 text-xs font-bold text-slate-500">
          <MessageCircle size={14} className="text-blue-600" />
          <span>
            Still stuck? Open the chat widget at the bottom-right and ask Lite, the college AI assistant.
          </span>
        </div>
      </section>

      <footer className="relative z-10 bg-[#e2e8f0] py-12 px-8 border-t border-slate-300 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">
          © 2026 CUNYZEROLITE — Institutional Technology
        </p>
      </footer>
    </main>
  );
}
