# Facebook Posts — Single source of truth (Page: Madrasati TN)

This file is the ONLY place Page posts live. Posts for the owner's personal account or groups are never stored here (chat only, when asked).
Voice: the Page ("we"). Arabic only (Tunisian dialect allowed for community posts). Keep the "Gemini Notebook" watermark on infographics.

## How a post is defined
`### Post <n> — <title>` then fields: ID, Theme ID, Subject, Planned Date, Image (one) or Images (list, 2+), Link, Text.
Images decide the format: 0 = text post, 1 = photo post, 2+ = one multi-photo post. Facebook only builds a link card from the first link and not when photos are attached.

## How to publish (the only mechanism)
```
npx tsx scripts/fb-post-parascolaire.ts --list                 # status of every post
npx tsx scripts/fb-post-parascolaire.ts --dry-run --only <n>   # preview, no network
npx tsx scripts/fb-post-parascolaire.ts --only <n>             # live, one post, needs the owner's "go"
```
Dedupe: `parascolaire/outputs/fb-parascolaire-posted.json` (a posted id is never posted twice). Token and page id come from `.env`, never printed.
To add a post: append a block here, dry-run, get the owner's go, post. Do not create another script or file for posts.

Audit status: all 21 posts processed (posts 0-18 live, posts 19-20 scheduled natively on Facebook Graph API).
Cadence: 1 post/day. Scheduling (3/day via `scheduled_publish_time`) is specified in `FB-POSTS-PLAN.md` step 5b and not built.

---

### Post 0 — Launch Post (انطلاق ركن الأنشطة والملخصات)
- **ID:** `launch-post`
- **Theme ID:** `general-launch`
- **Subject:** عام
- **Planned Date:** Day 1
- **Image:** `parascolaire/publish/img/1ere-annee/evaluations-maths-arabe/01-lettres-et-sons/infographic.d3e78868.webp`
- **Link:** `https://madrastihub.com/parascolaire`
- **Text:**
جديد مدرستي تونس: ركن الأنشطة والملخصات البصرية لتلاميذ السنة الأولى! 📚✨
وفرنا لأولياء وتلاميذ السنة الأولى ابتدائي ملخصات بصرية مصورة وشرائح دروس تفاعلية في مادتي الرياضيات واللغة العربية، مجانية بالكامل ومفتوحة دون حاجة لتسجيل حساب.
تصفحوا كافة المحاور والدروس عبر الرابط:
👇
https://madrastihub.com/parascolaire

#مدرستي_تونس #السنة_الأولى_ابتدائي #التعليم_الابتدائي #تونس

---

### Post 1 — المشكلات الجمعية (5 + 7 = 12)
- **ID:** `23-problemes-additifs`
- **Theme ID:** `23-problemes-additifs`
- **Subject:** Mathématiques
- **Planned Date:** Day 2
- **Image:** `parascolaire/publish/img/1ere-annee/evaluations-maths-arabe/23-problemes-additifs/infographic.a1578346.webp`
- **Link:** `https://madrastihub.com/parascolaire/1ere-annee/evaluations-maths-arabe/23-problemes-additifs`
- **Text:**
كيف نُدرب طفل السنة الأولى على فهم المسألة الحسابية وتحويلها إلى عملية جمع؟ 🐿️🌰
ملخص بصري يوضح قصة السنجاب النشيط الذي يجمع 5 حبات بلوط، ثم يجد 7 حبات أخرى تحت الشجرة ليخزنها في جحره، فتتحول إلى معادلة صريحة: 5 + 7 = 12.
اكتشفوا تفاصيل الدرس والأنشطة عبر الرابط:
👇
https://madrastihub.com/parascolaire/1ere-annee/evaluations-maths-arabe/23-problemes-additifs

#مدرستي_تونس #السنة_الأولى_ابتدائي #رياضيات_ابتدائي

---

