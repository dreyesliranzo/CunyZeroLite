import { NextRequest, NextResponse } from "next/server";
import { getAIResponse } from "@/src/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const { message, chatType } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const type = chatType === "portal" ? "portal" : "home";
    const reply = await getAIResponse(message.trim(), type);

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to get a response. Please try again." },
      { status: 500 }
    );
  }
}
