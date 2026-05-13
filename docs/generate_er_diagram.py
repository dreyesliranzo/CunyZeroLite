#!/usr/bin/env python3
"""Generate two Chen-notation E-R diagrams for CunyZeroLite as PNGs:

  1. er_diagram.png       -- main ER diagram: all 12 entities, relationships,
                              primary keys, and 1-3 key non-PK attributes each.
  2. er_diagram_isa.png   -- compact User specialization (ISA) hierarchy.

Splitting the ISA hierarchy into its own figure keeps the main diagram clean
(the subtype boxes were colliding with the Review associative path in a single
combined diagram).

Shapes:
  Rectangle         = strong entity
  Double rectangle  = weak / associative entity
  Diamond           = relationship  (double outline = identifying)
  Oval              = attribute (underlined label = primary key)
  Triangle (ISA)    = specialization / generalization
  Line              = association; cardinality (1, N, M) labeled near endpoints
"""

import os
import math
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, Polygon, Ellipse

ENTITY_COLOR = "#E8F0FE"
WEAK_COLOR   = "#FFF4E5"
REL_COLOR    = "#E8F5E9"
ATTR_COLOR   = "#FAFAFA"
ISA_COLOR    = "#F3E5F5"
LINE_COLOR   = "#1A1A1A"
CARD_COLOR   = "#B00020"