### Post 2 — الحروف والأصوات (ز، و، ح)
- **ID:** `01-lettres-et-sons`
- **Theme ID:** `01-lettres-et-sons`
- **Subject:** Arabe
- **Planned Date:** Day 3
- **Image:** `parascolaire/publish/img/1ere-annee/evaluations-maths-arabe/01-lettres-et-sons/infographic.d3e78868.webp`
- **Link:** `https://madrastihub.com/parascolaire/1ere-annee/evaluations-maths-arabe/01-lettres-et-sons`
- **Text:**
هل يخلط طفلكم بين أصوات الحروف المتشابهة في قراءة الكلمات؟ 🔤
لوحة تعليمية مصورة تجمع الحروف (ز، و، ح) مع أمثلة مشكولة: زورق يطفو بسلام، وحيد القرن السحري، وحلوى شهية بألوان زاهية لتثبيت النطق السليم.
شاهدوا المحور كاملاً على المنصة:
👇
https://madrastihub.com/parascolaire/1ere-annee/evaluations-maths-arabe/01-lettres-et-sons

#مدرستي_تونس #السنة_الأولى_ابتدائي #لغة_عربية

---

### Post 3 — مقارنة وترتيب الأعداد
- **ID:** `02-comparaison-et-rangement-des-nombres`
- **Theme ID:** `02-comparaison-et-rangement-des-nombres`
- **Subject:** Mathématiques
- **Planned Date:** Day 4
- **Image:** `parascolaire/publish/img/1ere-annee/evaluations-maths-arabe/02-comparaison-et-rangement-des-nombres/infographic.d8c6416c.webp`
- **Link:** `https://madrastihub.com/parascolaire/1ere-annee/evaluations-maths-arabe/02-comparaison-et-rangement-des-nombres`
- **Text:**
الترتيب التصاعدي والتنازلي ورموز المقارنة (> و <): كيف نبسطها لصغار السنة الأولى؟ ☁️⭐
دليل بصري يقدم الترتيب التصاعدي من الأصغر للأكبر مع السحب، والترتيب التنازلي مع النجوم، والمقارنة الملموسة بين الأحجام (أكبر من / أصغر من).
تابعوا شرائح الدرس والأنشطة عبر الرابط:
👇
https://madrastihub.com/parascolaire/1ere-annee/evaluations-maths-arabe/02-comparaison-et-rangement-des-nombres

#مدرستي_تونس #السنة_الأولى_ابتدائي #رياضيات_ابتدائي

---

### Post 4 — ترتيب الجمل والاتساق النصي
- **ID:** `09-ordonner-des-phrases-et-coherence-textuelle`
- **Theme ID:** `09-ordonner-des-phrases-et-coherence-textuelle`
- **Subject:** Arabe
- **Planned Date:** Day 5
- **Image:** `parascolaire/publish/img/1ere-annee/evaluations-maths-arabe/09-ordonner-des-phrases-et-coherence-textuelle/infographic.8e871e69.webp`
- **Link:** `https://madrastihub.com/parascolaire/1ere-annee/evaluations-maths-arabe/09-ordonner-des-phrases-et-coherence-textuelle`
- **Text:**
كيف يتعلم التلميذ ترتيب أحداث القصة واستعمال أدوات الربط؟ 🐻🍰
مشهد بصري مسلسَل يوضح خطوات صنع الكعكة خطوة بخطوة: خلط الدقيق والسكر، ثم الخبز بالفرن، وأخيراً التزيين بالفراولة الطازجة.
تصفحوا تفاصيل المحور على المنصة:
👇
https://madrastihub.com/parascolaire/1ere-annee/evaluations-maths-arabe/09-ordonner-des-phrases-et-coherence-textuelle

#مدرستي_تونس #السنة_الأولى_ابتدائي #لغة_عربية

---

### Post 5 — النقود: القطع والمليمات
- **ID:** `03-monnaie-pieces-et-millimes`
- **Theme ID:** `03-monnaie-pieces-et-millimes`
- **Subject:** Mathématiques
- **Planned Date:** Day 6
- **Image:** `parascolaire/publish/img/1ere-annee/evaluations-maths-arabe/03-monnaie-pieces-et-millimes/infographic.48437f6d.webp`
- **Link:** `https://madrastihub.com/parascolaire/1ere-annee/evaluations-maths-arabe/03-monnaie-pieces-et-millimes`
- **Text:**
التعامل بالقطع النقدية ومفهوم الشراء والادخار لتلاميذ السنة الأولى 🪙🎈
إنفوغرافيك يوضح التمييز بين القطع النقدية الذهبية والفضية، واستعمالها لشراء الهدايا أو حفظها داخل الحصالة.
طالعوا الدرس والأنشطة مجاناً:
👇
https://madrastihub.com/parascolaire/1ere-annee/evaluations-maths-arabe/03-monnaie-pieces-et-millimes

