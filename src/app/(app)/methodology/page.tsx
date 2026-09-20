const QURANPEDIA_ENABLED = process.env.TAFSIR_PROVIDER === "quranpedia";

export default function MethodologyPage() {
  return (
    <div className="mx-auto max-w-[720px] px-16 py-32 md:px-32">
      <h1 className="mb-32 text-title font-semibold text-pure-black">منهجنا ومصادرنا</h1>

      <div className="flex flex-col gap-32 text-body-lg leading-reading text-ink">
        <section>
          <h2 className="mb-8 text-body font-semibold text-ink">ما هي دِرَايَة</h2>
          <p>
            دِرَايَة أداة بحث في كتب التفسير، وليست مفتياً ولا مساعداً عاماً. إذا سألتها عن آية أو
            موضوع قرآني، تعرض لك ما ورد في كتب التفسير بنصوصها الأصلية دون تغيير، مع اسم الكتاب
            والمؤلف ورقم الآية. لا تُصدر دِرَايَة أحكاماً شرعية ولا آراء من عندها.
          </p>
        </section>

        <section>
          <h2 className="mb-8 text-body font-semibold text-ink">مصادرنا</h2>
          <ul className="flex flex-col gap-4">
            <li>تفسير الطبري — محمد بن جرير الطبري</li>
            <li>تفسير ابن كثير — إسماعيل بن كثير</li>
            <li>تفسير السعدي — عبد الرحمن بن ناصر السعدي</li>
            <li>التفسير الميسر — نخبة من العلماء، مجمع الملك فهد لطباعة المصحف الشريف</li>
          </ul>
          <p className="mt-8">
            نصوص الآيات والتفاسير مأخوذة من مجموعة بيانات مفتوحة على GitHub
            (Mohamed-Nagdy/Quran-App-Data)، والتي تنقل بدورها هذه الكتب من تطبيق «آيات»
            (quran.ksu.edu.sa).
          </p>
          <p className="mt-8 text-body-sm text-ash">
            ملاحظة: لم نجد ملف ترخيص صريحاً لهذه البيانات في مصدرها. رخصة البيانات ومصدرها بحاجة
            إلى تأكيد قبل أي إطلاق عام لهذا التطبيق.
          </p>
        </section>

        <section>
          <h2 className="mb-8 text-body font-semibold text-ink">حالة المراجعة</h2>
          <p>
            بعض النصوص المعروضة لم تخضع بعد لمراجعة بشرية مقابل طبعة موثوقة، وتظهر عليها علامة
            «قيد المراجعة». لا تُعرض هذه العلامة على نص تمت مراجعته والتحقق منه.
          </p>
        </section>

        <section>
          <h2 className="mb-8 text-body font-semibold text-ink">حدودنا</h2>
          <ul className="flex flex-col gap-4">
            <li>البحث بالموضوع يعرض حتى ثلاث آيات مرتبطة، وقد لا يجد نتيجة لكل سؤال.</li>
            <li>بعض الآيات ليس لها نص تفسيري مستقل في بعض الكتب، فتظهر بطاقة فارغة توضح ذلك.</li>
            <li>دِرَايَة لا تجيب عن أسئلة خارج نطاق التفسير، ولا تُفتي في مسائل شرعية شخصية.</li>
          </ul>
        </section>

        {QURANPEDIA_ENABLED && (
          <section>
            <h2 className="mb-8 text-body font-semibold text-ink">مصدر إضافي</h2>
            <p>
              بعض البيانات في هذا الإصدار تُقرأ من{" "}
              <a href="https://quranpedia.net" className="text-deep-teal underline">
                quranpedia.net
              </a>
              .
            </p>
          </section>
        )}

        <section>
          <h2 className="mb-8 text-body font-semibold text-ink">التواصل</h2>
          <p>لأي ملاحظة عن دقة نص أو مصدر، يسعدنا تواصلك معنا.</p>
        </section>
      </div>
    </div>
  );
}
