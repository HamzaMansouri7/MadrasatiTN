import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LanguageService } from '@core';
import { ParascolaireService } from './parascolaire.service';
import { ParascolaireBook, ParascolaireClass } from './parascolaire.models';
import { booksOfClass, bookTitle, classLabel, groupBySubject, rulerSegments, subjectColor, subjectLabel } from './parascolaire.logic';
import { CoverageRulerComponent } from './ui/coverage-ruler';

@Component({
  selector: 'app-parascolaire-home',
  standalone: true,
  imports: [RouterLink, CoverageRulerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="parascolaire bg-[var(--p-page)] -mx-3 sm:-mx-6 lg:-mx-8 xl:-mx-10 -mt-6 -mb-[4.5rem] px-3 sm:px-6 lg:px-8 xl:px-10 pt-6 pb-[4.5rem] min-h-[72vh]">
      <div class="w-full space-y-6">
        <header class="animate-in fade-in duration-500 bg-[var(--p-ink)] text-white rounded-2xl p-6 sm:p-8 flex items-start justify-between gap-6">
          <div class="space-y-3 max-w-[56ch]">
            <h1 class="p-display text-2xl sm:text-3xl leading-tight">{{ lang.tr('Madrasati Parascolaire', 'مدرستي للدعم المدرسي') }}</h1>
            <p class="p-body text-sm sm:text-base text-[#B7C7BC]">
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
                </button>
              }
            </div>

            <div id="pbooks" role="tabpanel" [attr.aria-labelledby]="'ptab-' + selected()" class="space-y-10">
             @for (g of groups(); track g.subject) {
              <section class="space-y-4" [attr.aria-label]="groups().length > 1 ? subjectName(g.subject) : null">
                @if (groups().length > 1) {
                  <h2 class="p-display text-xl flex items-center gap-2 pb-2 border-b border-[var(--p-rule)]">
                    <span class="w-2.5 h-2.5 rounded-full shrink-0" [style.background]="color(g.subject)" aria-hidden="true"></span>
                    {{ subjectName(g.subject) }}
                    <span class="text-[0.9375rem] font-normal text-[var(--p-pencil)]">{{ g.items.length }}</span>
                  </h2>
                }
                <div class="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              @for (b of g.items; track b.id) {
                <a [routerLink]="bookLink(b)" class="group flex flex-col bg-[var(--p-surface)] border border-[var(--p-rule)] rounded-2xl overflow-hidden transition-colors hover:border-[var(--p-blue)]">
                  <div class="aspect-[3/4] bg-[var(--p-sunk)] border-b border-[var(--p-rule)] overflow-hidden">
                    @if (b.cover) {
                      <img [src]="'/' + b.cover" [alt]="bookTitle(b, lang.isArabic())" loading="lazy" decoding="async" class="w-full h-full object-cover" />
                    } @else {
                      <div class="p-lined w-full h-full flex items-end p-4" aria-hidden="true">
                        <span class="p-display text-base leading-snug text-[var(--p-ink)] line-clamp-4">{{ bookTitle(b, lang.isArabic()) }}</span>
                      </div>
                    }
                  </div>
                  <div class="p-4 flex flex-col gap-3 flex-1">
                    <p class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--p-pencil)]">
                      @for (s of b.subjects; track s) {
                        <span class="flex items-center gap-1.5">
                          <span class="w-2 h-2 rounded-full shrink-0" [style.background]="color(s)" aria-hidden="true"></span>
                          <span>{{ subjectName(s) }}</span>
                        </span>
                      }
                    </p>
                    <h3 class="p-display text-base leading-snug min-h-[2.75rem] line-clamp-2">{{ bookTitle(b, lang.isArabic()) }}</h3>
                    <div class="space-y-2 mt-auto pt-3 border-t border-[var(--p-rule)]">
                      <app-p-ruler [segments]="segments(b)" [label]="rulerLabel(b)" />
                      <p class="text-sm text-[var(--p-pencil)]">{{ progress(b) }}</p>
                    </div>
                  </div>
                </a>
              }
                </div>
              </section>
             }
            </div>
          }
          @default {
            <div class="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6" aria-busy="true" [attr.aria-label]="lang.tr('Chargement', 'جارٍ التحميل')">
              @for (n of skeleton; track n) {
                <div class="p-skeleton aspect-[3/5]"></div>
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
  readonly groups = computed(() => groupBySubject(this.books(), (b) => b.subject));

  constructor() {
    void this.svc.load();
  }

  label(c: ParascolaireClass): string {
    return classLabel(c.order, c.label, this.lang.isArabic());
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
