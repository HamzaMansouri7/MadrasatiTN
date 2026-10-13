import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService } from '@core';
import { ParascolaireTheme } from '../parascolaire.models';
import { mediaUrl, SLOT_KINDS, subjectColor, subjectLabel, themeTitle } from '../parascolaire.logic';
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
      class="group block h-full bg-[var(--p-surface)] border border-[var(--p-rule)] rounded-2xl overflow-hidden transition-colors hover:border-[var(--p-blue)]">
      <div class="aspect-[4/3] bg-[var(--p-sunk)] overflow-hidden border-b border-[var(--p-rule)]">
        @if (thumb(); as t) {
          <img
            [src]="t.src"
            [alt]="imageAlt()"
            loading="lazy"
            decoding="async"
            [class]="landscape() ? 'w-full h-full object-contain' : 'w-full h-full object-cover object-top'" />
        } @else {
          <div class="p-lined w-full h-full" aria-hidden="true"></div>
        }
      </div>
      <div class="p-4 flex flex-col gap-3">
        <p class="flex items-center gap-2 text-xs text-[var(--p-pencil)]">
          <span class="w-2.5 h-2.5 rounded-full shrink-0" [style.background]="color()" aria-hidden="true"></span>
          <span>{{ subject() }}</span>
        </p>
        <h3 class="p-display text-base leading-snug text-[var(--p-ink)] min-h-[2.75rem]">{{ title() }}</h3>
        <div class="space-y-1.5 pt-3 border-t border-[var(--p-rule)]">
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
  readonly title = computed(() => themeTitle(this.theme(), this.lang.isArabic()));
  readonly imageAlt = computed(() => this.lang.tr('Infographie : ', 'إنفوغرافيك: ') + this.title());

  /** Landscape slides must be shown whole; portrait infographics are cropped from the top. */
  readonly landscape = computed(() => {
    const s = this.theme().slots;
    return s.infographic.status === 'ready' ? s.infographic.orientation === 'landscape' : false;
  });

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
