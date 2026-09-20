import { formatVerseLabel, toArabicNumber } from "@/lib/format";

export function VerseCard({
  surahNameAr,
  ayahFrom,
  ayahTo,
  verses,
}: {
  surahNameAr: string;
  ayahFrom: number;
  ayahTo: number;
  verses: { number: number; text: string }[];
}) {
  return (
    <div className="rounded-2xl border border-warm-mist bg-soft-paper p-16 md:p-32">
      <div className="mb-16 flex justify-center">
        <span className="rounded-full border border-warm-mist bg-soft-paper px-8 py-4 text-caption text-graphite">
          {formatVerseLabel(surahNameAr, ayahFrom, ayahTo)}
        </span>
      </div>
      <p className="font-quran text-center text-[26px] leading-[2.2] text-ink" dir="rtl">
        {verses.map((v) => (
          <span key={v.number}>
            {v.text}{" "}
            <span className="text-graphite">{`﴿${toArabicNumber(v.number)}﴾`}</span>{" "}
          </span>
        ))}
      </p>
    </div>
  );
}
