import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { INFOGRAPHIC_THEMES_CONFIG, InfographicDoc, InfographicSpec, sanitizeSvg, SpecImageTarget } from '@core';
import { PresetCycleComponent } from './presets/preset-cycle';
import { PresetHeroCardsComponent } from './presets/preset-hero-cards';
import { PresetTimelineComponent } from './presets/preset-timeline';
import { PresetCentralPictureComponent } from './presets/preset-central-picture';
import { PresetLessonStagesComponent } from './presets/preset-lesson-stages';
import { PresetComparisonComponent } from './presets/preset-comparison';
import { PresetProblemComponent } from './presets/preset-problem';

/**
 * Draws an AI Studio spec on an A4 sheet. The model only picks a preset and fills text;
 * layout, colour and shape come from here. Theme CSS variables come from the one theme object
 * (INFOGRAPHIC_THEMES_CONFIG, shared with images and diagrams); `kids` is scoped to these sheets.
 */
@Component({
  selector: 'app-infographic-spec',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PresetHeroCardsComponent,
    PresetCycleComponent,
    PresetTimelineComponent,
    PresetCentralPictureComponent,
    PresetLessonStagesComponent,
    PresetComparisonComponent,
    PresetProblemComponent,
  ],
  host: { '[attr.data-theme]': 'theme()', '[style]': 'themeVars()' },
  styles: `
    :host { display: block; }
    .ig-sheet {
      background: var(--ig-bg); color: var(--ig-ink); border: var(--ig-bw) solid var(--ig-border);
      border-radius: calc(var(--ig-radius) + 6px); padding: 2.25rem; min-height: 1080px;
      display: flex; flex-direction: column; gap: 1.35rem; position: relative;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
      overflow: hidden;
    }
    @media print {
      .ig-sheet {
        min-height: 0; padding: 0 !important; gap: 0.8rem;
        break-after: auto !important; page-break-after: auto !important;
      }
    }
    .ig-accent-bar {
      position: absolute;
      top: 0;
      inset-inline: 0;
      height: 6px;
      background: linear-gradient(90deg, var(--ig-a) 0%, var(--ig-b) 33%, var(--ig-c) 66%, var(--ig-d) 100%);
    }
    .ig-title { font-size: var(--ig-title); line-height: 1.22; font-weight: 800; letter-spacing: -0.015em; }
    .ig-chip {
      display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.25rem 0.85rem; border-radius: 999px;
      background: var(--ig-card); border: 1.5px solid var(--ig-border); font-size: 0.8rem; font-weight: 700;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    }
    .ig-objective {
      display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.35rem 0.85rem; border-radius: 10px;
      background: var(--ig-hero); border: 1px solid var(--ig-border); font-size: 0.85rem; font-weight: 600;
    }
    .ig-remember {
      background: linear-gradient(135deg, var(--ig-hero) 0%, rgba(255, 255, 255, 0.95) 100%);
      border: var(--ig-bw) solid var(--ig-border); border-radius: var(--ig-radius);
      padding: 1.15rem 1.35rem; display: flex; align-items: flex-start; gap: 1rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02); break-inside: avoid;
    }
    .ig-remember-icon {
      width: 2.5rem; height: 2.5rem; border-radius: 12px;
      background: #ffffff; color: var(--ig-a); border: 1.5px solid var(--ig-border);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
    }
    .ig-diagram-wrap {
      background: #ffffff;
      border: var(--ig-bw, 2px) solid var(--ig-border);
      border-radius: var(--ig-radius, 16px);
      padding: 0.85rem;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
      break-inside: avoid;
    }
    .ig-diagram :is(svg) { width: 100%; height: auto; max-height: 260px; }
  `,
  template: `
    @let s = spec();
    <div
      id="ai-studio-sheet"
      class="ig-sheet print-sheet"
      [attr.dir]="doc().language === 'fr' ? 'ltr' : 'rtl'"
      [attr.lang]="doc().language">
      <!-- Top Accent Bar -->
      <div class="ig-accent-bar" aria-hidden="true"></div>

      <header class="space-y-2.5 pt-1">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex flex-wrap items-center gap-2">
            <span class="ig-chip text-[#14251D]">{{ doc().grade }}</span>
            <span class="ig-chip" [style.color]="accent(0)">{{ doc().subject }}</span>
            @if (doc().trimester) {
              <span class="ig-chip" style="color: var(--ig-muted)">{{ doc().trimester }}</span>
            }
            @if (sheetDate()) {
              <span class="ig-chip" style="color: var(--ig-muted)">{{ sheetDate() }}</span>
            }
          </div>
          @if (doc().author?.name) {
            <div class="text-xs font-semibold flex items-center gap-1.5" style="color: var(--ig-muted)">
              <span class="material-icons text-sm text-[var(--ig-a)]" aria-hidden="true">school</span>
              <span>{{ doc().author?.name }}</span>
              @if (doc().author?.school) {
                <span>({{ doc().author?.school }})</span>
              }
            </div>
          }
        </div>

        <h2 class="ig-title font-display text-[#14251D]">{{ s.title }}</h2>

        @if (s.subtitle) {
          <div class="ig-objective" style="color: var(--ig-ink)">
            <span class="material-icons text-base" style="color: var(--ig-a)" aria-hidden="true">flag</span>
            <span class="font-bold">{{ doc().language === 'fr' ? "Objectif d'apprentissage :" : 'الهدف التعلّمي :' }}</span>
            <span>{{ s.subtitle }}</span>
          </div>
        }
      </header>

      <main class="flex-1 min-w-0">
        @switch (s.preset) {
          @case ('hero-cards') {
            <app-preset-hero-cards
              [spec]="s"
              [diagram]="diagram()"
              [accent]="accentFn"
              [illustrating]="illustrating()"
              (illustrate)="illustrate.emit($event)">
            </app-preset-hero-cards>
          }
          @case ('circular-flow') {
            <app-preset-cycle
              [spec]="s"
              [doc]="doc()"
              [diagram]="diagram()"
              [accent]="accentFn"
              [illustrating]="illustrating()"
              (illustrate)="illustrate.emit($event)">
            </app-preset-cycle>
          }
          @case ('timeline') {
            <app-preset-timeline
              [spec]="s"
              [diagram]="diagram()"
              [accent]="accentFn"
              [illustrating]="illustrating()"
              (illustrate)="illustrate.emit($event)">
            </app-preset-timeline>
          }
          @case ('central-picture') {
            <app-preset-central-picture
              [spec]="s"
              [doc]="doc()"
              [accent]="accentFn"
              [illustrating]="illustrating()"
              (illustrate)="illustrate.emit($event)">
            </app-preset-central-picture>
          }
          @case ('lesson-stages') {
            <app-preset-lesson-stages [spec]="s" [doc]="doc()" [accent]="accentFn"></app-preset-lesson-stages>
          }
          @case ('comparison') {
            <app-preset-comparison
              [spec]="s"
              [doc]="doc()"
              [accent]="accentFn"
              [illustrating]="illustrating()"
              (illustrate)="illustrate.emit($event)">
            </app-preset-comparison>
          }
          @case ('problem') {
            <app-preset-problem
              [spec]="s"
              [doc]="doc()"
              [accent]="accentFn"
              [illustrating]="illustrating()"
              (illustrate)="illustrate.emit($event)">
            </app-preset-problem>
          }
          @default {
            <app-preset-hero-cards
              [spec]="s"
              [diagram]="diagram()"
              [accent]="accentFn"
              [illustrating]="illustrating()"
              (illustrate)="illustrate.emit($event)">
            </app-preset-hero-cards>
          }
        }
      </main>

      @if (s.preset !== 'hero-cards' && s.preset !== 'circular-flow' && s.preset !== 'timeline' && diagram(); as svg) {
        <section class="ig-diagram-wrap">
          <div class="ig-diagram" [innerHTML]="svg"></div>
        </section>
      }

      @if (s.remember.length) {
        <section class="ig-remember">
          <span class="ig-remember-icon">
            <span class="material-icons text-2xl" aria-hidden="true">lightbulb</span>
          </span>
          <div class="space-y-1 flex-1 min-w-0">
            <p class="font-display font-bold text-sm text-[#14251D]">{{ doc().language === 'fr' ? 'À retenir absolument' : 'أتذكّر جيّداً' }}</p>
            <ul class="text-xs sm:text-sm space-y-1" style="color: var(--ig-muted)">
              @for (r of s.remember; track $index) {
                <li class="flex items-start gap-1.5">
                  <span class="text-xs font-bold" [style.color]="accent($index)">•</span>
                  <span>{{ r }}</span>
                </li>
              }
            </ul>
          </div>
        </section>
      }

      <footer class="mt-auto pt-3 border-t border-[var(--ig-border)] flex items-center justify-between text-xs" style="color: var(--ig-muted)">
        <span>
          {{ doc().language === 'fr' ? 'Réalisé par : ' : 'من إنجاز : ' }}
          <strong class="text-[#14251D] font-bold">{{ doc().author?.name || 'Madrasati TN' }}</strong>
          @if (doc().author?.school) {
            <span> — {{ doc().author?.school }}</span>
          }
        </span>
        <span class="font-mono font-bold tracking-wider text-[11px] opacity-70">MADRASATI TN</span>
      </footer>
    </div>
  `,
})
export class InfographicSpecComponent {
  private readonly sanitizer = inject(DomSanitizer);

