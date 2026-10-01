import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { BlogPost, EducationStore, FirebaseService, LanguageService } from '@core';

@Component({
  selector: 'app-blog-reader',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  template: `
    @if (store.selectedBlogPost(); as post) {
      <article class="max-w-4xl mx-auto space-y-8 animate-fade-in pb-16">
        <!-- Top Navigation & Action Toolbar -->
        <div class="flex items-center justify-between gap-4 border-b border-[#E7DFCF] pb-4">
          <button
            type="button"
            (click)="store.closeBlogPost()"
            class="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#2D6A4F] hover:text-[#1B4332] bg-[#F2ECDE] hover:bg-[#E7DFCF] px-3.5 py-2 rounded-xl transition-all cursor-pointer">
            <span class="material-icons text-base" [class.rotate-180]="lang.isArabic()">arrow_back</span>
            <span>{{ lang.t('backToArticles') }}</span>
          </button>

          <div class="flex items-center gap-2">
            <!-- Edit Button (Visible if current user is author or teacher) -->
            @if (canEdit(post)) {
              <button
                type="button"
                (click)="store.editBlogPost(post)"
                class="inline-flex items-center gap-1.5 text-xs font-semibold text-[#007CC2] bg-[#E8F5FC] hover:bg-[#D0EBFB] px-3 py-2 rounded-xl transition-all cursor-pointer">
                <span class="material-icons text-sm">edit</span>
                <span>{{ lang.t('editArticle') }}</span>
              </button>
            }

            <!-- Like Button -->
            <button
              type="button"
              (click)="handleLike(post.id)"
              class="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-[#E7DFCF] transition-all cursor-pointer hover:bg-white"
              [class]="post.likesCount > 0 ? 'text-[#C1121F] bg-[#FFF0F2] border-[#C1121F]/20' : 'text-[#5B6B60] bg-white'">
              <span class="material-icons text-base text-[#C1121F]">favorite</span>
              <span>{{ post.likesCount }}</span>
            </button>

            <!-- Share Button -->
            <button
              type="button"
              (click)="sharePost(post)"
              class="inline-flex items-center gap-1.5 text-xs font-semibold text-[#14251D] bg-white hover:bg-[#F8F5EE] border border-[#E7DFCF] px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-xs">
              <span class="material-icons text-base text-[#2D6A4F]">share</span>
              <span>{{ lang.t('shareArticle') }}</span>
            </button>
          </div>
        </div>

        <!-- Article Header -->
        <header class="space-y-4">
          <div class="flex flex-wrap items-center gap-2 text-xs">
            @if (post.subject) {
              <span class="bg-[#2D6A4F]/10 text-[#2D6A4F] font-semibold px-3 py-1 rounded-full">
                {{ lang.translateSubject(post.subject) }}
              </span>
            }
            @if (post.grade) {
              <span class="bg-[#F2ECDE] text-[#4A5A50] font-medium px-2.5 py-1 rounded-full">
                {{ lang.translateGrade(post.grade) }}
              </span>
            }
            @if (post.chapter) {
              <span class="bg-[#F8F5EE] border border-[#E7DFCF] text-[#6B7A70] px-2.5 py-1 rounded-full">
                {{ post.chapter }}
              </span>
            }
            <span class="text-[#6B7A70] flex items-center gap-1 ml-auto">
              <span class="material-icons text-sm">schedule</span>
              {{ post.readTimeMinutes }} min
            </span>
          </div>

          <h1 class="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#14251D] leading-tight tracking-tight">
            {{ lang.isArabic() && post.titleAr ? post.titleAr : post.title }}
          </h1>

          <!-- Author Info Card -->
          <div class="flex items-center gap-3 pt-2">
            <div class="w-11 h-11 rounded-full bg-[#1B4332] text-[#FBF8F1] font-bold text-sm flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
              @if (post.authorAvatar) {
                <img [src]="post.authorAvatar" [alt]="post.authorName" class="w-full h-full object-cover" />
              } @else {
                {{ (post.authorName || 'E')[0] }}
              }
            </div>
            <div>
              <p class="font-semibold text-[#14251D] text-sm leading-snug">{{ post.authorName }}</p>
              <div class="flex items-center gap-2 text-xs text-[#6B7A70]">
                <span>{{ post.authorTitle }}</span>
                <span>•</span>
                <span>{{ post.publishedAt }}</span>
              </div>
            </div>
          </div>
        </header>

        <!-- Cover Image -->
        @if (post.coverImage) {
          <div class="rounded-2xl overflow-hidden border border-[#E7DFCF] bg-[#F8F5EE] shadow-sm max-h-[460px] w-full">
            <img [src]="post.coverImage" [alt]="post.title" class="w-full h-full object-cover max-h-[460px]" />
          </div>
        }

        <!-- Excerpt Highlight Banner -->
        @if (post.excerpt || post.excerptAr) {
          <div class="bg-[#F8F5EE] border-s-4 border-[#2D6A4F] p-4 rounded-r-xl text-sm italic text-[#4A5A50] leading-relaxed">
            {{ lang.isArabic() && post.excerptAr ? post.excerptAr : post.excerpt }}
          </div>
        }

        <!-- Article Main Content -->
        <div class="prose max-w-none text-[#23352A] leading-relaxed text-base sm:text-lg space-y-4">
          @for (paragraph of getParagraphs(post); track $index) {
            @if (paragraph.startsWith('### ')) {
              <h3 class="font-display font-bold text-xl text-[#14251D] pt-4 pb-1 border-b border-[#E7DFCF]/60">
                {{ paragraph.replace('### ', '') }}
              </h3>
            } @else if (paragraph.startsWith('## ')) {
              <h2 class="font-display font-bold text-2xl text-[#14251D] pt-6 pb-2 border-b border-[#E7DFCF]">
                {{ paragraph.replace('## ', '') }}
              </h2>
            } @else if (paragraph.startsWith('# ')) {
              <h2 class="font-display font-bold text-2xl text-[#14251D] pt-6 pb-2">
                {{ paragraph.replace('# ', '') }}
              </h2>
            } @else if (paragraph.startsWith('- ') || paragraph.startsWith('* ')) {
              <li class="ms-6 list-disc text-base text-[#34483C]">
                {{ paragraph.slice(2) }}
              </li>
            } @else if (paragraph.trim().length > 0) {
              <p class="leading-relaxed">
                {{ paragraph }}
              </p>
            }
          }
        </div>

        <!-- Tags -->
        @if (post.tags.length) {
          <div class="flex flex-wrap items-center gap-2 pt-4 border-t border-[#E7DFCF]">
            <span class="text-xs font-medium text-[#6B7A70]">{{ lang.isArabic() ? 'الكلمات المفتاحية:' : 'Mots-clés :' }}</span>
            @for (tag of post.tags; track tag) {
              <span class="text-xs text-[#2D6A4F] bg-[#E8F5FC] px-2.5 py-1 rounded-lg font-medium">#{{ tag }}</span>
            }
          </div>
        }

        <!-- Discussion & Comments Section -->
        <section class="border-t-2 border-[#E7DFCF] pt-8 space-y-6">
          <div class="flex items-center justify-between">
            <h2 class="font-display text-xl font-bold text-[#14251D] flex items-center gap-2">
              <span class="material-icons text-[#2D6A4F]">forum</span>
              <span>{{ lang.t('commentsTitle') }}</span>
              <span class="text-xs font-semibold bg-[#2D6A4F]/10 text-[#2D6A4F] px-2 py-0.5 rounded-full">
                {{ post.comments.length }}
              </span>
            </h2>
          </div>

          <!-- Add Comment Form -->
          <div class="bg-white rounded-2xl p-5 border border-[#E7DFCF] shadow-xs space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-[#5B6B60] mb-1">
                  {{ lang.isArabic() ? 'اسم المعلق' : 'Votre nom' }}
                </label>
                <input
                  type="text"
                  [value]="newCommentAuthor()"
                  (input)="newCommentAuthor.set($any($event.target).value)"
                  class="w-full px-3 py-2 text-xs rounded-xl border border-[#D5CDBD] focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] outline-none"
                  [placeholder]="lang.tr('Ex: Mohamed, Enseignant ou Parent', 'مثال: الأستاذ محمد / ولي تلميذ')" />
              </div>
              <div>
                <label class="block text-xs font-medium text-[#5B6B60] mb-1">
                  {{ lang.isArabic() ? 'الصفة' : 'Rôle' }}
                </label>
                <select
                  [value]="newCommentRole()"
                  (change)="newCommentRole.set($any($event.target).value)"
                  class="w-full px-3 py-2 text-xs rounded-xl border border-[#D5CDBD] focus:border-[#2D6A4F] outline-none bg-white">
                  <option value="parent">{{ lang.isArabic() ? 'ولي تلميذ' : 'Parent' }}</option>
                  <option value="teacher">{{ lang.isArabic() ? 'مربٍ / أستاذ' : 'Enseignant' }}</option>
                </select>
              </div>
            </div>

            <div>
              <textarea
                [value]="newCommentText()"
                (input)="newCommentText.set($any($event.target).value)"
                rows="3"
                class="w-full px-3 py-2 text-sm rounded-xl border border-[#D5CDBD] focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] outline-none resize-none"
                [placeholder]="lang.t('addCommentPlaceholder')"></textarea>
            </div>

            <div class="flex justify-end">
              <button
                type="button"
                [disabled]="!newCommentText().trim()"
                (click)="submitComment(post.id)"
                class="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2D6A4F] text-white text-xs font-semibold rounded-xl hover:bg-[#1B4332] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs">
                <span class="material-icons text-sm">send</span>
                <span>{{ lang.t('publishCommentBtn') }}</span>
              </button>
            </div>
          </div>

          <!-- Existing Comments List -->
          <div class="space-y-3">
            @if (post.comments && post.comments.length > 0) {
              @for (c of post.comments; track c.id) {
                <div class="bg-white rounded-xl p-4 border border-[#E7DFCF] space-y-2">
                  <div class="flex items-center justify-between text-xs">
                    <div class="flex items-center gap-2">
                      <span class="font-semibold text-[#14251D]">{{ c.authorName }}</span>
                      <span class="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        [class]="c.authorRole === 'teacher' ? 'bg-[#2D6A4F]/10 text-[#2D6A4F]' : 'bg-[#F2ECDE] text-[#4A5A50]'">
                        {{ c.authorRole === 'teacher' ? (lang.isArabic() ? 'مربٍ' : 'Enseignant') : (lang.isArabic() ? 'ولي' : 'Parent') }}
                      </span>
                    </div>
                    <span class="text-[#8A9A90] text-[11px]">{{ c.createdAt }}</span>
                  </div>
                  <p class="text-xs sm:text-sm text-[#4A5A50] leading-relaxed">{{ c.content }}</p>
                </div>
              }
            } @else {
              <div class="text-center py-8 bg-[#F8F5EE] rounded-xl border border-dashed border-[#D5CDBD] text-xs text-[#6B7A70]">
                {{ lang.t('noCommentsYet') }}
              </div>
            }
          </div>
        </section>
      </article>
    }
  `,
})
export class BlogReaderComponent {
  readonly store = inject(EducationStore);
  readonly lang = inject(LanguageService);
  readonly firebase = inject(FirebaseService);

