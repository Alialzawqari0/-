import { describe, expect, it } from "vitest";
import { normalizeArabic, stripParagraphTags } from "@/lib/normalize";

describe("normalizeArabic", () => {
  it("strips tashkeel", () => {
    expect(normalizeArabic("بِسْمِ اللَّهِ")).toBe("بسم الله");
  });

  it("strips tatweel", () => {
    expect(normalizeArabic("اللـــه")).toBe("الله");
  });

  it("unifies alef variants to bare alef", () => {
    expect(normalizeArabic("أحمد")).toBe("احمد");
    expect(normalizeArabic("إبراهيم")).toBe("ابراهيم");
    expect(normalizeArabic("آمين")).toBe("امين");
    expect(normalizeArabic("ٱلرَّحْمَٰنِ")).toBe("الرحمن");
  });

  it("unifies ya variants (alef maksura -> ya)", () => {
    expect(normalizeArabic("موسى")).toBe("موسي");
  });

  it("unifies ta-marbuta to ha", () => {
    expect(normalizeArabic("رحمة")).toBe("رحمه");
  });

  it("strips a leading BOM", () => {
    expect(normalizeArabic("﻿بِسْمِ")).toBe("بسم");
  });

  it("collapses whitespace and trims", () => {
    expect(normalizeArabic("  الحمد   لله  ")).toBe("الحمد لله");
  });

  it("is idempotent", () => {
    const once = normalizeArabic("قُلْ هُوَ اللَّهُ أَحَدٌ");
    expect(normalizeArabic(once)).toBe(once);
  });
});

describe("stripParagraphTags", () => {
  it("joins multiple <p> blocks with a blank line", () => {
    expect(stripParagraphTags("<p>أولا</p><p>ثانيا</p>")).toBe("أولا\n\nثانيا");
  });

  it("returns empty string for an empty paragraph", () => {
    expect(stripParagraphTags("<p></p>")).toBe("");
  });

  it("converts <br> to a newline and leaves plain text untouched", () => {
    expect(stripParagraphTags("سطر أول<br>سطر ثاني")).toBe("سطر أول\nسطر ثاني");
    expect(stripParagraphTags("نص بلا وسوم")).toBe("نص بلا وسوم");
  });
});
