#!/usr/bin/env python3
"""Render all 20 UC sequence + collaboration diagrams as PNGs.

Eighteen are sequence diagrams (participant boxes with dashed lifelines,
solid arrows for call messages, dashed arrows for return messages,
curved self-loops for internal calls).

Two are collaboration diagrams (UC-11 and UC-15) drawn as node graphs
with numbered directed edges.

Outputs: docs/seq_ucN.png for N in 1..20
"""

import os
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, FancyArrowPatch, FancyBboxPatch, Circle

LINE_COLOR = "#1A1A1A"
PARTICIPANT_FACE = "#E8F0FE"
ACTOR_FACE = "#FFF4E5"
EXTERNAL_FACE = "#F3E5F5"
NOTE_FACE = "#FFFDE7"

_FIG_DPI = 170


# ═══════════════════════════════════════════════════════════════════════════
# SequenceCanvas
# ═══════════════════════════════════════════════════════════════════════════
class SequenceCanvas:
    # Deferred-draw canvas. We collect messages first, then draw once we know
    # how tall the diagram needs to be.
    def __init__(self, title, participants, approx_messages=0,
                 actors=None, externals=None):
        """
        participants: list of participant names (columns, left-to-right).
        actors: set of names that are human actors (drawn in ACTOR_FACE).
        externals: set of names that are external systems (EXTERNAL_FACE).
        approx_messages is retained for backward compat but ignored — the
        canvas auto-sizes at save() time based on actual collected messages.
        """
        self.title = title
        self.participants = participants
        self.col_x = {}
        self.actors = set(actors or [])
        self.externals = set(externals or [])

        # Deferred message list: each entry is a dict describing what to draw.
        self._events = []
        # Virtual y counter — decremented as events are added, used only to
        # position events relative to each other.  Actual y-coordinates are
        # assigned in save() once we know total height.
        self._rows = 0

        # Layout constants
        self.col_w = 4.2
        self.msg_step = 0.9

    # ─────────────────────────────────────────────────────────
    def _add(self, ev, rows=1):
        ev["row"] = self._rows
        self._events.append(ev)
        self._rows += rows

    # ─────────────────────────────────────────────────────────
    def msg(self, src, dst, label, kind='call'):
        if src == dst:
            self.self_msg(src, label)
            return
        self._add({"type": "msg", "src": src, "dst": dst,
                   "label": label, "kind": kind})

    def self_msg(self, participant, label):
        self._add({"type": "self", "who": participant, "label": label},
                  rows=1.1)

    def note(self, text, span=None):
        self._add({"type": "note", "text": text, "span": span})

    def branch(self, label):
        self._add({"type": "branch", "label": label}, rows=0.9)

    # ─────────────────────────────────────────────────────────
    def save(self, path):
        # Compute canvas dimensions based on collected events
        width = self.col_w * (len(self.participants) + 0.5)
        top_pad = 1.8
        bot_pad = 1.2
        height = top_pad + self.msg_step * self._rows + bot_pad + 1.2
        fig, ax = plt.subplots(figsize=(width * 0.8, height * 0.48))
        ax.set_xlim(0, width)
        ax.set_ylim(0, height)
        ax.set_aspect('auto')
        ax.axis('off')

        # Title at the very top
        ax.text(width / 2, height - 0.4, self.title,
                ha='center', va='top', fontsize=12, fontweight='bold')

        # Participant boxes + lifelines
        box_top_y = height - 1.1
        box_h = 0.6
        lifeline_bottom = bot_pad - 0.4
        for i, name in enumerate(self.participants):
            x = (i + 0.75) * self.col_w
            self.col_x[name] = x
            if name in self.actors:
                face = ACTOR_FACE
            elif name in self.externals:
                face = EXTERNAL_FACE
            else:
                face = PARTICIPANT_FACE
            ax.add_patch(Rectangle((x - 1.5, box_top_y - box_h), 3.0, box_h,
                                   linewidth=1.4, edgecolor=LINE_COLOR,
                                   facecolor=face, zorder=3))
            ax.text(x, box_top_y - box_h/2, name,
                    ha='center', va='center', fontsize=10,
                    fontweight='bold', zorder=4)
            ax.plot([x, x], [box_top_y - box_h, lifeline_bottom],
                    '--', color='gray', linewidth=0.9, zorder=1)

        # Draw each event at its computed y
        base_y = height - 2.3
        for ev in self._events:
            y = base_y - ev["row"] * self.msg_step

            if ev["type"] == "msg":
                x1 = self.col_x[ev["src"]]
                x2 = self.col_x[ev["dst"]]
                ls = '--' if ev["kind"] == "return" else '-'
                arrow = FancyArrowPatch((x1, y), (x2, y),
                                        arrowstyle="->,head_length=6,head_width=4",
                                        color=LINE_COLOR, linewidth=1.1,
                                        linestyle=ls, zorder=2)
                ax.add_patch(arrow)
                ax.text((x1 + x2) / 2, y + 0.14, ev["label"],
                        ha='center', va='bottom', fontsize=8.5, zorder=4,
                        bbox=dict(facecolor='white', edgecolor='none', pad=0.5))

            elif ev["type"] == "self":
                x = self.col_x[ev["who"]]
                ax.plot([x, x + 0.9], [y, y],
                        color=LINE_COLOR, linewidth=1.0, zorder=2)
                ax.plot([x + 0.9, x + 0.9], [y, y - 0.25],
                        color=LINE_COLOR, linewidth=1.0, zorder=2)
                arrow = FancyArrowPatch((x + 0.9, y - 0.25), (x, y - 0.25),
                                        arrowstyle="->,head_length=5,head_width=3",
                                        color=LINE_COLOR, linewidth=1.0, zorder=2)
                ax.add_patch(arrow)
                ax.text(x + 1.0, y + 0.08, ev["label"],
                        ha='left', va='bottom', fontsize=8, zorder=4,
                        bbox=dict(facecolor='white', edgecolor='none', pad=0.5))

            elif ev["type"] == "note":
                span = ev["span"] or self.participants
                xs = [self.col_x[p] for p in span]
                x_left = min(xs) - 1.5
                x_right = max(xs) + 1.5
                h = 0.55
                ax.add_patch(FancyBboxPatch((x_left, y - h/2),
                                            x_right - x_left, h,
                                            boxstyle="round,pad=0.02",
                                            linewidth=0.8,
                                            edgecolor="#B89000",
                                            facecolor=NOTE_FACE, zorder=3))
                ax.text((x_left + x_right) / 2, y, ev["text"],
                        ha='center', va='center', fontsize=8, style='italic',
                        zorder=4)

            elif ev["type"] == "branch":
                ax.text(width / 2, y, f"[{ev['label']}]",
                        ha='center', va='center', fontsize=8.5,
                        fontweight='bold', color="#4A0080", zorder=4,
                        bbox=dict(facecolor='#F3E5F5',
                                  edgecolor="#B56BD6", pad=2))

        plt.savefig(path, dpi=_FIG_DPI, bbox_inches='tight', facecolor='white')
        plt.close(fig)


