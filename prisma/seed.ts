import { PrismaClient } from "../src/generated/prisma";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter }) as any;

function makeEmail(firstName: string, lastName: string) {
  return `${firstName[0].toLowerCase()}${lastName.toLowerCase()}00@cuny.edu`;
}

async function main() {
  console.log("Seeding database...");

  await prisma.honorRoll.deleteMany();
  await prisma.graduationRequest.deleteMany();
  await prisma.application.deleteMany();
  await prisma.warning.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.review.deleteMany();
  await prisma.waitlist.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.course.deleteMany();
  await prisma.semester.deleteMany();
  await prisma.tabooWord.deleteMany();
  await prisma.user.deleteMany();

  const registrar = await prisma.user.create({
    data: {
      email: makeEmail("Alice", "Admin"),
      username: makeEmail("Alice", "Admin"),
      password: "admin123",
      firstName: "Alice",
      lastName: "Admin",
      role: "REGISTRAR",
      mustChangePassword: false,
    },
  });

  const instructorInfo = [
    { firstName: "John", lastName: "Smith" },
    { firstName: "Maria", lastName: "Garcia" },
    { firstName: "David", lastName: "Lee" },
  ];
  const instructors = await Promise.all(
    instructorInfo.map((i) => {
      const email = makeEmail(i.firstName, i.lastName);
      return prisma.user.create({
        data: {
          email,
          username: email,
          password: "pass123",
          firstName: i.firstName,
          lastName: i.lastName,
          role: "INSTRUCTOR",
          mustChangePassword: false,
        },
      });
    })
  );
  const [john, maria, david] = instructors;

  const studentInfo = [
    { firstName: "Emma", lastName: "Wilson" },
    { firstName: "Liam", lastName: "Johnson" },
    { firstName: "Olivia", lastName: "Brown" },
    { firstName: "Noah", lastName: "Davis" },
    { firstName: "Ava", lastName: "Martinez" },
    { firstName: "Ethan", lastName: "Anderson" },
    { firstName: "Sophia", lastName: "Taylor" },
    { firstName: "Mason", lastName: "Harris" },
    { firstName: "Isabella", lastName: "Clark" },
    { firstName: "James", lastName: "Robinson" },
  ];
  const students = await Promise.all(
    studentInfo.map((s) => {
      const email = makeEmail(s.firstName, s.lastName);
      return prisma.user.create({
        data: {
          email,
          username: email,
          password: "student123",
          firstName: s.firstName,
          lastName: s.lastName,
          gpa: 0,
          role: "STUDENT",
          mustChangePassword: false,
        },
      });
    })
  );
  const byName = Object.fromEntries(students.map((s: any) => [s.firstName, s]));

  await prisma.user.update({
    where: { id: byName.Mason.id },
    data: { warnings: 3, suspended: true, terminated: true, fineOwed: 200 },
  });

  const fall = await prisma.semester.create({
    data: {
      name: "Fall 2025",
      year: 2025,
      term: "Fall",
      period: "COMPLETED",
      startDate: new Date("2025-08-25"),
      endDate: new Date("2025-12-15"),
      isCurrent: false,
    },
  });
  const spring = await prisma.semester.create({
    data: {
      name: "Spring 2026",
      year: 2026,
      term: "Spring",
      period: "REGISTRATION",
      startDate: new Date("2026-01-20"),
      endDate: new Date("2026-05-15"),
      isCurrent: true,
    },
  });

  // Fall courses (5)
  const fCS101 = await prisma.course.create({ data: { code: "CS101", name: "Intro to CS", credits: 3, maxStudents: 30, schedule: "MWF 10-11", instructorId: john.id, semesterId: fall.id } });
  const fCS201 = await prisma.course.create({ data: { code: "CS201", name: "Data Structures", credits: 3, maxStudents: 25, schedule: "TTh 9-10:30", instructorId: john.id, semesterId: fall.id } });
  const fCS301 = await prisma.course.create({ data: { code: "CS301", name: "Algorithms", credits: 3, maxStudents: 25, schedule: "MWF 1-2", instructorId: maria.id, semesterId: fall.id } });
  const fCS401 = await prisma.course.create({ data: { code: "CS401", name: "Advanced AI", credits: 3, maxStudents: 20, schedule: "TTh 2-3:30", instructorId: maria.id, semesterId: fall.id } });
  const fCS501 = await prisma.course.create({ data: { code: "CS501", name: "Software Engineering", credits: 3, maxStudents: 25, schedule: "MWF 3-4", instructorId: david.id, semesterId: fall.id } });

  // Spring courses (5, CS601 cancelled)
  const sCS101 = await prisma.course.create({ data: { code: "CS101", name: "Intro to CS", credits: 3, maxStudents: 30, schedule: "MWF 10-11", instructorId: john.id, semesterId: spring.id } });
  const sCS201 = await prisma.course.create({ data: { code: "CS201", name: "Data Structures", credits: 3, maxStudents: 25, schedule: "TTh 9-10:30", instructorId: john.id, semesterId: spring.id } });
  const sCS301 = await prisma.course.create({ data: { code: "CS301", name: "Algorithms", credits: 3, maxStudents: 25, schedule: "MWF 1-2", instructorId: maria.id, semesterId: spring.id } });
  const sCS501 = await prisma.course.create({ data: { code: "CS501", name: "Software Engineering", credits: 3, maxStudents: 25, schedule: "MWF 3-4", instructorId: david.id, semesterId: spring.id } });
  const sCS601 = await prisma.course.create({ data: { code: "CS601", name: "Topics in Databases", credits: 3, maxStudents: 25, schedule: "TTh 4-5:30", instructorId: david.id, semesterId: spring.id, cancelled: true } });

  // Fall enrollments — 30 graded
  const fallEnroll: { user: any; course: any; grade: string }[] = [
    // CS101 (8) — Intro, mostly passing
    { user: byName.Emma, course: fCS101, grade: "A" },
    { user: byName.Liam, course: fCS101, grade: "B" },
    { user: byName.Olivia, course: fCS101, grade: "B" },
    { user: byName.Noah, course: fCS101, grade: "B" },
    { user: byName.Ava, course: fCS101, grade: "A" },
    { user: byName.Ethan, course: fCS101, grade: "C" },
    { user: byName.Mason, course: fCS101, grade: "D" },
    { user: byName.Sophia, course: fCS101, grade: "A" },
    // CS201 (8)
    { user: byName.Emma, course: fCS201, grade: "A" },
    { user: byName.Liam, course: fCS201, grade: "B" },
    { user: byName.Noah, course: fCS201, grade: "C" },
    { user: byName.Ava, course: fCS201, grade: "A" },
    { user: byName.Ethan, course: fCS201, grade: "C" },
    { user: byName.Mason, course: fCS201, grade: "F" },
    { user: byName.Isabella, course: fCS201, grade: "B" },
    { user: byName.James, course: fCS201, grade: "C" },
    // CS301 (7) — Ethan fails, retakes in Spring
    { user: byName.Emma, course: fCS301, grade: "A" },
    { user: byName.Olivia, course: fCS301, grade: "B" },
    { user: byName.Ava, course: fCS301, grade: "A" },
    { user: byName.Ethan, course: fCS301, grade: "F" },
    { user: byName.Mason, course: fCS301, grade: "F" },
    { user: byName.Sophia, course: fCS301, grade: "B" },
    { user: byName.Isabella, course: fCS301, grade: "B" },
    // CS401 (7)
    { user: byName.Emma, course: fCS401, grade: "A" },
    { user: byName.Liam, course: fCS401, grade: "B" },
    { user: byName.Ava, course: fCS401, grade: "A" },
    { user: byName.Ethan, course: fCS401, grade: "C" },
    { user: byName.Mason, course: fCS401, grade: "F" },
    { user: byName.Sophia, course: fCS401, grade: "B" },
    { user: byName.James, course: fCS401, grade: "C" },
  ];
  for (const e of fallEnroll) {
    await prisma.enrollment.create({
      data: { userId: e.user.id, courseId: e.course.id, status: "COMPLETED", grade: e.grade },
    });
  }

  // Spring enrollments — 25 active
  const springEnroll: { user: any; course: any }[] = [
    // CS101 (6)
    { user: byName.Liam, course: sCS101 },
    { user: byName.Olivia, course: sCS101 },
    { user: byName.Noah, course: sCS101 },
    { user: byName.Sophia, course: sCS101 },
    { user: byName.Isabella, course: sCS101 },
    { user: byName.James, course: sCS101 },
    // CS201 (6)
    { user: byName.Liam, course: sCS201 },
    { user: byName.Noah, course: sCS201 },
    { user: byName.Ava, course: sCS201 },
    { user: byName.Sophia, course: sCS201 },
    { user: byName.Isabella, course: sCS201 },
    { user: byName.James, course: sCS201 },
    // CS301 (7) — Ethan retaking
    { user: byName.Emma, course: sCS301 },
    { user: byName.Liam, course: sCS301 },
    { user: byName.Olivia, course: sCS301 },
    { user: byName.Ava, course: sCS301 },
    { user: byName.Ethan, course: sCS301 },
    { user: byName.Sophia, course: sCS301 },
    { user: byName.Isabella, course: sCS301 },
    // CS501 (6)
    { user: byName.Emma, course: sCS501 },
    { user: byName.Olivia, course: sCS501 },
    { user: byName.Noah, course: sCS501 },
    { user: byName.Ava, course: sCS501 },
    { user: byName.Sophia, course: sCS501 },
    { user: byName.James, course: sCS501 },
  ];
  for (const e of springEnroll) {
    await prisma.enrollment.create({
      data: { userId: e.user.id, courseId: e.course.id, status: "ENROLLED" },
    });
  }

  // Reviews — CS401 gets low ratings (avg < 2 → instructor warning to Maria)
  const cs401Reviews = [
    { author: byName.Liam, rating: 1, comment: "Disorganized lectures." },
    { author: byName.Ethan, rating: 1, comment: "Too fast paced, no support." },
    { author: byName.Sophia, rating: 2, comment: "Hard to follow." },
    { author: byName.James, rating: 2, comment: "Materials were unclear." },
  ];
  for (const r of cs401Reviews) {
    await prisma.review.create({
      data: { authorId: r.author.id, courseId: fCS401.id, rating: r.rating, comment: r.comment },
    });
  }
  // Some positive reviews for top-rated homepage section
  const positiveReviews = [
    { author: byName.Emma, course: fCS101, rating: 5, comment: "Great intro course." },
    { author: byName.Ava, course: fCS101, rating: 5, comment: "Loved the instructor." },
    { author: byName.Liam, course: fCS101, rating: 4, comment: "Solid foundation." },
    { author: byName.Emma, course: fCS201, rating: 5, comment: "Challenging but rewarding." },
    { author: byName.Ava, course: fCS201, rating: 5, comment: "Best CS course so far." },
    { author: byName.Emma, course: fCS301, rating: 4, comment: "Tough but fair." },
    { author: byName.Ava, course: fCS301, rating: 5, comment: "Excellent material." },
    { author: byName.Sophia, course: fCS501, rating: 4, comment: "Practical and well-paced." },
  ];
  for (const r of positiveReviews) {
    await prisma.review.create({
      data: { authorId: r.author.id, courseId: r.course.id, rating: r.rating, comment: r.comment },
    });
  }

  // Warnings — also update User.warnings counter to stay in sync
  const warningRows = [
    { userId: byName.Mason.id, reason: "Failed CS201 in Fall 2025." },
    { userId: byName.Mason.id, reason: "Failed CS301 in Fall 2025." },
    { userId: byName.Mason.id, reason: "Failed CS401 in Fall 2025." },
    { userId: byName.Ethan.id, reason: "Failed CS301 in Fall 2025." },
    { userId: byName.Ethan.id, reason: "GPA below 2.0 after Fall 2025." },
    { userId: maria.id, reason: "CS401 average rating below 2.0 in Fall 2025." },
    { userId: david.id, reason: "Course CS601 cancelled — fewer than 3 enrolled." },
  ];
  await prisma.warning.createMany({ data: warningRows });
  const warningCounts = warningRows.reduce<Record<number, number>>((acc, w) => {
    acc[w.userId] = (acc[w.userId] ?? 0) + 1;
    return acc;
  }, {});
  for (const [uid, count] of Object.entries(warningCounts)) {
    await prisma.user.update({
      where: { id: Number(uid) },
      data: { warnings: count },
    });
  }

  // Compute student GPAs from actual grades (A=4, B=3, C=2, D=1, F=0)
  const GRADE_POINTS: Record<string, number> = { A: 4, B: 3, C: 2, D: 1, F: 0 };
  for (const s of students) {
    const graded = await prisma.enrollment.findMany({
      where: { userId: s.id, grade: { not: null } },
      select: { grade: true },
    });
    if (graded.length === 0) continue;
    const total = graded.reduce((sum: number, e: { grade: string | null }) => sum + (GRADE_POINTS[e.grade!] ?? 0), 0);
    const gpa = Math.round((total / graded.length) * 100) / 100;
    await prisma.user.update({ where: { id: s.id }, data: { gpa } });
  }

  // Graduation requests — Olivia rejected; per spec rejection issues a
  // reckless-application warning to the student.
  await prisma.graduationRequest.create({
    data: { userId: byName.Olivia.id, status: "REJECTED" },
  });
  await prisma.warning.create({
    data: {
      userId: byName.Olivia.id,
      reason: "Reckless graduation application — only 2 passing courses, requires 8.",
    },
  });
  await prisma.user.update({
    where: { id: byName.Olivia.id },
    data: { warnings: { increment: 1 } },
  });

  // Honor Roll — only SEMESTER honors are valid after a single semester.
  // OVERALL honor roll requires more than 1 semester of grades per spec.
  await prisma.honorRoll.createMany({
    data: [
      { userId: byName.Ava.id, semesterId: fall.id, type: "SEMESTER" },
      { userId: byName.Emma.id, semesterId: fall.id, type: "SEMESTER" },
    ],
  });

  // Visitor applications (anonymous — no User row, just Application)
  await prisma.application.createMany({
    data: [
      {
        type: "STUDENT",
        status: "PENDING",
        firstName: "Priya",
        lastName: "Rivera",
        email: "privera00@cuny.edu",
        priorGpa: 3.4,
        justification: "Transferring from community college, want to complete CS degree.",
      },
      {
        type: "INSTRUCTOR",
        status: "PENDING",
        firstName: "Steven",
        lastName: "Chen",
        email: "schen00@cuny.edu",
        justification: "PhD in CS, 8 years of teaching experience, want to teach algorithms.",
      },
    ],
  });

  // Taboo words
  await prisma.tabooWord.createMany({
    data: [{ word: "stupid" }, { word: "trash" }, { word: "useless" }, { word: "garbage" }],
  });

  console.log("Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
