import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService } from '@core';

@Component({
  selector: 'app-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="max-w-2xl mx-auto px-4 py-16 sm:py-24">
      <div class="bg-white rounded-[28px] border border-[#E7DFCF] p-8 sm:p-12 text-center">
        <span class="tn-seal mx-auto mb-6" aria-hidden="true"></span>
        <h1 class="font-display font-semibold text-[#14251D] text-2xl sm:text-3xl">
          {{ lang.tr('Cette page n’existe pas', 'هذه الصفحة غير موجودة') }}
        </h1>
        <p class="text-[#5B6B60] mt-3 max-w-[48ch] mx-auto">
          {{ lang.tr(
            'Le lien est peut-être ancien ou mal copié. Les fiches et les cours restent dans la bibliothèque.',
            'ربما الرابط قديم أو منسوخ بشكل غير كامل. الوثائق والدروس موجودة في المكتبة.'
          ) }}
        </p>
        <div class="flex flex-wrap justify-center gap-3 mt-8">
          <a routerLink="/discovery" class="bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold px-6 py-3.5 rounded-xl text-sm transition-colors cursor-pointer flex items-center gap-2 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D6A4F]">
            <span class="material-icons text-lg" aria-hidden="true">explore</span>
            {{ lang.tr('Ouvrir la bibliothèque', 'افتح المكتبة') }}
          </a>
          <a routerLink="/" class="bg-[#FBF8F1] hover:bg-[#F2ECDE] text-[#4A5A50] font-medium px-5 py-3.5 rounded-xl text-sm border border-[#E7DFCF] transition-colors cursor-pointer flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D6A4F]">
            <span class="material-icons text-lg" aria-hidden="true">home</span>
            {{ lang.tr('Accueil', 'الرئيسية') }}
          </a>
        </div>
      </div>
    </section>
  `,
})
export class NotFoundComponent {
  readonly lang = inject(LanguageService);
}
