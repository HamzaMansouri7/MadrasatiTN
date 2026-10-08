import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { InfographicDoc, InfographicSpec, sanitizeSvg } from '@core';

/**
 * Draws an AI Studio spec on an A4 sheet. The model only picks a preset and fills text;
 * layout, colour and shape come from here. Themes are CSS variables on the host
 * (`kids` is scoped to these sheets, the app UI keeps the Cartouche tokens).
 */
@Component({
  selector: 'app-infographic-spec',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-theme]': 'theme()' },
  styles: `
    :host { display: block; }
    :host([data-theme='kids']) {
      --ig-bg: #FFF8E7; --ig-ink: #1F2A44; --ig-muted: #5B6478; --ig-card: #FFFFFF;
      --ig-border: #F3D9A4; --ig-hero: #FFE3A3;
      --ig-a: #E08A00; --ig-b: #1E9A63; --ig-c: #2F80ED; --ig-d: #E5484D;
      --ig-radius: 24px; --ig-bw: 3px; --ig-title: 2.4rem;
    }
    :host([data-theme='official']) {
      --ig-bg: #FBF8F1; --ig-ink: #14251D; --ig-muted: #5B6B60; --ig-card: #FFFFFF;
      --ig-border: #E7DFCF; --ig-hero: #F2ECDE;
      --ig-a: #8A5A00; --ig-b: #2D6A4F; --ig-c: #1B4332; --ig-d: #BF5B34;
      --ig-radius: 12px; --ig-bw: 1px; --ig-title: 1.9rem;
    }
    .ig-sheet {
      background: var(--ig-bg); color: var(--ig-ink); border: var(--ig-bw) solid var(--ig-border);
      border-radius: calc(var(--ig-radius) + 4px); padding: 2rem; min-height: 1100px;
      display: flex; flex-direction: column; gap: 1.25rem; position: relative;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .ig-title { font-size: var(--ig-title); line-height: 1.2; font-weight: 700; }
    .ig-chip {
      display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.15rem 0.75rem; border-radius: 999px;
      background: var(--ig-card); border: var(--ig-bw) solid var(--ig-border); font-size: 0.75rem; font-weight: 600;
    }
    .ig-card {
      background: var(--ig-card); border: var(--ig-bw) solid var(--ig-border); border-radius: var(--ig-radius);
      padding: 1rem; break-inside: avoid;
    }
    .ig-hero {
      background: var(--ig-hero); border: var(--ig-bw) solid var(--ig-border); border-radius: var(--ig-radius);
      padding: 1.25rem; display: flex; align-items: center; justify-content: center; gap: 1.5rem; flex-wrap: wrap;
    }
    .ig-hero-label { font-size: 6rem; line-height: 1; font-weight: 800; }
    .ig-badge {
      width: 2rem; height: 2rem; border-radius: 999px; color: #fff; font-weight: 700; font-size: 0.9rem;
      display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .ig-diagram :is(svg) { width: 100%; height: auto; max-height: 260px; }
    .ig-ring { position: relative; width: 100%; aspect-ratio: 4 / 3; }
    .ig-ring-node { position: absolute; width: 34%; transform: translate(-50%, -50%); }
    .ig-ring-center {
      position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
      width: 26%; text-align: center;
    }
    .ig-line { position: absolute; inset-inline-start: 1rem; top: 0.5rem; bottom: 0.5rem; width: 0; border-inline-start: 3px dashed var(--ig-border); }
  `,
  template: `
    @let s = spec();
    <div
      id="ai-studio-sheet"
      class="ig-sheet print-sheet"
      [attr.dir]="doc().language === 'fr' ? 'ltr' : 'rtl'"
      [attr.lang]="doc().language">
      <header class="space-y-2">
        <div class="flex flex-wrap items-center gap-2">
          <span class="ig-chip">{{ doc().grade }}</span>
          <span class="ig-chip">{{ doc().subject }}</span>
        </div>
        <h2 class="ig-title font-display">{{ s.title }}</h2>
        @if (s.subtitle) {
          <p class="text-base" style="color: var(--ig-muted)">{{ s.subtitle }}</p>
        }
      </header>

      @switch (s.preset) {
        @case ('hero-cards') {
          @if (s.hero || diagram()) {
            <section class="ig-hero">
              @if (s.hero; as hero) {
                <div class="text-center">
                  <p class="ig-hero-label font-display" [style.color]="accent(0)">{{ hero.label }}</p>
                  @if (hero.caption) {
                    <p class="text-sm font-semibold mt-1" style="color: var(--ig-muted)">{{ hero.caption }}</p>
                  }
                </div>
              }
              @if (diagram(); as svg) {
                <div class="ig-diagram flex-1 min-w-48" [innerHTML]="svg"></div>
              }
            </section>
          }
          <section class="grid grid-cols-2 gap-4">
            @for (it of s.items; track $index) {
              <article class="ig-card space-y-2">
                <div class="flex items-center gap-2">
                  <span class="ig-badge" [style.background]="accent($index)">
                    <span class="material-icons text-base" aria-hidden="true">{{ it.icon }}</span>
                  </span>
                  <h3 class="font-display font-semibold text-base">{{ it.title }}</h3>
                </div>
                <p class="text-sm leading-relaxed" style="color: var(--ig-muted)">{{ it.text }}</p>
              </article>
            }
          </section>
        }

        @case ('circular-flow') {
          <section class="ig-ring">
            <svg class="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <ellipse cx="50" cy="50" rx="40" ry="38" fill="none" stroke-width="0.6" stroke-dasharray="2 1.6" stroke="currentColor" style="color: var(--ig-border)" />
            </svg>
            <div class="ig-ring-center">
              @if (s.hero; as hero) {
                <p class="font-display font-bold text-3xl" [style.color]="accent(0)">{{ hero.label }}</p>
                @if (hero.caption) {
                  <p class="text-xs" style="color: var(--ig-muted)">{{ hero.caption }}</p>
                }
              }
            </div>
            @for (it of s.items; track $index) {
              <article class="ig-card ig-ring-node space-y-1" [style.left.%]="ringX($index, s.items.length)" [style.top.%]="ringY($index, s.items.length)">
                <div class="flex items-center gap-2">
                  <span class="ig-badge" [style.background]="accent($index)">{{ $index + 1 }}</span>
                  <h3 class="font-display font-semibold text-sm">{{ it.title }}</h3>
                </div>
                <p class="text-xs leading-snug" style="color: var(--ig-muted)">{{ it.text }}</p>
              </article>
            }
          </section>
          @if (diagram(); as svg) {
            <div class="ig-card ig-diagram" [innerHTML]="svg"></div>
          }
        }

        @case ('timeline') {
          <section class="relative space-y-4 ps-12">
            <span class="ig-line" aria-hidden="true"></span>
            @for (it of s.items; track $index) {
              <article class="relative ig-card">
                <span class="ig-badge absolute top-3 -start-12" [style.background]="accent($index)">{{ $index + 1 }}</span>
                <div class="flex items-center gap-2 mb-1">
                  <span class="material-icons text-lg" [style.color]="accent($index)" aria-hidden="true">{{ it.icon }}</span>
                  <h3 class="font-display font-semibold text-base">{{ it.title }}</h3>
                </div>
                <p class="text-sm leading-relaxed" style="color: var(--ig-muted)">{{ it.text }}</p>
              </article>
            }
          </section>
          @if (diagram(); as svg) {
            <div class="ig-card ig-diagram" [innerHTML]="svg"></div>
          }
        }
      }

      @if (s.remember.length) {
        <section class="ig-hero" style="justify-content: flex-start; gap: 0.75rem; padding: 1rem; break-inside: avoid">
          <span class="material-icons text-2xl" [style.color]="accent(1)" aria-hidden="true">lightbulb</span>
          <div class="space-y-0.5">
            <p class="font-display font-semibold text-sm">{{ doc().language === 'fr' ? 'À retenir' : 'أتذكّر' }}</p>
            <ul class="text-sm space-y-0.5">
              @for (r of s.remember; track $index) {
                <li>{{ r }}</li>
              }
            </ul>
          </div>
        </section>
      }

      <footer class="mt-auto pt-2 flex items-center justify-between text-[11px]" style="color: var(--ig-muted)">
        <span>
          {{ doc().language === 'fr' ? 'Réalisé par : ' : 'من إنجاز : ' }}
          <strong style="color: var(--ig-ink)">{{ doc().author?.name || 'Madrasati TN' }}</strong>
          @if (doc().author?.school) {
            <span> — {{ doc().author?.school }}</span>
          }
        </span>
        <span class="font-mono">Madrasati TN</span>
      </footer>
    </div>
  `,
})
export class InfographicSpecComponent {
  private readonly sanitizer = inject(DomSanitizer);

  readonly doc = input.required<InfographicDoc>();

  readonly spec = computed(() => this.doc().values as unknown as InfographicSpec);
  readonly theme = computed(() => this.doc().theme ?? 'kids');

  /** Re-sanitized on the client too: a saved or shared doc is never trusted blindly. */
  readonly diagram = computed<SafeHtml | null>(() => {
    const clean = sanitizeSvg(this.spec().diagramSvg);
    return clean ? this.sanitizer.bypassSecurityTrustHtml(clean) : null;
  });

  accent(i: number): string {
    return ['var(--ig-a)', 'var(--ig-b)', 'var(--ig-c)', 'var(--ig-d)'][i % 4];
  }

  /** Positions on the ring: first item at the top, clockwise. */
  ringX(i: number, n: number): number {
    const mirror = this.doc().language === 'fr' ? 1 : -1;
    return 50 + mirror * 40 * Math.cos(this.angle(i, n));
  }

  ringY(i: number, n: number): number {
    return 50 + 38 * Math.sin(this.angle(i, n));
  }

  private angle(i: number, n: number): number {
    return -Math.PI / 2 + (2 * Math.PI * i) / Math.max(n, 1);
  }
}
