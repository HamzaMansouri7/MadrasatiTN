import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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
  readonly userInput = signal<string>('');

  readonly messages = signal<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Bonjour ! Je suis votre co-pilote de rédaction pédagogique. De quel sujet souhaitez-vous traiter aujourd’hui dans votre article ? (Ex: Méthodes de calcul mental, astuces de lecture, aide aux devoirs...)',
    },
  ]);

  readonly article = signal<ArticleDraft>({
    title: '',
    summary: '',
    subject: 'Mathématiques',
    grade: '4ème Année',
    coverImageUrl: '',
    contentMarkdown: '',
  });

  readonly suggestedChips = signal<string[]>([
    'Comment surmonter le blocage en calcul mental (3ème/4ème)',
    '3 Astuces pour aider son enfant en dictée arabe',
    'Conseils pratiques pour la révision du Trimestre 1',
  ]);

  readonly authorName = computed(() => {
    return this.firebase.userProfile()?.displayName || 'Enseignant Certifié';
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
          { role: 'assistant', content: 'Désolé, une erreur est survenue lors de la rédaction. Veuillez réessayer.' },
        ]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      this.messages.update((msgs) => [
        ...msgs,
        { role: 'assistant', content: 'Impossible de joindre le serveur IA actuellement.' },
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

  publishArticle() {
    const art = this.article();
    const content = art.contentMarkdown || 'Article en cours de rédaction';
    const title = art.title || 'Article Pédagogique Sans Titre';

    this.store.addBlogPost({
      title,
      excerpt: art.summary || content.slice(0, 160) + '...',
      content,
      subject: art.subject as any,
      grade: art.grade as any,
      tags: [art.subject, art.grade, 'Pédagogie'],
      authorName: this.authorName(),
      authorTitle: 'Enseignant Certifié',
      readTimeMinutes: this.estimatedReadingTime(),
    });

    this.firebase.addNotification({
      type: 'announcement',
      title: `Nouvel article publié : ${title}`,
      message: `Publié par ${this.authorName()} sur le blog pédagogique.`,
      linkRole: 'teacher',
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
