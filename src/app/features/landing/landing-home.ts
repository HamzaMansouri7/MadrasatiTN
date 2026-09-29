import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EducationStore, LanguageService, UserRole } from '@core';

@Component({
  selector: 'app-landing-home',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-12 animate-in fade-in duration-300">
      
      <!-- HERO SECTION -->
      <section class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 via-teal-800 to-indigo-950 text-white p-8 md:p-14 shadow-2xl">
        <!-- Background decorative elements -->
        <div class="absolute -right-20 -top-20 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -left-20 -bottom-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div class="relative z-10 max-w-3xl space-y-6">
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold">
            <span>🇹🇳</span>
            <span>{{ lang.t('heroBadge') }}</span>
          </div>

          <h1 class="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            {{ lang.t('heroTitle') }}
          </h1>

          <p class="text-sm sm:text-lg text-emerald-100/90 leading-relaxed font-normal">
            {{ lang.t('heroSubtitle') }}
          </p>

          <!-- Primary Call to Actions -->
          <div class="flex flex-wrap items-center gap-4 pt-3">
            <button
              type="button"
              (click)="store.openSignupModal('teacher')"
              class="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-6 py-3.5 rounded-2xl shadow-lg hover:shadow-emerald-500/30 transition-all cursor-pointer text-sm flex items-center gap-2">
              <span class="material-icons text-base">person_add</span>
              {{ lang.t('ctaFreeAccount') }}
            </button>

            <button
              type="button"
              (click)="store.openLoginModal()"
              class="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3.5 rounded-2xl border border-white/20 backdrop-blur-md transition-all cursor-pointer text-sm flex items-center gap-2">
              <span class="material-icons text-base">login</span>
              {{ lang.t('ctaLogin') }}
            </button>

            <button
              type="button"
              (click)="enterWorkspace('public')"
              class="text-emerald-200 hover:text-white font-semibold text-xs underline underline-offset-4 cursor-pointer px-2 py-1">
              {{ lang.t('ctaExploreCnp') }}
            </button>
          </div>

          <!-- Feature tags -->
          <div class="pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-emerald-100/80">
            <div class="flex items-center gap-1.5">
              <span class="material-icons text-emerald-400 text-sm">print</span>
              <span>{{ lang.tr('Impression A4 Conforme', 'طباعة A4 رسمية') }}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="material-icons text-emerald-400 text-sm">share</span>
              <span>{{ lang.tr('Partage WhatsApp Direct', 'مشاركة واتساب مباشرة') }}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="material-icons text-emerald-400 text-sm">menu_book</span>
              <span>{{ lang.tr('38 Manuels Officiels CNP', '38 كتاباً مدرسياً معتمداً') }}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="material-icons text-emerald-400 text-sm">psychology</span>
              <span>{{ lang.tr('Tuteur IA Tunisien', 'مساعد ذكي تونسي') }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ROLE WORKSPACE SELECTOR ("signup as : *") -->
      <section class="space-y-6">
        <div class="text-center max-w-xl mx-auto space-y-2">
          <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-800">
            {{ lang.t('chooseSpaceTitle') }}
          </h2>
          <p class="text-xs sm:text-sm text-slate-500">
            {{ lang.t('chooseSpaceSub') }}
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

          <!-- CARD 1: TEACHER -->
          <div class="bg-white rounded-3xl p-6 border border-emerald-100 shadow-md hover:shadow-xl transition-all flex flex-col justify-between group">
            <div class="space-y-4">
              <div class="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                👩‍🏫
              </div>
              <div>
                <span class="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Espace Pédagogique</span>
                <h3 class="text-xl font-bold text-slate-900 mt-0.5">
                  {{ lang.t('teacherSpaceTitle') }}
                </h3>
              </div>
              <p class="text-xs text-slate-600 leading-relaxed">
                {{ lang.t('teacherSpaceDesc') }}
              </p>
              <ul class="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-100">
                <li class="flex items-center gap-2">
                  <span class="material-icons text-emerald-600 text-sm">check_circle</span>
                  <span>Génération A4 & Devoirs de Synthèse</span>
                </li>
                <li class="flex items-center gap-2">
                  <span class="material-icons text-emerald-600 text-sm">check_circle</span>
                  <span>Filigrane & Attribution de l'enseignant</span>
                </li>
                <li class="flex items-center gap-2">
                  <span class="material-icons text-emerald-600 text-sm">check_circle</span>
                  <span>Téléversement de documents réels</span>
                </li>
              </ul>
            </div>

            <div class="pt-6 space-y-2">
              <button
                type="button"
                (click)="enterWorkspace('teacher')"
                class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-2xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs">
                <span>{{ lang.t('teacherOpenBtn') }}</span>
                <span class="material-icons text-xs">arrow_forward</span>
              </button>
              <button
                type="button"
                (click)="store.openSignupModal('teacher')"
                class="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold py-2.5 rounded-2xl text-xs transition-colors cursor-pointer border border-slate-200">
                {{ lang.t('teacherSignupBtn') }}
              </button>
            </div>
          </div>

          <!-- CARD 2: PARENT -->
          <div class="bg-white rounded-3xl p-6 border border-indigo-100 shadow-md hover:shadow-xl transition-all flex flex-col justify-between group">
            <div class="space-y-4">
              <div class="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-800 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                👨‍👩‍👦
              </div>
              <div>
                <span class="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">Suivi Familial</span>
                <h3 class="text-xl font-bold text-slate-900 mt-0.5">
                  {{ lang.t('parentSpaceTitle') }}
                </h3>
              </div>
              <p class="text-xs text-slate-600 leading-relaxed">
                {{ lang.t('parentSpaceDesc') }}
              </p>
              <ul class="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-100">
                <li class="flex items-center gap-2">
                  <span class="material-icons text-indigo-600 text-sm">check_circle</span>
                  <span>Suivi multi-enfants (1ère à 6ème)</span>
                </li>
                <li class="flex items-center gap-2">
                  <span class="material-icons text-indigo-600 text-sm">check_circle</span>
                  <span>Messagerie officielle avec le maître</span>
                </li>
                <li class="flex items-center gap-2">
                  <span class="material-icons text-indigo-600 text-sm">check_circle</span>
                  <span>Accusé de réception des devoirs</span>
                </li>
              </ul>
            </div>

            <div class="pt-6 space-y-2">
              <button
                type="button"
                (click)="enterWorkspace('parent')"
                class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-2xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs">
                <span>{{ lang.t('parentOpenBtn') }}</span>
                <span class="material-icons text-xs">arrow_forward</span>
              </button>
              <button
                type="button"
                (click)="store.openSignupModal('parent')"
                class="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold py-2.5 rounded-2xl text-xs transition-colors cursor-pointer border border-slate-200">
                {{ lang.t('parentSignupBtn') }}
              </button>
            </div>
          </div>

          <!-- CARD 3: STUDENT -->
          <div class="bg-white rounded-3xl p-6 border border-amber-100 shadow-md hover:shadow-xl transition-all flex flex-col justify-between group">
            <div class="space-y-4">
              <div class="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                🎒
              </div>
              <div>
                <span class="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Réussite Scolaire</span>
                <h3 class="text-xl font-bold text-slate-900 mt-0.5">
                  {{ lang.t('studentSpaceTitle') }}
                </h3>
              </div>
              <p class="text-xs text-slate-600 leading-relaxed">
                {{ lang.t('studentSpaceDesc') }}
              </p>
              <ul class="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-100">
                <li class="flex items-center gap-2">
                  <span class="material-icons text-amber-600 text-sm">check_circle</span>
                  <span>Photo de cahier & résolveur interactif</span>
                </li>
                <li class="flex items-center gap-2">
                  <span class="material-icons text-amber-600 text-sm">check_circle</span>
                  <span>38 Manuels scolaires CNP intégrés</span>
                </li>
                <li class="flex items-center gap-2">
                  <span class="material-icons text-amber-600 text-sm">check_circle</span>
                  <span>Tuteur IA bienveillant en Français & Arabe</span>
                </li>
              </ul>
            </div>

            <div class="pt-6 space-y-2">
              <button
                type="button"
                (click)="enterWorkspace('student')"
                class="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-2xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs">
                <span>{{ lang.t('studentOpenBtn') }}</span>
                <span class="material-icons text-xs">arrow_forward</span>
              </button>
              <button
                type="button"
                (click)="store.openSignupModal('student')"
                class="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold py-2.5 rounded-2xl text-xs transition-colors cursor-pointer border border-slate-200">
                {{ lang.t('studentSignupBtn') }}
              </button>
            </div>
          </div>

        </div>
      </section>

      <!-- CNP SPOTLIGHT BANNER -->
      <section class="bg-gradient-to-r from-teal-900 to-slate-900 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl border border-teal-800">
        <div class="space-y-2 max-w-xl">
          <div class="inline-flex items-center gap-2 bg-teal-800/80 px-3 py-1 rounded-full text-xs font-semibold text-teal-200">
            <span>📚</span>
            <span>{{ lang.t('cnpBannerBadge') }}</span>
          </div>
          <h3 class="text-2xl font-bold">
            {{ lang.t('cnpBannerTitle') }}
          </h3>
          <p class="text-xs text-teal-100/80 leading-relaxed">
            {{ lang.t('cnpBannerDesc') }}
          </p>
        </div>

        <button
          type="button"
          (click)="enterWorkspace('public')"
          class="shrink-0 bg-white text-teal-950 hover:bg-teal-50 font-extrabold px-6 py-3.5 rounded-2xl text-xs transition-colors cursor-pointer flex items-center gap-2 shadow-lg">
          <span class="material-icons text-teal-700 text-sm">collections_bookmark</span>
          <span>{{ lang.t('cnpBannerBtn') }}</span>
        </button>
      </section>

    </div>
  `,
})
export class LandingHomeComponent {
  readonly store = inject(EducationStore);
  readonly lang = inject(LanguageService);

  enterWorkspace(role: UserRole) {
    this.store.switchRole(role);
  }
}
