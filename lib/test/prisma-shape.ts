/**
 * Test helper: projects a full fixture row through a Prisma `include` /
 * `select` the way Prisma would, so route tests check the shape a route
 * actually asks the database for. Nested `where` filters are ignored, so
 * test those separately (see lib/videos.test.ts).
 */

type Row = Record<string, unknown>;
export type Shape = { include?: Record<string, unknown>; select?: Record<string, unknown> };

const isObj = (v: unknown): v is Row => typeof v === "object" && v !== null && !(v instanceof Date);

export function project(row: unknown, shape: Shape | true | undefined): unknown {
  if (Array.isArray(row)) return row.map((r) => project(r, shape));
  if (!isObj(row)) return row;
  const scalars = Object.fromEntries(Object.entries(row).filter(([, v]) => !isObj(v) && !Array.isArray(v)));
  if (shape === true || shape === undefined) return scalars;
  if (shape.select) {
    return Object.fromEntries(
      Object.entries(shape.select)
        .filter(([, s]) => s)
        .map(([k, s]) => [k, project(row[k], s as Shape | true)]),
    );
  }
  const out: Row = { ...scalars };
  for (const [k, s] of Object.entries(shape.include ?? {})) if (s) out[k] = project(row[k], s as Shape | true);
  return out;
}

/** A video whose assignments reach a player with every sensitive column set. */
export const leakyVideoFixture = {
  id: 1, title: "Defensive slides", key: "videos/1.mp4", externalUrl: null, thumbnailKey: null,
  category: "DEFENCE", uploadedByUserId: 5,
  uploadedBy: { id: 5, name: "Coach", passwordHash: "$2b$10$COACHHASH" },
  assignments: [
    { id: 10, videoId: 1, teamId: 2, playerId: null, team: { id: 2, name: "U16" }, player: null },
    {
      id: 11, videoId: 1, teamId: null, playerId: 7, team: null,
      player: {
        id: 7, userId: 77, medicalNotes: "Asthma", welfareNotes: "Confidential",
        address: "1 Private Road", dateOfBirth: new Date("2010-01-01"), previousClubs: "Belfast Star",
        user: {
          id: 77, name: "Other Player", email: "other@example.com",
          passwordHash: "$2b$10$SECRETHASH", calendarToken: "cal-SECRET",
        },
      },
    },
  ],
};

/** Values from leakyVideoFixture that must never appear in any response. */
export const SECRET_VALUES = [
  "SECRETHASH", "COACHHASH", "cal-SECRET", "Asthma", "Confidential",
  "1 Private Road", "Belfast Star", "other@example.com", "dateOfBirth",
];