#مدرستي_تونس #السنة_الأولى_ابتدائي #رياضيات_ابتدائي

---

### Post 6 — إغناء الجمل بالمتممات
- **ID:** `12-enrichissement-de-phrases`
- **Theme ID:** `12-enrichissement-de-phrases`
- **Subject:** Arabe
- **Planned Date:** Day 7
- **Image:** `parascolaire/publish/img/1ere-annee/evaluations-maths-arabe/12-enrichissement-de-phrases/infographic.8e875862.webp`
- **Link:** `https://madrastihub.com/parascolaire/1ere-annee/evaluations-maths-arabe/12-enrichissement-de-phrases`
- **Text:**
من جملة قصيرة بسيطة إلى جملة ثرية: كيف نساعد الطفل على إغناء تعبيره؟ 🐶🧶
لوحة بصرية تبين تدرج جملة "يلعب الجرو": بالكرة، ثم بإضافة المكان "في الحديقة الواسعة"، ثم بإضافة الزمان والحال "صباحاً بسعادة".
اكتشفوا المحتوى التعليمي عبر الرابط:
👇
https://madrastihub.com/parascolaire/1ere-annee/evaluations-maths-arabe/12-enrichissement-de-phrases

#مدرستي_تونس #السنة_الأولى_ابتدائي #لغة_عربية

---

### Post 7 — عناصر السرد القصصي
- **ID:** `16-personnages-lieux-et-evenements-du-recit`
- **Theme ID:** `16-personnages-lieux-et-evenements-du-recit`
- **Subject:** Arabe
- **Planned Date:** Day 8
- **Image:** `parascolaire/publish/img/1ere-annee/evaluations-maths-arabe/16-personnages-lieux-et-evenements-du-recit/infographic.4b0f4ff1.webp`
- **Link:** `https://madrastihub.com/parascolaire/1ere-annee/evaluations-maths-arabe/16-personnages-lieux-et-evenements-du-recit`
- **Text:**
الشخصية، المكان، والحدث: العناصر الثلاثة لبناء قصة متكاملة 🚀🌌
إنفوغرافيك يجسد عناصر الإطار القصصي برحلة فضائية: رائد الفضاء (الشخصية)، المحطة الفضائية (المكان)، واكتشاف كوكب ملون (الحدث).
طالعوا المحور التعليمي على مدرستي تونس:
👇
https://madrastihub.com/parascolaire/1ere-annee/evaluations-maths-arabe/16-personnages-lieux-et-evenements-du-recit

#مدرستي_تونس #السنة_الأولى_ابتدائي #لغة_عربية

---

### Post 8 — المقطع المغلق وحرف التاء
- **ID:** `17-syllabe-fermee-et-lettre`
- **Theme ID:** `17-syllabe-fermee-et-lettre`
- **Subject:** Arabe
- **Planned Date:** Day 9
- **Image:** `parascolaire/publish/img/1ere-annee/evaluations-maths-arabe/17-syllabe-fermee-et-lettre/infographic.7d527ecf.webp`
- **Link:** `https://madrastihub.com/parascolaire/1ere-annee/evaluations-maths-arabe/17-syllabe-fermee-et-lettre`
- **Text:**
قراءة المقطع الساكن المغلق مع حرف التاء دون تردد 🐥📖
ملخص بصري يقدم كلمات مشكولة تحوي مقطعاً مغلقاً وحرف التاء: بُسْتانٌ مزهر، كَتْكوتٌ أصفر يلهو بمرح، ودَفْترٌ مزين برسوم رائعة.
تابعوا بقية الأنشطة والتمارين مجاناً:
👇
https://madrastihub.com/parascolaire/1ere-annee/evaluations-maths-arabe/17-syllabe-fermee-et-lettre

