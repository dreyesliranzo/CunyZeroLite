import { NextResponse } from "next/server";
import { getAIResponse } from "../../../lib/ai";

export async function POST(req: Request) {
  const body = await req.json();
  const result = await getAIResponse(body.question || "", "portal");
  return NextResponse.json({ reply: result });
}
