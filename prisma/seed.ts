import { PrismaClient } from "../src/generated/prisma"; // Removed .js extension
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

// Ensure the path matches your prisma.config.ts
const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter }) as any;

function makeEmail(firstName: string, lastName: string) {
  return `${firstName[0].toLowerCase()}${lastName.toLowerCase()}00@cuny.edu`;
}

async function main() {
  console.log("Seeding database...");

  // Clean all tables
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

  // 1. REGISTRAR
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

  // 2. INSTRUCTORS
  const instructorInfo = [
    { firstName: "John",  lastName: "Smith" },
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

  // 3. STUDENTS
  const studentInfo = [
    { firstName: "Emma",     lastName: "Wilson",   gpa: 3.8 },
    { firstName: "Liam",     lastName: "Johnson",  gpa: 3.5 },
    { firstName: "Olivia",   lastName: "Brown",    gpa: 2.9 },
    { firstName: "Noah",     lastName: "Davis",    gpa: 3.2 },
    { firstName: "Ava",      lastName: "Martinez", gpa: 3.9 },
    { firstName: "Ethan",    lastName: "Anderson", gpa: 2.15 },
    { firstName: "Sophia",   lastName: "Taylor",   gpa: 3.6 },
    { firstName: "Mason",    lastName: "Harris",   gpa: 1.8 },
    { firstName: "Isabella", lastName: "Clark",    gpa: 3.3 },
    { firstName: "James",    lastName: "Robinson", gpa: 2.7 },
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
          gpa: s.gpa,
          role: "STUDENT",
          mustChangePassword: false,
        },
      });
    })
  );

  // 4. SEMESTERS
  const fallSemester = await prisma.semester.create({
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

  const springSemester = await prisma.semester.create({
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

  // 5. COURSES
  const springCourses = await Promise.all([
    prisma.course.create({
      data: {
        code: "CS101", name: "Intro to CS",
        credits: 3, maxStudents: 30, schedule: "MWF 10-11",
        instructorId: instructors[0].id, semesterId: springSemester.id,
      },
    }),
    prisma.course.create({
      data: {
        code: "CS201", name: "Data Structures",
        credits: 3, maxStudents: 25, schedule: "TTh 9-10:30",
        instructorId: instructors[0].id, semesterId: springSemester.id,
      },
    }),
  ]);

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