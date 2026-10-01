import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { EducationStore, LanguageService, FirebaseService, InteractionService } from '@core';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ArticleDraft {
  title: string;
  summary: string;
  subject: string;
  grade: string;
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

  readonly article = signal<ArticleDraft>({
    title: '',
    summary: '',
    subject: this.lang.isArabic() ? 'اللغة العربية' : 'Français',
    grade: this.lang.isArabic() ? 'السنة الرابعة' : '4ème Année',
    coverImageUrl: '',
    contentMarkdown: '',
  });

  readonly suggestedChips = signal<string[]>([]);

  constructor() {
    effect(() => {
      const isAr = this.lang.isArabic();
      // Initialize first message if empty
      if (this.messages().length === 0) {
        this.messages.set([
          {
            role: 'assistant',
            content: isAr
              ? 'مرحباً بك زميلي المربي ! أنا مساعدك البيداغوجي الذكي. ما هو الموضوع أو المهارة التي ترغب في صياغة مقال أو نصائح حولها اليوم ؟ (مثال: معالجة صعوبات الحساب الذهني، تحسين مهارات التعبير والإنتاج الكتابي، مرافقة الأولياء...)'
              : 'Bonjour ! Je suis votre co-pilote de rédaction pédagogique. De quel sujet souhaitez-vous traiter aujourd’hui dans votre article ? (Ex: Méthodes de calcul mental, astuces de lecture, aide aux devoirs...)',
          },
        ]);
      }

      // Initialize suggested chips based on language
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
    });
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