class ERCanvas:
    """Lightweight helper that owns a matplotlib axes and a shape registry."""

    def __init__(self, figsize, xlim, ylim):
        self.fig, self.ax = plt.subplots(figsize=figsize)
        self.ax.set_xlim(*xlim)
        self.ax.set_ylim(*ylim)
        self.ax.set_aspect('equal')
        self.ax.axis('off')
        self.shapes = {}

    # ── shape registry ─────────────────────────────────────
    def _reg(self, name, kind, cx, cy, hw, hh):
        self.shapes[name] = {"kind": kind, "cx": cx, "cy": cy, "hw": hw, "hh": hh}

    # ── primitives ─────────────────────────────────────────
    def strong_entity(self, name, cx, cy, w=2.3, h=1.0, label=None, fs=11):
        self.ax.add_patch(Rectangle((cx - w/2, cy - h/2), w, h,
                                    linewidth=1.8, edgecolor=LINE_COLOR,
                                    facecolor=ENTITY_COLOR, zorder=3))
        self.ax.text(cx, cy, label or name, ha='center', va='center',
                     fontsize=fs, fontweight='bold', zorder=4)
        self._reg(name, "rect", cx, cy, w/2, h/2)

    def weak_entity(self, name, cx, cy, w=2.3, h=1.0, label=None, fs=10):
        self.ax.add_patch(Rectangle((cx - w/2, cy - h/2), w, h,
                                    linewidth=1.5, edgecolor=LINE_COLOR,
                                    facecolor=WEAK_COLOR, zorder=3))
        inset = 0.09
        self.ax.add_patch(Rectangle((cx - w/2 + inset, cy - h/2 + inset),
                                    w - 2*inset, h - 2*inset,
                                    linewidth=1.0, edgecolor=LINE_COLOR,
                                    facecolor=WEAK_COLOR, zorder=3))
        self.ax.text(cx, cy, label or name, ha='center', va='center',
                     fontsize=fs, fontweight='bold', style='italic', zorder=4)
        self._reg(name, "rect", cx, cy, w/2, h/2)

    def relationship(self, name, cx, cy, w=1.5, h=0.7, label=None,
                     identifying=False, fs=8):
        pts = [(cx, cy + h/2), (cx + w/2, cy), (cx, cy - h/2), (cx - w/2, cy)]
        self.ax.add_patch(Polygon(pts, closed=True, linewidth=1.5,
                                  edgecolor=LINE_COLOR, facecolor=REL_COLOR, zorder=3))
        if identifying:
            inset = 0.08
            pts_in = [(cx, cy + h/2 - inset*1.6), (cx + w/2 - inset*1.6, cy),
                      (cx, cy - h/2 + inset*1.6), (cx - w/2 + inset*1.6, cy)]
            self.ax.add_patch(Polygon(pts_in, closed=True, linewidth=1.0,
                                      edgecolor=LINE_COLOR, facecolor=REL_COLOR,
                                      zorder=3))
        self.ax.text(cx, cy, label or name, ha='center', va='center',
                     fontsize=fs, zorder=4)
        self._reg(name, "diamond", cx, cy, w/2, h/2)

    def attribute(self, name, cx, cy, label, is_key=False, rx=0.48, ry=0.24):
        self.ax.add_patch(Ellipse((cx, cy), width=2*rx, height=2*ry,
                                  linewidth=1.0, edgecolor=LINE_COLOR,
                                  facecolor=ATTR_COLOR, zorder=3))
        self.ax.text(cx, cy, label, ha='center', va='center', fontsize=7.5)
        if is_key:
            tw = max(0.2, len(label) * 0.055)
            self.ax.plot([cx - tw/2, cx + tw/2], [cy - 0.115, cy - 0.115],
                         color=LINE_COLOR, linewidth=0.9, zorder=4)
        self._reg(name, "ellipse", cx, cy, rx, ry)

    def isa_triangle(self, name, cx, cy, w=1.4, h=1.0, label="ISA"):
        pts = [(cx, cy + h/2), (cx - w/2, cy - h/2), (cx + w/2, cy - h/2)]
        self.ax.add_patch(Polygon(pts, closed=True, linewidth=1.4,
                                  edgecolor=LINE_COLOR, facecolor=ISA_COLOR, zorder=3))
        self.ax.text(cx, cy - 0.15, label, ha='center', va='center',
                     fontsize=10, fontweight='bold', zorder=4)
        self._reg(name, "rect", cx, cy, w/2, h/2)

    # ── edge clipping ──────────────────────────────────────
    def _edge_point(self, shape, tx, ty):
        cx, cy = shape["cx"], shape["cy"]
        dx, dy = tx - cx, ty - cy
        if dx == 0 and dy == 0:
            return cx, cy
        hw, hh = shape["hw"], shape["hh"]
        if shape["kind"] == "rect":
            if dx == 0:    t = hh / abs(dy)
            elif dy == 0:  t = hw / abs(dx)
            else:          t = min(hw / abs(dx), hh / abs(dy))
        elif shape["kind"] == "diamond":
            denom = abs(dx)/hw + abs(dy)/hh
            t = 1.0 / denom if denom else 0
        elif shape["kind"] == "ellipse":
            denom = math.sqrt((dx/hw)**2 + (dy/hh)**2)
            t = 1.0 / denom if denom else 0
        else:
            t = 0
        return cx + dx * t, cy + dy * t

    def connect(self, a, b, label=None, label_pos=0.5, label_dx=0.0, label_dy=0.0,
                lw=1.0, z=1):
        A, B = self.shapes[a], self.shapes[b]
        ax1, ay1 = self._edge_point(A, B["cx"], B["cy"])
        bx1, by1 = self._edge_point(B, A["cx"], A["cy"])
        self.ax.plot([ax1, bx1], [ay1, by1], color=LINE_COLOR, linewidth=lw, zorder=z)
        if label:
            mx = ax1 + (bx1 - ax1) * label_pos + label_dx
            my = ay1 + (by1 - ay1) * label_pos + label_dy
            self.ax.text(mx, my, label, ha='center', va='center',
                         fontsize=8, fontweight='bold', color=CARD_COLOR,
                         bbox=dict(facecolor='white', edgecolor='none', pad=0.7),
                         zorder=5)

    def attr(self, parent, name, cx, cy, label, is_key=False):
        self.attribute(name, cx, cy, label, is_key=is_key)
        self.connect(parent, name, lw=0.8, z=0)