# ═══════════════════════════════════════════════════════════════════════════
# CollaborationCanvas
# ═══════════════════════════════════════════════════════════════════════════
class CollaborationCanvas:
    def __init__(self, title, nodes, figsize=(12, 8)):
        """nodes: dict name -> (x, y), w (optional), kind (optional)."""
        self.nodes = nodes
        self.fig, self.ax = plt.subplots(figsize=figsize)
        xs = [v[0] for v in nodes.values()]
        ys = [v[1] for v in nodes.values()]
        self.ax.set_xlim(min(xs) - 2, max(xs) + 2)
        self.ax.set_ylim(min(ys) - 2, max(ys) + 2)
        self.ax.set_aspect('auto')
        self.ax.axis('off')
        self.ax.text((min(xs) + max(xs)) / 2, max(ys) + 1.5, title,
                     ha='center', va='center', fontsize=12, fontweight='bold')

        for name, (x, y) in nodes.items():
            w = 3.4 if len(name) > 12 else 2.5
            self.ax.add_patch(Rectangle((x - w/2, y - 0.4), w, 0.8,
                                        linewidth=1.4, edgecolor=LINE_COLOR,
                                        facecolor=PARTICIPANT_FACE, zorder=3))
            self.ax.text(x, y, name, ha='center', va='center',
                         fontsize=10, fontweight='bold', zorder=4)

    def edge(self, src, dst, label, curve=0.15):
        """Numbered arrow between two nodes."""
        x1, y1 = self.nodes[src]
        x2, y2 = self.nodes[dst]
        if src == dst:
            # self edge: small loop above the box
            arrow = FancyArrowPatch((x1 - 0.6, y1 + 0.5), (x1 + 0.6, y1 + 0.5),
                                    arrowstyle="->,head_length=5,head_width=3",
                                    connectionstyle="arc3,rad=-1.0",
                                    color=LINE_COLOR, linewidth=1.0, zorder=2)
            self.ax.add_patch(arrow)
            self.ax.text(x1, y1 + 1.2, label,
                         ha='center', va='center', fontsize=8.5,
                         bbox=dict(facecolor='white', edgecolor='none', pad=0.5))
            return
        # clip from edges of boxes to avoid piercing
        dx, dy = x2 - x1, y2 - y1
        norm = (dx ** 2 + dy ** 2) ** 0.5
        ux, uy = dx / norm, dy / norm
        # shorten by ~0.5 on each end
        s = 1.4
        p1 = (x1 + ux * s, y1 + uy * s * 0.45)
        p2 = (x2 - ux * s, y2 - uy * s * 0.45)
        arrow = FancyArrowPatch(p1, p2,
                                arrowstyle="->,head_length=6,head_width=4",
                                connectionstyle=f"arc3,rad={curve}",
                                color=LINE_COLOR, linewidth=1.0, zorder=2)
        self.ax.add_patch(arrow)
        mx = (p1[0] + p2[0]) / 2 + curve * (p2[1] - p1[1]) * 0.3
        my = (p1[1] + p2[1]) / 2 + curve * -(p2[0] - p1[0]) * 0.3
        self.ax.text(mx, my, label, ha='center', va='center', fontsize=8.5,
                     bbox=dict(facecolor='white', edgecolor='none', pad=0.5),
                     zorder=4)

    def save(self, path):
        plt.savefig(path, dpi=_FIG_DPI, bbox_inches='tight', facecolor='white')
        plt.close(self.fig)


