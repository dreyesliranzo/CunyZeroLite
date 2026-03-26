import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: "file:./dev.db" });
const prisma = new PrismaClient({ adapter }) as any;

function makeEmail(firstName: string, lastName: string) {
  return `${firstName[0].toLowerCase()}${lastName.toLowerCase()}00@cuny.edu`;
}

async function main() {
  console.log("Seeding database...");

  // Clean all tables (child → parent order)
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

  // ═══════════════════════════════════════════════════════════════════
  // 1. USERS
  // ═══════════════════════════════════════════════════════════════════

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

  // 3 instructors (one will have warnings, one will be suspended)
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

  // 10 students with various GPAs covering all spec scenarios
  const studentInfo = [
    { firstName: "Emma",     lastName: "Wilson",   gpa: 3.8 },  // 0: honor roll, good standing
    { firstName: "Liam",     lastName: "Johnson",  gpa: 3.5 },  // 1: good standing
    { firstName: "Olivia",   lastName: "Brown",    gpa: 2.9 },  // 2: average
    { firstName: "Noah",     lastName: "Davis",    gpa: 3.2 },  // 3: good
    { firstName: "Ava",      lastName: "Martinez", gpa: 3.9 },  // 4: highest GPA, honor roll
    { firstName: "Ethan",    lastName: "Anderson", gpa: 2.15 }, // 5: GPA between 2.0-2.25, warning + interview
    { firstName: "Sophia",   lastName: "Taylor",   gpa: 3.6 },  // 6: good standing
    { firstName: "Mason",    lastName: "Harris",   gpa: 1.8 },  // 7: GPA < 2.0, terminated
    { firstName: "Isabella", lastName: "Clark",    gpa: 3.3 },  // 8: good standing
    { firstName: "James",    lastName: "Robinson", gpa: 2.7 },  // 9: average, on waitlist
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

  // 2 visitors
  const visitors = await Promise.all([
    prisma.user.create({
      data: {
        email: makeEmail("Pat", "Rivera"),
        username: makeEmail("Pat", "Rivera"),
        password: "visit123",
        firstName: "Pat",
        lastName: "Rivera",
        role: "VISITOR",
        mustChangePassword: false,
      },
    }),
    prisma.user.create({
      data: {
        email: makeEmail("Sam", "Chen"),
        username: makeEmail("Sam", "Chen"),
        password: "visit123",
        firstName: "Sam",
        lastName: "Chen",
        role: "VISITOR",
        mustChangePassword: false,
      },
    }),
  ]);

  // ═══════════════════════════════════════════════════════════════════
  // 2. SEMESTERS (past + current)
  // ═══════════════════════════════════════════════════════════════════

  const fallSemester = await prisma.semester.create({
    data: {
      name: "Fall 2025",
      year: 2025,
      term: "Fall",
      period: "COMPLETED",
      startDate: new Date("2025-08-25"),
      endDate: new Date("2025-12-15"),
      isCurrent: false,
      programQuota: 50,
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
      programQuota: 50,
    },
  });

  // ═══════════════════════════════════════════════════════════════════
  // 3. COURSES — Fall 2025 (completed, with grades) + Spring 2026 (current)
  // ═══════════════════════════════════════════════════════════════════

  // Fall 2025 courses (completed with grades)
  const fallCourses = await Promise.all([
    prisma.course.create({
      data: {
        code: "CS101", name: "Introduction to Computer Science",
        credits: 3, maxStudents: 30, schedule: "MWF 10:00-11:00",
        instructorId: instructors[0].id, semesterId: fallSemester.id,
      },
    }),
    prisma.course.create({
      data: {
        code: "CS201", name: "Data Structures and Algorithms",
        credits: 3, maxStudents: 25, schedule: "TTh 09:00-10:30",
        instructorId: instructors[0].id, semesterId: fallSemester.id,
      },
    }),
    prisma.course.create({
      data: {
        code: "CS301", name: "Database Systems",
        credits: 3, maxStudents: 20, schedule: "MWF 13:00-14:00",
        instructorId: instructors[1].id, semesterId: fallSemester.id,
      },
    }),
    prisma.course.create({
      data: {
        code: "CS401", name: "Software Engineering",
        credits: 3, maxStudents: 20, schedule: "TTh 14:00-15:30",
        instructorId: instructors[1].id, semesterId: fallSemester.id,
      },
    }),
    // Cancelled course — fewer than 3 students
    prisma.course.create({
      data: {
        code: "CS601", name: "Computer Networks",
        credits: 3, maxStudents: 20, schedule: "MWF 16:00-17:00",
        instructorId: instructors[2].id, semesterId: fallSemester.id,
        cancelled: true,
      },
    }),
  ]);

  // Spring 2026 courses (current, no grades yet)
  const springCourses = await Promise.all([
    prisma.course.create({
      data: {
        code: "CS101", name: "Introduction to Computer Science",
        credits: 3, maxStudents: 30, schedule: "MWF 10:00-11:00",
        instructorId: instructors[0].id, semesterId: springSemester.id,
      },
    }),
    prisma.course.create({
      data: {
        code: "CS201", name: "Data Structures and Algorithms",
        credits: 3, maxStudents: 25, schedule: "TTh 09:00-10:30",
        instructorId: instructors[0].id, semesterId: springSemester.id,
      },
    }),
    prisma.course.create({
      data: {
        code: "CS301", name: "Database Systems",
        credits: 3, maxStudents: 20, schedule: "MWF 13:00-14:00",
        instructorId: instructors[1].id, semesterId: springSemester.id,
      },
    }),
    prisma.course.create({
      data: {
        code: "CS401", name: "Software Engineering",
        credits: 3, maxStudents: 20, schedule: "TTh 14:00-15:30",
        instructorId: instructors[1].id, semesterId: springSemester.id,
      },
    }),
    prisma.course.create({
      data: {
        code: "CS501", name: "Artificial Intelligence",
        credits: 3, maxStudents: 15, schedule: "MWF 15:00-16:00",
        instructorId: instructors[2].id, semesterId: springSemester.id,
      },
    }),
  ]);

  // ═══════════════════════════════════════════════════════════════════
  // 4. FALL 2025 ENROLLMENTS (completed with grades)
  // ═══════════════════════════════════════════════════════════════════

  const fallEnrollments = [
    // Emma: A, A, A (GPA 4.0 semester → honor roll)
    { studentIdx: 0, courseIdx: 0, grade: "A" },
    { studentIdx: 0, courseIdx: 2, grade: "A" },
    { studentIdx: 0, courseIdx: 3, grade: "A" },
    // Liam: A, B, B (GPA 3.33)
    { studentIdx: 1, courseIdx: 0, grade: "A" },
    { studentIdx: 1, courseIdx: 1, grade: "B" },
    { studentIdx: 1, courseIdx: 3, grade: "B" },
    // Olivia: B, C, B (GPA 2.67)
    { studentIdx: 2, courseIdx: 0, grade: "B" },
    { studentIdx: 2, courseIdx: 1, grade: "C" },
    { studentIdx: 2, courseIdx: 2, grade: "B" },
    // Noah: A, B, A (GPA 3.67)
    { studentIdx: 3, courseIdx: 0, grade: "A" },
    { studentIdx: 3, courseIdx: 1, grade: "B" },
    { studentIdx: 3, courseIdx: 2, grade: "A" },
    // Ava: A, A, A, A (GPA 4.0 → honor roll)
    { studentIdx: 4, courseIdx: 0, grade: "A" },
    { studentIdx: 4, courseIdx: 1, grade: "A" },
    { studentIdx: 4, courseIdx: 2, grade: "A" },
    { studentIdx: 4, courseIdx: 3, grade: "A" },
    // Ethan: D, D, F (GPA 0.67 semester — very low)
    { studentIdx: 5, courseIdx: 0, grade: "D" },
    { studentIdx: 5, courseIdx: 1, grade: "D" },
    { studentIdx: 5, courseIdx: 2, grade: "F" },
    // Sophia: A, B, A (GPA 3.67)
    { studentIdx: 6, courseIdx: 0, grade: "A" },
    { studentIdx: 6, courseIdx: 2, grade: "B" },
    { studentIdx: 6, courseIdx: 3, grade: "A" },
    // Mason: F, D, F (GPA 0.33 → terminated for GPA < 2.0)
    { studentIdx: 7, courseIdx: 1, grade: "F" },
    { studentIdx: 7, courseIdx: 2, grade: "D" },
    { studentIdx: 7, courseIdx: 3, grade: "F" },
    // Isabella: B, A, B (GPA 3.33)
    { studentIdx: 8, courseIdx: 0, grade: "B" },
    { studentIdx: 8, courseIdx: 1, grade: "A" },
    { studentIdx: 8, courseIdx: 3, grade: "B" },
    // James: C, B (GPA 2.5)
    { studentIdx: 9, courseIdx: 1, grade: "C" },
    { studentIdx: 9, courseIdx: 2, grade: "B" },
  ];

  await Promise.all(
    fallEnrollments.map((e) =>
      prisma.enrollment.create({
        data: {
          userId: students[e.studentIdx].id,
          courseId: fallCourses[e.courseIdx].id,
          status: "COMPLETED",
          grade: e.grade,
        },
      })
    )
  );

  // ═══════════════════════════════════════════════════════════════════
  // 5. SPRING 2026 ENROLLMENTS (current, no grades)
  // ═══════════════════════════════════════════════════════════════════

  const springEnrollments = [
    // Emma: 3 courses
    { studentIdx: 0, courseIdx: 0 },
    { studentIdx: 0, courseIdx: 2 },
    { studentIdx: 0, courseIdx: 4 },
    // Liam: 3 courses
    { studentIdx: 1, courseIdx: 0 },
    { studentIdx: 1, courseIdx: 1 },
    { studentIdx: 1, courseIdx: 3 },
    // Olivia: 2 courses
    { studentIdx: 2, courseIdx: 1 },
    { studentIdx: 2, courseIdx: 2 },
    // Noah: 3 courses
    { studentIdx: 3, courseIdx: 0 },
    { studentIdx: 3, courseIdx: 3 },
    { studentIdx: 3, courseIdx: 4 },
    // Ava: 4 courses
    { studentIdx: 4, courseIdx: 0 },
    { studentIdx: 4, courseIdx: 1 },
    { studentIdx: 4, courseIdx: 2 },
    { studentIdx: 4, courseIdx: 3 },
    // Ethan: 2 courses (retaking CS301 after F, plus new course)
    { studentIdx: 5, courseIdx: 2 },  // retaking CS301
    { studentIdx: 5, courseIdx: 4 },
    // Sophia: 3 courses
    { studentIdx: 6, courseIdx: 0 },
    { studentIdx: 6, courseIdx: 2 },
    { studentIdx: 6, courseIdx: 3 },
    // Mason: NOT enrolled — terminated for GPA < 2.0
    // Isabella: 3 courses
    { studentIdx: 8, courseIdx: 0 },
    { studentIdx: 8, courseIdx: 1 },
    { studentIdx: 8, courseIdx: 4 },
    // James: 2 courses
    { studentIdx: 9, courseIdx: 1 },
    { studentIdx: 9, courseIdx: 2 },
  ];

  await Promise.all(
    springEnrollments.map((e) =>
      prisma.enrollment.create({
        data: {
          userId: students[e.studentIdx].id,
          courseId: springCourses[e.courseIdx].id,
          status: "ENROLLED",
        },
      })
    )
  );

  // ═══════════════════════════════════════════════════════════════════
  // 6. WAITLIST
  // ═══════════════════════════════════════════════════════════════════

  // James waiting for CS501 (AI class, small cap of 15)
  await prisma.waitlist.create({
    data: {
      userId: students[9].id,
      courseId: springCourses[4].id,
      position: 1,
      status: "WAITING",
    },
  });

  // ═══════════════════════════════════════════════════════════════════
  // 7. REVIEWS (Fall 2025 courses — grades posted, mixed ratings)
  // ═══════════════════════════════════════════════════════════════════

  await Promise.all([
    // CS101 reviews (high rated)
    prisma.review.create({
      data: { rating: 5, comment: "Excellent course, Prof. Smith explains everything clearly!", authorId: students[0].id, courseId: fallCourses[0].id },
    }),
    prisma.review.create({
      data: { rating: 4, comment: "Great intro course, well structured.", authorId: students[1].id, courseId: fallCourses[0].id },
    }),
    prisma.review.create({
      data: { rating: 5, comment: "Best CS course I have taken so far.", authorId: students[4].id, courseId: fallCourses[0].id },
    }),

    // CS201 reviews (mixed)
    prisma.review.create({
      data: { rating: 3, comment: "Content is good but too fast-paced.", authorId: students[2].id, courseId: fallCourses[1].id },
    }),
    prisma.review.create({
      data: { rating: 4, comment: "Challenging but rewarding. Learned a lot.", authorId: students[1].id, courseId: fallCourses[1].id },
    }),

    // CS301 reviews (high rated)
    prisma.review.create({
      data: { rating: 5, comment: "Prof. Garcia makes databases interesting. Highly recommend!", authorId: students[4].id, courseId: fallCourses[2].id },
    }),
    prisma.review.create({
      data: { rating: 4, comment: "Practical and well-taught course.", authorId: students[3].id, courseId: fallCourses[2].id },
    }),

    // CS401 reviews (low rated — will trigger instructor warning)
    prisma.review.create({
      data: { rating: 1, comment: "Disorganized lectures, unclear expectations.", authorId: students[6].id, courseId: fallCourses[3].id },
    }),
    prisma.review.create({
      data: { rating: 2, comment: "Not great. Assignments were confusing.", authorId: students[8].id, courseId: fallCourses[3].id },
    }),
    prisma.review.create({
      data: { rating: 1, comment: "Would not recommend this course to anyone.", authorId: students[1].id, courseId: fallCourses[3].id },
    }),
  ]);

  // ═══════════════════════════════════════════════════════════════════
  // 8. TABOO WORDS (managed by registrar)
  // ═══════════════════════════════════════════════════════════════════

  const tabooWords = ["hate", "stupid", "idiot", "terrible", "awful", "trash", "useless", "dumb"];
  await Promise.all(
    tabooWords.map((word) => prisma.tabooWord.create({ data: { word } }))
  );

  // ═══════════════════════════════════════════════════════════════════
  // 9. WARNINGS (various reasons from spec)
  // ═══════════════════════════════════════════════════════════════════

  // Ethan: 2 warnings — GPA warning + academic standing interview required
  await prisma.warning.create({
    data: { userId: students[5].id, reason: "GPA between 2.0 and 2.25 — registrar interview required." },
  });
  await prisma.warning.create({
    data: { userId: students[5].id, reason: "Failed CS301 in Fall 2025." },
  });
  await prisma.user.update({
    where: { id: students[5].id },
    data: { warnings: 2 },
  });

  // Mason: 3 warnings → suspended + terminated for GPA < 2.0
  await prisma.warning.create({
    data: { userId: students[7].id, reason: "GPA fell below 2.0 after Fall 2025." },
  });
  await prisma.warning.create({
    data: { userId: students[7].id, reason: "Failed CS201 in Fall 2025." },
  });
  await prisma.warning.create({
    data: { userId: students[7].id, reason: "Failed CS401 in Fall 2025." },
  });
  await prisma.user.update({
    where: { id: students[7].id },
    data: { warnings: 3, suspended: true, terminated: true, fineOwed: 200.0 },
  });

  // Instructor warning: Maria Garcia — CS401 average rating < 2 (avg = 1.33)
  await prisma.warning.create({
    data: { userId: instructors[1].id, reason: "CS401 average rating fell below 2.0 (1.33 avg) in Fall 2025." },
  });
  await prisma.user.update({
    where: { id: instructors[1].id },
    data: { warnings: 1 },
  });

  // Instructor warning: David Lee — course cancelled (CS601)
  await prisma.warning.create({
    data: { userId: instructors[2].id, reason: "CS601 (Computer Networks) cancelled due to fewer than 3 enrolled students in Fall 2025." },
  });
  await prisma.user.update({
    where: { id: instructors[2].id },
    data: { warnings: 1 },
  });

  // ═══════════════════════════════════════════════════════════════════
  // 10. COMPLAINTS
  // ═══════════════════════════════════════════════════════════════════

  // Student about student
  await prisma.complaint.create({
    data: {
      description: "Ethan has been disrupting the online discussion forum with off-topic posts.",
      filerId: students[6].id,   // Sophia
      targetId: students[5].id,  // Ethan
      status: "PENDING",
    },
  });

  // Student about instructor
  await prisma.complaint.create({
    data: {
      description: "Prof. Garcia did not provide clear grading rubrics for CS401 assignments.",
      filerId: students[8].id,   // Isabella
      targetId: instructors[1].id, // Maria Garcia
      status: "PENDING",
    },
  });

  // Instructor about student (resolved)
  await prisma.complaint.create({
    data: {
      description: "Mason Harris submitted plagiarized work for the final project in CS201.",
      filerId: instructors[0].id,  // John Smith
      targetId: students[7].id,    // Mason
      status: "RESOLVED_WARNING",
      resolution: "Registrar confirmed plagiarism. Warning issued to student.",
    },
  });

  // ═══════════════════════════════════════════════════════════════════
  // 11. APPLICATIONS
  // ═══════════════════════════════════════════════════════════════════

  // Visitor applying as student (pending, meets GPA requirement)
  await prisma.application.create({
    data: {
      userId: visitors[0].id,
      type: "STUDENT",
      status: "PENDING",
      priorGpa: 3.4,
    },
  });

  // Visitor applying as instructor (pending)
  await prisma.application.create({
    data: {
      userId: visitors[1].id,
      type: "INSTRUCTOR",
      status: "PENDING",
    },
  });

  // ═══════════════════════════════════════════════════════════════════
  // 12. HONOR ROLL
  // ═══════════════════════════════════════════════════════════════════

  // Emma: semester GPA > 3.75 in Fall 2025
  await prisma.honorRoll.create({
    data: {
      userId: students[0].id,
      semesterId: fallSemester.id,
      type: "SEMESTER",
    },
  });

  // Ava: semester GPA > 3.75 AND overall GPA > 3.5
  await prisma.honorRoll.create({
    data: {
      userId: students[4].id,
      semesterId: fallSemester.id,
      type: "SEMESTER",
    },
  });
  await prisma.honorRoll.create({
    data: {
      userId: students[4].id,
      semesterId: fallSemester.id,
      type: "OVERALL",
    },
  });

  // ═══════════════════════════════════════════════════════════════════
  // 13. GRADUATION REQUEST
  // ═══════════════════════════════════════════════════════════════════

  // Rejected — student hasn't finished 8 courses yet (reckless application)
  await prisma.graduationRequest.create({
    data: {
      userId: students[2].id,  // Olivia — only completed 3 courses
      status: "REJECTED",
    },
  });

  console.log("Seed complete!");
  console.log(`  - 1 registrar: ${registrar.email}`);
  console.log(`  - ${instructors.length} instructors`);
  console.log(`  - ${students.length} students`);
  console.log(`  - ${visitors.length} visitors`);
  console.log(`  - 2 semesters (Fall 2025 completed, Spring 2026 current)`);
  console.log(`  - ${fallCourses.length} Fall courses (1 cancelled) + ${springCourses.length} Spring courses`);
  console.log(`  - ${fallEnrollments.length} Fall enrollments (graded) + ${springEnrollments.length} Spring enrollments`);
  console.log(`  - 10 reviews, 8 taboo words`);
  console.log(`  - 7 warnings (2 Ethan, 3 Mason, 1 Garcia, 1 Lee)`);
  console.log(`  - 3 complaints, 2 applications, 3 honor rolls, 1 graduation request`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
