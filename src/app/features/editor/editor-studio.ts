import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { CdkDragDrop, CdkDropList, CdkDrag, CdkDragHandle, CdkDragPlaceholder, moveItemInArray } from '@angular/cdk/drag-drop';
import { EducationStore, LanguageService, FirebaseService, GradeLevel, SubjectName, InteractionService } from '@core';
import { EditorBlock, EditorBlockType, DocumentType, ExerciseFormat, ExerciseDifficulty } from './editor.model';

@Component({
  selector: 'app-editor-studio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CdkDropList, CdkDrag, CdkDragHandle, CdkDragPlaceholder],
  templateUrl: './editor-studio.html',
  styleUrl: './editor-studio.css',
})
export class EditorStudioComponent {
  readonly store = inject(EducationStore);
  readonly lang = inject(LanguageService);
  readonly firebase = inject(FirebaseService);
  readonly interactionSvc = inject(InteractionService);
  private readonly location = inject(Location);

  readonly viewMode = signal<'editor' | 'split' | 'preview'>('preview');
  readonly showMetadataPanel = signal<boolean>(false);

  // Pro 3-pane: which pane is visible on mobile (desktop shows all three).
  readonly mobilePane = signal<'inspector' | 'canvas' | 'outline'>('canvas');
  // A4 print-margin guides toggle in the canvas toolbar.
  readonly showPrintMargins = signal<boolean>(true);

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
  readonly publishModalOpen = signal<boolean>(false);
  readonly aiModalOpen = signal<boolean>(false);
  readonly isAiLoading = signal<boolean>(false);
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
  readonly docSchoolYear = signal<string>('2025-2026');
  readonly docSchool = signal<string>('École Primaire Habib Bourguiba');
  readonly docWatermark = signal<string>('Madrasati TN — Document Certifié');

