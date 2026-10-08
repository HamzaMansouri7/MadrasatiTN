import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { EducationStore, InfographicDoc, InfographicPreset, InfographicTheme, LanguageService, SourceInput, SpecImageTarget } from '@core';
import { AiStatusComponent, InfographicSpecComponent } from '@shared';

interface PresetOption {
  id: InfographicPreset | 'auto';
  icon: string;
  fr: string;
  ar: string;
}

/**
 * AI Studio result screen. The only form is the Create hub: this page reads the source from
 * the store and generates at once; a studio bar (same structure as the editor) holds the
 * actions, and a collapsible drawer holds content, style, composition and notes.
 * Style = CSS swap (no AI call); composition and notes = regenerate.
 */
@Component({
  selector: 'app-ai-studio',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, AiStatusComponent, InfographicSpecComponent],
  template: `
    <div class="min-h-screen bg-[#FBF8F1] text-[#14251D] pb-16">
      <main class="max-w-[1280px] mx-auto px-4 sm:px-6 pt-6 space-y-5">
        <!-- Studio bar: same structure as the document editor, Cartouche tokens -->
        <div class="no-print bg-[#14251D] text-[#FBF8F1] rounded-[28px] p-5">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div class="flex items-center gap-3 min-w-0">
              <a
                routerLink="/create"
                [queryParams]="{ output: 'memo' }"
                [attr.aria-label]="lang.tr('Retour au centre de création', 'العودة إلى مركز الإنشاء')"
                class="w-11 h-11 shrink-0 rounded-full bg-[#FBF8F1]/10 hover:bg-[#FBF8F1]/20 flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#F2C14E]">
                <span class="material-icons text-xl rtl:rotate-180" aria-hidden="true">arrow_back</span>
              </a>
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="inline-flex items-center gap-1 bg-[#F2C14E] text-[#14251D] text-[11px] font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap">
                    <span class="material-icons text-xs" aria-hidden="true">auto_awesome</span>
                    {{ lang.tr('Infographie', 'إنفوغرافيك') }}
                  </span>
                  @if (source()?.grade) {
                    <span class="text-xs text-[#B7C7BC] whitespace-nowrap">{{ lang.translateGrade(source()?.grade ?? '') }}</span>
                  }
                  @if (source()?.subject) {
                    <span class="text-xs text-[#B7C7BC] whitespace-nowrap">{{ lang.translateSubject(source()?.subject ?? '') }}</span>
                  }
                  <span class="text-xs text-[#9DBBA8] inline-flex items-center gap-1.5 whitespace-nowrap" aria-live="polite">
                    <span class="w-1.5 h-1.5 rounded-full" [class]="busy() ? 'bg-[#F2C14E] animate-pulse' : 'bg-[#9DBBA8]'"></span>
                    {{ busy() ? lang.tr('Génération en cours', 'جارٍ التوليد') : doc()?.isOwner ? lang.tr('Enregistré', 'تم الحفظ') : lang.tr('Prêt', 'جاهز') }}
                  </span>
                </div>
                <h1 dir="auto" class="font-display text-xl sm:text-2xl font-semibold mt-1 truncate max-w-[70vw] lg:max-w-xl">
                  {{ doc()?.title || lang.tr('Nouvelle infographie', 'إنفوغرافيك جديد') }}
                </h1>
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <button
                type="button"
                (click)="settingsOpen.set(!settingsOpen())"
                [attr.aria-expanded]="settingsOpen()"
                aria-controls="ai-settings"
                [class]="settingsOpen() ? 'bg-[#FBF8F1] text-[#14251D]' : 'bg-[#FBF8F1]/10 hover:bg-[#FBF8F1]/20 text-[#FBF8F1]'"
                class="border border-[#FBF8F1]/20 px-4 min-h-11 rounded-xl text-sm font-semibold flex items-center gap-2 cursor-pointer transition-colors">
                <span class="material-icons text-base" aria-hidden="true">tune</span>
                {{ lang.tr('Réglages', 'الإعدادات') }}
              </button>
              <button
                type="button"
                (click)="regenerate()"
                [disabled]="busy() || !source()"
                class="bg-[#FBF8F1]/10 hover:bg-[#FBF8F1]/20 border border-[#FBF8F1]/20 px-4 min-h-11 rounded-xl text-sm font-semibold flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-default">
                <span class="material-icons text-base" [class.animate-spin]="busy()" aria-hidden="true">refresh</span>
                {{ lang.tr('Régénérer', 'إعادة التوليد') }}
              </button>
              @if (doc()) {
                <button
                  type="button"
                  (click)="share()"
                  class="bg-[#FBF8F1]/10 hover:bg-[#FBF8F1]/20 border border-[#FBF8F1]/20 px-4 min-h-11 rounded-xl text-sm font-semibold flex items-center gap-2 cursor-pointer transition-colors">
                  <span class="material-icons text-base" aria-hidden="true">{{ shareCopied() ? 'check' : 'share' }}</span>
                  {{ shareCopied() ? lang.tr('Lien copié', 'تم نسخ الرابط') : lang.tr('Partager', 'مشاركة') }}
                </button>
                <button
                  type="button"
                  (click)="print()"
                  class="bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold px-5 min-h-11 rounded-xl text-sm transition-colors cursor-pointer flex items-center gap-2 shadow-sm">
                  <span class="material-icons text-base" aria-hidden="true">print</span>
                  {{ lang.tr('Imprimer A4', 'طباعة A4') }}
                </button>
              }
            </div>
          </div>
        </div>

        <!-- Settings drawer (collapsible, like the editor's configuration panel) -->
        @if (settingsOpen()) {
          <section id="ai-settings" class="no-print bg-white rounded-[28px] p-5 sm:p-6 border border-[#E7DFCF] grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[1.1fr_0.7fr_1.7fr_1fr] gap-6">
            <div class="min-w-0">
              <p class="text-sm font-semibold mb-1.5 flex items-center gap-1.5">
                <span class="material-icons text-base text-[#2D6A4F]" aria-hidden="true">{{ sourceKind().icon }}</span>
                {{ lang.tr(sourceKind().fr, sourceKind().ar) }}
              </p>
              <p class="text-sm text-[#5B6B60] leading-relaxed" [class.line-clamp-2]="!contentOpen()">{{ sourcePreview() }}</p>
              <div class="flex flex-wrap items-center gap-4 mt-1">
                @if (sourcePreview().length > 70) {
                  <button type="button" (click)="contentOpen.set(!contentOpen())" [attr.aria-expanded]="contentOpen()" class="text-sm text-[#8A5A00] hover:text-[#C1121F] underline underline-offset-4 decoration-[#E7DFCF] cursor-pointer min-h-11">
                    {{ contentOpen() ? lang.tr('Réduire', 'إخفاء') : lang.tr('Tout afficher', 'عرض الكل') }}
                  </button>
                }
                <a routerLink="/create" [queryParams]="{ output: 'memo' }" class="text-sm text-[#8A5A00] hover:text-[#C1121F] underline underline-offset-4 decoration-[#E7DFCF] min-h-11 inline-flex items-center">
                  {{ lang.tr('Changer le contenu', 'تغيير المحتوى') }}
                </a>
              </div>
            </div>

            <fieldset>
              <legend class="text-sm font-semibold mb-2">{{ lang.tr('Style', 'الأسلوب') }}</legend>
              <div class="grid grid-cols-2 gap-2">
                @for (th of themes; track th.id) {
                  <button
                    type="button"
                    (click)="setTheme(th.id)"
                    [attr.aria-pressed]="theme() === th.id"
                    [class]="theme() === th.id ? 'border-[#2D6A4F] bg-[#2D6A4F]/5 text-[#1B4332]' : 'border-[#E7DFCF] text-[#4A5A50] hover:bg-[#F2ECDE]'"
                    class="border rounded-xl min-h-11 text-sm font-semibold cursor-pointer transition-colors">
                    {{ lang.tr(th.fr, th.ar) }}
                  </button>
                }
              </div>
            </fieldset>

            <fieldset>
              <legend class="text-sm font-semibold mb-2">{{ lang.tr('Composition', 'التركيب') }}</legend>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                @for (p of presets; track p.id) {
                  <button
                    type="button"
                    (click)="setPreset(p.id)"
                    [disabled]="busy()"
                    [attr.aria-pressed]="preset() === p.id"
                    [class]="preset() === p.id || autoPicked() === p.id ? 'border-[#2D6A4F] bg-[#2D6A4F]/5 text-[#1B4332]' : 'border-[#E7DFCF] text-[#4A5A50] hover:bg-[#F2ECDE]'"
                    class="relative border rounded-xl min-h-11 px-2 text-xs font-semibold cursor-pointer transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-default">
                    <span class="material-icons text-base" aria-hidden="true">{{ p.icon }}</span>
                    {{ lang.tr(p.fr, p.ar) }}
                    @if (autoPicked() === p.id) {
                      <span class="absolute -top-2 end-2 text-[10px] font-semibold px-1.5 rounded-full bg-[#F2C14E] text-[#14251D]" [attr.aria-label]="lang.tr('choisi par l’IA', 'اختيار الذكاء الاصطناعي')">AI</span>
                    }
                  </button>
                }
              </div>
              @if (autoPicked(); as picked) {
                <p class="text-xs text-[#6B7A70] mt-2" aria-live="polite">
                  {{ lang.tr('En mode Auto, l’IA a choisi :', 'في الوضع التلقائي اختار الذكاء الاصطناعي:') }}
                  <strong class="text-[#1B4332] font-semibold">{{ presetName(picked) }}</strong>
                </p>
              }
            </fieldset>

            <div>
              <label for="ai-notes" class="block text-sm font-semibold mb-2">{{ lang.tr('Consignes', 'توجيهات') }}</label>
              <textarea
                id="ai-notes"
                rows="3"
                [value]="notes()"
                (input)="notes.set($any($event.target).value)"
                [placeholder]="lang.tr('Ex. : insister sur les exemples du quotidien', 'مثال: التركيز على أمثلة من الحياة اليومية')"
                class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl p-3 text-sm focus:border-[#2D6A4F] focus-visible:outline-2 focus-visible:outline-[#2D6A4F]"></textarea>
              <p class="text-xs text-[#6B7A70] mt-1">{{ lang.tr('Facultatif, appliqué au prochain « Régénérer ».', 'اختياري، يُطبَّق عند «إعادة التوليد».') }}</p>
            </div>
          </section>
        }

        <!-- The A4 sheet -->
        <section class="max-w-[900px] mx-auto space-y-4">
          @if (doc(); as current) {
            <div [class.opacity-50]="busy()" class="transition-opacity">
              <app-infographic-spec [doc]="current" [illustrating]="illustrating()" (illustrate)="illustrate($event)"></app-infographic-spec>
            </div>
          } @else if (busy()) {
            <div class="no-print bg-white rounded-[28px] border border-[#E7DFCF] p-16 text-center">
              <span class="material-icons text-4xl text-[#2D6A4F] animate-spin" aria-hidden="true">sync</span>
              <p class="font-display font-semibold mt-3">{{ lang.tr('Création de votre infographie', 'جارٍ إنشاء الإنفوغرافيك') }}</p>
            </div>
          }
          <div class="no-print">
            <app-ai-status [loading]="false" [error]="error()" (retry)="regenerate()"></app-ai-status>
          </div>
        </section>
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
    { id: 'central-picture', icon: 'center_focus_strong', fr: 'Image centrale', ar: 'صورة مركزية' },
    { id: 'lesson-stages', icon: 'format_list_numbered', fr: 'Étapes', ar: 'مراحل الدرس' },
    { id: 'comparison', icon: 'compare_arrows', fr: 'Comparaison', ar: 'مقارنة' },
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
  /** Key of the block whose picture is being drawn ('hero', 'item-2', 'column-0'), or null. */
  readonly illustrating = signal<string | null>(null);
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

  readonly contentOpen = signal(false);
  readonly settingsOpen = signal(true);

  /** What kind of source the sheet was made from (the hub tab), for the panel's label. */
  readonly sourceKind = computed(() => {
    const s = this.source();
    if (s?.mode === 'text') return { icon: 'notes', fr: 'Texte du cours', ar: 'نص الدرس' };
    if (s?.mode === 'photo') return { icon: 'photo_camera', fr: 'Photo', ar: 'صورة' };
    if (s?.mode === 'file') return { icon: 'description', fr: 'Fichier', ar: 'ملف' };
    return { icon: 'title', fr: 'Sujet', ar: 'موضوع' };
  });

  readonly sourcePreview = computed(() => {
    const s = this.source();
    if (!s) return '';
    const raw = s.mode === 'text' ? s.text || s.topic : s.topic || s.text;
    return (raw || this.lang.tr('Document importé', 'مستند مستورد')).replace(/\s+/g, ' ').trim();
  });

  /** In Auto mode, the layout the model chose for the current sheet (null otherwise). */
  readonly autoPicked = computed<InfographicPreset | null>(() => {
    if (this.preset() !== 'auto') return null;
    const v = this.doc()?.values as { preset?: InfographicPreset } | undefined;
    return v?.preset ?? null;
  });

  presetName(id: InfographicPreset): string {
    const p = this.presets.find((x) => x.id === id);
    return p ? this.lang.tr(p.fr, p.ar) : id;
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

  async illustrate(target: SpecImageTarget) {
    const d = this.doc();
    if (!d || this.illustrating()) return;
    this.illustrating.set(target.kind === 'hero' ? 'hero' : `${target.kind}-${target.index}`);
    this.error.set(null);
    const res = await this.store.illustrateInfographicBlock(d, target);
    this.illustrating.set(null);
    // A regenerate may have replaced the sheet meanwhile: only apply to the same doc version.
    if (res.ok && res.doc && this.doc() === d) this.doc.set(res.doc);
    else if (!res.ok) this.error.set(res.error ?? this.lang.tr('Image indisponible.', 'الصورة غير متوفرة.'));
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
