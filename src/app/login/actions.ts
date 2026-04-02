"use server";

import { prisma } from "@/src/lib/db";
import { createSession, destroySession } from "@/src/lib/session";

export async function loginUser(email: string, password: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user || user.password !== password) {
      return { success: false, error: "Invalid email or password." };
    }

    if (user.terminated) {
      return { success: false, error: "Your account has been terminated." };
    }

    if (user.suspended) {
      return { success: false, error: "Your account is currently suspended." };
    }

    if (user.fired) {
      return { success: false, error: "Your account has been deactivated." };
    }

    await createSession(user.id);

    // Determine redirect path
    const redirect = user.mustChangePassword ? "/change-password" : "/dashboard";

    return {
      success: true,
      role: user.role,
      firstName: user.firstName,
      redirect,
    };
  } catch (error) {
    return { success: false, error: "Server error. Please try again." };
  }
}

export async function logoutUser() {
  await destroySession();
}
