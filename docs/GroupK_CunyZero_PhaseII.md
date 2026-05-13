
# Group K

---

# CunyZeroLite
# Design Report
# Phase II

**Version 1.0**

---

| CunyZeroLite | Version: 1.0 |
|---|---|
| Design Report | Date: 21/04/26 |

## Revision History

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 21/04/26 | 1.0 | Phase II Design Report covering system architecture, all seventeen use cases with normal and exceptional scenarios, collaboration and sequence diagrams, Petri-nets, E-R diagram, detailed pseudo-code for every method, and system screen descriptions. | Diego Reyes Liranzo, Daniel Olekszyk, Samia Islam, Maisha Islam, Kyle Gosine |

---

## Table of Contents

1. Introduction .................. 1
   1.1 Purpose .................. 1
   1.2 System Collaboration Class Diagram .................. 1
2. Use Cases .................. 2
   2.1 Use-Case Scenarios .................. 2
   2.2 Collaboration and Sequence Diagrams .................. 2
   2.3 Petri-Net Diagrams .................. 2
3. E-R Diagram .................. 3
4. Detailed Design .................. 4
5. System Screens .................. 5
6. Meeting Memos .................. 6
7. Repository .................. 7

---

# 1. Introduction

## 1.1 Purpose

This Phase II Design Report provides the data structures and logic required to implement the CUNYZeroLite college management system as specified in the Phase I Software Requirements Specification. It contains the Entity-Relationship model, detailed pseudo-code for every method, use-case scenarios with collaboration/sequence diagrams, Petri-nets, and representative system screen descriptions. The implementation will be based entirely on this document.

## 1.2 System Collaboration Class Diagram

The CUNYZeroLite system is organized around a layered architecture with the following collaborating subsystems:

```
+-------------------------------------------------------------------+
|                       <<boundary>>                                 |
|                    Browser / Client                                |
|  [LoginPage] [Dashboard] [StudentPortal] [InstructorPortal]       |
|  [RegistrarPortal] [PublicHomePage] [AIChatWidget]                 |
+-------------------------------|------------------------------------+
                                |  HTTP / Server Actions
+-------------------------------|------------------------------------+
|                       <<control>>                                  |
|                    Next.js API Routes & Server Actions              |
|  [loginUser] [logoutUser] [changePassword] [getSession]           |
|  [registerForCourse] [assignGrade] [submitReview]                 |
|  [fileComplaint] [processComplaint] [manageApplication]           |
|  [manageSemester] [setupCourse] [applyGraduation]                 |
|  [manageTabooWords] [enforceRunningRules] [askAI]                 |
+-------------------------------|------------------------------------+
                                |  Prisma ORM
+-------------------------------|------------------------------------+
|                       <<entity>>                                   |
|                    SQLite Database (via Prisma)                     |
|  [User] [Semester] [Course] [Enrollment] [Waitlist]               |
|  [Review] [Complaint] [Warning] [Application]                     |
|  [GraduationRequest] [TabooWord] [HonorRoll]                     |
+-------------------------------------------------------------------+
```

**Collaboration summary:** The Browser sends requests to the Next.js control layer. Server Actions (`loginUser`, `registerForCourse`, etc.) validate input, enforce business rules, and interact with the Prisma ORM entity layer. The entity layer persists data in SQLite. Session management uses HTTP-only cookies. The AI subsystem queries a local `policy.json` knowledge base and falls back to OpenAI GPT-4o-mini.

---

# 2. Use Cases

## 2.1 Use-Case Scenarios

### UC-1: View Public Homepage

**Normal Scenario:**
1. Visitor navigates to the homepage.
2. System displays general introduction, highest-rated courses, lowest-rated courses, and top-GPA students.
3. Lite AI chat widget is visible in the corner.
4. Visitor reads information or interacts with Lite.

**Exceptional Scenario:**
- **No data exists:** System displays placeholder text ("No courses available yet").
- **Database unreachable:** System shows a generic error page.

---

### UC-2: Apply as Student or Instructor

**Normal Scenario:**
1. Visitor clicks "Apply" on the homepage.
2. System presents application form.
3. Visitor selects role (Student or Instructor).
4. For Student: enters prior GPA and written justification.
5. For Instructor: enters name and contact info (no justification required).
6. Visitor submits the form.
7. System creates an Application record with status PENDING and displays confirmation.

**Exceptional Scenario:**
- **Missing required fields:** System highlights empty fields and prevents submission.
- **Prior GPA out of range (Student):** System rejects values outside 0.0-4.0.
- **Duplicate application:** System informs the visitor that a pending application already exists.

---

### UC-3: Approve/Reject Applications

**Normal Scenario:**
1. Registrar navigates to the Applications page.
2. System displays all PENDING applications.
3. For a Student application with prior GPA > 3.0 and quota not reached, system flags it for auto-acceptance.
4. Registrar clicks "Approve."
5. System generates university email (first initial + last name + 00@cuny.edu) and temporary password.
6. Application status updates to ACCEPTED; a new User record is created with role STUDENT and mustChangePassword = true.

**Exceptional Scenario:**
- **Reject a qualified student (GPA > 3.0):** System requires registrar to provide written justification before rejecting.
- **Program quota reached:** System alerts registrar that quota is full; registrar may still override.
- **Instructor application rejected:** System sets status to REJECTED with no justification required.

---

### UC-4: Manage Semester Periods

**Normal Scenario:**
1. Registrar opens Semester Management.
2. System shows current semester and its period.
3. Registrar clicks "Advance Period."
4. System transitions: CLASS_SETUP -> REGISTRATION -> RUNNING -> GRADING -> COMPLETED.
5. Period updates; UI reflects the new state.

**Exceptional Scenario:**
- **Advance to COMPLETED triggers academic evaluation:** System auto-recalculates GPAs, checks honor roll, issues termination for GPA < 2.0 or double-fail, issues warnings for GPA 2.0-2.25.
- **No current semester exists:** System prompts registrar to create one first.
- **Advance out of order:** System only allows the next sequential period.

---

### UC-5: Set Up Courses

**Normal Scenario:**
1. Registrar opens Course Management during CLASS_SETUP.
2. Registrar enters course code, name, credits, schedule, max students, and selects an instructor.
3. System creates the Course record linked to the current semester.
4. Course appears in the course list.

**Exceptional Scenario:**
- **Duplicate course code in same semester:** System rejects with error.
- **Cancel a course:** Registrar clicks cancel; system sets cancelled = true and issues a warning to the instructor.
- **Semester not in CLASS_SETUP:** System disables course creation.

---

### UC-6: Register for Courses

**Normal Scenario:**
1. Student opens Course Registration during REGISTRATION period.
2. System displays available courses for the current semester.
3. Student selects a course.
4. System checks: no time conflict, course not full, student not suspended/terminated, and student has between 2-4 courses.
5. System creates Enrollment record with status ENROLLED.

**Exceptional Scenario:**
- **Time conflict:** System rejects and displays conflicting course.
- **Course full:** System creates Waitlist entry instead and shows waitlist position.
- **Student suspended or terminated:** System denies with message.
- **Already enrolled in 4 courses:** System prevents registration.
- **Retaking a course not previously failed with F:** System blocks re-enrollment.

---

### UC-7: Manage Waitlist

**Normal Scenario:**
1. Instructor opens their course page.
2. System displays waitlisted students in order of request.
3. Instructor clicks "Admit" next to a student.
4. System changes Waitlist status to ADMITTED, creates an Enrollment record for the student.
5. Waitlist positions update for remaining students.

**Exceptional Scenario:**
- **Course already at capacity and instructor admits:** System still allows admission (instructor override).
- **Student no longer eligible (suspended since waitlisting):** System warns instructor and blocks admission.
- **Empty waitlist:** System displays "No students on waitlist."

---

### UC-8: Write and Rate Course Reviews

**Normal Scenario:**
1. Student navigates to Course Reviews.
2. System shows enrolled courses (grades not yet posted).
3. Student selects a course, enters a 1-5 star rating and optional comment.
4. System checks comment against TabooWord list.
5. Zero taboo words found: review is created and published.
6. If course average rating drops below 2.0, instructor receives an automatic warning.

**Exceptional Scenario:**
- **1-2 taboo words:** System replaces words with asterisks, publishes the review, and issues 1 warning to student.
- **3+ taboo words:** System hides the review entirely and issues 2 warnings to student.
- **Grades already posted:** System prevents review submission for that course.
- **Duplicate review:** System rejects (unique constraint on authorId + courseId).

---

### UC-9: Assign Grades

**Normal Scenario:**
1. Instructor opens Grading page during GRADING period.
2. System lists all enrolled students per course.
3. Instructor assigns a letter grade (A, B, C, D, or F) to each student.
4. System saves grades to Enrollment records.
5. When all students are graded, system marks grading as complete for that course.