# ═══════════════════════════════════════════════════════════════════════════
# MAIN E-R DIAGRAM
# ═══════════════════════════════════════════════════════════════════════════
def build_main():
    c = ERCanvas(figsize=(26, 16), xlim=(0, 28), ylim=(0, 18))

    # Entities ---------------------------------------------------------------
    c.strong_entity("User", 8.5, 10.0, w=2.6, h=1.1)

    c.strong_entity("Application",       2.0, 15.5)
    c.strong_entity("Warning",           2.0, 12.5)
    c.strong_entity("GraduationRequest", 2.0,  5.5, w=3.2)
    c.weak_entity  ("Complaint",         2.0,  2.5)

    c.weak_entity("Enrollment", 14.0, 13.0, w=2.3, h=1.0)
    c.weak_entity("Waitlist",   14.0, 10.0, w=2.3, h=1.0)
    c.weak_entity("Review",     14.0,  6.5, w=2.3, h=1.0)

    c.strong_entity("Course",   21.0, 10.0, w=2.6, h=1.1)
    c.strong_entity("Semester", 26.5, 12.5, w=2.3, h=1.0)
    c.weak_entity  ("HonorRoll",23.0, 15.5, w=2.4, h=1.0)
    c.strong_entity("TabooWord",24.0,  3.5, w=2.3, h=1.0)

    # Relationships ----------------------------------------------------------
    c.relationship("submits",  4.6, 15.5, w=1.3)
    c.relationship("receives", 4.6, 12.5, w=1.3)
    c.relationship("applies",  4.6,  5.5, w=1.3)
    c.relationship("filer",    4.6,  3.0, w=1.1, h=0.6)
    c.relationship("target",   4.6,  2.0, w=1.1, h=0.6)

    c.relationship("has",   10.7, 13.0, w=1.2, h=0.6, identifying=True)
    c.relationship("for_e", 17.3, 13.0, w=1.2, h=0.6, label="for", identifying=True)
    c.relationship("on",    10.7, 10.0, w=1.2, h=0.6, identifying=True)
    c.relationship("for_w", 17.3, 10.0, w=1.2, h=0.6, label="for", identifying=True)
    c.relationship("writes",10.7,  6.5, w=1.2, h=0.6, identifying=True)
    c.relationship("about", 17.3,  6.5, w=1.2, h=0.6, identifying=True)

    c.relationship("teaches", 14.0, 16.0, w=1.4, h=0.7)
    c.relationship("earned",  16.7, 15.5, w=1.3, h=0.7, identifying=True)
    c.relationship("in",      26.0, 15.2, w=1.1, h=0.7, identifying=True)
    c.relationship("contains",24.5, 11.5, w=1.5, h=0.7)
    c.relationship("moderates",19.0, 4.5, w=1.6, h=0.7)

    # Lines between entities & relationships --------------------------------
    c.connect("Application", "submits",  label="N")
    c.connect("submits",     "User",     label="1")
    c.connect("Warning",     "receives", label="N")
    c.connect("receives",    "User",     label="1")
    c.connect("GraduationRequest","applies", label="N")
    c.connect("applies",     "User",     label="1")
    c.connect("Complaint",   "filer",    label="N")
    c.connect("filer",       "User",     label="1")
    c.connect("Complaint",   "target",   label="N")
    c.connect("target",      "User",     label="1")

    c.connect("User", "has",          label="1")
    c.connect("has",  "Enrollment",   label="N")
    c.connect("Enrollment","for_e",   label="N")
    c.connect("for_e","Course",       label="1")

    c.connect("User",  "on",         label="1")
    c.connect("on",    "Waitlist",   label="N")
    c.connect("Waitlist","for_w",    label="N")
    c.connect("for_w", "Course",     label="1")

    c.connect("User",   "writes",    label="1")
    c.connect("writes", "Review",    label="N")
    c.connect("Review", "about",     label="N")
    c.connect("about",  "Course",    label="1")

    c.connect("User",    "teaches", label="1", label_dy=0.25)
    c.connect("teaches", "Course",  label="N", label_dy=0.25)

    c.connect("User",      "earned",    label="1")
    c.connect("earned",    "HonorRoll", label="N")
    c.connect("HonorRoll", "in",        label="N")
    c.connect("in",        "Semester",  label="1")

    c.connect("Course",   "contains", label="N")
    c.connect("contains", "Semester", label="1")

    c.connect("Review",    "moderates", label="M")
    c.connect("moderates", "TabooWord", label="N")

    # Attributes — every entity gets id (PK) + 1-3 key non-PK attributes ----
    c.attr("User", "User_id",       10.1, 8.6, "id",       is_key=True)
    c.attr("User", "User_role",      9.0, 8.3, "role")
    c.attr("User", "User_gpa",       8.0, 8.6, "gpa")
    c.attr("User", "User_warn",      6.9, 9.0, "warnings")

    c.attr("Course", "Course_id",   22.4, 8.6, "id",        is_key=True)
    c.attr("Course", "Course_code", 21.2, 8.3, "code")
    c.attr("Course", "Course_sched",20.0, 8.6, "schedule")
    c.attr("Course", "Course_canc", 19.0, 9.2, "cancelled")

    c.attr("Semester", "Sem_id",    27.5, 11.4, "id",        is_key=True)
    c.attr("Semester", "Sem_period",26.5, 11.0, "period")
    c.attr("Semester", "Sem_cur",   25.5, 11.4, "isCurrent")

    c.attr("Enrollment", "Enr_id",    12.9, 13.8, "id",    is_key=True)
    c.attr("Enrollment", "Enr_grade", 14.0, 14.3, "grade")
    c.attr("Enrollment", "Enr_stat",  15.1, 13.8, "status")

    c.attr("Waitlist", "Wait_id",  12.9, 10.7, "id",       is_key=True)
    c.attr("Waitlist", "Wait_pos", 15.1, 10.7, "position")
    c.attr("Waitlist", "Wait_st",  14.0, 10.8, "status")

    c.attr("Review", "Rev_id",     12.9, 5.8, "id",     is_key=True)
    c.attr("Review", "Rev_rate",   15.1, 5.8, "rating")
    c.attr("Review", "Rev_hidden", 14.0, 5.9, "hidden")

    c.attr("Complaint", "Comp_id",    3.3, 1.4, "id",     is_key=True)
    c.attr("Complaint", "Comp_stat",  0.7, 3.2, "status")
    c.attr("Complaint", "Comp_desc",  0.7, 2.0, "description")

    c.attr("Warning", "Warn_id",     0.7, 13.5, "id",    is_key=True)
    c.attr("Warning", "Warn_rea",    0.7, 11.7, "reason")
    c.attr("Warning", "Warn_rem",    3.3, 11.3, "removed")

    c.attr("Application", "App_id",    0.7, 16.3, "id",     is_key=True)
    c.attr("Application", "App_type",  0.7, 14.8, "type")
    c.attr("Application", "App_stat",  3.3, 14.5, "status")
    c.attr("Application", "App_gpa",   3.3, 16.5, "priorGpa")

    c.attr("GraduationRequest", "Grad_id",     0.7, 4.5, "id",     is_key=True)
    c.attr("GraduationRequest", "Grad_stat",   0.7, 6.5, "status")

    c.attr("TabooWord", "Taboo_id",   25.3, 2.5, "id",   is_key=True)
    c.attr("TabooWord", "Taboo_word", 22.7, 2.5, "word")

    c.attr("HonorRoll", "Hon_id",    21.4, 16.8, "id",           is_key=True)
    c.attr("HonorRoll", "Hon_type",  23.0, 16.8, "type")
    c.attr("HonorRoll", "Hon_used",  24.8, 16.5, "usedToRemove")

    # Legend (bottom-left of canvas) ----------------------------------------
    lx, ly = 0.5, 0.4
    c.ax.text(lx, ly + 1.85, "Legend", fontsize=10, fontweight='bold')

    c.ax.add_patch(Rectangle((lx, ly + 1.35), 0.7, 0.3,
                             linewidth=1.2, edgecolor=LINE_COLOR, facecolor=ENTITY_COLOR))
    c.ax.text(lx + 0.9, ly + 1.50, "strong entity", fontsize=8, va='center')

    c.ax.add_patch(Rectangle((lx, ly + 0.85), 0.7, 0.3,
                             linewidth=1.2, edgecolor=LINE_COLOR, facecolor=WEAK_COLOR))
    c.ax.add_patch(Rectangle((lx + 0.04, ly + 0.89), 0.62, 0.22,
                             linewidth=0.8, edgecolor=LINE_COLOR, facecolor=WEAK_COLOR))
    c.ax.text(lx + 0.9, ly + 1.00, "weak / associative entity", fontsize=8, va='center')

    dx0, dy0 = lx + 0.35, ly + 0.5
    c.ax.add_patch(Polygon([(dx0, dy0 + 0.20), (dx0 + 0.35, dy0),
                            (dx0, dy0 - 0.20), (dx0 - 0.35, dy0)],
                           linewidth=1.2, edgecolor=LINE_COLOR, facecolor=REL_COLOR))
    c.ax.text(lx + 0.9, ly + 0.5, "relationship (double = identifying)",
              fontsize=8, va='center')

    c.ax.add_patch(Ellipse((lx + 0.35, ly), 0.7, 0.28,
                           linewidth=1.0, edgecolor=LINE_COLOR, facecolor=ATTR_COLOR))
    c.ax.text(lx + 0.35, ly, "pk", fontsize=7, ha='center', va='center')
    c.ax.plot([lx + 0.28, lx + 0.42], [ly - 0.12, ly - 0.12],
              color=LINE_COLOR, linewidth=0.9)
    c.ax.text(lx + 0.9, ly, "attribute (underlined = primary key)",
              fontsize=8, va='center')

    # Title
    c.ax.text(14, 17.4, "CunyZeroLite — Entity-Relationship Diagram (Chen Notation)",
              ha='center', fontsize=15, fontweight='bold')

    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "er_diagram.png")
    plt.savefig(out, dpi=170, bbox_inches='tight', facecolor='white')
    plt.close(c.fig)
    print(f"Saved main ER diagram to {out}")


