/** Fixed Arabic copy for non-search intents (spec section 10). Exact text — do not paraphrase. */
export const FIXED_MESSAGES = {
  out_of_scope:
    "دِرَايَة أداة بحث مختصة في كتب التفسير، ولا تستطيع الحديث في مواضيع خارج ذلك. اسألني عن آية أو موضوع قرآني وسأبحث لك في التفاسير.",
  no_result:
    "لم أجد في التفاسير المتاحة نصاً يطابق طلبك. جرّب ذكر اسم السورة ورقم الآية، أو اكتب جزءاً من نص الآية.",
  ruling_request:
    "دِرَايَة لا تُفتي ولا تُصدر أحكاماً شخصية، وليست بديلاً عن أهل العلم. إن كان سؤالك متعلقاً بآية، فاذكرها وسأعرض لك ما قاله المفسرون عنها، وللحكم في مسألتك راجع أهل العلم.",
  about_app:
    "أنا دِرَايَة، أداة بحث في كتب التفسير. أعرض لك ما قاله المفسرون عن الآية أو الموضوع بنصوصهم ومراجعهم، وأساعدك على حفظ ما تجده في مشاريع بحثية.",
  distress:
    "أسأل الله أن يفرّج عنك. دِرَايَة أداة بحث ولا تستطيع مساندتك في هذا، فأنصحك بالحديث مع شخص تثق به أو مختص يقف معك.",
} as const;

export const SUGGESTIONS = [
  "ما تفسير آية الكرسي؟",
  "ماذا قال المفسرون عن الصبر؟",
  "تفسير: إن مع العسر يسرا",
] as const;

/** Suggestion rows appear only after these three intents (spec section 10). */
export const INTENTS_WITH_SUGGESTIONS = new Set(["out_of_scope", "no_result", "about_app"]);
