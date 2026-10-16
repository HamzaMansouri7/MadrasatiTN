import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { InfographicStudioComponent } from './infographic-studio';
import { MemoStudioComponent } from './memo/memo-studio';

export type AiStudioTab = 'infographic' | 'memo';

/**
 * AI Studio: infographic or memo, chosen by `?tab=` from the creation tab bar (app shell),
 * so links and notifications can deep-link to either.
 */
@Component({
  selector: 'app-ai-studio',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [InfographicStudioComponent, MemoStudioComponent],
  template: `
    <div class="bg-[#FBF8F1] text-[#14251D]">
      @if (tab() === 'memo') {
        <app-memo-studio />
      } @else {
        <app-infographic-studio />
      }
    </div>
  `,
})
export class AiStudioComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);

  readonly tab = signal<AiStudioTab>('infographic');

  ngOnInit() {
    this.route.queryParamMap.subscribe((params) => {
      const t = params.get('tab');
      this.tab.set(t === 'memo' ? 'memo' : 'infographic');
    });
  }
}