# ═══════════════════════════════════════════════════════════════════════════
# ISA (User specialization) SUB-DIAGRAM
# ═══════════════════════════════════════════════════════════════════════════
def build_isa():
    c = ERCanvas(figsize=(12, 6), xlim=(0, 14), ylim=(0, 7))

    # Supertype User (shown with "role" discriminator attribute)
    c.strong_entity("User", 7.0, 5.5, w=2.2, h=1.0)
    c.attr("User", "User_role", 4.8, 5.5, "role")

    # ISA triangle
    c.isa_triangle("ISA", 7.0, 3.8, w=1.3, h=0.9, label="ISA")
    c.connect("User", "ISA", lw=1.2)

    # Subtypes
    c.strong_entity("STUDENT",    2.5, 1.5, w=2.0, h=0.9)
    c.strong_entity("INSTRUCTOR", 5.6, 1.5, w=2.4, h=0.9)
    c.strong_entity("REGISTRAR",  8.8, 1.5, w=2.2, h=0.9)
    c.strong_entity("VISITOR",   11.8, 1.5, w=1.8, h=0.9)

    c.connect("ISA", "STUDENT",    lw=1.0)
    c.connect("ISA", "INSTRUCTOR", lw=1.0)
    c.connect("ISA", "REGISTRAR",  lw=1.0)
    c.connect("ISA", "VISITOR",    lw=1.0)

    c.ax.text(7.0, 0.5,
              "Disjoint, total specialization — User.role field acts as the discriminator.",
              ha='center', va='center', fontsize=9, style='italic', color="#555")

    c.ax.text(7.0, 6.6, "Figure 3.2 — User Specialization (ISA Hierarchy)",
              ha='center', fontsize=12, fontweight='bold')

    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "er_diagram_isa.png")
    plt.savefig(out, dpi=170, bbox_inches='tight', facecolor='white')
    plt.close(c.fig)
    print(f"Saved ISA sub-diagram to {out}")


if __name__ == "__main__":
    build_main()
    build_isa()
