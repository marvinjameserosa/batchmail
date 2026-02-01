import { NextResponse } from "next/server";
import {
  SYSTEM_VARIANTS,
  getActiveEnv,
  getActiveProfileName,
  getEnvForVariant,
  getSystemVariant,
  listProfiles,
  type SystemVariant,
} from "./store";

const REQUIRED = ["SENDER_EMAIL", "SENDER_APP_PASSWORD", "SENDER_NAME"] as const;

type RequiredKey = typeof REQUIRED[number];

export async function GET(req: Request) {
  const url = new URL(req.url);
  const variantParam = url.searchParams.get("variant");
  const variant = (SYSTEM_VARIANTS as readonly string[]).includes(
    variantParam || ""
  )
    ? (variantParam as SystemVariant)
    : getSystemVariant();
  const override =
    variant === "default" ? getActiveEnv() : getEnvForVariant(variant);
  const present: Record<RequiredKey, boolean> = {
    SENDER_EMAIL: !!override.SENDER_EMAIL,
    SENDER_APP_PASSWORD: !!override.SENDER_APP_PASSWORD,
    SENDER_NAME: !!override.SENDER_NAME,
  };
  const missing = REQUIRED.filter((k) => !present[k]);
  const usingProfile = variant === "default" && !!getActiveProfileName();
  return NextResponse.json({
    ok: missing.length === 0,
    present,
    missing,
    source: Object.fromEntries(
      REQUIRED.map((k) => [
        k,
        override[k] ? (usingProfile ? "profile" : "env") : "missing",
      ])
    ),
    activeProfile: getActiveProfileName(),
    profiles: listProfiles(),
    systemVariant: variant,
    hint: "Create a .env.local file in the project root with SENDER_EMAIL, SENDER_APP_PASSWORD (e.g. Gmail App Password), and SENDER_NAME. Restart the server after changes.",
    example: "SENDER_EMAIL=you@example.com\nSENDER_APP_PASSWORD=abcd abcd abcd abcd\nSENDER_NAME=Your Name",
  });
}
