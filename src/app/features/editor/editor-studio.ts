import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { CdkDragDrop, CdkDropList, CdkDrag, CdkDragHandle, CdkDragPlaceholder, moveItemInArray } from '@angular/cdk/drag-drop';
import { EducationStore, LanguageService, FirebaseService, NotificationService, GradeLevel, SubjectName, InteractionService, AiClient, AiJson, buildWatermark, DEFAULT_WATERMARK, SourceInput, chapterById, createStudioSession } from '@core';
import { CartoucheComponent, STUDIO_BAR_BTN, StudioBarComponent, StudioSessionBannerComponent } from '@shared';
import { EditorBlock, EditorBlockType, DocumentType, ExerciseFormat, ExerciseDifficulty } from './editor.model';

@Component({
  selector: 'app-editor-studio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CdkDropList, CdkDrag, CdkDragHandle, CdkDragPlaceholder, CartoucheComponent, StudioBarComponent, StudioSessionBannerComponent],
  templateUrl: './editor-studio.html',
  styleUrl: './editor-studio.css',
})
export class EditorStudioComponent implements OnInit {
  readonly store = inject(EducationStore);
  readonly lang = inject(LanguageService);
  readonly firebase = inject(FirebaseService);
  readonly notifService = inject(NotificationService);
  readonly interactionSvc = inject(InteractionService);
  private readonly ai = inject(AiClient);
  private readonly location = inject(Location);
  private readonly route = inject(ActivatedRoute);

  readonly viewMode = signal<'editor' | 'split' | 'preview'>('preview');
  readonly showMetadataPanel = signal<boolean>(false);

  // Pro 3-pane: which pane is visible on mobile (desktop shows all three).
  readonly mobilePane = signal<'inspector' | 'canvas' | 'outline'>('canvas');
  // A4 print-margin guides toggle in the canvas toolbar.
  readonly showPrintMargins = signal<boolean>(true);
  /** Sheet margin in mm (5–30): sets the on-screen guide and the printed margin. */
  readonly sheetMargin = signal(15);
  readonly marginPresets = [
    { mm: 10, fr: 'Étroites', ar: 'ضيّقة' },
    { mm: 15, fr: 'Normales', ar: 'عادية' },
    { mm: 20, fr: 'Larges', ar: 'واسعة' },
  ];

  setSheetMargin(mm: number) {
    this.sheetMargin.set(Number.isFinite(mm) ? Math.min(30, Math.max(5, Math.round(mm))) : 15);
  }

  // Phase 3: Studio shell derived from docType
  // Shell A = exam / exercise_sheet / course / summary → 3-col A4 layout
  // Shell B = article → Medium-style centered prose canvas
  readonly studioShell = computed<'A' | 'B'>(() =>
    this.docType() === 'article' ? 'B' : 'A'
  );

  // Variante IA state (Idea 11)
  readonly isVariantLoading = signal<boolean>(false);
  readonly lastVariantBlockId = signal<string | null>(null);

  // Click-to-edit directly inside the A4 preview (Gamma-style ergonomics).
  readonly editingBlockId = signal<string | null>(null);

  // Pro 3-pane: currently inspected block (left Inspector pane binds to this).
  readonly selectedBlockId = signal<string | null>(null);
  readonly selectedBlock = computed<EditorBlock | null>(() => {
    const id = this.selectedBlockId();
    return id ? this.blocks().find((b) => b.id === id) ?? null : null;
  });

  readonly difficultyOptions: { value: ExerciseDifficulty; fr: string; ar: string }[] = [
    { value: 'Facile', fr: 'Facile', ar: 'سهل' },
    { value: 'Moyen', fr: 'Moyen', ar: 'متوسط' },
    { value: 'Difficile', fr: 'Difficile', ar: 'صعب' },
  ];

  selectBlock(id: string) {
    this.selectedBlockId.set(id);
  }

  // Sum of an exercise block's barème criteria (for Inspector live total).
  criteriaTotal(b: EditorBlock): number {
    return (b.exerciseCriteria || []).reduce((sum, c) => sum + (c.points || 0), 0);
  }

  setDifficulty(id: string, value: ExerciseDifficulty) {
    this.updateBlockField(id, 'exerciseDifficulty', value);
  }

  addCriterion(id: string) {
    this.blocks.update((list) =>
      list.map((b) => {
        if (b.id !== id) return b;
        const criteria = [...(b.exerciseCriteria || [])];
        criteria.push({ label: `Critère ${criteria.length + 1}`, points: 1, detail: '' });
        return { ...b, exerciseCriteria: criteria };
      })
    );
  }

  updateCriterion(id: string, idx: number, field: 'label' | 'points' | 'detail', value: string | number) {
    this.blocks.update((list) =>
      list.map((b) => {
        if (b.id !== id) return b;
        const criteria = [...(b.exerciseCriteria || [])];
        if (criteria[idx]) criteria[idx] = { ...criteria[idx], [field]: value };
        return { ...b, exerciseCriteria: criteria };
      })
    );
  }

  removeCriterion(id: string, idx: number) {
    this.blocks.update((list) =>
      list.map((b) => {
        if (b.id !== id) return b;
        const criteria = [...(b.exerciseCriteria || [])];
        criteria.splice(idx, 1);
        return { ...b, exerciseCriteria: criteria };
      })
    );
  }

  // Outline-tree icon per block type.
  getBlockIcon(type: EditorBlockType): string {
    switch (type) {
      case 'paragraph': return 'notes';
      case 'heading1': return 'title';
      case 'heading2': return 'text_fields';
      case 'heading3': return 'segment';
      case 'exercise': return 'assignment';
      case 'callout': return 'lightbulb';
      case 'cartouche': return 'verified';
      case 'image': return 'image';
      case 'divider': return 'horizontal_rule';
      default: return 'crop_square';
    }
  }

  isInlineEditable(b: EditorBlock): boolean {
    return b.type !== 'image' && b.type !== 'divider' && b.type !== 'cartouche';
  }

  startInlineEdit(b: EditorBlock) {
    this.selectedBlockId.set(b.id);
    if (!this.isInlineEditable(b)) return;
    this.editingBlockId.set(b.id);
    // Focus the freshly rendered inline control (autofocus attr is a11y-banned).
    if (typeof document !== 'undefined') {
      setTimeout(() => {
        const el = document.querySelector<HTMLElement>('[data-editing="true"] textarea, [data-editing="true"] input');
        el?.focus();
      });
    }
  }

  stopInlineEdit() {
    this.editingBlockId.set(null);
  }

  // Notion-style inline insertion between blocks
  readonly activeInsertIndex = signal<number | null>(null);

  insertBlockAt(index: number, type: EditorBlockType) {
    const exerciseCount = this.blocks().filter((b) => b.type === 'exercise').length;
    const newBlock: EditorBlock = {
      id: 'b-' + Date.now(),
      type,
      content: '',
      exerciseTitle: type === 'exercise' ? 'Exercice N°' + (exerciseCount + 1) : undefined,
      exercisePoints: type === 'exercise' ? 5 : undefined,
      calloutTitle: type === 'callout' ? 'Conseil Pédagogique' : undefined,
    };
    this.blocks.update((list) => {
      const copy = [...list];
      copy.splice(index + 1, 0, newBlock);
      return copy;
    });
    this.activeInsertIndex.set(null);
    this.startInlineEdit(newBlock);
  }

  deleteBlockById(id: string) {
    this.blocks.update((list) => list.filter((b) => b.id !== id));
    if (this.selectedBlockId() === id) this.selectedBlockId.set(null);
  }
  readonly isAutoSaved = signal<boolean>(true);
  readonly toastMsg = signal<string>('');
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  showToast(msg: string) {
    this.toastMsg.set(msg);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    if (typeof setTimeout !== 'undefined') {
      this.toastTimer = setTimeout(() => this.toastMsg.set(''), 2600);
    }
  }

  manualSave() {
    this.saveDraft();
    this.showToast(this.lang.tr('Brouillon enregistré', 'تم حفظ المسودة'));
  }

