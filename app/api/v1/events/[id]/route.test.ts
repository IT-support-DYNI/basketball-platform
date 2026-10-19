import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

/** Only an admin puts a match on, or takes it off, the public homepage. */

const session = vi.hoisted(() => ({ current: null as unknown }));
const findUnique = vi.hoisted(() => vi.fn());
const update = vi.hoisted(() => vi.fn());

vi.mock("next-auth", () => ({ getServerSession: async () => session.current }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/push", () => ({ sendPushToUsers: async () => {} }));
vi.mock("@/lib/prisma", () => ({ prisma: { event: { findUnique, update } } }));

import { PATCH } from "./route";

const event = { id: 7, teamId: 2, visibility: "TEAM", status: "SCHEDULED", recurrenceId: null, startAt: new Date() };

const patch = async (body: Record<string, unknown>) => {
  const req = new NextRequest("http://localhost/api/v1/events/7", { method: "PATCH", body: JSON.stringify(body) });
  const res = await PATCH(req, { params: { id: "7" } });
  return { status: res.status, body: await res.json() };
};

const as = (user: Record<string, unknown>) => {
  session.current = { user, expires: "" };
};

beforeEach(() => {
  findUnique.mockReset().mockResolvedValue(event);
  update.mockReset().mockImplementation(async ({ data }) => ({ ...event, ...data }));
});

describe("PATCH /api/v1/events/[id] visibility", () => {
  it("a coach can't make their team's match public", async () => {
    as({ id: "5", role: "COACH", teamIds: [2] });
    const { status } = await patch({ visibility: "PUBLIC" });
    expect(status).toBe(403);
    expect(update).not.toHaveBeenCalled();
  });

  it("a coach can't take a public match off the homepage either", async () => {
    findUnique.mockResolvedValue({ ...event, visibility: "PUBLIC" });
    as({ id: "5", role: "COACH", teamIds: [2] });
    expect((await patch({ visibility: "TEAM" })).status).toBe(403);
  });

  it("a coach can still edit everything else, and switch between team and club", async () => {
    as({ id: "5", role: "COACH", teamIds: [2] });
    expect((await patch({ title: "Cup semi-final" })).status).toBe(200);
    expect((await patch({ visibility: "CLUB" })).status).toBe(200);
  });

  it("an admin can show and hide a match", async () => {
    as({ id: "1", role: "ADMIN" });
    expect((await patch({ visibility: "PUBLIC" })).status).toBe(200);
    expect(update).toHaveBeenLastCalledWith(expect.objectContaining({ data: expect.objectContaining({ visibility: "PUBLIC" }) }));
  });
});
