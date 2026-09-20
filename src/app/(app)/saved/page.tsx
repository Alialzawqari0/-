import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSavedSources } from "@/lib/data";
import { SavedSourcesView } from "@/components/saved-sources-view";
import { ProjectFilter } from "@/components/project-filter";

export default async function SavedPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: projects }, sources] = await Promise.all([
    supabase.from("projects").select("id, title").eq("user_id", user.id).order("title"),
    getSavedSources(user.id, project),
  ]);

  return (
    <div className="mx-auto max-w-[720px] px-16 py-32 md:px-32">
      <div className="mb-32 flex items-center justify-between">
        <h1 className="text-title font-semibold text-pure-black">المحفوظات</h1>
        <ProjectFilter projects={projects ?? []} />
      </div>
      <SavedSourcesView sources={sources} showProjectLabel={!project} />
    </div>
  );
}
