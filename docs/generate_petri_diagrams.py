#!/usr/bin/env python3
"""Render the three Petri-net diagrams as PNGs using proper notation:

  Places       = circles (open), label written inside or beside
  Transitions  = filled black rectangles (bars)
  Arcs         = directed arrows (place -> transition or transition -> place)
  Tokens       = black dots inside a place (initial marking)
  Dashed arc   = optional inhibitor/read arc (not used here)

Each transition is labeled with its id + a short description.
Each place is labeled with its id + a short description.

Outputs:
  docs/petri_uc6.png   — UC-6  Register for Courses
  docs/petri_uc9.png   — UC-9  Assign Grades (Academic Standing)
  docs/petri_uc8.png   — UC-8  Review Submission (Taboo Filtering)
"""

import os
import math
import matplotlib.pyplot as plt
from matplotlib.patches import Circle, Rectangle, FancyArrowPatch

PLACE_RADIUS = 0.45
TRANSITION_W = 1.0
TRANSITION_H = 0.14

LINE_COLOR = "#1A1A1A"
PLACE_FACE = "#FFFFFF"
TRANSITION_FACE = "#1A1A1A"
TERMINAL_FACE = "#FFE8E8"
GOOD_FACE = "#E8F5E9"


class PetriCanvas:
    def __init__(self, figsize, xlim, ylim, title=None):
        self.fig, self.ax = plt.subplots(figsize=figsize)
        self.ax.set_xlim(*xlim)
        self.ax.set_ylim(*ylim)
        self.ax.set_aspect('equal')
        self.ax.axis('off')
        self.shapes = {}  # name -> dict(kind, cx, cy, hw, hh)
        if title:
            self.ax.text((xlim[0] + xlim[1]) / 2, ylim[1] - 0.4, title,
                         ha='center', va='top', fontsize=13, fontweight='bold')

    # ─────────────────────────────────────────────────────────
    # Shape registry
    # ─────────────────────────────────────────────────────────
    def _reg(self, name, kind, cx, cy, hw, hh):
        self.shapes[name] = {"kind": kind, "cx": cx, "cy": cy,
                             "hw": hw, "hh": hh}

    # ─────────────────────────────────────────────────────────
    # Primitives
    # ─────────────────────────────────────────────────────────
    def place(self, name, cx, cy, label="", subtitle="",
              color=PLACE_FACE, tokens=0):
        self.ax.add_patch(Circle((cx, cy), PLACE_RADIUS,
                                 linewidth=1.8, edgecolor=LINE_COLOR,
                                 facecolor=color, zorder=3))
        # Place id inside
        self.ax.text(cx, cy + 0.05, name, ha='center', va='center',
                     fontsize=9, fontweight='bold', zorder=4)
        # Token dots
        if tokens > 0:
            if tokens == 1:
                self.ax.plot(cx, cy - 0.12, 'o',
                             color='black', markersize=6, zorder=5)
            else:
                self.ax.text(cx, cy - 0.12, f"{tokens}",
                             ha='center', va='center',
                             fontsize=10, fontweight='bold', zorder=5)

        # Label text below the circle
        if label:
            self.ax.text(cx, cy - PLACE_RADIUS - 0.18, label,
                         ha='center', va='top', fontsize=8,
                         wrap=True, zorder=4)
        if subtitle:
            self.ax.text(cx, cy - PLACE_RADIUS - 0.42, subtitle,
                         ha='center', va='top', fontsize=7.5,
                         style='italic', color="#555", zorder=4)
        self._reg(name, "place", cx, cy, PLACE_RADIUS, PLACE_RADIUS)

    def transition(self, name, cx, cy, label="", vertical=False):
        """Draw a filled black rectangle (narrow bar)."""
        if vertical:
            w, h = TRANSITION_H, TRANSITION_W
        else:
            w, h = TRANSITION_W, TRANSITION_H
        self.ax.add_patch(Rectangle((cx - w/2, cy - h/2), w, h,
                                    linewidth=1.0, edgecolor=LINE_COLOR,
                                    facecolor=TRANSITION_FACE, zorder=3))
        # Label to the right of horizontal bars, or below for vertical
        if vertical:
            self.ax.text(cx + w/2 + 0.08, cy, f"{name}: {label}" if label else name,
                         ha='left', va='center', fontsize=7.5, zorder=4)
        else:
            self.ax.text(cx, cy - h/2 - 0.14,
                         f"{name}: {label}" if label else name,
                         ha='center', va='top', fontsize=7.5, zorder=4)
        self._reg(name, "transition", cx, cy, w/2, h/2)

    # ─────────────────────────────────────────────────────────
    # Edge-clip + arc drawing
    # ─────────────────────────────────────────────────────────
    def _edge_point(self, shape, tx, ty):
        cx, cy = shape["cx"], shape["cy"]
        dx, dy = tx - cx, ty - cy
        if dx == 0 and dy == 0:
            return cx, cy
        if shape["kind"] == "place":
            d = math.sqrt(dx*dx + dy*dy)
            t = shape["hw"] / d
        else:  # transition rectangle
            hw, hh = shape["hw"], shape["hh"]
            if dx == 0:    t = hh / abs(dy)
            elif dy == 0:  t = hw / abs(dx)
            else:          t = min(hw / abs(dx), hh / abs(dy))
        return cx + dx * t, cy + dy * t

    def arc(self, src, dst, label=None, via=None, curve=0.0):
        """Directed arrow from src shape edge to dst shape edge.

        via: optional (x,y) waypoint to route through.
        curve: rad amount for FancyArrowPatch connectionstyle="arc3".
        """
        S, D = self.shapes[src], self.shapes[dst]
        sx, sy = self._edge_point(S, D["cx"], D["cy"])
        dx, dy = self._edge_point(D, S["cx"], S["cy"])
        if via is not None:
            # Draw two straight arrows, first without head then with head
            self.ax.plot([sx, via[0]], [sy, via[1]], color=LINE_COLOR,
                         linewidth=1.0, zorder=1)
            arrow = FancyArrowPatch(via, (dx, dy), arrowstyle="->,head_length=6,head_width=4",
                                    color=LINE_COLOR, linewidth=1.0, zorder=1)
            self.ax.add_patch(arrow)
            if label:
                mx = (sx + via[0] + dx) / 3
                my = (sy + via[1] + dy) / 3
                self.ax.text(mx, my, label, fontsize=7, color="#444",
                             ha='center', va='center',
                             bbox=dict(facecolor='white', edgecolor='none', pad=0.6),
                             zorder=4)
            return
        arrow = FancyArrowPatch((sx, sy), (dx, dy),
                                arrowstyle="->,head_length=6,head_width=4",
                                color=LINE_COLOR, linewidth=1.0,
                                connectionstyle=f"arc3,rad={curve}",
                                zorder=1)
        self.ax.add_patch(arrow)
        if label:
            mx = (sx + dx) / 2
            my = (sy + dy) / 2
            self.ax.text(mx, my, label, fontsize=7, color="#444",
                         ha='center', va='center',
                         bbox=dict(facecolor='white', edgecolor='none', pad=0.6),
                         zorder=4)

    # ─────────────────────────────────────────────────────────
    def save(self, path, dpi=170):
        plt.savefig(path, dpi=dpi, bbox_inches='tight', facecolor='white')
        plt.close(self.fig)


