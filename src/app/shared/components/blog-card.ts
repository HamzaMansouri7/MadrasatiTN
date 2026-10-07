import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { BlogPost, LanguageService } from '@core';

export type BlogCardAccent = 'blue' | 'green' | 'library';

@Component({
  selector: 'app-blog-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="cardClasses()">
      @if (showCover() && post().coverImage) {
        <div class="h-40 w-full overflow-hidden bg-[#F2ECDE] border-b" [class]="borderClass()">
          <img
            [src]="post().coverImage"
            [alt]="post().title"
            loading="lazy"
            class="w-full h-full object-cover transition-transform hover:scale-105 duration-300" />
        </div>
      }

      <div [class]="innerClasses()">
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span [class]="subjectBadgeClass()">
                {{ lang.translateSubject(post().subject || 'Pédagogie') }}
              </span>
              @if (post().grade) {
                <span [class]="gradeBadgeClass()">
                  {{ lang.translateGrade(post().grade) }}
                </span>
              }
            </div>
            <span [class]="metaTextClass()">
              <span class="material-icons text-xs" aria-hidden="true">schedule</span>
              {{ post().readTimeMinutes }} min {{ lang.tr('de lecture', 'قراءة') }}
            </span>
          </div>

          <h4
            (click)="open.emit(post())"
            (keydown.enter)="open.emit(post())"
            tabindex="0"
            role="button"
            [class]="titleClass()">
            {{ lang.isArabic() && post().titleAr ? post().titleAr : post().title }}
          </h4>

          <p [class]="excerptClass()">
            {{ cleanExcerpt(lang.isArabic() && post().excerptAr ? post().excerptAr : post().excerpt) }}
          </p>

          @if (post().tags && post().tags.length > 0) {
            <div class="flex flex-wrap gap-1.5 pt-1">
              @for (tag of post().tags; track tag) {
                <span [class]="tagClass()">
                  #{{ tag }}
                </span>
              }
            </div>
          }
        </div>

        <!-- Post Footer -->
        <div class="pt-4 border-t flex items-center justify-between gap-3 text-xs" [class]="borderClass()">
          <div class="flex items-center gap-3">
            <button
              type="button"
              (click)="like.emit(post().id)"
              [class]="likeBtnClass()">
              <span class="material-icons text-sm" aria-hidden="true">favorite</span>
              <span>{{ post().likesCount }}</span>
            </button>
            <span [class]="metaTextClass()">
              <span class="material-icons text-sm" aria-hidden="true">chat_bubble_outline</span>
              {{ post().comments.length }} {{ lang.tr('commentaires', 'تعليقات') }}
            </span>
          </div>

          <button
            type="button"
            (click)="open.emit(post())"
            [class]="readMoreClass()">
            <span>{{ lang.tr('Lire l’article', 'قراءة المقال') }}</span>
            <span class="material-icons text-sm" [class.rtl:rotate-180]="lang.isArabic()" aria-hidden="true">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  `,
})
export class BlogCardComponent {
  readonly lang = inject(LanguageService);

  readonly post = input.required<BlogPost>();
  readonly accent = input<BlogCardAccent>('blue');
  readonly showCover = input<boolean>(true);

  readonly open = output<BlogPost>();
  readonly like = output<string>();

  protected readonly borderClass = computed(() =>
    this.accent() === 'blue' ? 'border-[#E3ECF2]' : 'border-[#E7DFCF]'
  );

  protected readonly cardClasses = computed(() => {
    return this.accent() === 'blue'
      ? 'bg-[#F7F9FB] rounded-[20px] border border-[#E3ECF2] overflow-hidden flex flex-col justify-between hover:shadow-md transition-all'
      : 'bg-[#FBF8F1] rounded-[20px] border border-[#E7DFCF] overflow-hidden flex flex-col justify-between hover:shadow-md transition-all';
  });

  protected readonly innerClasses = computed(() => {
    return 'p-6 space-y-4 flex-1 flex flex-col justify-between';
  });

  protected readonly subjectBadgeClass = computed(() => {
    return this.accent() === 'blue'
      ? 'bg-[#23845B]/10 text-[#23845B] text-[10px] font-bold px-2.5 py-0.5 rounded-full'
      : 'bg-[#2D6A4F]/10 text-[#2D6A4F] text-[10px] font-bold px-2.5 py-0.5 rounded-full';
  });

  protected readonly gradeBadgeClass = computed(() => {
    return this.accent() === 'blue'
      ? 'bg-[#E0AA32]/15 text-[#9E6A00] text-[10px] font-bold px-2 py-0.5 rounded-full'
      : 'bg-[#F2C14E]/15 text-[#8A5A00] text-[10px] font-bold px-2 py-0.5 rounded-full';
  });

  protected readonly metaTextClass = computed(() => {
    return this.accent() === 'blue'
      ? 'text-[11px] text-[#627D98] flex items-center gap-1 font-medium'
      : 'text-[11px] text-[#5B6B60] flex items-center gap-1 font-medium';
  });

  protected readonly titleClass = computed(() => {
    return this.accent() === 'blue'
      ? 'font-display font-semibold text-[#102A43] text-base leading-snug cursor-pointer hover:text-[#007CC2] transition-colors'
      : 'font-display font-semibold text-[#14251D] text-base leading-snug cursor-pointer hover:text-[#2D6A4F] transition-colors';
  });

  protected readonly excerptClass = computed(() => {
    return this.accent() === 'blue'
      ? 'text-xs text-[#486581] leading-relaxed line-clamp-3'
      : 'text-xs text-[#5B6B60] leading-relaxed line-clamp-3';
  });

  protected readonly tagClass = computed(() => {
    return this.accent() === 'blue'
      ? 'text-[10px] bg-white text-[#627D98] px-2 py-0.5 rounded-md border border-[#E3ECF2]'
      : 'text-[10px] bg-white text-[#5B6B60] px-2 py-0.5 rounded-md border border-[#E7DFCF]';
  });

  protected readonly likeBtnClass = computed(() => {
    return this.accent() === 'blue'
      ? 'flex items-center gap-1 text-[#D64545] font-semibold hover:opacity-80 cursor-pointer bg-white px-2.5 py-1 rounded-full border border-[#E3ECF2]'
      : 'flex items-center gap-1 text-[#C1121F] font-semibold hover:opacity-80 cursor-pointer bg-white px-2.5 py-1 rounded-full border border-[#E7DFCF]';
  });

  protected readonly readMoreClass = computed(() => {
    return this.accent() === 'blue'
      ? 'text-[#007CC2] font-semibold hover:underline flex items-center gap-1 cursor-pointer'
      : 'text-[#2D6A4F] font-semibold hover:underline flex items-center gap-1 cursor-pointer';
  });

  cleanExcerpt(text?: string): string {
    if (!text) return '';
    return text.replace(/[#*`_~]/g, '').trim();
  }
}
