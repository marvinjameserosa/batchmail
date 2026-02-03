"use server";

import { normalizeNameKey } from "@/lib/normalizeName";

export type AttachmentEntry = {
  filename: string;
  contentBase64: string;
  contentType?: string;
  sizeBytes?: number;
};

export type UploadAttachmentsResult =
  | { ok: true; items: Array<{ key: string; entry: AttachmentEntry }>; failed: string[] }
  | { ok: false; error: string };

const fileBaseName = (name: string) => {
  const idx = name.lastIndexOf(".");
  return idx > 0 ? name.slice(0, idx) : name;
};

const toBase64 = async (file: File) => {
  const buffer = Buffer.from(await file.arrayBuffer());
  return buffer.toString("base64");
};

export async function uploadAttachmentsAction(input: FormData): Promise<UploadAttachmentsResult> {
  if (!(input instanceof FormData)) {
    return { ok: false, error: "Invalid form data" };
  }
  const files = input.getAll("files").filter((f) => f instanceof File) as File[];
  if (!files.length) {
    return { ok: false, error: "No files provided" };
  }

  const items: Array<{ key: string; entry: AttachmentEntry }> = [];
  const failed: string[] = [];

  for (const file of files) {
    try {
      const contentBase64 = await toBase64(file);
      const key = normalizeNameKey(fileBaseName(file.name));
      items.push({
        key,
        entry: {
          filename: file.name,
          contentBase64,
          contentType: file.type || undefined,
          sizeBytes: typeof file.size === "number" ? file.size : undefined,
        },
      });
    } catch {
      failed.push(file.name || "(unknown)");
    }
  }

  return { ok: true, items, failed };
}
