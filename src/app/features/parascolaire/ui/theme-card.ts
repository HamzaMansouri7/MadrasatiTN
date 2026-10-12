import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService } from '@core';
import { ParascolaireTheme } from '../parascolaire.models';
import { mediaUrl, SLOT_KINDS, subjectColor, subjectLabel } from '../parascolaire.logic';
import { SlotRowComponent } from './slot-row';

/** One theme: image box, subject mark, title, three slot rows. The whole card is one link. */
@Component({
  selector: 'app-p-theme-card',
  standalone: true,
  imports: [RouterLink, SlotRowComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a
      [routerLink]="link()"
      class="group block h-full bg-[var(--p-surface)] border border-[var(--p-rule)] rounded-[8px] overflow-hidden transition-colors hover:border-[var(--p-blue)]">
      <div class="aspect-video bg-[var(--p-sunk)] flex items-center justify-center overflow-hidden">
        @if (thumb(); as t) {
          <img
            [src]="t.src"
            [alt]="imageAlt()"
            loading="lazy"
            decoding="async"
            class="max-h-full max-w-full object-contain rounded-[4px]" />
        } @else {
          <div class="p-lined w-full h-full" aria-hidden="true"></div>
        }
      </div>
      <div class="p-4 space-y-3">
        <p class="flex items-center gap-2 text-[0.8125rem] text-[var(--p-pencil)]">
          <span class="w-2.5 h-2.5 rounded-full shrink-0" [style.background]="color()" aria-hidden="true"></span>
          <span>{{ subject() }}</span>
        </p>
        <h3 class="p-display text-[1.25rem] leading-[1.25] text-[var(--p-ink)]">{{ theme().title }}</h3>
        <div class="space-y-1.5 pt-1">
          @for (k of kinds; track k) {
            <app-p-slot-row [kind]="k" [status]="theme().slots[k].status" />
          }
        </div>
      </div>
    </a>
  `,
})
export class ThemeCardComponent {
  readonly lang = inject(LanguageService);
  readonly theme = input.required<ParascolaireTheme>();
  /** Book id: "<classe>/<livre>". */
  readonly bookId = input.required<string>();

  readonly kinds = SLOT_KINDS;
  readonly link = computed(() => ['/parascolaire', ...this.bookId().split('/'), this.theme().id]);
  readonly color = computed(() => subjectColor(this.theme().subject));
  readonly subject = computed(() => subjectLabel(this.theme().subject, this.lang.isArabic()));
  readonly imageAlt = computed(() => this.lang.tr('Infographie : ', 'إنفوغرافيك: ') + this.theme().title);

  readonly thumb = computed(() => {
    const s = this.theme().slots;
    if (s.infographic.status === 'ready' && s.infographic.thumb) {
      return { src: mediaUrl(s.infographic.thumb) };
    }
    if (s.course.status === 'ready' && s.course.thumb) {
      return { src: mediaUrl(s.course.thumb) };
    }
    return null;
  });
}