# ═══════════════════════════════════════════════════════════════════════════
# SEQUENCE DIAGRAMS — UC-1 through UC-20 (except UC-11, UC-15 which are collabs)
# ═══════════════════════════════════════════════════════════════════════════
OUT = os.path.dirname(os.path.abspath(__file__))


def _save(s, uc_id):
    s.save(os.path.join(OUT, f"seq_{uc_id}.png"))
    print(f"Saved seq_{uc_id}.png")


def build_uc1():
    s = SequenceCanvas(
        "UC-1 — View Public Homepage (Sequence Diagram)",
        ["Visitor", "Browser", "Server", "Database"], 7,
        actors={"Visitor"})
    s.msg("Visitor", "Browser", "open URL")
    s.msg("Browser", "Server", "GET /")
    s.msg("Server", "Database", "query top + bottom rated courses")
    s.msg("Database", "Server", "course list", kind="return")
    s.msg("Server", "Database", "query top-GPA students")
    s.msg("Database", "Server", "student list", kind="return")
    s.msg("Server", "Browser", "HTML page", kind="return")
    s.msg("Browser", "Visitor", "display", kind="return")
    _save(s, "uc1")


def build_uc2():
    s = SequenceCanvas(
        "UC-2 — Apply as Student or Instructor (Sequence Diagram)",
        ["Visitor", "Browser", "Server", "Database"], 8,
        actors={"Visitor"})
    s.msg("Visitor", "Browser", "fill + submit form")
    s.msg("Browser", "Server", "POST /api/apply")
    s.self_msg("Server", "validate fields")
    s.msg("Server", "Database", "check duplicate pending app")
    s.msg("Database", "Server", "no duplicate", kind="return")
    s.msg("Server", "Database", "INSERT Application (status=PENDING)")
    s.msg("Database", "Server", "OK", kind="return")
    s.msg("Server", "Browser", "200 confirm", kind="return")
    s.msg("Browser", "Visitor", "show message", kind="return")
    _save(s, "uc2")


