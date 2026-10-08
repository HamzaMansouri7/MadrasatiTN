import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { EducationStore, InfographicDoc, InfographicPreset, InfographicTheme, LanguageService, SourceInput } from '@core';
import { AiStatusComponent, InfographicSpecComponent, SourceInputComponent } from '@shared';

interface PresetOption {
  id: InfographicPreset;
  icon: string;
  fr: string;
  ar: string;
  hintFr: string;
  hintAr: string;
}

@Component({
  selector: 'app-ai-studio',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SourceInputComponent, AiStatusComponent, InfographicSpecComponent],
  template: `
    <div class="min-h-screen bg-[#FBF8F1] text-[#14251D] pb-16">
      <main class="max-w-[900px] mx-auto px-4 sm:px-6 pt-8 space-y-6">
        <header class="no-print space-y-1.5">
          <h1 class="font-display text-2xl sm:text-3xl font-semibold">{{ lang.tr('Infographies AI Studio', 'إنفوغرافيك الذكاء الاصطناعي') }}</h1>
          <p class="text-sm text-[#5B6B60]">
            {{ lang.tr('Un thème ou un cours, une composition, un style : une page A4 prête à imprimer.', 'موضوع أو درس، تركيب، وأسلوب: صفحة A4 جاهزة للطباعة.') }}
          </p>
        </header>

        @if (doc(); as current) {
          <div class="no-print flex flex-wrap items-center justify-between gap-3 bg-white rounded-lg border border-[#E7DFCF] p-3">
            <button
              type="button"
              (click)="reset()"
              class="bg-white hover:bg-[#F2ECDE] text-[#14251D] font-semibold px-4 min-h-11 rounded-md text-sm border border-[#E7DFCF] transition-colors cursor-pointer flex items-center gap-2">
              <span class="material-icons text-base" aria-hidden="true">add</span>
              {{ lang.tr('Nouvelle infographie', 'إنفوغرافيك جديد') }}
            </button>
            <div class="flex items-center gap-2">
              <button
                type="button"
                (click)="regenerate()"
                [disabled]="busy()"
                class="bg-white hover:bg-[#F2ECDE] text-[#14251D] font-semibold px-4 min-h-11 rounded-md text-sm border border-[#E7DFCF] transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-60">
                <span class="material-icons text-base" aria-hidden="true">refresh</span>
                {{ lang.tr('Régénérer', 'إعادة التوليد') }}
              </button>
              <button
                type="button"
                (click)="share()"
                class="bg-white hover:bg-[#F2ECDE] text-[#14251D] font-semibold px-4 min-h-11 rounded-md text-sm border border-[#E7DFCF] transition-colors cursor-pointer flex items-center gap-2">
                <span class="material-icons text-base" aria-hidden="true">{{ shareCopied() ? 'check' : 'share' }}</span>
                {{ shareCopied() ? lang.tr('Lien copié', 'تم نسخ الرابط') : lang.tr('Partager', 'مشاركة') }}
              </button>
              <button
                type="button"
                (click)="print()"
                class="bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold px-5 min-h-11 rounded-md text-sm transition-colors cursor-pointer flex items-center gap-2">
                <span class="material-icons text-base" aria-hidden="true">print</span>
                {{ lang.tr('Imprimer A4', 'طباعة A4') }}
              </button>
            </div>
          </div>
          <app-infographic-spec [doc]="current"></app-infographic-spec>
        } @else {
          <section class="no-print bg-white rounded-lg border border-[#E7DFCF] p-5 space-y-5">
            <fieldset class="space-y-2">
              <legend class="text-sm font-semibold">{{ lang.tr('Composition', 'التركيب') }}</legend>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                @for (p of presets; track p.id) {
                  <button
                    type="button"
                    (click)="preset.set(p.id)"
                    [attr.aria-pressed]="preset() === p.id"
                    [class]="preset() === p.id ? 'border-[#2D6A4F] bg-[#2D6A4F]/5' : 'border-[#E7DFCF] hover:bg-[#F2ECDE]'"
                    class="text-start border rounded-lg p-3 min-h-11 cursor-pointer transition-colors">
                    <span class="flex items-center gap-2 font-semibold text-sm">
                      <span class="material-icons text-base text-[#2D6A4F]" aria-hidden="true">{{ p.icon }}</span>
                      {{ lang.tr(p.fr, p.ar) }}
                    </span>
                    <span class="block text-xs text-[#5B6B60] mt-1">{{ lang.tr(p.hintFr, p.hintAr) }}</span>
                  </button>
                }
              </div>
            </fieldset>

            <fieldset class="space-y-2">
              <legend class="text-sm font-semibold">{{ lang.tr('Style', 'الأسلوب') }}</legend>
              <div class="flex flex-wrap gap-3">
                @for (th of themes; track th.id) {
                  <button
                    type="button"
                    (click)="theme.set(th.id)"
                    [attr.aria-pressed]="theme() === th.id"
                    [class]="theme() === th.id ? 'border-[#2D6A4F] bg-[#2D6A4F]/5' : 'border-[#E7DFCF] hover:bg-[#F2ECDE]'"
                    class="border rounded-lg px-4 min-h-11 text-sm font-semibold cursor-pointer transition-colors">
                    {{ lang.tr(th.fr, th.ar) }}
                  </button>
                }
              </div>
            </fieldset>
          </section>

          <app-source-input
            [busy]="busy()"
            [submitLabel]="lang.tr('Générer l’infographie', 'توليد الإنفوغرافيك')"
            (submitSource)="generate($event)"></app-source-input>

          <app-ai-status [loading]="busy()" [error]="error()" (retry)="regenerate()"></app-ai-status>
        }
      </main>
    </div>
  `,
})
export class AiStudioComponent {
  readonly lang = inject(LanguageService);
  private readonly store = inject(EducationStore);

  readonly presets: PresetOption[] = [
    { id: 'hero-cards', icon: 'dashboard', fr: 'Héros + 4 cartes', ar: 'عنصر رئيسي + 4 بطاقات', hintFr: 'Une notion clé et ses 4 exemples', hintAr: 'مفهوم أساسي مع 4 أمثلة' },
    { id: 'circular-flow', icon: 'autorenew', fr: 'Cycle', ar: 'دورة', hintFr: 'Étapes qui reviennent au début', hintAr: 'مراحل تعود إلى البداية' },
    { id: 'timeline', icon: 'timeline', fr: 'Frise', ar: 'شريط زمني', hintFr: 'Étapes dans l’ordre', hintAr: 'خطوات مرتبة' },
  ];

  readonly themes: { id: InfographicTheme; fr: string; ar: string }[] = [
    { id: 'kids', fr: 'Enfants', ar: 'أطفال' },
    { id: 'official', fr: 'Officiel', ar: 'رسمي' },
  ];

  readonly preset = signal<InfographicPreset>('hero-cards');
  readonly theme = signal<InfographicTheme>('kids');
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly doc = signal<InfographicDoc | null>(null);
  readonly shareCopied = signal(false);
  private lastSource: SourceInput | null = null;

  async generate(source: SourceInput) {
    if (this.busy()) return;
    this.lastSource = source;
    this.busy.set(true);
    this.error.set(null);
    const res = await this.store.generateInfographic(source, this.preset(), this.theme());
    this.busy.set(false);
    if (res.ok && res.doc) this.doc.set(res.doc);
    else this.error.set(res.error ?? this.lang.tr('Erreur de génération.', 'خطأ في التوليد.'));
  }

  async regenerate() {
    if (!this.lastSource) return;
    await this.generate(this.lastSource);
  }

  reset() {
    this.doc.set(null);
    this.error.set(null);
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
