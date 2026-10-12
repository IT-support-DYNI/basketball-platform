import { readdirSync, readFileSync, statSync } from "fs";
import { join, extname } from "path";
import { describe, it, expect } from "vitest";

/**
 * Guards against committing a half-written image. `public/brand/
 * dyni-blazers-crest.png` once landed cut off at exactly 192 KiB (an
 * interrupted copy): browsers still decode the part that exists, so the site
 * showed only the top of the crest and nothing errored. A complete PNG ends
 * with an IEND chunk; a complete JPEG ends with the FF D9 marker.
 */

const PUBLIC_DIR = join(process.cwd(), "public");

function imagesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return imagesUnder(path);
    return [".png", ".jpg", ".jpeg"].includes(extname(name).toLowerCase()) ? [path] : [];
  });
}

function isComplete(path: string): boolean {
  const bytes = readFileSync(path);
  if (extname(path).toLowerCase() === ".png") {
    // ...IEND + 4-byte CRC: "IEND" sits 8 bytes from the end.
    return bytes.subarray(bytes.length - 8, bytes.length - 4).toString("latin1") === "IEND";
  }
  return bytes[bytes.length - 2] === 0xff && bytes[bytes.length - 1] === 0xd9;
}

describe("public/ images", () => {
  const images = imagesUnder(PUBLIC_DIR);

  it("finds the brand assets", () => {
    expect(images.length).toBeGreaterThan(0);
  });

  it.each(images.map((p) => [p.slice(PUBLIC_DIR.length + 1)]))("%s is a complete file", (rel) => {
    expect(isComplete(join(PUBLIC_DIR, rel))).toBe(true);
  });
});