  // Dual-Mode Studio Signals (Teacher vs Parent - Idea 16)
  readonly isParentMode = computed(() => this.store.previousRole() === 'parent');
  readonly activeChildName = computed(() => this.store.activeStudent()?.name || 'Mon Enfant');
  readonly isTransformingId = signal<string | null>(null);

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
      const child = this.store.activeStudent();
      this.docWatermark.set(`Entraînement Maison — ${child?.name || 'Élève'}`);
      this.docTitle.set(`Fiche d'Entraînement — ${this.docSubject()}`);
      if (child?.grade) this.docGrade.set(child.grade as GradeLevel);
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
          if (Array.isArray(draft.blocks) && draft.blocks.length > 0) this.blocks.set(draft.blocks);
        } catch (e) {
          console.error('Failed to parse draft', e);
        }
      }
    }
  }

  loadTemplatePreset(type: 'exam_full' | 'course_summary' | 'exercise_sheet') {
    if (type === 'exam_full') {
      this.docType.set('exam');
      this.docTitle.set(`Évaluation Trimestrielle : ${this.docSubject()} (${this.docGrade()})`);
      this.blocks.set([
        { id: 'b-' + Date.now() + '-1', type: 'cartouche', content: '' },
        { id: 'b-' + Date.now() + '-2', type: 'heading1', content: 'I. Connaissances & Application' },
        { id: 'b-' + Date.now() + '-3', type: 'exercise', exerciseTitle: 'Exercice 1', exercisePoints: 8, content: 'Consigne et énoncé du premier exercice...', exerciseSolution: 'Corrigé type de l\'exercice 1...', showSolution: false },
        { id: 'b-' + Date.now() + '-4', type: 'heading1', content: 'II. Raisonnement & Résolution de Problème' },
        { id: 'b-' + Date.now() + '-5', type: 'exercise', exerciseTitle: 'Exercice 2 (Situation Problème)', exercisePoints: 12, content: 'Texte du problème avec mise en situation...', exerciseSolution: 'Solution détaillée et étapes de calcul...', showSolution: false },
      ]);
    } else if (type === 'course_summary') {
      this.docType.set('course');
      this.docTitle.set(`Fiche de Synthèse : ${this.docSubject()} (${this.docGrade()})`);
      this.blocks.set([
        { id: 'b-' + Date.now() + '-1', type: 'heading1', content: 'Objectifs d\'apprentissage' },
        { id: 'b-' + Date.now() + '-2', type: 'paragraph', content: 'Ce résumé regroupe les notions clés et les règles essentielles du programme officiel.' },
        { id: 'b-' + Date.now() + '-3', type: 'callout', calloutTitle: 'Règle Fondamentale', content: 'Définition ou formule à retenir par cœur.' },
        { id: 'b-' + Date.now() + '-4', type: 'exercise', exerciseTitle: 'Exemple d\'Application', exercisePoints: 5, content: 'Application directe de la règle...', exerciseSolution: 'Corrigé explicatif...', showSolution: true },
      ]);
    } else if (type === 'exercise_sheet') {
      this.docType.set('exercise_sheet');
      this.docTitle.set(`Série d'Entraînement : ${this.docSubject()} (${this.docGrade()})`);
      this.blocks.set([
        { id: 'b-' + Date.now() + '-1', type: 'heading1', content: 'Série d\'Exercices Pratiques' },
        { id: 'b-' + Date.now() + '-2', type: 'exercise', exerciseTitle: 'Exercice 1 : Entraînement de base', exercisePoints: 10, content: 'Exercices d\'assimilation rapide...', showSolution: false },
        { id: 'b-' + Date.now() + '-3', type: 'exercise', exerciseTitle: 'Exercice 2 : Approfondissement', exercisePoints: 10, content: 'Questions d\'analyse et de réflexion...', showSolution: false },
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
      window.print();
    }
  }

  openAiPromptModal() {
    this.aiModalOpen.set(true);
  }

  async generateWithGemini() {
    const prompt = this.aiPromptQuery();
    if (!prompt) return;
    this.isAiLoading.set(true);

    // Prose documents (blog / course / summary) draft a heading + paragraph;
    // exams and exercise sheets generate a graded exercise block.
    const isProse = this.docType() === 'article' || this.docType() === 'course' || this.docType() === 'summary';

    try {
      if (isProse) {
        const res = await fetch('/api/ai/draft-announcement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            purpose: prompt,
            details: `${this.docSubject()} - ${this.docGrade()}`,
            targetAudience: `${this.docGrade()} — parents et élèves`,
          }),
        });
        const data = await res.json();
        if (data.success && data.result) {
          this.addBlock('heading1');
          const heading = this.blocks()[this.blocks().length - 1];
          this.updateBlockContent(heading.id, data.result.title || prompt);
          this.addBlock('paragraph');
          const para = this.blocks()[this.blocks().length - 1];
          this.updateBlockContent(para.id, data.result.content || '');
          this.aiModalOpen.set(false);
          this.aiPromptQuery.set('');
        }
      } else {
        const res = await fetch('/api/ai/generate-exercise', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            grade: this.docGrade(),
            subject: this.docSubject(),
            topic: prompt,
            difficulty: 'Moyen',
            role: this.isParentMode() ? 'parent' : 'teacher',
            childName: this.activeChildName(),
          }),
        });
        const data = await res.json();
        if (data.success && data.exercise) {
          const generated = data.exercise;
          this.addBlock('exercise');
          const lastBlock = this.blocks()[this.blocks().length - 1];
          this.updateBlockField(lastBlock.id, 'exerciseTitle', generated.title);
          this.updateBlockContent(lastBlock.id, generated.promptText || '');
          this.updateBlockField(lastBlock.id, 'exerciseSolution', generated.solutionText || '');
          this.updateBlockField(lastBlock.id, 'exercisePoints', generated.points || 5);
          if (generated.parentGuide) this.updateBlockField(lastBlock.id, 'parentGuide', generated.parentGuide);
          if (generated.teacherNotes) this.updateBlockField(lastBlock.id, 'teacherNotes', generated.teacherNotes);
          if (generated.format) this.updateBlockField(lastBlock.id, 'exerciseFormat', generated.format);
          if (generated.qcmOptions) this.updateBlockField(lastBlock.id, 'qcmOptions', generated.qcmOptions);
          if (typeof generated.qcmCorrectIndex === 'number') this.updateBlockField(lastBlock.id, 'qcmCorrectIndex', generated.qcmCorrectIndex);
          if (generated.tfStatements) this.updateBlockField(lastBlock.id, 'tfStatements', generated.tfStatements);
          if (generated.gapText) this.updateBlockField(lastBlock.id, 'gapText', generated.gapText);
          if (generated.matchingPairs) this.updateBlockField(lastBlock.id, 'matchingPairs', generated.matchingPairs);
          this.aiModalOpen.set(false);
          this.aiPromptQuery.set('');
        }
      }
    } catch (err) {
      console.error('AI generation error:', err);
    } finally {
      this.isAiLoading.set(false);
    }
  }

  async transformExercise(block: EditorBlock, transformType: 'tunisian_context' | 'simplify_vocab' | 'add_trap' | 'to_qcm') {
    if (this.isTransformingId()) return;
    this.isTransformingId.set(block.id);

    try {
      const res = await fetch('/api/ai/transform-exercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalBlock: block,
          transformType,
          grade: this.docGrade(),
          subject: this.docSubject(),
        }),
      });
      const data = await res.json();

      if (data.success && data.transformed) {
        const t = data.transformed;
        if (t.title) this.updateBlockField(block.id, 'exerciseTitle', t.title);
        if (t.promptText) this.updateBlockContent(block.id, t.promptText);
        if (t.solutionText) this.updateBlockField(block.id, 'exerciseSolution', t.solutionText);
        if (t.format) this.updateBlockField(block.id, 'exerciseFormat', t.format);
        if (t.qcmOptions?.length) this.updateBlockField(block.id, 'qcmOptions', t.qcmOptions);
        if (typeof t.qcmCorrectIndex === 'number') this.updateBlockField(block.id, 'qcmCorrectIndex', t.qcmCorrectIndex);
        if (t.tfStatements?.length) this.updateBlockField(block.id, 'tfStatements', t.tfStatements);
        if (t.gapText) this.updateBlockField(block.id, 'gapText', t.gapText);
        if (t.matchingPairs?.length) this.updateBlockField(block.id, 'matchingPairs', t.matchingPairs);
      }
    } catch (err) {
      console.error('Transform exercise error:', err);
    } finally {
      this.isTransformingId.set(null);
    }
  }

  async generateVariant(sourceBlock: EditorBlock) {
    if (this.isVariantLoading()) return;
    this.isVariantLoading.set(true);
    this.lastVariantBlockId.set(null);

    try {
      const res = await fetch('/api/ai/variant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade: this.docGrade(),
          subject: this.docSubject(),
          topic: sourceBlock.exerciseTitle || '',
          format: sourceBlock.exerciseFormat || 'free',
          originalPromptText: sourceBlock.content || '',
          role: 'teacher',
        }),
      });
      const data = await res.json();

      if (data.success && data.variant) {
        const v = data.variant;
        this.addBlock('exercise');
        const newBlock = this.blocks()[this.blocks().length - 1];
        this.updateBlockField(newBlock.id, 'exerciseTitle', `${v.title} (Variante IA ✨)`);
        this.updateBlockContent(newBlock.id, v.promptText || '');
        this.updateBlockField(newBlock.id, 'exerciseSolution', v.solutionText || '');
        this.updateBlockField(newBlock.id, 'exercisePoints', v.points || sourceBlock.exercisePoints || 5);
        if (v.format) this.updateBlockField(newBlock.id, 'exerciseFormat', v.format);
        if (v.qcmOptions?.length) this.updateBlockField(newBlock.id, 'qcmOptions', v.qcmOptions);
        if (typeof v.qcmCorrectIndex === 'number') this.updateBlockField(newBlock.id, 'qcmCorrectIndex', v.qcmCorrectIndex);
        if (v.tfStatements?.length) this.updateBlockField(newBlock.id, 'tfStatements', v.tfStatements);
        if (v.gapText) this.updateBlockField(newBlock.id, 'gapText', v.gapText);
        if (v.matchingPairs?.length) this.updateBlockField(newBlock.id, 'matchingPairs', v.matchingPairs);
        this.lastVariantBlockId.set(sourceBlock.id);
      }
    } catch (err) {
      console.error('Variant generation error:', err);
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

  publishAsDocumentBank() {
    const content = this.getCompiledContentText();
    this.store.addCourse({
      title: this.docTitle(),
      subject: this.docSubject(),
      grade: this.docGrade(),
      trimester: this.docTrimester(),
      schoolYear: this.docSchoolYear(),
      summary: `${this.docSubject()} - ${this.docGrade()} - Document préparé avec l'en-tête officiel républicain.`,
      content,
      watermarkText: this.docWatermark(),
    });

    this.firebase.addNotification({
      type: 'new_doc',
      title: `Nouveau document : ${this.docTitle()}`,
      message: `${this.docSubject()} (${this.docGrade()}) - Prêt pour impression A4 et téléchargement.`,
      linkRole: 'parent',
      icon: 'menu_book',
    });

    // Bug 2 fix: record publication in interaction journal for publicationsCount ledger
    this.interactionSvc.recordPublication(this.docTitle());

    this.publishModalOpen.set(false);
    this.store.setRole('teacher');
  }

  publishAsBlogArticle() {
    const content = this.getCompiledContentText();
    this.store.addBlogPost({
      title: this.docTitle(),
      excerpt: content.slice(0, 150) + '...',
      content,
      subject: this.docSubject(),
      grade: this.docGrade(),
      tags: [this.docSubject(), this.docGrade(), 'Pédagogie'],
      authorName: this.firebase.userProfile()?.displayName || 'Enseignant Certifié',
      authorTitle: 'Enseignant Certifié',
      readTimeMinutes: Math.max(2, Math.ceil(content.split(' ').length / 180)),
    });

    this.firebase.addNotification({
      type: 'announcement',
      title: `Nouvel article pédagogique : ${this.docTitle()}`,
      message: `Publié par ${this.firebase.userProfile()?.displayName || 'un enseignant certifié'}.`,
      linkRole: 'teacher',
      icon: 'article',
    });

    // Bug 2 fix: record publication in interaction journal for publicationsCount ledger
    this.interactionSvc.recordPublication(this.docTitle());

    this.publishModalOpen.set(false);
    this.store.setRole('teacher');
  }

  exitStudio() {
    this.location.back();
  }
}

