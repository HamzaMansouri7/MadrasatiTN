import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  ElementRef,
  ViewChild,
  OnDestroy,
  afterNextRender,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser, Location } from '@angular/common';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import {
  EducationStore,
  LanguageService,
  FirebaseService,
  NotificationService,
  InteractionService,
  TUNISIAN_CURRICULUM_CHAPTERS,
  CurriculumChapter,
  BlogPost,
} from '@core';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ArticleDraft {
  title: string;
  summary: string;
  subject: string;
  grade: string;
  chapter?: string;
  coverImageUrl?: string;
  contentMarkdown: string;
}

@Component({
  selector: 'app-article-studio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './article-studio.html',
  styleUrl: './article-studio.css',
})
export class ArticleStudioComponent implements OnDestroy {
  @ViewChild('tiptapContainer') tiptapContainerRef?: ElementRef<HTMLDivElement>;

  private readonly platformId = inject(PLATFORM_ID);
  readonly store = inject(EducationStore);
  readonly lang = inject(LanguageService);
  readonly firebase = inject(FirebaseService);
  readonly notifService = inject(NotificationService);
  readonly interactionSvc = inject(InteractionService);
  private readonly location = inject(Location);

  tiptapEditor: Editor | null = null;

  readonly isSaved = signal<boolean>(true);
  readonly isLoading = signal<boolean>(false);
  readonly isGeneratingImg = signal<boolean>(false);
  readonly isUploadingImg = signal<boolean>(false);
  readonly isDirectEditing = signal<boolean>(false);
  readonly userInput = signal<string>('');
  readonly editingPostId = signal<string | null>(null);

  readonly publishButtonLabel = computed(() =>
    this.editingPostId()
      ? this.lang.tr("Mettre à jour l'article", 'تحديث المقال')
      : this.lang.tr('Publier sur le Blog', 'نشر على المدونة')
  );

  readonly messages = signal<ChatMessage[]>([]);

  // Curriculum Grounding Selectors
  readonly selectedGrade = signal<string>('4ème Année');
  readonly selectedSubject = signal<string>('Mathématiques');
  readonly selectedChapterId = signal<string>('math-4-ch1');

  readonly mode = signal<'curriculum' | 'free'>('curriculum');
  readonly customTags = signal<string[]>(['نصائح_للأولياء', 'التوجيه_التربوي']);
  readonly newTagInput = signal<string>('');

  readonly quickPresetTags = [
    { ar: 'نصائح_للأولياء', fr: 'Conseils_Parents' },
    { ar: 'التربية_الإيجابية', fr: 'Éducation_Positive' },
    { ar: 'تنظيم_الوقت', fr: 'Gestion_du_Temps' },
    { ar: 'صعوبات_التعلم', fr: 'Difficultés_Apprentissage' },
    { ar: 'الصحة_المدرسية', fr: 'Santé_Scolaire' },
    { ar: 'التحفيز_الدراسي', fr: 'Motivation_Scolaire' },
    { ar: 'المطالعة_الحرة', fr: 'Lecture_Autonome' },
    { ar: 'التواصل_المدرسي', fr: 'Communication_École' },
  ];

  readonly isFreeTopic = computed(() => {
    return (
      this.mode() === 'free' ||
      this.selectedGrade() === 'all' ||
      this.selectedSubject() === 'general' ||
      this.selectedChapterId() === 'free'
    );
  });

  readonly gradesList = [
    { id: 'all', labelAr: '🌐 جميع المستويات (نصائح عامة)', labelFr: '🌐 Tous niveaux (Conseils généraux)' },
    { id: '1ère Année', labelAr: 'السنة الأولى', labelFr: '1ère Année' },
    { id: '2ème Année', labelAr: 'السنة الثانية', labelFr: '2ème Année' },
    { id: '3ème Année', labelAr: 'السنة الثالثة', labelFr: '3ème Année' },
    { id: '4ème Année', labelAr: 'السنة الرابعة', labelFr: '4ème Année' },
    { id: '5ème Année', labelAr: 'السنة الخامسة', labelFr: '5ème Année' },
    { id: '6ème Année', labelAr: 'السنة السادسة (مناظرة)', labelFr: '6ème Année (Concours)' },
  ];

