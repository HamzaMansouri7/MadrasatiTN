import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { LanguageService } from '@core';
import { SlotKind, SlotStatus } from '../parascolaire.models';

/** Kind name on the start side, status word on the end side. The mark is never the only signal. */
@Component({
  selector: 'app-p-slot-row',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center justify-between gap-3 text-[0.9375rem] leading-6">
      <span class="flex items-center gap-2.5 min-w-0">
        <span [class]="markClass()" aria-hidden="true"></span>
        <span [class]="status() === 'ready' ? 'text-[var(--p-ink)] font-medium' : 'text-[var(--p-pencil)]'">{{ kindLabel() }}</span>
      </span>
      <span [class]="status() === 'ready' ? 'text-[var(--p-ink)]' : 'text-[var(--p-pencil)]'" class="text-[0.8125rem] shrink-0">{{ statusLabel() }}</span>
    </div>
  `,
})
export class SlotRowComponent {
  readonly lang = inject(LanguageService);
  readonly kind = input.required<SlotKind>();
  readonly status = input.required<SlotStatus>();

  readonly markClass = computed(() => {
    const s = this.status();
    return 'p-mark ' + (s === 'ready' ? 'p-mark-ready' : s === 'in-progress' ? 'p-mark-progress' : 'p-mark-soon');
  });

  readonly kindLabel = computed(() => {
    const k = this.kind();
    return k === 'infographic'
      ? this.lang.tr('Infographie', 'إنفوغرافيك')
      : k === 'course'
        ? this.lang.tr('Cours', 'الدرس')
        : this.lang.tr('Vidéo', 'فيديو');
  });

  readonly statusLabel = computed(() => {
    const s = this.status();
    return s === 'ready'
      ? this.lang.tr('Disponible', 'متوفّر')
      : s === 'in-progress'
        ? this.lang.tr('En cours', 'قيد الإعداد')
        : this.lang.tr('Bientôt', 'قريبًا');
  });
}