  readonly publishModalOpen = signal<boolean>(false);
  readonly aiModalOpen = signal<boolean>(false);
  /** The document itself autosaves locally; the session covers generation state and the leave warning. */
  readonly session = createStudioSession('exercises', {
    retry: () => this.retryLastGeneration(),
    undo: (previous) => this.restoreBlock(previous as EditorBlock),
  });
  readonly isAiLoading = computed(() => this.session.busy());
  private lastGeneration: (() => Promise<void>) | null = null;
  readonly aiPromptQuery = signal<string>('');
  readonly imageUploadError = signal<string>('');

  private readonly MAX_IMAGE_BYTES = 15 * 1024 * 1024;
  private readonly ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

  // Document Metadata
  readonly docTitle = signal<string>('Évaluation de Mathématiques — Trimestre 1');
  readonly docType = signal<DocumentType>('exam');
  readonly docSubject = signal<SubjectName>('Mathématiques');
  readonly docGrade = signal<GradeLevel>('4ème Année');
  readonly docTrimester = signal<'Trimestre 1' | 'Trimestre 2' | 'Trimestre 3'>('Trimestre 1');
  /** Programme topic picked upstream (create hub). Kept only while it still matches grade/subject/trimester. */
  private readonly sourceTopicId = signal<string | undefined>(undefined);
  /** Language the AI writes the sheet in: follows the subject unless the teacher picks one. */
  private readonly languageOverride = signal<'ar' | 'fr' | null>(null);
  readonly docLanguage = computed<'ar' | 'fr'>(
    () => this.languageOverride() ?? (this.docSubject() === 'Français' || this.docSubject() === 'Anglais' ? 'fr' : 'ar'),
  );

  setDocLanguage(value: string) {
    this.languageOverride.set(value === 'fr' ? 'fr' : 'ar');
  }

  readonly docTopicId = computed(() => {
    const ch = chapterById(this.sourceTopicId());
    return ch && ch.grade === this.docGrade() && ch.subject === this.docSubject() && ch.trimester === this.docTrimester()
      ? ch.id
      : undefined;
  });
  readonly docSchoolYear = signal<string>('2025-2026');
  readonly docSchool = signal<string>('École Primaire Habib Bourguiba');
  readonly docWatermark = signal<string>(DEFAULT_WATERMARK);

  // Dual-Mode Studio Signals (Teacher vs Parent - Idea 16)
  readonly isParentMode = computed(() => this.store.previousRole() === 'parent');
  readonly customChildName = signal<string>('');
  readonly activeChildName = computed(() => this.customChildName() || 'Élève');
  readonly isTransformingId = signal<string | null>(null);
  readonly barBtn = STUDIO_BAR_BTN;
  readonly mobilePanes = [
    { id: 'inspector', icon: 'tune', fr: 'Inspecteur', ar: 'المفتّش' },
    { id: 'canvas', icon: 'description', fr: 'Page', ar: 'الصفحة' },
    { id: 'outline', icon: 'account_tree', fr: 'Structure', ar: 'الهيكل' },
  ] as const;

  /** Studio bar badge: home practice, exam/exercise sheet or article. */
  readonly studioBadge = computed(() => {
    if (this.isParentMode()) return { icon: 'home', label: this.lang.tr('Atelier maison', 'ورشة التمارين المنزلية') };
    if (this.studioShell() === 'A') return { icon: 'quiz', label: this.lang.tr('Examen / exercices', 'امتحان / تمارين') };
    return { icon: 'article', label: this.lang.tr('Article', 'مقال تربوي') };
  });
  readonly exerciseChip =
    'bg-white hover:bg-[#F2ECDE] border border-[#E7DFCF] text-[#14251D] px-2.5 min-h-9 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-default';

  // Computed live exam points sum
  readonly totalExamPoints = computed(() => {
    return this.blocks()
      .filter((b) => b.type === 'exercise')
      .reduce((sum, b) => sum + (b.exercisePoints || 0), 0);
  });

  // Blocks
  readonly blocks = signal<EditorBlock[]>([
    {
      id: 'b-cartouche',
      type: 'cartouche',
      content: '',
    },
    {
      id: 'b-h1',
      type: 'heading1',
      content: 'I. Activités Numériques & Opérations',
    },
    {
      id: 'b-ex1',
      type: 'exercise',
      exerciseTitle: 'Exercice N°1 : Calcul posé',
      exercisePoints: 8,
      content: 'Pose et effectue les opérations suivantes :\na) 4 825 + 3 947 = ............\nb) 9 000 - 4 382 = ............\nc) 348 × 26 = ............',
      exerciseSolution: 'a) 8 772\nb) 4 618\nc) 9 048',
      showSolution: false,
    },
    {
      id: 'b-callout',
      type: 'callout',
      calloutTitle: 'Rappel pour la retenue',
      content: "N'oublie pas d'ajouter la retenue sur la colonne suivante lors de l'addition et de la multiplication.",
    },
    {
      id: 'b-h2',
      type: 'heading1',
      content: 'II. Résolution de Problème',
    },
    {
      id: 'b-ex2',
      type: 'exercise',
      exerciseTitle: 'Exercice N°2 : Situation Problème',
      exercisePoints: 12,
      content: 'Un agriculteur récolte 1 450 kg d\'olives le matin et 980 kg l\'après-midi.\n1) Calcule la masse totale d\'olives récoltées.\n2) Il vend les olives à 3 dinars le kg. Quel est le montant total de la vente ?',
      exerciseSolution: '1) 1 450 + 980 = 2 430 kg\n2) 2 430 × 3 = 7 290 DT',
      showSolution: false,
    },
  ]);

  private draftLoaded = false;

  constructor() {
    this.loadDraft();
    const user = this.firebase.userProfile() || this.firebase.currentUser();
    if (this.isParentMode()) {
      this.docWatermark.set(`Entraînement Maison — ${this.activeChildName()}`);
      this.docTitle.set(`Fiche d'Entraînement — ${this.docSubject()}`);
    } else if (user?.displayName) {
      this.docWatermark.set(`Madrasati TN — Enseignant : ${user.displayName}`);
    }
    this.draftLoaded = true;

    // Auto-persist any metadata/block change to localStorage.
    effect(() => {
      // Track every persisted field so the effect re-runs on any edit.
      this.docTitle();
      this.docType();
      this.docSubject();
      this.docGrade();
      this.docTrimester();
      this.docSchool();
      this.docWatermark();
      this.customChildName();
      this.blocks();
      if (this.draftLoaded) this.saveDraft();
    });
  }

  private getDraftStorageKey(): string {
    const uid = this.firebase.userProfile()?.uid || 'guest';
    const prefix = this.isParentMode() ? 'madrasati_studio_parent_draft' : 'madrasati_studio_teacher_draft';
    return `${prefix}_${uid}`;
  }

  saveDraft() {
    if (typeof localStorage !== 'undefined') {
      const draft = {
        title: this.docTitle(),
        type: this.docType(),
        subject: this.docSubject(),
        grade: this.docGrade(),
        trimester: this.docTrimester(),
        school: this.docSchool(),
        watermark: this.docWatermark(),
        childName: this.customChildName(),
        blocks: this.blocks(),
      };
      localStorage.setItem(this.getDraftStorageKey(), JSON.stringify(draft));
      this.isAutoSaved.set(true);
    }
  }

  loadDraft() {
    if (typeof localStorage !== 'undefined') {
      const userKey = this.getDraftStorageKey();
      const legacyKey = this.isParentMode() ? 'madrasati_studio_parent_draft' : 'madrasati_studio_teacher_draft';
      const raw = localStorage.getItem(userKey) || localStorage.getItem(legacyKey);
      if (raw) {
        try {
          const draft = JSON.parse(raw);
          if (draft.title) this.docTitle.set(draft.title);
          if (draft.type) this.docType.set(draft.type);
          if (draft.subject) this.docSubject.set(draft.subject);
          if (draft.grade) this.docGrade.set(draft.grade);
          if (draft.trimester) this.docTrimester.set(draft.trimester);
          if (draft.school) this.docSchool.set(draft.school);
          if (draft.watermark) this.docWatermark.set(draft.watermark);
          if (draft.childName) this.customChildName.set(draft.childName);
          if (Array.isArray(draft.blocks) && draft.blocks.length > 0) this.blocks.set(draft.blocks);
        } catch (e) {
          console.error('Failed to parse draft', e);
        }
      }
    }
  }

