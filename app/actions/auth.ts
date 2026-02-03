"use server";

import crypto from "crypto";
import { cookies } from "next/headers";
import {
  AUTH_COOKIE,
  AUTH_COOKIE_BASE,
  AUTH_MAX_AGE_SECONDS,
  isSecureCookie,
} from "@/lib/auth";

type LoginBody = { email?: string; password?: string };

type LoginResult =
  | { ok: true }
  | { ok: false; error: string; missing?: string[] };

export async function loginAction(body: LoginBody): Promise<LoginResult> {
  const { email, password } = body || {};
  const ADMIN_EMAIL_RAW = process.env.ADMIN_EMAIL;
  const ADMIN_PASSWORD_RAW = process.env.ADMIN_PASSWORD;
  const ADMIN_EMAIL = ADMIN_EMAIL_RAW?.trim();
  const ADMIN_PASSWORD = ADMIN_PASSWORD_RAW?.trim();

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    const missing = [
      !ADMIN_EMAIL ? "ADMIN_EMAIL" : null,
      !ADMIN_PASSWORD ? "ADMIN_PASSWORD" : null,
    ].filter(Boolean) as string[];
    return {
      ok: false,
      error: "Admin credentials not configured",
      missing,
    };
  }

  if (!email || !password) {
    return { ok: false, error: "Missing email or password" };
  }

  const emailNorm = String(email).trim().toLowerCase();
  const adminEmailNorm = String(ADMIN_EMAIL).trim().toLowerCase();
  const passNorm = String(password).trim();

  if (emailNorm !== adminEmailNorm || passNorm !== ADMIN_PASSWORD) {
    return { ok: false, error: "Invalid credentials" };
  }

  const token = crypto.randomBytes(32).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, token, {
    ...AUTH_COOKIE_BASE,
    httpOnly: true,
    secure: isSecureCookie(),
    maxAge: AUTH_MAX_AGE_SECONDS,
  });

  return { ok: true };
}

export async function logoutAction(): Promise<{ ok: true }> {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, "", {
    ...AUTH_COOKIE_BASE,
    httpOnly: true,
    secure: isSecureCookie(),
    maxAge: 0,
  });
  return { ok: true };
}
