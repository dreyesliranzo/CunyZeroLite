import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { getSession } from "@/src/lib/session";
import { prisma } from "@/src/lib/db";
import LogoutButton from "@/src/components/LogoutButton";
import CourseForm from "../../CourseForm";
import { updateCourse } from "../../actions";

type Params = Promise<{ id: string }>;

export default async function EditCoursePage(props: { params: Params }) {
  const session = await getSession();
  if (!session || session.role !== "REGISTRAR") redirect("/login");

  const { id: idParam } = await props.params;
  const id = Number(idParam);
  if (!Number.isFinite(id) || id <= 0) notFound();

  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) notFound();

  const [semesters, instructors] = await Promise.all([
    prisma.semester.findMany({
      orderBy: [{ year: "desc" }, { startDate: "desc" }],
    }),
    prisma.user.findMany({
      where: { role: "INSTRUCTOR", fired: false },
      orderBy: { lastName: "asc" },
    }),
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 font-sans text-[#0f172a]">
      <nav className="sticky top-0 z-10 bg-[#0f172a] text-white shadow-xl border-b border-white/5">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-5">
          <Link
            href="/registrar/courses"
            className="flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-white"
          >
            <ArrowLeft size={16} /> Back to Courses
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
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-[#0f172a] to-[#3b1225] p-8 text-white shadow-xl">
          <div className="flex items-center gap-3">
            <BookOpen size={28} className="text-red-300" />
            <div>
              <h2 className="text-3xl font-black tracking-tight">
                Edit Course
              </h2>
              <p className="mt-1 text-sm text-red-200 font-medium">
                {course.code} — {course.name}
              </p>
            </div>
          </div>
        </div>

        <CourseForm
          action={updateCourse}
          semesters={semesters}
          instructors={instructors}
          initial={{
            id: course.id,
            code: course.code,
            name: course.name,
            credits: course.credits,
            maxStudents: course.maxStudents,
            schedule: course.schedule,
            semesterId: course.semesterId,
            instructorId: course.instructorId,
          }}
          submitLabel="Save Changes"
        />
      </main>
    </div>
  );
}
