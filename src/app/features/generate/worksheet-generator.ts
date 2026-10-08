import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { EducationStore, LanguageService, FirebaseService, WorksheetDoc, WorksheetDna, GeneratedExercise, PRIMARY_GRADES, PRIMARY_SUBJECTS, buildWatermark } from '@core';
import { CartoucheComponent } from '@shared';

/**
 * Phase 2 — Worksheet style-clone studio.
 * Upload a worksheet image → analyze its visual DNA → generate similar exercises
 * reusing the detected palette/topic → preview, print (A4), share.
 */
@Component({
  imports: [CartoucheComponent],
  selector: 'app-worksheet-generator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './worksheet-generator.html',
  styleUrl: './worksheet-generator.css',
})
export class WorksheetGeneratorComponent implements OnInit, OnDestroy {
  readonly store = inject(EducationStore);
  readonly lang = inject(LanguageService);
  readonly firebase = inject(FirebaseService);

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
  readonly sharedDoc = signal<WorksheetDoc | null>(null);
  readonly sharedTitle = signal('');
  readonly saving = signal(false);
  readonly shareUrl = signal<string | null>(null);

  // Teacher Identity & Watermark Attribution Signals
  readonly teacherName = computed(() => {
    return this.sharedDoc()?.authorName || this.firebase.userProfile()?.displayName || 'Salwa';
  });

  readonly customWatermark = computed(() => {
    return buildWatermark({
      customWatermark: this.sharedDoc()?.customWatermark || this.firebase.userProfile()?.customWatermark,
    });
  });

  readonly school = computed(() => {
    return this.sharedDoc()?.school || this.firebase.userProfile()?.school || 'المدرسة الابتدائية التونسية';
  });

  // Attribution role: teacher sheets keep the certified wording; parent and
  // anonymous sheets are labelled as family/community contributions.
  readonly authorRole = computed<'teacher' | 'parent' | 'community'>(() => {
    const shared = this.sharedDoc();
    if (shared) {
      const r = shared.authorRole;
      return r === 'teacher' || r === 'parent' ? r : (r ? 'community' : 'teacher');
    }
    const profileRole = this.firebase.userProfile()?.role;
    if (profileRole === 'teacher') return 'teacher';
    if (profileRole === 'parent') return 'parent';
    return 'community';
  });

  readonly authorCreditLabel = computed(() => {
    const role = this.authorRole();
    if (role === 'teacher') return this.lang.tr('Fiche créée & certifiée par :', 'ورقة إعداد واجتهاد المعلم(ة) :');
    if (role === 'parent') return this.lang.tr('Fiche familiale préparée par :', 'ورقة منزلية من إعداد الولي :');
    return this.lang.tr('Contribution communautaire par :', 'مساهمة مجتمعية من إعداد :');
  });

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
    if (sheetId) {
      const doc = await this.store.getWorksheet(sheetId);
      if (doc) {
        this.shared.set(true);
        this.sharedDoc.set(doc);
        this.sharedTitle.set(doc.title);
        this.dna.set({ palette: doc.palette, topic: doc.topic, grade: doc.grade as WorksheetDna['grade'], subject: doc.subject as WorksheetDna['subject'] });
        this.exercises.set(doc.exercises || []);
      }
      return;
    }

    const src = this.store.consumeLastSourceInput();
    if (!src) return;