def build_uc3():
    s = SequenceCanvas(
        "UC-3 — Approve / Reject Applications (Sequence Diagram)",
        ["Registrar", "Browser", "Server", "Database"], 11,
        actors={"Registrar"})
    s.msg("Registrar", "Browser", "open applications page")
    s.msg("Browser", "Server", "GET /apps")
    s.msg("Server", "Database", "WHERE status = PENDING")
    s.msg("Database", "Server", "app list", kind="return")
    s.self_msg("Server", "auto-flag GPA > 3.0")
    s.msg("Server", "Browser", "render list", kind="return")
    s.branch("Approve")
    s.msg("Registrar", "Browser", "click Approve")
    s.msg("Browser", "Server", "POST /apps/:id (accept)")
    s.self_msg("Server", "generate email + temp password")
    s.msg("Server", "Database", "UPDATE user + UPDATE app status=ACCEPTED")
    s.msg("Database", "Server", "OK", kind="return")
    s.msg("Server", "Browser", "accepted", kind="return")
    _save(s, "uc3")


def build_uc4():
    s = SequenceCanvas(
        "UC-4 — Manage Semester Periods (Sequence Diagram)",
        ["Registrar", "Browser", "Server", "Database"], 10,
        actors={"Registrar"})
    s.msg("Registrar", "Browser", "open Semester Management")
    s.msg("Browser", "Server", "GET /sem")
    s.msg("Server", "Database", "findFirst(isCurrent=true)")
    s.msg("Database", "Server", "current semester", kind="return")
    s.msg("Server", "Browser", "render", kind="return")
    s.msg("Registrar", "Browser", "click Advance Period")
    s.msg("Browser", "Server", "POST /sem/advance")
    s.self_msg("Server", "compute next period")
    s.msg("Server", "Database", "UPDATE semester.period")
    s.branch("IF RUNNING")
    s.self_msg("Server", "call enforceRunningRules() (UC-17)")
    s.branch("IF COMPLETED")
    s.self_msg("Server", "call evaluateAcademicStanding()")
    s.msg("Server", "Browser", "new period", kind="return")
    _save(s, "uc4")


def build_uc5():
    s = SequenceCanvas(
        "UC-5 — Set Up Courses (Sequence Diagram)",
        ["Registrar", "Browser", "Server", "Database"], 8,
        actors={"Registrar"})
    s.msg("Registrar", "Browser", "open Course Management + fill form")
    s.msg("Browser", "Server", "POST /courses")
    s.msg("Server", "Database", "verify semester.period = CLASS_SETUP")
    s.msg("Database", "Server", "ok", kind="return")
    s.msg("Server", "Database", "check unique(code, semesterId)")
    s.msg("Database", "Server", "no duplicate", kind="return")
    s.msg("Server", "Database", "INSERT Course")
    s.msg("Database", "Server", "created", kind="return")
    s.msg("Server", "Browser", "201", kind="return")
    _save(s, "uc5")


def build_uc6():
    s = SequenceCanvas(
        "UC-6 — Register for Courses (Sequence Diagram)",
        ["Student", "Browser", "Server", "Database"], 11,
        actors={"Student"})
    s.msg("Student", "Browser", "select course")
    s.msg("Browser", "Server", "POST /register")
    s.self_msg("Server", "getSession()")
    s.msg("Server", "Database", "check suspended/terminated")
    s.msg("Database", "Server", "status ok", kind="return")
    s.msg("Server", "Database", "check time conflict, capacity")
    s.msg("Database", "Server", "spots available", kind="return")
    s.branch("capacity > 0")
    s.msg("Server", "Database", "INSERT Enrollment (status=ENROLLED)")
    s.branch("else — full")
    s.msg("Server", "Database", "INSERT Waitlist (next position)")
    s.msg("Database", "Server", "OK", kind="return")
    s.msg("Server", "Browser", "success", kind="return")
    _save(s, "uc6")