**Exceptional Scenario:**
- **Not all students graded before period ends:** Instructor receives a warning.
- **Class GPA > 3.5 or < 2.5:** Registrar may question instructor and issue warning/termination.
- **Student fails same course twice:** System auto-terminates the student after grades are finalized.
- **Student cumulative GPA < 2.0 after finalization:** System auto-terminates.
- **Student GPA 2.0-2.25:** System issues a warning; student must interview registrar.
- **Student semester GPA > 3.75 or cumulative > 3.5 (after >1 semester):** Honor roll entry created; one honor roll can remove one warning.

---

### UC-10: File Complaint

**Normal Scenario:**
1. Student or Instructor navigates to File Complaint.
2. User selects target (a student or instructor), enters description.
3. System creates Complaint record with status PENDING.
4. Confirmation is shown.

**Exceptional Scenario:**
- **Complaint against self:** System prevents filing.
- **Empty description:** System requires text before submission.
- **Instructor complaint requests de-registration of student:** Complaint description records this.

---

### UC-11: Process Complaints

**Normal Scenario:**
1. Registrar opens Pending Complaints.
2. System lists all PENDING complaints with filer and target details.
3. Registrar reviews a complaint and chooses action: issue warning, de-register student, or dismiss.
4. System updates Complaint status to RESOLVED and records resolution.

**Exceptional Scenario:**
- **Instructor-filed complaint:** Registrar must either punish the target student or issue a warning to the instructor for unjustified filing.
- **Action triggers 3rd warning on student:** System auto-suspends the student, sets fineOwed, and prevents future registration until fine is paid.
- **Dismiss complaint:** Status set to DISMISSED, no action taken.

---

### UC-12: Apply for Graduation

**Normal Scenario:**
1. Student navigates to Graduation Application.
2. System verifies student has completed 8 courses with passing grades.
3. Student submits application.
4. System creates GraduationRequest with status PENDING.

**Exceptional Scenario:**
- **Fewer than 8 completed courses:** System warns this is premature; student may still submit (reckless application).
- **Reckless application consequence:** If registrar rejects, student receives a warning.

---

### UC-13: Approve/Reject Graduation

**Normal Scenario:**
1. Registrar opens Graduation Requests.
2. System displays pending requests with student course history.
3. Registrar verifies 8 courses with passing grades and no outstanding holds (fines, suspension).
4. Registrar approves: student's `graduated` flag is set to true; student leaves the system.

**Exceptional Scenario:**
- **Outstanding holds exist:** Registrar rejects; student receives a warning for reckless application.
- **Fewer than 8 passing courses:** Registrar rejects; warning issued.

---

### UC-14: Ask AI Assistant (Lite)

**Normal Scenario:**
1. User clicks the Lite chat widget.
2. User types a question.
3. System searches policy.json for matching keywords (RAG).
4. Match found: relevant policy text is passed as context to GPT-4o-mini; grounded response is returned.
5. No match: GPT-4o-mini responds from general knowledge with a hallucination warning displayed.

**Exceptional Scenario:**
- **OpenAI API key invalid or missing:** System returns a fallback message: "AI assistant is currently unavailable."
- **API rate limit exceeded:** System queues the request or shows a retry message.
- **Empty question:** System prompts user to enter a question.

---

### UC-15: View Role-Based Dashboard

**Normal Scenario:**
1. User logs in successfully.
2. System reads session cookie and determines role.
3. System redirects to the appropriate dashboard:
   - **Student:** GPA, enrolled courses, warnings, fines, honor roll badge, quick actions.
   - **Instructor:** courses taught, enrolled student rosters, average ratings, warnings.
   - **Registrar:** system stats (total students/instructors/courses), pending items count, top students, management links.
4. Dashboard data is fetched from the database and rendered.

**Exceptional Scenario:**
- **Session expired or invalid:** System redirects to login.
- **First-time login (mustChangePassword = true):** System redirects to change-password page before dashboard.
- **User account terminated/suspended/fired between sessions:** Login check prevents access.

---

### UC-16: Manage Taboo Words

**Normal Scenario:**
1. Registrar opens Taboo Words page.
2. System displays the current list of taboo words.
3. Registrar adds a new word.
4. System creates TabooWord record.
5. Registrar removes a word: system deletes the record.

**Exceptional Scenario:**
- **Duplicate word:** System rejects (unique constraint on word).
- **Empty input:** System prevents submission.

---

### UC-17: Enforce Class Running Period Rules

**Normal Scenario:**
1. Registrar advances semester to RUNNING.
2. System automatically evaluates all enrollments:
   - Students enrolled in fewer than 2 courses receive a warning.
   - Courses with fewer than 3 enrolled students are cancelled.
   - Affected students get a special one-time registration window.
   - Instructors of cancelled courses receive a warning.
3. System updates all affected records.

**Exceptional Scenario:**
- **Instructor's entire course load cancelled:** Instructor is suspended and cannot teach next semester.
- **Student already at 3 warnings after this check:** Auto-suspension triggered.
- **No courses meet cancellation criteria:** System proceeds without changes.

---

## 2.2 Collaboration / Sequence Diagrams

### UC-1: View Public Homepage (Sequence Diagram)

```
Visitor          Browser          Server           Database
  |                |                |                  |
  |-- open URL --->|                |                  |
  |                |-- GET / ------>|                  |
  |                |                |-- query top      |
  |                |                |   courses,       |
  |                |                |   students ----->|
  |                |                |<-- result set ---|
  |                |<-- HTML page --|                  |
  |<-- display ----|                |                  |
```

### UC-2: Apply as Student or Instructor (Sequence Diagram)

```
Visitor          Browser           Server            Database
  |                |                 |                  |
  |-- fill form -->|                 |                  |
  |                |-- POST /api/    |                  |
  |                |   apply ------->|                  |
  |                |                 |-- validate       |
  |                |                 |   fields         |
  |                |                 |-- check          |
  |                |                 |   duplicate ----->|
  |                |                 |<-- no dup --------|
  |                |                 |-- INSERT         |
  |                |                 |   Application --->|
  |                |                 |<-- OK ------------|
  |                |<-- 200 confirm -|                  |
  |<-- show msg ---|                 |                  |
```

### UC-6: Register for Courses (Sequence Diagram)

```
Student          Browser           Server            Database
  |                |                 |                  |
  |-- select       |                 |                  |
  |   course ----->|                 |                  |
  |                |-- POST          |                  |
  |                |   /register --->|                  |
  |                |                 |-- getSession() ->|
  |                |                 |<-- session ------|
  |                |                 |-- check          |
  |                |                 |   suspended?     |
  |                |                 |-- check time     |
  |                |                 |   conflict ----->|
  |                |                 |<-- no conflict --|
  |                |                 |-- check          |
  |                |                 |   capacity ----->|
  |                |                 |<-- spots open ---|
  |                |                 |-- INSERT         |
  |                |                 |   Enrollment --->|
  |                |                 |<-- OK ---------- |
  |                |<-- success -----|                  |
  |<-- updated UI -|                 |                  |
```

### UC-9: Assign Grades (Sequence Diagram)

```
Instructor       Browser           Server            Database
  |                |                 |                  |
  |-- enter        |                 |                  |
  |   grades ----->|                 |                  |
  |                |-- POST          |                  |
  |                |   /grades ----->|                  |
  |                |                 |-- getSession()   |
  |                |                 |-- validate       |
  |                |                 |   all graded?    |
  |                |                 |-- UPDATE         |
  |                |                 |   Enrollment     |
  |                |                 |   grades ------->|
  |                |                 |<-- OK ---------- |
  |                |                 |-- recalc GPA     |
  |                |                 |-- check honors   |
  |                |                 |-- check          |
  |                |                 |   termination -->|
  |                |                 |<-- done ---------|
  |                |<-- success -----|                  |
  |<-- confirmed --|                 |                  |
```

### UC-15: View Role-Based Dashboard (Collaboration Diagram)

```
                  1: request dashboard
    [Browser] --------------------------------> [DashboardController]
       ^                                              |
       |                                    2: getSession()
       |                                              |
       |                                              v
       |                                     [SessionManager]
       |                                              |
       |                                    3: read cookie
       |                                              |
       |                              4: determine role
       |                                              |
       |                              5: redirect to
       |                                 role dashboard
       |                                              |
       |                                              v
       |                                  [RoleDashboard]
       |                                       |
       |                             6: query user data,
       |                                enrollments,
       |                                warnings, courses
       |                                       |
       |                                       v
       |                                  [Database]
       |                                       |
       |                             7: return data
       |                                       |
       |           8: render HTML               |
       |<---------------------------------------|
```

### UC-11: Process Complaints (Collaboration Diagram)

