import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { EducationStore, FirebaseService, getInfographicTemplate, GradeLevel, InfographicDoc, LanguageService, LessonPlanDocValues, SubjectName } from '@core';
import { InfographicRendererComponent } from './infographic-renderer';
import { ShareButtonComponent } from './share-button';

@Component({
  selector: 'app-infographic-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [InfographicRendererComponent, ShareButtonComponent],
  template: `
    <div class="infographic-container w-full max-w-[850px] mx-auto space-y-4">
      
      <!-- Toolbar (Screen Only) -->
      <div class="flex items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-[#E7DFCF] print:hidden ">
        <div class="flex items-center gap-2">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#2D6A4F]/10 text-[#1B4332] border border-[#2D6A4F]/20">
            <span class="material-icons text-sm">view_timeline</span>
            <span>{{ lang.tr('Fiche Pédagogique Officielle A4', 'جذاذة بيداغوجية رسمية A4') }}</span>
          </span>
          <span class="text-xs text-[#5B6B60]">• {{ doc().grade }} • {{ doc().subject }}</span>
        </div>

        <div class="flex items-center gap-2">
          <app-share-button
            [url]="doc().templateId === 'lesson-plan-official' ? '/lesson-plan/' + doc().id : '/infographic/' + doc().id"
            [title]="doc().title"
            [text]="doc().title"
            [details]="[doc().grade, doc().subject, doc().trimester]"
            variant="button"
            accent="neutral" />
          @if (doc().isOwner) {
            <button
              type="button"
              (click)="publishToBlog()"
              [disabled]="blogPublishing() || blogPublished()"
              class="px-4 py-1.5 rounded-xl bg-white hover:bg-[#F4F6F5] border border-[#E7DFCF] text-[#14251D] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-default">
              <span class="material-icons text-sm">{{ blogPublished() ? 'check' : 'article' }}</span>
              <span>{{ blogPublished() ? lang.tr('Publié au blog ✓', 'تم النشر في المدونة ✓') : lang.tr('Publier au blog', 'نشر في المدونة') }}</span>
            </button>
          }
          <button
            type="button"
            (click)="printDoc()"
            class="px-4 py-1.5 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm">
            <span class="material-icons text-sm">print</span>
            <span>{{ lang.tr('Imprimer A4', 'طباعة A4') }}</span>
          </button>
        </div>
      </div>

      <!-- ================= A4 PORTRAIT SHEET ================= -->
      <div
        id="lesson-plan-sheet"
        [attr.dir]="doc().language === 'fr' ? 'ltr' : 'rtl'"
        [attr.lang]="doc().language"
        class="print-sheet bg-white rounded-[28px] border border-[#E7DFCF] p-6 sm:p-10 text-[#14251D] space-y-6 shadow-sm min-h-[1100px] relative">
        
        <!-- Top Institutional Ministry Cartouche -->
        <div class="border-b-2 border-[#14251D] pb-4 flex items-center justify-between gap-4">
          <div class="text-start space-y-0.5 text-xs">
            <p class="font-display font-semibold text-[#14251D] text-sm">{{ t('République Tunisienne', 'الجمهورية التونسية') }}</p>
            <p class="text-[#5B6B60] text-xs">{{ t('Ministère de l’Éducation', 'وزارة التربية') }}</p>
            <p class="text-[#5B6B60] text-xs">{{ t('Enseignement primaire', 'المرحلة الابتدائية') }}@if (doc().author?.schoolYear) { — {{ doc().author?.schoolYear }} }</p>
          </div>

          <div class="text-center space-y-1">
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#14251D] text-[#FBF8F1] font-display font-semibold text-xs">
              <span class="material-icons text-sm text-[#F2C14E]">school</span>
              <span>{{ t('Fiche pédagogique', 'جذاذة بيداغوجية') }}</span>
            </div>
            <h2 class="font-display font-semibold text-lg text-[#14251D] tracking-tight">
              {{ doc().title || values().topic }}
            </h2>
          </div>

          <div class="text-left flex flex-col items-end">
            <span class="tn-seal w-10 h-10 shrink-0" aria-hidden="true"></span>
            <span class="text-[11px] text-[#5B6B60] mt-1 font-mono">MADRASATI-TN</span>
          </div>
        </div>

        <app-infographic-renderer [template]="template()" [doc]="doc()"></app-infographic-renderer>

        <!-- Official Footer -->
        <div class="border-t border-[#14251D] pt-3 flex items-center justify-between text-[11px] text-[#5B6B60]">
          <div>
            <span>{{ t('Réalisé par : ', 'من إنجاز : ') }}</span>
            <strong class="text-[#14251D]">{{ doc().author?.name || 'Madrasati TN' }}</strong>
            @if (doc().author?.school) {
              <span> — {{ doc().author?.school }}</span>
            }
          </div>

          <div class="flex items-center gap-3">
            <span>{{ t('Visa : ____________', 'التأشيرة : ____________') }}</span>
            <span class="font-mono text-[11px]">Madrasati TN</span>
          </div>
        </div>

      </div>

    </div>
  `,
})
export class InfographicPageComponent {
  readonly lang = inject(LanguageService);
  private readonly store = inject(EducationStore);
  private readonly firebase = inject(FirebaseService);

