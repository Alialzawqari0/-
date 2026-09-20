import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAllTafsirBooks, getProfile } from "@/lib/data";
import { ProfileForm } from "@/components/profile-form";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [books, profile] = await Promise.all([getAllTafsirBooks(), getProfile(user.id)]);

  return (
    <div className="mx-auto max-w-[720px] px-16 py-32 md:px-32">
      <h1 className="mb-32 text-title font-semibold text-pure-black">الملف الشخصي</h1>
      <ProfileForm
        email={user.email ?? ""}
        displayName={profile?.display_name ?? ""}
        books={books}
        preferredBooks={profile?.preferred_books ?? ["tabari", "kathir", "saadi", "muyassar"]}
      />
    </div>
  );
}
