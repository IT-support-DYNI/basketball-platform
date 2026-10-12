import { describe, it, expect } from "vitest";

import { httpUrl, storageKey } from "./common";
import { createHighlightSchema, updatePlayerSchema } from "./team";
import { createVideoSchema } from "./video";
import { setPasswordSchema } from "./user";
import { videoAssignmentSelect } from "../videos";

const UUID = "3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b";

describe("httpUrl — outbound links rendered in <a href>", () => {
  it.each(["https://youtu.be/abc", "http://hudl.com/v/1"])("accepts %s", (u) => {
    expect(httpUrl.safeParse(u).success).toBe(true);
  });

  it.each([
    "javascript:alert(document.domain)//",
    "JavaScript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox(1)",
    "file:///etc/passwd",
  ])("rejects %s", (u) => {
    expect(httpUrl.safeParse(u).success).toBe(false);
  });
});

describe("storageKey — only keys the presign step issues", () => {
  it("accepts <folder>/<uuid> for the right folder", () => {
    expect(storageKey("player-photos").safeParse(`player-photos/${UUID}`).success).toBe(true);
  });

  it.each([
    `videos/${UUID}`, // right shape, wrong folder
    `player-photos/${UUID}/../videos/x`,
    "player-photos/not-a-uuid",
    "safeguarding/export.csv",
    "",
  ])("rejects %s as a player photo", (k) => {
    expect(storageKey("player-photos").safeParse(k).success).toBe(false);
  });
});

describe("schemas that store keys/links", () => {
  it("a highlight can't carry a javascript: link", () => {
    expect(createHighlightSchema.safeParse({ title: "Clip", url: "javascript:alert(1)" }).success).toBe(false);
  });

  it("a highlight's uploaded clip must be a highlight-videos key", () => {
    expect(createHighlightSchema.safeParse({ title: "Clip", storageKey: `videos/${UUID}` }).success).toBe(false);
    expect(createHighlightSchema.safeParse({ title: "Clip", storageKey: `highlight-videos/${UUID}` }).success).toBe(true);
  });

  it("a profile photo must be a player-photos key", () => {
    expect(updatePlayerSchema.safeParse({ photoUrl: `highlight-videos/${UUID}` }).success).toBe(false);
    expect(updatePlayerSchema.safeParse({ photoUrl: `player-photos/${UUID}` }).success).toBe(true);
  });

  it("a video's key, thumbnail and link are each constrained", () => {
    const base = { title: "Drill", category: "SHOOTING" as const };
    expect(createVideoSchema.safeParse({ ...base, key: `videos/${UUID}`, thumbnailKey: `video-thumbnails/${UUID}` }).success).toBe(true);
    expect(createVideoSchema.safeParse({ ...base, key: `player-photos/${UUID}` }).success).toBe(false);
    expect(createVideoSchema.safeParse({ ...base, externalUrl: "javascript:alert(1)" }).success).toBe(false);
  });

  it("set-password accepts an optional current password", () => {
    expect(setPasswordSchema.safeParse({ newPassword: "longenough" }).success).toBe(true);
    expect(setPasswordSchema.safeParse({ newPassword: "longenough", currentPassword: "old" }).success).toBe(true);
  });
});

describe("videoAssignmentSelect", () => {
  it("never selects whole User or PlayerProfile rows", () => {
    const json = JSON.stringify(videoAssignmentSelect);
    expect(json).not.toMatch(/passwordHash|calendarToken|medicalNotes|welfareNotes|email|dateOfBirth/);
    expect(videoAssignmentSelect.player.select.user).toEqual({ select: { name: true } });
  });
});

describe("safeExternalHref — links already stored before validation existed", () => {
  it("keeps http(s) links, drops everything else", async () => {
    const { safeExternalHref } = await import("../safe-url");
    expect(safeExternalHref("https://youtu.be/x")).toBe("https://youtu.be/x");
    expect(safeExternalHref(" javascript:alert(1)")).toBeUndefined();
    expect(safeExternalHref("data:text/html,x")).toBeUndefined();
    expect(safeExternalHref(null)).toBeUndefined();
  });
});
