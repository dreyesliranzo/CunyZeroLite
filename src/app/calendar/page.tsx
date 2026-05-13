import Link from "next/link";
import Navbar from "@/src/components/Navbar";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  GraduationCap,
  CircleDollarSign,
  AlertTriangle,
  Coffee,
  BookOpen,
  Award,
} from "lucide-react";

export const metadata = {
  title: "Spring 2026 Academic Calendar",
};

type Item = { date: string; label: string };
type Section = {
  title: string;
  icon: React.ReactNode;
  accent: string;
  items: Item[];
};

const sections: Section[] = [
  {
    title: "Term Start",
    icon: <BookOpen size={22} />,
    accent: "border-b-blue-600",
    items: [{ date: "January 26, 2026 (Mon)", label: "Start of Spring Term — classes begin" }],
  },
  {
    title: "Add / Drop & Refund Schedule",
    icon: <CircleDollarSign size={22} />,
    accent: "border-b-emerald-600",
    items: [
      { date: "January 25, 2026 (Sun)", label: "Last day to drop a course for 100% tuition refund" },
      { date: "February 1, 2026 (Sun)", label: "Last day to add a course — also last day for 75% refund" },
      { date: "February 8, 2026 (Sun)", label: "Last day for 50% tuition refund" },
      { date: "February 15, 2026 (Sun)", label: "Last day for 25% tuition refund" },
    ],
  },
  {
    title: "Academic Milestones",
    icon: <GraduationCap size={22} />,
    accent: "border-b-indigo-600",
    items: [
      { date: "February 15, 2026 (Sun)", label: "Census date — last day to declare or change major/minor effective Spring 2026" },
      { date: "April 13, 2026 (Mon)", label: "Last day to withdraw from a course with a grade of W" },
    ],
  },
  {
    title: "No Classes / College Closed",
    icon: <Coffee size={22} />,
    accent: "border-b-rose-600",
    items: [
      { date: "February 12, 2026 (Thu)", label: "College closed" },
      { date: "February 16, 2026 (Mon)", label: "College closed" },
      { date: "February 17, 2026 (Tue)", label: "No classes scheduled" },
      { date: "March 20, 2026 (Fri)", label: "No classes scheduled" },
      { date: "April 1 – April 9, 2026", label: "Spring recess" },
    ],
  },
  {
    title: "Final Exams & Term End",
    icon: <AlertTriangle size={22} />,
    accent: "border-b-amber-600",
    items: [
      { date: "May 16 – May 18, 2026", label: "Final examinations (Sat – Mon)" },
      { date: "May 20 – May 26, 2026", label: "Final examinations (Wed – Tue)" },
      { date: "May 26, 2026 (Tue)", label: "End of Spring Term" },
      { date: "May 29, 2026 (Fri)", label: "Final grade submission deadline" },
    ],
  },
  {
    title: "Degree Conferral",
    icon: <Award size={22} />,
    accent: "border-b-purple-600",
    items: [{ date: "June 1, 2026 (Mon)", label: "Spring 2026 degree conferral date" }],
  },
];

export default function CalendarPage() {
  return (
    <main className="min-h-screen bg-[#e2e8f0] text-[#0f172a] font-sans">
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.4]"
           style={{ backgroundImage: `radial-gradient(#94a3b8 1px, transparent 1px)`, backgroundSize: '32px 32px' }} />

      <Navbar />

      <section className="relative z-10 bg-[#0f172a] text-white pt-16 pb-20 border-b border-white/5">
        <div className="mx-auto max-w-6xl px-8">
          <Link href="/home" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white mb-8">
            <ArrowLeft size={14} /> Back to Home
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-6">
            <CalendarIcon size={12} /> Academic Calendar
          </div>
          <h1 className="text-5xl font-black tracking-tighter mb-4">Spring 2026</h1>
          <p className="text-slate-400 font-medium max-w-2xl">
            Key dates for the Spring 2026 term, sourced from the official{" "}
            <a href="https://www.cuny.edu/academics/academic-calendars/"
               target="_blank" rel="noreferrer"
               className="text-blue-400 hover:text-blue-300 underline underline-offset-4">
              CUNY academic calendar
            </a>
            . Individual colleges may publish minor variations.
          </p>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-8 py-20">
        <div className="grid gap-8 md:grid-cols-2">
          {sections.map((section) => (
            <div key={section.title}
              className={`rounded-[2rem] border border-slate-300 bg-white p-8 shadow-sm border-b-4 ${section.accent}`}>
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-blue-600">
                  {section.icon}
                </div>
                <h2 className="text-lg font-black tracking-tight text-slate-900">{section.title}</h2>
              </div>
              <ul className="space-y-4">
                {section.items.map((item, i) => (
                  <li key={i} className="flex flex-col gap-1 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                    <span className="text-xs font-black uppercase tracking-widest text-blue-700">{item.date}</span>
                    <span className="text-sm font-medium text-slate-700 leading-relaxed">{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-12 text-xs text-slate-500 text-center font-medium">
          Source: cuny.edu/academics/academic-calendars/ — always confirm with your home college's registrar for college-specific variations.
        </p>
      </section>

      <footer className="relative z-10 bg-[#e2e8f0] py-16 px-8 border-t border-slate-300 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">
          © 2026 CUNYZEROLITE — Institutional Technology
        </p>
      </footer>

    </main>
  );
}
