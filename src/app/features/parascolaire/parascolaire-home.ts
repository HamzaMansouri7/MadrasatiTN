import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LanguageService } from '@core';
import { ParascolaireService } from './parascolaire.service';
import { ParascolaireBook, ParascolaireClass } from './parascolaire.models';
import { booksOfClass, bookTitle, classLabel, rulerSegments, subjectColor, subjectLabel } from './parascolaire.logic';
import { CoverageRulerComponent } from './ui/coverage-ruler';

@Component({
  selector: 'app-parascolaire-home',
  standalone: true,
  imports: [RouterLink, CoverageRulerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="parascolaire bg-[var(--p-page)] -mx-3 sm:-mx-6 lg:-mx-8 xl:-mx-10 -mt-6 -mb-[4.5rem] px-3 sm:px-6 lg:px-8 xl:px-10 pt-6 pb-[4.5rem] min-h-[72vh]">
      <div class="max-w-[1280px] mx-auto space-y-8">
        <header class="animate-in fade-in duration-500 bg-[var(--p-ink)] text-white rounded-2xl p-6 sm:p-8 flex items-start justify-between gap-6">
          <div class="space-y-3 max-w-[56ch]">
            <h1 class="p-display text-[2rem] sm:text-[2.5rem] leading-[1.15]">{{ lang.tr('Madrasati Parascolaire', 'مدرستي للدعم المدرسي') }}</h1>
            <p class="p-body text-[1rem] text-[#D5DEF3]">
              {{ lang.tr('Infographies et cours en diaporama, classés par classe et par thème.', 'إنفوغرافيك ودروس مصوّرة، مرتّبة حسب القسم والموضوع.') }}
            </p>
          </div>
          <span class="tn-seal w-10 h-10 shrink-0" aria-hidden="true"></span>
        </header>

        @switch (svc.state()) {
          @case ('error') {
            <div class="p-lined border border-[var(--p-rule)] rounded-2xl p-8 space-y-4" role="alert">
              <p class="p-display text-[1.25rem] text-[var(--p-err)]">{{ lang.tr('Le catalogue est indisponible.', 'الفهرس غير متاح حاليًا.') }}</p>
              <button type="button" class="p-btn p-btn-primary" (click)="svc.load(true)">{{ lang.tr('Réessayer', 'إعادة المحاولة') }}</button>
            </div>
          }
          @case ('ready') {
            <div role="tablist" [attr.aria-label]="lang.tr('Classes', 'الأقسام')" class="flex gap-1 overflow-x-auto [scrollbar-width:none] border-b border-[var(--p-rule)]">
              @for (c of classes(); track c.id; let i = $index) {
                <button
                  type="button"
                  role="tab"
                  [id]="'ptab-' + c.id"
                  [attr.aria-selected]="c.id === selected()"
                  aria-controls="pbooks"
                  [attr.tabindex]="c.id === selected() ? 0 : -1"
                  class="shrink-0 min-h-[44px] px-4 -mb-px border-b-2 text-[0.9375rem] transition-colors cursor-pointer"
                  [class]="c.id === selected() ? 'border-[var(--p-blue)] text-[var(--p-ink)] font-semibold' : 'border-transparent text-[var(--p-pencil)] hover:text-[var(--p-ink)]'"
                  (click)="select(c.id)"
                  (keydown)="onTabKey($event, i)">
                  {{ label(c) }}
                  <span class="ms-1.5 text-[0.8125rem] text-[var(--p-pencil)]">{{ countFor(c.id) }}</span>
                </button>
              }
            </div>

            <div id="pbooks" role="tabpanel" [attr.aria-labelledby]="'ptab-' + selected()" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              @for (b of books(); track b.id) {
                <article class="bg-[var(--p-surface)] border border-[var(--p-rule)] rounded-2xl p-5 flex flex-col gap-4">
                  <div class="space-y-2">
                    <p class="flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.8125rem] text-[var(--p-pencil)]">
                      @for (s of b.subjects; track s) {
                        <span class="flex items-center gap-2">
                          <span class="w-2.5 h-2.5 rounded-full shrink-0" [style.background]="color(s)" aria-hidden="true"></span>
                          <span>{{ subjectName(s) }}</span>
                        </span>
                      }
                    </p>
                    <h3 class="p-display text-[1.25rem] leading-[1.25]">{{ bookTitle(b, lang.isArabic()) }}</h3>
                  </div>
                  <div class="space-y-2">
                    <app-p-ruler [segments]="segments(b)" [label]="rulerLabel(b)" />
                    <p class="text-[0.9375rem]">{{ progress(b) }}</p>
                  </div>
                  <a class="p-btn p-btn-primary self-start" [routerLink]="bookLink(b)">{{ lang.tr('Ouvrir', 'فتح') }}</a>
                </article>
              }
            </div>
          }
          @default {
            <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" [attr.aria-label]="lang.tr('Chargement', 'جارٍ التحميل')">
              @for (n of skeleton; track n) {
                <div class="p-skeleton h-[210px]"></div>
              }
            </div>
          }
        }
      </div>
    </div>
  `,
})
export class ParascolaireHomeComponent {
  readonly lang = inject(LanguageService);
  readonly svc = inject(ParascolaireService);
  readonly bookTitle = bookTitle;
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly query = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });

  readonly skeleton = [1, 2, 3];
  readonly classes = computed<ParascolaireClass[]>(() => this.svc.catalog()?.classes ?? []);
  readonly selected = computed(() => {
    const wanted = this.query().get('classe');
    const all = this.classes();
    return all.find((c) => c.id === wanted)?.id ?? all[0]?.id ?? '';
  });
  readonly books = computed(() => booksOfClass(this.svc.catalog(), this.selected()));

  constructor() {
    void this.svc.load();
  }

  label(c: ParascolaireClass): string {
    return classLabel(c.order, c.label, this.lang.isArabic());
  }

  countFor(classe: string): number {
    return booksOfClass(this.svc.catalog(), classe).length;
  }

  select(id: string): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { classe: id }, replaceUrl: true });
  }

  onTabKey(e: KeyboardEvent, i: number): void {
    const all = this.classes();
    const rtl = this.lang.isArabic();
    let next = -1;
    if (e.key === 'ArrowRight') next = i + (rtl ? -1 : 1);
    else if (e.key === 'ArrowLeft') next = i + (rtl ? 1 : -1);
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = all.length - 1;
    if (next < 0 || next >= all.length) return;
    e.preventDefault();
    this.select(all[next].id);
    queueMicrotask(() => document.getElementById('ptab-' + all[next].id)?.focus());
  }

  color(subject: string): string {
    return subjectColor(subject);
  }

  subjectName(subject: string): string {
    return subjectLabel(subject, this.lang.isArabic());
  }

  segments(b: ParascolaireBook) {
    return rulerSegments(b);
  }

  bookLink(b: ParascolaireBook): string[] {
    return ['/parascolaire', ...b.id.split('/')];
  }

  progress(b: ParascolaireBook): string {
    if (b.readyCount === 0) return this.lang.tr('Bientôt', 'قريبًا');
    return this.lang.tr(`${b.readyCount} sur ${b.themeCount} thèmes`, `${b.readyCount} من ${b.themeCount} موضوعًا`);
  }

  rulerLabel(b: ParascolaireBook): string {
    return this.lang.tr(
      `${b.readyCount} sur ${b.themeCount} thèmes avec ressources`,
      `${b.readyCount} من ${b.themeCount} موضوعًا بموارد متوفرة`,
    );
  }
}
