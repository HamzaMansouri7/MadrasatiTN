import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { InfographicDoc, InfographicSpec, resolveTheme, sanitizeSvg, SpecImageTarget } from '@core';
import { PresetCycleComponent } from './presets/preset-cycle';
import { PresetHeroCardsComponent } from './presets/preset-hero-cards';
import { PresetTimelineComponent } from './presets/preset-timeline';
import { PresetCentralPictureComponent } from './presets/preset-central-picture';
import { PresetLessonStagesComponent } from './presets/preset-lesson-stages';
import { PresetComparisonComponent } from './presets/preset-comparison';
import { PresetProblemComponent } from './presets/preset-problem';
import { PresetPictureRowsComponent } from './presets/preset-picture-rows';
import { PresetStepsInterfaceComponent } from './presets/preset-steps-interface';
import { PresetMindmapComponent } from './presets/preset-mindmap';
import { PresetFlashcardsComponent } from './presets/preset-flashcards';

/**
 * Draws an AI Studio spec on an A4 sheet. The model only picks a preset and fills text;
 * layout, colour and shape come from here. Theme CSS variables come from the one theme object
 * (resolveTheme, shared with images and diagrams); themes are scoped to these sheets.
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
    PresetPictureRowsComponent,
    PresetStepsInterfaceComponent,
    PresetMindmapComponent,
    PresetFlashcardsComponent,
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
      /* The fiche frame and stars sit in the padding, so it is kept on paper. */
      .ig-sheet[data-frame='fiche'] { padding: 1.5rem 1.4rem 1.1rem !important; gap: 0.6rem; }
    }
    .ig-accent-bar {
      position: absolute;
      top: 0;
      inset-inline: 0;
      height: 6px;
      background: linear-gradient(90deg, var(--ig-a) 0%, var(--ig-b) 33%, var(--ig-c) 66%, var(--ig-d) 100%);
    }
    .ig-title {
      font-family: var(--ig-font-display); color: var(--ig-title-color);
      font-size: var(--ig-title); line-height: 1.22; font-weight: 800; letter-spacing: -0.015em;
    }
    .ig-heading { font-family: var(--ig-font-display); color: var(--ig-heading); }

    /* Fiche frame: dashed navy border inset from the sheet edge, stars around it, flag badge. */
    .ig-frame, .ig-stars, .ig-flag { display: none; }
    .ig-sheet[data-frame='fiche'] { border-color: var(--ig-border); padding: 2.75rem 2.6rem 2.25rem; }
    .ig-sheet[data-frame='fiche'] .ig-accent-bar { display: none; }
    .ig-sheet[data-frame='fiche'] .ig-frame {
      display: block; position: absolute; inset: 0.9rem; pointer-events: none;
      border: 2px dashed var(--ig-border); border-radius: var(--ig-radius); opacity: 0.55;
    }
    .ig-sheet[data-frame='fiche'] .ig-stars { display: block; position: absolute; inset: 0; pointer-events: none; }
    .ig-star { position: absolute; width: 14px; height: 14px; }
    .ig-sheet[data-frame='fiche'] .ig-flag {
      display: block; position: absolute; top: 1.35rem; inset-inline-end: 1.6rem; width: 42px; height: 28px;
      border-radius: 4px; box-shadow: 0 0 0 1.5px var(--ig-card), 0 1px 3px rgba(0, 0, 0, 0.15);
    }
    .ig-sheet[data-frame='fiche'] header { padding-inline-end: 3.25rem; }
    .ig-sheet[data-frame='fiche'] .ig-chip { border-color: var(--ig-border); }

    /* Notebook frame: subtle lined paper background, red margin line */
    .ig-sheet[data-frame='notebook'] {
      background-color: var(--ig-bg);
      background-image: repeating-linear-gradient(transparent, transparent 31px, rgba(226, 217, 200, 0.35) 32px);
      border-color: var(--ig-border);
      position: relative;
      padding-inline-start: 4.25rem;
    }
    .ig-sheet[data-frame='notebook']::before {
      content: ''; position: absolute; top: 0; bottom: 0;
      inset-inline-start: 3.25rem; width: 2px;
      background: rgba(230, 57, 70, 0.35); pointer-events: none;
    }
    .ig-sheet[data-frame='notebook'] .ig-remember {
      border: 1.5px dashed var(--ig-border); background: var(--ig-tip);
    }

    /* Graph frame: technical millimeter grid background */
    .ig-sheet[data-frame='graph'] {
      background-color: var(--ig-bg);
      background-image:
        linear-gradient(to right, rgba(2, 132, 199, 0.08) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(2, 132, 199, 0.08) 1px, transparent 1px);
      background-size: 20px 20px;
      border-color: var(--ig-border);
    }
    .ig-sheet[data-frame='graph'] .ig-accent-bar {
      height: 5px;
      background: linear-gradient(90deg, #0284C7 0%, #0D9488 50%, #2563EB 100%);
    }

    /* Poster frame: bold high-contrast classroom poster frame */
    .ig-sheet[data-frame='poster'] {
      border: 4px solid var(--ig-border);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
    }
    .ig-sheet[data-frame='poster'] .ig-accent-bar { height: 8px; }

    /* Comic frame: heavy comic ink borders */
    .ig-sheet[data-frame='comic'] {
      border: 3.5px solid #18181B;
      box-shadow: 4px 4px 0px #18181B;
    }
    .ig-sheet[data-frame='comic'] .ig-accent-bar { height: 6px; background: #18181B; }

    /* Boxed frame: purple outlined sheet, header strip as a rounded banner, no stars. */
    .ig-sheet[data-frame='boxed'] { border: 2px solid var(--ig-border); border-radius: 18px; }
    .ig-sheet[data-frame='boxed'] .ig-accent-bar { display: none; }
    .ig-sheet[data-frame='boxed'] .ig-strip { background: var(--ig-hero); }

    /* Fiche header: date | title | grade, three cells in one bordered strip. */
    .ig-strip {
      display: grid; grid-template-columns: minmax(6.5rem, 0.7fr) 2fr minmax(7rem, 0.8fr); align-items: stretch;
      border: var(--ig-bw) solid var(--ig-border); border-radius: var(--ig-radius); overflow: hidden;
      background: var(--ig-card); break-inside: avoid;
    }
    .ig-strip > * + * { border-inline-start: var(--ig-bw) solid var(--ig-border); }
    .ig-strip-side {
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.15rem;
      padding: 0.6rem 0.5rem; text-align: center; font-weight: 700; font-size: 0.85rem; color: var(--ig-heading);
    }
    .ig-strip-side .material-icons { font-size: 1.5rem; color: var(--ig-a); }
    .ig-strip-grade { font-family: var(--ig-font-display); font-size: 1.05rem; color: var(--ig-a); }
    .ig-strip-title { margin: 0; padding: 0.55rem 0.9rem; text-align: center; display: flex; align-items: center; justify-content: center; }

    /* What the student must do: shown on every theme, tinted by the theme's hero colour. */
    .ig-instruction {
      padding: 0.55rem 1rem; text-align: center; font-weight: 600; font-size: 0.95rem; line-height: 1.5;
      color: var(--ig-heading); background: var(--ig-hero);
      border: var(--ig-bw) solid var(--ig-border); border-radius: var(--ig-radius); break-inside: avoid;
    }
    .ig-chip {
      display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.25rem 0.85rem; border-radius: 999px;
      background: var(--ig-card); border: 1.5px solid var(--ig-border); font-size: 0.8rem; font-weight: 700;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    }
    .ig-objective {
      display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; padding: 0.4rem 0.85rem; border-radius: 10px;
      background: var(--ig-hero); border: 1px solid var(--ig-border); font-size: 0.85rem; font-weight: 600;
    }
    .ig-remember {
      background: linear-gradient(135deg, var(--ig-tip) 0%, rgba(255, 255, 255, 0.95) 100%);
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
      [attr.lang]="doc().language"
      [attr.data-frame]="frame()">
      <!-- Top Accent Bar -->
      <div class="ig-accent-bar" aria-hidden="true"></div>

      @if (frame() === 'fiche') {
        <div class="ig-frame" aria-hidden="true"></div>
        <div class="ig-stars" aria-hidden="true">
          @for (st of stars; track $index) {
            <svg class="ig-star" viewBox="0 0 24 22" [style.top]="st.top" [style.left]="st.left" [style.right]="st.right"
              [style.width.px]="st.size" [style.height.px]="st.size">
              <polygon [attr.fill]="st.color"
                points="12,1 14.7,8.28 22.46,8.6 16.37,13.42 18.47,20.9 12,16.6 5.53,20.9 7.63,13.42 1.54,8.6 9.3,8.28" />
            </svg>
          }
        </div>
        <!-- Tunisian flag: red field, white disc, red crescent and star. -->
        <svg class="ig-flag" viewBox="0 0 60 40" aria-hidden="true">
          <rect width="60" height="40" rx="3" fill="#E70013" />
          <circle cx="30" cy="20" r="10" fill="#FFFFFF" />
          <circle cx="31" cy="20" r="7.5" fill="#E70013" />
          <circle cx="33" cy="20" r="6" fill="#FFFFFF" />
          <polygon fill="#E70013"
            points="28.1,20 31.02,19 31.07,15.91 32.93,18.38 35.88,17.47 34.1,20 35.88,22.53 32.93,21.62 31.07,24.09 31.02,21" />
        </svg>
      }

      <header class="space-y-2.5 pt-1">
        @if (frame() === 'fiche' || frame() === 'boxed') {
          <div class="ig-strip">
            <div class="ig-strip-side">
              <span class="material-icons" aria-hidden="true">event</span>
              <span>{{ sheetDate() }}</span>
            </div>
            <h2 class="ig-title ig-strip-title">{{ s.title }}</h2>
            <div class="ig-strip-side">
              <span class="ig-strip-grade">{{ doc().grade }}</span>
              <span>{{ doc().subject }}</span>
              @if (doc().trimester) {
                <span class="opacity-75">{{ doc().trimester }}</span>
              }
            </div>
          </div>
        }
        <div class="flex flex-wrap items-center justify-between gap-2" [class.hidden]="(frame() === 'fiche' || frame() === 'boxed') && !doc().author?.name">
          <div class="flex flex-wrap items-center gap-2" [class.hidden]="frame() === 'fiche' || frame() === 'boxed'">
            <span class="ig-chip" style="color: var(--ig-heading)">{{ doc().grade }}</span>
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

        @if (frame() !== 'fiche' && frame() !== 'boxed') {
          <h2 class="ig-title">{{ s.title }}</h2>
        }

        @if (s.instruction) {
          <div class="ig-instruction">{{ s.instruction }}</div>
        }

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
            <app-preset-lesson-stages
              [spec]="s"
              [doc]="doc()"
              [accent]="accentFn"
              [illustrating]="illustrating()"
              (illustrate)="illustrate.emit($event)">
            </app-preset-lesson-stages>
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
          @case ('picture-rows') {
            <app-preset-picture-rows
              [spec]="s"
              [accent]="accentFn"
              [illustrating]="illustrating()"
              (illustrate)="illustrate.emit($event)">
            </app-preset-picture-rows>
          }
          @case ('steps-interface') {
            <app-preset-steps-interface
              [spec]="s"
              [doc]="doc()"
              [accent]="accentFn"
              [illustrating]="illustrating()"
              (illustrate)="illustrate.emit($event)">
            </app-preset-steps-interface>
          }
          @case ('mindmap') {
            <app-preset-mindmap
              [spec]="s"
              [doc]="doc()"
              [accent]="accentFn"
              [illustrating]="illustrating()"
              (illustrate)="illustrate.emit($event)">
            </app-preset-mindmap>
          }
          @case ('flashcards') {
            <app-preset-flashcards
              [spec]="s"
              [doc]="doc()"
              [accent]="accentFn"
              [illustrating]="illustrating()"
              (illustrate)="illustrate.emit($event)">
            </app-preset-flashcards>
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
            <p class="ig-heading font-bold text-sm">{{ doc().language === 'fr' ? 'À retenir absolument' : 'أتذكّر جيّداً' }}</p>
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
          <strong class="font-bold" style="color: var(--ig-heading)">{{ doc().author?.name || 'Madrasati TN' }}</strong>
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
  private readonly themeDef = computed(() => resolveTheme(this.doc().theme));
  readonly theme = computed(() => this.themeDef().id);
  readonly frame = computed(() => this.themeDef().frame);

  readonly themeVars = computed(() => {
    const t = this.themeDef();
    const c = t.colors;
    return (
      `--ig-bg:${c.bg};--ig-ink:${c.ink};--ig-muted:${c.muted};--ig-card:${c.card};` +
      `--ig-border:${c.border};--ig-hero:${c.hero};--ig-tip:${c.tip};` +
      `--ig-title-color:${c.title};--ig-heading:${c.heading};--ig-font-display:${t.fontDisplay};` +
      `--ig-a:${c.accents[0]};--ig-b:${c.accents[1]};--ig-c:${c.accents[2]};--ig-d:${c.accents[3]};` +
      `--ig-radius:${t.radius};--ig-bw:${t.borderWidth};--ig-title:${t.titleSize}`
    );
  });

  /** Fiche frame stars: small, at the edges only, never over text. */
  readonly stars: { top: string; left?: string; right?: string; size: number; color: string }[] = [
    { top: '0.35rem', left: '22%', size: 14, color: '#F2B705' },
    { top: '0.45rem', right: '30%', size: 11, color: '#D62828' },
    { top: '18%', left: '0.3rem', size: 12, color: '#F2B705' },
    { top: '41%', right: '0.3rem', size: 13, color: '#D62828' },
    { top: '63%', left: '0.3rem', size: 11, color: '#1E2A78' },
    { top: '82%', right: '0.3rem', size: 12, color: '#F2B705' },
    { top: 'calc(100% - 0.85rem)', left: '38%', size: 12, color: '#1E2A78' },
  ];

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
