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
      const msg = user.fineOwed > 0
        ? `Your account is currently suspended. Please pay your $${user.fineOwed.toFixed(2)} fine at the Bursar's Office to be reinstated by the registrar.`
        : "Your account is currently suspended. Please contact the registrar to be reinstated.";
      return { success: false, error: msg };
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
