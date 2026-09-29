import { Injectable, computed, signal } from '@angular/core';

export type LanguageCode = 'fr' | 'ar';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  readonly lang = signal<LanguageCode>('fr');

  readonly isArabic = computed(() => this.lang() === 'ar');
  readonly dir = computed(() => (this.lang() === 'ar' ? 'rtl' : 'ltr'));

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
    brandName: { fr: 'Madrasati TN', ar: 'مدرستي تونس' },
    brandSub: { fr: 'Espace Éducatif Réussite', ar: 'الفضاء التعليمي للنجاح' },
    freeBadge: { fr: '100% Gratuit pour l\'École Tunisienne', ar: 'مجاني 100% للمدرسة التونسية' },
    tagline: {
      fr: 'La plateforme éducative professionnelle remplaçant les groupes Facebook et WhatsApp en Tunisie.',
      ar: 'المنصة التعليمية المهنية البديلة لمجموعات الفيسبوك والواتساب في تونس.',
    },

    // Roles
    roleHome: { fr: '🏠 Accueil', ar: '🏠 الرئيسية' },
    roleTeacher: { fr: '👨‍🏫 Enseignant', ar: '👨‍🏫 فضاء المعلم' },
    roleParent: { fr: '👨‍👩‍👧 Parent', ar: '👨‍👩‍👧 فضاء الولي' },
    roleStudent: { fr: '👦 Élève', ar: '👦 فضاء التلميذ' },
    rolePublic: { fr: '🔎 Banque & Répertoire', ar: '🔎 المكتبة والدليل' },

    // Teacher View
    teacherWelcome: { fr: 'Bonjour, Mme Amel 👋', ar: 'مرحباً، السيدة أمل 👋' },
    teacherHeaderSub: {
      fr: 'Votre espace enseignant professionnel. Toutes vos ressources, annonces et devoirs centralisés sans le bruit des réseaux sociaux.',
      ar: 'فضاؤك المهني للتعليم. جميع الموارد والإعلانات والواجبات المدرسية منظمة وموحدة دون ضوضاء شبكات التواصل.',
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

    // Tabs
    tabAnnouncements: { fr: 'Annonces Officielles', ar: 'الإعلانات الرسمية' },
    tabCourses: { fr: 'Cours & Fiches', ar: 'الدروس والملخصات' },
    tabHomeworks: { fr: 'Devoirs & Exercices', ar: 'الواجبات والتمارين' },
    tabSubmissions: { fr: 'Corrections Élèves', ar: 'تطبيقات التلاميذ والإصلاح' },

    // Parent View
    parentTitle: { fr: 'Espace Parent Réussite', ar: 'فضاء الولي المتابع' },
    switchChild: { fr: 'Changer d\'enfant :', ar: 'متابعة تلميذ آخر:' },
    announcementsTitle: { fr: 'Annonces des Enseignants', ar: 'إعلانات المعلمين' },
    announcementsSub: {
      fr: 'Communications officielles transmises par l\'école',
      ar: 'البلاغات والإشعارات الرسمية الصادرة عن المدرسة',
    },
    confirmReadBtn: { fr: 'Confirmer la lecture', ar: 'تأكيد الاطلاع والإعلام' },
    readConfirmed: { fr: 'Bien pris en note ✔️', ar: 'تمت المصادقة والاطلاع ✔️' },
    homeworksTitle: { fr: 'Devoirs à rendre', ar: 'الواجبات المدرسية المطلوبة' },
    progressTitle: { fr: '📊 Suivi des Résultats', ar: '📊 متابعة النتائج والتحصيل' },
    teachersTitle: { fr: '👨‍🏫 Enseignants Référents', ar: '👨‍🏫 الإطار التربوي المباشر' },
    messageBtn: { fr: 'Message', ar: 'مراسلة' },

    // Student View
    streakLabel: { fr: 'Jours de Série Consécutifs !', ar: 'أيام من المواظبة المتواصلة!' },
    studentWelcome: { fr: 'Bonjour Ahmed ! 👋', ar: 'أهلاً بك يا أحمد ! 👋' },
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
  };

  t(key: string): string {
    const entry = this.dictionary[key];
    if (!entry) return key;
    return this.lang() === 'ar' ? entry.ar : entry.fr;
  }
}
