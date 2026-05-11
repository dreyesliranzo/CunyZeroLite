export const PERIODS = [
  "CLASS_SETUP",
  "REGISTRATION",
  "RUNNING",
  "GRADING",
  "COMPLETED",
] as const;
export type Period = (typeof PERIODS)[number];

export type ActionResult = { success: boolean; error?: string };
