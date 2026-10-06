import { Injectable, computed, signal } from '@angular/core';

export type LanguageCode = 'fr' | 'ar';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  readonly lang = signal<LanguageCode>(this.getInitialLanguage());

  readonly isArabic = computed(() => this.lang() === 'ar');
  readonly dir = computed(() => (this.lang() === 'ar' ? 'rtl' : 'ltr'));

  constructor() {
    if (typeof document !== 'undefined') {
      const initial = this.lang();
      document.documentElement.lang = initial;
      document.documentElement.dir = initial === 'ar' ? 'rtl' : 'ltr';
    }
  }

  private getInitialLanguage(): LanguageCode {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('madrasati_lang');
        if (saved === 'fr' || saved === 'ar') return saved;
      } catch { /* SSR: localStorage unavailable */ }
    }
    return 'ar';
  }

  setLanguage(code: LanguageCode) {
    this.lang.set(code);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = code;
      document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr';
      try {
        localStorage.setItem('madrasati_lang', code);
      } catch { /* SSR: localStorage unavailable */ }
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

    // Bandes Dessinées library
    bdNav: { fr: 'Bandes Dessinées', ar: 'شريط مصوّر' },
    bdTitle: { fr: 'Bandes dessinées officielles', ar: 'الشرائط المصوّرة الرسمية' },
    bdSub: {
      fr: 'Les planches du manuel officiel (CNP), classées par niveau. Lisez-les avec votre enfant, imprimez-les ou partagez-les.',
      ar: 'صفحات الكتاب الرسمي (المركز الوطني البيداغوجي) مرتبة حسب المستوى. اقرأها مع طفلك أو اطبعها أو شاركها.',
    },
    bdPages: { fr: 'planches', ar: 'صفحة' },
    bdAllGrades: { fr: 'Tous les niveaux', ar: 'كل المستويات' },
    bdLoading: { fr: 'Chargement des planches…', ar: 'جارٍ تحميل الصفحات…' },
    bdEmpty: { fr: 'Aucune planche disponible pour ce niveau pour le moment.', ar: 'لا توجد صفحات متاحة لهذا المستوى حاليًا.' },
    bdPrint: { fr: 'Imprimer', ar: 'طباعة' },
    bdShare: { fr: 'Partager', ar: 'مشاركة' },
    bdCopyLink: { fr: 'Copier le lien', ar: 'نسخ الرابط' },
    bdLinkCopied: { fr: 'Lien copié !', ar: 'تم نسخ الرابط!' },
    bdClose: { fr: 'Fermer', ar: 'إغلاق' },
    bdPrev: { fr: 'Planche précédente', ar: 'الصفحة السابقة' },
    bdNext: { fr: 'Planche suivante', ar: 'الصفحة التالية' },
    bdPedagogyTitle: { fr: 'Aide à l’expression orale', ar: 'دعم التعبير الشفوي' },
    bdKeywords: { fr: 'Mots-clés :', ar: 'المفردات المفتاحية:' },
    bdStructures: { fr: 'Structures :', ar: 'التراكيب اللغوية:' },
    bdVerified: { fr: 'Vérifié par un enseignant', ar: 'موثّق من معلم' },
    bdCopyPost: { fr: 'Copier comme publication', ar: 'نسخ كمنشور' },
    bdPostCopied: { fr: 'Publication copiée !', ar: 'تم نسخ المنشور!' },
    bdDraft: { fr: 'Brouillon — en attente de validation', ar: 'مسودة — بانتظار التوثيق' },

    // Photo-Solve (public solver)
    solveTitle: { fr: 'Photographiez l’exercice, recevez la solution', ar: 'صوّر التمرين واحصل على الحل' },
    solveSub: {
      fr: 'Prenez une photo du cahier ou du livre : la solution détaillée et des conseils pour accompagner votre enfant, en quelques secondes.',
      ar: 'التقط صورة من الكراس أو الكتاب: الحل المفصل خطوة بخطوة ونصائح لمرافقة طفلك، في ثوانٍ.',
    },
    solveDropTitle: { fr: 'Déposez la photo de l’exercice ici', ar: 'ضع صورة التمرين هنا' },
    solveDropHint: { fr: 'Photo du cahier, du livre ou capture d’écran — JPG/PNG', ar: 'صورة من الكراس أو الكتاب أو لقطة شاشة — JPG/PNG' },
    solvePickBtn: { fr: 'Prendre / choisir une photo', ar: 'التقط أو اختر صورة' },
    solveAnalyzing: { fr: 'Lecture de l’exercice et résolution…', ar: 'جارٍ قراءة التمرين وحلّه…' },
    solveAnalyzingHint: { fr: 'Quelques secondes — la solution est vérifiée deux fois.', ar: 'ثوانٍ قليلة — الحل يُراجع مرتين قبل العرض.' },
    solveDetected: { fr: 'Exercice détecté', ar: 'التمرين المستخرج' },
    solveSolution: { fr: 'Solution étape par étape', ar: 'الحل خطوة بخطوة' },
    solveParentGuide: { fr: 'Conseils pour accompagner votre enfant', ar: 'نصائح لمرافقة طفلك' },
    solveCheckQuestion: { fr: 'Question de vérification :', ar: 'سؤال للتثبت:' },
    solveCopy: { fr: 'Copier la solution', ar: 'نسخ الحل' },
    solveCopied: { fr: 'Solution copiée !', ar: 'تم نسخ الحل!' },
    solveAnother: { fr: 'Résoudre un autre exercice', ar: 'حلّ تمرينًا آخر' },
    solveErrorTitle: { fr: 'La photo n’a pas pu être résolue', ar: 'تعذّر حلّ هذه الصورة' },
    solveErrorHint: { fr: 'Reprenez la photo de plus près, avec un bon éclairage, puis réessayez.', ar: 'أعد التقاط الصورة عن قرب وبإضاءة جيدة ثم حاول من جديد.' },
    solveNudge: { fr: 'Créez un compte gratuit pour garder vos solutions et suivre le niveau de votre enfant.', ar: 'أنشئ حسابًا مجانيًا لحفظ الحلول ومتابعة مستوى طفلك.' },
    solveNudgeBtn: { fr: 'Créer un compte gratuit', ar: 'إنشاء حساب مجاني' },
    solveFooter: { fr: 'Gratuit, sans inscription. Conforme au programme officiel tunisien.', ar: 'مجاني وبدون تسجيل. مطابق للبرنامج الرسمي التونسي.' },
    solveNav: { fr: 'Photo-Solution', ar: 'صوّر واحلّ' },

    // Summarize-Docs ("لخّصلي / Résume-moi")
    summarizeNav: { fr: 'Résumé de cours', ar: 'لخّصلي' },
    summarizeTitle: { fr: 'Résumez vos cours & fiches manuscrites', ar: 'صوّر الدرس واحصل على ملخص منظم' },
    summarizeSub: {
      fr: 'Déposez de 1 à 8 photos de cours, devoirs ou fiches : obtenez un résumé clair, des points clés et du vocabulaire conformes au programme tunisien.',
      ar: 'أرفق من 1 إلى 8 صور للدروس أو الكراسات: احصل على تلخيص منظم، نقاط أساسية ومفاهيم وفق البرنامج التونسي.',
    },
    summarizeDropTitle: { fr: 'Déposez les photos de votre cours ici', ar: 'ضع صور الدرس أو الملخص هنا' },
    summarizeDropHint: { fr: '1 à 8 photos (cahier, livre, fiches manuscrites) — JPG/PNG', ar: 'من 1 إلى 8 صور (الكراس، الكتاب، ملخصات يدوية) — JPG/PNG' },
    summarizePickBtn: { fr: 'Sélectionner des photos', ar: 'اختر الصور' },
    summarizeAnalyzing: { fr: 'Analyse et synthèse des documents en cours…', ar: 'جارٍ قراءة الوثائق واستخراج الملخص…' },
    summarizeAnalyzingHint: { fr: 'OCR des manuscrits, structuration et extraction des points clés.', ar: 'ثوانٍ قليلة — تمت قراءة النص واستخراج أهم الأفكار.' },
    summarizeResultTitle: { fr: 'Résumé du cours', ar: 'ملخص الدرس' },
    summarizeKeyPoints: { fr: 'Points clés à retenir', ar: 'أهم النقاط للمراجعة' },
    summarizeGlossary: { fr: 'Vocabulaire & Définitions', ar: 'المفردات والمفاهيم' },
    summarizeCopy: { fr: 'Copier le résumé', ar: 'نسخ الملخص' },
    summarizeCopied: { fr: 'Résumé copié !', ar: 'تم نسخ الملخص!' },
    summarizePrint: { fr: 'Imprimer (A4)', ar: 'طباعة A4' },
    summarizeShare: { fr: 'Partager / Enregistrer', ar: 'مشاركة / حفظ' },
    summarizeAnother: { fr: 'Résumer un autre cours', ar: 'تلخيص درس آخر' },
    summarizeErrorTitle: { fr: 'Impossible de synthétiser la photo', ar: 'تعذّر تلخيص هذه الصور' },
    summarizeErrorHint: { fr: 'Assurez-vous que l’écriture est lisible avec un bon éclairage.', ar: 'تأكد من وضوح الخط والإضاءة ثم حاول مجددًا.' },
    summarizeTeacherBtn: { fr: 'لخّص وثائقي', ar: 'لخّص وثائقي' },
    solveToSummarizeBanner: { fr: 'Vous avez des cours entiers à résumer ?', ar: 'عندك ملخصات دروس؟ لخّصها في ثوانٍ' },

    // Memo Studio ("Fiche Mémo Visuelle / مذكرة الدرس البصرية")
    memoStudioNav: { fr: 'Studio Mémo', ar: 'مذكرة بصرية' },
    memoStudioTitle: { fr: 'Fiches Mémo Visuelles A4', ar: 'المذكرات البصرية والمفاهيم A4' },
    memoStudioSub: {
      fr: 'Générez des fiches mémo synthétiques, imprimables et personnalisables pour vos élèves en 1 clic.',
      ar: 'أنشئ مذكرات درس بصرية وملخصات قواعد جاهزة للطباعة والتوزيع في نقرة واحدة.',
    },
    memoBtnNew: { fr: 'Nouvelle fiche', ar: 'مذكرة جديدة' },
    memoBtnPrint: { fr: 'Imprimer A4', ar: 'طباعة A4' },
    memoBtnSave: { fr: 'Enregistrer', ar: 'حفظ في المكتبة' },
    memoBtnSaved: { fr: 'Enregistré !', ar: 'تم الحفظ!' },
    memoBtnShare: { fr: 'Copier le lien', ar: 'نسخ الرابط' },
    memoBtnDocx: { fr: 'Télécharger Word', ar: 'تحميل Word (.docx)' },
    memoTabTopic: { fr: '1. Par sujet', ar: '1. حسب الدرس' },
    memoTabText: { fr: '2. Texte de cours', ar: '2. نص الدرس' },
    memoTabPhoto: { fr: '3. Photo / Capture', ar: '3. صورة أو لقطة' },
    memoTabFile: { fr: '4. Fichier PDF / Word', ar: '4. ملف PDF / Word' },
    memoTabLibrary: { fr: '5. Manuel officiel', ar: '5. من الكتاب المدرسي' },
    memoGradeLabel: { fr: 'Niveau scolaire', ar: 'المستوى الدراسي' },
    memoSubjectLabel: { fr: 'Matière', ar: 'المادة' },
    memoTrimesterLabel: { fr: 'Trimestre', ar: 'الثلاثي' },
    memoLanguageLabel: { fr: 'Langue de la fiche', ar: 'لغة المذكرة' },
    memoInputTopicLabel: { fr: 'Notion ou titre du cours :', ar: 'عنوان الدرس أو المفهوم :' },
    memoInputTopicPlaceholder: { fr: 'Ex: Les déterminants, Les fractions, اسم الفاعل...', ar: 'مثال: اسم الفاعل، المفعول المطلق، الكسور...' },
    memoInputTextLabel: { fr: 'Collez le texte du cours ou vos notes :', ar: 'الصق نص الدرس أو الملاحظات هنا :' },
    memoInputTextPlaceholder: { fr: 'Saisissez ou collez les éléments du cours...', ar: 'أدخل ملخص الدرس أو القواعد...' },
    memoInstructionsLabel: { fr: 'Consignes pédagogiques spécifiques (optionnel) :', ar: 'ملاحظات وتوجيهات خاصة (اختياري) :' },
    memoInstructionsPlaceholder: { fr: 'Ex: Insister sur les terminaisons au présent...', ar: 'مثال: التركيز على علامات الإعراب...' },
    memoBtnGenerate: { fr: 'Générer la Fiche Mémo', ar: 'توليد المذكرة البصرية' },
    memoBtnGenerating: { fr: 'Création de la fiche mémo en cours...', ar: 'جاري توليد وتنسيق المذكرة...' },
    memoLayoutTree: { fr: 'Arbre Conceptuel', ar: 'شجرة المفاهيم' },
    memoLayoutSteps: { fr: 'Étapes & Méthode', ar: 'خطوات ومنهجية' },
    memoLayoutCards: { fr: 'Cartes Clés', ar: 'بطاقات المفاهيم' },
    memoLayoutTimeline: { fr: 'Chronologie', ar: 'تسلسل زمني' },
    memoLayoutTable: { fr: 'Tableau Comparatif', ar: 'جدول مقارنة' },
    memoLayoutConjugation: { fr: 'Conjugaison & Règles', ar: 'تصريف وقواعد' },
    memoExtractedTextLabel: { fr: 'Texte extrait de la source (modifiable) :', ar: 'النص المستخرج من الوثيقة (قابل للتعديل) :' },
    memoBtnRegenWithText: { fr: 'Régénérer avec ce texte', ar: 'إعادة التوليد بهذا النص' },

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

    // Worksheet Generator (Phase 2 & 3)
    generatorNav: { fr: 'Générateur de Fiches', ar: 'مولّد الأوراق' },
    generatorTitle: { fr: 'Générateur de fiches similaires', ar: 'مولّد الأوراق والتمارين المشابهة' },
    generatorSubtitle: {
      fr: "Importez une fiche ou un exercice, l'IA en recrée de nouveaux dans le même style pédagogique.",
      ar: 'استورد ورقة تمارين، وسيقوم الذكاء الاصطناعي بإنشاء أوراق جديدة بنفس الأسلوب البيداغوجي.',
    },
    generatorSharedBadge: { fr: 'Fiche partagée · Madrasati TN', ar: 'ورقة تمارين مشتركة · مدرستي تونس' },
    generatorChooseImage: { fr: 'Choisir une image', ar: 'اختيار صورة أو ورقة' },
    generatorAnalyzeStyle: { fr: 'Analyser le style', ar: 'تحليل الأسلوب والنمط' },
    generatorAnalyzing: { fr: 'Analyse…', ar: 'جارٍ التحليل…' },
    generatorCount: { fr: 'Nombre d\'exercices', ar: 'عدد التمارين' },
    generatorGenerate: { fr: 'Générer les exercices', ar: 'توليد التمارين' },
    generatorGenerating: { fr: 'Génération…', ar: 'جارٍ التوليد…' },
    generatorAddImages: { fr: 'Ajouter des illustrations', ar: 'إضافة رسومات توضيحية' },
    generatorIllustrating: { fr: 'Illustration…', ar: 'جارٍ الرسم…' },
    generatorShare: { fr: 'Partager', ar: 'مشاركة' },
    generatorSharing: { fr: 'Partage…', ar: 'جارٍ إنشاء الرابط…' },
    generatorPrintA4: { fr: 'Imprimer A4', ar: 'طباعة A4 رسمية' },
    generatorLinkCopied: { fr: 'Lien copié ✓', ar: 'تم نسخ الرابط ✓' },
    generatorPublished: { fr: 'Fiche publiée dans la bibliothèque et le blog ✓', ar: 'تم نشر الورقة في المكتبة والمدونة ✓' },
    generatorShareLink: { fr: 'Lien de partage', ar: 'رابط المشاركة' },
    generatorEmbedCode: { fr: 'Code d\'intégration (embed)', ar: 'شيفرة التضمين (embed)' },
    generatorCopy: { fr: 'Copier', ar: 'نسخ' },
    generatorCopied: { fr: 'Copié ✓', ar: 'تم ✓' },
    generatorShareFacebook: { fr: 'Partager sur Facebook', ar: 'المشاركة على فيسبوك' },
    generatorHints: { fr: 'Indice', ar: 'إرشادات' },
    changeLanguage: { fr: 'Changer de langue', ar: 'تغيير اللغة' },
    toastPublished: { fr: 'Article publié avec succès sur le blog !', ar: 'تم نشر المقال بنجاح على المدونة !' },
    toastDraftSaved: { fr: 'Brouillon enregistré avec succès.', ar: 'تم حفظ المسودة بنجاح.' },
    toastLinkCopied: { fr: 'Lien copié dans le presse-papiers !', ar: 'تم نسخ الرابط إلى الحافظة !' },
    toastUpdated: { fr: 'Article mis à jour avec succès.', ar: 'تم تحديث المقال بنجاح.' },
    toastCommentAdded: { fr: 'Commentaire ajouté avec succès.', ar: 'تمت إضافة التعليق بنجاح.' },
    readArticle: { fr: "Lire l'article", ar: 'قراءة المقال' },
    editArticle: { fr: "Modifier l'article", ar: 'تعديل المقال' },
    shareArticle: { fr: 'Partager', ar: 'مشاركة' },
    backToArticles: { fr: 'Retour aux articles', ar: 'العودة إلى المقالات' },
    commentsTitle: { fr: 'Commentaires & Discussions', ar: 'التعليقات والمناقشات' },
    addCommentPlaceholder: { fr: 'Partagez votre avis pédagogique...', ar: 'شارك برأيك البيداغوجي أو استفسارك...' },
    publishCommentBtn: { fr: 'Commenter', ar: 'نشر التعليق' },
    noCommentsYet: { fr: 'Aucun commentaire pour le moment. Soyez le premier à réagir !', ar: 'لا توجد تعليقات بعد. كن أول من يشارك برأيه !' },

    memoMinistryHeader: { fr: 'En-tête officiel & Filigrane', ar: 'الترويسة الرسمية والعلامة المائية' },
    memoAddCard: { fr: 'Ajouter une carte', ar: 'إضافة بطاقة' },
    memoAddStep: { fr: 'Ajouter une étape', ar: 'إضافة خطوة' },
    memoRegenerateBlock: { fr: 'Régénérer ce bloc', ar: 'إعادة توليد هذا القسم' },

    // Notification System
    notifTitleOfficial: { fr: 'Notifications officielles', ar: 'الإشعارات الرسمية' },
    notifTabAll: { fr: 'Toutes', ar: 'الكل' },
    notifTabUnread: { fr: 'Non lues', ar: 'غير مقروءة' },
    notifTabAnnounce: { fr: 'Annonces', ar: 'إعلانات' },
    notifMarkAllRead: { fr: 'Tout marquer comme lu', ar: 'تحديد الكل كمقروء' },
    notifDismiss: { fr: 'Ignorer', ar: 'إخفاء' },
    notifEmpty: { fr: 'Aucune notification pour le moment', ar: 'لا توجد إشعارات حالياً' },
    notifBadgeNew: { fr: 'NOUVEAU', ar: 'جديد' },
    notifViewAction: { fr: 'Afficher', ar: 'عرض' },
    notifWelcomeTeacherTitle: { fr: 'Bienvenue sur Madrasati TN !', ar: 'مرحباً بك في مدرستي تونس !' },
    notifWelcomeTeacherMsg: { fr: 'Votre espace enseignant est prêt. Explorez le Memo Studio et créez vos premières fiches pédagogiques.', ar: 'فضاؤك التعليمي جاهز. اكتشف ستوديو المذكرات وأنشئ أولى أوراقك البيداغوجية.' },
    notifAnnounceMemoTitle: { fr: 'Nouveau : Memo Studio IA disponible', ar: 'جديد : ستوديو المذكرات البيداغوجية بالذكاء الاصطناعي' },
    notifAnnounceMemoMsg: { fr: 'Générez des fiches et mémos A4 conformes aux programmes tunisiens avec 6 mises en page et export Word.', ar: 'ولّد مذكرات وخلاصات A4 رسمية مطابقة للبرامج التونسية مع 6 تصاميم وتصدير Word.' },
    notifAnnounceOcrTitle: { fr: 'Nouveau : Résolveur d\'exercices par photo', ar: 'جديد : مصحح التمارين بالصور والذكاء الاصطناعي' },
    notifAnnounceOcrMsg: { fr: 'Photographiez les cahiers ou manuels pour obtenir une correction pas-à-pas instantanée.', ar: 'التقط صوراً للتمارين في الكراس أو الكتاب المدرسي للحصول على إصلاح فوري ومفصل.' },
    notifNewDocTitle: { fr: 'Nouvelle ressource : {title}', ar: 'مورد تعليمي جديد : {title}' },
    notifNewDocMsg: { fr: '{subject} ({grade}) • Publié par {author}', ar: '{subject} ({grade}) • نشر بواسطة {author}' },
    notifQaReplyTitle: { fr: 'Réponse à votre question', ar: 'إجابة جديدة على سؤالك' },
    notifQaReplyMsg: { fr: 'Un enseignant a répondu : {title}', ar: 'أجاب معلم على استفسارك : {title}' },
    notifBlogArticleTitle: { fr: 'Nouvel article : {title}', ar: 'مقال تربوي جديد : {title}' },
    notifBlogArticleMsg: { fr: 'Publié dans le blog pédagogique par {author}', ar: 'نُشر في المدونة التربوية بواسطة {author}' },
    timeAgoJustNow: { fr: 'À l\'instant', ar: 'الآن' },
    timeAgoMin: { fr: 'Il y a {count} min', ar: 'منذ {count} د' },
    timeAgoHour: { fr: 'Il y a {count} h', ar: 'منذ {count} س' },
    timeAgoDay: { fr: 'Il y a {count} j', ar: 'منذ {count} يوم' },
  };

  translateGrade(grade?: string | null): string {
    if (!grade) return '';
    const map: Record<string, { fr: string; ar: string }> = {
      '1ère Année': { fr: '1ère Année', ar: 'السنة الأولى ابتدائي' },
      '2ème Année': { fr: '2ème Année', ar: 'السنة الثانية ابتدائي' },
      '3ème Année': { fr: '3ème Année', ar: 'السنة الثالثة ابتدائي' },
      '4ème Année': { fr: '4ème Année', ar: 'السنة الرابعة ابتدائي' },
      '5ème Année': { fr: '5ème Année', ar: 'السنة الخامسة ابتدائي' },
      '6ème Année': { fr: '6ème Année', ar: 'السنة السادسة ابتدائي' },
      '7ème de base': { fr: '7ème de base', ar: 'السنة السابعة أساسي' },
      '8ème de base': { fr: '8ème de base', ar: 'السنة الثامنة أساسي' },
      '9ème de base': { fr: '9ème de base', ar: 'السنة التاسعة أساسي' },
      'Baccalauréat': { fr: 'Baccalauréat', ar: 'البكالوريا' },
    };
    const found = map[grade];
    if (!found) return grade;
    return this.lang() === 'ar' ? found.ar : found.fr;
  }

  translateSubject(subject?: string | null): string {
    if (!subject) return '';
    const norm = subject.toLowerCase().trim();
    if (norm.includes('math')) return this.lang() === 'ar' ? 'الرياضيات' : 'Mathématiques';
    if (norm.includes('fran')) return this.lang() === 'ar' ? 'اللغة الفرنسية' : 'Français';
    if (norm.includes('arab') || norm.includes('عرب')) return this.lang() === 'ar' ? 'اللغة العربية' : 'Arabe';
    if (norm.includes('scien') || norm.includes('éveil') || norm.includes('ايقاظ') || norm.includes('إيقاظ')) {
      return this.lang() === 'ar' ? 'الإيقاظ العلمي' : 'Éveil Scientifique';
    }
    if (norm.includes('islam') || norm.includes('إسلام')) return this.lang() === 'ar' ? 'التربية الإسلامية' : 'Éducation Islamique';
    if (norm.includes('hist') || norm.includes('géo') || norm.includes('تاريخ')) return this.lang() === 'ar' ? 'التاريخ والجغرافيا' : 'Histoire & Géo';
    if (norm.includes('angl') || norm.includes('إنكليز') || norm.includes('إنجليز')) return this.lang() === 'ar' ? 'اللغة الإنجليزية' : 'Anglais';
    if (norm.includes('info') || norm.includes('إعلام')) return this.lang() === 'ar' ? 'الإعلامية' : 'Informatique';
    return subject;
  }

  t(key: string, params?: Record<string, string | number>): string {
    const entry = this.dictionary[key];
    if (!entry) return key;
    let text = this.lang() === 'ar' ? entry.ar : entry.fr;
    if (params) {
      for (const [pKey, pVal] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${pKey}\\}|\\{\\{${pKey}\\}\\}`, 'g'), String(pVal ?? ''));
      }
    }
    return text;
  }
}