def build_uc7():
    s = SequenceCanvas(
        "UC-7 — Manage Waitlist (Sequence Diagram)",
        ["Instructor", "Browser", "Server", "Database"], 10,
        actors={"Instructor"})
    s.msg("Instructor", "Browser", "open course page")
    s.msg("Browser", "Server", "GET /waitlist")
    s.msg("Server", "Database", "findMany ORDER BY position")
    s.msg("Database", "Server", "waitlist", kind="return")
    s.msg("Server", "Browser", "render", kind="return")
    s.msg("Instructor", "Browser", "click Admit")
    s.msg("Browser", "Server", "POST /admit")
    s.msg("Server", "Database", "check student eligible (not suspended)")
    s.msg("Database", "Server", "ok", kind="return")
    s.msg("Server", "Database", "UPDATE waitlist.status = ADMITTED")
    s.msg("Server", "Database", "INSERT Enrollment")
    s.msg("Server", "Database", "reorder remaining positions")
    s.msg("Server", "Browser", "success", kind="return")
    _save(s, "uc7")


def build_uc8():
    s = SequenceCanvas(
        "UC-8 — Write and Rate Course Reviews (Sequence Diagram)",
        ["Student", "Browser", "Server", "Database"], 13,
        actors={"Student"})
    s.msg("Student", "Browser", "select course + rating + comment")
    s.msg("Browser", "Server", "POST /reviews")
    s.msg("Server", "Database", "verify enrolled + grade is null")
    s.msg("Database", "Server", "ok", kind="return")
    s.msg("Server", "Database", "check no duplicate review")
    s.msg("Server", "Database", "findMany TabooWord")
    s.msg("Database", "Server", "words list", kind="return")
    s.self_msg("Server", "count taboo matches")
    s.branch("0 matches")
    s.self_msg("Server", "publish as-is")
    s.branch("1-2 matches")
    s.self_msg("Server", "asterisk filter + 1 Warning")
    s.branch("3+ matches")
    s.self_msg("Server", "hide + 2 Warnings")
    s.msg("Server", "Database", "INSERT Review")
    s.branch("IF avg rating < 2.0")
    s.msg("Server", "Database", "INSERT Warning for instructor")
    s.msg("Server", "Browser", "saved", kind="return")
    _save(s, "uc8")


def build_uc9():
    s = SequenceCanvas(
        "UC-9 — Assign Grades (Sequence Diagram)",
        ["Instructor", "Browser", "Server", "Database"], 10,
        actors={"Instructor"})
    s.msg("Instructor", "Browser", "enter grades for all students")
    s.msg("Browser", "Server", "POST /grades")
    s.self_msg("Server", "getSession()")
    s.self_msg("Server", "validate all graded + period=GRADING")
    s.msg("Server", "Database", "UPDATE Enrollment.grade (batch)")
    s.msg("Database", "Server", "OK", kind="return")
    s.self_msg("Server", "recalc GPA + honor roll + termination")
    s.msg("Server", "Database", "UPDATE User.gpa, Warning, HonorRoll, terminated")
    s.msg("Database", "Server", "done", kind="return")
    s.msg("Server", "Browser", "success", kind="return")
    _save(s, "uc9")


def build_uc10():
    s = SequenceCanvas(
        "UC-10 — File Complaint (Sequence Diagram)",
        ["Filer", "Browser", "Server", "Database"], 9,
        actors={"Filer"})
    s.msg("Filer", "Browser", "select target + description")
    s.msg("Browser", "Server", "POST /complaint")
    s.self_msg("Server", "getSession()")
    s.self_msg("Server", "validate filer != target, description not empty")
    s.msg("Server", "Database", "INSERT Complaint (status=PENDING)")
    s.msg("Database", "Server", "OK", kind="return")
    s.msg("Server", "Browser", "201 confirmed", kind="return")
    s.note("<<include>> UC-11: Registrar resolves this complaint asynchronously.",
           span=["Server", "Database"])
    _save(s, "uc10")


