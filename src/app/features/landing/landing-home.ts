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
      <section class="relative overflow-hidden rounded-[28px] bg-[#FBF8F1] border border-[#E7DFCF] shadow-[0_20px_60px_-40px_rgba(20,38,29,0.55)] animate-in fade-in duration-500">
        <div class="grid lg:grid-cols-[1.45fr_1fr]">

          <!-- LEFT: the official document -->
          <div class="cartouche-rules p-7 sm:p-10 lg:p-12 lg:border-e border-[#E7DFCF]">
            <!-- Ministry header line with Tunisian seal -->
            <div class="flex items-center gap-3.5">
              <span class="tn-seal w-11 h-11 shrink-0" aria-hidden="true"></span>
              <div class="text-[11px] leading-snug text-[#5B6B60]">
                <span class="font-display font-semibold text-[#1B4332]">{{ lang.tr('République Tunisienne', 'الجمهورية التونسية') }}</span><br />
                {{ lang.tr('Ministère de l’Éducation · Enseignement primaire', 'وزارة التربية · التعليم الابتدائي') }}
              </div>
            </div>

            <h1 class="font-display text-[2rem] leading-[1.08] sm:text-[2.75rem] lg:text-[3rem] font-semibold text-[#14251D] mt-8 tracking-[-0.01em]">
              {{ lang.t('heroTitle') }}
            </h1>

            <p class="text-[15px] sm:text-base text-[#4A5A50] leading-relaxed mt-5 max-w-[56ch]">
              {{ lang.t('heroSubtitle') }}
            </p>

            <div class="flex flex-wrap items-center gap-3 mt-8">
              <button
                type="button"
                (click)="store.openSignupModal('teacher')"
                class="bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold px-6 py-3.5 rounded-xl text-sm transition-colors cursor-pointer flex items-center gap-2 shadow-sm">
                <span class="material-icons text-[18px]">person_add</span>
                {{ lang.t('ctaFreeAccount') }}
              </button>

              <button
                type="button"
                (click)="store.openLoginModal()"
                class="bg-transparent hover:bg-[#1B4332]/5 text-[#1B4332] font-semibold px-5 py-3.5 rounded-xl text-sm border border-[#1B4332]/25 transition-colors cursor-pointer flex items-center gap-2">
                <span class="material-icons text-[18px]">login</span>
                {{ lang.t('ctaLogin') }}
              </button>

              <button
                type="button"
                (click)="enterWorkspace('public')"
                class="text-[#8A5A00] hover:text-[#C1121F] font-semibold text-sm underline underline-offset-4 decoration-[#E7DFCF] hover:decoration-[#C1121F] cursor-pointer px-1 py-1 transition-colors">
                {{ lang.t('ctaExploreCnp') }}
              </button>
            </div>

            <!-- Proof points set as exam-sheet identity fields (ruled) -->
            <dl class="mt-10 pt-7 border-t border-[#E7DFCF] grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-5">
              @for (f of proofs; track f.label) {
                <div>
                  <dt class="flex items-center gap-1.5 text-[#1B4332]">
                    <span class="material-icons text-[17px]">{{ f.icon }}</span>
                    <span class="font-display text-lg font-semibold leading-none">{{ f.value }}</span>
                  </dt>
                  <dd class="text-[11px] text-[#6B7A70] mt-1.5 leading-tight border-t border-dashed border-[#E7DFCF] pt-1.5">
                    {{ lang.tr(f.label, f.labelAr) }}
                  </dd>
                </div>
              }
            </dl>
          </div>

          <!-- RIGHT: faux A4 exam sheet the platform produces -->
          <div class="hidden lg:flex items-center justify-center p-10 bg-[#F2ECDE]/60 relative overflow-hidden">
            <div class="sheet-watermark absolute inset-0 flex items-center justify-center text-4xl font-display font-black tracking-widest">
              MADRASATI&nbsp;TN
            </div>
            <div class="relative w-full max-w-[300px] aspect-[1/1.414] bg-white rounded-lg shadow-[0_10px_40px_-15px_rgba(20,38,29,0.35)] border border-[#E7DFCF] p-6 rotate-[-1.5deg]">
              <div class="text-center text-[9px] text-[#4A5A50] leading-tight font-display">
                {{ lang.tr('République Tunisienne — Ministère de l’Éducation', 'الجمهورية التونسية — وزارة التربية') }}
              </div>
              <div class="mt-3 grid grid-cols-3 gap-1 text-[8px] text-[#6B7A70]">
                <span class="border-b border-dotted border-[#C8BEA8] pb-2">{{ lang.tr('Nom', 'الاسم') }}</span>
                <span class="border-b border-dotted border-[#C8BEA8] pb-2">{{ lang.tr('Classe', 'القسم') }}</span>
                <span class="border-b border-dotted border-[#C8BEA8] pb-2 text-center">/20</span>
              </div>
              <div class="mt-4 space-y-2.5">
                @for (w of [80,95,70,88,60]; track w) {
                  <div class="h-1.5 rounded-full bg-[#EDE7D8]" [style.width.%]="w"></div>
                }
              </div>
              <div class="mt-5 h-px bg-[#E7DFCF]"></div>
              <div class="mt-3 flex items-center justify-between">
                <span class="tn-seal w-6 h-6" aria-hidden="true"></span>
                <span class="text-[8px] text-[#8A5A00] font-display font-semibold">CNP · 2025—2026</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      <!-- ============ ROLE WORKSPACES ============ -->
      <section class="space-y-7">
        <div class="max-w-2xl">
          <h2 class="font-display text-2xl sm:text-[1.75rem] font-semibold text-[#14251D]">
            {{ lang.t('chooseSpaceTitle') }}
          </h2>
          <p class="text-sm text-[#6B7A70] mt-2">{{ lang.t('chooseSpaceSub') }}</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
          @for (r of roles; track r.role) {
            <div class="bg-white rounded-2xl border border-[#E7DFCF] overflow-hidden flex flex-col transition-shadow hover:shadow-[0_18px_45px_-30px_rgba(20,38,29,0.5)]">
              <div class="h-1" [style.background]="r.accent"></div>
              <div class="p-6 flex flex-col grow">
                <div class="flex items-center gap-3">
                  <span class="w-11 h-11 rounded-xl flex items-center justify-center"
                        [style.background]="r.accent + '18'" [style.color]="r.accent">
                    <span class="material-icons text-[22px]">{{ r.icon }}</span>
                  </span>
                  <h3 class="font-display text-lg font-semibold text-[#14251D]">{{ lang.t(r.titleKey) }}</h3>
                </div>

                <p class="text-[13px] text-[#5B6B60] leading-relaxed mt-4">{{ lang.t(r.descKey) }}</p>

                <ul class="text-[13px] text-[#4A5A50] space-y-2.5 mt-5 pt-5 border-t border-[#F0EBDD] grow">
                  @for (pt of r.points; track pt.fr) {
                    <li class="flex items-start gap-2">
                      <span class="material-icons text-[16px] mt-0.5" [style.color]="r.accent">check</span>
                      <span>{{ lang.tr(pt.fr, pt.ar) }}</span>
                    </li>
                  }
                </ul>

                <div class="mt-6 space-y-2">
                  <button
                    type="button"
                    (click)="enterWorkspace(r.role)"
                    class="w-full text-[#FBF8F1] font-semibold py-2.5 rounded-xl text-[13px] transition-opacity hover:opacity-90 cursor-pointer flex items-center justify-center gap-1.5"
                    [style.background]="r.accent">
                    {{ lang.t(r.openKey) }}
                  </button>
                  <button
                    type="button"
                    (click)="store.openSignupModal(r.role)"
                    class="w-full bg-[#FBF8F1] hover:bg-[#F2ECDE] text-[#4A5A50] font-medium py-2.5 rounded-xl text-[13px] transition-colors cursor-pointer border border-[#E7DFCF]">
                    {{ lang.t(r.signupKey) }}
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      </section>

      <!-- ============ CNP LIBRARY ============ -->
      <section class="rounded-[28px] bg-[#14251D] text-[#FBF8F1] p-8 sm:p-11 overflow-hidden relative">
        <div class="grid lg:grid-cols-[1fr_auto] gap-9 items-center">
          <div class="max-w-xl">
            <div class="flex items-center gap-2.5 text-[#9DBBA8] text-xs font-medium">
              <span class="material-icons text-[16px]">verified</span>
              <span>{{ lang.t('cnpBannerBadge') }}</span>
            </div>
            <h3 class="font-display text-[1.75rem] sm:text-[2.1rem] font-semibold leading-tight mt-3">
              <span class="text-[#F2C14E]">40</span> {{ lang.tr('manuels scolaires officiels, numérisés et gratuits.', 'كتاباً مدرسياً رسمياً، مرقمناً ومجانياً.') }}
            </h3>
            <p class="text-sm text-[#B7C7BC] leading-relaxed mt-4">{{ lang.t('cnpBannerDesc') }}</p>

            <button
              type="button"
              (click)="enterWorkspace('public')"
              class="mt-7 bg-[#FBF8F1] text-[#14251D] hover:bg-white font-semibold px-6 py-3.5 rounded-xl text-sm transition-colors cursor-pointer inline-flex items-center gap-2">
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
