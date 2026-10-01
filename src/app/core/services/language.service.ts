import { Injectable, computed, signal } from '@angular/core';

export type LanguageCode = 'fr' | 'ar';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  readonly lang = signal<LanguageCode>('ar');

  readonly isArabic = computed(() => this.lang() === 'ar');
  readonly dir = computed(() => (this.lang() === 'ar' ? 'rtl' : 'ltr'));

  constructor() {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = 'ar';
      document.documentElement.dir = 'rtl';
    }
  }

  setLanguage(code: LanguageCode) {
    this.lang.set(code);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = code;
      document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr';
    }
  }

  toggleLanguage() {
    this.setLanguage(this.lang() === 'fr' ? 'ar' : 'fr');
  }

  // Helper for dual text
  tr(fr: string, ar: string): string {
    return this.lang() === 'ar' ? ar : fr;
  }

  // Translations Dictionary
  readonly dictionary: Record<string, { fr: string; ar: string }> = {
    // Platform
    brandName: { fr: 'Madrasati', ar: 'مدرستي' },
    brandSub: { fr: 'Plateforme Éducative Tunisienne', ar: 'المنصة التعليمية التونسية' },
    freeBadge: { fr: '100% Gratuit pour l\'École Tunisienne', ar: 'مجاني 100% للمدرسة التونسية' },
    tagline: {
      fr: 'La plateforme éducative officielle pour les enseignants, élèves et parents en Tunisie.',
      ar: 'المنصة التعليمية الرسمية للمعلمين والتلاميذ والأولياء في تونس.',
    },

    // Roles (no baked-in emojis)
    navHome: { fr: 'Accueil', ar: 'الرئيسية' },
    roleHome: { fr: 'Accueil', ar: 'الرئيسية' },
    roleTeacher: { fr: 'Enseignant', ar: 'فضاء المعلم' },
    roleParent: { fr: 'Parent', ar: 'فضاء الولي' },
    roleStudent: { fr: 'Élève', ar: 'فضاء التلميذ' },
    rolePublic: { fr: 'Bibliothèque & Répertoire', ar: 'المكتبة والدليل' },

    // Teacher View
    teacherWelcome: { fr: 'Espace Enseignant', ar: 'فضاء المعلم' },
    teacherHeaderSub: {
      fr: 'Votre espace enseignant professionnel. Toutes vos ressources, annonces et devoirs centralisés.',
      ar: 'فضاؤك المهني للتعليم. جميع الموارد والإعلانات والواجبات المدرسية منظمة وموحدة.',
    },
    activeClassLabel: { fr: 'Classe active :', ar: 'الفصل الحالي:' },
    addAnnouncementBtn: { fr: '+ Annonce', ar: '+ إعلان جديد' },
    addCourseBtn: { fr: '+ Cours', ar: '+ درس جديد' },
    addHomeworkBtn: { fr: '+ Devoir', ar: '+ واجب مدرسي' },
    aiAssistantBtn: { fr: 'Assistant IA', ar: 'المساعد الذكي Gemini' },

    // Stats Cards
    statStudents: { fr: 'Élèves de la classe', ar: 'تلاميذ الفصل' },
    statSubmissions: { fr: 'Travaux à corriger', ar: 'واجبات للتقييم' },
    statViews: { fr: 'Consultations cours', ar: 'مشاهدات الدروس' },
    statConfirmations: { fr: 'Confirmation parents', ar: 'تأكيدات الأولياء' },

    // Tabs & Workspace Sections
    tabAnnouncements: { fr: 'Annonces Officielles', ar: 'الإعلانات الرسمية' },
    tabCourses: { fr: 'Cours & Fiches A4', ar: 'الدروس والملخصات A4' },
    tabHomeworks: { fr: 'Devoirs & Exercices', ar: 'الواجبات والتمارين' },
    tabSubmissions: { fr: 'Corrections Élèves', ar: 'تطبيقات التلاميذ والإصلاح' },
    tabTeacherDocs: { fr: 'Fiches & Évaluations A4', ar: 'الوثائق والامتحانات A4' },
    tabTeacherBlog: { fr: 'Blog Pédagogique', ar: 'المدونة البيداغوجية' },
    tabTeacherQA: { fr: 'Questions & Demandes Parents', ar: 'أسئلة الأولياء والتوجيه' },
    tabParentDocs: { fr: 'Banque de Documents A4', ar: 'بنك الوثائق والطباعة A4' },
    tabParentBlog: { fr: 'Articles & Conseils Pédagogiques', ar: 'نصائح ومقالات المعلمين' },
    tabParentQA: { fr: 'Poser une Question au Maître', ar: 'طرح سؤال / طلب وثيقة' },

    // Blog & Q&A Hub
    writeArticleBtn: { fr: 'Rédiger un Article', ar: 'كتابة مقال بيداغوجي' },
    askQuestionBtn: { fr: 'Poser une Question', ar: 'طرح سؤال جديد' },
    verifiedTeacherAnswer: { fr: 'Réponse certifiée par un enseignant', ar: 'إجابة معتمدة من معلم' },
    readArticleBtn: { fr: 'Lire l\'article complet', ar: 'قراءة المقال كاملاً' },
    attachedDocument: { fr: 'Document joint à imprimer', ar: 'وثيقة مرفقة جاهزة للطباعة' },
    articleTitle: { fr: 'Titre de l\'article', ar: 'عنوان المقال' },
    articleContent: { fr: 'Contenu pédagogique', ar: 'المحتوى البيداغوجي' },
    articleCategory: { fr: 'Matière / Thème', ar: 'المادة / المحور' },
    publishArticleBtn: { fr: 'Publier l\'article', ar: 'نشر المقال' },
    commentsCount: { fr: 'Commentaires', ar: 'التعليقات' },
    addComment: { fr: 'Ajouter un commentaire ou une question...', ar: 'أضف تعليقاً أو استفساراً...' },
    sendCommentBtn: { fr: 'Commenter', ar: 'إرسال التعليق' },
    questionTitle: { fr: 'Objet de la question / Demande', ar: 'موضوع السؤال / الطلب' },
    questionContent: { fr: 'Détaillez votre besoin (notion incomprise, demande de fiche d\'exercices...)', ar: 'وضح استفسارك (درس غير مفهوم، طلب تمارين تدريبية...)' },
    submitQuestionBtn: { fr: 'Envoyer la question aux enseignants', ar: 'إرسال السؤال إلى الإطار التربوي' },
    replyToQuestionBtn: { fr: 'Répondre en tant qu\'enseignant', ar: 'تقديم إجابة تربوية' },
    attachDocLabel: { fr: 'Joindre un document de la banque A4 (optionnel) :', ar: 'إرفاق وثيقة من بنك الامتحانات (اختياري):' },
    noAttachment: { fr: 'Aucune pièce jointe', ar: 'بدون وثيقة مرفقة' },
    searchDocsPlaceholder: { fr: 'Rechercher un document, un examen ou un cours...', ar: 'ابحث عن درس، امتحان أو تلخيص...' },
    printA4Btn: { fr: 'Imprimer en A4', ar: 'طباعة فورية A4' },
    shareLinkBtn: { fr: 'Copier le lien', ar: 'نسخ الرابط' },

    // Parent View
    parentTitle: { fr: 'Espace Parent', ar: 'فضاء الولي' },
    switchChild: { fr: 'Changer d\'enfant :', ar: 'متابعة تلميذ آخر:' },
    announcementsTitle: { fr: 'Annonces des Enseignants', ar: 'إعلانات المعلمين' },
    announcementsSub: {
      fr: 'Communications officielles transmises par l\'école',
      ar: 'البلاغات والإشعارات الرسمية الصادرة عن المدرسة',
    },
    confirmReadBtn: { fr: 'Confirmer la lecture', ar: 'تأكيد الاطلاع والإعلام' },
    readConfirmed: { fr: 'Bien pris en note', ar: 'تمت المصادقة والاطلاع' },
    homeworksTitle: { fr: 'Devoirs à rendre', ar: 'الواجبات المدرسية المطلوبة' },
    progressTitle: { fr: 'Suivi des Résultats', ar: 'متابعة النتائج والتحصيل' },
    teachersTitle: { fr: 'Enseignants Référents', ar: 'الإطار التربوي المباشر' },
    messageBtn: { fr: 'Message', ar: 'مراسلة' },

    // Student View
    streakLabel: { fr: 'Jours de Série Consécutifs !', ar: 'أيام من المواظبة المتواصلة!' },
    studentWelcome: { fr: 'Espace Élève & Réussite', ar: 'فضاء التلميذ والواجبات' },
    studentSub: {
      fr: 'Bienvenue sur ton espace d\'apprentissage. Fais tes devoirs, entraîne-toi et demande de l\'aide à ton tuteur IA !',
      ar: 'مرحباً بك في فضاؤك التعليمي. أنجز واجباتك، تدرب على التمارين واطلب المساعدة من معلمك الذكي!',
    },
    successPoints: { fr: 'Points Réussite', ar: 'نقاط التميز' },
    myHomeworks: { fr: 'Tes Devoirs à Faire', ar: 'واجباتك المدرسية الان' },
    solveBtn: { fr: 'Résoudre maintenant', ar: 'إنجاز الواجب الآن' },
    practiceZone: { fr: 'Entraînement & Autonomie', ar: 'فضاء التدريب المستقل' },
    aiTutorTitle: { fr: 'Mon Tuteur Éducatif IA', ar: 'المعلم الذكي المساعد' },
    askAiBtn: { fr: 'M\'expliquer la notion', ar: 'شرح المفهوم وتبسيطه' },

    // Navigation & Auth
    navLogin: { fr: 'Connexion', ar: 'دخول' },
    navSignup: { fr: "S'inscrire", ar: 'تسجيل' },
    authSignupAs: { fr: "S'inscrire en tant que :", ar: 'التسجيل بصفة:' },
    authStudentName: { fr: "Prénom & Nom de l'élève", ar: 'اسم التلميذ(ة)' },
    authFullName: { fr: 'Nom complet', ar: 'الاسم واللقب' },
    authEmailOrUser: { fr: "Adresse Email ou Nom d'utilisateur", ar: 'البريد الإلكتروني أو اسم المستخدم' },
    authMinistryCompliance: { fr: "100% Conforme au Ministère de l'Éducation Tunisien", ar: 'مطابق 100% لبرامج وزارة التربية التونسية' },
    printBtn: { fr: "Lancer l'Impression A4 / PDF", ar: 'طباعة الورقة بصيغة A4' },
    photoReady: { fr: "Photo prête à l'envoi", ar: 'الصورة جاهزة للإرسال' },

    // Landing Page
    heroBadge: { fr: 'Plateforme Éducative Primaire Tunisienne (1ère — 6ème)', ar: 'المنصة التعليمية للابتدائي التونسي (السنة 1 — 6)' },
    heroTitle: { fr: "L'école tunisienne moderne, connectée et sereine.", ar: 'المدرسة التونسية الحديثة، المتصلة والناجحة.' },
    heroSubtitle: {
      fr: "Fini les devoirs éparpillés et les messages de dernière minute. Madrasati TN réunit les Enseignants, Parents et Élèves autour des 38 manuels officiels CNP, de devoirs imprimables en A4 et d'un suivi pédagogique rigoureux.",
      ar: 'وداعاً للواجبات الضائعة والرسائل العشوائية في آخر لحظة. تجمع مدرستي تونس المعلمين والأولياء والتلاميذ حول 38 كتاباً مدرسياً رسمياً، وواجبات قابلة للطباعة A4 ومتابعة دراسية دقيقة.',
    },
    ctaFreeAccount: { fr: 'Créer un compte gratuit', ar: 'إنشاء حساب مجاني' },
    ctaLogin: { fr: 'Se connecter', ar: 'تسجيل الدخول' },
    ctaExploreCnp: { fr: 'Explorer les 38 manuels CNP sans compte →', ar: 'تصفح 38 كتاباً مدرسياً دون حساب ←' },
    chooseSpaceTitle: { fr: 'Choisissez votre espace dédié', ar: 'اختر فضائك المخصص' },
    chooseSpaceSub: { fr: "Chaque utilisateur dispose d'outils sur-mesure adaptés à ses besoins scolaires", ar: 'أدوات مصممة خصيصاً لكل طرف في المنظومة التربوية' },
    teacherSpaceTitle: { fr: 'Pour les Enseignants', ar: 'للمعلمين والمعلمات' },
    teacherSpaceDesc: {
      fr: "Publiez cours, devoirs et annonces officielles. Générez des feuilles d'exercices conformes avec filigrane, prêtes à imprimer en A4.",
      ar: 'نشر الدروس والواجبات والإعلانات الرسمية مع إنشاء أوراق تمارين معتمدة بعلامة مائية، جاهزة للطباعة A4.',
    },
    teacherOpenBtn: { fr: "Ouvrir l'Espace Enseignant", ar: 'دخول فضاء المعلم' },
    teacherSignupBtn: { fr: "S'inscrire comme Enseignant", ar: 'التسجيل كمعلم(ة)' },
    parentSpaceTitle: { fr: 'Pour les Parents', ar: 'للأولياء' },
    parentSpaceDesc: {
      fr: "Suivez en temps réel le travail scolaire de vos enfants. Consultez les dates d'examens, communiquez directement avec les enseignants et accusez réception.",
      ar: 'متابعة دراسية دقيقة وفورية لأبنائك، جدول الامتحانات والتواصل المباشر والمنظم مع الإطار التربوي.',
    },
    parentOpenBtn: { fr: "Ouvrir l'Espace Parent", ar: 'دخول فضاء الولي' },
    parentSignupBtn: { fr: "S'inscrire comme Parent", ar: 'التسجيل كولي أمر' },
    studentSpaceTitle: { fr: 'Pour les Élèves', ar: 'للتلاميذ' },
    studentSpaceDesc: {
      fr: "Fais tes devoirs sereinement, prends en photo ton cahier d'exercices et reçois les corrections. Consulte tous tes manuels scolaires officiels CNP en ligne.",
      ar: 'حل واجباتك، أرفق صورة من كراسك وتصفح جميع كتبك المدرسية الرسمية للمرحلة الابتدائية.',
    },
    studentOpenBtn: { fr: "Ouvrir l'Espace Élève", ar: 'دخول فضاء التلميذ' },
    studentSignupBtn: { fr: "S'inscrire comme Élève", ar: 'التسجيل كتلميذ' },
    cnpBannerBadge: { fr: 'Centre National Pédagogique (CNP) Tunisie', ar: 'المركز الوطني البيداغوجي بتونس' },
    cnpBannerTitle: { fr: '38 Manuels Scolaires Officiels Numérisés', ar: '38 كتاباً مدرسياً رسمياً متاحاً للتحميل' },
    cnpBannerDesc: {
      fr: "Tous les livres d'élèves de la 1ère à la 6ème année primaire (Mathématiques, Arabe, Français, Éveil Scientifique, etc.) accessibles en haute définition.",
      ar: 'جميع كتب التلميذ من السنة الأولى إلى السادسة أساسي في جميع المواد متوفرة بدقة عالية ومجاناً.',
    },
    cnpBannerBtn: { fr: 'Ouvrir la Bibliothèque CNP', ar: 'تصفح مكتبة الكتب المدرسية' },

    // Public Bank View
    publicHeroTitle: {
      fr: 'Stop aux groupes Facebook dispersés. Bienvenue sur la plateforme éducative tunisienne organisée.',
      ar: 'لا لمجموعات الفيسبوك المشتتة. مرحباً بكم في المنصة التعليمية المنظمة في تونس.',
    },
    searchPlaceholder: {
      fr: 'Rechercher par sujet (ex: Multiplication 4ème, Imla\'a, Fractions...)',
      ar: 'ابحث عن درس أو تمرين (مثال: ضرب الأعداد، الإملاء، الإيقاظ العلمي...)',
    },
    filterGradeAll: { fr: 'Tous les Niveaux', ar: 'جميع المستويات' },
    filterSubjectAll: { fr: 'Toutes les Matières', ar: 'جميع المواد' },
    teachersDirectory: { fr: 'Répertoire des Enseignants Certifiés', ar: 'دليل المعلمين المعتمدين' },

    // Editor Studio Fixes (Rule 6: Apostrophes in attributes)
    editorExerciseTitlePlaceholder: { fr: "Titre de l'exercice...", ar: "عنوان التمرين..." },
    editorPromptPlaceholder: { fr: "Énoncé du problème ou consigne pour l'élève...", ar: "نص المسألة أو التعليمة للتلميذ..." },
    editorTfStatementPlaceholder: { fr: "Rédigez l'affirmation...", ar: "اكتب الإفادة..." },
    editorGapTextPlaceholder: { fr: "Ex: Le soleil se lève à l'[[est]] et se couche à l'[[ouest]].", ar: "مثال: تشرق الشمس من الـ[[شرق]] وتغرب من الـ[[غرب]]." },
  };

  t(key: string): string {
    const entry = this.dictionary[key];
    if (!entry) return key;
    return this.lang() === 'ar' ? entry.ar : entry.fr;
  }
}