def build_uc11_collab():
    c = CollaborationCanvas(
        "UC-11 — Process Complaints (Collaboration Diagram)",
        nodes={
            "Browser":             (1,  6),
            "ComplaintController": (8,  6),
            "SessionManager":      (14, 8.5),
            "WarningService":      (14, 3.5),
            "Database":            (8,  1),
        },
        figsize=(14, 9))
    c.edge("Browser", "ComplaintController", "1: open complaints")
    c.edge("ComplaintController", "SessionManager", "2: getSession()")
    c.edge("SessionManager", "ComplaintController", "3: verify REGISTRAR",
           curve=-0.2)
    c.edge("ComplaintController", "Database",
           "4: fetch PENDING complaints")
    c.edge("Database", "ComplaintController", "5: list", curve=-0.2)
    c.edge("ComplaintController", "Browser", "6: display list", curve=-0.2)
    c.edge("Browser", "ComplaintController",
           "7: select action (warn / deregister / dismiss)", curve=0.2)
    c.edge("ComplaintController", "WarningService",
           "8: IF WARN: issue warning")
    c.edge("WarningService", "Database",
           "9: INSERT Warning, user.warnings += 1", curve=0.2)
    c.edge("ComplaintController", "Database",
           "10: UPDATE complaint.status = RESOLVED", curve=-0.2)
    c.edge("ComplaintController", "Database",
           "11: IF warnings >= 3: UPDATE suspended, fineOwed += 100", curve=0.3)
    c.edge("ComplaintController", "Browser", "12: confirmation", curve=-0.3)
    c.save(os.path.join(OUT, "seq_uc11.png"))
    print("Saved seq_uc11.png")


def build_uc12():
    s = SequenceCanvas(
        "UC-12 — Apply for Graduation (Sequence Diagram)",
        ["Student", "Browser", "Server", "Database"], 9,
        actors={"Student"})
    s.msg("Student", "Browser", "open Graduation page")
    s.msg("Browser", "Server", "POST /grad")
    s.self_msg("Server", "getSession()")
    s.msg("Server", "Database",
          "COUNT enrollments WHERE grade IN (A,B,C,D)")
    s.msg("Database", "Server", "n completed passing courses", kind="return")
    s.self_msg("Server", "isReckless = (n < 8)")
    s.msg("Server", "Database",
          "INSERT GraduationRequest (status=PENDING)")
    s.msg("Database", "Server", "OK", kind="return")
    s.msg("Server", "Browser", "result + reckless flag", kind="return")
    _save(s, "uc12")


def build_uc13():
    s = SequenceCanvas(
        "UC-13 — Approve / Reject Graduation (Sequence Diagram)",
        ["Registrar", "Browser", "Server", "Database"], 11,
        actors={"Registrar"})
    s.msg("Registrar", "Browser", "open Graduation Requests")
    s.msg("Browser", "Server", "GET /grad")
    s.msg("Server", "Database",
          "PENDING requests JOIN user history")
    s.msg("Database", "Server", "list", kind="return")
    s.msg("Server", "Browser", "render", kind="return")
    s.msg("Registrar", "Browser", "decide approve / reject")
    s.msg("Browser", "Server", "POST /grad/:id")
    s.branch("APPROVE")
    s.msg("Server", "Database",
          "verify 8 passing + no fines/suspension → SET graduated=true")
    s.branch("REJECT + reckless")
    s.msg("Server", "Database", "INSERT Warning (reckless application)")
    s.msg("Server", "Database", "UPDATE request.status")
    s.msg("Server", "Browser", "success", kind="return")
    _save(s, "uc13")


