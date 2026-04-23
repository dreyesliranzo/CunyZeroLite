import { destroySession } from "@/src/lib/session";
import { NextResponse } from "next/server";

export async function POST() {
  await destroySession();
  return NextResponse.json({ success: true });
}
