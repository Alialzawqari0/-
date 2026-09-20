import { toArabicNumber } from "@/lib/format";

export function LoadingIndicator({ bookCount }: { bookCount: number }) {
  return (
    <div className="mx-auto flex w-full max-w-[720px] items-center gap-8 px-16 py-8" role="status" aria-live="polite">
      <span className="flex gap-4">
        <span className="size-4 animate-pulse rounded-full bg-deep-teal" />
        <span className="size-4 animate-pulse rounded-full bg-deep-teal [animation-delay:150ms]" />
        <span className="size-4 animate-pulse rounded-full bg-deep-teal [animation-delay:300ms]" />
      </span>
      <span className="text-body-sm text-graphite">
        أبحث في {toArabicNumber(bookCount)} تفاسير…
      </span>
    </div>
  );
}
