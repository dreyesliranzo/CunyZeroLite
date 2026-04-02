"use server";

import { cookies } from "next/headers";
import { prisma } from "./db";

export type SessionData = {
  userId: number;
  role: string;
  firstName: string;
  lastName: string;
  email: string;
};

export async function createSession(userId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  const session: SessionData = {
    userId: user.id,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  };

  const cookieStore = await cookies();
  cookieStore.set("session", JSON.stringify(session), {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 1 day
  });

  return session;
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get("session")?.value;
  if (!raw) return null;

  try {
    return JSON.parse(raw) as SessionData;
  } catch {
    return null;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}
