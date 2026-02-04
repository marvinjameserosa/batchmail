/**
 * Shared authentication constants and utilities
 * Used by both proxy.ts and server actions
 */

// Cookie name for authentication
export const AUTH_COOKIE = "batchmail_auth";

// Cookie configuration
export const AUTH_COOKIE_OPTIONS = {
  path: "/",
  sameSite: "lax" as const,
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

// Get admin credentials from environment
export function getAdminCredentials() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  return { email, password };
}

// Validate credentials against admin env vars
export function validateCredentials(email: string, password: string): boolean {
  const admin = getAdminCredentials();
  
  if (!admin.email || !admin.password) {
    console.error("[auth] ADMIN_EMAIL or ADMIN_PASSWORD not configured");
    return false;
  }
  
  const emailNorm = email.trim().toLowerCase();
  return emailNorm === admin.email && password === admin.password;
}

// Simple token generation (in production, use JWT or similar)
export function generateAuthToken(email: string): string {
  const timestamp = Date.now();
  const payload = `${email}:${timestamp}`;
  // Base64 encode for simple token
  return Buffer.from(payload).toString("base64");
}

// Validate auth token format
export function isValidToken(token: string | undefined): boolean {
  if (!token) return false;
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [email, timestamp] = decoded.split(":");
    if (!email || !timestamp) return false;
    // Check token is not older than 7 days
    const tokenAge = Date.now() - parseInt(timestamp, 10);
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
    return tokenAge < maxAge;
  } catch {
    return false;
  }
}
