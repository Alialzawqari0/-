import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Chat, Profile, Project, Surah, TafsirBook } from "@/types/db";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  return data;
}

export async function getAllSurahs(): Promise<Surah[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("surahs").select("*").order("id");
  if (error) throw error;
  return data ?? [];
}

export async function getAllTafsirBooks(): Promise<TafsirBook[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("tafsir_books").select("*").order("sort_order");
  if (error) throw error;
  return data ?? [];
}

export interface ProjectWithChatCount extends Project {
  chat_count: number;
}

export async function getProjects(userId: string): Promise<ProjectWithChatCount[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*, chats(count)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((p) => {
    const { chats, ...rest } = p as unknown as Project & { chats: { count: number }[] };
    return { ...rest, chat_count: chats?.[0]?.count ?? 0 };
  });
}

export async function getProject(userId: string, projectId: string): Promise<Project | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .eq("id", projectId)
    .maybeSingle();
  return data;
}

export async function getChatsWithoutProject(userId: string): Promise<Chat[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chats")
    .select("*")
    .eq("user_id", userId)
    .is("project_id", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getChatsForProject(userId: string, projectId: string): Promise<Chat[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chats")
    .select("*")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getChat(userId: string, chatId: string): Promise<Chat | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("chats")
    .select("*")
    .eq("user_id", userId)
    .eq("id", chatId)
    .maybeSingle();
  return data;
}

export interface SavedSourceRow {
  id: string;
  project_id: string;
  project_title: string;
  surah: number;
  ayah: number;
  surah_name_ar: string;
  ayah_text: string;
  book_id: number;
  book_name_ar: string;
  book_author_ar: string;
  tafsir_verse_from: number;
  tafsir_verse_to: number;
  tafsir_text: string | null;
  reviewed: boolean;
}

/** Saved sources for a user, optionally scoped to one project, grouped by (surah, ayah). */
export async function getSavedSources(
  userId: string,
  projectId?: string
): Promise<SavedSourceRow[]> {
  const supabase = await createClient();

  let query = supabase
    .from("saved_sources")
    .select("*, projects!inner(id, title, user_id)")
    .eq("projects.user_id", userId)
    .order("created_at", { ascending: false });
  if (projectId) query = query.eq("project_id", projectId);

  const { data: rows, error } = await query;
  if (error) throw error;
  if (!rows || rows.length === 0) return [];

  const surahIds = [...new Set(rows.map((r) => r.surah))];
  const bookIds = [...new Set(rows.map((r) => r.book_id))];

  const [{ data: surahs }, { data: books }] = await Promise.all([
    supabase.from("surahs").select("id, name_ar").in("id", surahIds),
    supabase.from("tafsir_books").select("*").in("id", bookIds),
  ]);
  const surahById = new Map((surahs ?? []).map((s) => [s.id, s.name_ar]));
  const bookById = new Map((books ?? []).map((b) => [b.id, b]));

  const results: SavedSourceRow[] = [];
  for (const row of rows) {
    const project = (row as unknown as { projects: { id: string; title: string } }).projects;
    const [{ data: ayah }, { data: entry }] = await Promise.all([
      supabase.from("ayahs").select("text").eq("surah", row.surah).eq("number", row.ayah).maybeSingle(),
      supabase
        .from("tafsir_entries")
        .select("*")
        .eq("book_id", row.book_id)
        .eq("surah", row.surah)
        .lte("verse_from", row.ayah)
        .gte("verse_to", row.ayah)
        .maybeSingle(),
    ]);
    const book = bookById.get(row.book_id);
    results.push({
      id: row.id,
      project_id: project.id,
      project_title: project.title,
      surah: row.surah,
      ayah: row.ayah,
      surah_name_ar: surahById.get(row.surah) ?? "",
      ayah_text: ayah?.text ?? "",
      book_id: row.book_id,
      book_name_ar: book?.name_ar ?? "",
      book_author_ar: book?.author_ar ?? "",
      tafsir_verse_from: entry?.verse_from ?? row.ayah,
      tafsir_verse_to: entry?.verse_to ?? row.ayah,
      tafsir_text: entry?.text ?? null,
      reviewed: entry?.reviewed ?? false,
    });
  }
  return results;
}
