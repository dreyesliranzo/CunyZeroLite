export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/src/lib/session";
import LogoutButton from "@/src/components/LogoutButton";
import {
  User,
  BookOpen,
  Calendar,
  ClipboardList,
  GraduationCap,
  Users,
  Settings,
  FileText,
  AlertTriangle,
  MessageSquare,
  Shield,
  Star,
  Compass,
} from "lucide-react";

type CardInfo = {
  title: string;
  href: string;
  icon: React.ReactNode;
  subtitle: string;
};

const studentCards: CardInfo[] = [
  { title: "Profile", href: "/student/profile", icon: <User size={36} className="text-blue-700" />, subtitle: "View Your Records" },
  { title: "Course Registration", href: "/student/register", icon: <ClipboardList size={36} className="text-blue-700" />, subtitle: "Register for Courses" },
  { title: "Weekly Schedule", href: "/student/calendar", icon: <Calendar size={36} className="text-blue-700" />, subtitle: "Visualize Your Week" },
  { title: "Schedule Builder", href: "/schedule_builder", icon: <Calendar size={36} className="text-blue-700" />, subtitle: "Plan With Conflict Detection" },
  { title: "Course Planning", href: "/course_planning", icon: <Compass size={36} className="text-blue-700" />, subtitle: "Track Degree Progress" },
  { title: "Grades & Transcript", href: "/grades_transcript", icon: <GraduationCap size={36} className="text-blue-700" />, subtitle: "View Your Grades" },
  { title: "Course Reviews", href: "/student/reviews", icon: <Star size={36} className="text-blue-700" />, subtitle: "Rate Your Classes" },
  { title: "File Complaint", href: "/complaints/new", icon: <MessageSquare size={36} className="text-blue-700" />, subtitle: "Report an Issue" },
  { title: "Apply to Graduate", href: "/student/graduation", icon: <GraduationCap size={36} className="text-blue-700" />, subtitle: "Submit a Request" },
];

const instructorCards: CardInfo[] = [
  { title: "Profile", href: "/instructor/profile", icon: <User size={36} className="text-emerald-700" />, subtitle: "View Your Info" },
  { title: "My Courses", href: "/instructor/courses", icon: <BookOpen size={36} className="text-emerald-700" />, subtitle: "Manage Your Classes" },
  { title: "Grade Students", href: "/instructor/grades", icon: <ClipboardList size={36} className="text-emerald-700" />, subtitle: "Assign Grades" },
  { title: "File Complaint", href: "/complaints/new", icon: <MessageSquare size={36} className="text-emerald-700" />, subtitle: "Report a Student" },
];

const registrarCards: CardInfo[] = [
  { title: "Profile", href: "/registrar/profile", icon: <Shield size={36} className="text-red-700" />, subtitle: "Admin Overview" },
  { title: "Semester Management", href: "/registrar/semesters", icon: <Calendar size={36} className="text-red-700" />, subtitle: "Manage Periods" },
  { title: "Course Management", href: "/registrar/courses", icon: <BookOpen size={36} className="text-red-700" />, subtitle: "Create & Edit Courses" },
  { title: "Student Records", href: "/registrar/students", icon: <Users size={36} className="text-red-700" />, subtitle: "View All Students" },
  { title: "Applications", href: "/registrar/applications", icon: <FileText size={36} className="text-red-700" />, subtitle: "Review Applications" },
  { title: "Complaints", href: "/registrar/complaints", icon: <AlertTriangle size={36} className="text-red-700" />, subtitle: "Process Complaints" },
  { title: "Graduations", href: "/registrar/graduations", icon: <GraduationCap size={36} className="text-red-700" />, subtitle: "Graduation Requests" },
  { title: "Taboo Words", href: "/registrar/taboo-words", icon: <Settings size={36} className="text-red-700" />, subtitle: "Manage Word Filter" },
];

export default async function Dashboard() {
  const session = await getSession();
  if (!session) redirect("/login");

  let cards: CardInfo[];
  let roleLabel: string;

  switch (session.role) {
    case "REGISTRAR":
      cards = registrarCards;
      roleLabel = "Registrar";
      break;
    case "INSTRUCTOR":
      cards = instructorCards;
      roleLabel = "Instructor";
      break;
    default:
      cards = studentCards;
      roleLabel = "Student";
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-200 to-slate-300 font-sans text-[#0f2c55]">
      <nav className="sticky top-0 z-10 border-b border-white/20 bg-[#0f2f5f] text-white">
        <div className="mx-auto flex w-[min(1280px,calc(100%-48px))] items-center justify-between gap-6 py-5 max-md:w-[min(100%-24px,1280px)] max-md:flex-col max-md:items-start">
          <div>
            <h1 className="text-[2rem] font-bold leading-none tracking-[-0.02em]">CUNYZeroLite</h1>
            <p className="text-xs text-blue-200 font-semibold mt-1">
              Welcome, {session.firstName} &middot; {roleLabel}
            </p>
          </div>

          <ul className="flex list-none items-center gap-4 max-md:flex-wrap">
            <li>
              <Link
                href="/home"
                className="block min-w-[100px] rounded-[14px] bg-white px-3.5 py-2.5 text-center font-semibold text-[#0f2f5f] no-underline"
              >
                Home
              </Link>
            </li>
            <li>
              <LogoutButton />
            </li>
          </ul>
        </div>
      </nav>

      <main className="mx-auto w-[min(1280px,calc(100%-48px))] py-10 max-md:w-[min(100%-24px,1280px)]">
        <section className="rounded-[34px] border border-white/15 bg-gradient-to-b from-[#0f2f5f] to-[#173f7a] p-8 shadow-[0_10px_26px_rgba(5,24,56,0.16)] max-md:rounded-[22px] max-md:p-[18px]">
          <div className="grid grid-cols-3 gap-6 max-[1080px]:grid-cols-2 max-md:grid-cols-1">
            {cards.map((card) => (
              <Link key={card.title} href={card.href}>
                <article className="flex min-h-[210px] flex-col items-center rounded-[26px] border border-white/35 bg-white/95 px-[18px] pb-4 pt-[18px] text-center shadow-[0_8px_18px_rgba(6,24,52,0.12)] hover:bg-white hover:shadow-lg transition-all">
                  <h3 className="mb-4 w-full border-b-2 border-[#c7d3e6] pb-3 text-[1.08rem] font-extrabold">
                    {card.title}
                  </h3>
                  <div className="my-1.5 grid h-[92px] w-[92px] place-items-center">
                    {card.icon}
                  </div>
                  <p className="mt-auto text-[0.98rem] font-bold">{card.subtitle}</p>
                </article>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