```
                  1: open complaints
    [Browser] --------------------------------> [ComplaintController]
       ^                                              |
       |                                    2: getSession()
       |                                    3: verify REGISTRAR
       |                                              |
       |                              4: fetch PENDING
       |                                 complaints
       |                                              v
       |                                         [Database]
       |                                              |
       |           5: display list                    |
       |<---------------------------------------------|
       |                                              |
       |-- 6: select action (warn/dismiss/punish) --->|
       |                                              |
       |                              7: UPDATE complaint
       |                                 status = RESOLVED
       |                              8: IF warn: INSERT
       |                                 Warning
       |                              9: IF 3 warnings:
       |                                 SET suspended=true,
       |                                 fineOwed += amount
       |                                              |
       |          10: confirmation                    |
       |<---------------------------------------------|
```

---

## 2.3 Petri-Net Diagrams

### Petri-Net 1: UC-6 — Register for Courses

```
                        (P1)
                     [Student at
                   Registration Page]
                         |
                         | t1: select course
                         v
                        (P2)
                    [Course Selected]
                         |
            +------------+-----------+
            |                        |
     t2: check eligibility    t3: check eligibility
        (PASS)                   (FAIL: suspended/
            |                     terminated)
            v                        |
           (P3)                      v
     [Eligibility OK]             (P_DENIED)
            |                  [Registration Denied]
            |
     +------+------+
     |             |
  t4: no         t5: time
  conflict       conflict
     |              |
     v              v
    (P4)         (P_CONFLICT)
  [No Conflict]  [Conflict Error]
     |
     +------+------+
     |             |
  t6: course    t7: course
  has spots      is full
     |              |
     v              v
    (P5)          (P6)
 [Spot Open]   [Course Full]
     |              |
  t8: INSERT     t9: INSERT
  Enrollment     Waitlist
     |              |
     v              v
    (P7)          (P8)
 [Enrolled]    [Waitlisted]
```

### Petri-Net 2: UC-9 — Assign Grades (with Academic Standing Evaluation)

```
                     (P1)
                 [Grading Period
                    Active]
                      |
                      | t1: instructor opens grading
                      v
                     (P2)
                 [Student List
                   Displayed]
                      |
                      | t2: assign letter grade (A/B/C/D/F)
                      v
                     (P3)
                 [Grade Saved]
                      |
            +---------+---------+
            |                   |
         t3: all             t4: not all
         graded              graded (period ends)
            |                   |
            v                   v
           (P4)              (P_WARN_INSTR)
       [Grades              [Instructor Warning
        Finalized]           Issued]
            |
            | t5: recalculate GPA
            v
           (P5)
       [GPA Updated]
            |
    +-------+--------+--------+
    |                |         |
 t6: GPA < 2.0   t7: GPA    t8: GPA >= 2.25
 OR double-fail   2.0-2.25      |
    |                |          +--------+--------+
    v                v          |                 |
 (P_TERM)        (P_PROBATION) t9: semGPA>3.75  t10: normal
 [Student         [Warning +   or cumGPA>3.5        |
  Terminated]      Interview]      |                v
                                   v             (P_DONE)
                              (P_HONOR)         [Evaluation
                              [Honor Roll        Complete]
                               Added]
```

### Petri-Net 3: UC-8 — Write and Rate Course Reviews (Taboo Word Filtering)

```
                     (P1)
                 [Student on
                  Reviews Page]
                      |
                      | t1: select course, enter rating + comment
                      v
                     (P2)
                 [Review Submitted]
                      |
                      | t2: check against TabooWord list
                      v
                     (P3)
                 [Taboo Count
                   Determined]
                      |
        +-------------+-------------+
        |             |              |
     t3: count=0   t4: count      t5: count >= 3
        |          1 or 2             |
        v             |               v
       (P4)           v             (P7)
    [Review         (P5)          [Review Hidden,
     Published]   [Words Replaced   2 Warnings
        |          with ***, 1       Issued]
        |          Warning Issued]     |
        v             |               v
       (P8)           v             (P8)
    [Check Avg      (P8)          [Check 3-warning
     Rating]      [Check 3-warning  threshold]
        |          threshold]
        | t6: course avg < 2.0
        v
       (P9)
    [Instructor
     Warning Issued]
```

---

# 3. E-R Diagram

## Entity-Relationship Model

Below is the complete E-R diagram for CUNYZeroLite showing all entities, their attributes, primary keys (PK), foreign keys (FK), and relationships.

### Entities and Attributes

**User**
| Attribute | Type | Constraint |
|-----------|------|------------|
| id | Integer | PK, auto-increment |
| email | String | UNIQUE |
| username | String | UNIQUE |
| password | String | |
| firstName | String | |
| lastName | String | |
| role | String | Default: "STUDENT" {STUDENT, INSTRUCTOR, REGISTRAR, VISITOR} |
| gpa | Float | Default: 0.0 |
| warnings | Int | Default: 0 |
| suspended | Boolean | Default: false |
| terminated | Boolean | Default: false |
| fired | Boolean | Default: false |
| graduated | Boolean | Default: false |
| fineOwed | Float | Default: 0.0 |
| mustChangePassword | Boolean | Default: true |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

**Semester**
| Attribute | Type | Constraint |
|-----------|------|------------|
| id | Integer | PK, auto-increment |
| name | String | UNIQUE |
| year | Int | |
| term | String | |
| period | String | Default: "CLASS_SETUP" {CLASS_SETUP, REGISTRATION, RUNNING, GRADING, COMPLETED} |
| startDate | DateTime | |
| endDate | DateTime | |
| isCurrent | Boolean | Default: false |
| programQuota | Int | Default: 50 |
| createdAt | DateTime | Auto |

**Course**
| Attribute | Type | Constraint |
|-----------|------|------------|
| id | Integer | PK, auto-increment |
| code | String | UNIQUE(code, semesterId) |
| name | String | |
| credits | Int | Default: 3 |
| maxStudents | Int | Default: 30 |
| schedule | String | |
| cancelled | Boolean | Default: false |
| createdAt | DateTime | Auto |
| semesterId | Int | FK -> Semester.id |
| instructorId | Int? | FK -> User.id (nullable) |

**Enrollment**
| Attribute | Type | Constraint |
|-----------|------|------------|
| id | Integer | PK, auto-increment |
| status | String | Default: "ENROLLED" {ENROLLED, DROPPED, COMPLETED} |
| grade | String? | Nullable {A, B, C, D, F} |
| createdAt | DateTime | Auto |
| userId | Int | FK -> User.id, UNIQUE(userId, courseId) |
| courseId | Int | FK -> Course.id |

**Waitlist**
| Attribute | Type | Constraint |
|-----------|------|------------|
| id | Integer | PK, auto-increment |
| status | String | Default: "WAITING" {WAITING, ADMITTED, EXPIRED} |
| position | Int | |
| createdAt | DateTime | Auto |
| userId | Int | FK -> User.id, UNIQUE(userId, courseId) |
| courseId | Int | FK -> Course.id |

**Review**
| Attribute | Type | Constraint |
|-----------|------|------------|
| id | Integer | PK, auto-increment |
| rating | Int | 1-5 |
| comment | String? | Nullable |
| hidden | Boolean | Default: false |
| createdAt | DateTime | Auto |
| authorId | Int | FK -> User.id, UNIQUE(authorId, courseId) |
| courseId | Int | FK -> Course.id |

**Complaint**
| Attribute | Type | Constraint |
|-----------|------|------------|
| id | Integer | PK, auto-increment |
| description | String | |
| status | String | Default: "PENDING" {PENDING, RESOLVED, DISMISSED} |
| resolution | String? | Nullable |
| createdAt | DateTime | Auto |
| filerId | Int | FK -> User.id |
| targetId | Int | FK -> User.id |

**Warning**
| Attribute | Type | Constraint |
|-----------|------|------------|
| id | Integer | PK, auto-increment |
| reason | String | |
| removed | Boolean | Default: false |
| createdAt | DateTime | Auto |
| userId | Int | FK -> User.id |

**Application**
| Attribute | Type | Constraint |
|-----------|------|------------|
| id | Integer | PK, auto-increment |
| type | String | {STUDENT, INSTRUCTOR} |
| status | String | Default: "PENDING" {PENDING, ACCEPTED, REJECTED} |
| priorGpa | Float? | Nullable (Student only) |
| justification | String? | Nullable |
| createdAt | DateTime | Auto |
| userId | Int | FK -> User.id |

**GraduationRequest**
| Attribute | Type | Constraint |
|-----------|------|------------|
| id | Integer | PK, auto-increment |
| status | String | Default: "PENDING" {PENDING, APPROVED, REJECTED} |
| createdAt | DateTime | Auto |
| userId | Int | FK -> User.id |

**TabooWord**
| Attribute | Type | Constraint |
|-----------|------|------------|
| id | Integer | PK, auto-increment |
| word | String | UNIQUE |

