// Parses course schedule strings like "MWF 10-11", "TTh 9-10:30",
// "MW 14:00-15:30". Returns null on unparseable input.

const DAY_TOKENS = ["M", "T", "W", "R", "F", "S", "U"] as const;
type Day = (typeof DAY_TOKENS)[number];

export type Slot = {
  day: Day;
  startMin: number;
  endMin: number;
};

function parseDays(raw: string): Day[] {
  const days: Day[] = [];
  let i = 0;
  while (i < raw.length) {
    // "Th" → R (Thursday). "Su" → U (Sunday).
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
      i += 1; // skip whitespace/garbage
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

// Two slots conflict if they share a day and overlap in time.
function slotsConflict(a: Slot, b: Slot): boolean {
  return a.day === b.day && a.startMin < b.endMin && b.startMin < a.endMin;
}

export function findConflict(
  candidate: string,
  others: { id: number; code: string; name: string; schedule: string }[],
): { id: number; code: string; name: string } | null {
  const candidateSlots = parseSchedule(candidate);
  if (!candidateSlots) return null; // unparseable → no conflict claimed
  for (const other of others) {
    const otherSlots = parseSchedule(other.schedule);
    if (!otherSlots) continue;
    for (const a of candidateSlots) {
      for (const b of otherSlots) {
        if (slotsConflict(a, b)) {
          return { id: other.id, code: other.code, name: other.name };
        }
      }
    }
  }
  return null;
}
