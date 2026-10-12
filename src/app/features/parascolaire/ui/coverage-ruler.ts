import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** One highlighter segment per theme: done, partial or empty. The text alternative carries the numbers. */
@Component({
  selector: 'app-p-ruler',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-ruler" role="img" [attr.aria-label]="label()">
      @for (s of segments(); track $index) {
        <span [class]="'p-seg-' + s"></span>
      }
    </div>
  `,
})
export class CoverageRulerComponent {
  readonly segments = input.required<('done' | 'partial' | 'empty')[]>();
  readonly label = input.required<string>();
}