**HonorRoll**
| Attribute | Type | Constraint |
|-----------|------|------------|
| id | Integer | PK, auto-increment |
| type | String | {SEMESTER, OVERALL} |
| usedToRemoveWarning | Boolean | Default: false |
| createdAt | DateTime | Auto |
| userId | Int | FK -> User.id, UNIQUE(userId, semesterId, type) |
| semesterId | Int | FK -> Semester.id |

### E-R Diagram (Textual Representation)

```
+----------+       teaches        +----------+       belongs to     +----------+
|   User   |----(1)---------(M)--|  Course   |----(M)---------(1)--|Semester  |
| (PK: id) |                     | (PK: id) |                     | (PK: id) |
+----------+                     +----------+                     +----------+
  |  |  |  |                      |  |  |                              |
  |  |  |  |  enrolls in          |  |  |                              |
  |  |  |  +---(M)--[Enrollment]--+(M)|  |                              |
  |  |  |         (PK: id)            |  |                              |
  |  |  |         (FK: userId,        |  |                              |
  |  |  |          courseId)           |  |                              |
  |  |  |                             |  |                              |
  |  |  |  waitlisted for            |  |                              |
  |  |  +-----(M)--[Waitlist]---------+(M)                              |
  |  |            (PK: id)                                              |
  |  |            (FK: userId, courseId)                                 |
  |  |                                                                  |
  |  |  writes review for                                               |
  |  +-------(M)--[Review]----(M)---Course                              |
  |               (PK: id)                                              |
  |               (FK: authorId, courseId)                               |
  |                                                                     |
  |  files/receives                                                     |
  +-------(M)--[Complaint]--(M)---User (target)                        |
  |            (PK: id)                                                 |
  |            (FK: filerId, targetId)                                  |
  |                                                                     |
  +-------(1)--[Warning]--(M)                                          |
  |            (PK: id)                                                 |
  |            (FK: userId)                                             |
  |                                                                     |
  +-------(1)--[Application]--(M)                                      |
  |            (PK: id)                                                 |
  |            (FK: userId)                                             |
  |                                                                     |
  +-------(1)--[GraduationRequest]--(M)                                |
  |            (PK: id)                                                 |
  |            (FK: userId)                                             |
  |                                                                     |
  +-------(M)--[HonorRoll]--(M)---Semester                             |
               (PK: id)                                                 |
               (FK: userId, semesterId)                                 |
                                                                        
               [TabooWord]                                              
               (PK: id)                                                 
               (standalone entity, no FK)                               
```

**Relationship Summary:**
- User (1) --- (M) Course (instructor teaches courses)
- User (M) --- (M) Course via Enrollment (students enroll)
- User (M) --- (M) Course via Waitlist (students waitlisted)
- User (M) --- (M) Course via Review (students review courses)
- User (1) --- (M) Warning (user receives warnings)
- User (1) --- (M) Application (user submits applications)
- User (1) --- (M) GraduationRequest (student applies for graduation)
- User (M) --- (M) User via Complaint (filer -> target)
- User (M) --- (M) Semester via HonorRoll (student honored per semester)
- Semester (1) --- (M) Course (semester has courses)
- TabooWord is a standalone entity with no foreign keys.

---

# 4. Detailed Design

## 4.1 Session Management

### createSession(userId)
```
FUNCTION createSession(userId: Integer) -> SessionData | null
  INPUT: userId — the database ID of the authenticated user
  OUTPUT: SessionData object or null if user not found

  user = Database.User.findUnique(WHERE id = userId)
  IF user IS null THEN
    RETURN null
  END IF

  session = {
    userId: user.id,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email
  }

  SET httpOnly cookie "session" = JSON.stringify(session)
    WITH maxAge = 86400 seconds (1 day)
    WITH sameSite = "lax"
    WITH path = "/"

  RETURN session
END FUNCTION
```

### getSession()
```
FUNCTION getSession() -> SessionData | null
  INPUT: none (reads from HTTP cookies)
  OUTPUT: SessionData object or null if no valid session

  raw = READ cookie "session"
  IF raw IS empty THEN
    RETURN null
  END IF

  TRY
    RETURN JSON.parse(raw) AS SessionData
  CATCH
    RETURN null
  END TRY
END FUNCTION
```

### destroySession()
```
FUNCTION destroySession() -> void
  INPUT: none
  OUTPUT: none (deletes session cookie)

  DELETE cookie "session"
END FUNCTION
```

## 4.2 Authentication

### loginUser(email, password)
```
FUNCTION loginUser(email: String, password: String) -> LoginResult
  INPUT: email — user's email address
         password — plaintext password
  OUTPUT: { success, error?, role?, firstName?, redirect? }

  user = Database.User.findUnique(WHERE email = email.trim().toLowerCase())

  IF user IS null OR user.password != password THEN
    RETURN { success: false, error: "Invalid email or password." }
  END IF

  IF user.terminated THEN
    RETURN { success: false, error: "Your account has been terminated." }
  END IF

  IF user.suspended THEN
    RETURN { success: false, error: "Your account is currently suspended." }
  END IF

  IF user.fired THEN
    RETURN { success: false, error: "Your account has been deactivated." }
  END IF

  CALL createSession(user.id)

  IF user.mustChangePassword THEN
    redirect = "/change-password"
  ELSE
    redirect = "/dashboard"
  END IF

  RETURN { success: true, role: user.role, firstName: user.firstName, redirect }
END FUNCTION
```

### logoutUser()
```
FUNCTION logoutUser() -> void
  INPUT: none
  OUTPUT: none (destroys session)

  CALL destroySession()
END FUNCTION
```

### changePassword(newPassword)
```
FUNCTION changePassword(request: HTTP POST) -> JSON response
  INPUT: HTTP request body containing { newPassword }
  OUTPUT: { success, error?, redirect? }

  session = CALL getSession()
  IF session IS null THEN
    RETURN HTTP 401 { success: false, error: "Not authenticated." }
  END IF

  newPassword = request.body.newPassword
  IF newPassword IS empty OR length(newPassword) < 6 THEN
    RETURN { success: false, error: "Password must be at least 6 characters." }
  END IF

  Database.User.update(
    WHERE id = session.userId,
    SET password = newPassword, mustChangePassword = false
  )

  CALL createSession(session.userId)  // refresh session data

  RETURN { success: true, redirect: "/dashboard" }
END FUNCTION
```

## 4.3 Dashboard Routing

### Dashboard (main router)
```
FUNCTION Dashboard() -> HTML Page
  INPUT: none (reads session cookie)
  OUTPUT: rendered dashboard page

  session = CALL getSession()
  IF session IS null THEN
    REDIRECT to "/login"
  END IF

  SWITCH session.role
    CASE "REGISTRAR":
      cards = registrarCards   // 8 management cards
      roleLabel = "Registrar"
    CASE "INSTRUCTOR":
      cards = instructorCards  // 5 teaching cards
      roleLabel = "Instructor"
    DEFAULT:
      cards = studentCards     // 6 student cards
      roleLabel = "Student"
  END SWITCH

  RENDER page with navigation bar, welcome message, and card grid
END FUNCTION
```

### StudentDashboard()
```
FUNCTION StudentDashboard() -> HTML Page
  INPUT: none (reads session)
  OUTPUT: rendered student dashboard

  session = CALL getSession()
  IF session IS null OR session.role != "STUDENT" THEN
    REDIRECT to "/login"
  END IF

  user = Database.User.findUnique(
    WHERE id = session.userId,
    INCLUDE enrollments -> course -> instructor, semester
    INCLUDE warningsReceived (WHERE removed = false)
    INCLUDE honorRollEntries
  )

  IF user IS null THEN
    REDIRECT to "/login"
  END IF

  currentSemester = Database.Semester.findFirst(WHERE isCurrent = true)
  currentEnrollments = FILTER user.enrollments WHERE course.semester.isCurrent
  pastEnrollments = FILTER user.enrollments WHERE NOT course.semester.isCurrent

  RENDER page with:
    - Navigation bar (CunyZeroLite Student Portal, user name, logout)
    - Welcome banner with semester info
    - Stats cards: GPA, current course count, warnings count, fine balance
    - Honor roll badge (IF honorRollEntries > 0)
    - Current courses list with code, name, schedule, instructor, status
    - Past courses list with grades
    - Sidebar: quick action links, active warnings, profile card
END FUNCTION
```

