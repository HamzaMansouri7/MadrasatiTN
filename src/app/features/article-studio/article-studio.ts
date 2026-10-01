import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { EducationStore, LanguageService, FirebaseService, InteractionService, TUNISIAN_CURRICULUM_CHAPTERS, CurriculumChapter } from '@core';

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
export class ArticleStudioComponent {
  readonly store = inject(EducationStore);
  readonly lang = inject(LanguageService);
  readonly firebase = inject(FirebaseService);
  readonly interactionSvc = inject(InteractionService);

  readonly isSaved = signal<boolean>(true);
  readonly isLoading = signal<boolean>(false);
  readonly isGeneratingImg = signal<boolean>(false);
  readonly isDirectEditing = signal<boolean>(false);
  readonly userInput = signal<string>('');

  readonly messages = signal<ChatMessage[]>([]);

  // Curriculum Grounding Selectors
  readonly selectedGrade = signal<string>('4ème Année');
  readonly selectedSubject = signal<string>('Mathématiques');
  readonly selectedChapterId = signal<string>('math-4-ch1');

  readonly gradesList = [
    { id: '1ère Année', labelAr: 'السنة الأولى', labelFr: '1ère Année' },
    { id: '2ème Année', labelAr: 'السنة الثانية', labelFr: '2ème Année' },
    { id: '3ème Année', labelAr: 'السنة الثالثة', labelFr: '3ème Année' },
    { id: '4ème Année', labelAr: 'السنة الرابعة', labelFr: '4ème Année' },
    { id: '5ème Année', labelAr: 'السنة الخامسة', labelFr: '5ème Année' },
    { id: '6ème Année', labelAr: 'السنة السادسة (مناظرة)', labelFr: '6ème Année (Concours)' },
  ];

  readonly subjectsList = [
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
    return TUNISIAN_CURRICULUM_CHAPTERS.filter((c) => c.grade === gr && c.subject === sb);
  });

  readonly activeChapterObj = computed<CurriculumChapter | undefined>(() => {
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

  constructor() {
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
    const ch = this.availableChapters().find((c) => c.id === chapterId);
    if (ch) {
      const isAr = this.lang.isArabic();
      const chTitle = isAr ? ch.titleAr : ch.titleFr;
      this.article.update((a) => ({ ...a, chapter: chTitle }));
      this.suggestedChips.set(isAr ? ch.suggestedPromptsAr : ch.suggestedPromptsFr);
    }
  }

  private syncChapterSelection() {
    const list = this.availableChapters();
    if (list.length > 0) {
      this.onChapterChange(list[0].id);
    } else {
      this.selectedChapterId.set('');
      this.article.update((a) => ({ ...a, chapter: '' }));
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
      }
    };
    reader.readAsDataURL(file);
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
      localStorage.setItem('madrasati_article_draft', JSON.stringify(this.article()));
    }
    this.isSaved.set(true);
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

  publishArticle() {
    const art = this.article();
    const content = art.contentMarkdown || 'Article en cours de rédaction';
    const title = art.title || 'Article Pédagogique Sans Titre';

    const isAr = this.lang.isArabic();
    this.store.addBlogPost({
      title,
      excerpt: art.summary || content.slice(0, 160) + '...',
      content,
      subject: art.subject as any,
      grade: art.grade as any,
      chapter: art.chapter,
      tags: [art.subject, art.grade, isAr ? 'بيداغوجيا' : 'Pédagogie'],
      authorName: this.authorName(),
      authorTitle: isAr ? 'مربٍ معتمد' : 'Enseignant Certifié',
      readTimeMinutes: this.estimatedReadingTime(),
    });

    this.firebase.addNotification({
      type: 'announcement',
      title: isAr ? `مقال بيداغوجي جديد: ${title}` : `Nouvel article publié : ${title}`,
      message: isAr
        ? `بقلم ${this.authorName()} على المدونة التربوية.`
        : `Publié par ${this.authorName()} sur le blog pédagogique.`,
      linkRole: 'public',
      icon: 'article',
    });

    this.interactionSvc.recordPublication(title);
    this.store.setRole('public');
  }

  exitStudio() {
    this.store.setRole(this.store.previousRole());
  }

  private parseSimpleMarkdown(markdown: string): string {
    let html = markdown
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^\> \[\!NOTE\]\n\> (.*$)/gim, '<blockquote class="border-s-4 border-[#007CC2] p-2 bg-[#F0F4F8] my-2">ℹ️ $1</blockquote>')
      .replace(/^\> \[\!TIP\]\n\> (.*$)/gim, '<blockquote class="border-s-4 border-[#23845B] p-2 bg-[#E8F6EF] my-2">💡 $1</blockquote>')
      .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
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
