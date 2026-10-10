import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { InfographicDoc, InfographicSpec, SpecImageTarget } from '@core';
import { IllustrateButtonComponent } from './illustrate-button';

/**
 * Mind Map Preset:
 * Central concept node radiating outward to thematic branches with sub-topic pills,
 * colorful category badges, and optional icons or illustrations.
 */
@Component({
  selector: 'app-preset-mindmap',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IllustrateButtonComponent],
  styles: `
    :host { display: block; }
    .mm-container {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      align-items: center;
    }
    .mm-hub {
      position: relative;
      background: linear-gradient(135deg, var(--ig-hero) 0%, #ffffff 100%);
      border: 3px solid var(--ig-a);
      border-radius: 999px;
      padding: 1.25rem 2.5rem;
      text-align: center;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
      z-index: 2;
      max-width: 90%;
    }
    .mm-hub-title {
      font-family: var(--ig-font-display);
      font-size: clamp(1.25rem, 3vw, 1.85rem);
      font-weight: 900;
      color: var(--ig-ink);
      line-height: 1.2;
    }
    .mm-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.25rem;
      width: 100%;
    }
    .mm-branch {
      background: var(--ig-card);
      border: var(--ig-bw, 2px) solid var(--ig-border);
      border-radius: var(--ig-radius, 16px);
      padding: 1rem 1.15rem;
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
      transition: transform 0.15s ease;
      break-inside: avoid;
    }
    .mm-branch-header {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }
    .mm-branch-badge {
      width: 2rem;
      height: 2rem;
      border-radius: 10px;
      color: #fff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-weight: 800;
    }
    .mm-branch-title {
      font-family: var(--ig-font-display);
      font-weight: 800;
      font-size: 1rem;
      color: var(--ig-ink);
      flex: 1;
      min-w: 0;
    }
    .mm-children {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
    }
    .mm-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.25rem 0.65rem;
      border-radius: 999px;
      background: var(--ig-hero);
      border: 1px solid var(--ig-border);
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--ig-ink);
    }
    .mm-branch-pic {
      margin-top: 0.25rem;
      border-radius: 10px;
      overflow: hidden;
      border: 1px solid var(--ig-border);
    }
    .mm-branch-pic img {
      width: 100%;
      height: 90px;
      object-fit: contain;
      background: #ffffff;
    }
    @media print {
      .mm-branch { box-shadow: none; }
    }
  `,
  template: `
    @let s = spec();
    <div class="mm-container">
      <!-- Central Hub -->
      <div class="mm-hub">
        <h2 class="mm-hub-title">{{ s.hero?.label || s.title }}</h2>
        @if (s.subtitle) {
          <p class="text-xs font-semibold mt-1" style="color: var(--ig-muted)">{{ s.subtitle }}</p>
        }
      </div>

      <!-- Radiating Branches Grid -->
      <div class="mm-grid">
        @for (it of s.items; track $index) {
          <article class="mm-branch" [style.border-top-color]="accent()($index)" [style.border-top-width]="'4px'">
            <div class="mm-branch-header">
              <span class="mm-branch-badge" [style.background]="accent()($index)">
                <span class="material-icons text-base" aria-hidden="true">{{ it.icon || 'star' }}</span>
              </span>
              <h3 class="mm-branch-title">{{ it.title }}</h3>
            </div>

            @if (it.imageUrl) {
              <div class="mm-branch-pic">
                <img [src]="it.imageUrl" [alt]="it.title" />
              </div>
            }

            <!-- Sub-concepts parsed from text -->
            <div class="mm-children">
              @for (sub of parseSubPoints(it.text); track $index) {
                <span class="mm-pill">
                  <span class="w-1.5 h-1.5 rounded-full" [style.background]="accent()($index)"></span>
                  {{ sub }}
                </span>
              }
            </div>

            @if (it.imagePrompt) {
              <div class="mt-auto pt-1">
                <app-illustrate-button
                  [prompt]="it.imagePrompt"
                  [imageUrl]="it.imageUrl"
                  [busy]="illustrating() === 'item-' + $index"
                  [disabled]="!!illustrating()"
                  (pressed)="illustrate.emit({ kind: 'item', index: $index })" />
              </div>
            }
          </article>
        }
      </div>
    </div>
  `,
})
export class PresetMindmapComponent {
  readonly spec = input.required<InfographicSpec>();
  readonly doc = input.required<InfographicDoc>();
  readonly accent = input.required<(i: number) => string>();
  readonly illustrating = input<string | null>(null);
  readonly illustrate = output<SpecImageTarget>();

  /** Splits text into short sub-concept pills by punctuation or linebreaks. */
  parseSubPoints(text: string): string[] {
    if (!text) return [];
    const parts = text
      .split(/[\n,;،•\u2022]+/g)
      .map((s) => s.trim())
      .filter((s) => s.length > 1);
    return parts.length ? parts : [text.trim()];
  }
}
