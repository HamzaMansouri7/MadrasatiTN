import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { EducationStore, InfographicDoc, InfographicPreset, InfographicTheme, LanguageService, SourceInput } from '@core';
import { AiStatusComponent, InfographicSpecComponent } from '@shared';

interface PresetOption {
  id: InfographicPreset | 'auto';
  icon: string;
  fr: string;
  ar: string;
}

/**
 * AI Studio result screen. The only form is the Create hub: this page reads the source from
 * the store, generates at once, and every setting lives next to the preview.
 * Style = CSS swap (no AI call); composition and notes = regenerate.
 */
@Component({
  selector: 'app-ai-studio',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, AiStatusComponent, InfographicSpecComponent],
  template: `
    <div class="min-h-screen bg-[#FBF8F1] text-[#14251D] pb-16">
      <main class="max-w-[1280px] mx-auto px-4 sm:px-6 pt-8 grid lg:grid-cols-[minmax(0,1fr)_20rem] gap-6 items-start">
        <!-- Preview -->
        <section class="min-w-0 space-y-4">
          @if (doc(); as current) {
            <div [class.opacity-50]="busy()" class="transition-opacity">
              <app-infographic-spec [doc]="current"></app-infographic-spec>
            </div>
          } @else if (busy()) {
            <div class="no-print bg-white rounded-lg border border-[#E7DFCF] p-16 text-center space-y-3">
              <span class="material-icons text-4xl text-[#2D6A4F] animate-spin" aria-hidden="true">sync</span>
              <p class="font-display font-semibold">{{ lang.tr('Création de votre infographie…', 'جارٍ إنشاء الإنفوغرافيك…') }}</p>
              <p class="text-sm text-[#5B6B60]">{{ sourceLabel() }}</p>
            </div>
          }
          <div class="no-print">
            <app-ai-status [loading]="false" [error]="error()" (retry)="regenerate()"></app-ai-status>
          </div>
        </section>

        <!-- Settings, next to the result -->
        <aside class="no-print bg-white rounded-lg border border-[#E7DFCF] p-4 space-y-5 lg:sticky lg:top-24">
          <div>
            <p class="text-xs text-[#5B6B60]">{{ lang.tr('Contenu', 'المحتوى') }}</p>
            <p class="font-semibold text-sm">{{ sourceLabel() }}</p>
            <a routerLink="/create" [queryParams]="{ output: 'memo' }" class="text-xs font-semibold text-[#2D6A4F] hover:underline">
              {{ lang.tr('Changer le contenu', 'تغيير المحتوى') }}
            </a>
          </div>

          <fieldset class="space-y-2">
            <legend class="text-sm font-semibold">{{ lang.tr('Style', 'الأسلوب') }}</legend>
            <div class="grid grid-cols-2 gap-2">
              @for (th of themes; track th.id) {
                <button
                  type="button"
                  (click)="setTheme(th.id)"
                  [attr.aria-pressed]="theme() === th.id"
                  [class]="theme() === th.id ? 'border-[#2D6A4F] bg-[#2D6A4F]/5 text-[#1B4332]' : 'border-[#E7DFCF] hover:bg-[#F2ECDE]'"
                  class="border rounded-md min-h-11 text-sm font-semibold cursor-pointer transition-colors">
                  {{ lang.tr(th.fr, th.ar) }}
                </button>
              }
            </div>
          </fieldset>

          <fieldset class="space-y-2">
            <legend class="text-sm font-semibold">{{ lang.tr('Composition', 'التركيب') }}</legend>
            <div class="grid grid-cols-2 gap-2">
              @for (p of presets; track p.id) {
                <button
                  type="button"
                  (click)="setPreset(p.id)"
                  [disabled]="busy()"
                  [attr.aria-pressed]="preset() === p.id"
                  [class]="preset() === p.id ? 'border-[#2D6A4F] bg-[#2D6A4F]/5 text-[#1B4332]' : 'border-[#E7DFCF] hover:bg-[#F2ECDE]'"
                  class="border rounded-md min-h-11 px-2 text-xs font-semibold cursor-pointer transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60">
                  <span class="material-icons text-base" aria-hidden="true">{{ p.icon }}</span>
                  {{ lang.tr(p.fr, p.ar) }}
                </button>
              }
            </div>
          </fieldset>

          <details class="group">
            <summary class="text-sm font-semibold cursor-pointer min-h-11 flex items-center">{{ lang.tr('Consignes (facultatif)', 'توجيهات (اختياري)') }}</summary>
            <textarea
              rows="3"
              [value]="notes()"
              (input)="notes.set($any($event.target).value)"
              [placeholder]="lang.tr('Ex. : insister sur les exemples du quotidien', 'مثال: التركيز على أمثلة من الحياة اليومية')"
              class="w-full mt-1 bg-[#FBF8F1] border border-[#E7DFCF] rounded-md p-2 text-sm focus:border-[#2D6A4F] focus-visible:outline-2 focus-visible:outline-[#2D6A4F]"></textarea>
          </details>

          <button
            type="button"
            (click)="regenerate()"
            [disabled]="busy() || !source()"
            class="w-full bg-white hover:bg-[#F2ECDE] border border-[#E7DFCF] font-semibold min-h-11 rounded-md text-sm cursor-pointer transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
            <span class="material-icons text-base" [class.animate-spin]="busy()" aria-hidden="true">refresh</span>
            {{ lang.tr('Régénérer', 'إعادة التوليد') }}
          </button>

          @if (doc()) {
            <div class="grid grid-cols-2 gap-2 pt-1 border-t border-[#F2ECDE]">
              <button
                type="button"
                (click)="share()"
                class="mt-3 bg-white hover:bg-[#F2ECDE] border border-[#E7DFCF] font-semibold min-h-11 rounded-md text-sm cursor-pointer transition-colors flex items-center justify-center gap-1.5">
                <span class="material-icons text-base" aria-hidden="true">{{ shareCopied() ? 'check' : 'share' }}</span>
                {{ shareCopied() ? lang.tr('Copié', 'تم النسخ') : lang.tr('Partager', 'مشاركة') }}
              </button>
              <button
                type="button"
                (click)="print()"
                class="mt-3 bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold min-h-11 rounded-md text-sm cursor-pointer transition-colors flex items-center justify-center gap-1.5">
                <span class="material-icons text-base" aria-hidden="true">print</span>
                {{ lang.tr('Imprimer', 'طباعة') }}
              </button>
            </div>
          }
        </aside>
      </main>
    </div>
  `,
})
export class AiStudioComponent implements OnInit {
  readonly lang = inject(LanguageService);
  private readonly store = inject(EducationStore);
  private readonly router = inject(Router);

