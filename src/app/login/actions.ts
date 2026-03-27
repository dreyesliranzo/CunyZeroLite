"use server";

import { prisma } from "@/src/lib/db";

export async function loginUser(email: string, password: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user || user.password !== password) {
      return { success: false, error: "Invalid credentials.", role: undefined };
    }

    return { 
      success: true, 
      role: user.role, 
      firstName: user.firstName 
    };
  } catch (error) {
    return { success: false, error: "Server error.", role: undefined };
  }
}