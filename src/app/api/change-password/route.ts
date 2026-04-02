import { getSession, createSession } from "@/src/lib/session";
import { prisma } from "@/src/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Not authenticated." }, { status: 401 });
  }

  const { newPassword } = await req.json();
  if (!newPassword || newPassword.length < 6) {
    return NextResponse.json({ success: false, error: "Password must be at least 6 characters." });
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: { password: newPassword, mustChangePassword: false },
  });

  // Refresh session
  await createSession(session.userId);

  return NextResponse.json({ success: true, redirect: "/dashboard" });
}
