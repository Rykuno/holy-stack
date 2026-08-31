import { BadRequestException, PayloadTooLargeException } from "@nestjs/common";

export function assertByteSize(byteSize: number, maxByteSize: number) {
  if (byteSize <= 0) {
    throw new BadRequestException("File size must be greater than 0");
  }

  if (byteSize > maxByteSize) {
    throw new PayloadTooLargeException(`File exceeds the ${maxByteSize} byte limit`);
  }
}

export function sanitizeOriginalFilename(name: string): string {
  let cleaned = "";
  for (const char of name) {
    const code = char.charCodeAt(0);
    if (code < 32 || code === 127) continue;
    cleaned += char;
  }

  const trimmed = cleaned.trim();
  if (!trimmed) return "upload";
  return trimmed.slice(0, 255);
}

export function contentDisposition(filename: string, type: "inline" | "attachment"): string {
  const fallback = filename.replace(/[^\x20-\x7E]/g, "_").replace(/"/g, "");
  return `${type}; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

export function bucketFor(
  visibility: "public" | "private",
  buckets: { publicBucket: string; privateBucket: string },
): string {
  return visibility === "public" ? buckets.publicBucket : buckets.privateBucket;
}