  readonly presets: PresetOption[] = [
    { id: 'auto', icon: 'auto_awesome', fr: 'Auto', ar: 'تلقائي' },
    { id: 'hero-cards', icon: 'dashboard', fr: 'Cartes', ar: 'بطاقات' },
    { id: 'circular-flow', icon: 'autorenew', fr: 'Cycle', ar: 'دورة' },
    { id: 'timeline', icon: 'timeline', fr: 'Frise', ar: 'شريط زمني' },
  ];

  readonly themes: { id: InfographicTheme; fr: string; ar: string }[] = [
    { id: 'kids', fr: 'Enfants', ar: 'أطفال' },
    { id: 'official', fr: 'Officiel', ar: 'رسمي' },
  ];

  readonly source = signal<SourceInput | null>(null);
  readonly preset = signal<InfographicPreset | 'auto'>('auto');
  readonly theme = signal<InfographicTheme>('kids');
  readonly notes = signal('');
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly doc = signal<InfographicDoc | null>(null);
  readonly shareCopied = signal(false);

  ngOnInit() {
    if (typeof window === 'undefined') return;
    const src = this.store.consumeLastSourceInput();
    if (!src) {
      // No content yet: the Create hub is the single place to give it.
      this.router.navigate(['/create'], { queryParams: { output: 'memo' }, replaceUrl: true });
      return;
    }
    this.source.set(src);
    this.notes.set(src.instructions ?? '');
    void this.generate();
  }

  sourceLabel(): string {
    const s = this.source();
    if (!s) return '';
    const what = s.topic || (s.text ? s.text.slice(0, 60) + '…' : this.lang.tr('Document importé', 'مستند مستورد'));
    return [what, s.grade, s.subject].filter(Boolean).join(' · ');
  }

  setTheme(theme: InfographicTheme) {
    this.theme.set(theme);
    const d = this.doc();
    if (!d) return;
    const next = { ...d, theme };
    this.doc.set(next);
    if (d.isOwner) void this.store.saveInfographic(next);
  }

  setPreset(preset: InfographicPreset | 'auto') {
    if (this.preset() === preset && this.doc()) return;
    this.preset.set(preset);
    void this.generate();
  }

  regenerate() {
    void this.generate();
  }

  private async generate() {
    const src = this.source();
    if (!src || this.busy()) return;
    this.busy.set(true);
    this.error.set(null);
    const existingId = this.doc()?.id;
    const res = await this.store.generateInfographic(
      { ...src, instructions: this.notes().trim() || undefined },
      this.preset(),
      this.theme(),
      existingId
    );
    this.busy.set(false);
    if (res.ok && res.doc) this.doc.set(res.doc);
    else this.error.set(res.error ?? this.lang.tr('Erreur de génération.', 'خطأ في التوليد.'));
  }

  async share() {
    const d = this.doc();
    if (!d || typeof window === 'undefined') return;
    const url = `${window.location.origin}/infographic/${d.id}`;
    try {
      if (navigator.share) await navigator.share({ title: d.title, url });
      else await navigator.clipboard.writeText(url);
      this.shareCopied.set(true);
      setTimeout(() => this.shareCopied.set(false), 2500);
    } catch {
      // share sheet cancelled or clipboard denied
    }
  }

  print() {
    if (typeof window !== 'undefined') window.print();
  }
}