  readonly subjectsList = [
    { id: 'general', labelAr: '💡 بيداغوجيا وتوجيه تربوي عام', labelFr: '💡 Pédagogie & Conseils éducatifs' },
    { id: 'Mathématiques', labelAr: 'الرياضيات', labelFr: 'Mathématiques' },
    { id: 'اللغة العربية', labelAr: 'اللغة العربية', labelFr: 'Langue Arabe' },
    { id: 'Français', labelAr: 'الفرنسية', labelFr: 'Français' },
    { id: 'Éveil Scientifique', labelAr: 'الإيقاظ العلمي', labelFr: 'Éveil Scientifique' },
    { id: 'Histoire & Géographie', labelAr: 'التاريخ والجغرافيا', labelFr: 'Histoire & Géo' },
    { id: 'Éducation Islamique', labelAr: 'التربية الإسلامية', labelFr: 'Éducation Islamique' },
    { id: 'Anglais', labelAr: 'الإنجليزية', labelFr: 'Anglais' },
  ];

  readonly availableChapters = computed<CurriculumChapter[]>(() => {
    const gr = this.selectedGrade();
    const sb = this.selectedSubject();
    if (gr === 'all' || sb === 'general') return [];
    return TUNISIAN_CURRICULUM_CHAPTERS.filter((c) => c.grade === gr && c.subject === sb);
  });

  readonly activeChapterObj = computed<CurriculumChapter | undefined>(() => {
    if (this.isFreeTopic()) return undefined;
    return this.availableChapters().find((c) => c.id === this.selectedChapterId()) || this.availableChapters()[0];
  });

  readonly article = signal<ArticleDraft>({
    title: '',
    summary: '',
    subject: 'Mathématiques',
    grade: '4ème Année',
    chapter: 'الأعداد ذات 5 و 6 أرقام: القراءة والكتابة والتفكيك والترتيب',
    coverImageUrl: '',
    contentMarkdown: '',
  });

  readonly suggestedChips = signal<string[]>([]);

  private getArticleDraftStorageKey(): string {
    const uid = this.firebase.userProfile()?.uid || 'guest';
    return `madrasati_article_draft_${uid}`;
  }

