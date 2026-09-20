"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { SUGGESTIONS } from "@/lib/messages";
import { postMessage, startChat } from "@/lib/actions/chat";

export function SuggestionRows({ chatId }: { chatId?: string }) {
  const router = useRouter();

  async function handleSelect(text: string) {
    if (chatId) {
      await postMessage(chatId, text);
      router.refresh();
    } else {
      await startChat(text);
    }
  }

  return (
    <div className="flex flex-col">
      {SUGGESTIONS.map((s, i) => (
        <button
          key={s}
          type="button"
          onClick={() => handleSelect(s)}
          className={`flex items-center justify-between py-12 text-body text-ink hover:bg-warm-mist/35 ${
            i > 0 ? "border-t border-warm-mist" : ""
          }`}
        >
          <span>{s}</span>
          <ChevronLeft className="size-16 text-ash rtl:rotate-180" />
        </button>
      ))}
    </div>
  );
}
