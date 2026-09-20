import { notFound } from "next/navigation";
import { Bookmark, Check, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { VerseCard } from "@/components/verse-card";

const SWATCHES = [
  { name: "parchment", className: "bg-parchment" },
  { name: "soft-paper", className: "bg-soft-paper" },
  { name: "warm-mist", className: "bg-warm-mist" },
  { name: "ash", className: "bg-ash" },
  { name: "graphite", className: "bg-graphite" },
  { name: "ink", className: "bg-ink" },
  { name: "pure-black", className: "bg-pure-black" },
  { name: "deep-teal", className: "bg-deep-teal" },
];

const TYPE_SCALE = [
  { name: "caption (11px)", className: "text-caption" },
  { name: "body-sm (12px)", className: "text-body-sm" },
  { name: "body (14px)", className: "text-body" },
  { name: "body-lg (16px)", className: "text-body-lg" },
  { name: "title (24px)", className: "text-title" },
];

export default function StyleguidePage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-32 p-32">
      <h1 className="text-title font-semibold text-pure-black">دليل الأنماط</h1>

      <section>
        <h2 className="mb-16 text-body font-semibold text-ink">الألوان</h2>
        <div className="grid grid-cols-4 gap-8">
          {SWATCHES.map((s) => (
            <div key={s.name} className="flex flex-col gap-4">
              <div className={`h-32 rounded-md border border-warm-mist ${s.className}`} />
              <span className="text-caption text-graphite">{s.name}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-16 text-body font-semibold text-ink">التدرج الطباعي</h2>
        <div className="flex flex-col gap-8">
          {TYPE_SCALE.map((t) => (
            <p key={t.name} className={`${t.className} text-ink`}>
              نص تجريبي بالعربية — {t.name}
            </p>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-16 text-body font-semibold text-ink">الأوزان</h2>
        <p className="text-body-lg font-normal text-ink">وزن 400 — نص القراءة</p>
        <p className="text-body-lg font-medium text-ink">وزن 500 — الأزرار والعناوين الفرعية</p>
        <p className="text-title font-semibold text-pure-black">وزن 600 — العنوان والترويسة</p>
      </section>

      <section>
        <h2 className="mb-16 text-body font-semibold text-ink">المسافات (4 / 8 / 12 / 16 / 32)</h2>
        <div className="flex items-end gap-8">
          {[4, 8, 12, 16, 32].map((n) => (
            <div key={n} className="flex flex-col items-center gap-4">
              <div className={`w-16 bg-deep-teal`} style={{ height: n }} />
              <span className="text-caption text-graphite">{n}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-16 text-body font-semibold text-ink">الانحناءات والظل</h2>
        <div className="flex gap-16">
          <div className="size-32 rounded-md border border-warm-mist bg-soft-paper" />
          <div className="size-32 rounded-xl border border-warm-mist bg-soft-paper" />
          <div className="size-32 rounded-2xl border border-warm-mist bg-soft-paper" />
          <div className="size-32 rounded-full border border-warm-mist bg-soft-paper" />
          <div className="size-32 rounded-xl border border-warm-mist bg-soft-paper shadow-subtle" />
        </div>
      </section>

      <section>
        <h2 className="mb-16 text-body font-semibold text-ink">الأزرار</h2>
        <div className="flex flex-wrap gap-8">
          <Button>أساسي</Button>
          <Button variant="ghost">شبح</Button>
          <Button variant="outline">مخطط</Button>
          <Button size="dense">مضغوط</Button>
          <Button size="icon" className="rounded-full">
            <Bookmark />
          </Button>
        </div>
      </section>

      <section>
        <h2 className="mb-16 text-body font-semibold text-ink">بطاقة الآية</h2>
        <VerseCard
          surahNameAr="البقرة"
          ayahFrom={255}
          ayahTo={255}
          verses={[{ number: 255, text: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ" }]}
        />
      </section>

      <section>
        <h2 className="mb-16 text-body font-semibold text-ink">بطاقة التفسير</h2>
        <div className="rounded-xl border border-warm-mist bg-soft-paper p-16">
          <div className="flex flex-wrap items-baseline gap-8">
            <h3 className="text-body font-semibold text-ink">التفسير الميسر</h3>
            <span className="text-body-sm text-graphite">نخبة من العلماء</span>
          </div>
          <p className="mt-12 text-body-lg leading-reading text-ink">
            نص تفسير تجريبي لعرض الأسلوب والمسافات والخط المستخدم في بطاقات التفسير.
          </p>
          <div className="mt-12 flex items-center justify-between border-t border-warm-mist pt-12">
            <span className="text-body-sm text-graphite">سورة البقرة، الآية ٢٥٥</span>
            <Button variant="ghost" size="dense">
              <Check />
              محفوظ
            </Button>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-16 text-body font-semibold text-ink">القوائم</h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">افتح القائمة</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>إعادة تسمية</DropdownMenuItem>
            <DropdownMenuItem>حذف</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </section>

      <section>
        <h2 className="mb-16 text-body font-semibold text-ink">المُركّب (Composer)</h2>
        <div className="rounded-2xl border border-warm-mist bg-soft-paper p-12 shadow-subtle">
          <p className="p-4 text-body-lg text-ash">اسأل عن آية أو موضوع في التفسير…</p>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="dense" className="border-0 text-graphite">
              <BookOpen />
              التفاسير
            </Button>
            <Button size="icon" className="rounded-full">
              ↑
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
