import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ projects: [] }, { status: 401 });

  const { data } = await supabase
    .from("projects")
    .select("id, title")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ projects: data ?? [] });
}