  constructor() {
    const editing = this.store.editingBlogPost();
    if (editing) {
      this.editingPostId.set(editing.id);
      this.article.set({
        title: editing.title,
        summary: editing.excerpt,
        subject: editing.subject || 'Mathématiques',
        grade: editing.grade || '4ème Année',
        chapter: editing.chapter || '',
        coverImageUrl: editing.coverImage || '',
        contentMarkdown: editing.content,
      });
      if (editing.tags && editing.tags.length > 0) {
        this.customTags.set([...editing.tags]);
      }
      if (editing.grade) this.selectedGrade.set(editing.grade);
      if (editing.subject) this.selectedSubject.set(editing.subject);
    } else if (typeof localStorage !== 'undefined') {
      const userKey = this.getArticleDraftStorageKey();
      const raw = localStorage.getItem(userKey) || localStorage.getItem('madrasati_article_draft');
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            this.article.set({ ...this.article(), ...parsed });
          }
        } catch {
          // ignore invalid draft
        }
      }
    }

    afterNextRender(() => {
      if (isPlatformBrowser(this.platformId) && this.tiptapContainerRef?.nativeElement) {
        this.initTipTap();
      }
    });

    effect(() => {
      const isAr = this.lang.isArabic();
      const ch = this.activeChapterObj();

      // Initialize first message if empty
      if (this.messages().length === 0) {
        this.messages.set([
          {
            role: 'assistant',
            content: isAr
              ? 'مرحباً بك زميلي المربي ! أنا مساعدك البيداغوجي الذكي. حدد من الشريط أعلاه المادة والمحور الرسمي الذي ترغب في معالجته، وسأقترح عليك خططاً تعليمية وصياغات ملهمة مطابقة للبرنامج التونسي.'
              : 'Bonjour ! Je suis votre co-pilote de rédaction pédagogique. Sélectionnez ci-dessus la matière et le chapitre officiel à traiter pour générer des conseils et contenus parfaitement alignés sur les programmes tunisiens.',
          },
        ]);
      }

      // Update chips from active chapter or fallback
      if (ch) {
        this.suggestedChips.set(isAr ? ch.suggestedPromptsAr : ch.suggestedPromptsFr);
      } else {
        this.suggestedChips.set(
          isAr
            ? [
                'كيفية تجاوز تعثر التلاميذ في الحساب الذهني (السنوات 3 و 4)',
                '3 نصائح عملية لمساعدة الولي على تدريب طفله على الإملاء',
                'خطة بيداغوجية لمراجعة دروس الثلاثي الأول بدون ضغط',
              ]
            : [
                'Comment surmonter le blocage en calcul mental (3ème/4ème)',
                '3 Astuces pour aider son enfant en dictée',
                'Conseils pratiques pour la révision du Trimestre 1',
              ]
        );
      }
    });
  }

  initTipTap() {
    if (this.tiptapEditor || !this.tiptapContainerRef?.nativeElement) return;
    this.tiptapEditor = new Editor({
      element: this.tiptapContainerRef.nativeElement,
      extensions: [
        StarterKit.configure({
          heading: { levels: [2, 3] },
        }),
        Image.configure({
          inline: false,
          allowBase64: true,
          HTMLAttributes: {
            class: 'rounded-2xl max-w-full my-4 border border-[#E3ECF2] shadow-sm',
          },
        }),
        Placeholder.configure({
          placeholder: () =>
            this.lang.isArabic()
              ? 'ابدأ بكتابة مقالك هنا... يمكنك إدراج صور من شريط الأدوات أو سحبها مباشرة إلى المحرر 🖼️'
              : 'Rédigez votre article ici... Insérez des images depuis la barre d’outils ou glissez-les directement 🖼️',
        }),
      ],
      content: this.article().contentMarkdown ? this.parseSimpleMarkdown(this.article().contentMarkdown) : '',
      editorProps: {
        attributes: {
          class: 'prose max-w-none outline-none min-h-[460px] leading-relaxed',
          dir: 'auto',
        },
      },
      onUpdate: ({ editor }) => {
        const html = editor.getHTML();
        this.article.update((a) => ({ ...a, contentMarkdown: html }));
        this.isSaved.set(false);
      },
    });
  }

  toggleBold() {
    this.tiptapEditor?.chain().focus().toggleBold().run();
  }

  toggleItalic() {
    this.tiptapEditor?.chain().focus().toggleItalic().run();
  }

  toggleHeading(level: 2 | 3) {
    this.tiptapEditor?.chain().focus().toggleHeading({ level }).run();
  }

  toggleBulletList() {
    this.tiptapEditor?.chain().focus().toggleBulletList().run();
  }

  toggleOrderedList() {
    this.tiptapEditor?.chain().focus().toggleOrderedList().run();
  }

  toggleBlockquote() {
    this.tiptapEditor?.chain().focus().toggleBlockquote().run();
  }

  insertInlineImage(url: string) {
    if (!url || !this.tiptapEditor) return;
    this.tiptapEditor.chain().focus().setImage({ src: url }).run();
  }

  async handleInlineImageUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = (reader.result as string).split(',')[1];
      this.isUploadingImg.set(true);
      try {
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
        if (data.url) {
          this.insertInlineImage(data.url);
        }
      } catch (err) {
        console.error('Image upload failed', err);
      } finally {
        this.isUploadingImg.set(false);
      }
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  ngOnDestroy() {
    this.tiptapEditor?.destroy();
    // Clear edit context so a later "new article" open doesn't inherit a stale post.
    this.store.editingBlogPost.set(null);
  }

  onGradeChange(grade: string) {
    this.selectedGrade.set(grade);
    this.article.update((a) => ({ ...a, grade }));
    this.syncChapterSelection();
  }

  onSubjectChange(subject: string) {
    this.selectedSubject.set(subject);
    this.article.update((a) => ({ ...a, subject }));
    this.syncChapterSelection();
  }

  onChapterChange(chapterId: string) {
    this.selectedChapterId.set(chapterId);
    if (chapterId === 'free') {
      const isAr = this.lang.isArabic();
      this.article.update((a) => ({
        ...a,
        chapter: isAr ? 'مقال حر / نصائح عامة' : 'Article libre / Conseils généraux',
      }));
      return;
    }
    const ch = this.availableChapters().find((c) => c.id === chapterId);
    if (ch) {
      const isAr = this.lang.isArabic();
      const chTitle = isAr ? ch.titleAr : ch.titleFr;
      this.article.update((a) => ({ ...a, chapter: chTitle }));
      this.suggestedChips.set(isAr ? ch.suggestedPromptsAr : ch.suggestedPromptsFr);
    }
  }

  private syncChapterSelection() {
    if (this.isFreeTopic()) {
      this.selectedChapterId.set('free');
      const isAr = this.lang.isArabic();
      this.article.update((a) => ({
        ...a,
        chapter: isAr ? 'مقال حر / نصائح عامة' : 'Article libre / Conseils généraux',
      }));
      this.suggestedChips.set(
        isAr
          ? [
              '3 نصائح لمساعدة الأولياء على تنظيم وقت أبنائهم في المنزل',
              'كيفية التعامل مع التلميذ الخجول أو المتردد في الفصل',
              'خطوات عملية لغرس حب المطالعة والقراءة لدى أطفال الابتدائي',
              'خطة أسبوعية لتجاوز صعوبات التعلم دون توتر عائلي',
            ]
          : [
              '3 Conseils pour aider les parents à structurer le temps à la maison',
              'Comment accompagner un enfant timide ou anxieux en classe',
              'Étapes pratiques pour donner le goût de la lecture aux élèves',
              'Méthodes bienveillantes pour surmonter les blocages scolaires',
            ]
      );
      return;
    }

    const list = this.availableChapters();
    if (list.length > 0) {
      this.onChapterChange(list[0].id);
    } else {
      this.selectedChapterId.set('');
      this.article.update((a) => ({ ...a, chapter: '' }));
    }
  }

  setMode(m: 'curriculum' | 'free') {
    this.mode.set(m);
    const isAr = this.lang.isArabic();
    if (m === 'free') {
      this.article.update((a) => ({
        ...a,
        chapter: isAr ? 'تدوينة حرة وتوجيه تربوي' : 'Article libre & Orientation éducative',
      }));
      this.suggestedChips.set(
        isAr
          ? [
              'نصائح ذهبية للأولياء لتنظيم أوقات المذاكرة المنزلية',
              'كيفية تشجيع الطفل على المطالعة الحرة وبناء الشغف المعرفي',
              'طرق التغلب على القلق الامتحاني وصعوبات التعلم لدى الناشئة',
            ]
          : [
              'Conseils aux parents pour organiser le travail et le sommeil',
              'Développer le plaisir de la lecture autonome chez l’enfant',
              'Surmonter l’anxiété scolaire et motiver les élèves',
            ]
      );
    } else {
      const ch = this.activeChapterObj();
      if (ch) {
        this.article.update((a) => ({ ...a, chapter: isAr ? ch.titleAr : ch.titleFr }));
        this.suggestedChips.set(isAr ? ch.suggestedPromptsAr : ch.suggestedPromptsFr);
      }
    }
  }

  addTag(rawTag?: string) {
    const tag = (rawTag !== undefined ? rawTag : this.newTagInput()).trim().replace(/^#/, '');
    if (!tag) return;
    if (!this.customTags().includes(tag)) {
      this.customTags.update((tags) => [...tags, tag]);
    }
    this.newTagInput.set('');
  }

  removeTag(tag: string) {
    this.customTags.update((tags) => tags.filter((t) => t !== tag));
  }

  toggleQuickTag(tag: string) {
    if (this.customTags().includes(tag)) {
      this.removeTag(tag);
    } else {
      this.addTag(tag);
    }
  }

  onTagKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      this.addTag();
    }
  }

  readonly authorName = computed(() => {
    return this.firebase.userProfile()?.displayName || (this.lang.isArabic() ? 'مربٍ معتمد' : 'Enseignant Certifié');
  });

  readonly estimatedReadingTime = computed(() => {
    const text = this.article().contentMarkdown || '';
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(wordCount / 180));
  });

  readonly renderedArticleHtml = computed(() => {
    const md = this.article().contentMarkdown || '';
    return this.parseSimpleMarkdown(md);
  });

  onEnterPress(event: Event) {
    const keyEvent = event as KeyboardEvent;
    if (!keyEvent.shiftKey) {
      keyEvent.preventDefault();
      this.sendMessage();
    }
  }

  async sendMessage() {
    const text = this.userInput().trim();
    if (!text || this.isLoading()) return;

    this.userInput.set('');
    this.messages.update((msgs) => [...msgs, { role: 'user', content: text }]);
    this.isLoading.set(true);
    this.isSaved.set(false);

    try {
      const res = await fetch('/api/ai/chat-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: this.messages(),
          currentArticle: this.article(),
          userPrompt: text,
          language: this.lang.lang(),
          isFreeTopic: this.isFreeTopic(),
          tags: this.customTags(),
          chapter: this.activeChapterObj()
            ? (this.lang.isArabic() ? this.activeChapterObj()!.titleAr : this.activeChapterObj()!.titleFr)
            : (this.article().chapter || ''),
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (data.replyText) {
          this.messages.update((msgs) => [...msgs, { role: 'assistant', content: data.replyText }]);
        }
        if (data.updatedArticle) {
          this.article.update((art) => ({
            ...art,
            ...data.updatedArticle,
          }));
          if (this.tiptapEditor && data.updatedArticle.contentMarkdown) {
            const html = this.parseSimpleMarkdown(data.updatedArticle.contentMarkdown);
            this.tiptapEditor.commands.setContent(html);
          }
        }
        if (data.suggestedChips && Array.isArray(data.suggestedChips)) {
          this.suggestedChips.set(data.suggestedChips);
        }
      } else {
        this.messages.update((msgs) => [
          ...msgs,
          {
            role: 'assistant',
            content: this.lang.tr(
              'Désolé, une erreur est survenue lors de la rédaction. Veuillez réessayer.',
              'عذراً، حدث خطأ أثناء صياغة المقال. يرجى إعادة المحاولة.'
            ),
          },
        ]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      this.messages.update((msgs) => [
        ...msgs,
        {
          role: 'assistant',
          content: this.lang.tr(
            'Impossible de joindre le serveur IA actuellement.',
            'تعذر الاتصال بخادم الذكاء الاصطناعي حالياً.'
          ),
        },
      ]);
    } finally {
      this.isLoading.set(false);
      this.isSaved.set(true);
    }
  }

  sendQuickPrompt(chip: string) {
    this.userInput.set(chip);
    this.sendMessage();
  }

  async generateAiCover() {
    const topic = this.article().title || 'Illustration pédagogique pour l’école primaire tunisienne';
    this.isGeneratingImg.set(true);
    try {
      const res = await fetch('/api/ai/generate-illustration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptText: topic }),
      });
      const data = await res.json();
      if (data.success && data.imageUrl) {
        this.article.update((a) => ({ ...a, coverImageUrl: data.imageUrl }));
        this.messages.update((m) => [
          ...m,
          { role: 'assistant', content: '🎨 J’ai généré et appliqué une illustration pour votre article !' },
        ]);
      }
    } catch (err) {
      console.error('Image gen error:', err);
    } finally {
      this.isGeneratingImg.set(false);
    }
  }

  async handleImageAttachment(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = (reader.result as string).split(',')[1];
      this.isUploadingImg.set(true);
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            mimeType: file.type,
            base64Data,
          }),
        });
        const data = await res.json();
        if (data.success && data.url) {
          this.article.update((a) => ({ ...a, coverImageUrl: data.url }));
          this.messages.update((m) => [
            ...m,
            { role: 'assistant', content: `🖼️ Image jointe avec succès (${file.name}) et définie comme illustration.` },
          ]);
        }
      } catch (err) {
        console.error('Upload error:', err);
      } finally {
        this.isUploadingImg.set(false);
      }
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  removeCoverImage() {
    this.article.update((a) => ({ ...a, coverImageUrl: '' }));
  }

  resetConversation() {
    this.messages.set([
      {
        role: 'assistant',
        content: 'Conversation réinitialisée. Quel sujet souhaitez-vous aborder pour votre prochain article ?',
      },
    ]);
  }

  saveDraft() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.getArticleDraftStorageKey(), JSON.stringify(this.article()));
    }
    this.isSaved.set(true);
    this.store.showToast(this.lang.t('toastDraftSaved'), 'info');
  }

  updateArticleContent(val: string) {
    this.article.update((a) => ({ ...a, contentMarkdown: val }));
    this.isSaved.set(false);
  }

  updateArticleTitle(val: string) {
    this.article.update((a) => ({ ...a, title: val }));
    this.isSaved.set(false);
  }

  toggleDirectEdit() {
    this.isDirectEditing.update((v) => !v);
  }

  async publishArticle() {
    const art = this.article();
    const content = art.contentMarkdown || 'Article en cours de rédaction';
    const title = art.title || 'Article Pédagogique Sans Titre';

    const isAr = this.lang.isArabic();
    const tags = this.isFreeTopic()
      ? (this.customTags().length > 0 ? this.customTags() : [isAr ? 'نصائح_تربوية' : 'Conseils'])
      : [art.subject, art.grade, ...this.customTags()];

    const chapterLabel = this.isFreeTopic()
      ? (this.customTags().length > 0 ? '#' + this.customTags().join(' #') : (isAr ? 'مقال حر وتوجيه تربوي' : 'Conseils & Pédagogie libre'))
      : art.chapter;

    // Strip raw HTML tags and Markdown symbols for clean plain-text excerpt
    const stripFormatting = (raw: string) =>
      raw
        .replace(/<[^>]*>/g, '')
        .replace(/^[#\s=->]+/gm, '')
        .replace(/[*_`]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    const rawExcerpt = art.summary || content;
    const cleanExcerpt = stripFormatting(rawExcerpt).slice(0, 180) + (rawExcerpt.length > 180 ? '...' : '');

    const editId = this.editingPostId();
    if (editId) {
      const existing = this.store.blogPosts().find((p) => p.id === editId);
      const updatedPost: BlogPost = {
        id: editId,
        title,
        titleAr: isAr ? title : existing?.titleAr,
        excerpt: cleanExcerpt,
        excerptAr: isAr ? cleanExcerpt : existing?.excerptAr,
        content,
        contentAr: isAr ? content : existing?.contentAr,
        coverImage: art.coverImageUrl || existing?.coverImage,
        subject: art.subject as unknown as import('@core/models/education.model').SubjectName,
        grade: art.grade as unknown as import('@core/models/education.model').GradeLevel,
        chapter: chapterLabel,
        tags,
        authorId: existing?.authorId || this.firebase.userProfile()?.uid,
        authorName: existing?.authorName || this.authorName(),
        authorTitle: existing?.authorTitle || (isAr ? 'مربٍ معتمد' : 'Enseignant Certifié'),
        authorAvatar: existing?.authorAvatar,
        publishedAt: existing?.publishedAt || 'À l\'instant',
        likesCount: existing?.likesCount || 1,
        readTimeMinutes: this.estimatedReadingTime(),
        comments: existing?.comments || [],
      };
      await this.store.updateBlogPost(updatedPost);
      this.store.editingBlogPost.set(null);
      this.editingPostId.set(null);
      this.store.showToast(this.lang.t('toastUpdated'), 'success');
      this.store.openBlogPost(updatedPost);
    } else {
      const newPost = await this.store.addBlogPost({
        title,
        titleAr: isAr ? title : undefined,
        excerpt: cleanExcerpt,
        excerptAr: isAr ? cleanExcerpt : undefined,
        content,
        contentAr: isAr ? content : undefined,
        coverImage: art.coverImageUrl || undefined,
        subject: art.subject as unknown as import('@core/models/education.model').SubjectName,
        grade: art.grade as unknown as import('@core/models/education.model').GradeLevel,
        chapter: chapterLabel,
        tags,
        authorId: this.firebase.userProfile()?.uid,
        authorName: this.authorName(),
        authorTitle: isAr ? 'مربٍ معتمد' : 'Enseignant Certifié',
        readTimeMinutes: this.estimatedReadingTime(),
      });

      void this.notifService.emit({
        category: 'activity',
        type: 'announcement',
        titleKey: 'notifBlogArticleTitle',
        messageKey: 'notifBlogArticleMsg',
        params: {
          title,
          author: this.authorName(),
        },
        targetRole: 'all',
        routeUrl: '/blog',
        targetDocId: newPost?.id,
        icon: 'article',
      });

      this.interactionSvc.recordPublication(title);
      this.store.showToast(this.lang.t('toastPublished'), 'success');
      this.store.openBlogPost(newPost);
    }
  }

  exitStudio() {
    this.location.back();
  }

  private parseSimpleMarkdown(markdown: string): string {
    const html = markdown
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^> \[!NOTE\][^\n]*\n> (.*$)/gim, '<blockquote class="border-s-4 border-[#007CC2] p-2 bg-[#F0F4F8] my-2">ℹ️ $1</blockquote>')
      .replace(/^> \[!TIP\][^\n]*\n> (.*$)/gim, '<blockquote class="border-s-4 border-[#23845B] p-2 bg-[#E8F6EF] my-2">💡 $1</blockquote>')
      .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/\n$/gim, '<br />');

    return html
      .split('\n\n')
      .map((p) => {
        const trimmed = p.trim();
        if (trimmed.startsWith('<h') || trimmed.startsWith('<block')) return trimmed;
        return `<p>${trimmed}</p>`;
      })
      .join('');
  }
}
