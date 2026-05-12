"""Generate the §1.2 system collaboration class diagram and the §2.1
use-case diagram as PNG figures for the Phase II Design Report."""

import os
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Ellipse, FancyArrowPatch, Circle

HERE = os.path.dirname(os.path.abspath(__file__))

# ────────────────────────────────────────────────────────────────
# 1. §1.2 System Collaboration Class Diagram (3-layer architecture)
# ────────────────────────────────────────────────────────────────
def draw_class_diagram():
    fig, ax = plt.subplots(figsize=(14, 11))
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 14)
    ax.axis("off")

    def layer(x, y, w, h, title, stereotype, items, fill, cols=3):
        box = FancyBboxPatch(
            (x, y), w, h,
            boxstyle="round,pad=0.08,rounding_size=0.15",
            linewidth=1.8, edgecolor="#222", facecolor=fill,
        )
        ax.add_patch(box)
        ax.text(x + w / 2, y + h - 0.35, stereotype,
                ha="center", va="center", fontsize=10, style="italic",
                color="#555")
        ax.text(x + w / 2, y + h - 0.85, title,
                ha="center", va="center", fontsize=13, fontweight="bold")

        col_w = w / cols
        # Compute how many rows we need, then fit row_h into remaining height
        import math
        nrows = math.ceil(len(items) / cols)
        content_top = y + h - 1.55
        content_bottom = y + 0.35
        available = content_top - content_bottom
        row_h = available / max(nrows, 1)
        for i, name in enumerate(items):
            r, c = divmod(i, cols)
            cx = x + 0.22 + c * col_w
            cy = content_top - (r + 0.5) * row_h
            cw = col_w - 0.35
            ch = min(0.44, row_h * 0.78)
            item = FancyBboxPatch(
                (cx, cy - ch / 2), cw, ch,
                boxstyle="round,pad=0.02,rounding_size=0.08",
                linewidth=1.0, edgecolor="#333", facecolor="white",
            )
            ax.add_patch(item)
            ax.text(cx + cw / 2, cy, name,
                    ha="center", va="center", fontsize=8.5, family="monospace")

    boundary_items = [
        "LoginPage", "Dashboard", "StudentPortal",
        "InstructorPortal", "RegistrarPortal", "PublicHomePage",
        "ChangePasswordPage", "AIChatWidget", "ScheduleBuilder",
    ]
    control_items = [
        "loginUser()", "logoutUser()", "changePassword()",
        "registerForCourse()", "assignGrade()", "submitReview()",
        "fileComplaint()", "processComplaint()", "manageApplication()",
        "manageSemester()", "setupCourse()", "applyGraduation()",
        "manageTabooWords()", "askAI()", "payFine()",
        "dropOrWithdraw()", "enforceRunningRules()", "getSession()",
    ]
    entity_items = [
        "User", "Semester", "Course",
        "Enrollment", "Waitlist", "Review",
        "Complaint", "Warning", "Application",
        "GraduationRequest", "TabooWord", "HonorRoll",
    ]

    # Boundary layer (top): 9 items in 3 cols
    layer(0.6, 10.4, 12.8, 3.1, "Browser / Client", "«boundary»",
          boundary_items, fill="#e9f2fb", cols=3)
    # Control layer (middle): 18 items in 3 cols — needs tall band
    layer(0.6, 4.7, 12.8, 4.7, "Next.js API Routes & Server Actions",
          "«control»", control_items, fill="#fff6e5", cols=3)
    # Entity layer (bottom): 12 items in 3 cols
    layer(0.6, 0.4, 12.8, 3.3, "SQLite Database (via Prisma ORM)",
          "«entity»", entity_items, fill="#e8f7ec", cols=3)

    def inter_arrow(y_top, y_bot, label):
        x_down = 5.8
        x_up = 8.2
        a1 = FancyArrowPatch((x_down, y_top), (x_down, y_bot),
                             arrowstyle="-|>", mutation_scale=20,
                             linewidth=1.8, color="#1e3a8a")
        a2 = FancyArrowPatch((x_up, y_bot), (x_up, y_top),
                             arrowstyle="-|>", mutation_scale=20,
                             linewidth=1.8, color="#6b7280",
                             linestyle="--")
        ax.add_patch(a1); ax.add_patch(a2)
        ax.text(7.0, (y_top + y_bot) / 2, label,
                ha="center", va="center", fontsize=10.5,
                bbox=dict(boxstyle="round,pad=0.35", facecolor="white",
                          edgecolor="#333"))

    # Arrow gap between boundary (bottom=10.4) and control (top=9.4)
    inter_arrow(10.4, 9.4, "HTTP / Server Actions")
    # Arrow gap between control (bottom=4.7) and entity (top=3.7)
    inter_arrow(4.7, 3.7, "Prisma ORM")

    plt.tight_layout()
    out = os.path.join(HERE, "class_diagram.png")
    plt.savefig(out, dpi=170, bbox_inches="tight", facecolor="white")
    plt.close(fig)
    print(f"Saved {out}")