#مدرستي_تونس #السنة_الأولى_ابتدائي #لغة_عربية

---

### Post 9 — مواضع الهمزة
- **ID:** `18-la-hamza`
- **Theme ID:** `18-la-hamza`
- **Subject:** Arabe
- **Planned Date:** Day 10
- **Image:** `parascolaire/publish/img/1ere-annee/evaluations-maths-arabe/18-la-hamza/infographic.393b4ed8.webp`
- **Link:** `https://madrastihub.com/parascolaire/1ere-annee/evaluations-maths-arabe/18-la-hamza`
- **Text:**
أين تُكتب الهمزة؟ تبسيط مواضع الهمزة لصغار المرحلة الأولى 🐰🍹
لوحة تعليمية مصورة توضح رسم الهمزة: في أول الكلمة (أرنب أبيض)، في وسطها على الألف (كأس عصير منعش)، وفي طرفها (شاطئ هادئ).
تصفحوا المحور عبر المنصة:
👇
https://madrastihub.com/parascolaire/1ere-annee/evaluations-maths-arabe/18-la-hamza

#مدرستي_تونس #السنة_الأولى_ابتدائي #لغة_عربية

---

### Post 10 — التعويض وتحويل الجمل
- **ID:** `20-substitution-et-transformation-de-phrases`
- **Theme ID:** `20-substitution-et-transformation-de-phrases`
- **Subject:** Arabe
- **Planned Date:** Day 11
- **Image:** `parascolaire/publish/img/1ere-annee/evaluations-maths-arabe/20-substitution-et-transformation-de-phrases/infographic.1736ddaa.webp`
- **Link:** `https://madrastihub.com/parascolaire/1ere-annee/evaluations-maths-arabe/20-substitution-et-transformation-de-phrases`
- **Text:**
تغيير كلمة في الجملة لتوليد معانٍ جديدة: مهارة التعويض اللغوي 🐢🎈
مشاهد خيالية تتابع رحلات السلحفاة: تسافر بمنطاد كبير، ثم بمركبة فضائية، ثم على ظهر حصان لتدريب التلميذ على استبدال المتممات بسلاسة.
اكتشفوا المحتوى كاملاً عبر الرابط:
👇
https://madrastihub.com/parascolaire/1ere-annee/evaluations-maths-arabe/20-substitution-et-transformation-de-phrases

#مدرستي_تونس #السنة_الأولى_ابتدائي #لغة_عربية

---

### Post 11 — الإنتاج الكتابي: صور ومشاهد
- **ID:** `24-production-ecrite-images-et-scenes`
- **Theme ID:** `24-production-ecrite-images-et-scenes`
- **Subject:** Arabe
- **Planned Date:** Day 12
- **Image:** `parascolaire/publish/img/1ere-annee/evaluations-maths-arabe/24-production-ecrite-images-et-scenes/infographic.f29cc0dd.webp`
- **Link:** `https://madrastihub.com/parascolaire/1ere-annee/evaluations-maths-arabe/24-production-ecrite-images-et-scenes`
- **Text:**
من الصورة إلى التعبير الكتابي: كيف ينتج التلميذ قصة متناسقة؟ 🐝🌸
تسلسل بصري مترابط يروي قصة النحلة: تحط على الزهرة، تمتص الرحيق الحلو، ثم تطير نحو الخلية نشيطة.
شاهدوا دروس وتمارين الإنتاج الكتابي على مدرستي تونس:
👇
https://madrastihub.com/parascolaire/1ere-annee/evaluations-maths-arabe/24-production-ecrite-images-et-scenes

#مدرستي_تونس #السنة_الأولى_ابتدائي #لغة_عربية

---

