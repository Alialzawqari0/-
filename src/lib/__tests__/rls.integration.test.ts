import { describe, expect, it } from "vitest";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/db";

/**
 * RLS integration test (spec section 12d): user A cannot read user B's projects.
 *
 * Skipped unless a live Supabase project + two seeded test users are configured, since
 * this needs a real Postgres instance with the migrations in supabase/migrations/
 * applied — not something a plain unit test can fake. To run it:
 *
 *   1. Apply supabase/migrations/*.sql to a (throwaway/test) Supabase project.
 *   2. Create two users, e.g. via the Supabase dashboard or auth.admin API.
 *   3. Set: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
 *      TEST_USER_A_EMAIL/TEST_USER_A_PASSWORD, TEST_USER_B_EMAIL/TEST_USER_B_PASSWORD.
 *   4. npx vitest run src/lib/__tests__/rls.integration.test.ts
 */
const hasLiveCredentials =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  !!process.env.TEST_USER_A_EMAIL &&
  !!process.env.TEST_USER_A_PASSWORD &&
  !!process.env.TEST_USER_B_EMAIL &&
  !!process.env.TEST_USER_B_PASSWORD;

describe.skipIf(!hasLiveCredentials)("RLS: projects are private per user", () => {
  it("user A cannot read a project created by user B", async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const clientA = createClient<Database>(url, anonKey);
    const clientB = createClient<Database>(url, anonKey);

    await clientA.auth.signInWithPassword({
      email: process.env.TEST_USER_A_EMAIL!,
      password: process.env.TEST_USER_A_PASSWORD!,
    });
    const { data: signInB } = await clientB.auth.signInWithPassword({
      email: process.env.TEST_USER_B_EMAIL!,
      password: process.env.TEST_USER_B_PASSWORD!,
    });

    const { data: created, error: createError } = await clientB
      .from("projects")
      .insert({ user_id: signInB.user!.id, title: "مشروع سري لمستخدم ب" })
      .select()
      .single();
    expect(createError).toBeNull();

    const { data: seenByA, error: readError } = await clientA
      .from("projects")
      .select("*")
      .eq("id", created!.id)
      .maybeSingle();

    expect(readError).toBeNull();
    expect(seenByA).toBeNull(); // RLS silently filters it out, rather than erroring

    await clientB.from("projects").delete().eq("id", created!.id);
  });
});