  readonly newCommentText = signal('');
  readonly newCommentAuthor = signal('');
  readonly newCommentRole = signal<'teacher' | 'parent'>('parent');

  constructor() {
    const user = this.firebase.userProfile();
    if (user?.displayName) {
      this.newCommentAuthor.set(user.displayName);
    }
    if (user?.role === 'teacher') {
      this.newCommentRole.set('teacher');
    }
  }

  canEdit(post: BlogPost): boolean {
    const user = this.firebase.userProfile();
    if (!user) return false;
    if (user.role === 'teacher') return true;
    return Boolean(post.authorId && post.authorId === user.uid);
  }

  getParagraphs(post: BlogPost): string[] {
    const raw = this.lang.isArabic() && post.contentAr ? post.contentAr : post.content;
    return (raw || '').split(/\n\n+/);
  }

  handleLike(postId: string) {
    this.store.likeBlogPost(postId);
  }

  async sharePost(post: BlogPost) {
    const url = typeof window !== 'undefined'
      ? `${window.location.origin}/discovery?blog=${encodeURIComponent(post.id)}`
      : '';
    const title = this.lang.isArabic() && post.titleAr ? post.titleAr : post.title;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          text: post.excerpt,
          url,
        });
        return;
      } catch (err) {
        // Fallback to clipboard
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      this.store.showToast(this.lang.t('toastLinkCopied'), 'info');
    }
  }

  async submitComment(postId: string) {
    const content = this.newCommentText().trim();
    if (!content) return;
    const author = this.newCommentAuthor().trim() || (this.lang.isArabic() ? 'مشارك' : 'Participant');
    const role = this.newCommentRole();

    await this.store.addBlogComment(postId, {
      authorName: author,
      authorRole: role,
      content,
    });

    this.newCommentText.set('');
    this.store.showToast(this.lang.t('toastCommentAdded'), 'success');
  }
}