# ═══════════════════════════════════════════════════════════════════════════
# UC-6 — Register for Courses
# ═══════════════════════════════════════════════════════════════════════════
def build_uc6():
    c = PetriCanvas(figsize=(14, 18), xlim=(0, 14), ylim=(0, 20),
                    title="Petri-Net — UC-6 Register for Courses")

    # Places + transitions (top-to-bottom tree)
    c.place("P1", 7.0, 18.2, "Student at Registration Page", tokens=1)
    c.transition("t1", 7.0, 17.2, "select course")
    c.place("P2", 7.0, 16.2, "Course Selected")

    c.transition("t2", 5.0, 15.0, "eligible")
    c.transition("t3", 10.5, 15.0, "ineligible (suspended /\n"
                                   "terminated / 4 courses /\n"
                                   "retake of non-F)")

    c.place("P3", 5.0, 13.6, "Eligibility OK")
    c.place("P_DENIED", 11.0, 13.6, "Registration Denied", color=TERMINAL_FACE)

    c.transition("t4", 3.0, 12.3, "no time conflict")
    c.transition("t5", 7.0, 12.3, "time conflict")

    c.place("P4", 3.0, 10.9, "No Conflict")
    c.place("P_CONFLICT", 7.5, 10.9, "Conflict Error", color=TERMINAL_FACE)

    c.transition("t6", 1.8, 9.4, "course has spots")
    c.transition("t7", 4.6, 9.4, "course is full")

    c.place("P5", 1.8, 8.0, "Spot Open")
    c.place("P6", 4.6, 8.0, "Course Full")

    c.transition("t8", 1.8, 6.2, "INSERT Enrollment")
    c.transition("t9", 4.6, 6.2, "INSERT Waitlist")

    c.place("P7", 1.8, 4.8, "Enrolled", color=GOOD_FACE)
    c.place("P8", 4.6, 4.8, "Waitlisted", color=GOOD_FACE)

    # Arcs
    c.arc("P1", "t1")
    c.arc("t1", "P2")

    c.arc("P2", "t2")
    c.arc("P2", "t3")
    c.arc("t2", "P3")
    c.arc("t3", "P_DENIED")

    c.arc("P3", "t4")
    c.arc("P3", "t5")
    c.arc("t4", "P4")
    c.arc("t5", "P_CONFLICT")

    c.arc("P4", "t6")
    c.arc("P4", "t7")
    c.arc("t6", "P5")
    c.arc("t7", "P6")

    c.arc("P5", "t8")
    c.arc("P6", "t9")
    c.arc("t8", "P7")
    c.arc("t9", "P8")

    # Legend
    lx, ly = 10.2, 4.5
    c.ax.add_patch(Circle((lx, ly + 1.4), 0.28, linewidth=1.5,
                          edgecolor=LINE_COLOR, facecolor=PLACE_FACE))
    c.ax.text(lx + 0.55, ly + 1.4, "place (state)", fontsize=8, va='center')
    c.ax.add_patch(Rectangle((lx - 0.32, ly + 0.85), 0.65, 0.1,
                             facecolor=TRANSITION_FACE, edgecolor=LINE_COLOR))
    c.ax.text(lx + 0.55, ly + 0.9, "transition (event)", fontsize=8, va='center')
    arrow = FancyArrowPatch((lx - 0.35, ly + 0.35), (lx + 0.35, ly + 0.35),
                            arrowstyle="->,head_length=6,head_width=4",
                            color=LINE_COLOR, linewidth=1.0)
    c.ax.add_patch(arrow)
    c.ax.text(lx + 0.55, ly + 0.35, "directed arc", fontsize=8, va='center')
    c.ax.add_patch(Circle((lx, ly - 0.15), 0.28, linewidth=1.5,
                          edgecolor=LINE_COLOR, facecolor=PLACE_FACE))
    c.ax.plot(lx, ly - 0.23, 'o', color='black', markersize=5)
    c.ax.text(lx + 0.55, ly - 0.15, "token (initial marking)", fontsize=8, va='center')
    c.ax.text(lx - 0.4, ly + 2.0, "Legend", fontsize=9, fontweight='bold')

    c.save(os.path.join(os.path.dirname(os.path.abspath(__file__)), "petri_uc6.png"))
    print("Saved petri_uc6.png")


