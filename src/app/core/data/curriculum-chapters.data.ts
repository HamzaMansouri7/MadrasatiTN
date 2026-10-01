export interface CurriculumChapter {
  id: string;
  grade: string;
  subject: string;
  trimester: 'Trimestre 1' | 'Trimestre 2' | 'Trimestre 3';
  titleAr: string;
  titleFr: string;
  keyCompetencyAr: string;
  keyCompetencyFr: string;
  suggestedPromptsAr: string[];
  suggestedPromptsFr: string[];
}

export const TUNISIAN_CURRICULUM_CHAPTERS: CurriculumChapter[] = [
  // ================= 4ÈME ANNÉE =================
  // Mathématiques 4ème
  {
    id: 'math-4-ch1',
    grade: '4ème Année',
    subject: 'Mathématiques',
    trimester: 'Trimestre 1',
    titleAr: 'الأعداد ذات 5 و 6 أرقام: القراءة والكتابة والتفكيك والترتيب',
    titleFr: 'Nombres à 5 et 6 chiffres : lecture, écriture et comparaison',
    keyCompetencyAr: 'توظيف جدول المنازل وتفكيك الأعداد في نطاق المئات والآلاف والملايين لحل وضعيات عددية.',
    keyCompetencyFr: 'Utiliser la table des classes pour lire, décomposer et ordonner les grands nombres.',
    suggestedPromptsAr: [
      'كيفية معالجة خلط التلميذ بين منزلة الآلاف ومنزلة العشرات في الأعداد ذات 6 أرقام',
      '3 أنشطة تفاعلية لتثبيت جدول المنازل وتفكيك الأعداد الكبيرة للأولياء',
      'طريقة تدريجية لصياغة وضعية إدماجية واقعية في التفكيك الجمعي والضربي',
    ],
    suggestedPromptsFr: [
      'Comment remédier à la confusion des classes de nombres à 6 chiffres',
      '3 Activités visuelles pour maîtriser la table de numération',
      'Créer une situation-problème concrète avec les grands nombres',
    ],
  },
  {
    id: 'math-4-ch2',
    grade: '4ème Année',
    subject: 'Mathématiques',
    trimester: 'Trimestre 1',
    titleAr: 'الضرب في عدد ذي رقمين والخاصية التوزيعية',
    titleFr: 'Multiplication par un nombre à deux chiffres et distributivité',
    keyCompetencyAr: 'حساب جداء عددين وتوظيف التفكيك لحساب الجداءات ذهنياً وكتابياً.',
    keyCompetencyFr: 'Calculer le produit de deux nombres entiers et utiliser la distributivité.',
    suggestedPromptsAr: [
      'خطوات علاج تعثر حفظ جداول الضرب وطريقة التفكيك الذكي',
      'أخطاء شائعة في وضع الصفر عند الضرب في العشرات وكيفية تداركها',
      'دليل الولي لتدريب الطفل على تقنية الضرب العمودي دون توتر',
    ],
    suggestedPromptsFr: [
      'Astuces pour mémoriser les tables de multiplication sans blocage',
      'Erreurs fréquentes lors de la multiplication à deux chiffres',
      'Guide parent pour accompagner l’apprentissage de la multiplication',
    ],
  },
  {
    id: 'math-4-ch3',
    grade: '4ème Année',
    subject: 'Mathématiques',
    trimester: 'Trimestre 2',
    titleAr: 'القسمة الإقليدية: البحث عن الخارج والباقي وحل المسائل',
    titleFr: 'Division euclidienne : quotient, reste et résolution de problèmes',
    keyCompetencyAr: 'تعرف مفهوم القسمة الإقليدية وحصر الخارج في مسائل التوزيع المتساوي.',
    keyCompetencyFr: 'Découvrir la division euclidienne et encadrer le quotient.',
    suggestedPromptsAr: [
      'كيف أهيئ تلاميذ السنة الرابعة لاستيعاب آلية القسمة الإقليدية عبر التوزيع الحقيقي',
      'التمييز بين وضعيات الضرب ووضعيات القسمة في فهم نصوص المسائل',
      'معالجة تعثر تحديد عدد أرقام خارج القسمة',
    ],
    suggestedPromptsFr: [
      'Comment introduire la division euclidienne par la manipulation concrète',
      'Distinguer multiplication et division dans les énoncés de problèmes',
      'Techniques pour encadrer le quotient sans erreur',
    ],
  },
  {
    id: 'math-4-ch4',
    grade: '4ème Année',
    subject: 'Mathématiques',
    trimester: 'Trimestre 1',
    titleAr: 'الزوايا وتعامد وتوازي المستقيمات والأشكال الهندسية',
    titleFr: 'Angles, droites perpendiculaires et parallèles, figures planes',
    keyCompetencyAr: 'استعمال الكوس والمسطرة لرسم المستقيمات المتعامدة والمتوازية والتمييز بين الزوايا.',
    keyCompetencyFr: 'Utiliser l’équerre et la règle pour tracer droites et angles droits.',
    suggestedPromptsAr: [
      'دليل عملي لتمكين التلميذ من الاستعمال السليم للكوس والمسطرة',
      'الأنشطة الهندسية الاستكشافية في محيط الطفل المنزلي والمدرسي',
      'تمارين علاجية للتمييز بين الزوايا القائمة والحادة والمنفرجة',
    ],
    suggestedPromptsFr: [
      'Conseils pour manier l’équerre et la règle avec précision',
      'Activités de repérage d’angles droits dans la vie quotidienne',
      'Différencier angles aigus, droits et obtus avec des gabarits',
    ],
  },

  // اللغة العربية 4ème
  {
    id: 'ar-4-ch1',
    grade: '4ème Année',
    subject: 'اللغة العربية',
    trimester: 'Trimestre 1',
    titleAr: 'دروب الحوار: قراءة النصوص المسترسلة وإغناء المعجم',
    titleFr: 'Lecture et compréhension : Les chemins du dialogue',
    keyCompetencyAr: 'قراءة نص سردي حواري قراءة جاهرة ونطق سليم مع استخراج القرائن والإجابة عن أسئلة الفهم.',
    keyCompetencyFr: 'Lire de manière expressive un texte dialogué et répondre aux questions de compréhension.',
    suggestedPromptsAr: [
      'استراتيجيات تدريب التلميذ على قراءة النصوص الحوارية بطلاقة وتلوين صوتي',
      'كيف ينمي الولي الرصيد اللغوي لطفله أثناء قراءة قصص المطالعة',
      'شبكة تقييم الفهم القرائي وتجاوز الإجابات المقتضبة لدى المتعلمين',
    ],
    suggestedPromptsFr: [
      'Stratégies pour développer la lecture expressive chez l’enfant',
      'Enrichir le vocabulaire arabe par la lecture partagée en famille',
      'Grille de remédiation pour la compréhension de texte',
    ],
  },
  {
    id: 'ar-4-ch2',
    grade: '4ème Année',
    subject: 'اللغة العربية',
    trimester: 'Trimestre 1',
    titleAr: 'قواعد اللغة: الجملة الفعلية (الفعل والفاعل والمفعول به)',
    titleFr: 'Grammaire arabe : La phrase verbale (Verbe, Sujet, Complément)',
    keyCompetencyAr: 'تمييز عناصر الجملة الفعلية البسيطة واستعمال علامات الإعراب الأصلية (الضمة والفتحة).',
    keyCompetencyFr: 'Identifier les constituants de la phrase verbale et les marques de flexion.',
    suggestedPromptsAr: [
      'طريقة مبسطة لشرح الفرق بين الفاعل والمفعول به دون تعقيدات إعرابية',
      'ألعاب لغوية صفية لتثبيت علامات الإعراب (الرفع بالضمة والنصب بالفتحة)',
      'تدارك الخلط بين الجملة الفعلية والجملة الاسمية في الإنتاج الكتابي',
    ],
    suggestedPromptsFr: [
      'Méthode ludique pour distinguer le sujet du complément en arabe',
      'Jeux grammaticaux pour mémoriser les déclinaisons (Damma, Fatha)',
      'Corriger les erreurs fréquentes dans la phrase verbale arabe',
    ],
  },
  {
    id: 'ar-4-ch3',
    grade: '4ème Année',
    subject: 'اللغة العربية',
    trimester: 'Trimestre 1',
    titleAr: 'الإنتاج الكتابي: بناء نص سردي وصياغة مقاطع حوارية',
    titleFr: 'Production écrite : Récit narratif et insertion de dialogues',
    keyCompetencyAr: 'إنتاج نص سردي متماسك ينقل حدثاً مع تضمين حوار ذي دلالة بيداغوجية واحترام علامات التنقيط.',
    keyCompetencyFr: 'Rédiger un court récit cohérent intégrant des répliques de dialogue.',
    suggestedPromptsAr: [
      'كيف نساعد التلميذ على التخلص من تكرار الأفعال (ثم، وبعد ذلك، وقال) في الإنتاج الكتابي',
      'خطة تدريبية خطوة بخطوة لصياغة وضعية بداية ومأزق وانفراج',
      'بنك عبارات وأرصدة بيداغوجية لإثراء الوصف والتعبير عن المشاعر',
    ],
    suggestedPromptsFr: [
      'Éviter les répétitions de connecteurs dans le récit écrit',
      'Structure pas à pas du schéma narratif (situation initiale, problème, résolution)',
      'Boîte à mots pour enrichir la description des émotions',
    ],
  },

  // Français 4ème
  {
    id: 'fr-4-ch1',
    grade: '4ème Année',
    subject: 'Français',
    trimester: 'Trimestre 1',
    titleAr: 'الفرنسية: بنية الجملة (GNS + GV) وعلامات الترقيم',
    titleFr: 'Module 1 : Structure de la phrase (GNS + GV) et ponctuation',
    keyCompetencyAr: 'تعرف عناصر الجملة البسيطة (مبتدأ وخبر فعلي) واستعمال علامات الترقيم بشكل ملائم.',
    keyCompetencyFr: 'Identifier le groupe nominal sujet et le groupe verbal, utiliser les majuscules et les points.',
    suggestedPromptsAr: [
      'كيفية مساعدة التلميذ على التمييز بين الفاعل والفعل في الجملة الفرنسية',
      'تمارين تدريبية ممتعة لمعالجة صعوبات التوافق بين الفاعل والفعل',
      'نصائح للأولياء لدعم أبنائهم في قراءة نصوص اللغة الفرنسية',
    ],
    suggestedPromptsFr: [
      'Comment aider l’élève à repérer facilement le GNS et le GV',
      'Exercices interactifs pour consolider l’accord sujet-verbe',
      'Guide pour encourager la lecture autonome du français à la maison',
    ],
  },

  // Éveil Scientifique 4ème
  {
    id: 'sci-4-ch1',
    grade: '4ème Année',
    subject: 'Éveil Scientifique',
    trimester: 'Trimestre 1',
    titleAr: 'الإيقاظ العلمي: التغذية والهضم وصحة الأسنان عند الإنسان',
    titleFr: 'Nutrition, digestion et santé bucco-dentaire chez l’humain',
    keyCompetencyAr: 'تعرف المجموعات الغذائية ومسار اللقمة في الأنبوب الهضمي وقواعد حفظ الصحة.',
    keyCompetencyFr: 'Identifier les groupes d’aliments, le trajet digestif et les règles d’hygiène.',
    suggestedPromptsAr: [
      'أنشطة تجريبية صفية بسيطة لشرح مفهوم الهضم الميكانيكي والكيميائي',
      'دليل بيداغوجي لتوعية الأولياء حول الوجبة المدرسية المتوازنة',
      'تجارب منزلية للكشف عن السكريات والنشويات في الأغذية',
    ],
    suggestedPromptsFr: [
      'Expériences simples pour comprendre la digestion des aliments',
      'Guide pédagogique sur le goûter équilibré à l’école primaire',
      'Activités pratiques pour observer l’hygiène bucco-dentaire',
    ],
  },

  // ================= 5ÈME ANNÉE =================
  // Mathématiques 5ème
  {
    id: 'math-5-ch1',
    grade: '5ème Année',
    subject: 'Mathématiques',
    trimester: 'Trimestre 1',
    titleAr: 'الأعداد الكبيرة (الملايين والملايير) وحساب المساحات والمحيطات',
    titleFr: 'Grands nombres (Millions & Milliards), Périmètres et Aires',
    keyCompetencyAr: 'كتابة وتفكيك الأعداد في فئة الملايين وتوظيف قواعد حساب محيط ومساحة المستطيل والمربع.',
    keyCompetencyFr: 'Maîtriser les grands nombres et calculer le périmètre et l’aire des polygones.',
    suggestedPromptsAr: [
      'معالجة تعثر التمييز بين مفهوم المحيط ومفهوم المساحة في الهندسة',
      'طرق ذكية لقراءة وكتابة الأعداد التي تحتوي على أصفار متتالية في الملايين',
      'صياغة مسائل مركبة من واقع الفلاحة والبناء في تونس',
    ],
    suggestedPromptsFr: [
      'Différencier clairement périmètre et surface avec des manipulations',
      'Éviter les erreurs de lecture dans les nombres à plusieurs millions',
      'Concevoir des problèmes appliqués au contexte agricole tunisien',
    ],
  },
  {
    id: 'math-5-ch2',
    grade: '5ème Année',
    subject: 'Mathématiques',
    trimester: 'Trimestre 2',
    titleAr: 'الأعداد العشرية: الجمع والطرح والضرب والتحويلات',
    titleFr: 'Nombres décimaux : opérations fondamentales et conversions',
    keyCompetencyAr: 'مقارنة وترتيب الأعداد العشرية وإنجاز العمليات الأربع مع ضبط موقع الفاصل بدقة.',
    keyCompetencyFr: 'Poser et effectuer les opérations sur les décimaux avec placement correct de la virgule.',
    suggestedPromptsAr: [
      'استراتيجيات تجاوز خطأ وضع الفاصلة عند جمع وطرح الأعداد العشرية',
      'استخدام القطع النقدية التونسية (المليم والدينار) لفهم الأجزاء من مئة وألف',
      'تمارين داعمة لمقارنة الأعداد العشرية ذات الأطوال المختلفة (مثل 3.5 و 3.25)',
    ],
    suggestedPromptsFr: [
      'Méthodes pour bien aligner la virgule dans l’addition décimale',
      'Utiliser la monnaie tunisienne (Dinar, Millimes) pour assimiler les centièmes',
      'Remédiation sur la comparaison de nombres décimaux',
    ],
  },

  // Français 5ème
  {
    id: 'fr-5-ch1',
    grade: '5ème Année',
    subject: 'Français',
    trimester: 'Trimestre 1',
    titleAr: 'الفرنسية: المحور 1 - المهن والعمل التضامني والإنتاج الكتابي',
    titleFr: 'Module 1 : Solidarité, entraide et métiers épanouissants',
    keyCompetencyAr: 'إثراء الرصيد اللغوي حول التضامن وصياغة فقرة وصفية وسردية خالية من الأخطاء.',
    keyCompetencyFr: 'Rédiger un paragraphe narratif sur l’entraide avec enrichissement des adjectifs.',
    suggestedPromptsAr: [
      'كيف ندرّب التلميذ على كتابة فقرة إنتاج كتابي فرنسية غنية بالأوصاف والأفعال الحركية',
      'معالجة تعثر تصريف الأفعال في الماضي المركب Passé Composé',
      'أنشطة محادثة شفوية لكسر حاجز الخوف من التحدث بالفرنسية',
    ],
    suggestedPromptsFr: [
      'Techniques pour enrichir la production écrite en français au primaire',
      'Surmonter les difficultés de conjugaison au Passé Composé',
      'Activités d’expression orale pour libérer la prise de parole',
    ],
  },

  // ================= 6ÈME ANNÉE (CONCOURS / مناظرة) =================
  // Mathématiques 6ème
  {
    id: 'math-6-ch1',
    grade: '6ème Année',
    subject: 'Mathématiques',
    trimester: 'Trimestre 1',
    titleAr: 'الأعداد الكسرية: العمليات والمسائل والتهيئة لمناظرة السيزيام',
    titleFr: 'Fractions, Proportionnalité et préparation au Concours de 6ème',
    keyCompetencyAr: 'توظيف الكسور والنسب المئوية والسرعة المتوسطة في حل المسائل الحسابية ذات المراحل المتعددة.',
    keyCompetencyFr: 'Résoudre des problèmes complexes à étapes multiples mobilisant fractions et pourcentages.',
    suggestedPromptsAr: [
      'منهجية تفكيك المسألة الحسابية المعقدة في مناظرة السيزيام واستخراج المعطيات المخفية',
      'طريقة توضيح جمع وطرح وضرب الأعداد الكسرية بالرسم الهندسي التوضيحي',
      'نصائح ذهبية للأولياء لمرافقة تلميذ السادسة دون ضغوط نفسية',
    ],
    suggestedPromptsFr: [
      'Méthodologie pour décortiquer un problème de concours de 6ème',
      'Visualisation géométrique des opérations sur les fractions',
      'Conseils pour gérer le stress des épreuves de fin de primaire',
    ],
  },
  {
    id: 'math-6-ch2',
    grade: '6ème Année',
    subject: 'Mathématiques',
    trimester: 'Trimestre 2',
    titleAr: 'التناسبية والنسبة المئوية وحساب المقادير والسرعة والكتلة الحجمية',
    titleFr: 'Proportionnalité, Pourcentages, Échelle et Vitesse moyenne',
    keyCompetencyAr: 'حساب النسبة المئوية وتطبيق جدول التناسبية وحساب المسافات على التصاميم والخرائط.',
    keyCompetencyFr: 'Appliquer la règle de trois et calculer des pourcentages et des échelles.',
    suggestedPromptsAr: [
      'تبسيط جدول التناسبية وقاعدة الرابع المتناسب بطريقة سهلة للتلاميذ',
      'كيفية معالجة أخطاء حساب التخفيضات والزيادات المئوية في المسائل التجارية',
      'تمارين تدريبية مكثفة على قراءة وتطبيق مقاييس الرسم والخرائط',
    ],
    suggestedPromptsFr: [
      'Simplifier la règle de trois et le tableau de proportionnalité',
      'Éviter les pièges des pourcentages de réduction et d’augmentation',
      'Exercices pratiques sur la lecture et le calcul d’échelles',
    ],
  },

  // اللغة العربية 6ème
  {
    id: 'ar-6-ch1',
    grade: '6ème Année',
    subject: 'اللغة العربية',
    trimester: 'Trimestre 1',
    titleAr: 'عالم النصوص والإنتاج الإدماجي لمناظرة الدخول للإعداديات النموذجية',
    titleFr: 'Production écrite intégrée et analyse pour les collèges pilotes',
    keyCompetencyAr: 'تحليل نص مركب وإنتاج نص سردي وصفي حواري محكم البناء متميز المعجم وسليم التراكيب.',
    keyCompetencyFr: 'Produire un texte complexe narratif-descriptif respectant les critères d’excellence.',
    suggestedPromptsAr: [
      'معايير التميز في الإنتاج الكتابي لمناظرة السيزيام (الملاءمة، السلامة، الطرافة والإثراء)',
      'كيف يتجنب التلميذ الركاكة ويبني تراكيب لغوية فصيحة ومقنعة',
      'نماذج مواضيع إنتاج كتابي مقترحة ومصححة بالمعايير الرسمية التونسية',
    ],
    suggestedPromptsFr: [
      'Critères d’excellence en production écrite pour le concours pilote',
      'Structurer une argumentation et enrichir les figures de style',
      'Sujets types corrigés conformes aux épreuves officielles tunisiennes',
    ],
  },
  {
    id: 'ar-6-ch2',
    grade: '6ème Année',
    subject: 'اللغة العربية',
    trimester: 'Trimestre 1',
    titleAr: 'قواعد اللغة والصرف المتقدم: النواسخ، المفاعيل، النعت والحال، التوكيد والبدل',
    titleFr: 'Grammaire arabe avancée : Inna, Kana, Mafâ’îl, Na’t, Hâl et Baddal',
    keyCompetencyAr: 'توظيف المتممات المنصوبة والمجرورة والتوابع والنواسخ في تدقيق المعنى وسلامة التعبير.',
    keyCompetencyFr: 'Maîtriser les compléments circonstanciels et les règles d’accord en arabe.',
    suggestedPromptsAr: [
      'خريطة ذهنية شاملة للتفريق بين الحال والنعت والتمييز والمفعول لأجله',
      'أخطاء متكررة في إعراب كان وأخواتها وإن وأخواتها وكيفية معالجتها',
      'تمارين تطبيقية تفاعلية لاختبار المكتسبات النحوية قبل الامتحانات التأليفية',
    ],
    suggestedPromptsFr: [
      'Carte mentale pour différencier Na’t, Hâl et compléments en arabe',
      'Erreurs d’accord fréquentes avec les auxiliaires Kana et Inna',
      'Quiz de révision rapide avant les examens de synthèse',
    ],
  },
];