### Post 12 — فهم النص المقروء
- **ID:** `22-comprehension-de-texte`
- **Theme ID:** `22-comprehension-de-texte`
- **Subject:** Arabe
- **Planned Date:** Day 13
- **Image:** `parascolaire/publish/img/1ere-annee/evaluations-maths-arabe/22-comprehension-de-texte/infographic.cdf3d982.webp`
- **Link:** `https://madrastihub.com/parascolaire/1ere-annee/evaluations-maths-arabe/22-comprehension-de-texte`
- **Text:**
القراءة مع الفهم: جمل مشكولة ومعبرة لتلاميذ السنة الأولى 🐒🐘
بطاقات قراءة مصورة لمواقف حية: قرد يتسلق الشجرة بخفة، فيل يرشق الماء بفرح، وزرافة تمضغ غصناً لذيذاً لتنمية الفهم القرائي.
طالعوا تفاصيل الدرس والأنشطة مجاناً:
👇
https://madrastihub.com/parascolaire/1ere-annee/evaluations-maths-arabe/22-comprehension-de-texte

#مدرستي_تونس #السنة_الأولى_ابتدائي #لغة_عربية

---

### Post 13 — الحروف والأصوات (ف، ق، ط)
- **ID:** `05-lettres-et-sons`
- **Theme ID:** `05-lettres-et-sons`
- **Subject:** Arabe
- **Planned Date:** Day 14
- **Image:** `parascolaire/publish/img/1ere-annee/evaluations-maths-arabe/05-lettres-et-sons/infographic.6b2628ad.webp`
- **Link:** `https://madrastihub.com/parascolaire/1ere-annee/evaluations-maths-arabe/05-lettres-et-sons`
- **Text:**
تمييز حروف الفاء والقاف والطاء نطاقاً ورسماً 🦋🏰
إنفوغرافيك يرسخ الحروف الثلاثة بجمل مشكولة دقيقة: فراشة ترقص بفرح، قلعة سحرية وردية اللون، وطائر النحام يقف بثبات.
اكتشفوا المحور عبر المنصة:
👇
https://madrastihub.com/parascolaire/1ere-annee/evaluations-maths-arabe/05-lettres-et-sons

#مدرستي_تونس #السنة_الأولى_ابتدائي #لغة_عربية

---

### Post 14 — قراءة: الطبيعة والفصول
- **ID:** `07-lecture-nature-et-saisons`
- **Theme ID:** `07-lecture-nature-et-saisons`
- **Subject:** Arabe
- **Planned Date:** Day 15
- **Image:** `parascolaire/publish/img/1ere-annee/evaluations-maths-arabe/07-lecture-nature-et-saisons/infographic.3663a915.webp`
- **Link:** `https://madrastihub.com/parascolaire/1ere-annee/evaluations-maths-arabe/07-lecture-nature-et-saisons`
- **Text:**
فصول السنة في نصوص قراءة قصيرة ومشكولة ⛄☀️🌾
لوحة مصورة تقرب مفاهيم الشتاء والصيف والربيع: رجل الثلج يبتسم بدفء، شمس مشرقة في الصيف، ونسيم يحرك سنابل القمح.
تابعوا المحور التفاعلي على الرابط:
👇
https://madrastihub.com/parascolaire/1ere-annee/evaluations-maths-arabe/07-lecture-nature-et-saisons

#مدرستي_تونس #السنة_الأولى_ابتدائي #لغة_عربية

---

### Post 15 — قراءة: الحياة اليومية
- **ID:** `11-lecture-vie-quotidienne`
- **Theme ID:** `11-lecture-vie-quotidienne`
- **Subject:** Arabe
- **Planned Date:** Day 16
- **Image:** `parascolaire/publish/img/1ere-annee/evaluations-maths-arabe/11-lecture-vie-quotidienne/infographic.e265b4af.webp`
- **Link:** `https://madrastihub.com/parascolaire/1ere-annee/evaluations-maths-arabe/11-lecture-vie-quotidienne`
- **Text:**
أنشطة الحياة اليومية: الرسم، الغذاء الصحي، والمطالعة 🎨🥗🦉
ملخص بصري يجمع ثلاثة مشاهد مألوفة للطفل: قطة ترسم لوحة ملونة، أرنب يتناول غداءً صحياً، وبومة تقرأ كتاباً مشوقاً.
تصفحوا الدرس والتمارين المرافقة مجاناً:
👇
https://madrastihub.com/parascolaire/1ere-annee/evaluations-maths-arabe/11-lecture-vie-quotidienne

