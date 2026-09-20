import type { Chat } from "@/types/db";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface ChatDateGroup {
  label: string;
  chats: Chat[];
}

/** Groups chats into "اليوم"/"أمس"/"آخر ٧ أيام"/"أقدم" by created_at (spec section 6). */
export function groupChatsByDate(chats: Chat[]): ChatDateGroup[] {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const buckets: Record<string, Chat[]> = {
    اليوم: [],
    أمس: [],
    "آخر ٧ أيام": [],
    أقدم: [],
  };

  for (const chat of chats) {
    const created = new Date(chat.created_at).getTime();
    const daysAgo = Math.floor((startOfToday - created) / DAY_MS);
    if (created >= startOfToday) buckets["اليوم"].push(chat);
    else if (daysAgo <= 1) buckets["أمس"].push(chat);
    else if (daysAgo <= 7) buckets["آخر ٧ أيام"].push(chat);
    else buckets["أقدم"].push(chat);
  }

  return Object.entries(buckets)
    .filter(([, chats]) => chats.length > 0)
    .map(([label, chats]) => ({ label, chats }));
}
