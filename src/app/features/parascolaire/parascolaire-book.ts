import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LanguageService } from '@core';
import { ParascolaireService } from './parascolaire.service';
import { ThemeStatusFilter } from './parascolaire.models';
import { bookTitle, classLabel, filterThemes, findBook, groupBySubject, rulerSegments, subjectColor, subjectLabel, themeHasResource } from './parascolaire.logic';
import { CoverageRulerComponent } from './ui/coverage-ruler';
import { ThemeCardComponent } from './ui/theme-card';

@Component({
  selector: 'app-parascolaire-book',
  standalone: true,
  imports: [RouterLink, CoverageRulerComponent, ThemeCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="parascolaire bg-[var(--p-page)] -mx-3 sm:-mx-6 lg:-mx-8 xl:-mx-10 -mt-6 -mb-[4.5rem] px-3 sm:px-6 lg:px-8 xl:px-10 pt-6 pb-[4.5rem] min-h-[72vh]">
      <div class="max-w-[1280px] mx-auto space-y-6">
        <a
          [routerLink]="['/parascolaire']"
          [queryParams]="{ classe: classe() }"
          class="inline-flex items-center gap-1 min-h-[44px] text-[0.9375rem] text-[var(--p-blue)] hover:underline underline-offset-4">
          <span class="material-icons text-[1.125rem] rtl:rotate-180" aria-hidden="true">arrow_back</span>
          {{ className() }}
        </a>

        @switch (svc.state()) {
          @case ('error') {
            <div class="p-lined border border-[var(--p-rule)] rounded-2xl p-8 space-y-4" role="alert">
              <p class="p-display text-[1.25rem] text-[var(--p-err)]">{{ lang.tr('Le catalogue est indisponible.', 'الفهرس غير متاح حاليًا.') }}</p>
              <button type="button" class="p-btn p-btn-primary" (click)="svc.load(true)">{{ lang.tr('Réessayer', 'إعادة المحاولة') }}</button>
            </div>
          }
          @case ('ready') {
            @if (book(); as b) {
              <header class="space-y-3">
                <h1 class="p-display text-[1.75rem] sm:text-[2.5rem] leading-[1.15] max-w-[32ch]">{{ bookName() }}</h1>
                <div class="max-w-[560px] space-y-2">
                  <app-p-ruler [segments]="segments()" [label]="progress()" />
                  <p class="text-[0.9375rem]">{{ progress() }}</p>
                </div>
              </header>

              <div class="space-y-4" role="group" [attr.aria-label]="lang.tr('Filtres', 'عوامل التصفية')">
                <div class="flex flex-wrap items-center gap-2" role="group" [attr.aria-label]="lang.tr('Statut', 'الحالة')">
                  @for (o of statusOptions(); track o.value) {
                    <button type="button" [class]="chipClass(status() === o.value)" [attr.aria-pressed]="status() === o.value" (click)="setFilter('status', o.value)">
                      {{ o.label }} <span class="opacity-70">{{ o.count }}</span>
                    </button>
                  }
                </div>
                @if (b.subjects.length > 1) {
                  <div class="flex flex-wrap items-center gap-2" role="group" [attr.aria-label]="lang.tr('Matière', 'المادة')">
                    <button type="button" [class]="chipClass(subject() === 'all')" [attr.aria-pressed]="subject() === 'all'" (click)="setFilter('subject', 'all')">
                      {{ lang.tr('Toutes les matières', 'كل المواد') }}
                    </button>
                    @for (s of b.subjects; track s) {
                      <button type="button" [class]="chipClass(subject() === s)" [attr.aria-pressed]="subject() === s" (click)="setFilter('subject', s)">
                        <span class="w-2.5 h-2.5 rounded-full shrink-0" [style.background]="color(s)" aria-hidden="true"></span>
                        {{ subjectName(s) }}
                      </button>
                    }
                  </div>
                }
              </div>

              @if (themes().length > 0) {
                <div class="space-y-10">
                  @for (g of groups(); track g.subject) {
                    <section class="space-y-4" [attr.aria-label]="g.heading ? subjectName(g.subject) : null">
                      @if (g.heading) {
                        <h2 class="p-display text-[1.25rem] flex items-center gap-2 pb-2 border-b border-[var(--p-rule)]">
                          <span class="w-2.5 h-2.5 rounded-full shrink-0" [style.background]="color(g.subject)" aria-hidden="true"></span>
                          {{ subjectName(g.subject) }}
                          <span class="text-[0.9375rem] font-normal text-[var(--p-pencil)]">{{ g.items.length }}</span>
                        </h2>
                      }
                      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        @for (t of g.items; track t.id) {
                          <app-p-theme-card [theme]="t" [bookId]="b.id" />
                        }
                      </div>
                    </section>
                  }
                </div>
              } @else {
                <div class="p-lined border border-[var(--p-rule)] rounded-2xl p-8 space-y-4">
                  <p class="p-display text-[1.25rem]">{{ lang.tr('Aucun thème pour ce filtre.', 'لا توجد مواضيع لهذه التصفية.') }}</p>
                  <button type="button" class="p-btn p-btn-secondary" (click)="reset()">{{ lang.tr('Réinitialiser', 'إعادة التعيين') }}</button>
                </div>
              }
            } @else {
              <div class="p-lined border border-[var(--p-rule)] rounded-2xl p-8 space-y-4">
                <p class="p-display text-[1.25rem]">{{ lang.tr('Ressource introuvable', 'المورد غير موجود') }}</p>
                <a class="p-btn p-btn-primary" [routerLink]="['/parascolaire']">{{ lang.tr('Voir toutes les classes', 'عرض كل الأقسام') }}</a>
              </div>
            }
          }
          @default {
            <div class="space-y-4" aria-busy="true">
              <div class="p-skeleton h-[44px] max-w-[420px]"></div>
              <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                @for (n of skeleton; track n) {
                  <div class="p-skeleton h-[300px]"></div>
                }
              </div>
            </div>
          }
        }
      </div>
    </div>
  `,
})
export class ParascolaireBookComponent {
  readonly lang = inject(LanguageService);
  readonly svc = inject(ParascolaireService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly params = toSignal(this.route.paramMap, { initialValue: this.route.snapshot.paramMap });
  private readonly query = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });

  readonly skeleton = [1, 2, 3, 4, 5, 6, 7, 8];
  readonly classe = computed(() => this.params().get('classe') ?? '');
  readonly livre = computed(() => this.params().get('livre') ?? '');
  readonly book = computed(() => findBook(this.svc.catalog(), this.classe(), this.livre()));
  readonly bookName = computed(() => bookTitle(this.book(), this.lang.isArabic()));
  readonly subject = computed(() => this.query().get('subject') ?? 'all');
  readonly status = computed<ThemeStatusFilter>(() => {
    const s = this.query().get('status');
    return s === 'ready' || s === 'pending' ? s : 'all';
  });
  readonly themes = computed(() => filterThemes(this.book()?.themes ?? [], this.subject(), this.status()));
  readonly groups = computed(() => {
    const list = this.themes();
    const multi = (this.book()?.subjects.length ?? 0) > 1 && this.subject() === 'all';
    return multi
      ? groupBySubject(list, (t) => t.subject).map((g) => ({ ...g, heading: true }))
      : [{ subject: this.subject(), items: list, heading: false }];
  });
  readonly statusOptions = computed(() => {
    const all = this.book()?.themes ?? [];
    const ready = all.filter(themeHasResource).length;
    return [
      { value: 'all' as const, label: this.lang.tr('Tous', 'الكل'), count: all.length },
      { value: 'ready' as const, label: this.lang.tr('Avec ressources', 'بموارد متوفرة'), count: ready },
      { value: 'pending' as const, label: this.lang.tr('Bientôt', 'قريبًا'), count: all.length - ready },
    ];
  });
  readonly segments = computed(() => {
    const b = this.book();
    return b ? rulerSegments(b) : [];
  });
  readonly progress = computed(() => {
    const b = this.book();
    if (!b) return '';
    if (b.readyCount === 0) return this.lang.tr('Bientôt', 'قريبًا');
    return this.lang.tr(`${b.readyCount} sur ${b.themeCount} thèmes avec ressources`, `${b.readyCount} من ${b.themeCount} موضوعًا بموارد متوفرة`);
  });
  readonly className = computed(() => {
    const c = this.svc.catalog()?.classes.find((x) => x.id === this.classe());
    return c ? classLabel(c.order, c.label, this.lang.isArabic()) : this.lang.tr('Parascolaire', 'الدعم المدرسي');
  });

  constructor() {
    void this.svc.load();
  }

  color(s: string): string {
    return subjectColor(s);
  }

  chipClass(active: boolean): string {
    const base = 'inline-flex items-center gap-2 min-h-[44px] px-4 rounded-xl border text-sm cursor-pointer transition-colors';
    return active
      ? base + ' bg-[var(--p-blue)] border-[var(--p-blue)] text-[#FBF8F1] font-semibold'
      : base + ' bg-[#FBF8F1] border-[var(--p-rule)] text-[#4A5A50] font-medium hover:bg-[#F2ECDE]';
  }

  subjectName(s: string): string {
    return subjectLabel(s, this.lang.isArabic());
  }

  setFilter(key: 'subject' | 'status', value: string): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { [key]: value === 'all' ? null : value },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  reset(): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { subject: null, status: null }, queryParamsHandling: 'merge', replaceUrl: true });
  }
}