### InstructorDashboard()
```
FUNCTION InstructorDashboard() -> HTML Page
  INPUT: none (reads session)
  OUTPUT: rendered instructor dashboard

  session = CALL getSession()
  IF session IS null OR session.role != "INSTRUCTOR" THEN
    REDIRECT to "/login"
  END IF

  user = Database.User.findUnique(
    WHERE id = session.userId,
    INCLUDE warningsReceived (WHERE removed = false)
  )

  IF user IS null THEN
    REDIRECT to "/login"
  END IF

  currentSemester = Database.Semester.findFirst(WHERE isCurrent = true)

  courses = Database.Course.findMany(
    WHERE instructorId = user.id AND semester.isCurrent = true,
    INCLUDE enrollments -> user,
    INCLUDE reviews,
    INCLUDE semester
  )

  totalStudents = SUM of enrollments.length across all courses

  FOR EACH course IN courses:
    IF course.reviews.length > 0 THEN
      avgRating = SUM(reviews.rating) / reviews.length
    ELSE
      avgRating = null
    END IF
  END FOR

  RENDER page with:
    - Navigation bar (Instructor Portal, Prof. lastName, logout)
    - Welcome banner with semester info
    - Stats cards: course count, total students, warnings
    - For each course: header (code, name, schedule, avg rating, active/cancelled),
      enrolled student list (name, GPA, email, grade status)
    - Active warnings section
END FUNCTION
```

### RegistrarDashboard()
```
FUNCTION RegistrarDashboard() -> HTML Page
  INPUT: none (reads session)
  OUTPUT: rendered registrar dashboard

  session = CALL getSession()
  IF session IS null OR session.role != "REGISTRAR" THEN
    REDIRECT to "/login"
  END IF

  // Fetch all stats in parallel
  [totalStudents, totalInstructors, totalCourses,
   pendingApplications, pendingComplaints, pendingGraduations,
   currentSemester, activeWarnings, suspendedStudents] = PARALLEL(
    Database.User.count(WHERE role = "STUDENT"),
    Database.User.count(WHERE role = "INSTRUCTOR"),
    Database.Course.count(WHERE semester.isCurrent AND NOT cancelled),
    Database.Application.count(WHERE status = "PENDING"),
    Database.Complaint.count(WHERE status = "PENDING"),
    Database.GraduationRequest.count(WHERE status = "PENDING"),
    Database.Semester.findFirst(WHERE isCurrent = true),
    Database.Warning.count(WHERE removed = false),
    Database.User.count(WHERE suspended = true)
  )

  topStudents = Database.User.findMany(
    WHERE role = "STUDENT" AND NOT terminated,
    ORDER BY gpa DESC,
    LIMIT 5
  )

  RENDER page with:
    - Navigation bar (Registrar Portal, admin name, logout)
    - Welcome banner with semester info
    - Stats cards: students, instructors, active courses, active warnings
    - Pending items cards (clickable): applications, complaints, graduations
    - Management grid: semester, course, student records, taboo words
    - Top 5 students sidebar with GPA
    - Suspended student count alert
END FUNCTION
```

## 4.4 Course Registration

### registerForCourse(studentId, courseId)
```
FUNCTION registerForCourse(studentId: Integer, courseId: Integer) -> Result
  INPUT: studentId — the student's user ID
         courseId — the target course ID
  OUTPUT: { success, message, waitlisted? }

  student = Database.User.findUnique(WHERE id = studentId)
  IF student.suspended OR student.terminated THEN
    RETURN { success: false, message: "Cannot register: account restricted." }
  END IF

  course = Database.Course.findUnique(
    WHERE id = courseId,
    INCLUDE enrollments, semester
  )

  IF course.semester.period != "REGISTRATION" THEN
    RETURN { success: false, message: "Registration is not open." }
  END IF

  // Check enrollment count (2-4 courses)
  currentCount = Database.Enrollment.count(
    WHERE userId = studentId AND course.semester.isCurrent
  )
  IF currentCount >= 4 THEN
    RETURN { success: false, message: "Maximum 4 courses per semester." }
  END IF

  // Check time conflict
  studentCourses = Database.Enrollment.findMany(
    WHERE userId = studentId AND course.semester.isCurrent,
    INCLUDE course
  )
  FOR EACH enrollment IN studentCourses:
    IF enrollment.course.schedule OVERLAPS course.schedule THEN
      RETURN { success: false, message: "Time conflict with " + enrollment.course.code }
    END IF
  END FOR

  // Check retake eligibility
  previousEnrollment = Database.Enrollment.findFirst(
    WHERE userId = studentId AND course.code = course.code AND grade != "F"
  )
  IF previousEnrollment EXISTS AND grade IS NOT "F" THEN
    RETURN { success: false, message: "Cannot retake a course unless previously received F." }
  END IF

  // Check capacity
  IF course.enrollments.length >= course.maxStudents THEN
    // Add to waitlist
    maxPosition = MAX(Waitlist.position WHERE courseId = courseId) OR 0
    Database.Waitlist.create(
      userId = studentId, courseId = courseId,
      position = maxPosition + 1, status = "WAITING"
    )
    RETURN { success: true, message: "Course full. Added to waitlist.", waitlisted: true }
  END IF

  // Enroll
  Database.Enrollment.create(
    userId = studentId, courseId = courseId, status = "ENROLLED"
  )
  RETURN { success: true, message: "Successfully enrolled." }
END FUNCTION
```

## 4.5 Grade Assignment

### assignGrades(courseId, grades)
```
FUNCTION assignGrades(courseId: Integer, grades: Array<{studentId, grade}>) -> Result
  INPUT: courseId — the course to grade
         grades — array of { studentId, grade } pairs
  OUTPUT: { success, message }

  session = CALL getSession()
  IF session.role != "INSTRUCTOR" THEN
    RETURN { success: false, message: "Unauthorized." }
  END IF

  course = Database.Course.findUnique(
    WHERE id = courseId AND instructorId = session.userId,
    INCLUDE semester
  )

  IF course.semester.period != "GRADING" THEN
    RETURN { success: false, message: "Grading period is not active." }
  END IF

  FOR EACH { studentId, grade } IN grades:
    IF grade NOT IN ["A", "B", "C", "D", "F"] THEN
      RETURN { success: false, message: "Invalid grade: " + grade }
    END IF

    Database.Enrollment.update(
      WHERE userId = studentId AND courseId = courseId,
      SET grade = grade, status = "COMPLETED"
    )
  END FOR

  RETURN { success: true, message: "Grades submitted." }
END FUNCTION
```

## 4.6 Academic Standing Evaluation

### evaluateAcademicStanding(semesterId)
```
FUNCTION evaluateAcademicStanding(semesterId: Integer) -> void
  INPUT: semesterId — the semester being completed
  OUTPUT: none (updates student records)

  students = Database.User.findMany(
    WHERE role = "STUDENT" AND NOT terminated AND NOT graduated,
    INCLUDE enrollments WHERE course.semesterId = semesterId
  )

  gradePoints = { "A": 4.0, "B": 3.0, "C": 2.0, "D": 1.0, "F": 0.0 }

  FOR EACH student IN students:
    // Calculate semester GPA
    semesterGrades = student.enrollments.filter(e => e.grade IS NOT null)
    IF semesterGrades.length = 0 THEN CONTINUE

    totalPoints = SUM(gradePoints[e.grade] * e.course.credits) FOR EACH e
    totalCredits = SUM(e.course.credits) FOR EACH e
    semesterGPA = totalPoints / totalCredits

    // Calculate cumulative GPA (all completed enrollments)
    allEnrollments = Database.Enrollment.findMany(
      WHERE userId = student.id AND grade IS NOT null
    )
    cumPoints = SUM(gradePoints[e.grade] * e.course.credits) FOR EACH e
    cumCredits = SUM(e.course.credits) FOR EACH e
    cumulativeGPA = cumPoints / cumCredits

    Database.User.update(WHERE id = student.id, SET gpa = cumulativeGPA)

    // Check double-fail termination
    FOR EACH enrollment IN semesterGrades:
      IF enrollment.grade = "F" THEN
        previousFail = Database.Enrollment.findFirst(
          WHERE userId = student.id
          AND courseId != enrollment.courseId
          AND course.code = enrollment.course.code
          AND grade = "F"
        )
        IF previousFail EXISTS THEN
          Database.User.update(WHERE id = student.id, SET terminated = true)
          CONTINUE to next student
        END IF
      END IF
    END FOR

    // Check cumulative GPA termination
    IF cumulativeGPA < 2.0 THEN
      Database.User.update(WHERE id = student.id, SET terminated = true)
      CONTINUE to next student
    END IF

    // Check probation warning (GPA 2.0 - 2.25)
    IF cumulativeGPA >= 2.0 AND cumulativeGPA <= 2.25 THEN
      Database.Warning.create(
        userId = student.id, reason = "Low GPA probation: must interview registrar"
      )
      Database.User.update(WHERE id = student.id, SET warnings = warnings + 1)
    END IF

    // Check honor roll
    completedSemesters = COUNT DISTINCT semesters student has graded enrollments
    IF semesterGPA > 3.75 THEN
      Database.HonorRoll.create(
        userId = student.id, semesterId = semesterId, type = "SEMESTER"
      )
    END IF
    IF cumulativeGPA > 3.5 AND completedSemesters > 1 THEN
      Database.HonorRoll.create(
        userId = student.id, semesterId = semesterId, type = "OVERALL"
      )
    END IF

    // Honor roll can remove one warning
    newHonors = Database.HonorRoll.findMany(
      WHERE userId = student.id AND usedToRemoveWarning = false
    )
    FOR EACH honor IN newHonors:
      activeWarning = Database.Warning.findFirst(
        WHERE userId = student.id AND removed = false
      )
      IF activeWarning EXISTS THEN
        Database.Warning.update(WHERE id = activeWarning.id, SET removed = true)
        Database.HonorRoll.update(WHERE id = honor.id, SET usedToRemoveWarning = true)
        Database.User.update(WHERE id = student.id, SET warnings = warnings - 1)
      END IF
    END FOR

    // Check suspension threshold (3+ warnings)
    IF student.warnings >= 3 THEN
      Database.User.update(
        WHERE id = student.id,
        SET suspended = true, fineOwed = fineOwed + 100.0
      )
    END IF
  END FOR
END FUNCTION
```

