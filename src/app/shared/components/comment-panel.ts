import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Comment, EducationStore, LanguageService } from '@core';

/** Discussion / Q&A thread for a course or exercise: comments, one-level replies, likes, new-comment input. */
@Component({
  selector: 'app-comment-panel',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-[#FBF8F1] border border-[#E7DFCF] rounded-2xl p-4 space-y-3">
      <p class="text-[10px] font-semibold text-[#1B4332] tracking-wide">💬 {{ lang.tr('Discussion & Q&A', 'نقاش وأسئلة') }}</p>

      @for (cmt of store.getComments(targetId()); track cmt.id) {
        <div class="space-y-2">
          <div class="flex gap-2.5 items-start">
            <div [class]="roleBadgeClass(cmt.authorRole)" class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0">
              {{ cmt.authorName.charAt(0) }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="font-semibold text-[#14251D] text-xs">{{ cmt.authorName }}</span>
                <span [class]="roleTagClass(cmt.authorRole)" class="text-[9px] font-semibold px-1.5 py-0.5 rounded-md">{{ roleLabel(cmt.authorRole) }}</span>
                <span class="text-[10px] text-[#6B7A70]">{{ cmt.createdAt }}</span>
              </div>
              <p class="text-xs text-[#4A5A50] mt-0.5 leading-relaxed">{{ cmt.text }}</p>
              <div class="flex items-center gap-3 mt-1">
                <button type="button" (click)="store.likeComment(cmt.id)" class="flex items-center gap-0.5 text-[10px] text-[#6B7A70] hover:text-[#C1121F] cursor-pointer transition-colors">
                  <span class="material-icons text-xs" [class.text-[#C1121F]]="cmt.isLiked">favorite</span>
                  <span>{{ cmt.likes }}</span>
                </button>
                <button type="button" (click)="setReplyTarget(cmt.id)" class="text-[10px] text-[#1B4332] hover:text-[#14251D] font-semibold cursor-pointer">{{ lang.tr('Répondre', 'رد') }}</button>
              </div>
            </div>
          </div>

          @if (cmt.replies && cmt.replies.length > 0) {
            <div class="ml-9 space-y-2 border-l-2 border-[#E7DFCF] pl-3">
              @for (reply of cmt.replies; track reply.id) {
                <div class="flex gap-2 items-start">
                  <div [class]="roleBadgeClass(reply.authorRole)" class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0">
                    {{ reply.authorName.charAt(0) }}
                  </div>
                  <div>
                    <div class="flex items-center gap-1 flex-wrap">
                      <span class="font-semibold text-[#14251D] text-[11px]">{{ reply.authorName }}</span>
                      <span [class]="roleTagClass(reply.authorRole)" class="text-[9px] font-semibold px-1.5 py-0.5 rounded-md">{{ roleLabel(reply.authorRole) }}</span>
                      <span class="text-[10px] text-[#6B7A70]">{{ reply.createdAt }}</span>
                    </div>
                    <p class="text-[11px] text-[#4A5A50] leading-relaxed">{{ reply.text }}</p>
                    <button type="button" (click)="store.likeComment(reply.id, cmt.id)" class="flex items-center gap-0.5 text-[10px] text-[#6B7A70] hover:text-[#C1121F] cursor-pointer transition-colors mt-0.5">
                      <span class="material-icons text-xs" [class.text-[#C1121F]]="reply.isLiked">favorite</span>
                      <span>{{ reply.likes }}</span>
                    </button>
                  </div>
                </div>
              }
            </div>
          }

          @if (replyTargetId() === cmt.id) {
            <div class="ml-9 flex gap-2 items-center">
              <input
                [id]="'reply-input-' + cmt.id"
                [(ngModel)]="replyText"
                [placeholder]="lang.tr('Votre réponse...', 'ردّك هنا...')"
                class="flex-1 border border-[#E7DFCF] bg-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
              />
              <button type="button" (click)="submitReply(cmt.id)" class="bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold text-[11px] px-3 py-1.5 rounded-xl cursor-pointer transition-colors">{{ lang.tr('Envoyer', 'إرسال') }}</button>
              <button type="button" (click)="replyTargetId.set(null)" class="text-[#6B7A70] hover:text-[#14251D] text-[11px] cursor-pointer" [attr.aria-label]="lang.tr('Annuler', 'إلغاء')">✕</button>
            </div>
          }
        </div>
      }

      <div class="flex gap-2 items-center pt-2 border-t border-[#E7DFCF]">
        <input
          [id]="'cmt-input-' + targetId()"
          [(ngModel)]="newCommentText"
          [placeholder]="placeholder() || lang.tr('Poser une question ou laisser un commentaire...', 'اطرح سؤالاً أو اترك تعليقاً...')"
          class="flex-1 border border-[#E7DFCF] bg-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
        />
        <button type="button" (click)="submitComment()" class="bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold text-[11px] px-3 py-1.5 rounded-xl cursor-pointer shrink-0 transition-colors">{{ lang.tr('Publier', 'نشر') }}</button>
      </div>
    </div>
  `,
})
export class CommentPanelComponent {
  readonly store = inject(EducationStore);
  readonly lang = inject(LanguageService);

  readonly targetId = input.required<string>();
  readonly targetType = input.required<'course' | 'exercise'>();
  readonly placeholder = input<string>('');

  newCommentText = '';
  replyText = '';
  readonly replyTargetId = signal<string | null>(null);

  setReplyTarget(commentId: string) {
    this.replyTargetId.set(commentId);
    this.replyText = '';
  }

  private author() {
    const user = typeof localStorage !== 'undefined' ? JSON.parse(localStorage.getItem('madrasati_user') || 'null') : null;
    return {
      name: (user?.name as string) || this.lang.tr('Visiteur', 'زائر'),
      role: (user?.role as Comment['authorRole']) || 'public',
      avatar: user?.avatarUrl as string | undefined,
    };
  }

  submitComment() {
    const text = this.newCommentText.trim();
    if (!text) return;
    const a = this.author();
    this.store.addComment(this.targetId(), this.targetType(), text, a.name, a.role, a.avatar);
    this.newCommentText = '';
  }

  submitReply(parentCommentId: string) {
    const text = this.replyText.trim();
    if (!text) return;
    const a = this.author();
    this.store.addReply(parentCommentId, text, a.name, a.role, a.avatar);
    this.replyText = '';
    this.replyTargetId.set(null);
  }

  roleBadgeClass(role: string): string {
    const map: Record<string, string> = {
      teacher: 'bg-[#1B4332] text-[#FBF8F1]',
      parent: 'bg-[#8A5A00] text-[#FBF8F1]',
      student: 'bg-[#BF5B34] text-[#FBF8F1]',
      public: 'bg-[#F2ECDE] text-[#14251D]',
    };
    return map[role] || map['public'];
  }

  roleTagClass(role: string): string {
    const map: Record<string, string> = {
      teacher: 'bg-[#F2ECDE] text-[#1B4332] border border-[#E7DFCF]',
      parent: 'bg-[#F2ECDE] text-[#8A5A00] border border-[#E7DFCF]',
      student: 'bg-[#F2ECDE] text-[#BF5B34] border border-[#E7DFCF]',
      public: 'bg-[#F2ECDE] text-[#5B6B60] border border-[#E7DFCF]',
    };
    return map[role] || map['public'];
  }

  roleLabel(role: string): string {
    const map: Record<string, string> = {
      teacher: this.lang.tr('Enseignant ✓', 'معلم ✓'),
      parent: this.lang.tr('Parent', 'ولي أمر'),
      student: this.lang.tr('Élève', 'تلميذ'),
      public: this.lang.tr('Visiteur', 'زائر'),
    };
    return map[role] || map['public'];
  }
}
