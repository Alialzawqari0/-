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
