import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { EducationStore, LanguageService } from '@core';
import { WorksheetDna, GeneratedExercise } from '@core';

/**
 * Phase 2 — Worksheet style-clone studio.
 * Upload a worksheet image → analyze its visual DNA → generate similar exercises
 * reusing the detected palette/topic → preview, print (A4), share.
 */
@Component({
  selector: 'app-worksheet-generator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './worksheet-generator.html',
  styleUrl: './worksheet-generator.css',
})
export class WorksheetGeneratorComponent implements OnInit, OnDestroy {
  readonly store = inject(EducationStore);
  readonly lang = inject(LanguageService);

  readonly sourceImage = signal<string | null>(null);
  readonly dna = signal<WorksheetDna | null>(null);
  readonly exercises = signal<GeneratedExercise[]>([]);
  readonly count = signal(3);
  readonly analyzing = signal(false);
  readonly generating = signal(false);
  readonly illustrating = signal(false);

  // Rotating "AI thinking" status line shown during any long call.
  readonly thinking = signal('');
  readonly busy = computed(() => this.analyzing() || this.generating() || this.illustrating());
  private thinkingTimer: ReturnType<typeof setInterval> | null = null;

  // Phase 3b — sharing + shared read-only view.
  readonly shared = signal(false);
  readonly sharedTitle = signal('');
  readonly saving = signal(false);
  readonly shareUrl = signal<string | null>(null);

  private contentType = 'image/jpeg';

  private startThinking(messages: string[]) {
    let i = 0;
    this.thinking.set(messages[0]);
    this.stopThinking(false);
    this.thinkingTimer = setInterval(() => {
      i = (i + 1) % messages.length;
      this.thinking.set(messages[i]);
    }, 2200);
  }

  private stopThinking(clear = true) {
    if (this.thinkingTimer) {
      clearInterval(this.thinkingTimer);
      this.thinkingTimer = null;
    }
    if (clear) this.thinking.set('');
  }

  ngOnDestroy() {
    this.stopThinking();
  }

  async ngOnInit() {
    if (typeof window === 'undefined') return;
    const sheetId = new URLSearchParams(window.location.search).get('sheet');
    if (!sheetId) return;
    const doc = await this.store.getWorksheet(sheetId);
    if (doc) {
      this.shared.set(true);
      this.sharedTitle.set(doc.title);
      this.dna.set({ palette: doc.palette, topic: doc.topic, grade: doc.grade as WorksheetDna['grade'], subject: doc.subject as WorksheetDna['subject'] });
      this.exercises.set(doc.exercises || []);
    }
  }

  async share() {
    const list = this.exercises();
    if (list.length === 0 || this.saving()) return;
    const d = this.dna();
    this.saving.set(true);
    try {
      const result = await this.store.saveWorksheet({
        title: d?.title || d?.topic || 'Fiche Madrasati TN',
        grade: d?.grade,
        subject: d?.subject,
        topic: d?.topic,
        palette: d?.palette,
        exercises: list,
      });
      if (result && typeof window !== 'undefined') {
        const full = window.location.origin + result.shareUrl;
        this.shareUrl.set(full);
        try { await navigator.clipboard.writeText(full); } catch { /* clipboard may be blocked */ }
      }
    } finally {
      this.saving.set(false);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.contentType = file.type || 'image/jpeg';
    const reader = new FileReader();
    reader.onload = () => {
      this.sourceImage.set(reader.result as string);
      this.dna.set(null);
      this.exercises.set([]);
    };
    reader.readAsDataURL(file);
  }

  async analyze() {
    const img = this.sourceImage();
    if (!img || this.analyzing()) return;
    this.analyzing.set(true);
    this.startThinking([
      this.lang.tr('Lecture de la fiche…', '…قراءة الورقة'),
      this.lang.tr('Détection des couleurs et du style…', '…استخراج الألوان والنمط'),
      this.lang.tr('Identification du niveau et de la matière…', '…تحديد المستوى والمادة'),
      this.lang.tr('Analyse de la mise en page…', '…تحليل التنسيق'),
    ]);
    try {
      const dna = await this.store.analyzeWorksheet(img, this.contentType, 'worksheet-upload');
      this.dna.set(dna);
    } finally {
      this.analyzing.set(false);
      this.stopThinking();
    }
  }

  async generate() {
    const dna = this.dna();
    if (!dna || this.generating()) return;
    this.generating.set(true);
    this.startThinking([
      this.lang.tr('Conception des exercices…', '…تصميم التمارين'),
      this.lang.tr('Adaptation au programme tunisien…', '…التكييف مع البرنامج التونسي'),
      this.lang.tr('Rédaction des consignes…', '…صياغة التعليمات'),
      this.lang.tr('Préparation des corrigés…', '…إعداد الإصلاح'),
    ]);
    try {
      const list = await this.store.generateSimilarExercises(dna, this.count());
      this.exercises.set(list);
    } finally {
      this.generating.set(false);
      this.stopThinking();
    }
  }

  async illustrate() {
    const list = this.exercises();
    if (list.length === 0 || this.illustrating()) return;
    const style = this.dna()?.illustrationStyle || 'educational';
    this.illustrating.set(true);
    this.startThinking([
      this.lang.tr('Dessin des illustrations…', '…رسم الصور'),
      this.lang.tr('Application de la palette de couleurs…', '…تطبيق لوحة الألوان'),
      this.lang.tr('Rendu adapté aux enfants…', '…إخراج مناسب للأطفال'),
    ]);
    try {
      await Promise.all(
        list.map(async (ex, i) => {
          if (!ex.imagePrompt || ex.imageUrl) return;
          const url = await this.store.generateIllustration(ex.imagePrompt, style);
          if (url) {
            this.exercises.update((cur) => {
              const copy = [...cur];
              copy[i] = { ...copy[i], imageUrl: url };
              return copy;
            });
          }
        })
      );
    } finally {
      this.illustrating.set(false);
      this.stopThinking();
    }
  }

  accent(): string {
    return this.dna()?.palette?.[0] || '#1B4332';
  }

  // Split "Texte [[mot]] suite" into renderable parts; [[mot]] becomes a blank
  // (the answer is hidden so the sheet is fillable; length hints the word size).
  gapParts(text: string | undefined): { t: string; blank: boolean; len: number }[] {
    if (!text) return [];
    return text.split(/(\[\[[^\]]+\]\])/g).filter(Boolean).map((seg) => {
      const m = seg.match(/^\[\[([^\]]+)\]\]$/);
      return m ? { t: '', blank: true, len: m[1].length } : { t: seg, blank: false, len: 0 };
    });
  }

  blankUnderscores(len: number): string {
    return ' '.repeat(Math.max(4, Math.min(len + 2, 14)));
  }

  print() {
    if (typeof window !== 'undefined') window.print();
  }
}
