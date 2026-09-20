import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

/** Verbatim system prompt from the spec — the model classifies only, never answers. */
export const ROUTER_SYSTEM_PROMPT =
  "أنت موجّه الاستعلامات في دِرَايَة، وهي أداة بحث في كتب تفسير القرآن. أنت لا تجيب عن " +
  "الأسئلة بنفسك. صنّف رسالة المستخدم إلى intent واحد: search أو no_result أو " +
  "out_of_scope أو ruling_request أو about_app أو distress. أخرج JSON فقط بالشكل: " +
  "{intent, surah?, ayah_from?, ayah_to?, topic?}. في حالة search استخرج رقم السورة " +
  "والآية أو الموضوع بالفصحى حتى لو كتب المستخدم بالعامية. لا تضف أي محتوى من عندك.";

export const RouterIntentSchema = z.enum([
  "search",
  "no_result",
  "out_of_scope",
  "ruling_request",
  "about_app",
  "distress",
]);

export const RouterOutputSchema = z.object({
  intent: RouterIntentSchema,
  surah: z.number().int().min(1).max(114).optional(),
  ayah_from: z.number().int().min(1).optional(),
  ayah_to: z.number().int().min(1).optional(),
  topic: z.string().optional(),
});

export type RouterIntent = z.infer<typeof RouterIntentSchema>;
export type RouterOutput = z.infer<typeof RouterOutputSchema>;

/** The model call, isolated so tests can mock it without hitting the network. */
export type ModelComplete = (userMessage: string) => Promise<string>;

export function createAnthropicComplete(): ModelComplete {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const model = process.env.ROUTER_MODEL ?? "claude-haiku-4-5-20251001";

  return async (userMessage: string) => {
    const response = await client.messages.create({
      model,
      max_tokens: 300,
      system: ROUTER_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });
    const block = response.content[0];
    return block?.type === "text" ? block.text : "";
  };
}

function extractJson(raw: string): string {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return raw;
  return raw.slice(start, end + 1);
}

/**
 * Routes a user message to an intent + extracted reference/topic. Router output is
 * never trusted as-is (spec section 12) — malformed or unparsable model output safely
 * falls back to no_result rather than guessing.
 */
export async function routeQuery(
  userMessage: string,
  complete: ModelComplete
): Promise<RouterOutput> {
  const raw = await complete(userMessage);

  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJson(raw));
  } catch {
    return { intent: "no_result" };
  }

  const result = RouterOutputSchema.safeParse(parsed);
  return result.success ? result.data : { intent: "no_result" };
}
