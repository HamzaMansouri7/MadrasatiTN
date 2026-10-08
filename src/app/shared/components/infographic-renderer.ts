import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { InfographicDoc, InfographicSlot, InfographicTemplate, LanguageService, LessonPlanStage, SlotZone } from '@core';

/**
 * Draws the body of an A4 sheet from a template: slots are placed by `zone`
 * and rendered by `kind`. A new template is data only; a new `kind` is one block below.
 */
@Component({
  selector: 'app-infographic-renderer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Info strip -->
    @for (slot of zone('strip'); track slot.id) {
      <div class="bg-[#FBF8F1] border border-[#E7DFCF] rounded-2xl p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div class="flex items-center gap-2">
          <span class="material-icons text-sm text-[#2D6A4F]">class</span>
          <div>
            <p class="text-[11px] text-[#5B6B60]">{{ t('Niveau', 'المستوى') }}</p>
            <p class="font-semibold text-[#14251D]">{{ doc().grade }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span class="material-icons text-sm text-[#8A5A00]">menu_book</span>
          <div>
            <p class="text-[11px] text-[#5B6B60]">{{ t('Matière', 'المادة') }}</p>
            <p class="font-semibold text-[#14251D]">{{ doc().subject }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span class="material-icons text-sm text-[#BF5B34]">timer</span>
          <div>
            <p class="text-[11px] text-[#5B6B60]">{{ t('Durée', 'المدة') }}</p>
            <p class="font-semibold text-[#14251D]">{{ text('durationMinutes') || 45 }} {{ t('min', 'دقيقة') }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span class="material-icons text-sm text-[#14251D]">calendar_today</span>
          <div>
            <p class="text-[11px] text-[#5B6B60]">{{ t('Semaine / date', 'الأسبوع / التاريخ') }}</p>
            <p class="font-semibold text-[#14251D]">{{ text('week') || '…………' }}</p>
          </div>
        </div>
      </div>
    }

    <!-- Side column + main column -->
    @if (zone('side').length || zone('main').length) {
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div class="lg:col-span-5 space-y-4 text-xs">
          @for (slot of zone('side'); track slot.id) {
            <ng-container *ngTemplateOutlet="listTpl; context: { slot: slot }" />
          }
          @if (zone('sidePair').length) {
            <div class="grid grid-cols-2 gap-2 text-[11px]">
              @for (slot of zone('sidePair'); track slot.id) {
                <ng-container *ngTemplateOutlet="listTpl; context: { slot: slot }" />
              }
            </div>
          }
        </div>

        <div class="lg:col-span-7 space-y-2.5 text-xs">
          @for (slot of zone('main'); track slot.id) {
            <ng-container *ngTemplateOutlet="stagesTpl; context: { slot: slot }" />
          }
        </div>
      </div>
    }

    <!-- Half-width tables -->
    @if (zone('half').length) {
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
        @for (slot of zone('half'); track slot.id) {
          <div class="bg-white rounded-xl border border-[#E7DFCF] p-3.5 space-y-2">
            <p class="font-semibold flex items-center gap-1.5 border-b border-[#F2ECDE] pb-1" [style.color]="slot.color">
              <span class="material-icons text-sm">{{ slot.icon }}</span>
              <span>{{ t(slot.titleFr, slot.titleAr) }}</span>
            </p>
            <div class="space-y-1.5 text-[11px]">
              @for (row of slot.rows; track row.valueKey) {
                <p>
                  <strong [style.color]="row.color">{{ t(row.labelFr, row.labelAr) }}</strong>
                  {{ list(row.valueKey).join(' • ') }}
                </p>
              }
            </div>
          </div>
        }
      </div>
    }

    <!-- Full-width reflection lines -->
    @for (slot of zone('full'); track slot.id) {
      <div class="bg-[#FBF8F1] rounded-xl border border-[#E7DFCF] p-3.5 space-y-2 text-xs">
        <p class="font-semibold text-[#14251D] flex items-center gap-1.5">
          <span class="material-icons text-sm text-[#2D6A4F]">{{ slot.icon }}</span>
          <span>{{ t(slot.titleFr, slot.titleAr) }}</span>
        </p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-[#5B6B60]">
          @for (q of list(slot.valueKey); track $index) {
            <div class="avoid-break border-b border-[#E7DFCF] pb-1">
              <p class="font-medium text-[#14251D]">{{ q }}</p>
              <div class="h-5 border-b border-dashed border-[#E7DFCF] mt-0.5"></div>
            </div>
          }
        </div>
      </div>
    }

    <!-- list slot: checks | bullets | chips | compact -->
    <ng-template #listTpl let-slot="slot">
      @switch (slot.variant) {
        @case ('chips') {
          <div class="bg-[#FBF8F1] rounded-xl border border-[#E7DFCF] p-3 space-y-1.5">
            <p class="font-semibold flex items-center gap-1 text-[11px]" [style.color]="slot.color">
              <span class="material-icons text-xs">{{ slot.icon }}</span>
              <span>{{ t(slot.titleFr, slot.titleAr) }}</span>
            </p>
            <div class="flex flex-wrap gap-1">
              @for (item of list(slot.valueKey); track $index) {
                <span class="bg-white px-2 py-0.5 rounded-md border border-[#E7DFCF] text-[11px] text-[#5B6B60]">{{ item }}</span>
              }
            </div>
          </div>
        }
        @case ('compact') {
          <div class="bg-white p-2.5 rounded-xl border border-[#E7DFCF] space-y-1">
            <p class="font-semibold text-[#14251D] flex items-center gap-1">
              <span class="material-icons text-xs" [style.color]="slot.color">{{ slot.icon }}</span>
              <span>{{ t(slot.titleFr, slot.titleAr) }}</span>
            </p>
            <p class="text-[#5B6B60] text-[11px] leading-tight">{{ list(slot.valueKey).join(', ') }}</p>
          </div>
        }
        @default {
          <div class="bg-white rounded-xl border border-[#E7DFCF] p-3.5 space-y-2">
            <div class="flex items-center gap-1.5 font-semibold border-b border-[#F2ECDE] pb-1.5" [style.color]="slot.color">
              <span class="material-icons text-sm">{{ slot.icon }}</span>
              <span>{{ t(slot.titleFr, slot.titleAr) }}</span>
            </div>
            <ul class="space-y-1.5 text-[#4A5A50] leading-relaxed">
              @for (item of list(slot.valueKey); track $index) {
                <li class="flex items-start gap-1.5">
                  @if (slot.variant === 'checks') {
                    <span class="material-icons text-xs shrink-0 mt-0.5" [style.color]="slot.color">check_circle</span>
                  } @else {
                    <span class="font-semibold" [style.color]="slot.color" aria-hidden="true">•</span>
                  }
                  <span>{{ item }}</span>
                </li>
              }
            </ul>
          </div>
        }
      }
    </ng-template>

    <!-- timeline-stages slot -->
    <ng-template #stagesTpl let-slot="slot">
      <div class="flex items-center justify-between border-b-2 pb-1.5" [style.border-color]="slot.color">
        <div class="flex items-center gap-2 font-display font-semibold text-sm text-[#14251D]">
          <span class="material-icons text-base" [style.color]="slot.color">{{ slot.icon }}</span>
          <span>{{ t(slot.titleFr, slot.titleAr) }}</span>
        </div>
        <span class="text-[11px] text-[#5B6B60]">{{ t('Total', 'المجموع') }}: {{ totalMinutes(slot.valueKey) }} {{ t('min', 'دقيقة') }}</span>
      </div>
      <div class="space-y-2.5">
        @for (st of stages(slot.valueKey); track st.step) {
          <div class="avoid-break bg-white rounded-xl border border-[#E7DFCF] p-3 space-y-2 relative overflow-hidden">
            <div class="flex items-center justify-between gap-2 border-b border-[#F2ECDE] pb-1.5">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-lg bg-[#14251D] text-[#FBF8F1] font-display font-semibold text-[11px] flex items-center justify-center shrink-0">{{ st.step }}</span>
                <span class="font-semibold text-[#14251D] text-xs">{{ st.name }}</span>
              </div>
              <span class="bg-[#2D6A4F]/10 text-[#1B4332] font-mono text-[11px] font-semibold px-2 py-0.5 rounded-full border border-[#2D6A4F]/20">{{ st.minutes }} {{ t('min', 'د') }}</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] leading-relaxed">
              <div class="bg-[#FBF8F1] p-2 rounded-lg border border-[#E7DFCF]">
                <span class="font-semibold text-[#2D6A4F] flex items-center gap-1 text-[11px] mb-0.5"><span class="material-icons text-xs" aria-hidden="true">school</span>{{ t('Activité du maître', 'دور المعلم') }}</span>
                <span class="text-[#4A5A50]">{{ st.teacherActivity }}</span>
              </div>
              <div class="bg-[#FBF8F1] p-2 rounded-lg border border-[#E7DFCF]">
                <span class="font-semibold text-[#8A5A00] flex items-center gap-1 text-[11px] mb-0.5"><span class="material-icons text-xs" aria-hidden="true">edit</span>{{ t('Activité de l’élève', 'نشاط المتعلم') }}</span>
                <span class="text-[#4A5A50]">{{ st.studentActivity }}</span>
              </div>
            </div>
          </div>
        }
      </div>
    </ng-template>
  `,
  imports: [NgTemplateOutlet],
})
export class InfographicRendererComponent {
  private readonly lang = inject(LanguageService);

  readonly template = input.required<InfographicTemplate>();
  readonly doc = input.required<InfographicDoc>();

  private readonly values = computed<Record<string, unknown>>(
    () => (this.doc().values as Record<string, unknown>) || {},
  );

  private readonly byZone = computed(() => {
    const map = new Map<SlotZone, InfographicSlot[]>();
    for (const slot of this.template().slots) {
      map.set(slot.zone, [...(map.get(slot.zone) ?? []), slot]);
    }
    return map;
  });

  zone(z: SlotZone): InfographicSlot[] {
    return this.byZone().get(z) ?? [];
  }

  list(key: string | undefined): string[] {
    const v = key ? this.values()[key] : undefined;
    return Array.isArray(v) ? (v as string[]) : [];
  }

  text(key: string): string | number | undefined {
    const v = this.values()[key];
    return typeof v === 'string' || typeof v === 'number' ? v : undefined;
  }

  stages(key: string | undefined): LessonPlanStage[] {
    const v = key ? this.values()[key] : undefined;
    return Array.isArray(v) ? (v as LessonPlanStage[]) : [];
  }

  totalMinutes(key: string | undefined): number {
    return this.stages(key).reduce((sum, st) => sum + (st.minutes || 0), 0);
  }

  t(fr: string, ar: string): string {
    return this.doc().language === 'fr' ? fr : ar;
  }
}