  ngOnInit() {
    if (typeof window === 'undefined') return;
    const qType = this.route.snapshot.queryParamMap.get('type') as DocumentType | null;
    const src = this.store.consumeLastSourceInput();

    if (qType && ['exam', 'exercise_sheet', 'course', 'article'].includes(qType)) {
      this.docType.set(qType);
    }

    if (src) {
      this.sourceTopicId.set(src.topicId);
      if (src.grade) this.docGrade.set(src.grade as GradeLevel);
      if (src.subject) this.docSubject.set(src.subject as SubjectName);
      if (src.trimester) {
        const tri = src.trimester.includes('2') ? 'Trimestre 2' : src.trimester.includes('3') ? 'Trimestre 3' : 'Trimestre 1';
        this.docTrimester.set(tri);
      }
      const targetType = qType || (this.docType() as DocumentType);
      void this.applySourceAndGenerate(src, targetType);
    } else {
      // Chapter picked in the programme: pre-fill the settings only; the teacher generates from here.
      const pre = this.store.consumePrefill();
      if (pre) {
        this.sourceTopicId.set(pre.topicId);
        if (pre.grade) this.docGrade.set(pre.grade as GradeLevel);
        if (pre.subject) this.docSubject.set(pre.subject as SubjectName);
        if (pre.trimester) {
          const tri = pre.trimester.includes('2') ? 'Trimestre 2' : pre.trimester.includes('3') ? 'Trimestre 3' : 'Trimestre 1';
          this.docTrimester.set(tri);
        }
      }
    }
    if (!src && qType) {
      if (qType === 'exam') this.loadTemplatePreset('exam_full');
      else if (qType === 'exercise_sheet') this.loadTemplatePreset('exercise_sheet');
      else if (qType === 'course') this.loadTemplatePreset('course_summary');
    }
  }

  private retryLastGeneration() {
    void this.lastGeneration?.();
  }

  async applySourceAndGenerate(src: SourceInput, type: DocumentType) {
    this.lastGeneration = () => this.applySourceAndGenerate(src, type);
    const lang = (src.language as 'fr' | 'ar') || (this.docSubject() === 'Français' || this.docSubject() === 'Anglais' ? 'fr' : 'ar');
    const extraInstructions = src.instructions ? ` - Note: ${src.instructions}` : (src.text && src.topic ? ` - Contexte: ${src.text.slice(0, 100)}` : '');
    const effectiveTopic =
      src.topic ||
      (src.text ? src.text.slice(0, 60) : '') ||
      (src.file?.filename ? `Document ${src.file.filename}` : '') ||
      (src.images?.length || src.photos?.length ? `Exercices et activités en ${this.docSubject()}` : `Notion clé en ${this.docSubject()}`);

    if (type === 'exam') {
      this.docTitle.set(`Évaluation : ${effectiveTopic} (${this.docGrade()})`);
      const b1Id = 'b-' + Date.now() + '-1';
      const b2Id = 'b-' + Date.now() + '-2';
      const ex1Id = 'b-' + Date.now() + '-ex1';
      const b3Id = 'b-' + Date.now() + '-3';
      const ex2Id = 'b-' + Date.now() + '-ex2';

      this.blocks.set([
        { id: b1Id, type: 'cartouche', content: '' },
        { id: b2Id, type: 'heading1', content: 'I. Connaissances & Application' },
        {
          id: ex1Id,
          type: 'exercise',
          exerciseTitle: 'Exercice N°1 (8 Pts)',
          exercisePoints: 8,
          content: 'Génération de l’exercice en cours…',
          showSolution: false,
        },
        { id: b3Id, type: 'heading1', content: 'II. Raisonnement & Résolution de Problème' },
        {
          id: ex2Id,
          type: 'exercise',
          exerciseTitle: 'Exercice N°2 : Situation Problème (12 Pts)',
          exercisePoints: 12,
          content: 'Génération de la situation problème en cours…',
          showSolution: false,
        },
      ]);

      try {
        const pair = await this.session.run(() => Promise.all([
          this.ai.post('generate-exercise', {
            grade: this.docGrade(),
            subject: this.docSubject(),
            topic: `${effectiveTopic} - Connaissances de base et calcul direct${extraInstructions}`,
            topicId: this.docTopicId(),
            difficulty: 'Facile',
            format: 'free',
            trimester: this.docTrimester(),
            points: 8,
            language: lang,
            role: this.isParentMode() ? 'parent' : 'teacher',
            childName: this.activeChildName(),
          }),
          this.ai.post('generate-exercise', {
            grade: this.docGrade(),
            subject: this.docSubject(),
            topic: `${effectiveTopic} - Situation problème et raisonnement${extraInstructions}`,
            topicId: this.docTopicId(),
            difficulty: 'Moyen',
            format: 'free',
            trimester: this.docTrimester(),
            points: 12,
            language: lang,
            role: this.isParentMode() ? 'parent' : 'teacher',
            childName: this.activeChildName(),
          }),
        ]));
        if (!pair) return;
        const [res1, res2] = pair;
        if (!res1.ok && !res2.ok) this.session.fail(res1.error);
        else this.session.succeed();

        if (res1.ok && res1.data['exercise']) {
          this.applyExercise(ex1Id, res1.data['exercise'] as AiJson, { title: 'Exercice N°1', points: 8 });
        }
        if (res2.ok && res2.data['exercise']) {
          this.applyExercise(ex2Id, res2.data['exercise'] as AiJson, { title: 'Exercice N°2 (Situation Problème)', points: 12 });
        }
      } finally {
        this.saveDraft();
      }
    } else if (type === 'exercise_sheet') {
      this.docTitle.set(`Série d'Exercices : ${effectiveTopic} (${this.docGrade()})`);
      const b1Id = 'b-' + Date.now() + '-1';
      const ex1Id = 'b-' + Date.now() + '-ex1';
      const ex2Id = 'b-' + Date.now() + '-ex2';

      this.blocks.set([
        { id: b1Id, type: 'heading1', content: `Série d'Exercices : ${effectiveTopic}` },
        {
          id: ex1Id,
          type: 'exercise',
          exerciseTitle: 'Exercice N°1 : Entraînement de base',
          exercisePoints: 10,
          content: 'Génération de l’exercice en cours…',
          showSolution: false,
        },
        {
          id: ex2Id,
          type: 'exercise',
          exerciseTitle: 'Exercice N°2 : Approfondissement',
          exercisePoints: 10,
          content: 'Génération de l’exercice en cours…',
          showSolution: false,
        },
      ]);

      try {
        const pair = await this.session.run(() => Promise.all([
          this.ai.post('generate-exercise', {
            grade: this.docGrade(),
            subject: this.docSubject(),
            topic: `${effectiveTopic} - Entraînement fondamental${extraInstructions}`,
            topicId: this.docTopicId(),
            difficulty: 'Facile',
            format: 'free',
            trimester: this.docTrimester(),
            points: 10,
            language: lang,
            role: this.isParentMode() ? 'parent' : 'teacher',
            childName: this.activeChildName(),
          }),
          this.ai.post('generate-exercise', {
            grade: this.docGrade(),
            subject: this.docSubject(),
            topic: `${effectiveTopic} - Défi et approfondissement${extraInstructions}`,
            topicId: this.docTopicId(),
            difficulty: 'Moyen',
            format: 'free',
            trimester: this.docTrimester(),
            points: 10,
            language: lang,
            role: this.isParentMode() ? 'parent' : 'teacher',
            childName: this.activeChildName(),
          }),
        ]));
        if (!pair) return;
        const [res1, res2] = pair;
        if (!res1.ok && !res2.ok) this.session.fail(res1.error);
        else this.session.succeed();

        if (res1.ok && res1.data['exercise']) {
          this.applyExercise(ex1Id, res1.data['exercise'] as AiJson, { title: 'Exercice N°1 : Entraînement de base', points: 10 });
        }
        if (res2.ok && res2.data['exercise']) {
          this.applyExercise(ex2Id, res2.data['exercise'] as AiJson, { title: 'Exercice N°2 : Approfondissement', points: 10 });
        }
      } finally {
        this.saveDraft();
      }
    } else {
      this.docTitle.set(`${effectiveTopic} (${this.docGrade()})`);
    }
  }

