import { describe, expect, it } from "vitest";
import { validateReference } from "@/lib/reference";

const surahs = [
  { id: 1, ayah_count: 7 },
  { id: 2, ayah_count: 286 },
  { id: 114, ayah_count: 6 },
];

describe("validateReference", () => {
  it("accepts a valid single-ayah reference", () => {
    expect(validateReference(surahs, 2, 255)).toEqual({ surah: 2, ayah_from: 255, ayah_to: 255 });
  });

  it("accepts a valid range", () => {
    expect(validateReference(surahs, 2, 1, 5)).toEqual({ surah: 2, ayah_from: 1, ayah_to: 5 });
  });

  it("defaults ayah_from/ayah_to to 1 when omitted", () => {
    expect(validateReference(surahs, 1)).toEqual({ surah: 1, ayah_from: 1, ayah_to: 1 });
  });

  it("rejects a surah outside 1..114", () => {
    expect(validateReference(surahs, 0)).toBeNull();
    expect(validateReference(surahs, 115)).toBeNull();
  });

  it("rejects a surah not in the provided list", () => {
    expect(validateReference(surahs, 50)).toBeNull();
  });

  it("rejects an ayah number beyond the surah's ayah_count", () => {
    expect(validateReference(surahs, 114, 999)).toBeNull();
    expect(validateReference(surahs, 1, 1, 999)).toBeNull();
  });

  it("rejects a nonexistent reference like 999:999", () => {
    expect(validateReference(surahs, 999, 999)).toBeNull();
  });

  it("rejects ayah_to before ayah_from", () => {
    expect(validateReference(surahs, 2, 10, 5)).toBeNull();
  });

  it("rejects surah omitted", () => {
    expect(validateReference(surahs, undefined, 1)).toBeNull();
  });
});
