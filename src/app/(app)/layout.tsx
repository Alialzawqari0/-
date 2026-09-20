import { redirect } from "next/navigation";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { createClient } from "@/lib/supabase/server";
import { getChatsWithoutProject, getProfile, getProjects } from "@/lib/data";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profile, projects, chatsWithoutProject, { data: allChats }] = await Promise.all([
    getProfile(user.id),
    getProjects(user.id),
    getChatsWithoutProject(user.id),
    supabase.from("chats").select("id, title").eq("user_id", user.id).order("created_at", { ascending: false }),
  ]);

  return (
    <SidebarProvider>
      <AppSidebar
        displayName={profile?.display_name || user.email?.split("@")[0] || "بلا اسم"}
        email={user.email ?? ""}
        projects={projects.map((p) => ({ id: p.id, title: p.title, chat_count: p.chat_count }))}
        chatsWithoutProject={chatsWithoutProject}
        allChatsForSearch={(allChats ?? []).map((c) => ({ id: c.id, title: c.title || "محادثة جديدة" }))}
      />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
