import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EducationStore, LanguageService, UserRole } from '@core';

@Component({
  selector: 'app-landing-home',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-14">

      <!-- ============ HERO — "Cartouche officielle" ============ -->
      <section class="relative overflow-hidden rounded-[24px] bg-white dark:bg-[#0E1D2A] border border-[#E3ECF2] dark:border-[#1A3145] shadow-xs animate-in fade-in duration-500">
        <!-- Background Subtle Radial Glow & Arabesque Ornament -->
        <div class="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#007CC2]/5 blur-3xl pointer-events-none"></div>
        <div class="absolute top-0 right-0 w-64 h-64 opacity-5 pointer-events-none" style="background-image: radial-gradient(#007CC2 1px, transparent 1px); background-size: 16px 16px;"></div>

        <div class="grid lg:grid-cols-[1.35fr_1fr] items-center gap-8 p-8 sm:p-12 lg:p-12 relative z-10">

          <!-- LEFT: Official Header, Title, Subtitle & 4 Feature Badges -->
          <div class="space-y-6">
            <!-- Ministry header line with Tunisian seal -->
            <div class="flex items-center gap-3">
              <span class="tn-seal w-9 h-9 shrink-0" aria-hidden="true"></span>
              <div class="leading-tight text-[11px]">
                <p class="font-display font-semibold text-[#102A43] dark:text-white">
                  {{ lang.tr('République Tunisienne', 'الجمهورية التونسية') }}
                </p>
                <p class="text-[#486581] dark:text-[#8CA9C4]">
                  {{ lang.tr("Ministère de l'Éducation – Plateforme éducative nationale", 'وزارة التربية – المنصة التعليمية الوطنية') }}
                </p>
              </div>
            </div>

            <h1 class="font-display text-3xl sm:text-4xl lg:text-[3.1rem] font-bold text-[#0B2947] dark:text-white tracking-tight leading-[1.12]">
              {{ lang.tr("L'école tunisienne moderne, connectée et sereine.", 'المدرسة التونسية الحديثة، المتصلة والهادئة.') }}
            </h1>

            <p class="text-sm sm:text-[15px] text-[#486581] dark:text-[#8CA9C4] leading-relaxed max-w-xl">
              {{ lang.tr("Une plateforme numérique pour les enseignants, les parents et les élèves. Accédez à vos ressources, gérez vos cours, suivez les progrès et collaborez en toute simplicité, au service d'une éducation de qualité.", 'منصة رقمية متكاملة للمعلمين والأولياء والتلاميذ. يمكنك الوصول إلى مواردك، وإدارة دروسك، ومتابعة التحصيل الدراسي والتعاون بكل بساطة.') }}
            </p>

            <!-- 4 Feature Badges in Horizontal Row -->
            <div class="flex flex-wrap items-center gap-x-6 gap-y-3 pt-6 border-t border-[#E3ECF2] dark:border-[#1A3145]">
              <div class="flex items-center gap-2 text-xs font-semibold text-[#102A43] dark:text-white">
                <div class="w-7 h-7 rounded-lg bg-[#E8F5FC] dark:bg-[#102A43] text-[#007CC2] flex items-center justify-center">
                  <span class="material-icons text-base">menu_book</span>
                </div>
                <span>{{ lang.tr('Ressources pédagogiques', 'موارد بيداغوجية') }}</span>
              </div>

              <div class="flex items-center gap-2 text-xs font-semibold text-[#102A43] dark:text-white">
                <div class="w-7 h-7 rounded-lg bg-[#E8F5FC] dark:bg-[#102A43] text-[#007CC2] flex items-center justify-center">
                  <span class="material-icons text-base">groups</span>
                </div>
                <span>{{ lang.tr('Suivi des élèves', 'متابعة التلاميذ') }}</span>
              </div>

              <div class="flex items-center gap-2 text-xs font-semibold text-[#102A43] dark:text-white">
                <div class="w-7 h-7 rounded-lg bg-[#E8F5FC] dark:bg-[#102A43] text-[#007CC2] flex items-center justify-center">
                  <span class="material-icons text-base">verified_user</span>
                </div>
                <span>{{ lang.tr('Sécurité & Confiance', 'أمان وموثوقية') }}</span>
              </div>

              <div class="flex items-center gap-2 text-xs font-semibold text-[#102A43] dark:text-white">
                <div class="w-7 h-7 rounded-lg bg-[#E8F5FC] dark:bg-[#102A43] text-[#007CC2] flex items-center justify-center">
                  <span class="material-icons text-base">bolt</span>
                </div>
                <span>{{ lang.tr('Simple et efficace', 'سهل وفعال') }}</span>
              </div>
            </div>
          </div>

          <!-- RIGHT: 3D Official Evaluation Sheet & Books Illustration -->
          <div class="hidden lg:flex items-center justify-end relative">
            <img
              src="hero-illustration.jpg"
              alt="Madrasati TN — Évaluation officielle et manuels scolaires"
              class="w-full max-w-[500px] h-auto object-contain rounded-2xl drop-shadow-sm select-none" />
          </div>

        </div>
      </section>

      <!-- ============ ROLE WORKSPACES ============ -->
      <section class="space-y-7">
        <div class="max-w-2xl">
          <h2 class="font-display text-2xl sm:text-[1.75rem] font-semibold text-[#102A43] dark:text-white">
            {{ lang.t('chooseSpaceTitle') }}
          </h2>
          <p class="text-sm text-[#486581] dark:text-[#8CA9C4] mt-2">{{ lang.t('chooseSpaceSub') }}</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
          @for (r of roles; track r.role) {
            <div class="bg-white dark:bg-[#0E1D2A] rounded-[18px] border border-[#E3ECF2] dark:border-[#1A3145] overflow-hidden flex flex-col shadow-xs hover:shadow-md transition-all">
              <div class="h-1.5" [style.background]="r.accent"></div>
              <div class="p-6 flex flex-col grow">
                <div class="flex items-center gap-3">
                  <span class="w-11 h-11 rounded-[12px] flex items-center justify-center"
                        [style.background]="r.accent + '15'" [style.color]="r.accent">
                    <span class="material-icons text-[22px]">{{ r.icon }}</span>
                  </span>
                  <h3 class="font-display text-lg font-semibold text-[#102A43] dark:text-white">{{ lang.t(r.titleKey) }}</h3>
                </div>

                <p class="text-[13px] text-[#486581] dark:text-[#8CA9C4] leading-relaxed mt-4">{{ lang.t(r.descKey) }}</p>

                <ul class="text-[13px] text-[#486581] dark:text-[#8CA9C4] space-y-2.5 mt-5 pt-5 border-t border-[#E3ECF2] dark:border-[#1A3145] grow">
                  @for (pt of r.points; track pt.fr) {
                    <li class="flex items-start gap-2">
                      <span class="material-icons text-[16px] mt-0.5" [style.color]="r.accent">check</span>
                      <span>{{ lang.tr(pt.fr, pt.ar) }}</span>
                    </li>
                  }
                </ul>

                <div class="mt-6 space-y-2.5">
                  <button
                    type="button"
                    (click)="enterWorkspace(r.role)"
                    class="w-full text-white font-semibold py-2.5 rounded-[10px] text-[13px] transition-opacity hover:opacity-90 cursor-pointer flex items-center justify-center gap-1.5"
                    [style.background]="r.accent">
                    {{ lang.t(r.openKey) }}
                  </button>
                  <button
                    type="button"
                    (click)="store.openSignupModal(r.role)"
                    class="w-full bg-white dark:bg-[#152737] hover:bg-[#F3FAFD] dark:hover:bg-[#1B344B] text-[#164E78] dark:text-[#8CA9C4] font-medium py-2.5 rounded-[10px] text-[13px] transition-colors cursor-pointer border border-[#CBD9E2] dark:border-[#254663]">
                    {{ lang.t(r.signupKey) }}
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      </section>

      <!-- ============ CNP LIBRARY ============ -->
      <section class="rounded-[24px] bg-[#0B2947] text-white p-8 sm:p-11 overflow-hidden relative shadow-md">
        <div class="grid lg:grid-cols-[1fr_auto] gap-9 items-center">
          <div class="max-w-xl">
            <div class="flex items-center gap-2.5 text-[#8CA9C4] text-xs font-medium">
              <span class="material-icons text-[16px] text-[#E0AA32]">verified</span>
              <span>{{ lang.t('cnpBannerBadge') }}</span>
            </div>
            <h3 class="font-display text-[1.75rem] sm:text-[2.1rem] font-semibold leading-tight mt-3">
              <span class="text-[#E0AA32]">40</span> {{ lang.tr('manuels scolaires officiels, numérisés et gratuits.', 'كتاباً مدرسياً رسمياً، مرقمناً ومجانياً.') }}
            </h3>
            <p class="text-sm text-[#D7E7F2] leading-relaxed mt-4">{{ lang.t('cnpBannerDesc') }}</p>

            <button
              type="button"
              (click)="enterWorkspace('public')"
              class="mt-7 bg-[#007CC2] hover:bg-[#006EAD] text-white font-semibold px-6 py-3 rounded-[10px] text-sm transition-colors cursor-pointer inline-flex items-center gap-2 shadow-sm">
              <span class="material-icons text-[18px]">collections_bookmark</span>
              {{ lang.t('cnpBannerBtn') }}
            </button>
          </div>

          <!-- Grade index tiles -->
          <div class="grid grid-cols-3 gap-2.5">
            @for (g of grades; track g) {
              <button
                type="button"
                (click)="enterWorkspace('public')"
                class="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex flex-col items-center justify-center transition-colors cursor-pointer">
                <span class="font-display text-2xl font-semibold text-[#FBF8F1]">{{ g }}</span>
                <span class="text-[9px] text-[#9DBBA8] mt-0.5">{{ lang.tr('année', 'سنة') }}</span>
              </button>
            }
          </div>
        </div>
      </section>

    </div>
  `,
})
export class LandingHomeComponent {
  readonly store = inject(EducationStore);
  readonly lang = inject(LanguageService);

  readonly grades = ['1', '2', '3', '4', '5', '6'];

  readonly proofs = [
    { icon: 'print', value: 'A4', label: 'Impression conforme', labelAr: 'طباعة رسمية' },
    { icon: 'menu_book', value: '40', label: 'Manuels CNP', labelAr: 'كتاباً معتمداً' },
    { icon: 'verified', value: 'CNP', label: 'Programmes officiels', labelAr: 'برامج رسمية' },
    { icon: 'psychology', value: 'IA', label: 'Tuteur bilingue', labelAr: 'مساعد ذكي' },
  ];

  readonly roles: {
    role: 'teacher' | 'parent' | 'student';
    icon: string;
    accent: string;
    titleKey: string;
    descKey: string;
    openKey: string;
    signupKey: string;
    points: { fr: string; ar: string }[];
  }[] = [
    {
      role: 'teacher',
      icon: 'co_present',
      accent: '#1B4332',
      titleKey: 'teacherSpaceTitle',
      descKey: 'teacherSpaceDesc',
      openKey: 'teacherOpenBtn',
      signupKey: 'teacherSignupBtn',
      points: [
        { fr: 'Génération A4 & devoirs de synthèse', ar: 'إنشاء أوراق A4 وفروض تأليفية' },
        { fr: 'Filigrane & attribution enseignant', ar: 'علامة مائية وإسناد للمعلم' },
        { fr: 'Téléversement de documents réels', ar: 'رفع وثائق حقيقية' },
      ],
    },
    {
      role: 'parent',
      icon: 'diversity_3',
      accent: '#8A5A00',
      titleKey: 'parentSpaceTitle',
      descKey: 'parentSpaceDesc',
      openKey: 'parentOpenBtn',
      signupKey: 'parentSignupBtn',
      points: [
        { fr: 'Suivi multi‑enfants (1ère à 6ème)', ar: 'متابعة عدة أبناء (1 إلى 6)' },
        { fr: 'Messagerie officielle avec le maître', ar: 'مراسلة رسمية مع المعلم' },
        { fr: 'Accusé de réception des devoirs', ar: 'إشعار باستلام الواجبات' },
      ],
    },
    {
      role: 'student',
      icon: 'backpack',
      accent: '#BF5B34',
      titleKey: 'studentSpaceTitle',
      descKey: 'studentSpaceDesc',
      openKey: 'studentOpenBtn',
      signupKey: 'studentSignupBtn',
      points: [
        { fr: 'Photo de cahier & résolveur interactif', ar: 'صورة الكراس وحلّال تفاعلي' },
        { fr: '40 manuels scolaires CNP intégrés', ar: '40 كتاباً مدرسياً مدمجاً' },
        { fr: 'Tuteur IA bienveillant FR & AR', ar: 'مساعد ذكي لطيف بالفرنسية والعربية' },
      ],
    },
  ];

  enterWorkspace(role: UserRole) {
    this.store.switchRole(role);
  }
}
