import { FIXED_MESSAGES, INTENTS_WITH_SUGGESTIONS } from "@/lib/messages";
import { SuggestionRows } from "@/components/suggestion-rows";
import type { RouterIntent } from "@/types/db";

export function FixedMessage({ intent, chatId }: { intent: RouterIntent; chatId?: string }) {
  if (intent === "search") return null;

  return (
    <div className="flex flex-col gap-16">
      <p className="text-body-lg leading-reading text-ink">{FIXED_MESSAGES[intent]}</p>
      {INTENTS_WITH_SUGGESTIONS.has(intent) && <SuggestionRows chatId={chatId} />}
    </div>
  );
}
