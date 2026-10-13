import { describe, it, expect } from "vitest";

import { clubHistoryUpdate } from "./club-history";

const yes = { hasPreviousClub: true, previousClubs: "Belfast Star" };
const no = { hasPreviousClub: false, previousClubs: null };
const unanswered = { hasPreviousClub: null, previousClubs: null };

describe("clubHistoryUpdate", () => {
  it("leaves club history alone when neither field is sent", () => {
    expect(clubHistoryUpdate(yes, {})).toEqual({ ok: true, data: {} });
  });

  it("yes with a club name saves both, trimmed", () => {
    expect(clubHistoryUpdate(unanswered, { hasPreviousClub: true, previousClubs: "  Star U14 " })).toEqual({
      ok: true,
      data: { hasPreviousClub: true, previousClubs: "Star U14" },
    });
  });

  it.each([undefined, null, "", "   ", "x"])("yes needs a club name of 2+ characters (%j)", (previousClubs) => {
    expect(clubHistoryUpdate(unanswered, { hasPreviousClub: true, previousClubs })).toMatchObject({ ok: false });
  });

  it("yes alone keeps the stored club name, if there is one", () => {
    expect(clubHistoryUpdate(no, { hasPreviousClub: true })).toMatchObject({ ok: false });
    expect(clubHistoryUpdate(yes, { hasPreviousClub: true })).toEqual({
      ok: true,
      data: { hasPreviousClub: true, previousClubs: "Belfast Star" },
    });
  });

  it("no clears the club name", () => {
    expect(clubHistoryUpdate(yes, { hasPreviousClub: false })).toEqual({
      ok: true,
      data: { hasPreviousClub: false, previousClubs: null },
    });
  });

  it("a club name can't sit under a no or an unanswered question", () => {
    expect(clubHistoryUpdate(no, { previousClubs: "Belfast Star" })).toMatchObject({ ok: false });
    expect(clubHistoryUpdate(unanswered, { previousClubs: "Belfast Star" })).toMatchObject({ ok: false });
    expect(clubHistoryUpdate(yes, { hasPreviousClub: false, previousClubs: "Star" })).toMatchObject({ ok: false });
  });

  it("a club name alone can't be blanked under a stored yes", () => {
    expect(clubHistoryUpdate(yes, { previousClubs: "" })).toMatchObject({ ok: false });
    expect(clubHistoryUpdate(yes, { previousClubs: null })).toMatchObject({ ok: false });
  });

  it("a new club name under a stored yes replaces it", () => {
    expect(clubHistoryUpdate(yes, { previousClubs: "Star, Ulster Elks" })).toEqual({
      ok: true,
      data: { previousClubs: "Star, Ulster Elks" },
    });
  });
});