def build_uc14():
    s = SequenceCanvas(
        "UC-14 — Ask AI Assistant (Lite) (Sequence Diagram)",
        ["User", "Browser", "Server", "policy.json", "OpenAI"], 10,
        actors={"User"},
        externals={"policy.json", "OpenAI"})
    s.msg("User", "Browser", "type question")
    s.msg("Browser", "Server", "POST /api/chat")
    s.self_msg("Server", "tokenize + load policies")
    s.msg("Server", "policy.json", "read policy file")
    s.msg("policy.json", "Server", "policies list", kind="return")
    s.self_msg("Server", "keyword score matches")
    s.branch("any match")
    s.self_msg("Server", "build grounded prompt")
    s.branch("no match")
    s.self_msg("Server", "use raw question")
    s.msg("Server", "OpenAI", "chat.completions (gpt-4o-mini)")
    s.msg("OpenAI", "Server", "answer text", kind="return")
    s.msg("Server", "Browser",
          "answer + source tag (grounded / hallucination)", kind="return")
    _save(s, "uc14")


def build_uc15_collab():
    c = CollaborationCanvas(
        "UC-15 — View Role-Based Dashboard (Collaboration Diagram)",
        nodes={
            "Browser":             (1,   5),
            "DashboardController": (7.5, 5),
            "SessionManager":      (14,  8),
            "RoleDashboard":       (14,  5),
            "Database":            (14,  2),
        },
        figsize=(14, 9))
    c.edge("Browser", "DashboardController", "1: request dashboard")
    c.edge("DashboardController", "SessionManager", "2: getSession()")
    c.edge("SessionManager", "DashboardController",
           "3: read session cookie", curve=-0.2)
    c.edge("DashboardController", "DashboardController",
           "4: determine role")
    c.edge("DashboardController", "RoleDashboard",
           "5: redirect to role-specific dashboard")
    c.edge("RoleDashboard", "Database",
           "6: query user, enrollments, warnings, courses")
    c.edge("Database", "RoleDashboard", "7: return data", curve=-0.2)
    c.edge("RoleDashboard", "Browser",
           "8: render HTML", curve=0.4)
    c.save(os.path.join(OUT, "seq_uc15.png"))
    print("Saved seq_uc15.png")


def build_uc16():
    s = SequenceCanvas(
        "UC-16 — Manage Taboo Words (Sequence Diagram)",
        ["Registrar", "Browser", "Server", "Database"], 11,
        actors={"Registrar"})
    s.msg("Registrar", "Browser", "open Taboo Words page")
    s.msg("Browser", "Server", "GET /taboo")
    s.msg("Server", "Database", "findMany TabooWord")
    s.msg("Database", "Server", "list", kind="return")
    s.msg("Server", "Browser", "render", kind="return")
    s.msg("Registrar", "Browser", "add word")
    s.msg("Browser", "Server", "POST /taboo")
    s.msg("Server", "Database", "check unique → INSERT")
    s.msg("Database", "Server", "created", kind="return")
    s.msg("Registrar", "Browser", "remove word")
    s.msg("Browser", "Server", "DELETE /taboo/:id")
    s.msg("Server", "Database", "DELETE")
    s.msg("Database", "Server", "OK", kind="return")
    _save(s, "uc16")


def build_uc17():
    s = SequenceCanvas(
        "UC-17 — Enforce Running-Period Rules (Sequence Diagram)",
        ["UC-4 Trigger", "System Batch", "Database"], 11,
        externals={"UC-4 Trigger"})
    s.msg("UC-4 Trigger", "System Batch", "advance → RUNNING")
    s.msg("System Batch", "Database", "findMany active students")
    s.msg("Database", "System Batch", "students", kind="return")
    s.branch("for each student with 0 < enrollments < 2")
    s.msg("System Batch", "Database",
          "INSERT Warning, user.warnings += 1")
    s.msg("System Batch", "Database",
          "findMany active courses")
    s.msg("Database", "System Batch", "courses", kind="return")
    s.branch("for each course with enrollments < 3")
    s.msg("System Batch", "Database",
          "UPDATE course.cancelled = true")
    s.msg("System Batch", "Database",
          "INSERT Warning for instructor")
    s.msg("System Batch", "Database",
          "DELETE affected Enrollments (special reg)")
    s.branch("for each instructor whose courses are all cancelled")
    s.msg("System Batch", "Database",
          "UPDATE instructor.suspended = true")
    s.msg("System Batch", "UC-4 Trigger", "return control", kind="return")
    _save(s, "uc17")