  /**
   * Ready-made sheets in the sheet language. Exercise texts are placeholders ending in "…",
   * so each one shows "Generate this exercise"; points add up to 20.
   */
  loadTemplatePreset(type: 'exam_full' | 'course_summary' | 'exercise_sheet') {
    const ar = this.docLanguage() === 'ar';
    const t = (fr: string, arText: string) => (ar ? arText : fr);
    const subject = this.lang.translateSubject(this.docSubject());
    const grade = this.lang.translateGrade(this.docGrade());
    let n = 0;
    const id = () => `b-${Date.now()}-${++n}`;
    const heading = (content: string, level: 'heading1' | 'heading2' = 'heading1'): EditorBlock => ({ id: id(), type: level, content });
    const note = (title: string, content: string): EditorBlock => ({ id: id(), type: 'callout', calloutTitle: title, content });
    const exercise = (
      no: number,
      title: string,
      points: number,
      format: ExerciseFormat,
      content: string,
      difficulty: ExerciseDifficulty,
      criteria?: { label: string; detail: string }[],
    ): EditorBlock => ({
      id: id(),
      type: 'exercise',
      exerciseTitle: `${t('Exercice', 'التمرين')} ${no} : ${title}`,
      exercisePoints: points,
      exerciseFormat: format,
      exerciseDifficulty: difficulty,
      content,
      showSolution: false,
      exerciseCriteria: criteria?.map((c) => ({ label: c.label, detail: c.detail, points })),
    });

    if (type === 'exercise_sheet') {
      this.docType.set('exercise_sheet');
      this.docTitle.set(t(`Série d'entraînement : ${subject} (${grade})`, `سلسلة تمارين : ${subject} (${grade})`));
      this.blocks.set([
        heading(t('Série d’exercices', 'سلسلة تمارين')),
        note(t('Objectif de la série', 'هدف السلسلة'), t('À la fin de cette série, je saurai…', 'في نهاية هذه السلسلة، أكون قادرًا على…')),
        heading(t('Je m’entraîne', 'أتدرّب'), 'heading2'),
        exercise(1, t('Je choisis la bonne réponse', 'أختار الإجابة الصحيحة'), 4, 'qcm', t('Coche la bonne réponse…', 'أشطب الإجابة الصحيحة…'), 'Facile'),
        exercise(2, t('Vrai ou faux', 'صواب أم خطأ'), 4, 'true_false', t('Réponds par vrai ou faux…', 'أجيب بصواب أو خطأ…'), 'Facile'),
        exercise(3, t('Je complète', 'أكمل'), 4, 'fill_blanks', t('Complète avec le mot ou le nombre qui convient…', 'أكمل بالكلمة أو العدد المناسب…'), 'Moyen'),
        heading(t('Je réfléchis', 'أفكّر'), 'heading2'),
        exercise(4, t('Situation-problème', 'وضعية مشكل'), 8, 'free', t('Je lis la situation, je cherche puis je rédige ma réponse…', 'أقرأ الوضعية، أبحث ثم أحرّر إجابتي…'), 'Difficile'),
        note(t('Conseil', 'نصيحة'), t('Relis chaque consigne et vérifie ta réponse avant de passer à la suivante.', 'أقرأ كل تعليمة جيدًا وأتثبّت من إجابتي قبل المرور إلى الموالية.')),
      ]);
    } else if (type === 'exam_full') {
      this.docType.set('exam');
      this.docTitle.set(t(`Évaluation : ${subject} (${grade})`, `تقييم : ${subject} (${grade})`));
      const c1 = { label: 'C1', detail: t('Interprétation adéquate', 'التأويل الملائم') };
      const c2 = { label: 'C2', detail: t('Utilisation correcte des outils', 'الاستعمال السليم للأدوات') };
      const c3 = { label: 'C3', detail: t('Cohérence de la réponse', 'انسجام الإجابة') };
      const c4 = { label: 'C4', detail: t('Perfectionnement', 'التميّز') };
      this.blocks.set([
        { id: id(), type: 'cartouche', content: '' },
        note(t('Consignes générales', 'تعليمات عامة'), t('Lis attentivement chaque consigne. Écris lisiblement. Durée : 60 minutes.', 'أقرأ كل تعليمة بانتباه. أكتب بخط واضح. المدة : 60 دقيقة.')),
        heading(t('Partie I : Je mobilise mes acquis', 'الجزء الأول : أوظّف مكتسباتي')),
        exercise(1, t('Je choisis la bonne réponse', 'أختار الإجابة الصحيحة'), 3, 'qcm', t('Coche la bonne réponse…', 'أشطب الإجابة الصحيحة…'), 'Facile', [c1]),
        exercise(2, t('Je complète', 'أكمل'), 3, 'fill_blanks', t('Complète avec ce qui convient…', 'أكمل بما يناسب…'), 'Facile', [c2]),
        exercise(3, t('Je relie', 'أربط'), 3, 'matching', t('Relie chaque élément à ce qui lui correspond…', 'أربط كل عنصر بما يناسبه…'), 'Moyen', [c2]),
        heading(t('Partie II : Je résous des situations', 'الجزء الثاني : أحلّ وضعيات')),
        exercise(4, t('Situation-problème', 'وضعية مشكل'), 5, 'free', t('Je lis la situation et je réponds aux questions…', 'أقرأ الوضعية وأجيب عن الأسئلة…'), 'Moyen', [c3]),
        exercise(5, t('Je justifie ma réponse', 'أعلّل إجابتي'), 4, 'free', t('J’explique ma démarche étape par étape…', 'أشرح طريقتي خطوة بخطوة…'), 'Difficile', [c3]),
        heading(t('Partie III : Je vais plus loin', 'الجزء الثالث : أتعمّق')),
        exercise(6, t('Défi', 'تحدٍّ'), 2, 'free', t('Une question pour aller plus loin…', 'سؤال للتعمّق…'), 'Difficile', [c4]),
      ]);
    } else {
      this.docType.set('course');
      this.docTitle.set(t(`Fiche de synthèse : ${subject} (${grade})`, `ملخّص درس : ${subject} (${grade})`));
      this.blocks.set([
        heading(t('Je retiens', 'أتذكّر')),
        note(t('Objectifs', 'الأهداف'), t('Je découvre…\nJe comprends…\nJ’applique…', 'أكتشف…\nأفهم…\nأطبّق…')),
        heading(t('La règle', 'القاعدة'), 'heading2'),
        note(t('À retenir', 'أحفظ'), t('Énoncé de la règle ou de la définition…', 'نصّ القاعدة أو التعريف…')),
        heading(t('Exemples', 'أمثلة'), 'heading2'),
        { id: id(), type: 'paragraph', content: t('Exemple 1 : …\nExemple 2 : …', 'مثال 1 : …\nمثال 2 : …') },
        note(t('Attention !', 'انتبه !'), t('L’erreur fréquente à éviter…', 'الخطأ الشائع الذي أتجنّبه…')),
        heading(t('Je vérifie', 'أتثبّت'), 'heading2'),
        exercise(1, t('Je complète', 'أكمل'), 10, 'fill_blanks', t('Complète en appliquant la règle…', 'أكمل بتطبيق القاعدة…'), 'Facile'),
        exercise(2, t('Je choisis la bonne réponse', 'أختار الإجابة الصحيحة'), 10, 'qcm', t('Coche la bonne réponse…', 'أشطب الإجابة الصحيحة…'), 'Moyen'),
      ]);
    }
    this.saveDraft();
  }

  readonly hasCartoucheBlock = computed(() => {
    return this.blocks().some((b) => b.type === 'cartouche');
  });