# ═══════════════════════════════════════════════════════════════════════════
# UC-9 — Assign Grades (Academic Standing)
# ═══════════════════════════════════════════════════════════════════════════
def build_uc9():
    c = PetriCanvas(figsize=(16, 22), xlim=(0, 16), ylim=(0, 24),
                    title="Petri-Net — UC-9 Assign Grades & Academic Standing")

    c.place("P1", 8.0, 22.4, "Grading Period Active", tokens=1)
    c.transition("t1", 8.0, 21.4, "instructor opens grading")
    c.place("P2", 8.0, 20.4, "Student List Displayed")
    c.transition("t2", 8.0, 19.4, "assign letter grade")
    c.place("P3", 8.0, 18.4, "Grade Saved")

    c.transition("t3", 6.0, 17.1, "all graded")
    c.transition("t4", 11.5, 17.1, "period ends before all graded")

    c.place("P4", 6.0, 15.7, "Grades Finalized")
    c.place("P_WARN", 12.5, 15.7, "Instructor Warning", color=TERMINAL_FACE)

    c.transition("t5", 6.0, 14.4, "recalculate cumulative GPA")
    c.place("P5", 6.0, 13.0, "GPA Updated")

    c.transition("t6", 2.0, 11.3, "GPA < 2.0 or\ndouble-fail same course")
    c.transition("t7", 6.0, 11.3, "GPA 2.0 – 2.25")
    c.transition("t8", 10.2, 11.3, "GPA >= 2.25")

    c.place("P_TERM",   2.0, 9.4, "Student Terminated", color=TERMINAL_FACE)
    c.place("P_PROB",   6.0, 9.4, "Warning + Must Interview", color=TERMINAL_FACE)
    c.place("P6",      10.2, 9.4, "GPA Passing")

    c.transition("t9", 8.0,  7.9, "semGPA > 3.75 OR\n(cumGPA > 3.5 & semesters > 1)")
    c.transition("t10", 12.5, 7.9, "no honor threshold")

    c.place("P_HONOR", 8.0, 6.4, "Honor Roll Entry", color=GOOD_FACE)
    c.place("P_DONE", 13.0, 6.4, "Evaluation Complete", color=GOOD_FACE)

    c.transition("t11", 8.0, 4.9, "consume honor to remove\none active warning (if any)")
    c.place("P_HONOR_USED", 8.0, 3.4, "Warning Cleared", color=GOOD_FACE)

    # Arcs
    c.arc("P1", "t1"); c.arc("t1", "P2")
    c.arc("P2", "t2"); c.arc("t2", "P3")

    c.arc("P3", "t3"); c.arc("P3", "t4")
    c.arc("t3", "P4"); c.arc("t4", "P_WARN")

    c.arc("P4", "t5"); c.arc("t5", "P5")

    c.arc("P5", "t6"); c.arc("P5", "t7"); c.arc("P5", "t8")
    c.arc("t6", "P_TERM"); c.arc("t7", "P_PROB"); c.arc("t8", "P6")

    c.arc("P6", "t9"); c.arc("P6", "t10")
    c.arc("t9", "P_HONOR"); c.arc("t10", "P_DONE")

    c.arc("P_HONOR", "t11"); c.arc("t11", "P_HONOR_USED")

    c.save(os.path.join(os.path.dirname(os.path.abspath(__file__)), "petri_uc9.png"))
    print("Saved petri_uc9.png")