    const photos = src.photos ?? src.images ?? [];
    if (photos.length > 0 && photos[0].base64Data) {
      this.sourceImage.set(photos[0].base64Data);
      this.contentType = photos[0].contentType || 'image/jpeg';
      await this.analyze();
      if (this.dna()) {
        await this.generate();
      }
    } else if (src.file?.base64Data) {
      if (src.file.contentType.startsWith('image/')) {
        this.sourceImage.set(src.file.base64Data);
        this.contentType = src.file.contentType || 'image/jpeg';
        await this.analyze();
        if (this.dna()) {
          await this.generate();
        }
      } else {
        const dna: WorksheetDna = {
          title: src.file.filename || src.topic || 'Fiche d\'exercices',
          grade: (src.grade as WorksheetDna['grade']) || '4ème Année',
          subject: (src.subject as WorksheetDna['subject']) || 'Mathématiques',
          topic: src.topic || src.file.filename || 'Exercices d\'entraînement',
          language: (src.language as 'fr' | 'ar') || 'ar',
          palette: ['#1B4332', '#2D6A4F', '#D8F3DC'],
          illustrationStyle: 'educational',
        };
        this.dna.set(dna);
        await this.generate();
      }
    } else if (src.topic || src.text) {
      const dna: WorksheetDna = {
        title: src.topic || (src.text ? src.text.slice(0, 60) : 'Fiche d\'exercices'),
        grade: (src.grade as WorksheetDna['grade']) || '4ème Année',
        subject: (src.subject as WorksheetDna['subject']) || 'Mathématiques',
        topic: src.topic || src.text || 'Exercices d\'entraînement',
        language: (src.language as 'fr' | 'ar') || 'ar',
        palette: ['#1B4332', '#2D6A4F', '#D8F3DC'],
        illustrationStyle: 'educational',
      };
      this.dna.set(dna);
      await this.generate();
    }
  }

  // Pre-publish classification — everything entering the library must carry a
  // confirmed grade + subject (AI-detected values are only a prefill).
  readonly GRADES = PRIMARY_GRADES;
  readonly SUBJECTS = PRIMARY_SUBJECTS;
  readonly sharePromptOpen = signal(false);
  readonly shareGrade = signal('');
  readonly shareSubject = signal('');

  // Optional correction of the AI-detected DNA before generation — a more
  // accurate grade/subject grounds the generation prompt in the right program.
  setDnaField(field: 'grade' | 'subject', value: string) {
    const d = this.dna();
    if (!d) return;
    this.dna.set({ ...d, [field]: (value || undefined) as never });
  }

  share() {
    if (this.exercises().length === 0 || this.saving()) return;
    const d = this.dna();
    if (!this.shareGrade() && d?.grade && this.GRADES.includes(d.grade)) this.shareGrade.set(d.grade);
    if (!this.shareSubject() && d?.subject && this.SUBJECTS.includes(d.subject)) this.shareSubject.set(d.subject);
    this.sharePromptOpen.set(true);
  }

  async confirmShare() {
    const list = this.exercises();
    if (list.length === 0 || this.saving() || !this.shareGrade() || !this.shareSubject()) return;
    const d = this.dna();
    this.saving.set(true);
    try {
      const result = await this.store.saveWorksheet({
        title: d?.title || d?.topic || 'Fiche Madrasati TN',
        grade: this.shareGrade() as WorksheetDna['grade'],
        subject: this.shareSubject() as WorksheetDna['subject'],
        topic: d?.topic,
        palette: d?.palette,
        exercises: list,
        authorName: this.teacherName(),
        authorRole: this.firebase.userProfile() ? this.authorRole() : 'community',
        customWatermark: this.customWatermark(),
        school: this.school(),
      });
      if (result && typeof window !== 'undefined') {
        const full = window.location.origin + result.shareUrl;
        this.shareUrl.set(full);
        this.sharePromptOpen.set(false);
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
      this.lang.tr('Lecture de la fiche…', 'قراءة محتوى الورقة…'),
      this.lang.tr('Détection des couleurs et du style…', 'استخراج الألوان والنمط…'),
      this.lang.tr('Identification du niveau et de la matière…', 'تحديد المستوى والمادة…'),
      this.lang.tr('Analyse de la mise en page…', 'تحليل التنسيق والهيكلة…'),
    ]);
    try {
      const dna = await this.store.analyzeWorksheet(img, this.contentType);
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
      this.lang.tr('Conception des exercices…', 'تصميم التمارين البيداغوجية…'),
      this.lang.tr('Adaptation au programme tunisien…', 'مطابقة البرنامج الرسمي التونسي…'),
      this.lang.tr('Rédaction des consignes…', 'صياغة التعليمات والأسئلة…'),
      this.lang.tr('Préparation des corrigés…', 'إعداد شبكة الإصلاح…'),
    ]);
    try {
      const list = await this.store.generateSimilarExercises(dna, this.count());
      this.exercises.set(list);
    } finally {
      this.generating.set(false);
      this.stopThinking();
    }
  }

  readonly regeneratingIndex = signal<number | null>(null);
  private variations = new Map<number, number>();

  async illustrate() {
    const list = this.exercises();
    if (list.length === 0 || this.illustrating()) return;
    const style = this.dna()?.illustrationStyle || 'educational';
    this.illustrating.set(true);
    this.startThinking([
      this.lang.tr('Dessin des illustrations…', 'رسم الصور التوضيحية…'),
      this.lang.tr('Application de la palette de couleurs…', 'تطبيق لوحة الألوان المكتشفة…'),
      this.lang.tr('Rendu adapté aux enfants…', 'إخراج جذاب ومناسب للأطفال…'),
    ]);
    try {
      const queue = list
        .map((ex, i) => ({ ex, i }))
        .filter((item) => item.ex.imagePrompt && !item.ex.imageUrl);

      const worker = async () => {
        while (queue.length > 0) {
          const item = queue.shift();
          if (!item) break;
          const url = await this.store.generateIllustration(item.ex.imagePrompt!, style);
          if (url) {
            this.exercises.update((cur) => {
              const copy = [...cur];
              copy[item.i] = { ...copy[item.i], imageUrl: url };
              return copy;
            });
          }
        }
      };

      await Promise.all([worker(), worker()]);
    } finally {
      this.illustrating.set(false);
      this.stopThinking();
    }
  }

  async regenerateExerciseImage(index: number) {
    const ex = this.exercises()[index];
    if (!ex || !ex.imagePrompt || this.regeneratingIndex() === index) return;
    const style = this.dna()?.illustrationStyle || 'educational';
    const nextVar = (this.variations.get(index) ?? 0) + 1;
    this.variations.set(index, nextVar);
    this.regeneratingIndex.set(index);
    try {
      const url = await this.store.generateIllustration(ex.imagePrompt, style, nextVar);
      if (url) {
        this.exercises.update((cur) => {
          const copy = [...cur];
          copy[index] = { ...copy[index], imageUrl: url };
          return copy;
        });
      }
    } finally {
      this.regeneratingIndex.set(null);
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

  readonly copied = signal<'link' | 'embed' | null>(null);

  embedSnippet(): string {
    const url = this.shareUrl();
    if (!url) return '';
    return `<iframe src="${url}" width="100%" height="900" style="border:1px solid #E7DFCF;border-radius:14px" loading="lazy"></iframe>`;
  }

  private async copyText(text: string, which: 'link' | 'embed') {
    if (!text || typeof navigator === 'undefined') return;
    try {
      await navigator.clipboard.writeText(text);
      this.copied.set(which);
      setTimeout(() => this.copied.set(null), 2000);
    } catch { /* clipboard may be blocked */ }
  }

  copyShareLink() {
    const url = this.shareUrl();
    if (url) this.copyText(url, 'link');
  }

  copyEmbed() {
    this.copyText(this.embedSnippet(), 'embed');
  }

  shareOnFacebook() {
    const url = this.shareUrl();
    if (url && typeof window !== 'undefined') {
      window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url), '_blank', 'noopener,width=680,height=640');
    }
  }

  print() {
    if (typeof window !== 'undefined') window.print();
  }
}