# ────────────────────────────────────────────────────────────────
# 2. §2.1 Use-Case Diagram
# ────────────────────────────────────────────────────────────────
def draw_stick_actor(ax, cx, cy, label):
    ax.add_patch(Circle((cx, cy + 0.55), 0.22, fill=False, linewidth=2.0,
                        edgecolor="#1f2937"))
    ax.plot([cx, cx], [cy + 0.33, cy - 0.2], color="#1f2937", linewidth=2.0)
    ax.plot([cx - 0.38, cx + 0.38], [cy + 0.12, cy + 0.12],
            color="#1f2937", linewidth=2.0)
    ax.plot([cx, cx - 0.28], [cy - 0.2, cy - 0.65],
            color="#1f2937", linewidth=2.0)
    ax.plot([cx, cx + 0.28], [cy - 0.2, cy - 0.65],
            color="#1f2937", linewidth=2.0)
    ax.text(cx, cy - 0.95, label, ha="center", va="center",
            fontsize=13, fontweight="bold")


def draw_use_case_diagram():
    fig, ax = plt.subplots(figsize=(20, 14))
    ax.set_xlim(0, 26)
    ax.set_ylim(0, 19)
    ax.axis("off")

    # System boundary
    boundary = FancyBboxPatch(
        (4.8, 0.6), 16.4, 17.8,
        boxstyle="round,pad=0.0,rounding_size=0.35",
        linewidth=2.5, edgecolor="#1e3a8a", facecolor="#f8fafc",
    )
    ax.add_patch(boundary)
    ax.text(13.0, 18.0, "CUNYZEROLITE — SYSTEM BOUNDARY",
            ha="center", va="center", fontsize=15, fontweight="bold",
            color="#1e3a8a")

    # Grid: 4 columns × 5 rows inside boundary
    # x: 6.6, 10.2, 13.8, 17.4 ; y: 16.0, 13.2, 10.4, 7.6, 4.0
    col_xs = [7.0, 10.7, 14.4, 18.1]
    row_ys = [16.0, 13.1, 10.2, 7.3, 4.0]

    ucs = {
        "UC-1":  (col_xs[0], row_ys[0], "UC-1\nView Public Homepage"),
        "UC-2":  (col_xs[1], row_ys[0], "UC-2\nApply as Student/\nInstructor"),
        "UC-14": (col_xs[2], row_ys[0], "UC-14\nAsk AI Assistant"),
        "UC-3":  (col_xs[3], row_ys[0], "UC-3\nApprove/Reject\nApplications"),

        "UC-6":  (col_xs[0], row_ys[1], "UC-6\nRegister for\nCourses"),
        "UC-7":  (col_xs[1], row_ys[1], "UC-7\nManage Waitlist"),
        "UC-8":  (col_xs[2], row_ys[1], "UC-8\nWrite & Rate\nReviews"),
        "UC-20": (col_xs[3], row_ys[1], "UC-20\nSchedule Builder"),

        "UC-15": (col_xs[0], row_ys[2], "UC-15\nRole-Based\nDashboard"),
        "UC-18": (col_xs[1], row_ys[2], "UC-18\nDrop / Withdraw\nfrom Course"),
        "UC-19": (col_xs[2], row_ys[2], "UC-19\nView & Pay Fine"),
        "UC-9":  (col_xs[3], row_ys[2], "UC-9\nAssign Grades"),

        "UC-12": (col_xs[0], row_ys[3], "UC-12\nApply for\nGraduation"),
        "UC-13": (col_xs[1], row_ys[3], "UC-13\nApprove/Reject\nGraduation"),
        "UC-10": (col_xs[2], row_ys[3], "UC-10\nFile Complaint"),
        "UC-11": (col_xs[3], row_ys[3], "UC-11\nProcess Complaints"),

        "UC-4":  (col_xs[0], row_ys[4], "UC-4\nManage Semester\nPeriods"),
        "UC-5":  (col_xs[1], row_ys[4], "UC-5\nSet Up Courses"),
        "UC-16": (col_xs[2], row_ys[4], "UC-16\nManage Taboo\nWords"),
        "UC-17": (col_xs[3], row_ys[4], "UC-17\nEnforce Running\nPeriod Rules"),
    }

    oval_w, oval_h = 3.1, 1.85
    uc_centers = {}
    for key, (x, y, label) in ucs.items():
        el = Ellipse((x, y), oval_w, oval_h, facecolor="#ffffff",
                     edgecolor="#1e3a8a", linewidth=1.5)
        ax.add_patch(el)
        ax.text(x, y, label, ha="center", va="center", fontsize=9.5,
                fontweight="bold", color="#0f172a", linespacing=1.25)
        uc_centers[key] = (x, y)

    # Actors — 2 on left (Visitor, Student) and 2 on right (Instructor, Registrar)
    actors = {
        "Visitor":    (2.3, 16.0),
        "Student":    (2.3, 10.5),
        "Instructor": (23.4, 12.5),
        "Registrar":  (23.4, 6.0),
    }
    for name, (cx, cy) in actors.items():
        draw_stick_actor(ax, cx, cy, name)

    # Associations
    def assoc(actor_name, uc_key):
        ax0, ay0 = actors[actor_name]
        ay0 = ay0 + 0.08  # anchor at body mid-line
        ux, uy = uc_centers[uc_key]
        if ax0 < ux:
            start_x = ax0 + 0.42
            end_x = ux - oval_w / 2
        else:
            start_x = ax0 - 0.42
            end_x = ux + oval_w / 2
        ax.plot([start_x, end_x], [ay0, uy],
                color="#64748b", linewidth=0.9, alpha=0.85)

    visitor_ucs    = ["UC-1", "UC-2", "UC-14"]
    student_ucs    = ["UC-6", "UC-7", "UC-8", "UC-10", "UC-12",
                      "UC-14", "UC-15", "UC-18", "UC-19", "UC-20"]
    instructor_ucs = ["UC-7", "UC-9", "UC-10", "UC-14", "UC-15"]
    registrar_ucs  = ["UC-3", "UC-4", "UC-5", "UC-11", "UC-13",
                      "UC-14", "UC-15", "UC-16", "UC-17"]

    for uc in visitor_ucs:    assoc("Visitor", uc)
    for uc in student_ucs:    assoc("Student", uc)
    for uc in instructor_ucs: assoc("Instructor", uc)
    for uc in registrar_ucs:  assoc("Registrar", uc)

    # Legend at bottom (association-only; «include»/«extend» are listed
    # textually beneath the figure to keep the diagram readable)
    lx, ly = 9.5, 1.5
    ax.plot([lx, lx + 0.6], [ly, ly], color="#64748b", linewidth=1.2)
    ax.text(lx + 0.75, ly,
            "Solid lines represent actor – use-case associations",
            ha="left", va="center", fontsize=11, color="#334155")

    plt.tight_layout()
    out = os.path.join(HERE, "usecase_diagram.png")
    plt.savefig(out, dpi=170, bbox_inches="tight", facecolor="white")
    plt.close(fig)
    print(f"Saved {out}")


if __name__ == "__main__":
    draw_class_diagram()
    draw_use_case_diagram()
