import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { InfographicDoc, InfographicSpec, SpecImageTarget } from '@core';
import { IllustrateButtonComponent } from './illustrate-button';

/**
 * Numbered steps beside a simplified screen of the tool being taught.
 * The screen is drawn as HTML from `spec.interface` (plain text only), so labels stay sharp in FR and AR.
 */
@Component({
  selector: 'app-preset-steps-interface',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IllustrateButtonComponent],
  styles: `
    :host { display: block; }
    .si { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr); gap: 0.9rem; align-items: start; }
    @media (max-width: 640px) { .si { grid-template-columns: minmax(0, 1fr); } }
    .si-box {
      background: var(--ig-card); border: var(--ig-bw) solid var(--ig-border); border-radius: var(--ig-radius);
      padding: 0.8rem 0.9rem; break-inside: avoid;
    }
    .si-h { margin: 0 0 0.6rem; font-family: var(--ig-font-display); font-weight: 800; font-size: 1.05rem; color: var(--ig-heading); }
    .si-ic { font-size: 1.2rem; vertical-align: -0.2rem; color: var(--ig-a); }
    .si-steps { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.6rem; }
    .si-step { display: flex; gap: 0.6rem; align-items: flex-start; font-size: 0.9rem; line-height: 1.45; color: var(--ig-ink); }
    .si-num {
      flex: none; width: 1.7rem; height: 1.7rem; border-radius: 50%; color: #fff; font-weight: 800; font-size: 0.85rem;
      display: flex; align-items: center; justify-content: center;
    }
    .si-pic { flex: none; position: relative; width: 3.2rem; height: 3.2rem; border-radius: 10px; overflow: hidden; background: var(--ig-hero); border: 1px solid var(--ig-border); display: flex; align-items: center; justify-content: center; }
    .si-pic img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .si-head { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.6rem; }
    .si-head .si-h { margin: 0; flex: 1; }
    .si-step b { color: var(--ig-heading); }
    .si-screen { border: 1.5px solid var(--ig-border); border-radius: calc(var(--ig-radius) - 2px); overflow: hidden; background: #fff; }
    .si-bar { background: var(--ig-hero); padding: 0.4rem 0.7rem; font-weight: 800; font-size: 0.85rem; color: var(--ig-heading); }
    .si-tabs { display: flex; gap: 0.9rem; padding: 0.4rem 0.7rem 0; border-bottom: 1px solid var(--ig-border); font-size: 0.78rem; color: var(--ig-muted); }
    .si-tab { padding-bottom: 0.3rem; }
    .si-tab-on { color: var(--ig-heading); font-weight: 700; border-bottom: 2px solid var(--ig-a); }
    .si-fields { padding: 0.6rem; display: flex; flex-direction: column; gap: 0.5rem; background: #FAF8FE; }
    .si-field { background: #fff; border: 1px solid var(--ig-border); border-inline-start: 4px solid var(--ig-a); border-radius: 6px; padding: 0.45rem 0.6rem; font-size: 0.8rem; }
    .si-label { font-weight: 700; color: var(--ig-ink); }
    .si-hint { color: var(--ig-muted); margin-top: 0.15rem; }
    .si-opt { display: flex; align-items: center; gap: 0.4rem; margin-top: 0.2rem; color: var(--ig-ink); }
    .si-radio { width: 0.7rem; height: 0.7rem; border-radius: 50%; border: 1.5px solid var(--ig-muted); flex: none; }
    .si-line { margin-top: 0.35rem; border-bottom: 1.5px solid var(--ig-border); height: 0.9rem; }
    .si-area { margin-top: 0.35rem; border-bottom: 1.5px solid var(--ig-border); height: 2.2rem; }
    .si-btn { display: inline-block; margin-top: 0.3rem; padding: 0.2rem 0.8rem; border-radius: 6px; background: var(--ig-a); color: #fff; font-weight: 700; }
  `,
  template: `
    @let s = spec();
    <section class="si">
      <div class="si-box">
        <div class="si-head">
          <h3 class="si-h"><span class="material-icons si-ic" aria-hidden="true">settings</span> {{ doc().language === 'fr' ? 'Étapes du travail' : 'مراحل العمل' }}</h3>
          @if (s.hero?.imagePrompt) {
            <span class="si-pic">
              @if (s.hero?.imageUrl) { <img [src]="s.hero?.imageUrl" alt="" /> }
              <app-illustrate-button [prompt]="s.hero?.imagePrompt" [imageUrl]="s.hero?.imageUrl"
                [busy]="illustrating() === 'hero'" [disabled]="!!illustrating()" (pressed)="illustrate.emit({ kind: 'hero' })" />
            </span>
          }
        </div>
        <ol class="si-steps">
          @for (it of s.items; track $index) {
            <li class="si-step">
              <span class="si-num" [style.background]="accent()($index)">{{ $index + 1 }}</span>
              <span class="flex-1"><b>{{ it.title }}</b> {{ it.text }}</span>
              @if (it.imagePrompt) {
                <span class="si-pic">
                  @if (it.imageUrl) { <img [src]="it.imageUrl" alt="" /> }
                  <app-illustrate-button [prompt]="it.imagePrompt" [imageUrl]="it.imageUrl"
                    [busy]="illustrating() === 'item-' + $index" [disabled]="!!illustrating()" (pressed)="illustrate.emit({ kind: 'item', index: $index })" />
                </span>
              }
            </li>
          }
        </ol>
      </div>
      @if (s.interface; as ui) {
        <div class="si-box">
          <h3 class="si-h"><span class="material-icons si-ic" aria-hidden="true">web</span> {{ doc().language === 'fr' ? 'Vue d’interface simplifiée' : 'واجهة مبسّطة' }}</h3>
          <div class="si-screen">
            <div class="si-bar">{{ ui.appName }}</div>
            @if (ui.tabs.length) {
              <div class="si-tabs">
                @for (t of ui.tabs; track $index) {
                  <span class="si-tab" [class.si-tab-on]="$index === 0">{{ t }}</span>
                }
              </div>
            }
            <div class="si-fields">
              @for (f of ui.fields; track $index) {
                <div class="si-field">
                  <div class="si-label">{{ f.label }}</div>
                  @if (f.hint) { <div class="si-hint">{{ f.hint }}</div> }
                  @switch (f.kind) {
                    @case ('choice') {
                      @for (o of f.options ?? []; track $index) {
                        <div class="si-opt"><span class="si-radio"></span>{{ o }}</div>
                      }
                    }
                    @case ('long') { <div class="si-area"></div> }
                    @case ('button') { <span class="si-btn">{{ f.hint || f.label }}</span> }
                    @default { <div class="si-line"></div> }
                  }
                </div>
              }
            </div>
          </div>
        </div>
      }
    </section>
  `,
})
export class PresetStepsInterfaceComponent {
  readonly spec = input.required<InfographicSpec>();
  readonly doc = input.required<InfographicDoc>();
  readonly accent = input.required<(i: number) => string>();
  readonly illustrating = input<string | null>(null);
  readonly illustrate = output<SpecImageTarget>();
}
