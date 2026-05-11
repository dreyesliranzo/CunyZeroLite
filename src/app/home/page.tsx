import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/src/lib/db";
import Navbar from "@/src/components/Navbar";
import HomeChatWidget from "@/src/components/HomeChatWidget";
import * as motion from "framer-motion/client";
import { 
  GraduationCap, 
  CircleDollarSign, 
  Calendar, 
  UserCheck, 
  ArrowRight,
  Monitor,
  ShieldCheck,
  Trophy,
  TrendingDown,
  Star,
} from "lucide-react";

export const metadata = {
  title: "Home",
};

export default async function HomePage() {
  const currentSemester = await prisma.semester.findFirst({
    where: { isCurrent: true },
  });

  const registrationOpen = currentSemester?.period === "REGISTRATION";


  const coursesWithReviews = await prisma.course.findMany({
    where: { cancelled: false },
    include: {
      reviews: { where: { hidden: false } },
      instructor: { select: { firstName: true, lastName: true } },
    },
  });

  const ratedCourses = coursesWithReviews
    .filter((c) => c.reviews.length > 0)
    .map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      instructor: c.instructor
        ? `${c.instructor.firstName} ${c.instructor.lastName}`
        : "TBA",
      reviewCount: c.reviews.length,
      avgRating:
        c.reviews.reduce((sum, r) => sum + r.rating, 0) / c.reviews.length,
    }));

  const topRatedCourses = [...ratedCourses]
    .sort((a, b) => b.avgRating - a.avgRating)
    .slice(0, 5);

  const worstRatedCourses = [...ratedCourses]
    .sort((a, b) => a.avgRating - b.avgRating)
    .slice(0, 5);

  const topStudents = await prisma.user.findMany({
    where: {
      role: "STUDENT",
      suspended: false,
      terminated: false,
      graduated: false,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      gpa: true,
    },
    orderBy: { gpa: "desc" },
    take: 5,
  });

  return (
    <main className="min-h-screen bg-[#e2e8f0] text-[#0f172a] font-sans selection:bg-blue-100 relative overflow-x-hidden">
      
      {/* Background Texture */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.4]" 
           style={{ backgroundImage: `radial-gradient(#94a3b8 1px, transparent 1px)`, backgroundSize: '32px 32px' }} />

      {/* 1. Top Utility Bar */}
      <section className="relative z-10 border-b border-slate-300 bg-white/80 backdrop-blur-md py-2.5 px-8">
        <div className="mx-auto flex max-w-7xl justify-between items-center text-[11px] font-bold uppercase tracking-widest text-slate-500">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
            <p>System Status: All Services Operational</p>
          </div>
          <Link href="/login" className="text-blue-700 hover:text-blue-900 transition-colors">Go to Student Login</Link>
        </div>
      </section>

      <Navbar />

      {/* 2. Hero Section */}
      <section className="relative z-10 bg-[#0f172a] text-white pt-20 pb-28 border-b border-white/5 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image 
            src="/image1-cuny.jpg" 
            alt="CUNY" 
            fill 
            sizes="100vw" 
            className="object-cover opacity-20 grayscale-[0.3]" 
            priority 
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a] via-[#0f172a]/80 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto grid max-w-7xl gap-20 px-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-8">
              <Monitor size={12} /> Secure Access Point
            </div>
            <h2 className="mb-8 text-6xl font-black leading-[1.05] tracking-tighter">
              One login. <br /> Your <span className="text-blue-500">CUNY</span> career.
            </h2>
            <p className="mb-12 max-w-xl text-lg text-slate-400 font-medium leading-relaxed">
              A unified gateway for enrollment, financial aid, and academic tracking—designed for clarity and institutional integrity.
            </p>
            <div className="flex flex-wrap gap-5">
              <Link href="/login" className="rounded-2xl bg-blue-600 px-10 py-5 text-sm font-black uppercase tracking-widest text-white shadow-2xl shadow-blue-600/30 hover:bg-blue-500 hover:-translate-y-1 transition-all">
                Student Login
              </Link>
              <a href="#info" className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md px-10 py-5 text-sm font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all">
                View Information
              </a>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="relative rounded-[2.5rem] bg-white border border-slate-300 p-10 text-slate-900 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)]">
            <div className="mb-10 flex items-center justify-between border-b border-slate-200 pb-6">
              <h3 className="text-xl font-black uppercase tracking-tight text-[#0f172a]">Before You Sign In</h3>
              <ShieldCheck size={24} className="text-blue-600" />
            </div>
            <div className="space-y-5 mb-10">
              {[
                { title: "Account Access", desc: "Credentials and setup support" },
                { title: "Student Information", desc: "Registration & aid resources" },
                { title: "Portal Access", desc: "Secure dashboard entry point" }
              ].map((item, i) => (
                <div key={i} className="rounded-2xl bg-slate-100 border border-slate-200 p-5 group/item transition-all hover:border-blue-400">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover/item:text-blue-600 transition-colors">{item.title}</p>
                  <p className="mt-1 text-sm font-bold text-slate-700">{item.desc}</p>
                </div>
              ))}
            </div>
            <Link href="/login" className="block w-full rounded-2xl bg-[#0f172a] py-5 text-center text-xs font-black uppercase tracking-[0.2em] text-white shadow-xl hover:bg-blue-950 transition-all">
              Continue to Student Login
            </Link>
          </motion.div>
        </div>
      </section>

      {/* 3. Community Section */}
      <section className="relative z-10 py-24 px-8 bg-white border-y border-slate-300 shadow-sm">
        <div className="mx-auto max-w-7xl grid lg:grid-cols-2 gap-20 items-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative h-[450px] rounded-[3rem] overflow-hidden shadow-2xl ring-8 ring-slate-100">
            <Image src="/image-cuny2.jpg" alt="CUNY Campus" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
          </motion.div>
          <div>
            <p className="text-blue-600 text-xs font-black uppercase tracking-[0.3em] mb-4">Our Community</p>
            <h3 className="text-4xl font-black tracking-tighter mb-6 text-[#0f172a]">Built for the <br /> City University student.</h3>
            <p className="text-slate-500 font-bold leading-relaxed mb-8">
              We empower students across the five boroughs with modern digital tools. From registration to graduation, we are here to simplify your academic experience.
            </p>
            <Link href="/login" className="font-black text-xs uppercase tracking-widest text-blue-600 border-b-2 border-blue-600 pb-1 hover:text-blue-800 hover:border-blue-800 transition-all">
              Learn about the portal
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Pre-Login Resource Cards */}
      <section id="info" className="relative z-10 mx-auto max-w-7xl px-8 py-32">
        <div className="mb-16">
          <p className="mb-4 text-xs font-black uppercase tracking-[0.4em] text-blue-700">Service Directory</p>
          <h2 className="text-4xl font-black tracking-tighter text-slate-900 leading-none">Pre-Login Resources</h2>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Registration", icon: <GraduationCap />, desc: "Review enrollment details and registration notices." },
            { title: "Finances", icon: <CircleDollarSign />, desc: "See important financial aid and tuition updates." },
            { title: "Calendar", icon: <Calendar />, desc: "Stay aware of deadlines and semester milestones." },
            { title: "Advising", icon: <UserCheck />, desc: "Guidance on account access and student support." }
          ].map((card, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="group rounded-[2rem] border border-slate-300 bg-white p-10 shadow-sm transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border-b-4 hover:border-b-blue-600">
              <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                {card.icon}
              </div>
              <h4 className="text-lg font-black tracking-tight text-slate-900 mb-4">{card.title}</h4>
              <p className="text-sm leading-relaxed text-slate-500 font-medium">{card.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 5. Features + Reminders Split Section */}
      <section className="relative z-10 bg-slate-200/50 border-y border-slate-300 py-32">
        <div className="mx-auto grid max-w-7xl gap-12 px-8 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="rounded-[3rem] bg-white border border-slate-300 p-12 shadow-sm">
            <h3 className="text-3xl font-black tracking-tight text-slate-900 mb-10">Portal Utility</h3>
            <div className="grid grid-cols-2 gap-4 mb-12">
              {["View Schedule", "Check Grades", "Manage Enrollment", "Review Holds", "Payment Info", "Track Progress"].map((f, i) => (
                <div key={i} className="rounded-2xl border border-slate-200 bg-slate-100 px-6 py-5 text-[11px] font-black uppercase tracking-wider text-slate-700 shadow-sm transition-colors hover:bg-white hover:border-blue-300">
                  {f}
                </div>
              ))}
            </div>
            <Link href="/login" className="inline-flex items-center gap-3 rounded-2xl bg-[#0f172a] px-10 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-xl hover:bg-blue-950 transition-all">
              Access Full Features <ArrowRight size={14} />
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="rounded-[3rem] bg-[#0f172a] p-12 text-white shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
             <h3 className="text-3xl font-black tracking-tight mb-10">Academic Reminders</h3>
             <div className="space-y-6">
                <div className="rounded-[1.5rem] border border-white/5 bg-white/5 p-8 backdrop-blur-sm">
                   <span className="bg-blue-600 px-2 py-0.5 rounded text-[9px] font-black tracking-widest mb-3 inline-block">NOTICE</span>
                   <p className="text-sm font-bold mb-2 text-white">System Maintenance</p>
                   <p className="text-sm text-slate-400 font-medium leading-relaxed">Standard portal updates occur Sunday at 02:00 AM.</p>
                </div>
                <div className="rounded-[1.5rem] border border-white/5 bg-white/5 p-8 backdrop-blur-sm">
                   <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-widest mb-3 inline-block ${registrationOpen ? 'bg-green-600' : 'bg-slate-700'}`}>
                    {registrationOpen ? "ACTIVE" : "TERM INFO"}
                   </span>
                   <p className="text-sm font-bold mb-2 text-white">Current Term: {currentSemester?.name || "2026"}</p>
                   <p className="text-sm text-slate-400 font-medium leading-relaxed">Currently in the <span className="text-blue-400 uppercase font-black tracking-widest">{currentSemester?.period || "Registration"}</span> phase.</p>
                </div>
             </div>
          </motion.div>
        </div>
      </section>

      {/* 6. Academic Highlights — Homepage Stats */}
      <section className="relative z-10 py-32 px-8 bg-white border-y border-slate-300">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16">
            <p className="mb-4 text-xs font-black uppercase tracking-[0.4em] text-blue-700">Campus Pulse</p>
            <h2 className="text-4xl font-black tracking-tighter text-slate-900 leading-none">Academic Highlights</h2>
            <p className="mt-4 text-slate-500 font-medium max-w-2xl">A live look at how courses and students are performing across the portal.</p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Top Rated Classes */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="rounded-[2rem] border border-slate-300 bg-white p-10 shadow-sm border-b-4 border-b-emerald-600">
              <div className="mb-8 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <Trophy size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Top Rated</p>
                  <h4 className="text-lg font-black tracking-tight text-slate-900">Highest Rated Classes</h4>
                </div>
              </div>

              {topRatedCourses.length === 0 ? (
                <p className="text-sm text-slate-400 font-medium italic">No reviews submitted yet.</p>
              ) : (
                <ol className="space-y-4">
                  {topRatedCourses.map((course, i) => (
                    <li key={course.id} className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-0">
                      <div className="flex items-center gap-4 min-w-0">
                        <span className="text-xs font-black tracking-widest text-slate-300 w-5">{i + 1}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-black tracking-tight text-slate-900 truncate">{course.code}</p>
                          <p className="text-[11px] text-slate-500 font-medium truncate">{course.name}</p>
                        </div>
                      </div>
                      <span className="text-sm font-black text-emerald-700 whitespace-nowrap">
                        {course.avgRating.toFixed(1)} ★
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </motion.div>

            {/* Worst Rated Classes */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
              className="rounded-[2rem] border border-slate-300 bg-white p-10 shadow-sm border-b-4 border-b-rose-600">
              <div className="mb-8 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
                  <TrendingDown size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Lowest Rated</p>
                  <h4 className="text-lg font-black tracking-tight text-slate-900">Needs Improvement</h4>
                </div>
              </div>

              {worstRatedCourses.length === 0 ? (
                <p className="text-sm text-slate-400 font-medium italic">No reviews submitted yet.</p>
              ) : (
                <ol className="space-y-4">
                  {worstRatedCourses.map((course, i) => (
                    <li key={course.id} className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-0">
                      <div className="flex items-center gap-4 min-w-0">
                        <span className="text-xs font-black tracking-widest text-slate-300 w-5">{i + 1}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-black tracking-tight text-slate-900 truncate">{course.code}</p>
                          <p className="text-[11px] text-slate-500 font-medium truncate">{course.name}</p>
                        </div>
                      </div>
                      <span className="text-sm font-black text-rose-700 whitespace-nowrap">
                        {course.avgRating.toFixed(1)} ★
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </motion.div>

            {/* Top GPA Students */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
              className="rounded-[2rem] border border-slate-300 bg-white p-10 shadow-sm border-b-4 border-b-blue-600">
              <div className="mb-8 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                  <Star size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Honor Roll</p>
                  <h4 className="text-lg font-black tracking-tight text-slate-900">Highest GPA Students</h4>
                </div>
              </div>

              {topStudents.length === 0 ? (
                <p className="text-sm text-slate-400 font-medium italic">No active students yet.</p>
              ) : (
                <ol className="space-y-4">
                  {topStudents.map((student, i) => (
                    <li key={student.id} className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-0">
                      <div className="flex items-center gap-4 min-w-0">
                        <span className="text-xs font-black tracking-widest text-slate-300 w-5">{i + 1}</span>
                        <p className="text-sm font-black tracking-tight text-slate-900 truncate">
                          {student.firstName} {student.lastName}
                        </p>
                      </div>
                      <span className="text-sm font-black text-blue-700 whitespace-nowrap">
                        {student.gpa.toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* 7. Student Success Section (NEW) */}
      <section className="relative z-10 py-32 px-8 bg-white overflow-hidden">
        <div className="mx-auto max-w-7xl grid lg:grid-cols-[0.9fr_1.1fr] gap-20 items-center">
          <div className="order-2 lg:order-1">
            <p className="text-blue-600 text-xs font-black uppercase tracking-[0.4em] mb-6">Alumni & Success</p>
            <h3 className="text-5xl font-black tracking-tighter mb-8 text-[#0f172a] leading-none">Your journey to <br /> graduation begins.</h3>
            <p className="text-lg text-slate-500 font-medium leading-relaxed mb-10 max-w-lg">
              CunyZeroLite is more than a portal—it's your partner in navigating the complexities of university life. From your first day to your graduation walk, we keep your path clear.
            </p>
            <div className="flex items-center gap-8 border-t border-slate-100 pt-10">
              <div>
                <p className="text-3xl font-black text-[#0f172a]">25k+</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Students</p>
              </div>
              <div className="h-10 w-[1px] bg-slate-200" />
              <div>
                <p className="text-3xl font-black text-[#0f172a]">100%</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Digital Access</p>
              </div>
            </div>
          </div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            className="order-1 lg:order-2 relative h-[500px] rounded-[3rem] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)]">
            <Image src="/image-cuny6.jpg" alt="CUNY Graduate" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/60 to-transparent" />
            <div className="absolute bottom-10 left-10 text-white">
              <p className="text-xs font-black uppercase tracking-widest opacity-80">Class of 2026</p>
              <p className="text-xl font-bold tracking-tight mt-1">Empowering the next generation.</p>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="relative z-10 bg-[#e2e8f0] py-20 px-8 border-t border-slate-300 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">
          © 2026 CUNYZEROLITE — Institutional Technology
        </p>
      </footer>

      <HomeChatWidget />
    </main>
  );
}