## 4.7 Course Review Submission

### submitReview(authorId, courseId, rating, comment)
```
FUNCTION submitReview(authorId: Int, courseId: Int, rating: Int, comment: String?) -> Result
  INPUT: authorId — student's user ID
         courseId — course being reviewed
         rating — integer 1-5
         comment — optional text
  OUTPUT: { success, message, warningsIssued? }

  // Verify enrollment and grades not posted
  enrollment = Database.Enrollment.findUnique(
    WHERE userId = authorId AND courseId = courseId
  )
  IF enrollment IS null THEN
    RETURN { success: false, message: "Not enrolled in this course." }
  END IF
  IF enrollment.grade IS NOT null THEN
    RETURN { success: false, message: "Cannot review after grades are posted." }
  END IF

  // Check for duplicate review
  existing = Database.Review.findUnique(WHERE authorId = authorId AND courseId = courseId)
  IF existing IS NOT null THEN
    RETURN { success: false, message: "Already reviewed this course." }
  END IF

  // Taboo word filtering
  tabooWords = Database.TabooWord.findMany()
  tabooCount = 0
  filteredComment = comment

  IF comment IS NOT null THEN
    FOR EACH taboo IN tabooWords:
      IF comment.toLowerCase() CONTAINS taboo.word.toLowerCase() THEN
        tabooCount = tabooCount + 1
        filteredComment = REPLACE taboo.word WITH "***" IN filteredComment
      END IF
    END FOR
  END IF

  hidden = false
  warningsIssued = 0

  IF tabooCount >= 3 THEN
    hidden = true
    warningsIssued = 2
  ELSE IF tabooCount >= 1 THEN
    warningsIssued = 1
  END IF

  // Create review
  Database.Review.create(
    authorId, courseId, rating,
    comment = filteredComment,
    hidden = hidden
  )

  // Issue warnings if needed
  IF warningsIssued > 0 THEN
    FOR i = 1 TO warningsIssued:
      Database.Warning.create(
        userId = authorId,
        reason = "Taboo word violation in course review"
      )
    END FOR
    Database.User.update(
      WHERE id = authorId,
      SET warnings = warnings + warningsIssued
    )
  END IF

  // Check course average rating
  allReviews = Database.Review.findMany(WHERE courseId = courseId AND hidden = false)
  avgRating = SUM(allReviews.rating) / allReviews.length

  IF avgRating < 2.0 THEN
    course = Database.Course.findUnique(WHERE id = courseId)
    Database.Warning.create(
      userId = course.instructorId,
      reason = "Course " + course.code + " average rating below 2.0"
    )
  END IF

  RETURN { success: true, message: "Review submitted.", warningsIssued }
END FUNCTION
```

## 4.8 Complaint Management

### fileComplaint(filerId, targetId, description)
```
FUNCTION fileComplaint(filerId: Int, targetId: Int, description: String) -> Result
  INPUT: filerId — user filing the complaint
         targetId — user being complained about
         description — complaint text
  OUTPUT: { success, message }

  IF filerId = targetId THEN
    RETURN { success: false, message: "Cannot file a complaint against yourself." }
  END IF

  IF description IS empty THEN
    RETURN { success: false, message: "Description is required." }
  END IF

  Database.Complaint.create(
    filerId = filerId,
    targetId = targetId,
    description = description,
    status = "PENDING"
  )

  RETURN { success: true, message: "Complaint filed successfully." }
END FUNCTION
```

### processComplaint(complaintId, action, resolution)
```
FUNCTION processComplaint(complaintId: Int, action: String, resolution: String) -> Result
  INPUT: complaintId — the complaint to process
         action — "WARN" | "DEREGISTER" | "DISMISS" | "WARN_FILER"
         resolution — registrar's resolution text
  OUTPUT: { success, message }

  complaint = Database.Complaint.findUnique(
    WHERE id = complaintId,
    INCLUDE filer, target
  )

  IF action = "DISMISS" THEN
    Database.Complaint.update(WHERE id = complaintId,
      SET status = "DISMISSED", resolution = resolution)
    RETURN { success: true }
  END IF

  IF action = "WARN" THEN
    Database.Warning.create(userId = complaint.targetId, reason = resolution)
    Database.User.update(WHERE id = complaint.targetId, SET warnings = warnings + 1)
  END IF

  IF action = "DEREGISTER" THEN
    // Remove target from current courses
    Database.Enrollment.deleteMany(
      WHERE userId = complaint.targetId AND course.semester.isCurrent
    )
    Database.Warning.create(
      userId = complaint.targetId,
      reason = "De-registered due to complaint: " + resolution
    )
  END IF

  IF action = "WARN_FILER" THEN
    // Instructor filed unjustified complaint
    Database.Warning.create(
      userId = complaint.filerId,
      reason = "Unjustified complaint filing"
    )
    Database.User.update(WHERE id = complaint.filerId, SET warnings = warnings + 1)
  END IF

  Database.Complaint.update(WHERE id = complaintId,
    SET status = "RESOLVED", resolution = resolution)

  // Check 3-warning suspension for target
  target = Database.User.findUnique(WHERE id = complaint.targetId)
  IF target.warnings >= 3 AND NOT target.suspended THEN
    Database.User.update(
      WHERE id = target.id,
      SET suspended = true, fineOwed = fineOwed + 100.0
    )
  END IF

  RETURN { success: true, message: "Complaint processed." }
END FUNCTION
```

## 4.9 Application Management

### submitApplication(userId, type, priorGpa, justification)
```
FUNCTION submitApplication(userId: Int, type: String, priorGpa: Float?, justification: String?) -> Result
  INPUT: userId — visitor's user ID
         type — "STUDENT" or "INSTRUCTOR"
         priorGpa — required for student applications
         justification — required for student applications
  OUTPUT: { success, message }

  IF type = "STUDENT" AND (priorGpa IS null OR justification IS empty) THEN
    RETURN { success: false, message: "Student applications require GPA and justification." }
  END IF

  existingPending = Database.Application.findFirst(
    WHERE userId = userId AND status = "PENDING"
  )
  IF existingPending EXISTS THEN
    RETURN { success: false, message: "You already have a pending application." }
  END IF

  Database.Application.create(
    userId, type, status = "PENDING", priorGpa, justification
  )

  RETURN { success: true, message: "Application submitted." }
END FUNCTION
```

### reviewApplication(applicationId, decision, justification)
```
FUNCTION reviewApplication(appId: Int, decision: String, justification: String?) -> Result
  INPUT: appId — application to review
         decision — "ACCEPT" or "REJECT"
         justification — required when rejecting a qualified student
  OUTPUT: { success, message }

  app = Database.Application.findUnique(WHERE id = appId, INCLUDE user)

  IF decision = "REJECT" THEN
    IF app.type = "STUDENT" AND app.priorGpa > 3.0 AND justification IS empty THEN
      RETURN { success: false, message: "Must provide justification to reject qualified student." }
    END IF
    Database.Application.update(WHERE id = appId, SET status = "REJECTED")
    RETURN { success: true, message: "Application rejected." }
  END IF

  // ACCEPT
  IF app.type = "STUDENT" THEN
    email = generateEmail(app.user.firstName, app.user.lastName)
    tempPassword = generateTempPassword()

    Database.User.update(
      WHERE id = app.userId,
      SET role = "STUDENT", email = email, username = email,
          password = tempPassword, mustChangePassword = true
    )
  ELSE
    Database.User.update(WHERE id = app.userId, SET role = "INSTRUCTOR")
  END IF

  Database.Application.update(WHERE id = appId, SET status = "ACCEPTED")
  RETURN { success: true, message: "Application accepted." }
END FUNCTION

FUNCTION generateEmail(firstName: String, lastName: String) -> String
  RETURN firstName[0].toLowerCase() + lastName.toLowerCase() + "00@cuny.edu"
END FUNCTION
```

