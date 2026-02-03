"use server";

import fs from "fs";
import path from "path";

export async function listTemplatesAction(): Promise<string[]> {
  const templatesDir = path.join(process.cwd(), "public", "templates");
  try {
    const filenames = fs.readdirSync(templatesDir);
    return filenames.filter((file) => file.endsWith(".html"));
  } catch {
    return [];
  }
}

export async function getTemplateAction(id: string) {
  if (!id) {
    return { ok: false, error: "Missing template ID" } as const;
  }
  if (id.includes("..")) {
    return { ok: false, error: "Invalid template ID" } as const;
  }

  const filePath = path.join(process.cwd(), "public", "templates", id);
  try {
    const html = fs.readFileSync(filePath, "utf-8");
    return { ok: true, html } as const;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { ok: false, error: "Template not found" } as const;
    }
    return { ok: false, error: "Failed to read template file" } as const;
  }
}
