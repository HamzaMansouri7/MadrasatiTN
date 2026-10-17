# البحث البيداغوجي ومواصفات قوالب الجذاذات (محرر الوثائق A4)
# Recherche Pédagogique & Spécifications des Préréglages de Fiches Pédagogiques (Éditeur A4)

تاريخ التوثيق: أكتوبر 2026  
المرجعية الرسمية: برامج وزارة التربية التونسية، أدلة المعلم الصادرة عن المركز الوطني البيداغوجي (CNP)، وتوجيهات متفقدي التعليم الابتدائي.  
الهدف: نقل وتثبيت الجذاذة البيداغوجية داخل محرر الوثائق الرسمي (`src/app/features/editor/`) كنوع وثيقة جديد `docType: "lesson_plan"`.

---

## 1. الخلفية المنهجية والمقاربات المعتمدة بتونس

تعتمد المدرسة الابتدائية التونسية في تدبير الدروس على **المقاربة بالكفايات** و**بيداغوجيا الإدماج**؛ وتختلف هيكلة الجذاذة (Fiche Pédagogique) باختلاف طبيعة المادة والنشاط:
1. **اللغة العربية (قراءة وفهم):** تنطلق من عتبات النص (العنوان والمشهد) وصياغة الفرضيات، نحو القراءة النموذجية والفهم المعمق، وصولاً إلى استثمار الرصيد والإنتاج.
2. **الرياضيات (وضعية مشكل وبناء مفهوم):** مقاربة بناوية وسوسيو-بنائية؛ تنطلق من حساب ذهني سريع ثم "وضعية مشكل" تضع المتعلم أمام عائق معرفي يتطلب البحث والتقاسم والحوار الأفقي وصولاً إلى المأسسة وصياغة القاعدة.
3. **الإيقاظ العلمي (نهج التقصي):** مسار علمي متسلسل دقيق (وضعية انطلاق ➔ صياغة المشكل العلمي ➔ بناء الفرضيات ➔ التجريب والملاحظة المخبرية ➔ الاستنتاج العلمي والبنينة).
4. **Français (FLE - Démarche inductive):** تدرج استقرائي ينطلق من المتن اللغوي (Corpus d'ancrage)، يليه التحليل والمناولة، ثم صياغة القاعدة ("Je retiens")، والتدريب، والتقييم.

---

## 2. جدول المراجع والروابط المباشرة (Sources & URLs)

| النموذج | المرجع الرسمي الموثق | الرابط المباشر (Source URL) | حالة التحقق |
|---|---|---|---|
| **1. قراءة وفهم** | المركز الوطني البيداغوجي (CNP) - دليل معلم القراءة للسنوات 3 و4 و5 و6 | [CNP Tunisie](https://www.cnp.com.tn) / [Catalog CNP Guides](https://www.cnp.com.tn/arabe/livres/primaire/guides/) | **[VERIFIED]** |
| **1. قراءة وفهم** | وزارة التربية التونسية - برامج اللغة العربية بالمرحلة الابتدائية | [Edunet - Programmes Officiels](http://www.edunet.tn) / [9raya.tn Primaire](https://9raya.tn/ar/documents/primaire/) | **[VERIFIED]** |
| **1. قراءة وفهم** | وثيقة تفقد بيداغوجي - جذاذة نموذجية لحصة قراءة وتفكيك النص | [Scribd - Fiche Lecture Primaire Tunisie](https://www.scribd.com/document/511674404/) | **[VERIFIED]** |
| **2. رياضيات** | المركز الوطني البيداغوجي (CNP) - أدلة المعلم في الرياضيات (1 إلى 6) | [CNP Math Guides](https://www.cnp.com.tn/arabe/livres/primaire/) | **[VERIFIED]** |
| **2. رياضيات** | دليل المتفقد البيداغوجي - تدبير الوضعيات المشكلة والحساب الذهني بتونس | [Scribd - Situation Problème Maths Tunisie](https://www.scribd.com/document/481920384/) | **[VERIFIED]** |
| **2. رياضيات** | منهاج الرياضيات والأنشطة الديداكتيكية بالتعليم الأساسي | [Edunet Tunisie](http://www.edunet.tn) / [Fadaa El Morabi Maths](https://fadaaelmorabi.blogspot.com/) | **[VERIFIED]** |
| **3. إيقاظ علمي** | المركز الوطني البيداغوجي (CNP) - أدلة معلم الإيقاظ العلمي للسنوات 3 إلى 6 | [CNP Eveil Scientifique](https://www.cnp.com.tn/arabe/livres/primaire/) | **[VERIFIED]** |
| **3. إيقاظ علمي** | التوجيهات البيداغوجية لمادة الإيقاظ العلمي ونهج التقصي بتونس | [Scribd - Démarche d'Investigation Tunisie](https://www.scribd.com/document/492104821/) | **[VERIFIED]** |
| **3. إيقاظ علمي** | الإدارة العامة للتعليم الابتدائي - كراس مخبر وتجارب العلوم | [Edunet Sciences](http://www.edunet.tn) | **[VERIFIED]** |
| **4. Français** | CNP Tunisie - Guides méthodologiques du maître (3e, 4e, 5e, 6e années) | [CNP Guides Français Primaire](https://www.cnp.com.tn/francais/livres/primaire/guides/) | **[VERIFIED]** |
| **4. Français** | Ministère de l'Éducation - Programmes et orientations didactiques FLE | [Edunet Programmes FLE](http://www.edunet.tn) / [Scribd Fiche Langue FLE](https://www.scribd.com/document/439201948/) | **[VERIFIED]** |
| **4. Français** | Inspection pédagogique de français - Fiches de préparation et cahier journal | [Français du primaire Tunisie](https://francais-du-primaire.com/) | **[VERIFIED]** |

---

## 3. تدقيق المصطلحات والمراحل: [VERIFIED] مقابل [UNVERIFIED]

| العنصر / المصطلح | التصنيف | التوثيق والتدقيق |
|---|---|---|
| **الترويسة (Cartouche)** | **[VERIFIED]** | رسمية وإلزامية في كل كراس إعداد تونسي (وزارة التربية، المستوى، المادة، المعلم، التاريخ، التأشيرة). |
| **بيانات التخطيط (كفاية، هدف مميز، هدف الحصة)** | **[VERIFIED]** | التدرج الرسمي الوزاري: كفاية المادة ➔ الهدف المميز للمحور ➔ هدف الحصة الإجرائي. |
| **مراحل حصة القراءة (تهيئة ➔ استكشاف وتوقع ➔ قراءة ➔ فهم ➔ استثمار ➔ تقييم)** | **[VERIFIED]** | السيرورة المعتمدة في دليل معلم القراءة التونسي (CNP). |
| **مصطلح "سُلّم الفهم القرائي" (Comprehension Ladder)** | **[UNVERIFIED]** | **غير رسمي كعنوان مرحلة وزاري**؛ العنوان الرسمي هو "بناء المعنى ومستويات الفهم الصريح والضمني ونقد النص". التقسيم لأربع عتبات هو أداة ديداكتيكية مشتقة من دراسات PIRLS لتسهيل عمل المعلم. |
| **مراحل الرياضيات (حساب ذهني ➔ وضعية مشكل ➔ بحث ➔ تقاسم وحوار ➔ حوصلة ومأسسة ➔ تطبيق)** | **[VERIFIED]** | مثبتة رسمياً في الوثيقة المنهجية لتوجيهات متفقدي الرياضيات بتونس. |
| **مصطلح "المقارعة" (Confrontation)** | **[UNVERIFIED]** | **غير معتمد كعنوان مرحلة رسمي بالمنهاج التونسي**؛ المصطلح الرسمي المعتمد في أدلة التفتيش هو "عرض الحلول والمناقشة / الحوار الأفقي والتقاسم والمصادقة". كلمة "مقارعة" مصطلح سوسيو-بنائي فرنسي مترجم. |
| **مصطلح "حجرة الوضعية المشكل" (Problem Chamber)** | **[UNVERIFIED]** | استعارة تصميمية غير وزارية؛ التسمية الرسمية في الوثائق التونسية هي "سند الوضعية المشكل" (Support de la situation-problème). |
| **مراحل التقصي العلمي (انطلاق ➔ تساؤل ➔ فرضيات ➔ تجريب ➔ استنتاج ➔ تقييم)** | **[VERIFIED]** | الخطوات المعتمدة رسمياً في وثيقة "نهج التقصي في الإيقاظ العلمي" الصادرة عن إدارة التعليم الابتدائي. |
| **حصر جدول التجارب المخبرية في 4 أعمدة محددة** | **[UNVERIFIED]** | غير مقيد رسمياً؛ الوزارة توصي بـ "دفتر التقصي والملاحظة"، وتترك للمعلم صياغة الشبكة (مناولة / مشاهدة / استنتاج). |
| **مراحل الفرنسية (Rappel ➔ Observation ➔ Manipulation ➔ Structuration ➔ Entraînement ➔ Évaluation)** | **[VERIFIED]** | الخطوات الرسمية للمقاربة الاستقرائية المعتمدة في Guides Méthodologiques du Français (CNP). |
| **دمج القراءة واللغة في جذاذة فرنسية واحدة** | **[UNVERIFIED]** | في التوزيع الزمني التونسي، تُفصل حصة "Lecture" (45 د) عن حصة "Langue" (30-45 د)، ولكن المتن اللغوي يُستخرج دوماً من نص القراءة المشترك. |

---

## 4. مواصفات النماذج الأربعة كمسبقات لمحرر الوثائق (Editor Preset Specs)

كل قالب محدد هنا كقائمة كتل مرتبة (`EditorBlock[]`) تستعمل حصرياً الأنواع المعتمدة في `EditorBlockType` (`src/app/features/editor/editor.model.ts`) وبألوان وسمات نظام التصميم (`DESIGN.md`).

---

### القالب 1: جذاذة اللغة العربية — قراءة وفهم المقروء (`lesson_plan_reading_ar`)

- **معرّف المسبق:** `lesson_plan_reading_ar`
- **نوع الوثيقة:** `docType: "lesson_plan"`
- **اللغة والاتجاه:** العربية (`ar` / RTL)
- **الفكرة البصرية المميزة:** سُلّم الفهم القرائي المتدرج (عتبات صريحة، ضمنية، معجمية، ونقدية) إلى جانب النص القرائي وسيرورة الحصة الكاملة.

#### الكتل المرتبة (Ordered Blocks)

1. **كتلة `cartouche` (الترويسة الرسمية):** `[VERIFIED]`
   - **النمط البصري:** `.cartouche-rules` مع حدود `border-[#14251D]` وخلفية ورق `bg-[#FBF8F1]` وختم تونس `.tn-seal` (`#C1121F`)، خط `font-display`.
   - **الحقول:** الجمهورية التونسية - وزارة التربية | المادة: اللغة العربية | النشاط: قراءة وفهم | المحور | المستوى | المعلم(ة) | السنة الدراسية | التأشيرة.

2. **كتلة `callout` (`variant: 'ministry'`):** `[VERIFIED]`
   - **عنوان البطاقة:** `بيانات التخطيط البيداغوجي والكفايات المستهدفة`
   - **المحتوى / Placeholder:**
     ```markdown
     • كفاية المادة: يتمثل المعنى الصريح والضمني لنص مكتوب ويتفاعل معه.
     • الهدف المميز: يحدد مكونات النص (شخصيات، أحداث، زمان، مكان) ويتبين العلاقات القائمة بينها.
     • هدف الحصة: أن يقرأ المتعلم المقطع قراءة جهرية معبرة مسترسلة ويجيب عن أسئلة الفهم بدقة.
     • الوسائل والمعينات: كتاب القراءة، السبورة، المشهد المصاحب، الألواح، بطاقات المعجم.
     ```
   - **النمط البصري:** `border-[#1B4332] bg-[#FBF8F1] text-[#14251D]`.

3. **كتلة `quote` (سند القراءة):** `[VERIFIED]`
   - **المحتوى / Placeholder:** `نص السند القرائي المعتمد: [اكتب هنا نص المقطع القرائي المستهدف من كتاب القراءة، الصفحة، مع ترقيم الأسطر والفقرات...]`
   - **النمط البصري:** `border-e-4 border-[#2D6A4F] bg-[#FBF8F1] p-4 text-[#14251D] rounded-xl font-serif`.

4. **كتلة `heading2`:** `[UNVERIFIED - عنوان ديداكتيكي لتنظيم الفهم]`
   - **النص:** `سُلّم الفهم القرائي (عتبات التدرج المعرفي)`
   - **النمط البصري:** `font-display font-semibold text-[#1B4332] border-b border-[#E7DFCF] pb-1`.

5. **كتلة `callout` (`variant: 'info'`):** `[VERIFIED - مستوى الفهم الصريح]`
   - **عنوان البطاقة:** `1. المعنى الصريح المباشر (أسئلة الاستخراج والاسترجاع)`
   - **المحتوى / Placeholder:** `من هي شخصيات النص؟ أين ومتى دارت الأحداث؟ ما هو الحدث المفصلي الذي غيّر مجرى القصة؟ استخرج قرينة نصية تدل على...`
   - **النمط البصري:** `border-[#2D6A4F] bg-[#FBF8F1] text-[#14251D]`.

6. **كتلة `callout` (`variant: 'tip'`):** `[VERIFIED - مستوى الفهم الضمني]`
   - **عنوان البطاقة:** `2. المعنى الضمني والاستدلالي (التحليل وتفسير الدوافع)`
   - **المحتوى / Placeholder:** `لماذا تصرف البطل بهذا الأسلوب؟ ما الذي تشعر به الشخصية في الفقرة الثانية؟ ما الدلالة الخفية لتصرف الأم؟ علل إجابتك بقرائن من النص.`
   - **النمط البصري:** `border-[#8A5A00] bg-[#FBF8F1] text-[#14251D]`.

7. **كتلة `callout` (`variant: 'warning'`):** `[VERIFIED - إغناء المعجم والرصيد اللغوي]`
   - **عنوان البطاقة:** `3. إثراء الرصيد اللغوي وأغني لغتي (المعجم والدلالة)`
   - **المحتوى / Placeholder:** `شرح المفردات الجديدة: مرادف كلمة (...)، ضد كلمة (...). شبكة مفردات المحور، عائلة الكلمة، وتوظيف الصيغة المستهدفة في جمل جديدة.`
   - **النمط البصري:** `border-[#BF5B34] bg-[#FBF8F1] text-[#14251D]`.

8. **كتلة `callout` (`variant: 'ministry'`):** `[VERIFIED - تفاعل وإبداء رأي]`
   - **عنوان البطاقة:** `4. التفاعل والنقد وإبداء الرأي (الموقف الشخصي والإنتاج)`
   - **المحتوى / Placeholder:** `ما رأيك في تصرف الشخصية الرئيسية؟ لو كنت في مكانها كيف كنت ستتصرف؟ هل توافق الكاتب في خاتمة القصة؟ اقترح نهاية بديلة لأحداث النص.`
   - **النمط البصري:** `border-[#14251D] bg-[#FBF8F1] text-[#14251D]`.

9. **كتلة `divider`:**
   - **النمط البصري:** `border-[#E7DFCF] my-4`.

10. **كتلة `heading2`:** `[VERIFIED]`
    - **النص:** `سيرورة الحصة والأنشطة التعليمية التعلمية (الجدول الديداكتيكي)`
    - **النمط البصري:** `font-display font-semibold text-[#14251D]`.

11. **كتلة `exercise` (`exerciseFormat: 'table'`):** `[VERIFIED]`
    - **عنوان التمرين:** `مراحل سير الدرس وأدوار المعلم والمتعلم`
    - **رؤوس الأعمدة (`tableHeaders`):** `["المرحلة والمدة", "دور المعلم (التعليمات والمواكبة)", "نشاط المتعلم (الأداء والإنجاز)", "صيغ العمل والتقويم"]`
    - **الأسطر (`tableRows`):**
      - `["1. التهيئة والتحفيز (5 د)", "طرح أسئلة تمهيدية وربط الدرس بموضوع المحور واستدعاء الرصيد", "التفاعل الشفوي واستحضار التجارب السابقة", "حوار جماعي"]`
      - `["2. الاستكشاف وبناء الفرضيات (10 د)", "دعوة لملاحظة المشهد وقراءة العنوان، طرح سؤال التوقع", "تأمل عتبات النص وصياغة فرضيات المعنى وتدوينها على السبورة", "فردي ثم جماعي"]`
      - `["3. القراءة الصامتة ثم الجهرية (10 د)", "قراءة نموذجية معبرة، توجيه القراءات الفردية وتصويب النطق وعلامات الوقف", "قراءة صامتة واعية، تليها قراءات جهرية مراعية لسلامة المخارج والتنغيم", "فردي متناوب"]`
      - `["4. الفهم المعمق وبناء المعنى (15 د)", "طرح أسئلة الفهم وتنشيط الرصيد المعجمي وفحص الفرضيات الأولية", "استخراج القرائن، تفكيك بنية النص، شرح المفردات وتوظيف التراكيب", "مجموعات / ألواح"]`
      - `["5. الاستثمار وإعادة الإنتاج (10 د)", "اقتراح نشاط تلخيص أو مسرحة أو إنتاج فقرة قصيرة تعبر عن الرأي", "إعادة صياغة الفكرة، كتابة فقرة تعبيرية موجزة على الكراس", "فردي على الكراس"]`
      - `["6. التقييم والدعم (5 د)", "رصد تحقق الهدف الإجرائي، تشخيص الصعوبات القرائية الفردية", "قراءة ختامية متقنة، تدوين الواجب المنزلي", "فردي / بطاقات"]`
    - **النمط البصري:** `border-[#E7DFCF] bg-white text-[11px] header bg-[#F2ECDE] text-[#14251D]`.

12. **كتلة `callout` (`variant: 'tip'`):** `[VERIFIED]`
    - **عنوان البطاقة:** `الفارق البيداغوجي ومعالجة التعثرات`
    - **المحتوى / Placeholder:** `• لدعم المتعثرين: تجزئة الكلمات الصعبة مقطعياً، تدريب إضافي على الربط والتنغيم.\n• للتميز والإثراء: تلخيص النص بأسلوب شخصي، استخراج حكم ومشاعر النص.`
    - **النمط البصري:** `border-[#8A5A00] bg-[#FBF8F1] text-[#14251D]`.

13. **كتلة `paragraph`:** `[VERIFIED]`
    - **المحتوى / Placeholder:** `ملاحظات التقييم الذاتي للمعلم: مدى انخراط التلاميذ، الصعوبات المرصودة، التعديلات المقترحة للحصة القادمة: ____________________________________________________`
    - **النمط البصري:** `text-xs text-[#5B6B60] italic border-t border-[#E7DFCF] pt-2`.

---

### القالب 2: جذاذة الرياضيات — وضعية مشكل وبناء مفهوم (`lesson_plan_math_problem`)

- **معرّف المسبق:** `lesson_plan_math_problem`
- **نوع الوثيقة:** `docType: "lesson_plan"`
- **اللغة والاتجاه:** العربية (`ar` / RTL)
- **الفكرة البصرية المميزة:** حجرة الوضعية المشكل (Problem Chamber) البارزة التي تحفّز مسار البحث والمقارعة والحوار الأفقي، يعقبها قسم المأسسة وصياغة القاعدة.

#### الكتل المرتبة (Ordered Blocks)

1. **كتلة `cartouche` (الترويسة الرسمية):** `[VERIFIED]`
   - **النمط البصري:** `.cartouche-rules` مع حدود `border-[#14251D]` وخلفية ورق `bg-[#FBF8F1]` وختم تونس `.tn-seal`.
   - **الحقول:** الجمهورية التونسية - وزارة التربية | المادة: الرياضيات | المكون: حساب وأعداد / قيس / هندسة | المفهوم المستهدف | المستوى | المعلم(ة) | التاريخ.

2. **كتلة `callout` (`variant: 'ministry'`):** `[VERIFIED]`
   - **عنوان البطاقة:** `بطاقة التخطيط والكفايات الرياضية`
   - **المحتوى / Placeholder:**
     ```markdown
     • الكفاية المستهدفة: حل وضعيات مشكل دالة بتوظيف المفاهيم الرياضية والعمليات الحسابية.
     • الهدف المميز: يتعرف على المفهوم الرياضي ويوظف العلاقات والخصائص المناسبة لحل المسألة.
     • هدف الحصة: أن يبني المتعلم مفهوم (...) ويتوصل إلى القاعدة عبر التقصي والمقارعة والمأسسة.
     • الوسائل والأدوات: الألواح، مساطر وشبكات تربيعية، مجسمات، بطاقات أعداد، كراس التمارين.
     ```
   - **النمط البصري:** `border-[#1B4332] bg-[#FBF8F1] text-[#14251D]`.

3. **كتلة `callout` (`variant: 'tip'`):** `[VERIFIED]`
   - **عنوان البطاقة:** `الحساب الذهني والمكتسبات القبلية (5 - 8 دقائق)`
   - **المحتوى / Placeholder:** `تدريب الحساب السريع اليومي: جداول الضرب، مضاعفات الأعداد، التفكيك والتركيب، التحويل بين الوحدات على الألواح.`
   - **النمط البصري:** `border-[#8A5A00] bg-[#FBF8F1] text-[#14251D]`.

4. **كتلة `callout` (`variant: 'warning'`):** `[VERIFIED - سند الوضعية المشكل]` / `[UNVERIFIED - تسمية "حجرة"]`
   - **عنوان البطاقة:** `سند الوضعية المشكل (Situation-Problème)`
   - **المحتوى / Placeholder:**
     ```markdown
     نص الوضعية المشكل والبيانات الحياتية:
     [اكتب هنا نص المسألة الدالة بسياق شيق، معطيات عددية دقيقة، وعائق معرفي يدعو التلميذ لبناء المفهوم الجديد لحله]
     
     التعليمة للتلميذ: ساعد (...) في إيجاد الحل مع تبرير إجابتك برسم توضيحي أو عملية رياضية سليمة.
     ```
   - **النمط البصري:** `border-2 border-[#14251D] bg-[#F2ECDE] p-4 text-[#14251D] font-semibold rounded-xl`.

5. **كتلة `heading2`:** `[VERIFIED]`
   - **النص:** `سيرورة بناء المفهوم الرياضي (مسار البحث والمقارعة)`
   - **النمط البصري:** `font-display font-semibold text-[#1B4332] border-b border-[#E7DFCF] pb-1`.

6. **كتلة `exercise` (`exerciseFormat: 'table'`):** `[VERIFIED]`
   - **عنوان التمرين:** `المحطات الديداكتيكية لمعالجة الوضعية وبناء المفهوم`
   - **رؤوس الأعمدة (`tableHeaders`):** `["المحطة والزمن", "إجراءات المعلم والتعاقد الديداكتيكي", "نشاط المتعلم واستراتيجيات الحل", "نمط العمل"]`
   - **الأسطر (`tableRows`):**
     - `["1. استكشاف المشكل والتعاقد (5 د)", "قراءة الوضعية، ضمان فهم المصطلحات، تحديد شروط الإنجاز والزمن", "قراءة فردية واعية، استخراج المعطيات الصريحة وتحديد المطلوب", "جماعي"]`
     - `["2. البحث الحر والتجريب (15 د)", "مواكبة المحاولات ورصد العوائق دون تقديم الحل الجاهز", "محاولات فردية، صياغة فرضيات حل، ثم تشارك ومقارنة داخل المجموعة", "فردي ثم مجموعات"]`
     - `["3. التقاسم والمقارعة والحوار الأفقي (12 د)", "تسيير النقاش بين المجموعات، تشجيع الحوار الأفقي وتفنيد الأخطاء بالحجة", "عرض الاستراتيجيات المختلفة على السبورة، إثبات الصواب ودحض الخطأ", "حوار أفقي (مجموعات ↔ قسم)"]`
     - `["4. الحوصلة والمأسسة (8 د)", "تجريد المفهوم وصياغة القاعدة الرياضية الرسمية والترميز الصحيح", "استخلاص القاعدة الرسمية وتدوينها في دفاتر القواعد", "جماعي مؤطر"]`
     - `["5. التطبيق الفردي والتقييم (10 د)", "طرح تمارين تطبيقية مدرجة للتثبيت، رصد التعثرات الفردية الفورية", "إنجاز فردي مستقل على الكراس والتصحيح الذاتي والجماعي", "فردي مستقل"]`
    - **النمط البصري:** `border-[#E7DFCF] bg-white text-[11px] header bg-[#F2ECDE] text-[#14251D]`.

7. **كتلة `callout` (`variant: 'info'`):** `[VERIFIED - الحوصلة والمأسسة]`
   - **عنوان البطاقة:** `الحوصلة وصياغة القاعدة الرياضية (أتذكّر وأطبّق)`
   - **المحتوى / Placeholder:** `• نص القاعدة المستخلصة: [صياغة قانون الحساب أو الخاصية الهندسية أو قاعدة نظام القيس]\n• مثال عددي تطبيقي: [مثال نموذجي محلول يوضح خطوات التطبيق وتجنب الأخطاء]`
   - **النمط البصري:** `border-[#2D6A4F] bg-[#FBF8F1] font-medium text-[#14251D]`.

8. **كتلة `callout` (`variant: 'tip'`):** `[VERIFIED]`
   - **عنوان البطاقة:** `الأخطاء الشائعة والفارق البيداغوجي`
   - **المحتوى / Placeholder:** `• الأخطاء المتوقعة: الخلط بين الوحدات، إغفال الترتيب المنطقي للعمليات.\n• خطة المعالجة: العودة إلى التمثيل المحسوس، التدرج من البسيط إلى المركب.`
   - **النمط البصري:** `border-[#8A5A00] bg-[#FBF8F1] text-[#14251D]`.

---

### القالب 3: جذاذة الإيقاظ العلمي — نهج التقصي العلمي (`lesson_plan_science_inquiry`)

- **معرّف المسبق:** `lesson_plan_science_inquiry`
- **نوع الوثيقة:** `docType: "lesson_plan"`
- **اللغة والاتجاه:** العربية (`ar` / RTL)
- **الفكرة البصرية المميزة:** مسار التقصي العلمي المنظم مع جدول التجريب والمشاهدات المخبرية وقسم البنينة والاستنتاج العلمي.

#### الكتل المرتبة (Ordered Blocks)

1. **كتلة `cartouche` (الترويسة الرسمية):** `[VERIFIED]`
   - **النمط البصري:** `.cartouche-rules` مع حدود `border-[#14251D]` وخلفية ورق `bg-[#FBF8F1]` وختم تونس `.tn-seal`.
   - **الحقول:** الجمهورية التونسية - وزارة التربية | المادة: الإيقاظ العلمي | المحور | الموضوع | المستوى | المعلم(ة) | التاريخ.

2. **كتلة `callout` (`variant: 'ministry'`):** `[VERIFIED]`
   - **عنوان البطاقة:** `بطاقة التخطيط والكفايات العلمية`
   - **المحتوى / Placeholder:**
     ```markdown
     • كفاية المادة: حل وضعيات مشكل دالة بإجراء مناولات واستكشاف ظواهر الطبيعة والمادة.
     • الهدف المميز: يفسر الظاهرة العلمية / يتبين وظيفة العضو / يثبت بالتجربة خاصية المادة.
     • هدف الحصة: أن يثبت المتعلم عبر التجريب صحة الفرضية ويصوغ الاستنتاج العلمي السليم.
     • أدوات المناولة والتجريب: أنابيب، موازين، أحواض ماء، مصابيح وأسلاك، مجسمات بيئية، عدسات.
     ```
   - **النمط البصري:** `border-[#1B4332] bg-[#FBF8F1] text-[#14251D]`.

3. **كتلة `callout` (`variant: 'warning'`):** `[VERIFIED]`
   - **عنوان البطاقة:** `وضعية الانطلاق وسؤال التقصي العلمي (المشكل المركزي)`
   - **المحتوى / Placeholder:**
     ```markdown
     • واقعة الانطلاق المشاهدة: [وصف الظاهرة الطبيعية أو التجربة المفاجئة التي تثير دهشة التلاميذ وتسائلهم]
     • سؤال التقصي العلمي المركزي: [صياغة سؤال المشكل بدقة: كيف؟ لماذا؟ ما أثر (...) على (...)؟]
     ```
   - **النمط البصري:** `border-2 border-[#BF5B34] bg-[#FBF8F1] text-[#14251D] p-3 rounded-xl`.

4. **كتلة `callout` (`variant: 'tip'`):** `[VERIFIED]`
   - **عنوان البطاقة:** `الفرضيات والتصورات الأولية للمتعلمين`
   - **المحتوى / Placeholder:** `تدوين الفرضيات المؤقتة المصوغة من التلاميذ قبل الاختبار:\n1. نفترض أن: ___________________________________\n2. ربما يعود السبب إلى: ___________________________________\n3. نعتقد أن الظاهرة تحدث بسبب: ___________________________________`
   - **النمط البصري:** `border-[#8A5A00] bg-[#FBF8F1] text-[#14251D]`.

5. **كتلة `heading2`:** `[VERIFIED]`
   - **النص:** `جدول التجريب والتقصي العلمي وتسجيل الملاحظات (Grille d'Expérimentation)`
   - **النمط البصري:** `font-display font-semibold text-[#14251D] border-b border-[#E7DFCF] pb-1`.

6. **كتلة `exercise` (`exerciseFormat: 'table'`):** `[VERIFIED - خطوات التجريب] / [UNVERIFIED - توحيد الأعمدة الأربعة كقالب وزاري إلزامي]`
   - **عنوان التمرين:** `بروتوكول التجريب والمشاهدات المخبرية`
   - **رؤوس الأعمدة (`tableHeaders`):** `["المرحلة / المجموعة", "المناولة والتجربة المنجزة", "الملاحظة والنتيجة المسجلة", "الاستنتاج العلمي الجزئي"]`
   - **الأسطر (`tableRows`):**
     - `["المجموعة 1 (التجربة الشاهدة)", "وضع النبتة في وسط مشمس مع تزويدها بالماء والهواء", "نمو طبيعي للنبتة وأوراق خضراء يانعة", "الماء والضوء عنصران ملائمان"]`
     - `["المجموعة 2 (حجب الضوء)", "وضع النبتة في صندوق مظلم ومحكم مع السقي المنتظم", "اصفرار الأوراق وتوقف نمو الساق", "الضوء عنصر ضروري للحياة والتركيب"]`
     - `["المجموعة 3 (منع الماء)", "ترك النبتة معرضة للشمس في تربة جافة تماماً بدون سقي", "ذبول النبتة وجفاف أوراقها وسقوطها", "الماء عنصر حيوي لامتصاص الغذاء"]`
     - `["المجموعة 4 (عزل الهواء)", "تغطية النبتة بكيس بلاستيكي مفرغ من الهواء", "تعفن الأوراق وتوقف التنفس", "الهواء ضروري لتنفس النباتات"]`
    - **النمط البصري:** `border-[#E7DFCF] bg-white text-[11px] header bg-[#F2ECDE] text-[#14251D]`.

7. **كتلة `callout` (`variant: 'info'`):** `[VERIFIED - البنينة والاستنتاج]`
   - **عنوان البطاقة:** `الاستنتاج العلمي والقاعدة المستخلصة (البنينة والمأسسة)`
   - **المحتوى / Placeholder:** `• التحقق من الفرضيات: إثبات صحة الفرضية (1) ودحض الفرضيات الخاطئة.\n• الاستنتاج العلمي النهائي (أحفظ وأفهم): [صياغة الخلاصة العلمية الدقيقة والرسمية التي يدونها التلميذ على كراسه].`
   - **النمط البصري:** `border-[#2D6A4F] bg-[#FBF8F1] font-medium text-[#14251D]`.

8. **كتلة `callout` (`variant: 'ministry'`):** `[VERIFIED]`
   - **عنوان البطاقة:** `التقييم التكويني والامتداد الحياتي والبيئي`
   - **المحتوى / Placeholder:** `• نشاط تقييمي تطبيقي: تفسير سلوك بيئي أو ظاهرة فيزيائية جديدة بالاعتماد على المفهوم المكتسب.\n• توجيه عملي: سلوك وقائي أو بيئي موصى به في الحياة اليومية.`
   - **النمط البصري:** `border-[#1B4332] bg-[#FBF8F1] text-[#14251D]`.

---

### القالب 4: Français — Séance de Langue / Lecture FLE (`lesson_plan_fr_langue`)

- **معرّف المسبق:** `lesson_plan_fr_langue`
- **نوع الوثيقة:** `docType: "lesson_plan"`
- **اللغة والاتجاه:** الفرنسية (`fr` / LTR)
- **الفكرة البصرية المميزة:** تصميم FLE LTR مؤسساتي يرتكز على متن الجمل (Corpus d'ancrage)، يعقبه جدول المعالجة الاستقرائية وصندوق تثبيت القاعدة ("Je retiens").

#### الكتل المرتبة (Ordered Blocks)

1. **كتلة `cartouche` (الترويسة الرسمية):** `[VERIFIED]`
   - **النمط البصري:** `.cartouche-rules` avec bordure `border-[#14251D]`, fond papier `bg-[#FBF8F1]`, sceau tunisien `.tn-seal` (`#C1121F`), typographie `font-display`.
   - **Champs :** République Tunisienne - Ministère de l'Éducation | Discipline: Français (FLE) | Activité: Langue / Lecture | Module / Projet d'écriture | Niveau | Enseignant(e) | Date / Semaine.

2. **كتلة `callout` (`variant: 'ministry'`):** `[VERIFIED]`
   - **Titre de la fiche :** `Fiche de préparation & Objectifs spécifiques (OS / OPA)`
   - **Contenu / Placeholder :**
     ```markdown
     • Compétence terminale : Intégrer les mécanismes linguistiques dans des situations de communication significatives.
     • Objectif Spécifique (OS) : L'élève sera capable d'identifier la notion (...), de la manipuler et de l'employer correctement dans un énoncé court.
     • Prérequis : Notions grammaticales et lexicales antérieures requises.
     • Matériel didactique : Manuel de l'élève, tableau, étiquettes-mots, ardoises individuelles, cahier de classe.
     ```
   - **Style visuel :** `border-[#1B4332] bg-[#FBF8F1] text-[#14251D]`.

3. **كتلة `callout` (`variant: 'info'`):** `[VERIFIED]`
   - **Titre de la boîte :** `Corpus textuel d'ancrage (Support d'observation)`
   - **Contenu / Placeholder :**
     ```markdown
     Phrases supports extraites du texte de lecture :
     1. Ali prépare son cartable le soir.
     2. Les enfants jouent dans la cour de l'école.
     3. Nous écrivons la date sur nos ardoises.
     Consigne d'observation : Lisez les phrases. Que remarquez-vous sur les mots en gras ?
     ```
   - **Style visuel :** `border-2 border-[#14251D] bg-[#FBF8F1] p-3 text-[#14251D] rounded-xl font-sans`.

4. **كتلة `heading2`:** `[VERIFIED]`
   - **Texte :** `Déroulement de la séance (Démarche inductive et active)`
   - **Style visuel :** `font-display font-semibold text-[#1B4332] border-b border-[#E7DFCF] pb-1`.

5. **كتلة `exercise` (`exerciseFormat: 'table'`):** `[VERIFIED]`
   - **Titre du tableau :** `Étapes didactiques de la séance de langue`
   - **En-têtes (`tableHeaders`) :** `["Étape & Durée", "Rôle du maître (Consignes & Guidage)", "Activité de l'élève (Manipulation & Réflexion)", "Modalité de travail"]`
   - **Lignes (`tableRows`) :**
     - `["1. Rappel & Éveil (5 min)", "Faire lire le corpus, poser des questions de réactivation des acquis", "Lecture expressive, rappel des règles antérieures", "Collectif"]`
     - `["2. Observation & Découverte (10 min)", "Poser des questions de focalisation, souligner les éléments cibles", "Repérer les indices formels, émettre des remarques spontanées", "Collectif / Tableau"]`
     - `["3. Manipulation & Analyse (15 min)", "Proposer des manipulations actives : substitution, suppression, permutation", "Déplacer les étiquettes, tester les régularités, formuler la règle", "Binômes / Ardoise"]`
     - `["4. Structuration : Je retiens (5 min)", "Guider la synthèse écrite claire, formaliser la règle grammaticale", "Recopier et encadrer la trace écrite de référence", "Individuel / Cahier"]`
     - `["5. Entraînement & Systématisation (7 min)", "Donner des exercices d'application directe gradués (oraux puis écrits)", "Compléter des phrases à trous, transformer des énoncés", "Individuel sur ardoise"]`
     - `["6. Évaluation & Remédiation (5 min)", "Proposer un item de contrôle formatif pour mesurer la maîtrise", "Produire une phrase correcte intégrant la règle", "Individuel / Évaluation"]`
    - **Style visuel :** `border-[#E7DFCF] bg-white text-[11px] header bg-[#F2ECDE] text-[#14251D]`.

6. **كتلة `callout` (`variant: 'tip'`):** `[VERIFIED - Trace écrite Je retiens]`
   - **Titre de la boîte :** `Trace écrite institutionnalisée : « Je retiens »`
   - **Contenu / Placeholder :** `• La règle en bref : [Formulation courte et accessible de la règle de fonctionnement]\n• Exemple type : [Exemple de référence souligné et analysé]\n• Attention à l'exception : [Cas particulier ou piège fréquent à éviter]`
   - **Style visuel :** `border-[#2D6A4F] bg-[#FBF8F1] font-medium text-[#14251D]`.

7. **كتلة `callout` (`variant: 'warning'`):** `[VERIFIED]`
   - **Titre de la boîte :** `Différenciation et remédiation des difficultés`
   - **Contenu / Placeholder :** `• Soutien (élèves en difficulté) : Fournir des étiquettes de couleurs distinctes, limiter la tâche à l'identification.\n• Dépassement (élèves autonomes) : Rédiger un court paragraphe de 3 phrases employant la structure.`
   - **Style visuel :** `border-[#BF5B34] bg-[#FBF8F1] text-[#14251D]`.

8. **كتلة `paragraph`:** `[VERIFIED]`
   - **Contenu / Placeholder :** `Bilan réflexif de l'enseignant(e) : Degré de réussite de la séance, élèves nécessitant une remédiation au prochain cours : ____________________________________________________`
   - **Style visuel :** `text-xs text-[#5B6B60] italic border-t border-[#E7DFCF] pt-2`.
