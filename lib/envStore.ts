type EnvMap = {
  SENDER_EMAIL?: string;
  SENDER_APP_PASSWORD?: string;
  SENDER_NAME?: string;
  HOST_DOMAIN?: string;
  PORT?: string;
  PORT_ALT?: string;
};

export const SYSTEM_VARIANTS = [
  "default",
  "icpep",
  "cisco",
  "arduinodayph",
  "cyberph",
  "cyberph-noreply",
] as const;

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
  readEnv(`${prefix}_SENDER_APP_PASSWORD`) ?? readEnv(`${prefix}_SENDER_PASSWORD`);

const readSenderEnv = (prefix: string): EnvMap => ({
  SENDER_EMAIL: readEnv(`${prefix}_SENDER_EMAIL`),
  SENDER_APP_PASSWORD: readPassword(prefix),
  SENDER_NAME: readEnv(`${prefix}_SENDER_NAME`),
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

const readCyberphEnv = (prefix: string, fallbackPrefix = "CYBERPH"): EnvMap => ({
  SENDER_EMAIL:
    readEnv(`${prefix}_SENDER_EMAIL`) ?? readEnv(`${fallbackPrefix}_SENDER_EMAIL`),
  SENDER_APP_PASSWORD:
    readPassword(prefix) ?? readPassword(fallbackPrefix),
  SENDER_NAME:
    readEnv(`${prefix}_SENDER_NAME`) ?? readEnv(`${fallbackPrefix}_SENDER_NAME`),
  HOST_DOMAIN:
    readEnv(`${prefix}_HOST_DOMAIN`) ?? readEnv(`${fallbackPrefix}_HOST_DOMAIN`),
  PORT: readEnv(`${prefix}_PORT`) ?? readEnv(`${fallbackPrefix}_PORT`),
  PORT_ALT: readEnv(`${prefix}_PORT_ALT`) ?? readEnv(`${fallbackPrefix}_PORT_ALT`),
});

export function getEnvForVariant(variant: SystemVariant): EnvMap {
  switch (variant) {
    case "icpep":
      return readSenderEnv("ICPEP");
    case "cisco":
      return readSenderEnv("CISCO");
    case "arduinodayph":
      return readSenderEnv("ARDUINODAYPH");
    case "cyberph":
      return readCyberphEnv("CYBERPH");
    case "cyberph-noreply":
      return readCyberphEnv("CYBERPH_NOREPLY", "CYBERPH");
    default:
      return {};
  }
}
