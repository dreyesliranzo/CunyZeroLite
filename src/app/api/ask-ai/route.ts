import { NextResponse } from "next/server";
import { askAI } from "../../../lib/ai";
export async function POST(req: Request) {
  const body = await req.json();
  const result = await askAI(body.question || "");
  return NextResponse.json(result);
}