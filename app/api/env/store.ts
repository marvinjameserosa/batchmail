// Simple in-memory store for uploaded env overrides.
// NOTE: In production you should persist securely and encrypt secrets.

export type SenderEnv = {
  SENDER_EMAIL?: string;
  SENDER_APP_PASSWORD?: string;
  SENDER_NAME?: string;
  HOST_DOMAIN?: string;
  PORT?: string;
};

// In-memory multi-profile store
let profiles: Record<string, SenderEnv> = {};
let activeProfile: string | null = null;
export const SYSTEM_VARIANTS = [
  "default",
  "icpep",
  "cisco",
  "cyberph",
  "cyberph-noreply",
] as const;
export type SystemVariant = (typeof SYSTEM_VARIANTS)[number];
const hasCyberphEnv = !!(
  process.env.CYBERPH_SENDER_EMAIL &&
  process.env.CYBERPH_SENDER_PASSWORD &&
  process.env.CYBERPH_HOST_DOMAIN &&
  process.env.CYBERPH_PORT
);
let systemVariant: SystemVariant = hasCyberphEnv ? "cyberph" : "default";

export function setProfile(name: string, values: SenderEnv) {
  const clean = name.trim();
  if (!clean) return;
  profiles[clean] = { ...values };
  activeProfile = clean;
}

export function listProfiles(): string[] {
  return Object.keys(profiles);
}

export function getProfile(name: string): SenderEnv | undefined {
  return profiles[name];
}

export function setActiveProfile(name: string | null) {
  if (name === null || name.trim() === "") {
    activeProfile = null;
    return;
  }
  if (profiles[name]) activeProfile = name;
}

export function getActiveProfileName(): string | null {
  return activeProfile;
}

export function getSystemVariant(): SystemVariant {
  return systemVariant;
}
export function setSystemVariant(variant: SystemVariant) {
  systemVariant = variant;
}

export function getEnvForVariant(variant: SystemVariant): SenderEnv {
  const env = process.env as Record<string, string | undefined>;
  if (variant === "icpep") {
    return {
      SENDER_EMAIL: env.ICPEP_SENDER_EMAIL,
      SENDER_APP_PASSWORD: env.ICPEP_SENDER_PASSWORD,
      SENDER_NAME: env.ICPEP_SENDER_NAME,
    };
  }
  if (variant === "cisco") {
    return {
      SENDER_EMAIL: env.CISCO_SENDER_EMAIL,
      SENDER_APP_PASSWORD: env.CISCO_SENDER_PASSWORD,
      SENDER_NAME: env.CISCO_SENDER_NAME,
    };
  }
  if (variant === "cyberph" || variant === "cyberph-noreply") {
    return {
      SENDER_EMAIL: env.CYBERPH_SENDER_EMAIL,
      SENDER_APP_PASSWORD: env.CYBERPH_SENDER_PASSWORD,
      SENDER_NAME: env.CYBERPH_SENDER_NAME,
      HOST_DOMAIN: env.CYBERPH_HOST_DOMAIN,
      PORT: env.CYBERPH_PORT,
    };
  }
  // default
  return {
    SENDER_EMAIL: env.SENDER_EMAIL,
    SENDER_APP_PASSWORD: env.SENDER_APP_PASSWORD,
    SENDER_NAME: env.SENDER_NAME,
  };
}

export function getActiveEnv(): SenderEnv {
  // If a named profile is active, use it
  if (activeProfile && profiles[activeProfile]) {
    return { ...profiles[activeProfile] };
  }
  // Otherwise, derive from process.env based on selected system variant
  return getEnvForVariant(systemVariant);
}

export function clearProfile(name: string) {
  delete profiles[name];
  if (activeProfile === name) {
    activeProfile = listProfiles()[0] || null;
  }
}

export function clearAllProfiles() {
  profiles = {};
  activeProfile = null;
}