## 4.10 Graduation

### applyForGraduation(studentId)
```
FUNCTION applyForGraduation(studentId: Int) -> Result
  INPUT: studentId — the student applying
  OUTPUT: { success, message, isReckless? }

  completedCourses = Database.Enrollment.count(
    WHERE userId = studentId AND grade IS NOT null AND grade != "F"
  )

  isReckless = completedCourses < 8

  Database.GraduationRequest.create(
    userId = studentId, status = "PENDING"
  )

  IF isReckless THEN
    RETURN { success: true, message: "Application submitted. Warning: fewer than 8 courses completed.", isReckless: true }
  END IF

  RETURN { success: true, message: "Graduation application submitted." }
END FUNCTION
```

### reviewGraduation(requestId, decision)
```
FUNCTION reviewGraduation(requestId: Int, decision: String) -> Result
  INPUT: requestId — graduation request to review
         decision — "APPROVE" or "REJECT"
  OUTPUT: { success, message }

  request = Database.GraduationRequest.findUnique(
    WHERE id = requestId, INCLUDE user
  )

  student = request.user
  completedPassing = Database.Enrollment.count(
    WHERE userId = student.id AND grade IN ["A","B","C","D"]
  )

  IF decision = "APPROVE" THEN
    IF completedPassing < 8 OR student.suspended OR student.fineOwed > 0 THEN
      RETURN { success: false, message: "Student does not meet graduation requirements." }
    END IF

    Database.User.update(WHERE id = student.id, SET graduated = true)
    Database.GraduationRequest.update(WHERE id = requestId, SET status = "APPROVED")
    RETURN { success: true, message: "Student has graduated." }
  END IF

  // REJECT
  Database.GraduationRequest.update(WHERE id = requestId, SET status = "REJECTED")

  IF completedPassing < 8 THEN
    // Reckless application warning
    Database.Warning.create(
      userId = student.id, reason = "Reckless graduation application"
    )
    Database.User.update(WHERE id = student.id, SET warnings = warnings + 1)
  END IF

  RETURN { success: true, message: "Graduation request rejected." }
END FUNCTION
```

## 4.11 Semester and Running Rules

### advanceSemesterPeriod(semesterId)
```
FUNCTION advanceSemesterPeriod(semesterId: Int) -> Result
  INPUT: semesterId — semester to advance
  OUTPUT: { success, newPeriod }

  semester = Database.Semester.findUnique(WHERE id = semesterId)
  periodOrder = ["CLASS_SETUP", "REGISTRATION", "RUNNING", "GRADING", "COMPLETED"]
  currentIndex = periodOrder.indexOf(semester.period)

  IF currentIndex = periodOrder.length - 1 THEN
    RETURN { success: false, message: "Semester already completed." }
  END IF

  newPeriod = periodOrder[currentIndex + 1]
  Database.Semester.update(WHERE id = semesterId, SET period = newPeriod)

  IF newPeriod = "RUNNING" THEN
    CALL enforceRunningPeriodRules(semesterId)
  END IF

  IF newPeriod = "COMPLETED" THEN
    CALL evaluateAcademicStanding(semesterId)
  END IF

  RETURN { success: true, newPeriod }
END FUNCTION
```

### enforceRunningPeriodRules(semesterId)
```
FUNCTION enforceRunningPeriodRules(semesterId: Int) -> void
  INPUT: semesterId — the semester entering RUNNING
  OUTPUT: none (modifies database records)

  // 1. Warn students with fewer than 2 courses
  students = Database.User.findMany(WHERE role = "STUDENT" AND NOT suspended AND NOT terminated)
  FOR EACH student IN students:
    enrollmentCount = Database.Enrollment.count(
      WHERE userId = student.id AND course.semesterId = semesterId
    )
    IF enrollmentCount > 0 AND enrollmentCount < 2 THEN
      Database.Warning.create(
        userId = student.id,
        reason = "Enrolled in fewer than 2 courses"
      )
      Database.User.update(WHERE id = student.id, SET warnings = warnings + 1)
    END IF
  END FOR

  // 2. Cancel courses with fewer than 3 students
  courses = Database.Course.findMany(
    WHERE semesterId = semesterId AND NOT cancelled,
    INCLUDE enrollments, instructor
  )
  FOR EACH course IN courses:
    IF course.enrollments.length < 3 THEN
      Database.Course.update(WHERE id = course.id, SET cancelled = true)

      // Warn the instructor
      IF course.instructorId IS NOT null THEN
        Database.Warning.create(
          userId = course.instructorId,
          reason = "Course " + course.code + " cancelled due to low enrollment"
        )
      END IF

      // Give affected students a special registration window
      FOR EACH enrollment IN course.enrollments:
        Database.Enrollment.delete(WHERE id = enrollment.id)
        // Mark student for special registration (implementation-specific flag)
      END FOR
    END IF
  END FOR

  // 3. Check if any instructor lost ALL courses
  instructors = Database.User.findMany(WHERE role = "INSTRUCTOR")
  FOR EACH instructor IN instructors:
    activeCourses = Database.Course.count(
      WHERE instructorId = instructor.id
      AND semesterId = semesterId
      AND NOT cancelled
    )
    IF activeCourses = 0 THEN
      allCoursesThisSemester = Database.Course.count(
        WHERE instructorId = instructor.id AND semesterId = semesterId
      )
      IF allCoursesThisSemester > 0 THEN
        // Had courses but all were cancelled
        Database.User.update(
          WHERE id = instructor.id,
          SET suspended = true  // cannot teach next semester
        )
      END IF
    END IF
  END FOR
END FUNCTION
```

## 4.12 Taboo Word Management

### addTabooWord(word)
```
FUNCTION addTabooWord(word: String) -> Result
  INPUT: word — the word to add to the filter list
  OUTPUT: { success, message }

  IF word IS empty THEN
    RETURN { success: false, message: "Word cannot be empty." }
  END IF

  existing = Database.TabooWord.findUnique(WHERE word = word.toLowerCase())
  IF existing IS NOT null THEN
    RETURN { success: false, message: "Word already exists." }
  END IF

  Database.TabooWord.create(word = word.toLowerCase())
  RETURN { success: true, message: "Taboo word added." }
END FUNCTION
```

### removeTabooWord(wordId)
```
FUNCTION removeTabooWord(wordId: Int) -> Result
  INPUT: wordId — the TabooWord record ID
  OUTPUT: { success, message }

  Database.TabooWord.delete(WHERE id = wordId)
  RETURN { success: true, message: "Taboo word removed." }
END FUNCTION
```

## 4.13 Waitlist Management

### admitFromWaitlist(courseId, studentId)
```
FUNCTION admitFromWaitlist(courseId: Int, studentId: Int) -> Result
  INPUT: courseId — the course
         studentId — the student to admit from waitlist
  OUTPUT: { success, message }

  waitlistEntry = Database.Waitlist.findUnique(
    WHERE userId = studentId AND courseId = courseId
  )
  IF waitlistEntry IS null OR waitlistEntry.status != "WAITING" THEN
    RETURN { success: false, message: "Student not on waitlist." }
  END IF

  // Check student still eligible
  student = Database.User.findUnique(WHERE id = studentId)
  IF student.suspended OR student.terminated THEN
    RETURN { success: false, message: "Student is no longer eligible." }
  END IF

  // Create enrollment
  Database.Enrollment.create(
    userId = studentId, courseId = courseId, status = "ENROLLED"
  )

  // Update waitlist
  Database.Waitlist.update(
    WHERE id = waitlistEntry.id,
    SET status = "ADMITTED"
  )

  // Reorder remaining waitlist positions
  remaining = Database.Waitlist.findMany(
    WHERE courseId = courseId AND status = "WAITING",
    ORDER BY position ASC
  )
  FOR i = 0 TO remaining.length - 1:
    Database.Waitlist.update(WHERE id = remaining[i].id, SET position = i + 1)
  END FOR

  RETURN { success: true, message: "Student admitted from waitlist." }
END FUNCTION
```

## 4.14 Course Setup

### createCourse(code, name, credits, schedule, maxStudents, instructorId, semesterId)
```
FUNCTION createCourse(...params) -> Result
  INPUT: code, name, credits, schedule, maxStudents, instructorId, semesterId
  OUTPUT: { success, course?, message }

  semester = Database.Semester.findUnique(WHERE id = semesterId)
  IF semester.period != "CLASS_SETUP" THEN
    RETURN { success: false, message: "Can only create courses during CLASS_SETUP." }
  END IF

  existing = Database.Course.findFirst(
    WHERE code = code AND semesterId = semesterId
  )
  IF existing IS NOT null THEN
    RETURN { success: false, message: "Course code already exists this semester." }
  END IF

  course = Database.Course.create(
    code, name, credits, schedule, maxStudents, instructorId, semesterId
  )

  RETURN { success: true, course: course }
END FUNCTION
```

