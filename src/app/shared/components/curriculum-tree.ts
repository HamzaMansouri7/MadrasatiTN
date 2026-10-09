import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurriculumChapter, EducationStore, LanguageService, chapterById, chapterTitle, curriculumTree } from '@core';

/**
 * Official programme as a filter tree: grade → subject → trimester → topic.
 * Picking a topic sets the store's topic filter (and syncs grade + subject); the
 * badge on each topic is the number of library items already tagged with it.
 */
@Component({
  selector: 'app-curriculum-tree',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-white rounded-2xl p-5 border border-[#E7DFCF] space-y-3">
      <div class="flex items-center justify-between border-b border-[#E7DFCF] pb-3">
        <div class="flex items-center gap-2">
          <span class="material-icons text-[#1B4332] text-base" aria-hidden="true">account_tree</span>
          <h3 class="font-display font-semibold text-[#14251D] text-sm">{{ lang.tr('Programme officiel', 'البرنامج الرسمي') }}</h3>
        </div>
        @if (store.selectedTopicId()) {
          <button
            type="button"
            (click)="store.selectTopic(null)"
            class="text-[11px] text-[#8A5A00] hover:text-[#C1121F] font-semibold cursor-pointer min-h-[44px] px-1">
            {{ lang.tr('Effacer', 'مسح') }}
          </button>
        }
      </div>

      <nav [attr.aria-label]="lang.tr('Programme officiel', 'البرنامج الرسمي')" class="space-y-1">
        @for (g of tree; track g.grade) {
          <div>
            <button
              type="button"
              (click)="toggle('g:' + g.grade)"
              [attr.aria-expanded]="isOpen('g:' + g.grade)"
              class="w-full flex items-center justify-between gap-2 px-2.5 py-2.5 rounded-xl text-xs font-semibold text-[#14251D] hover:bg-[#FBF8F1] transition-colors cursor-pointer min-h-[44px]">
              <span>{{ lang.translateGrade(g.grade) }}</span>
              <span class="material-icons text-base text-[#6B7A70]" aria-hidden="true">{{ isOpen('g:' + g.grade) ? 'expand_less' : 'expand_more' }}</span>
            </button>

            @if (isOpen('g:' + g.grade)) {
              <div class="ms-2 ps-2 border-s border-[#E7DFCF] space-y-0.5">
                @for (s of g.subjects; track s.subject) {
                  <button
                    type="button"
                    (click)="toggle('s:' + g.grade + '|' + s.subject)"
                    [attr.aria-expanded]="isOpen('s:' + g.grade + '|' + s.subject)"
                    class="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-xs font-medium text-[#14251D] hover:bg-[#FBF8F1] transition-colors cursor-pointer min-h-[44px]">
                    <span class="truncate text-start">{{ lang.translateSubject(s.subject) }}</span>
                    <span class="material-icons text-base text-[#6B7A70] shrink-0" aria-hidden="true">{{ isOpen('s:' + g.grade + '|' + s.subject) ? 'expand_less' : 'expand_more' }}</span>
                  </button>

                  @if (isOpen('s:' + g.grade + '|' + s.subject)) {
                    <div class="ms-2 ps-2 border-s border-[#E7DFCF] pb-1">
                      @for (t of s.trimesters; track t.trimester) {
                        <p class="text-[10px] font-semibold uppercase tracking-wide text-[#6B7A70] px-2.5 pt-2 pb-1">
                          {{ lang.tr(t.trimester, t.trimester === 'Trimestre 1' ? 'الثلاثي الأول' : t.trimester === 'Trimestre 2' ? 'الثلاثي الثاني' : 'الثلاثي الثالث') }}
                        </p>
                        @for (ch of t.topics; track ch.id) {
                          <button
                            type="button"
                            (click)="pick(ch)"
                            [attr.aria-current]="store.selectedTopicId() === ch.id ? 'true' : null"
                            [class]="store.selectedTopicId() === ch.id
                              ? 'bg-[#1B4332]/10 text-[#14251D] font-semibold'
                              : 'text-[#4A5A50] hover:bg-[#FBF8F1]'"
                            class="w-full flex items-start justify-between gap-2 px-2.5 py-2 rounded-xl text-xs text-start transition-colors cursor-pointer min-h-[44px]">
                            <span class="line-clamp-2">{{ title(ch) }}</span>
                            <span
                              class="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                              [class]="count(ch.id) ? 'bg-[#F2ECDE] text-[#4A5A50]' : 'bg-[#F2ECDE]/50 text-[#B7C7BC]'">
                              {{ count(ch.id) }}
                            </span>
                          </button>
                        }
                      }
                    </div>
                  }
                }
              </div>
            }
          </div>
        }
      </nav>

      @if (selected(); as ch) {
        <div class="rounded-xl bg-[#FBF8F1] border border-[#E7DFCF] p-3 space-y-2">
          <p class="text-[11px] text-[#4A5A50]">
            @if (count(ch.id)) {
              {{ lang.tr(count(ch.id) + ' ressource(s) pour ce chapitre', count(ch.id) + ' مورد لهذا الدرس') }}
            } @else {
              {{ lang.tr('Aucune ressource pour ce chapitre pour l’instant.', 'لا توجد موارد لهذا الدرس بعد.') }}
            }
          </p>
          <a
            routerLink="/generate"
            [queryParams]="{ topicId: ch.id }"
            class="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1B4332] hover:text-[#2D6A4F] min-h-[44px]">
            <span class="material-icons text-sm" aria-hidden="true">auto_awesome</span>
            {{ lang.tr('Générer une fiche sur ce chapitre', 'إنشاء ورقة حول هذا الدرس') }}
          </a>
        </div>
      }
    </div>
  `,
})
export class CurriculumTreeComponent {
  readonly store = inject(EducationStore);
  readonly lang = inject(LanguageService);

  readonly tree = curriculumTree();
  private readonly openKeys = signal<ReadonlySet<string>>(new Set());

  readonly selected = computed(() => chapterById(this.store.selectedTopicId()));

  constructor() {
    // Keep the path to the selected topic open (also when it was set from a deep link).
    effect(() => {
      const ch = this.selected();
      if (!ch) return;
      this.openKeys.update((keys) => new Set([...keys, `g:${ch.grade}`, `s:${ch.grade}|${ch.subject}`]));
    });
  }

  isOpen(key: string): boolean {
    return this.openKeys().has(key);
  }

  toggle(key: string): void {
    this.openKeys.update((keys) => {
      const next = new Set(keys);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  }

  title(ch: CurriculumChapter): string {
    return chapterTitle(ch, this.lang.isArabic() ? 'ar' : 'fr');
  }

  count(id: string): number {
    return this.store.topicCounts().get(id) ?? 0;
  }

  pick(ch: CurriculumChapter): void {
    this.store.selectTopic(this.store.selectedTopicId() === ch.id ? null : ch.id);
  }
}
