"use server";

import { cookies } from "next/headers";
import {
  AUTH_COOKIE,
  AUTH_COOKIE_OPTIONS,
  validateCredentials,
  generateAuthToken,
  isValidToken,
} from "@/lib/auth";

type LoginResult =
  | { success: true }
  | { success: false; error: string };

type AuthCheckResult =
  | { authenticated: true; email: string }
  | { authenticated: false };

/**
 * Server action to authenticate user
 * Uses ADMIN_EMAIL and ADMIN_PASSWORD from environment
 */
export async function loginAction(
  email: string,
  password: string
): Promise<LoginResult> {
  if (!email || !password) {
    return { success: false, error: "Email and password are required" };
  }

  const isValid = validateCredentials(email, password);

  if (!isValid) {
    return { success: false, error: "Invalid email or password" };
  }

  const token = generateAuthToken(email);
  const cookieStore = await cookies();

  cookieStore.set(AUTH_COOKIE, token, {
    ...AUTH_COOKIE_OPTIONS,
    secure: process.env.NODE_ENV === "production",
  });

  return { success: true };
}

/**
 * Server action to log out user
 */
export async function logoutAction(): Promise<{ success: true }> {
  const cookieStore = await cookies();

  cookieStore.set(AUTH_COOKIE, "", {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: 0,
  });

  return { success: true };
}

/**
 * Server action to check if user is authenticated
 */
export async function checkAuthAction(): Promise<AuthCheckResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;

  if (!token || !isValidToken(token)) {
    return { authenticated: false };
  }

  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [email] = decoded.split(":");
    return { authenticated: true, email };
  } catch {
    return { authenticated: false };
  }
}