### cancelCourse(courseId)
```
FUNCTION cancelCourse(courseId: Int) -> Result
  INPUT: courseId — the course to cancel
  OUTPUT: { success, message }

  course = Database.Course.findUnique(WHERE id = courseId, INCLUDE instructor)

  Database.Course.update(WHERE id = courseId, SET cancelled = true)

  IF course.instructorId IS NOT null THEN
    Database.Warning.create(
      userId = course.instructorId,
      reason = "Course " + course.code + " was cancelled"
    )
    Database.User.update(
      WHERE id = course.instructorId,
      SET warnings = warnings + 1
    )
  END IF

  RETURN { success: true, message: "Course cancelled." }
END FUNCTION
```

## 4.15 AI Assistant (Lite)

### askAI(question)
```
FUNCTION askAI(question: String) -> Result
  INPUT: question — user's question text
  OUTPUT: { answer, source }

  IF question IS empty THEN
    RETURN { answer: "Please enter a question.", source: "system" }
  END IF

  // Step 1: RAG — search local knowledge base
  policies = LOAD "data/policy.json"
  matchedPolicies = []

  keywords = TOKENIZE(question.toLowerCase())
  FOR EACH policy IN policies:
    score = COUNT matching keywords between policy.keywords AND keywords
    IF score > 0 THEN
      matchedPolicies.push({ policy, score })
    END IF
  END FOR

  SORT matchedPolicies BY score DESC

  // Step 2: Build prompt
  IF matchedPolicies.length > 0 THEN
    context = TOP 3 matchedPolicies mapped to policy.content, joined by newlines
    prompt = "Based on the following college policies:\n" + context +
             "\n\nAnswer this question: " + question
    source = "knowledge_base"
  ELSE
    prompt = question
    source = "general_llm"
  END IF

  // Step 3: Call OpenAI API
  TRY
    response = OpenAI.chat.completions.create(
      model = "gpt-4o-mini",
      messages = [{ role: "user", content: prompt }]
    )
    answer = response.choices[0].message.content
  CATCH
    answer = "AI assistant is currently unavailable. Please try again later."
    source = "error"
  END TRY

  RETURN { answer, source }
END FUNCTION
```

---

# 5. System Screens

## 5.1 Login Page
The login page presents a centered form with the CUNYZeroLite branding in navy blue. Fields include email and password inputs with a "Sign In" button. Error messages appear inline (e.g., "Invalid email or password," "Your account has been terminated"). The page features the midnight navy gradient background consistent with the university portal theme.

## 5.2 Change Password Page
Displayed when `mustChangePassword = true` after first login. Shows a simple form with "New Password" and "Confirm Password" fields. Validates minimum 6 characters. On success, redirects to the role-based dashboard.

## 5.3 Main Dashboard (Card Grid)
After login, users see a card grid layout tailored to their role:
- **Students:** 6 cards (Profile, Course Registration, Schedule Builder, Grades & Transcript, Course Reviews, File Complaint)
- **Instructors:** 5 cards (Profile, My Courses, Grade Students, My Students, File Complaint)
- **Registrar:** 8 cards (Profile, Semester Management, Course Management, Student Records, Applications, Complaints, Graduations, Taboo Words)

Each card shows an icon, title, and subtitle. The layout uses a 3-column grid on desktop, 2 columns on tablet, 1 column on mobile.

## 5.4 Student Dashboard (Detailed View)
**Prototype screen demonstrating full functionality:**

The student dashboard is the most comprehensive screen. It features:

- **Navigation bar:** Dark navy (#0f172a) with CunyZeroLite logo, "Student Portal" subtitle in blue, student name, and logout button.
- **Welcome banner:** Gradient navy-to-dark-blue panel showing student's first name and current semester period.
- **Stats row:** Four white cards displaying:
  - GPA (e.g., "3.45") with star icon
  - Current course count (e.g., "3") with book icon
  - Active warnings count with triangle icon (red if > 0, green if 0)
  - Balance/fines (e.g., "$0.00") with dollar icon (red if > 0)
- **Honor roll badge:** Golden banner (amber background) shown only for honor roll students.
- **Current courses:** Cards listing each enrolled course with code, name, schedule, credits, instructor name, and enrollment status badge.
- **Past courses:** Compact list showing course code, name, semester, and letter grade.
- **Sidebar:**
  - Quick Actions: links to Course Registration, Write Reviews, File Complaint, Apply for Graduation.
  - Active Warnings: red-background cards listing each warning reason.
  - Profile card: user avatar, name, and email.

## 5.5 Instructor Dashboard
- **Navigation bar:** Emerald-themed with "Instructor Portal" subtitle.
- **Stats row:** Three cards (My Courses, Total Students, Warnings).
- **Course cards:** Each course shows a dark header with code, name, schedule, credits, max students, average review rating (star icon), and active/cancelled badge. Below the header, an enrolled students list shows each student's name, GPA, email, and current grade status.
- **Warnings section:** Same red-background format as student dashboard.

## 5.6 Registrar Dashboard
- **Navigation bar:** Red-themed with "Registrar Portal" subtitle and shield icon.
- **Stats row:** Four cards (Students, Instructors, Active Courses, Active Warnings).
- **Pending items:** Three clickable cards showing count of pending Applications, Complaints, and Graduation Requests.
- **Management grid:** Four action cards linking to Semester Management, Course Management, Student Records, and Taboo Words.
- **Top Students sidebar:** Ranked list of top 5 students by GPA with email and rank number.
- **Suspended students alert:** Red banner showing count if > 0.

---

# 6. Meeting Memos

## Meeting 1 — March 15, 2026
**Attendees:** Diego Reyes Liranzo, Daniel Olekszyk, Samia Islam, Maisha Islam, Kyle Gosine
**Topics:**
- Reviewed project specification and identified all 17 use cases.
- Decided on technology stack: Next.js 16, TypeScript, Prisma 7.5, SQLite, Tailwind CSS 4.
- Assigned initial responsibilities: Diego on login page, Samia on database schema, Daniel on API routes, Maisha on UI components, Kyle on documentation.
- Agreed on Git workflow: feature branches, PRs to main, code review required.

**Concerns:**
- SQLite limitations for concurrent access; decided acceptable for demo scope.
- Need to clarify taboo word filtering edge cases with professor.

## Meeting 2 — March 24, 2026
**Attendees:** Diego Reyes Liranzo, Daniel Olekszyk, Samia Islam, Maisha Islam, Kyle Gosine
**Topics:**
- Completed Phase I SRS document (Version 1.0).
- Finalized all use-case descriptions and supplementary requirements.
- Reviewed database schema design (11 models).
- Diego demonstrated working login page prototype.

**Concerns:**
- OpenAI API key management — agreed to use .env file, not commit keys.
- Timeline tight for Phase II; began planning pseudo-code assignments.

## Meeting 3 — April 5, 2026
**Attendees:** Diego Reyes Liranzo, Daniel Olekszyk, Samia Islam, Maisha Islam, Kyle Gosine
**Topics:**
- Database schema merged to main (11 models, seed script with 16 users).
- Samia implemented authentication system, session management, and role-based dashboards.
- Integrated portal logic with navy UI theme.
- Reviewed student, instructor, and registrar dashboard prototypes.

**Concerns:**
- Some features (course registration, grading, reviews) still need implementation.
- Need to coordinate on complaint processing and graduation workflows.

## Meeting 4 — April 18, 2026
**Attendees:** Diego Reyes Liranzo, Daniel Olekszyk, Samia Islam, Maisha Islam, Kyle Gosine
**Topics:**
- Began drafting Phase II Design Report.
- Assigned diagram creation: Samia on E-R diagram and pseudo-code, Diego on sequence diagrams, Daniel on Petri-nets.
- Reviewed all use-case scenarios for completeness.
- Planned remaining implementation for Phase III.

**Concerns:**
- Phase II deadline April 23; need to finalize report in 2 days.
- AI chat feature depends on valid OpenAI API key — need backup plan.

---

# 7. Repository

**GitHub Repository:** https://github.com/dreyesliranzo/CunyZeroLite

**Branch structure:**
- `main` — stable, reviewed code only
- `feature/database-schema` — Prisma schema and seed data (merged)
- `feature/auth-dashboards` — Authentication, session management, role-based dashboards
- `feature/student-portal` — Student portal UI (merged)
- `feature/ai-chat` — AI assistant integration (in progress)

**Technology Stack:**
- Next.js 16 (React framework)
- TypeScript (type safety)
- Prisma 7.5 (ORM)
- SQLite via better-sqlite3 (database)
- Tailwind CSS 4 (styling)
- OpenAI GPT-4o-mini (AI assistant)

---

*Confidential — Group K*