  readonly doc = input.required<InfographicDoc>();
  readonly shareCopied = signal(false);
  readonly blogPublishing = signal(false);
  readonly blogPublished = signal(false);

  readonly values = computed<LessonPlanDocValues>(() => {
    return (this.doc().values as LessonPlanDocValues) || {
      objectives: [],
      outcomes: [],
      materials: [],
      stages: [],
      assessmentCriteria: [],
      supportActivities: [],
      enrichmentActivities: [],
      crossSubjectIntegration: [],
      targetValues: [],
      homework: [],
      reflectionQuestions: [],
    };
  });

  readonly template = computed(() => getInfographicTemplate(this.doc().templateId));

  t(fr: string, ar: string): string {
    return this.doc().language === 'fr' ? fr : ar;
  }

  async publishToBlog() {
    if (typeof window === 'undefined' || this.blogPublishing() || this.blogPublished()) return;
    const user = this.firebase.currentUser();
    if (!user) {
      this.store.openSignupModal('teacher');
      return;
    }
    const d = this.doc();
    const v = this.values();
    const isFr = d.language === 'fr';
    const url = `${window.location.origin}/lesson-plan/${d.id}`;
    // The blog reader renders blank-line-separated blocks: "## " headings, "- " items, a bare URL as a button.
    const section = (title: string, items: string[]) =>
      items.length ? [`## ${title}`, ...items.map((i) => `- ${i}`)] : [];
    const stages = (v.stages || []).map((s) => `${s.step}. ${s.name} (${s.minutes} ${isFr ? 'min' : 'د'})`);
    const blocks = [
      ...section(isFr ? 'Objectifs' : 'الأهداف', v.objectives || []),
      ...section(isFr ? 'Déroulement' : 'سير الحصة', stages),
      ...section(isFr ? 'Matériel' : 'الوسائل', v.materials || []),
      url,
    ];
    const content = blocks.join('\n\n');
    await this.store.loadBlogPosts();
    const duplicate = this.store.blogPosts().some((p) => p.content.includes(url));
    if (duplicate) {
      this.blogPublished.set(true);
      return;
    }
    const excerpt = (v.objectives?.[0] || d.title).slice(0, 150);
    const name = d.author?.name || this.firebase.userProfile()?.displayName || user.displayName || 'Enseignant Certifié';

    this.blogPublishing.set(true);
    try {
      await this.store.addBlogPost({
        title: d.title,
        titleAr: isFr ? undefined : d.title,
        excerpt,
        excerptAr: isFr ? undefined : excerpt,
        content,
        contentAr: isFr ? undefined : content,
        subject: d.subject as SubjectName,
        grade: d.grade as GradeLevel,
        tags: [String(d.subject), String(d.grade), isFr ? 'Fiche pédagogique' : 'جذاذة'],
        authorId: user.uid,
        authorName: name,
        authorTitle: isFr ? 'Enseignant Certifié' : 'مربٍ معتمد',
        readTimeMinutes: Math.max(2, Math.ceil(content.split(/\s+/).length / 180)),
      });
      this.blogPublished.set(true);
      this.store.showToast(this.lang.tr('Publié au blog', 'تم النشر في المدونة'), 'success');
    } catch {
      this.store.showToast(this.lang.tr('Échec de la publication', 'تعذّر النشر'), 'error');
    } finally {
      this.blogPublishing.set(false);
    }
  }

  printDoc() {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }
}
