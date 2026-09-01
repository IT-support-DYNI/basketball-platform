import { randomBytes } from "crypto";
import type { Prisma } from "@prisma/client";

import { prisma } from "./prisma";
import { BadRequestError, ConflictError, NotFoundError } from "./api/errors";
import { registerSchema, registerGuardianSchema } from "./contracts/registration";
import { createSelfRegistration, createGuardianRegistration } from "./registration";

/**
 * Server-saved, resumable registration. The applicant has no account yet, so a
 * draft is keyed by the primary email + an unguessable resume token (stored in
 * a cookie, and usable from an emailed link later).
 */

export const DRAFT_COOKIE = "reg_draft";
const TTL_DAYS = 30;

type DraftData = Record<string, unknown>;

export type DraftView = {
  mode: "self" | "guardian";
  email: string;
  currentStep: number;
  data: DraftData;
};

/** Start (or resume) a draft for `email`. Blocks if a real account exists. */
export async function startDraft(
  emailRaw: string,
  mode: "self" | "guardian",
): Promise<{ token: string; view: DraftView }> {
  const email = emailRaw.trim().toLowerCase();
  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
    throw new ConflictError("An account with that email already exists — sign in instead.");
  }

  const existing = await prisma.registrationDraft.findUnique({ where: { email } });
  const expiresAt = new Date(Date.now() + TTL_DAYS * 864e5);

  if (existing && existing.status === "DRAFT" && existing.expiresAt > new Date()) {
    // Resume — but honour a mode switch (they went back to the first screen).
    const draft =
      existing.mode === mode
        ? existing
        : await prisma.registrationDraft.update({
            where: { id: existing.id },
            data: { mode, currentStep: 1, data: {}, expiresAt },
          });
    return { token: draft.resumeToken, view: toView(draft) };
  }

  const token = randomBytes(24).toString("base64url");
  const draft = await prisma.registrationDraft.upsert({
    where: { email },
    create: { email, resumeToken: token, mode, expiresAt },
    update: { resumeToken: token, mode, currentStep: 1, data: {}, status: "DRAFT", expiresAt },
  });
  return { token: draft.resumeToken, view: toView(draft) };
}

export async function getDraft(token: string): Promise<DraftView | null> {
  if (!token) return null;
  const draft = await prisma.registrationDraft.findUnique({ where: { resumeToken: token } });
  if (!draft || draft.status !== "DRAFT" || draft.expiresAt < new Date()) return null;
  return toView(draft);
}

export async function patchDraft(
  token: string,
  patch: { currentStep?: number; data?: DraftData },
): Promise<DraftView> {
  const draft = await prisma.registrationDraft.findUnique({ where: { resumeToken: token } });
  if (!draft || draft.status !== "DRAFT") throw new NotFoundError("That registration draft wasn't found.");

  const merged = { ...(draft.data as DraftData), ...(patch.data ?? {}) };
  const updated = await prisma.registrationDraft.update({
    where: { id: draft.id },
    data: {
      data: merged as Prisma.InputJsonValue,
      currentStep: patch.currentStep ?? draft.currentStep,
      expiresAt: new Date(Date.now() + TTL_DAYS * 864e5),
    },
  });
  return toView(updated);
}

/** Assemble + validate the full payload, create the account(s), mark SUBMITTED. */
export async function submitDraft(token: string) {
  const draft = await prisma.registrationDraft.findUnique({ where: { resumeToken: token } });
  if (!draft || draft.status !== "DRAFT") throw new NotFoundError("That registration draft wasn't found.");
  const d = draft.data as DraftData;

  const num = (v: unknown) => (v == null || v === "" ? undefined : Number(v));

  let result: unknown;
  if (draft.mode === "self") {
    const parsed = registerSchema.safeParse({
      name: d.name,
      email: draft.email,
      password: d.password,
      teamId: num(d.teamId),
      position: d.position || undefined,
      dateOfBirth: d.dateOfBirth,
      contactPhone: d.contactPhone || undefined,
      consentAccepted: true,
    });
    if (!parsed.success) throw new BadRequestError("Some details are missing — go back and complete every step.");
    result = await createSelfRegistration(parsed.data);
  } else {
    const parsed = registerGuardianSchema.safeParse({
      guardianName: d.guardianName,
      guardianEmail: draft.email,
      guardianPassword: d.guardianPassword,
      guardianPhone: d.guardianPhone || undefined,
      relationshipLabel: d.relationshipLabel,
      childName: d.childName,
      childEmail: d.childEmail || undefined,
      childDateOfBirth: d.childDateOfBirth,
      teamId: num(d.teamId),
      position: d.position || undefined,
      consentAccepted: true,
    });
    if (!parsed.success) throw new BadRequestError("Some details are missing — go back and complete every step.");
    result = await createGuardianRegistration(parsed.data);
  }

  await prisma.registrationDraft.update({ where: { id: draft.id }, data: { status: "SUBMITTED" } });
  return { mode: draft.mode, result };
}

function toView(d: { mode: string; email: string; currentStep: number; data: unknown }): DraftView {
  return {
    mode: d.mode === "guardian" ? "guardian" : "self",
    email: d.email,
    currentStep: d.currentStep,
    data: (d.data as DraftData) ?? {},
  };
}
