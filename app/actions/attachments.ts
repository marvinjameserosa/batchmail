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
  const arrayBuffer = await file.arrayBuffer();
  if (typeof Buffer !== "undefined") {
    return Buffer.from(arrayBuffer).toString("base64");
  }
  const bytes = new Uint8Array(arrayBuffer);
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
};

const isFileLike = (value: unknown): value is File => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as File;
  return typeof candidate.name === "string" && typeof candidate.arrayBuffer === "function";
};

export async function uploadAttachmentsAction(input: FormData): Promise<UploadAttachmentsResult> {
  if (!(input instanceof FormData)) {
    return { ok: false, error: "Invalid form data" };
  }
  const files = input.getAll("files").filter(isFileLike);
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
