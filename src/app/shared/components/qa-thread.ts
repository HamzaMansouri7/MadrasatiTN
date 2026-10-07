import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { LanguageService, QuestionThread } from '@core';
import { TimeAgoPipe } from '../pipes/time-ago.pipe';

export type QaThreadAccent = 'blue' | 'green' | 'library';

@Component({
  selector: 'app-qa-thread',
  standalone: true,
  imports: [TimeAgoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="containerClass()">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3" [class]="borderClass()">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span [class]="subjectBadgeClass()">
              {{ lang.translateSubject(thread().subject) }}
            </span>
            <span [class]="gradeBadgeClass()">
              {{ lang.translateGrade(thread().grade) }}
            </span>
            <span [class]="metaTextClass()">
              • {{ thread().parentName }} • {{ thread().createdAt | timeAgo }}
            </span>
          </div>
          <h4 [class]="headingClass()">{{ thread().title }}</h4>
        </div>

        @if (canReply()) {
          <button
            type="button"
            (click)="reply.emit(thread())"
            [class]="replyBtnClass()">
            <span class="material-icons text-sm" aria-hidden="true">reply</span>
            {{ lang.t('replyToQuestionBtn') }}
          </button>
        }
      </div>

      <!-- Question Body -->
      <p [class]="bodyClass()">
        {{ thread().content }}
      </p>

      <!-- Answers Section -->
      @if (thread().answers.length > 0) {
        <div class="space-y-2 pt-1">
          <p [class]="answersHeadingClass()">
            <span class="material-icons text-xs" [class]="verifiedIconClass()" aria-hidden="true">verified</span>
            {{ accent() === 'blue'
              ? lang.tr('Réponses certifiées des enseignants :', 'الإجابات المعتمدة من المعلمين:')
              : lang.tr('Réponses des enseignants :', 'إجابات الإطار التربوي:') }}
          </p>

          @for (ans of thread().answers; track ans.id) {
            <div [class]="answerCardClass()">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="font-semibold text-[#102A43]">{{ ans.teacherName }}</span>
                  <span [class]="teacherBadgeClass()">
                    {{ ans.teacherTitle }}
                  </span>
                </div>
                <span [class]="metaTextClass()">{{ ans.createdAt | timeAgo }}</span>
              </div>

              <p class="leading-relaxed" [class]="answerTextClass()">{{ ans.content }}</p>

              @if (ans.attachedDocTitle) {
                <div [class]="attachedDocClass()">
                  <span class="material-icons text-sm" aria-hidden="true">attach_file</span>
                  <span>{{ lang.t('attachedDocument') }} : <strong [class]="headingClass()">{{ ans.attachedDocTitle }}</strong></span>
                </div>
              }
            </div>
          }
        </div>
      } @else if (!canReply()) {
        <p class="text-xs text-[#627D98] italic">
          {{ lang.tr('En attente de réponse d’un enseignant référent...', 'في انتظار مراجعة وإجابة الإطار التربوي...') }}
        </p>
      }
    </div>
  `,
})
export class QaThreadComponent {
  readonly lang = inject(LanguageService);

  readonly thread = input.required<QuestionThread>();
  readonly accent = input<QaThreadAccent>('blue');
  readonly canReply = input<boolean>(false);

  readonly reply = output<QuestionThread>();

  protected readonly containerClass = computed(() => {
    return this.accent() === 'blue'
      ? 'bg-[#F7F9FB] rounded-[20px] p-6 border border-[#E3ECF2] space-y-4'
      : 'bg-[#FBF8F1] rounded-[20px] p-6 border border-[#E7DFCF] space-y-4';
  });

  protected readonly borderClass = computed(() =>
    this.accent() === 'blue' ? 'border-[#E3ECF2]' : 'border-[#E7DFCF]'
  );

  protected readonly subjectBadgeClass = computed(() => {
    switch (this.accent()) {
      case 'green': return 'bg-[#2D6A4F]/10 text-[#2D6A4F] text-[10px] font-bold px-2.5 py-0.5 rounded-full';
      case 'library': return 'bg-[#1B4332]/10 text-[#1B4332] text-[10px] font-bold px-2.5 py-0.5 rounded-full';
      case 'blue':
      default: return 'bg-[#007CC2]/10 text-[#007CC2] text-[10px] font-bold px-2.5 py-0.5 rounded-full';
    }
  });

  protected readonly gradeBadgeClass = computed(() => {
    return this.accent() === 'blue'
      ? 'bg-[#E0AA32]/15 text-[#9E6A00] text-[10px] font-bold px-2 py-0.5 rounded-full'
      : 'bg-[#F2C14E]/15 text-[#8A5A00] text-[10px] font-bold px-2 py-0.5 rounded-full';
  });

  protected readonly metaTextClass = computed(() =>
    this.accent() === 'blue' ? 'text-[11px] text-[#627D98] font-medium' : 'text-[11px] text-[#5B6B60] font-medium'
  );

  protected readonly headingClass = computed(() =>
    this.accent() === 'blue' ? 'font-display font-semibold text-[#102A43] text-base' : 'font-display font-semibold text-[#14251D] text-base'
  );

  protected readonly replyBtnClass = computed(() => {
    return this.accent() === 'blue'
      ? 'bg-[#007CC2] hover:bg-[#006EAD] text-white font-semibold text-xs px-3.5 py-2 rounded-[10px] flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto'
      : 'bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold text-xs px-3.5 py-2 rounded-[10px] flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto';
  });

  protected readonly bodyClass = computed(() => {
    return this.accent() === 'blue'
      ? 'text-xs text-[#334E68] bg-white p-4 rounded-[14px] border border-[#E3ECF2] leading-relaxed'
      : 'text-xs text-[#14251D] bg-white p-4 rounded-[14px] border border-[#E7DFCF] leading-relaxed';
  });

  protected readonly answersHeadingClass = computed(() =>
    this.accent() === 'blue'
      ? 'text-[11px] font-semibold text-[#102A43] flex items-center gap-1'
      : 'text-[11px] font-semibold text-[#14251D] flex items-center gap-1'
  );

  protected readonly verifiedIconClass = computed(() =>
    this.accent() === 'blue' ? 'text-[#23845B]' : 'text-[#2D6A4F]'
  );

  protected readonly answerCardClass = computed(() => {
    return this.accent() === 'blue'
      ? 'bg-[#E8F6EF] rounded-[14px] p-4 border border-[#23845B]/20 space-y-2 text-xs'
      : 'bg-[#F2ECDE] rounded-[14px] p-4 border border-[#2D6A4F]/20 space-y-2 text-xs';
  });

  protected readonly teacherBadgeClass = computed(() => {
    return this.accent() === 'blue'
      ? 'text-[10px] bg-[#23845B] text-white px-2 py-0.5 rounded-full font-medium'
      : 'text-[10px] bg-[#2D6A4F] text-[#FBF8F1] px-2 py-0.5 rounded-full font-medium';
  });

  protected readonly answerTextClass = computed(() =>
    this.accent() === 'blue' ? 'text-[#102A43]' : 'text-[#14251D]'
  );

  protected readonly attachedDocClass = computed(() => {
    return this.accent() === 'blue'
      ? 'inline-flex items-center gap-2 bg-white text-[#007CC2] p-2.5 rounded-[10px] border border-[#007CC2]/30 font-medium text-[11px]'
      : 'inline-flex items-center gap-2 bg-white text-[#2D6A4F] p-2.5 rounded-[10px] border border-[#2D6A4F]/30 font-medium text-[11px]';
  });
}
