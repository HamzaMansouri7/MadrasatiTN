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
      <section class="space-y-8">
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F5FC] dark:bg-[#102A43] text-[#007CC2] dark:text-[#168CCB] text-xs font-bold mb-3">
              <span class="material-icons text-sm">tune</span>
              <span>{{ lang.tr('Espaces de Travail Dédiés', 'فضاءات عمل مخصصة') }}</span>
            </div>
            <h2 class="font-display text-2xl sm:text-3xl font-bold text-[#102A43] dark:text-white tracking-tight">
              {{ lang.t('chooseSpaceTitle') }}
            </h2>
            <p class="text-sm sm:text-base text-[#486581] dark:text-[#8CA9C4] mt-1.5">{{ lang.t('chooseSpaceSub') }}</p>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          @for (r of roles; track r.role) {
            <div class="group relative bg-white dark:bg-[#0E1D2A] rounded-2xl border border-[#E3ECF2] dark:border-[#1A3145] p-7 flex flex-col justify-between hover:shadow-xl hover:border-transparent transition-all duration-300 overflow-hidden hover:-translate-y-1">
              
              <!-- Ambient background subtle gradient glow on hover -->
              <div class="absolute -top-20 -right-20 w-48 h-48 rounded-full opacity-0 group-hover:opacity-100 blur-2xl transition-opacity pointer-events-none"
                   [style.background]="r.gradientFrom + '25'"></div>
              
              <!-- Top color bar indicator -->
              <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r"
                   [style.backgroundImage]="'linear-gradient(to right, ' + r.gradientFrom + ', ' + r.gradientTo + ')'"></div>

              <div>
                <!-- Header: Icon & Category Badge -->
                <div class="flex items-start justify-between gap-4">
                  <div class="w-13 h-13 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-105 duration-300"
                       [style.background]="r.gradientFrom + '18'" [style.color]="r.gradientFrom">
                    <span class="material-icons text-2xl">{{ r.icon }}</span>
                  </div>
                  
                  <span class="text-[11px] font-bold px-2.5 py-1 rounded-full border shrink-0"
                        [style.color]="r.gradientFrom"
                        [style.borderColor]="r.gradientFrom + '30'"
                        [style.background]="r.gradientFrom + '10'">
                    {{ lang.tr(r.badgeFr, r.badgeAr) }}
                  </span>
                </div>

                <!-- Title & Description -->
                <h3 class="font-display text-xl font-bold text-[#102A43] dark:text-white mt-5">
                  {{ lang.t(r.titleKey) }}
                </h3>

                <p class="text-xs sm:text-[13px] text-[#486581] dark:text-[#8CA9C4] leading-relaxed mt-2.5">
                  {{ lang.t(r.descKey) }}
                </p>

                <!-- Key Capabilities / Feature Pills -->
                <div class="mt-6 pt-5 border-t border-[#E3ECF2] dark:border-[#1A3145] space-y-3">
                  @for (pt of r.points; track pt.fr) {
                    <div class="flex items-center gap-2.5 text-xs text-[#243B53] dark:text-[#CBD9E2]">
                      <div class="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                           [style.background]="r.gradientFrom + '15'" [style.color]="r.gradientFrom">
                        <span class="material-icons text-xs font-bold">check</span>
                      </div>
                      <span class="font-medium">{{ lang.tr(pt.fr, pt.ar) }}</span>
                    </div>
                  }
                </div>
              </div>

              <!-- Action CTAs -->
              <div class="mt-8 pt-5 border-t border-[#E3ECF2] dark:border-[#1A3145] space-y-2.5">
                <button
                  type="button"
                  (click)="enterWorkspace(r.role)"
                  class="w-full text-white font-semibold py-3 px-4 rounded-xl text-xs sm:text-[13px] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 shadow-sm group-hover:shadow-md group-hover:opacity-95"
                  [style.backgroundImage]="'linear-gradient(135deg, ' + r.gradientFrom + ', ' + r.gradientTo + ')'">
                  <span>{{ lang.t(r.openKey) }}</span>
                  <span class="material-icons text-base transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1">arrow_forward</span>
                </button>

                <button
                  type="button"
                  (click)="store.openSignupModal(r.role)"
                  class="w-full bg-white dark:bg-[#152737] hover:bg-[#F3FAFD] dark:hover:bg-[#1B344B] text-[#164E78] dark:text-[#8CA9C4] font-medium py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer border border-[#CBD9E2] dark:border-[#254663]">
                  {{ lang.t(r.signupKey) }}
                </button>
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
                <span class="text-[9px] text-[#8CA9C4] mt-0.5">{{ lang.tr('année', 'سنة') }}</span>
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
    gradientFrom: string;
    gradientTo: string;
    badgeFr: string;
    badgeAr: string;
    titleKey: string;
    descKey: string;
    openKey: string;
    signupKey: string;
    points: { fr: string; ar: string }[];
  }[] = [
    {
      role: 'teacher',
      icon: 'school',
      gradientFrom: '#007CC2',
      gradientTo: '#0B2947',
      badgeFr: 'Pédagogie & Évaluation',
      badgeAr: 'بيداغوجيا وامتحانات',
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
      icon: 'family_restroom',
      gradientFrom: '#0D9488',
      gradientTo: '#115E59',
      badgeFr: 'Suivi & Communication',
      badgeAr: 'متابعة وتواصل',
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
      icon: 'auto_stories',
      gradientFrom: '#EA580C',
      gradientTo: '#9A3412',
      badgeFr: 'Devoirs & Tuteur IA',
      badgeAr: 'واجبات ومساعد ذكي',
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