def build_uc18():
    s = SequenceCanvas(
        "UC-18 — Drop / Withdraw from Course (Sequence Diagram)",
        ["Student", "Browser", "Server", "Database"], 11,
        actors={"Student"})
    s.msg("Student", "Browser", "click Drop or Withdraw")
    s.msg("Browser", "Server", "POST /drop or /withdraw")
    s.self_msg("Server", "check date within drop window (first 2 weeks)")
    s.branch("Drop — within window")
    s.msg("Server", "Database", "DELETE Enrollment")
    s.msg("Server", "Database", "auto-promote first waitlisted student")
    s.branch("Withdraw — after window")
    s.msg("Server", "Database", "UPDATE status=WITHDRAWN, grade='W'")
    s.self_msg("Server", "check if below min course load (< 2)")
    s.branch("IF below min")
    s.msg("Server", "Database", "INSERT Warning")
    s.msg("Database", "Server", "OK", kind="return")
    s.msg("Server", "Browser", "success", kind="return")
    _save(s, "uc18")


def build_uc19():
    s = SequenceCanvas(
        "UC-19 — View and Pay Fine (Sequence Diagram)",
        ["Student", "Browser", "Server", "Database"], 10,
        actors={"Student"})
    s.msg("Student", "Browser", "open financial page")
    s.msg("Browser", "Server", "GET /fine")
    s.msg("Server", "Database", "read fineOwed")
    s.msg("Database", "Server", "balance", kind="return")
    s.msg("Server", "Browser", "render balance + form", kind="return")
    s.msg("Student", "Browser", "submit payment amount")
    s.msg("Browser", "Server", "POST /fine/pay")
    s.self_msg("Server", "validate amount <= fineOwed")
    s.msg("Server", "Database", "UPDATE fineOwed -= amount")
    s.branch("IF fineOwed reaches 0")
    s.self_msg("Server", "lift financial hold")
    s.msg("Server", "Browser", "new balance + status", kind="return")
    _save(s, "uc19")


def build_uc20():
    s = SequenceCanvas(
        "UC-20 — Schedule Builder (Sequence Diagram)",
        ["Student", "Browser", "Server", "Database"], 12,
        actors={"Student"})
    s.msg("Student", "Browser", "open /schedule_builder")
    s.msg("Browser", "Server", "GET /schedule_builder")
    s.msg("Server", "Database",
          "fetch all current-semester courses + schedules")
    s.msg("Database", "Server", "course list", kind="return")
    s.msg("Server", "Browser", "render weekly grid", kind="return")
    s.msg("Student", "Browser", "add courses to draft")
    s.self_msg("Browser", "parse schedules + detect conflicts (client-side)")
    s.msg("Browser", "Student", "highlight conflicts", kind="return")
    s.msg("Student", "Browser", "confirm selection")
    s.msg("Browser", "Server", "POST /register (per course)")
    s.msg("Server", "Database", "INSERT Enrollment each (UC-6 logic)")
    s.msg("Database", "Server", "results", kind="return")
    s.msg("Server", "Browser", "summary", kind="return")
    _save(s, "uc20")


# ═══════════════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    build_uc1();  build_uc2();  build_uc3();  build_uc4();  build_uc5()
    build_uc6();  build_uc7();  build_uc8();  build_uc9();  build_uc10()
    build_uc11_collab(); build_uc12(); build_uc13(); build_uc14()
    build_uc15_collab()
    build_uc16(); build_uc17(); build_uc18(); build_uc19(); build_uc20()
    print("All 20 sequence/collaboration diagrams saved.")