#مدرستي_تونس #السنة_الأولى_ابتدائي #لغة_عربية

---

### Post 16 — Présentation pour les parents (Page)
- **ID:** `page-parents-intro`
- **Theme ID:** `general-parents`
- **Subject:** عام
- **Planned Date:** Day 17
- **Image:** `parascolaire/publish/img/1ere-annee/evaluations-maths-arabe/23-problemes-additifs/infographic.a1578346.webp`
- **Link:** `https://madrastihub.com/parascolaire/1ere-annee/evaluations-maths-arabe/23-problemes-additifs`
- **Text:**
أولياء الأمور، كم مرة شفتو في المجموعات: «من عنده تمارين مع الإصلاح؟» ولا صورة مسألة وصاحبها ينتظر من يحلها؟

في مدرستي تونس جمعنا الدعم المدرسي في بلاصة وحدة:

📚 كتب دعم مرتبة حسب السنة والمادة
🖼️ لكل موضوع ملخص مصوّر تكبروه وتنزلوه
🎞️ ولكل موضوع درس في شرائح تقراوه مع ولدكم، مع نسخة PDF
📱 يخدم على الهاتف، بالعربية والفرنسية

كل شي مجاني وبلا تسجيل. نحبو كل تلميذ يلقى دعم مدرسي مليح، حتى كان عيلته ما تقدرش تشري كتب الدعم 💚

شوفو مثال من درس السنة الأولى:
https://madrastihub.com/parascolaire/1ere-annee/evaluations-maths-arabe/23-problemes-additifs

والموقع الكامل: madrastihub.com

#مدرستي_تونس #الدعم_المدرسي #التعليم_الابتدائي #تونس

---

### Post 17 — السنة الخامسة: الأعداد العشرية (Page)
- **ID:** `page-5eme-intro`
- **Theme ID:** `5eme-exercices-mathematiques-corriges`
- **Subject:** Mathématiques
- **Planned Date:** Day 18
- **Images:**
  - `parascolaire/publish/img/5eme-annee/exercices-mathematiques-corriges/01-nombres-decimaux-notions-et-comparaison/infographic.386861bc.webp`
  - `parascolaire/publish/img/5eme-annee/exercices-mathematiques-corriges/02-operations-sur-les-decimaux/infographic.c86fdde6.webp`
  - `parascolaire/publish/img/5eme-annee/exercices-mathematiques-corriges/03-problemes-d-achat-vente-et-benefice/infographic.bab89851.webp`
- **Link:** `https://madrastihub.com/parascolaire/5eme-annee/exercices-mathematiques-corriges/01-nombres-decimaux-notions-et-comparaison`
- **Text:**
أولياء وتلاميذ السنة الخامسة 👋

موارد رياضيات مجانية: ملخصات مصورة ودروس في شرائح، بلاش وبلا تسجيل.

الموجود توا من كتاب «تمارين رياضيات مع الإصلاح»:

🔢 الأعداد العشرية: المفهوم والمقارنة
https://madrastihub.com/parascolaire/5eme-annee/exercices-mathematiques-corriges/01-nombres-decimaux-notions-et-comparaison

➕ العمليات على الأعداد العشرية
https://madrastihub.com/parascolaire/5eme-annee/exercices-mathematiques-corriges/02-operations-sur-les-decimaux

🛒 مسائل الشراء والبيع والربح
https://madrastihub.com/parascolaire/5eme-annee/exercices-mathematiques-corriges/03-problemes-d-achat-vente-et-benefice

كل موضوع فيه ملخص مصوّر ودرس في شرائح مع نسخة PDF. ونزيدو مواضيع جديدة للخامسة باستمرار.

شاركوها مع أولياء آخرين، وقولولنا شنوّة تحبو نزيدو 💚

#مدرستي_تونس #السنة_الخامسة #الرياضيات #الدعم_المدرسي

---

