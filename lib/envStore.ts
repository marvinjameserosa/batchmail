type EnvMap = {
  SENDER_EMAIL?: string;
  SENDER_APP_PASSWORD?: string;
  SENDER_NAME?: string;
};

export const SYSTEM_VARIANTS = ["default"] as const;

export type SystemVariant = (typeof SYSTEM_VARIANTS)[number];

type ProfileStore = Map<string, EnvMap>;

const profileStore: ProfileStore = new Map();
let activeProfileName: string | null = null;
let activeSystemVariant: SystemVariant = "default";

const readEnv = (key: string) => {
  const raw = process.env[key];
  if (raw === undefined || raw === null) return undefined;
  const trimmed = String(raw).trim();
  if (!trimmed) return undefined;
  return trimmed.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
};

const readPassword = (prefix: string) =>
  readEnv(prefix ? `${prefix}_SENDER_APP_PASSWORD` : "SENDER_APP_PASSWORD") ??
  readEnv(prefix ? `${prefix}_SENDER_PASSWORD` : "SENDER_PASSWORD");

const readSenderEnv = (prefix: string): EnvMap => ({
  SENDER_EMAIL: readEnv(prefix ? `${prefix}_SENDER_EMAIL` : "SENDER_EMAIL"),
  SENDER_APP_PASSWORD: readPassword(prefix),
  SENDER_NAME: readEnv(prefix ? `${prefix}_SENDER_NAME` : "SENDER_NAME"),
});

export function listProfiles(): string[] {
  return Array.from(profileStore.keys());
}

export function getActiveProfileName(): string | null {
  return activeProfileName;
}

export function setProfile(name: string, env: Record<string, string>) {
  const trimmed = (name || "").trim();
  if (!trimmed) return;
  profileStore.set(trimmed, { ...env });
  activeProfileName = trimmed;
}

export function clearAllProfiles() {
  profileStore.clear();
  activeProfileName = null;
}

export function getActiveEnv(): EnvMap {
  if (!activeProfileName) return {};
  return profileStore.get(activeProfileName) ?? {};
}

export function setSystemVariant(variant: SystemVariant) {
  activeSystemVariant = variant;
}

export function getSystemVariant(): SystemVariant {
  return activeSystemVariant;
}

export function getEnvForVariant(variant: SystemVariant): EnvMap {
  switch (variant) {
    case "default":
      return readSenderEnv("");
    default:
      return {};
  }
}