# ═══════════════════════════════════════════════════════════════════════════
# UC-8 — Review Submission with Taboo Filtering
# ═══════════════════════════════════════════════════════════════════════════
def build_uc8():
    c = PetriCanvas(figsize=(16, 20), xlim=(0, 16), ylim=(0, 22),
                    title="Petri-Net — UC-8 Review Submission & Taboo Filtering")

    c.place("P1", 8.0, 20.4, "Student on Reviews Page", tokens=1)
    c.transition("t1", 8.0, 19.4, "enter rating + comment")
    c.place("P2", 8.0, 18.4, "Review Submitted")
    c.transition("t2", 8.0, 17.4, "scan comment vs TabooWord list")
    c.place("P3", 8.0, 16.4, "Taboo Count Determined")

    c.transition("t3", 2.5, 14.9, "0 taboo words (publish)")
    c.transition("t4", 8.0, 14.9, "1–2 taboo words (asterisk + 1 warning)")
    c.transition("t5", 13.5, 14.9, "3+ taboo words (hide + 2 warnings)")

    c.place("P4", 2.5, 13.3, "Published", color=GOOD_FACE)
    c.place("P5", 8.0, 13.3, "Filtered, +1 Warning")
    c.place("P6", 13.5, 13.3, "Hidden, +2 Warnings")

    # Avg-rating check branch: P4 and P5 feed in (both visible); P6 does not
    c.transition("t6a", 2.5, 11.5, "compute course avg")
    c.transition("t6b", 8.0, 11.5, "compute course avg")
    c.place("P7", 5.0, 10.1, "Avg Rating Computed")

    c.transition("t9", 3.2, 8.5, "avg < 2.0")
    c.transition("t10", 6.8, 8.5, "avg >= 2.0")
    c.place("P9", 3.2, 7.1, "Instructor Warning Issued", color=TERMINAL_FACE)
    c.place("P_OK_A", 6.8, 7.1, "Course Rating OK", color=GOOD_FACE)

    # Warning-count branch: P5 and P6 feed in (both incremented warnings)
    c.transition("t7", 10.0, 11.5, "re-check warning count")
    c.transition("t8", 13.5, 11.5, "re-check warning count")
    c.place("P8", 11.8, 10.1, "Warning Count Re-Checked")

    c.transition("t11", 10.0, 8.5, "warnings >= 3")
    c.transition("t12", 13.5, 8.5, "warnings < 3")
    c.place("P10", 10.0, 7.1, "Student Suspended + $100 Fine", color=TERMINAL_FACE)
    c.place("P_OK_B", 13.5, 7.1, "Student Status OK", color=GOOD_FACE)

    # Arcs
    c.arc("P1", "t1"); c.arc("t1", "P2")
    c.arc("P2", "t2"); c.arc("t2", "P3")

    c.arc("P3", "t3"); c.arc("P3", "t4"); c.arc("P3", "t5")
    c.arc("t3", "P4"); c.arc("t4", "P5"); c.arc("t5", "P6")

    # Published path: avg check only
    c.arc("P4", "t6a"); c.arc("t6a", "P7")
    # Filtered path: avg check AND warning check (AND-split — same token both outputs)
    c.arc("P5", "t6b"); c.arc("t6b", "P7")
    c.arc("P5", "t7");  c.arc("t7", "P8")
    # Hidden path: warning check only (hidden reviews excluded from avg)
    c.arc("P6", "t8");  c.arc("t8", "P8")

    c.arc("P7", "t9");  c.arc("P7", "t10")
    c.arc("t9", "P9");  c.arc("t10", "P_OK_A")

    c.arc("P8", "t11"); c.arc("P8", "t12")
    c.arc("t11", "P10"); c.arc("t12", "P_OK_B")

    # Note about the AND-split
    c.ax.text(8.0, 2.4,
              "Note: the filtered-review branch (P5 → t6b and P5 → t7) is an AND-split — a\n"
              "single review triggers both the course-rating check (via P7) and the student-warning\n"
              "count check (via P8) in parallel. Hidden reviews (P6) do not contribute to the course\n"
              "average and therefore bypass the rating-check branch.",
              ha='center', va='center', fontsize=8.5, style='italic', color="#333",
              bbox=dict(facecolor='#F8F8F8', edgecolor='#CCC', pad=6))

    c.save(os.path.join(os.path.dirname(os.path.abspath(__file__)), "petri_uc8.png"))
    print("Saved petri_uc8.png")


if __name__ == "__main__":
    build_uc6()
    build_uc9()
    build_uc8()
