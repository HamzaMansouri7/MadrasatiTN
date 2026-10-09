import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EducationStore, LanguageService, SourceInput, chapterById, chapterTitle } from '@core';
import { AiStatusComponent, SourceInputComponent } from '@shared';

export type CreateOutputType =
  | 'lesson-plan'
  | 'memo'
  | 'exercises'
  | 'series'
  | 'article'
  | 'summary'
  | 'exam'
  | 'worksheet'
  | 'solve';

export interface OutputCardOption {
  type: CreateOutputType;
  titleFr: string;
  titleAr: string;
  descFr: string;
  descAr: string;
  icon: string;
  accent: string;
  badgeFr: string;
  badgeAr: string;
  previewKind: 'table' | 'cards' | 'prose' | 'comic' | 'exam' | 'photo';
  route?: string;
}

@Component({
  selector: 'app-create-hub',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SourceInputComponent, AiStatusComponent],
  templateUrl: './create-hub.html',
})
export class CreateHubComponent implements OnInit {
  readonly lang = inject(LanguageService);
  readonly store = inject(EducationStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly selectedOutput = signal<CreateOutputType | null>(null);
  readonly isGenerating = signal<boolean>(false);
  readonly genError = signal<string | null>(null);

  readonly outputOptions: OutputCardOption[] = [
    {
      type: 'lesson-plan',
      titleFr: 'Fiche Pédagogique (Jodhadha)',
      titleAr: 'جذاذة بيداغوجية رسمية',
      descFr: 'Plan de leçon complet A4 portrait en 12 rubriques avec étapes minutées (01-05).',
      descAr: 'تخطيط رسمي كامل للدرس في صفحة A4 عمودية بـ 12 قسماً مع توقيت المراحل الخمس.',
      icon: 'view_timeline',
      accent: '#2D6A4F',
      badgeFr: 'Pédagogique',
      badgeAr: 'بيداغوجي',
      previewKind: 'table',
    },
    {
      type: 'memo',
      titleFr: 'AI Studio — Infographie & Synthèse',
      titleAr: 'استوديو الذكاء الاصطناعي — إنفوغرافيا وتلخيص',
      descFr: 'Transformez un cours ou document en infographie visuelle et synthèse A4 claire.',
      descAr: 'حوّل الدرس أو الوثائق إلى إنفوغرافيا بصرية وملخص A4 يبرز المفاهيم الأساسية.',
      icon: 'dashboard_customize',
      accent: '#8A5A00',
      badgeFr: 'Populaire',
      badgeAr: 'شائع',
      previewKind: 'cards',
      route: '/ai-studio',
    },
    {
      type: 'exercises',
      titleFr: 'Devoir & Série d’Exercices',
      titleAr: 'امتحانات وتمارين تدريبية',
      descFr: 'Évaluation officielle (20 Pts), série d’entraînement graduée ou fiche imprimable.',
      descAr: 'اختبار تقييمي رسمي (20 نقطة)، تمارين تدريبية متدرجة أو ورقة عمل مطبوعة.',
      icon: 'quiz',
      accent: '#14251D',
      badgeFr: 'Officiel',
      badgeAr: 'رسمي',
      previewKind: 'exam',
      route: '/editor',
    },
    {
      type: 'series',
      titleFr: 'Série Visuelle & Récit',
      titleAr: 'سلسلة مصورة وقصة تاريخية',
      descFr: 'Planches A4 chronologiques numérotées pour l’histoire, la géographie ou le récit.',
      descAr: 'لوحات A4 متسلسلة ومرقمة للدروس التاريخية والقصص مع خط زمني من اليمين إلى اليسار.',
      icon: 'auto_stories',
      accent: '#BF5B34',
      badgeFr: 'Visuel',
      badgeAr: 'بصري',
      previewKind: 'comic',
    },
    {
      type: 'article',
      titleFr: 'Article Pédagogique',
      titleAr: 'مقال ونصيحة بيداغوجية',
      descFr: 'Publication pour la communauté des enseignants et conseils pratiques pour parents.',
      descAr: 'مقال إرشادي موجه لشبكة المعلمين والأولياء لدعم التمدرس.',
      icon: 'article',
      accent: '#2D6A4F',
      badgeFr: 'Communauté',
      badgeAr: 'مجتمع',
      previewKind: 'prose',
      route: '/article-studio',
    },
    {
      type: 'solve',
      titleFr: 'Solution d’un exercice en photo',
      titleAr: 'حلّ تمرين بالصورة',
      descFr: 'Photographiez un exercice du cahier ou du livre : solution détaillée et conseils pour accompagner l’enfant.',
      descAr: 'صوّر تمريناً من الكراس أو الكتاب: حل مفصل خطوة بخطوة ونصائح لمرافقة الطفل.',
      icon: 'photo_camera',
      accent: '#1B4332',
      badgeFr: 'Outil',
      badgeAr: 'أداة',
      previewKind: 'photo',
      route: '/solve',
    },
  ];

  readonly activeOption = computed(() => {
    const sel = this.selectedOutput();
    return sel ? this.outputOptions.find((o) => o.type === sel) ?? null : null;
  });

  /** Pre-fills the source form when arriving from the programme (/create?topicId=…). */
  readonly initialInput = signal<SourceInput | null>(null);

  ngOnInit() {
    this.route.queryParamMap.subscribe((params) => {
      const ch = chapterById(params.get('topicId'));
      if (ch) {
        const language = ch.subject === 'Français' || ch.subject === 'Anglais' ? 'fr' : 'ar';
        this.initialInput.set({
          mode: 'topic',
          topic: chapterTitle(ch, language),
          topicId: ch.id,
          grade: ch.grade,
          subject: ch.subject,
          trimester: ch.trimester,
          language,
        });
      }
      const out = params.get('output') as CreateOutputType | null;
      if (out && out !== 'solve' && this.outputOptions.some((o) => o.type === out)) {
        this.selectedOutput.set(out);
      }
    });
  }

  selectOutput(opt: OutputCardOption) {
    // The photo solver has its own page and needs no source text.
    if (opt.type === 'solve' && opt.route) {
      void this.router.navigateByUrl(opt.route);
      return;
    }
    this.selectedOutput.set(opt.type);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { output: opt.type },
      queryParamsHandling: 'merge',
    });
  }

  retryGeneration() {
    const last = this.store.lastSourceInput();
    if (last) this.onSourceSubmitted(last);
  }

  onSourceSubmitted(source: SourceInput) {
    if (this.isGenerating()) return;
    this.store.setLastSourceInput(source);
    const sel = this.selectedOutput();

    if (sel === 'memo' || sel === 'summary') {
      this.router.navigate(['/ai-studio']);
    } else if (sel === 'exercises' || sel === 'exam' || sel === 'worksheet') {
      this.router.navigate(['/editor'], {
        queryParams: { type: sel === 'exam' ? 'exam' : 'exercise_sheet' },
      });
    } else if (sel === 'article') {
      this.router.navigate(['/article-studio']);
    } else if (sel === 'lesson-plan') {
      this.generateLessonPlan(source);
    } else if (sel === 'series') {
      this.planSeries(source);
    }
  }

  async generateLessonPlan(source: SourceInput) {
    this.isGenerating.set(true);
    this.genError.set(null);
    try {
      const res = await this.store.generateLessonPlan(source);
      if (res.ok && res.docId) {
        this.router.navigate(['/lesson-plan', res.docId]);
      } else {
        this.genError.set(res.error || 'Erreur lors de la génération de la fiche');
      }
    } finally {
      this.isGenerating.set(false);
    }
  }

  async planSeries(source: SourceInput) {
    this.isGenerating.set(true);
    this.genError.set(null);
    try {
      const res = await this.store.createSeriesFromSource(source);
      if (res.ok && res.docId) {
        this.router.navigate(['/series', res.docId]);
      } else {
        this.genError.set(res.error || 'Erreur lors de la génération de la série');
      }
    } finally {
      this.isGenerating.set(false);
    }
  }
}