### Post 18 — السنة الأولى: أمثلة (Page)
- **ID:** `page-1ere-examples`
- **Theme ID:** `1ere-examples`
- **Subject:** Mathématiques + Arabe
- **Planned Date:** Day 19
- **Images:**
  - `parascolaire/publish/img/1ere-annee/evaluations-maths-arabe/23-problemes-additifs/infographic.a1578346.webp`
  - `parascolaire/publish/img/1ere-annee/evaluations-maths-arabe/12-enrichissement-de-phrases/infographic.8e875862.webp`
- **Link:** `https://madrastihub.com/parascolaire/1ere-annee/evaluations-maths-arabe/23-problemes-additifs`
- **Text:**
السنة الأولى: رياضيات وعربية بطريقة مبسطة وممتعة 📐✏️

📐 مسائل الجمع
https://madrastihub.com/parascolaire/1ere-annee/evaluations-maths-arabe/23-problemes-additifs

✏️ إثراء الجمل
https://madrastihub.com/parascolaire/1ere-annee/evaluations-maths-arabe/12-enrichissement-de-phrases

ملخص مصوّر ودرس في شرائح لكل موضوع، مجانًا وبلا تسجيل. وفي الموقع 24 موضوعًا للسنة الأولى.

#مدرستي_تونس #السنة_الأولى_ابتدائي #الدعم_المدرسي

---

### Post 19 — الذكاء الاصطناعي المجاني (Page)
- **ID:** `page-free-ai`
- **Theme ID:** `general-ai`
- **Subject:** عام
- **Planned Date:** Day 20
- **Image:** `public/assets/branding/facebook_cover.webp`
- **Link:** `https://madrastihub.com/solve`
- **Text:**
تصوّروا مساعد ذكاء اصطناعي قوي، مجاني، يخدم بالعربية والفرنسية وفي خدمة التلميذ والولي والمعلم 🤖

في مدرستي تونس تلقاو:

📸 صوّروا التمرين ولا الفرض واتحصلو على الحل مفسّر خطوة خطوة
📝 تلخيص الدروس وشرح الدرس بطريقة مبسطة
🧩 توليد تمارين مشابهة للتدرب، وتمرين جديد على الموضوع اللي تحبو
👩‍🏫 للمعلم: إنشاء تمارين وامتحانات جاهزة للطباعة، وتصحيحها، وتحضير المذكرات

بلاش اشتراك وبلا بطاقة بنكية. جربوه من هنا:
https://madrastihub.com/solve

وكان عندكم فكرة على أداة تحبو نزيدوها، قولولنا في التعليقات 💚

#مدرستي_تونس #الذكاء_الاصطناعي #الدعم_المدرسي #مجاني

---

### Post 20 — نداء للمتطوعين (Page)
- **ID:** `page-volunteers`
- **Theme ID:** `general-volunteers`
- **Subject:** عام
- **Planned Date:** Day 21
- **Image:** `public/assets/branding/facebook_cover.jpg`
- **Link:** `https://madrastihub.com`
- **Text:**
نبحثو على متطوعين معانا 🙏

مدرستي تونس مشروع مجاني وغير ربحي للتلاميذ والأولياء والمعلمين. والمشروع يكبر، ويلزمنا ناس تعاونا في:

✅ مراجعة المحتوى وتصحيح الأخطاء في الدروس والتمارين والإصلاح
✅ إدارة صفحات فيسبوك ونشر المحتوى في المجموعات والصفحات، أي مجموعة وأي صفحة. الهدف باش المعلومة توصل لأكبر عدد من العائلات
✅ تجربة المنصة وإعطاءنا رأيكم في اللي ينقص

وفي المقابل، كل متطوع ياخذ دخول كامل ومجاني:
📚 لكل التمارين والكتب
🤖 لأدوات الذكاء الاصطناعي
📝 للمذكرات وفضاء الإنشاء: تصميم تمرين، استنساخ تمرين، ابتكار تمرين، وتصحيح تمرين
📖 ولكتب الدعم المدرسي اللي عادة تتباع بالفلوس

ما فماش مقابل مادي، كل شي للمجتمع. اللي يحب يعاون يبعثلنا رسالة خاصة على الصفحة ولا يعلق "حاضر".

madrastihub.com

#مدرستي_تونس #تطوع #التعليم_الابتدائي