  readonly doc = input.required<InfographicDoc>();
  readonly illustrating = input<string | null>(null);
  readonly illustrate = output<SpecImageTarget>();

  readonly spec = computed(() => this.doc().values as unknown as InfographicSpec);
  readonly theme = computed(() => this.doc().theme ?? 'kids');

  readonly themeVars = computed(() => {
    const t = INFOGRAPHIC_THEMES_CONFIG[this.theme()] ?? INFOGRAPHIC_THEMES_CONFIG.kids;
    const c = t.colors;
    return (
      `--ig-bg:${c.bg};--ig-ink:${c.ink};--ig-muted:${c.muted};--ig-card:${c.card};` +
      `--ig-border:${c.border};--ig-hero:${c.hero};` +
      `--ig-a:${c.accents[0]};--ig-b:${c.accents[1]};--ig-c:${c.accents[2]};--ig-d:${c.accents[3]};` +
      `--ig-radius:${t.radius};--ig-bw:${t.borderWidth};--ig-title:${t.titleSize}`
    );
  });

  /** Sheet date (created, else today), dd/mm/yyyy. */
  readonly sheetDate = computed(() => {
    const raw = this.doc().createdAt;
    const d = raw ? new Date(raw) : new Date();
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('fr-TN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  });

  /** Re-sanitized on the client too: a saved or shared doc is never trusted blindly. */
  readonly diagram = computed<SafeHtml | null>(() => {
    const clean = sanitizeSvg(this.spec().diagramSvg);
    return clean ? this.sanitizer.bypassSecurityTrustHtml(clean) : null;
  });

  readonly accentFn = (i: number) => this.accent(i);

  accent(i: number): string {
    return ['var(--ig-a)', 'var(--ig-b)', 'var(--ig-c)', 'var(--ig-d)'][i % 4];
  }
}
