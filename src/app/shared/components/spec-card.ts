import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Standard reusable card for all infographic presets.
 * Features high-legibility Arabic & French typography, subtle tactile depth,
 * badge pill styling, and an optional action slot for illustration generation.
 * Images are framed cleanly without cropping character faces or objects.
 */
@Component({
  selector: 'app-spec-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; height: 100%; }
    .ig-card {
      background: var(--ig-card);
      border: var(--ig-bw, 2px) solid var(--ig-border);
      border-radius: var(--ig-radius, 18px);
      padding: 1.15rem;
      break-inside: avoid;
      position: relative;
      height: 100%;
      display: flex;
      flex-direction: column;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .ig-badge {
      width: 2.25rem;
      height: 2.25rem;
      border-radius: 12px;
      color: #ffffff;
      font-weight: 800;
      font-size: 0.95rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
    }
    .ig-img-wrap {
      overflow: hidden;
      border-radius: calc(var(--ig-radius, 18px) - 6px);
      border: 1px solid var(--ig-border);
      background: var(--ig-hero);
      margin-bottom: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `,
  template: `
    <article class="ig-card">
      @if (imageUrl()) {
        <div class="ig-img-wrap">
          <img [src]="imageUrl()" [alt]="imageAlt() || title()" class="w-full h-32 sm:h-36 object-contain p-1 rounded-lg" />
        </div>
      }

      <div class="flex items-center gap-2.5 mb-2">
        @if (showBadge() && (badge() || icon())) {
          <span class="ig-badge" [style.background]="badgeBg()">
            @if (icon()) {
              <span class="material-icons text-[1.15rem]" aria-hidden="true">{{ icon() }}</span>
            } @else {
              <span>{{ badge() }}</span>
            }
          </span>
        }
        <h3 class="font-display font-bold text-[#14251D] tracking-tight leading-snug" [class]="size() === 'sm' ? 'text-sm' : 'text-base sm:text-lg'">
          {{ title() }}
        </h3>
      </div>

      @if (count(); as n) {
        <div class="flex flex-wrap gap-1.5 mb-2" role="img" [attr.aria-label]="n">
          @for (_ of dots(); track $index) {
            <span class="w-4 h-4 rounded-full" [style.background]="badgeBg()"></span>
          }
        </div>
      }

      <p class="leading-relaxed flex-1" [class]="size() === 'sm' ? 'text-xs leading-snug' : 'text-sm'" style="color: var(--ig-muted)">
        {{ text() }}
      </p>

      <ng-content select="[cardAction]"></ng-content>
    </article>
  `,
})
export class SpecCardComponent {
  readonly title = input.required<string>();
  readonly text = input.required<string>();
  readonly icon = input<string>('');
  readonly badge = input<string | number>('');
  readonly badgeBg = input<string>('var(--ig-a)');
  readonly imageUrl = input<string | undefined>(undefined);
  readonly imageAlt = input<string>('');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly showBadge = input<boolean>(true);
  /** Exact quantity drawn as dots (counting lessons); never left to the image model. */
  readonly count = input<number | undefined>(undefined);
  readonly dots = computed(() => Array.from({ length: Math.min(Math.max(this.count() ?? 0, 0), 10) }));
}