  getBlockTypeLabel(type: EditorBlockType): string {
    switch (type) {
      case 'paragraph':
        return 'Paragraphe';
      case 'heading1':
        return 'Titre H1';
      case 'heading2':
        return 'Sous-titre H2';
      case 'heading3':
        return 'Section H3';
      case 'exercise':
        return 'Exercice & Barème';
      case 'callout':
        return 'Encadré Conseil';
      case 'cartouche':
        return 'En-tête Officiel';
      case 'image':
        return 'Image VPS';
      case 'divider':
        return 'Séparateur';
      default:
        return 'Bloc';
    }
  }

  addBlock(type: EditorBlockType) {
    const exerciseCount = this.blocks().filter((b) => b.type === 'exercise').length;
    const newBlock: EditorBlock = {
      id: 'b-' + Date.now(),
      type,
      content: '',
      exerciseTitle: type === 'exercise' ? 'Exercice N°' + (exerciseCount + 1) : undefined,
      exercisePoints: type === 'exercise' ? 5 : undefined,
      calloutTitle: type === 'callout' ? 'Conseil Pédagogique' : undefined,
    };
    this.blocks.update((list) => [...list, newBlock]);
    this.selectedBlockId.set(newBlock.id);
  }

  updateBlockContent(id: string, content: string) {
    this.blocks.update((list) =>
      list.map((b) => (b.id === id ? { ...b, content } : b))
    );
  }

  updateBlockField(id: string, field: keyof EditorBlock, value: string | number | boolean) {
    this.blocks.update((list) =>
      list.map((b) => (b.id === id ? { ...b, [field]: value } : b))
    );
  }

  /** Template exercise still holding its sample text ("Exercices d'assimilation rapide..."). */
  isPlaceholderExercise(b: EditorBlock): boolean {
    if (b.type !== 'exercise') return false;
    if (b.qcmOptions?.length || b.tfStatements?.length || b.gapText || b.matchingPairs?.length) return false;
    if (b.orderItems?.length || b.tableHeaders?.length || b.calcOperands?.length) return false;
    const text = (b.content || '').trim();
    return !text || (text.length < 90 && /(\.\.\.|…)$/.test(text));
  }

  /** Writes one exercise in place from the sheet title, its own title and points. */
  async generateExerciseBlock(block: EditorBlock) {
    this.lastGeneration = () => this.generateExerciseBlock(block);
    const res = await this.session.run(() =>
      this.ai.post('generate-exercise', {
        grade: this.docGrade(),
        subject: this.docSubject(),
        topic: [this.docTitle(), block.exerciseTitle].filter(Boolean).join(' - '),
        topicId: this.docTopicId(),
        difficulty: 'Moyen',
        format: block.exerciseFormat || 'free',
        trimester: this.docTrimester(),
        points: block.exercisePoints || 5,
        language: this.docLanguage(),
        role: this.isParentMode() ? 'parent' : 'teacher',
        childName: this.activeChildName(),
      }),
    );
    if (!res) return;
    const ex = res.ok ? (res.data['exercise'] as AiJson | undefined) : undefined;
    if (!ex) {
      this.session.fail(res.ok ? '' : res.error);
      return;
    }
    this.session.keepUndo(block);
    this.applyExercise(block.id, ex, { title: block.exerciseTitle, points: block.exercisePoints });
    this.session.succeed();
  }

  /** One picture key per sheet keeps a consistent look; each redraw asks for a new variation. */
  private readonly imageSheetKey = 'sheet-' + Math.random().toString(36).slice(2, 10);
  private readonly imageVariations = new Map<string, number>();

  /** Draws the image block from its description with the free image models (not Gemini). */
  async generateBlockImage(block: EditorBlock) {
    const prompt = (block.imageCaption || '').trim();
    const fieldId = 'img-prompt-' + block.id;
    const ok = this.session.validate([
      { id: fieldId, ok: !!prompt, message: this.lang.tr('Décrivez l’image à dessiner.', 'صف الصورة المطلوبة.') },
    ]);
    if (!ok) return;
    this.lastGeneration = () => this.generateBlockImage(block);
    const variation = (this.imageVariations.get(block.id) ?? 0) + (block.imageUrl ? 1 : 0);
    this.imageVariations.set(block.id, variation);
    const url = await this.session.run(() =>
      this.store.generateIllustration(prompt, 'educational', variation || undefined, this.imageSheetKey, { noGemini: true }),
    );
    if (url === undefined) return;
    if (!url) {
      this.session.fail();
      return;
    }
    if (block.imageUrl) this.session.keepUndo(block);
    this.updateBlockField(block.id, 'imageUrl', url);
    this.session.succeed();
  }

  readonly exerciseFormats: { id: ExerciseFormat; fr: string; ar: string }[] = [
    { id: 'free', fr: 'Question libre', ar: 'سؤال مفتوح' },
    { id: 'qcm', fr: 'QCM', ar: 'اختيار من متعدد' },
    { id: 'true_false', fr: 'Vrai / faux', ar: 'صواب / خطأ' },
    { id: 'fill_blanks', fr: 'Texte à trous', ar: 'أكمل الفراغات' },
    { id: 'matching', fr: 'Relier', ar: 'أربط' },
    { id: 'ordering', fr: 'Remettre en ordre', ar: 'رتّب' },
    { id: 'table', fr: 'Tableau à compléter', ar: 'أكمل الجدول' },
    { id: 'column_calc', fr: 'Opération posée', ar: 'عملية عمودية' },
  ];

  /** Fixed mix (odd places, then even places reversed) so the order to find never shows as given. */
  mixedOrder(items: string[] | undefined): string[] {
    const list = items ?? [];
    if (list.length < 2) return list;
    const odd = list.filter((_, i) => i % 2 === 1);
    const even = list.filter((_, i) => i % 2 === 0).reverse();
    return [...odd, ...even];
  }

