import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { InfographicDoc, InfographicSpec, SpecImageTarget, SpecItem } from '@core';

interface Cell {
  n: number;
  kind: 'start' | 'finish' | 'item' | 'empty';
  item?: SpecItem;
}

/**
 * Board game preset: a printable snake track of question squares between a start and a finish
 * square, four squares per row, alternating direction like a real board. Rules come from "remember".
 */
@Component({
  selector: 'app-preset-boardgame',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; }
    .bg-board {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      padding: 0.9rem;
      border: calc(var(--ig-bw, 2px) + 1px) solid var(--ig-border);
      border-radius: var(--ig-radius, 16px);
      background: var(--ig-hero);
    }
    .bg-row {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 0.6rem;
    }
    .bg-cell {
      position: relative;
      min-height: 7rem;
      background: var(--ig-card);
      border: var(--ig-bw, 2px) solid var(--ig-border);
      border-radius: calc(var(--ig-radius, 16px) - 4px);
      padding: 0.55rem 0.6rem 0.6rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      break-inside: avoid;
    }
    .bg-num {
      width: 1.6rem;
      height: 1.6rem;
      border-radius: 999px;
      color: #fff;
      font-weight: 900;
      font-size: 0.8rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .bg-cell-title { font-weight: 800; font-size: 0.8rem; color: var(--ig-heading); }
    .bg-cell-text { font-size: 0.75rem; line-height: 1.4; color: var(--ig-ink); }
    .bg-special {
      align-items: center;
      justify-content: center;
      text-align: center;
      font-family: var(--ig-font-display);
      font-weight: 900;
      font-size: 1rem;
      color: var(--ig-heading);
    }
    .bg-rules {
      margin-top: 1rem;
      background: var(--ig-card);
      border: 1px dashed var(--ig-border);
      border-radius: calc(var(--ig-radius, 16px) - 4px);
      padding: 0.85rem 1rem;
      font-size: 0.85rem;
    }
    @media (max-width: 640px) {
      .bg-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
  `,
  template: `
    @let s = spec();
    @let fr = doc().language === 'fr';
    <div class="bg-board">
      @for (row of rows(); track $index) {
        <div class="bg-row">
          @for (cell of row; track cell.n) {
            @if (cell.kind === 'start') {
              <div class="bg-cell bg-special">
                <span class="material-icons text-2xl" [style.color]="accent()(0)" aria-hidden="true">sports_score</span>
                <span>{{ fr ? 'Départ' : 'انطلاق' }}</span>
              </div>
            } @else if (cell.kind === 'finish') {
              <div class="bg-cell bg-special">
                <span class="material-icons text-2xl" [style.color]="accent()(1)" aria-hidden="true">emoji_events</span>
                <span>{{ fr ? 'Arrivée' : 'الوصول' }}</span>
              </div>
            } @else if (cell.item) {
              <div class="bg-cell">
                <span class="bg-num" [style.background]="accent()(cell.n)">{{ cell.n }}</span>
                <p class="bg-cell-title">{{ cell.item.title }}</p>
                <p class="bg-cell-text">{{ cell.item.text }}</p>
              </div>
            } @else {
              <div aria-hidden="true"></div>
            }
          }
        </div>
      }
    </div>

    <section class="bg-rules">
      <p class="font-bold mb-1.5 flex items-center gap-1.5" style="color: var(--ig-heading)">
        <span class="material-icons text-base" [style.color]="accent()(2)" aria-hidden="true">casino</span>
        {{ fr ? 'Règles du jeu' : 'قواعد اللعبة' }}
      </p>
      <ul class="list-disc ps-5 space-y-0.5" style="color: var(--ig-muted)">
        @if (s.remember.length) {
          @for (rule of s.remember; track $index) {
            <li>{{ rule }}</li>
          }
        } @else {
          <li>{{ fr ? 'Lance le dé et avance ton pion.' : 'ارمِ النرد وحرّك قطعتك.' }}</li>
          <li>{{ fr ? 'Réponds à la question de la case : bonne réponse, tu restes ; sinon, tu recules d’une case.' : 'أجب عن سؤال الخانة: إجابة صحيحة تبقى، وإلا تعود خانة إلى الوراء.' }}</li>
          <li>{{ fr ? 'Le premier arrivé gagne.' : 'أوّل من يصل يفوز.' }}</li>
        }
      </ul>
    </section>
  `,
})
export class PresetBoardgameComponent {
  readonly spec = input.required<InfographicSpec>();
  readonly doc = input.required<InfographicDoc>();
  readonly accent = input.required<(i: number) => string>();
  readonly illustrating = input<string | null>(null);
  readonly illustrate = output<SpecImageTarget>();

  /** Start + question squares + finish in rows of four; every other row runs backwards, like a real board. */
  readonly rows = computed(() => {
    const items = this.spec().items;
    const cells: Cell[] = [
      { n: 0, kind: 'start' },
      ...items.map((item, i): Cell => ({ n: i + 1, kind: 'item', item })),
      { n: items.length + 1, kind: 'finish' },
    ];
    while (cells.length % 4 !== 0) cells.push({ n: cells.length + 100, kind: 'empty' });
    const rows: Cell[][] = [];
    for (let i = 0; i < cells.length; i += 4) {
      const row = cells.slice(i, i + 4);
      rows.push(rows.length % 2 === 1 ? row.reverse() : row);
    }
    return rows;
  });
}
