import { describe, it, expect } from "vitest";

import { serializePlayerProfile, canEditPlayerField, type ViewerScope, type ViewerKind } from "./field-visibility";

const scope = (kinds: ViewerKind[], isSelf = false): ViewerScope => ({ kinds: new Set(kinds), isSelf });

const profile = {
  id: 1,
  name: "Priya Player",
  photoUrl: "/p.png",
  publicProfileApproved: false,
  bio: "Guard who loves the transition game",
  nationality: "GB",
  heightCm: 178,
  dateOfBirth: new Date("2010-05-01"),
  contactPhone: "0700 000",
  guardianName: "Anita",
  guardianContact: "0711 111",
  address: "12 Court Road",
  emergencyContactPhone: "0722 222",
  medicalNotes: "Asthma — inhaler in bag",
  welfareNotes: "Prefers not to travel alone",
  memberships: [{ teamId: 3 }],
};

describe("serializePlayerProfile", () => {
  it("a teammate sees only the public/club basics", () => {
    const out = serializePlayerProfile(profile, scope(["CLUB_MEMBER", "TEAMMATE"]));
    expect(out.name).toBe("Priya Player");
    expect(out.bio).toBeDefined();
    expect(out.heightCm).toBeDefined();
    expect(out.dateOfBirth).toBeUndefined();
    expect(out.contactPhone).toBeUndefined();
    expect(out.address).toBeUndefined();
    expect(out.medicalNotes).toBeUndefined();
    expect(out.welfareNotes).toBeUndefined();
    expect(out.memberships).toEqual(profile.memberships);
  });

  it("the player's coach sees contact + emergency + DOB, not address / medical / welfare", () => {
    const out = serializePlayerProfile(profile, scope(["CLUB_MEMBER", "TEAM_COACH"]));
    expect(out.dateOfBirth).toBeDefined();
    expect(out.contactPhone).toBeDefined();
    expect(out.guardianContact).toBeDefined();
    expect(out.emergencyContactPhone).toBeDefined();
    expect(out.address).toBeUndefined();
    expect(out.medicalNotes).toBeUndefined();
    expect(out.welfareNotes).toBeUndefined();
  });

  it("the medical officer sees medical notes + emergency, not welfare notes or address", () => {
    const out = serializePlayerProfile(profile, scope(["CLUB_MEMBER", "TEAM_MEDICAL"]));
    expect(out.medicalNotes).toBeDefined();
    expect(out.emergencyContactPhone).toBeDefined();
    expect(out.welfareNotes).toBeUndefined();
    expect(out.address).toBeUndefined();
  });

  it("the welfare officer sees welfare notes + address, not medical notes", () => {
    const out = serializePlayerProfile(profile, scope(["CLUB_MEMBER", "TEAM_WELFARE"]));
    expect(out.welfareNotes).toBeDefined();
    expect(out.address).toBeDefined();
    expect(out.medicalNotes).toBeUndefined();
  });

  it("admin sees everything", () => {
    const out = serializePlayerProfile(profile, scope(["CLUB_MEMBER", "ADMIN"]));
    for (const k of Object.keys(profile)) expect(out[k as keyof typeof out]).toBeDefined();
  });

  it("the player themselves sees their own full record", () => {
    const out = serializePlayerProfile(profile, scope(["CLUB_MEMBER", "SELF"], true));
    expect(out.medicalNotes).toBeDefined();
    expect(out.welfareNotes).toBeDefined();
    expect(out.address).toBeDefined();
  });

  it("public viewer sees nothing sensitive, and bio only when approved", () => {
    expect(serializePlayerProfile(profile, scope(["PUBLIC"])).bio).toBeUndefined();
    const approved = serializePlayerProfile({ ...profile, publicProfileApproved: true }, scope(["PUBLIC"]));
    expect(approved.bio).toBeDefined();
    expect(approved.contactPhone).toBeUndefined();
    expect(approved.dateOfBirth).toBeUndefined();
  });
});

describe("canEditPlayerField", () => {
  it("locks medical notes to medical staff / admin / self", () => {
    expect(canEditPlayerField(scope(["TEAM_COACH"]), "medicalNotes")).toBe(false);
    expect(canEditPlayerField(scope(["TEAM_MEDICAL"]), "medicalNotes")).toBe(true);
    expect(canEditPlayerField(scope([], true), "medicalNotes")).toBe(true);
  });
  it("locks welfare notes to welfare staff / admin / self", () => {
    expect(canEditPlayerField(scope(["TEAM_MEDICAL"]), "welfareNotes")).toBe(false);
    expect(canEditPlayerField(scope(["TEAM_WELFARE"]), "welfareNotes")).toBe(true);
  });
  it("leaves ordinary fields editable", () => {
    expect(canEditPlayerField(scope(["TEAM_COACH"]), "bio")).toBe(true);
  });
});
