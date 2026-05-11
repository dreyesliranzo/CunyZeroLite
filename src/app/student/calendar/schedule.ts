// Lightweight schedule parser. Same shape used by /student/register; kept
// local to /calendar so this branch can land independently.

const DAY_TOKENS = ["M", "T", "W", "R", "F", "S", "U"] as const;
type Day = (typeof DAY_TOKENS)[number];

export const DAY_ORDER: Day[] = ["M", "T", "W", "R", "F"];
export const DAY_LABEL: Record<Day, string> = {
  M: "Mon",
  T: "Tue",
  W: "Wed",
  R: "Thu",
  F: "Fri",
  S: "Sat",
  U: "Sun",
};

export type Slot = {
  day: Day;
  startMin: number;
  endMin: number;
};

function parseDays(raw: string): Day[] {
  const days: Day[] = [];
  let i = 0;
  while (i < raw.length) {
    if (raw[i] === "T" && raw[i + 1] === "h") {
      days.push("R");
      i += 2;
    } else if (raw[i] === "S" && raw[i + 1] === "u") {
      days.push("U");
      i += 2;
    } else if ((DAY_TOKENS as readonly string[]).includes(raw[i])) {
      days.push(raw[i] as Day);
      i += 1;
    } else {
      i += 1;
    }
  }
  return days;
}

function parseTimeToMin(raw: string): number | null {
  const trimmed = raw.trim();
  const match = trimmed.match(/^(\d{1,2})(?::(\d{2}))?$/);
  if (!match) return null;
  const h = Number(match[1]);
  const m = match[2] ? Number(match[2]) : 0;
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

export function parseSchedule(raw: string): Slot[] | null {
  const cleaned = raw.trim();
  if (!cleaned) return null;
  const parts = cleaned.split(/\s+/);
  if (parts.length < 2) return null;
  const days = parseDays(parts[0]);
  if (days.length === 0) return null;
  const timeMatch = parts[1].match(/^(\d{1,2}(?::\d{2})?)-(\d{1,2}(?::\d{2})?)$/);
  if (!timeMatch) return null;
  const startMin = parseTimeToMin(timeMatch[1]);
  const endMin = parseTimeToMin(timeMatch[2]);
  if (startMin === null || endMin === null || endMin <= startMin) return null;
  return days.map((day) => ({ day, startMin, endMin }));
}

export function formatHM(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const suffix = h >= 12 ? "PM" : "AM";
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display}:${m.toString().padStart(2, "0")} ${suffix}`;
}