  /** "[[answer]]" cells are left blank for the pupil. */
  isBlankCell(cell: string): boolean {
    return /^\s*\[\[[^\]]*\]\]\s*$/.test(cell);
  }

  /** Digit columns for a worked calculation: every row right-aligned to the widest number. */
  calcLayout(b: EditorBlock): { rows: string[][]; resultCells: number[] } {
    const operands = (b.calcOperands ?? []).map((o) => o.replace(/\s+/g, ''));
    const width = Math.max(...operands.map((o) => o.length), (b.calcResult ?? '').length, 1);
    const pad = (s: string) => Array.from(s.padStart(width, ' '));
    return { rows: operands.map(pad), resultCells: Array.from({ length: width }, (_, i) => i) };
  }

  private restoreBlock(previous: EditorBlock) {
    this.blocks.update((list) => list.map((b) => (b.id === previous.id ? previous : b)));
  }

  toggleSolution(id: string) {
    this.blocks.update((list) =>
      list.map((b) => (b.id === id ? { ...b, showSolution: !b.showSolution } : b))
    );
  }

  onBlockDrop(event: CdkDragDrop<EditorBlock[]>) {
    if (event.previousIndex === event.currentIndex) return;
    this.blocks.update((list) => {
      const copy = [...list];
      moveItemInArray(copy, event.previousIndex, event.currentIndex);
      return copy;
    });
    this.activeInsertIndex.set(null);
  }

  moveBlockUp(idx: number) {
    if (idx <= 0) return;
    this.blocks.update((list) => {
      const copy = [...list];
      const temp = copy[idx - 1];
      copy[idx - 1] = copy[idx];
      copy[idx] = temp;
      return copy;
    });
  }

  moveBlockDown(idx: number) {
    if (idx >= this.blocks().length - 1) return;
    this.blocks.update((list) => {
      const copy = [...list];
      const temp = copy[idx + 1];
      copy[idx + 1] = copy[idx];
      copy[idx] = temp;
      return copy;
    });
  }

  duplicateBlock(idx: number) {
    const target = this.blocks()[idx];
    const cloned: EditorBlock = {
      ...target,
      id: 'b-' + Date.now(),
    };
    this.blocks.update((list) => {
      const copy = [...list];
      copy.splice(idx + 1, 0, cloned);
      return copy;
    });
  }

  deleteBlock(id: string) {
    this.blocks.update((list) => list.filter((b) => b.id !== id));
    if (this.selectedBlockId() === id) this.selectedBlockId.set(null);
  }

  onDocTitleInput(e: Event) {
    this.docTitle.set((e.target as HTMLInputElement).value);
  }

  readonly docTypeOptions: { value: DocumentType; icon: string; fr: string; ar: string; sub: string }[] = [
    { value: 'exam', icon: 'assignment', fr: 'Examen A4', ar: 'امتحان رسمي', sub: 'Évaluation / Examen' },
    { value: 'course', icon: 'menu_book', fr: 'Cours & Résumé', ar: 'درس وتلخيص', sub: 'Cours A4' },
    { value: 'exercise_sheet', icon: 'fact_check', fr: "Fiche d'Exercices", ar: 'تمارين تطبيقية', sub: 'Exercices' },
    { value: 'article', icon: 'article', fr: 'Article de Blog', ar: 'مقال توجيهي', sub: 'Blog pédagogique' },
  ];

  setDocType(t: DocumentType) {
    this.docType.set(t);
  }

  onDocTypeChange(e: Event) {
    this.docType.set((e.target as HTMLSelectElement).value as DocumentType);
  }

  readonly docSubjectOptions: { value: SubjectName; icon: string; fr: string; ar: string }[] = [
    { value: 'Mathématiques', icon: 'calculate', fr: 'Mathématiques', ar: 'الرياضيات' },
    { value: 'Français', icon: 'translate', fr: 'Français', ar: 'الفرنسية' },
    { value: 'اللغة العربية', icon: 'auto_stories', fr: 'Langue Arabe', ar: 'اللغة العربية' },
    { value: 'Éveil Scientifique', icon: 'science', fr: 'Éveil Scientifique', ar: 'الإيقاظ العلمي' },
    { value: 'Histoire & Géographie', icon: 'public', fr: 'Histoire-Géo', ar: 'التاريخ والجغرافيا' },
    { value: 'Anglais', icon: 'language', fr: 'Anglais', ar: 'الإنجليزية' },
  ];

  readonly docGradeOptions: { value: GradeLevel; icon: string; fr: string; ar: string }[] = [
    { value: '1ère Année', icon: 'looks_one', fr: '1ère Année', ar: 'الأولى ابتدائي' },
    { value: '2ème Année', icon: 'looks_two', fr: '2ème Année', ar: 'الثانية ابتدائي' },
    { value: '3ème Année', icon: 'looks_3', fr: '3ème Année', ar: 'الثالثة ابتدائي' },
    { value: '4ème Année', icon: 'looks_4', fr: '4ème Année', ar: 'الرابعة ابتدائي' },
    { value: '5ème Année', icon: 'looks_5', fr: '5ème Année', ar: 'الخامسة ابتدائي' },
    { value: '6ème Année', icon: 'looks_6', fr: '6ème Année', ar: 'السادسة (مناظرة)' },
  ];

  setDocSubject(s: SubjectName) {
    this.docSubject.set(s);
  }

  setDocGrade(g: GradeLevel) {
    this.docGrade.set(g);
  }

  onDocSubjectChange(e: Event) {
    this.docSubject.set((e.target as HTMLSelectElement).value as SubjectName);
  }

  onDocGradeChange(e: Event) {
    this.docGrade.set((e.target as HTMLSelectElement).value as GradeLevel);
  }

  onDocTrimesterChange(e: Event) {
    this.docTrimester.set((e.target as HTMLSelectElement).value as 'Trimestre 1' | 'Trimestre 2' | 'Trimestre 3');
  }

  onDocSchoolInput(e: Event) {
    this.docSchool.set((e.target as HTMLInputElement).value);
  }

  onChildNameInput(e: Event) {
    this.customChildName.set((e.target as HTMLInputElement).value);
  }

  onDocWatermarkInput(e: Event) {
    this.docWatermark.set((e.target as HTMLInputElement).value);
  }

  async handleBlockImageUpload(blockId: string, event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    this.imageUploadError.set('');

    if (!this.ALLOWED_IMAGE_TYPES.has(file.type)) {
      this.imageUploadError.set(this.lang.tr('Format non autorisé (PNG, JPG, WEBP).', 'صيغة غير مدعومة (PNG, JPG, WEBP).'));
      input.value = '';
      return;
    }
    if (file.size > this.MAX_IMAGE_BYTES) {
      this.imageUploadError.set(this.lang.tr('Image trop volumineuse (limite 15 Mo).', 'الصورة كبيرة جداً (الحد 15 ميغا).'));
      input.value = '';
      return;
    }

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      const base64Data = await base64Promise;

      const authHeaders = await this.firebase.getAuthHeaders();
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          kind: 'documents',
          uid: this.firebase.currentUser()?.uid,
          filename: file.name,
          base64Data,
          contentType: file.type,
        }),
      });
      const data = await res.json();
      if (data.success && data.url) {
        this.updateBlockField(blockId, 'imageUrl', data.url);
      } else {
        this.imageUploadError.set(data.error || this.lang.tr('Échec du téléversement.', 'فشل الرفع.'));
      }
    } catch (err) {
      console.error('Upload failed:', err);
      this.imageUploadError.set(this.lang.tr('Échec du téléversement. Réessayez.', 'فشل الرفع. حاول مجدداً.'));
    } finally {
      input.value = '';
    }
  }

  triggerPrintDialog() {
    if (typeof window !== 'undefined') {
      // Leave edit mode first: a block being edited prints as an empty input box.
      this.stopInlineEdit();
      this.selectedBlockId.set(null);
      setTimeout(() => window.print(), 60);
    }
  }

  openAiPromptModal() {
    this.aiModalOpen.set(true);
  }

  /** Copies a generated exercise onto a block; only fields the model returned are written. */
  private applyExercise(blockId: string, ex: AiJson, overrides: { title?: string; points?: number } = {}) {
    const title = overrides.title ?? ex['title'];
    if (title) this.updateBlockField(blockId, 'exerciseTitle', title);
    if (ex['promptText'] !== undefined) this.updateBlockContent(blockId, ex['promptText'] || '');
    if (ex['solutionText'] !== undefined) this.updateBlockField(blockId, 'exerciseSolution', ex['solutionText'] || '');
    const points = overrides.points ?? ex['points'];
    if (points) this.updateBlockField(blockId, 'exercisePoints', points);
    if (ex['parentGuide']) this.updateBlockField(blockId, 'parentGuide', ex['parentGuide']);
    if (ex['teacherNotes']) this.updateBlockField(blockId, 'teacherNotes', ex['teacherNotes']);
    if (ex['format']) this.updateBlockField(blockId, 'exerciseFormat', ex['format']);
    if (ex['qcmOptions']?.length) this.updateBlockField(blockId, 'qcmOptions', ex['qcmOptions']);
    if (typeof ex['qcmCorrectIndex'] === 'number') this.updateBlockField(blockId, 'qcmCorrectIndex', ex['qcmCorrectIndex']);
    if (ex['tfStatements']?.length) this.updateBlockField(blockId, 'tfStatements', ex['tfStatements']);
    if (ex['gapText']) this.updateBlockField(blockId, 'gapText', ex['gapText']);
    if (ex['matchingPairs']?.length) this.updateBlockField(blockId, 'matchingPairs', ex['matchingPairs']);
    if (ex['orderItems']?.length) this.updateBlockField(blockId, 'orderItems', ex['orderItems']);
    if (ex['tableHeaders']?.length) this.updateBlockField(blockId, 'tableHeaders', ex['tableHeaders']);
    if (ex['tableRows']?.length) this.updateBlockField(blockId, 'tableRows', ex['tableRows']);
    if (ex['calcOperands']?.length) this.updateBlockField(blockId, 'calcOperands', ex['calcOperands']);
    if (ex['calcOperator']) this.updateBlockField(blockId, 'calcOperator', ex['calcOperator']);
    if (ex['calcResult']) this.updateBlockField(blockId, 'calcResult', String(ex['calcResult']));
  }

  async generateWithGemini() {
    const prompt = this.aiPromptQuery().trim();
    const ok = this.session.validate([
      { id: 'ai-prompt-input', ok: !!prompt, message: this.lang.tr('Décrivez ce que vous voulez générer.', 'اكتب ما تريد توليده.') },
    ]);
    if (!ok || this.session.busy()) return;
    this.lastGeneration = () => this.generateWithGemini();
    await this.session.run(() => this.draftWithAi(prompt));
  }

  private async draftWithAi(prompt: string) {

    // Prose documents (blog / course / summary) draft a heading + paragraph;
    // exams and exercise sheets generate a graded exercise block.
    const isProse = this.docType() === 'article' || this.docType() === 'course' || this.docType() === 'summary';

    try {
      if (isProse) {
        const res = await this.ai.post('draft-announcement', {
          purpose: prompt,
          details: `${this.docSubject()} - ${this.docGrade()}`,
          targetAudience: `${this.docGrade()} — parents et élèves`,
          grade: this.docGrade(),
          subject: this.docSubject(),
          language: this.docLanguage(),
        });
        const ann = (res.ok ? res.data['announcement'] : undefined) as AiJson | undefined;
        if (ann) {
          this.addBlock('heading1');
          const heading = this.blocks()[this.blocks().length - 1];
          this.updateBlockContent(heading.id, ann['title'] || prompt);
          this.addBlock('paragraph');
          const para = this.blocks()[this.blocks().length - 1];
          this.updateBlockContent(para.id, ann['content'] || '');
          this.aiModalOpen.set(false);
          this.aiPromptQuery.set('');
          this.session.succeed();
        } else {
          this.session.fail(res.ok ? '' : res.error);
        }
      } else {
        const res = await this.ai.post('generate-exercise', {
          grade: this.docGrade(),
          subject: this.docSubject(),
          topic: prompt,
          difficulty: 'Moyen',
          format: 'free',
          trimester: this.docTrimester(),
          points: 5,
          language: this.docLanguage(),
          role: this.isParentMode() ? 'parent' : 'teacher',
          childName: this.activeChildName(),
        });
        const generated = res.ok ? (res.data['exercise'] as AiJson | undefined) : undefined;
        if (generated) {
          this.addBlock('exercise');
          const lastBlock = this.blocks()[this.blocks().length - 1];
          this.applyExercise(lastBlock.id, generated, { points: generated['points'] || 5 });
          this.aiModalOpen.set(false);
          this.aiPromptQuery.set('');
          this.session.succeed();
        } else {
          this.session.fail(res.ok ? '' : res.error);
        }
      }
    } catch (err) {
      this.session.fail(err instanceof Error ? err.message : '');
    }
  }

  async transformExercise(block: EditorBlock, transformType: 'tunisian_context' | 'simplify_vocab' | 'add_trap' | 'to_qcm') {
    if (this.isTransformingId()) return;
    this.isTransformingId.set(block.id);
    this.lastGeneration = () => this.transformExercise(block, transformType);

    try {
      const res = await this.session.run(() => this.ai.post('transform-exercise', {
        exercise: {
          title: block.exerciseTitle || 'Exercice',
          promptText: block.content || '',
          solutionText: block.exerciseSolution || '',
        },
        targetFormat: transformType === 'to_qcm' ? 'qcm' : 'free',
        transformType,
        grade: this.docGrade(),
        subject: this.docSubject(),
        language: this.docLanguage(),
      }));
      if (!res) return;
      const t = (res.ok ? res.data['exercise'] : undefined) as AiJson | undefined;
      if (!t) {
        this.session.fail(res.ok ? '' : res.error);
        return;
      }
      this.session.keepUndo(block);
      this.applyExercise(block.id, t);
      this.session.succeed();
    } finally {
      this.isTransformingId.set(null);
    }
  }

  async generateVariant(sourceBlock: EditorBlock) {
    if (this.isVariantLoading()) return;
    this.isVariantLoading.set(true);
    this.lastVariantBlockId.set(null);

    try {
      const res = await this.ai.post('variant', {
        exercise: {
          title: sourceBlock.exerciseTitle || 'Exercice',
          promptText: sourceBlock.content || '',
          solutionText: sourceBlock.exerciseSolution || '',
          format: sourceBlock.exerciseFormat || 'free',
        },
        variantType: 'context',
        grade: this.docGrade(),
        subject: this.docSubject(),
      });
      const v = (res.ok ? res.data['exercise'] : undefined) as AiJson | undefined;
      if (v) {
        this.addBlock('exercise');
        const newBlock = this.blocks()[this.blocks().length - 1];
        this.applyExercise(newBlock.id, v, {
          title: `${v['title']} (Variante IA ✨)`,
          points: v['points'] || sourceBlock.exercisePoints || 5,
        });
        this.lastVariantBlockId.set(sourceBlock.id);
      }
    } finally {
      this.isVariantLoading.set(false);
    }
  }

  setExerciseFormat(blockId: string, format: ExerciseFormat) {

    this.blocks.update((list) =>
      list.map((b) => {
        if (b.id !== blockId) return b;
        const updated: EditorBlock = { ...b, exerciseFormat: format };
        if (format === 'qcm' && (!updated.qcmOptions || updated.qcmOptions.length === 0)) {
          updated.qcmOptions = ['Option A', 'Option B', 'Option C'];
          updated.qcmCorrectIndex = 0;
        } else if (format === 'true_false' && (!updated.tfStatements || updated.tfStatements.length === 0)) {
          updated.tfStatements = [
            { text: 'Affirmation 1', answer: true },
            { text: 'Affirmation 2', answer: false },
          ];
        } else if (format === 'fill_blanks' && !updated.gapText) {
          updated.gapText = updated.content || 'Texte avec [[mot]] à cacher.';
        } else if (format === 'matching' && (!updated.matchingPairs || updated.matchingPairs.length === 0)) {
          updated.matchingPairs = [
            { left: 'Élément A', right: 'Correspondance 1' },
            { left: 'Élément B', right: 'Correspondance 2' },
          ];
        } else if (format === 'ordering' && !updated.orderItems?.length) {
          updated.orderItems = ['1', '2', '3', '4'];
        } else if (format === 'table' && !updated.tableHeaders?.length) {
          updated.tableHeaders = ['A', 'B'];
          updated.tableRows = [['…', '[[…]]'], ['…', '[[…]]']];
        } else if (format === 'column_calc' && !updated.calcOperands?.length) {
          updated.calcOperands = ['345', '278'];
          updated.calcOperator = '+';
          updated.calcResult = '623';
        }
        return updated;
      })
    );
  }

  updateQcmOption(blockId: string, idx: number, value: string) {
    this.blocks.update((list) =>
      list.map((b) => {
        if (b.id !== blockId) return b;
        const options = [...(b.qcmOptions || ['Option A', 'Option B'])];
        options[idx] = value;
        return { ...b, qcmOptions: options };
      })
    );
  }

  addQcmOption(blockId: string) {
    this.blocks.update((list) =>
      list.map((b) => {
        if (b.id !== blockId) return b;
        const options = [...(b.qcmOptions || ['Option A', 'Option B'])];
        if (options.length < 5) options.push(`Option ${this.getOptionLetter(options.length).toUpperCase()}`);
        return { ...b, qcmOptions: options };
      })
    );
  }

  removeQcmOption(blockId: string, idx: number) {
    this.blocks.update((list) =>
      list.map((b) => {
        if (b.id !== blockId) return b;
        const options = [...(b.qcmOptions || [])];
        if (options.length > 2) {
          options.splice(idx, 1);
          let correct = b.qcmCorrectIndex ?? 0;
          if (correct >= options.length) correct = options.length - 1;
          return { ...b, qcmOptions: options, qcmCorrectIndex: correct };
        }
        return b;
      })
    );
  }

  setQcmCorrect(blockId: string, idx: number) {
    this.updateBlockField(blockId, 'qcmCorrectIndex', idx);
  }

  updateTfStatement(blockId: string, idx: number, text: string) {
    this.blocks.update((list) =>
      list.map((b) => {
        if (b.id !== blockId) return b;
        const st = [...(b.tfStatements || [])];
        if (st[idx]) st[idx] = { ...st[idx], text };
        return { ...b, tfStatements: st };
      })
    );
  }

  toggleTfAnswer(blockId: string, idx: number) {
    this.blocks.update((list) =>
      list.map((b) => {
        if (b.id !== blockId) return b;
        const st = [...(b.tfStatements || [])];
        if (st[idx]) st[idx] = { ...st[idx], answer: !st[idx].answer };
        return { ...b, tfStatements: st };
      })
    );
  }

  addTfStatement(blockId: string) {
    this.blocks.update((list) =>
      list.map((b) => {
        if (b.id !== blockId) return b;
        const st = [...(b.tfStatements || [])];
        st.push({ text: `Affirmation ${st.length + 1}`, answer: true });
        return { ...b, tfStatements: st };
      })
    );
  }

  removeTfStatement(blockId: string, idx: number) {
    this.blocks.update((list) =>
      list.map((b) => {
        if (b.id !== blockId) return b;
        const st = [...(b.tfStatements || [])];
        if (st.length > 1) st.splice(idx, 1);
        return { ...b, tfStatements: st };
      })
    );
  }

  updateMatchingPair(blockId: string, idx: number, field: 'left' | 'right', val: string) {
    this.blocks.update((list) =>
      list.map((b) => {
        if (b.id !== blockId) return b;
        const pairs = [...(b.matchingPairs || [])];
        if (pairs[idx]) pairs[idx] = { ...pairs[idx], [field]: val };
        return { ...b, matchingPairs: pairs };
      })
    );
  }

  addMatchingPair(blockId: string) {
    this.blocks.update((list) =>
      list.map((b) => {
        if (b.id !== blockId) return b;
        const pairs = [...(b.matchingPairs || [])];
        pairs.push({ left: `Élément ${pairs.length + 1}`, right: `Correspondance ${pairs.length + 1}` });
        return { ...b, matchingPairs: pairs };
      })
    );
  }

  removeMatchingPair(blockId: string, idx: number) {
    this.blocks.update((list) =>
      list.map((b) => {
        if (b.id !== blockId) return b;
        const pairs = [...(b.matchingPairs || [])];
        if (pairs.length > 1) pairs.splice(idx, 1);
        return { ...b, matchingPairs: pairs };
      })
    );
  }

  getOptionLetter(idx: number): string {
    return String.fromCharCode(97 + idx);
  }

  renderGapTextPreview(text: string): string {
    if (!text) return '…';
    return text.replace(/\[\[(.*?)\]\]/g, (_match, word) => {
      const len = Math.max(8, word.length * 2);
      return '.'.repeat(len);
    });
  }

  extractGapWords(text: string): string[] {
    if (!text) return [];
    const matches = [...text.matchAll(/\[\[(.*?)\]\]/g)];
    return matches.map((m) => m[1]);
  }

  getShuffledMatchingRights(blockId: string, pairs?: { left: string; right: string }[]): string[] {
    if (!pairs || pairs.length === 0) return [];
    const rights = pairs.map((p) => p.right);
    let hash = 0;
    for (let i = 0; i < blockId.length; i++) {
      hash = (hash << 5) - hash + blockId.charCodeAt(i);
      hash |= 0;
    }
    const shuffled = [...rights];
    for (let i = shuffled.length - 1; i > 0; i--) {
      hash = (hash * 9301 + 49297) % 233280;
      const j = Math.floor((hash / 233280) * (i + 1));
      const temp = shuffled[i];
      shuffled[i] = shuffled[j];
      shuffled[j] = temp;
    }
    return shuffled;
  }

  getCompiledContentText(): string {
    return this.blocks()
      .map((b) => {
        if (b.type === 'exercise') {
          let details = `### ${b.exerciseTitle || 'Exercice'} (${b.exercisePoints || 5} pts)\n`;
          const fmt = b.exerciseFormat || 'free';
          if (fmt === 'free') {
            details += b.content;
          } else if (fmt === 'qcm') {
            if (b.content) details += `${b.content}\n`;
            (b.qcmOptions || []).forEach((opt, idx) => {
              const isCorrect = idx === (b.qcmCorrectIndex ?? 0);
              details += `[${isCorrect ? 'x' : ' '}] ${this.getOptionLetter(idx)}) ${opt}\n`;
            });
          } else if (fmt === 'true_false') {
            if (b.content) details += `${b.content}\n`;
            (b.tfStatements || []).forEach((st, idx) => {
              details += `${idx + 1}. ${st.text} (${st.answer ? 'Vrai' : 'Faux'})\n`;
            });
          } else if (fmt === 'fill_blanks') {
            const raw = b.gapText || b.content || '';
            details += raw.replace(/\[\[(.*?)\]\]/g, '___');
          } else if (fmt === 'matching') {
            if (b.content) details += `${b.content}\n`;
            (b.matchingPairs || []).forEach((pair) => {
              details += `${pair.left} ↔ ${pair.right}\n`;
            });
          }
          if (b.exerciseSolution) {
            details += `\nCorrigé : ${b.exerciseSolution}`;
          }
          return details;
        }
        if (b.type === 'callout') {
          return `> [!NOTE]\n> **${b.calloutTitle || 'Conseil'}**\n> ${b.content}`;
        }
        if (b.type === 'heading1') return `# ${b.content}`;
        if (b.type === 'heading2') return `## ${b.content}`;
        return b.content;
      })
      .join('\n\n');
  }

  /** Publishing puts the sheet in the library, so it needs an account (signup reopens the dialog). */
  openPublishModal() {
    this.store.requireAccount(() => this.publishModalOpen.set(true));
  }

  publishAsDocumentBank() {
    const content = this.getCompiledContentText();
    const user = this.firebase.userProfile();
    const authorName = user?.displayName || 'Enseignant Certifié';
    const authorId = user?.uid;
    const watermark = buildWatermark({
      customWatermark: user?.customWatermark || this.docWatermark(),
      authorName,
    });

    this.store.addCourse({
      title: this.docTitle(),
      subject: this.docSubject(),
      grade: this.docGrade(),
      trimester: this.docTrimester(),
      topicId: this.docTopicId(),
      schoolYear: this.docSchoolYear(),
      summary: `${this.docSubject()} - ${this.docGrade()} - Document préparé par ${authorName}.`,
      content,
      authorId,
      teacherName: authorName,
      watermarkText: watermark,
    });

    void this.notifService.emit({
      category: 'activity',
      type: 'new_doc',
      titleKey: 'notifNewDocTitle',
      messageKey: 'notifNewDocMsg',
      params: {
        title: this.docTitle(),
        subject: this.docSubject(),
        grade: this.docGrade(),
        author: authorName,
      },
      targetRole: 'parent',
      routeUrl: '/parent',
      icon: 'menu_book',
    });

    // Record publication in interaction journal for publicationsCount ledger
    this.interactionSvc.recordPublication(this.docTitle());

    this.publishModalOpen.set(false);
    this.store.setRole('teacher');
  }

  async publishAsBlogArticle() {
    const content = this.getCompiledContentText();
    const user = this.firebase.userProfile();
    const authorName = user?.displayName || 'Enseignant Certifié';
    const authorId = user?.uid;

    const post = await this.store.addBlogPost({
      title: this.docTitle(),
      excerpt: content.slice(0, 150) + '...',
      content,
      subject: this.docSubject(),
      grade: this.docGrade(),
      tags: [this.docSubject(), this.docGrade(), 'Pédagogie'],
      authorId,
      authorName: authorName,
      authorTitle: 'Enseignant Certifié',
      readTimeMinutes: Math.max(2, Math.ceil(content.split(' ').length / 180)),
    });

    void this.notifService.emit({
      category: 'activity',
      type: 'announcement',
      titleKey: 'notifBlogArticleTitle',
      messageKey: 'notifBlogArticleMsg',
      params: {
        title: this.docTitle(),
        author: authorName,
      },
      targetRole: 'all',
      routeUrl: '/blog',
      targetDocId: post?.id,
      icon: 'article',
    });

    // Record publication in interaction journal for publicationsCount ledger
    this.interactionSvc.recordPublication(this.docTitle());

    this.store.showToast(this.lang.t('toastPublished'), 'success');
    this.publishModalOpen.set(false);
    this.store.setRole('teacher');
  }

  exitStudio() {
    this.location.back();
  }
}

