import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type CartoucheTone = 'blue' | 'green' | 'library';

/**
 * Official ministry header + student identification line printed on every A4 sheet.
 * The fixed republican text lives here once; each page projects its own centre / end columns:
 *   <app-cartouche tone="blue" [grade]="g" sub="…" class="pb-3">
 *     <div cartoucheCenter>…</div><div cartoucheEnd>…</div>
 *   </app-cartouche>
 * Spacing (pb-*, mb-*) is set by the host via `class`.
 */
@Component({
  selector: 'app-cartouche',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  host: {
    class: 'block',
    '[class]': 'hostClass()',
  },
  template: `
    <div class="flex items-center justify-between text-xs sm:text-sm">
      <div class="text-left leading-tight" [class]="leftClass()">
        <p>الجمهورية التونسية</p>
        <p>وزارة التربية والتعليم</p>
        @if (sub()) {
          <p class="text-[10px] text-[#5B6B60] font-normal">{{ sub() }}</p>
        }
      </div>
      <div class="text-center font-bold"><ng-content select="[cartoucheCenter]" /></div>
      <div class="text-right leading-tight"><ng-content select="[cartoucheEnd]" /></div>
    </div>
    <div class="mt-3 pt-2 border-t border-dashed grid grid-cols-3 gap-2 text-xs font-semibold" [class]="studentBorder()">
      <p>الاسم واللقب: ....................................</p>
      <p class="text-center">القسم: {{ grade() }}</p>
      <p class="text-right" [class]="numClass()">العدد: .......... / 20</p>
    </div>
  `,
})
export class CartoucheComponent {
  readonly tone = input<CartoucheTone>('blue');
  /** Already-translated class label printed after "القسم:". */
  readonly grade = input<string>('');
  /** Optional third ministry line (regional delegation / school). */
  readonly sub = input<string>('');

  hostClass(): string {
    switch (this.tone()) {
      case 'green':
        return 'border-b-2 border-[#14251D]';
      case 'library':
        return 'border-b border-[#14251D]';
      default:
        return 'border-b-2 border-[#102A43]';
    }
  }

  leftClass(): string {
    switch (this.tone()) {
      case 'green':
        return 'font-bold text-[#14251D]';
      case 'library':
        return 'font-semibold text-[#14251D]';
      default:
        return 'font-bold text-[#102A43]';
    }
  }

  studentBorder(): string {
    return this.tone() === 'blue' ? 'border-[#CBD2D9]' : 'border-[#E7DFCF]';
  }

  numClass(): string {
    switch (this.tone()) {
      case 'green':
        return 'font-bold text-[#2D6A4F]';
      case 'library':
        return 'font-semibold text-[#1B4332]';
      default:
        return 'font-bold text-[#007CC2]';
    }
  }
}
