export type Step = {
  id: number;
  title: string;
  blurb: string;
  bullets: string[];
  cta?: { label: string; href: string };
};

export const STEPS: Step[] = [
  {
    id: 1,
    title: "Welcome to CunyZeroLite",
    blurb:
      "This 6-step tour shows you everything you need to do during the semester. You can come back to it any time.",
    bullets: [
      "Your dashboard is home base — courses, grades, warnings, fines.",
      "Look for the navy navbar at the top of every page.",
      "Roles: registrar admins, instructors teach, you (student) take classes.",
    ],
  },
  {
    id: 2,
    title: "Registering for Courses",
    blurb:
      "You must enroll in at least 2 (max 4) courses each semester during the REGISTRATION period.",
    bullets: [
      "Schedule conflicts and full courses are detected automatically.",
      "If a course is full you join the waitlist and the instructor can admit you.",
      "You can drop courses freely during REGISTRATION — not after.",
      "Retaking a course is only allowed if you previously got an F.",
    ],
    cta: { label: "Open Course Registration", href: "/student/register" },
  },
  {
    id: 3,
    title: "Reviewing Courses",
    blurb:
      "Anonymous 1-5 star reviews help future students pick good classes.",
    bullets: [
      "Reviews close once grades are posted.",
      "Comments are filtered against a taboo word list.",
      "1-2 taboo words → masked + 1 warning. 3+ → hidden + 2 warnings.",
      "If a course average drops below 2.0, the instructor gets warned.",
    ],
    cta: { label: "Leave a Review", href: "/student/reviews" },
  },
  {
    id: 4,
    title: "Standing, Warnings, Honors",
    blurb:
      "Every semester your GPA is recomputed and your standing can change.",
    bullets: [
      "GPA < 2.0: termination (you leave the system).",
      "GPA 2.0-2.25: warning + interview with the registrar.",
      "Three warnings: suspended with a fine.",
      "Semester GPA > 3.75 or cumulative > 3.5: honor roll. Honor roll cancels one warning.",
    ],
  },
  {
    id: 5,
    title: "Filing Complaints",
    blurb:
      "Have a real issue with another student or an instructor? File it for registrar review.",
    bullets: [
      "Be specific in the description — the registrar reads them all.",
      "Unjustified complaints can result in a warning for the filer.",
      "View the status of your filings any time on the Complaints page.",
    ],
    cta: { label: "File a Complaint", href: "/complaints/new" },
  },
  {
    id: 6,
    title: "Applying for Graduation",
    blurb:
      "After 8 passing courses (A-D), you can submit a graduation request.",
    bullets: [
      "GPA below 2.0 or outstanding fines will block approval.",
      "Submitting prematurely is allowed but carries a warning risk if rejected.",
      "Once approved, your account is marked graduated.",
    ],
    cta: { label: "Graduation Page", href: "/student/graduation" },
  },
];
