"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { TafsirBookKey } from "@/types/db";

export async function updateDisplayName(displayName: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("not authenticated");

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", user.id);
  if (error) throw error;
  revalidatePath("/", "layout");
}

export async function updatePreferredBooks(bookKeys: TafsirBookKey[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("not authenticated");

  const { error } = await supabase
    .from("profiles")
    .update({ preferred_books: bookKeys })
    .eq("id", user.id);
  if (error) throw error;
  revalidatePath("/", "layout");
}

/** Downloads a JSON export of everything the user owns (spec section 9/12: no analytics, user controls their data). */
export async function exportUserData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("not authenticated");

  const [{ data: profile }, { data: projects }, { data: chats }, { data: savedSources }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("projects").select("*").eq("user_id", user.id),
      supabase.from("chats").select("*").eq("user_id", user.id),
      supabase
        .from("saved_sources")
        .select("*, projects!inner(user_id)")
        .eq("projects.user_id", user.id),
    ]);

  const chatIds = (chats ?? []).map((c) => c.id);
  const { data: messages } =
    chatIds.length > 0
      ? await supabase.from("messages").select("*").in("chat_id", chatIds)
      : { data: [] };

  return {
    exported_at: new Date().toISOString(),
    profile,
    projects,
    chats,
    messages,
    saved_sources: savedSources,
  };
}

/** Permanently deletes every row the user owns, then their auth account (spec section 12). */
export async function deleteAccount() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("not authenticated");

  const admin = createServiceRoleClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) throw error;
  // ON DELETE CASCADE on profiles/projects/chats (and their children) handles the rest.

  await supabase.auth.signOut();
  redirect("/login");
}
