import { describe, expect, it } from "vitest";
import { routeQuery, type ModelComplete } from "@/lib/router";

/** Builds a mocked model that ignores the input and returns fixed JSON — spec section 12(c). */
function mockModel(json: string): ModelComplete {
  return async () => json;
}

describe("routeQuery — acceptance tests (spec section 12c)", () => {
  it('"من هو أفضل لاعب كرة؟" -> out_of_scope', async () => {
    const result = await routeQuery(
      "من هو أفضل لاعب كرة؟",
      mockModel('{"intent":"out_of_scope"}')
    );
    expect(result.intent).toBe("out_of_scope");
  });

  it('"اكتب لي كود بايثون" -> out_of_scope', async () => {
    const result = await routeQuery(
      "اكتب لي كود بايثون",
      mockModel('{"intent":"out_of_scope"}')
    );
    expect(result.intent).toBe("out_of_scope");
  });

  it('"تفسير آية لا وجود لها ٩٩٩:٩٩٩" -> no_result', async () => {
    // Even if the model mistakenly tries to extract a reference, surah 999 is outside
    // 1..114 and is never trusted as-is (spec section 12): the output schema itself
    // rejects it, falling back to no_result. (A model that correctly refuses to
    // extract a nonexistent reference and returns no_result directly also passes.)
    const result = await routeQuery(
      "تفسير آية لا وجود لها ٩٩٩:٩٩٩",
      mockModel('{"intent":"search","surah":999,"ayah_from":999}')
    );
    expect(result.intent).toBe("no_result");
  });

  it('"هل يجوز لي كذا؟ حالتي كذا" -> ruling_request', async () => {
    const result = await routeQuery(
      "هل يجوز لي كذا؟ حالتي كذا",
      mockModel('{"intent":"ruling_request"}')
    );
    expect(result.intent).toBe("ruling_request");
  });

  it('"السلام عليكم، وش تسوي؟" -> about_app', async () => {
    const result = await routeQuery(
      "السلام عليكم، وش تسوي؟",
      mockModel('{"intent":"about_app"}')
    );
    expect(result.intent).toBe("about_app");
  });

  it('"ما تفسير آية الكرسي؟" -> search (2:255)', async () => {
    const result = await routeQuery(
      "ما تفسير آية الكرسي؟",
      mockModel('{"intent":"search","surah":2,"ayah_from":255,"ayah_to":255}')
    );
    expect(result.intent).toBe("search");
    expect(result.surah).toBe(2);
    expect(result.ayah_from).toBe(255);
  });
});

describe("routeQuery — malformed model output is never trusted", () => {
  it("falls back to no_result on non-JSON output", async () => {
    const result = await routeQuery("أي شيء", mockModel("ليس هذا JSON على الإطلاق"));
    expect(result.intent).toBe("no_result");
  });

  it("falls back to no_result on an invalid intent value", async () => {
    const result = await routeQuery("أي شيء", mockModel('{"intent":"rule_the_world"}'));
    expect(result.intent).toBe("no_result");
  });

  it("extracts JSON even if the model wraps it in prose", async () => {
    const result = await routeQuery(
      "ما تفسير آية الكرسي؟",
      mockModel('هذا هو الناتج:\n{"intent":"search","surah":2,"ayah_from":255}\nشكرا')
    );
    expect(result.intent).toBe("search");
    expect(result.surah).toBe(2);
  });
});
