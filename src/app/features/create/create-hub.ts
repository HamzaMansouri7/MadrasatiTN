import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EducationStore, LanguageService, SourceInput } from '@core';
import { AiStatusComponent, SourceInputComponent } from '@shared';

export type CreateOutputType =
  | 'lesson-plan'
  | 'memo'
  | 'summary'
  | 'exercises'
  | 'exam'
  | 'worksheet'
  | 'series'
  | 'article';

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
  previewKind: 'table' | 'cards' | 'prose' | 'comic' | 'exam';
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
      badgeFr: 'Nouveau',
      badgeAr: 'جديد',
      previewKind: 'table',
    },
    {
      type: 'memo',
      titleFr: 'AI Studio — Infographie',
      titleAr: 'استوديو الذكاء الاصطناعي — إنفوغرافيا',
      descFr: 'Transformez un cours en infographie visuelle A4 : règles, exemples et repères clés.',
      descAr: 'حوّل الدرس إلى إنفوغرافيا بصرية A4 تبرز القواعد والأمثلة والمفاهيم الأساسية.',
      icon: 'dashboard_customize',
      accent: '#8A5A00',
      badgeFr: 'Populaire',
      badgeAr: 'شائع',
      previewKind: 'cards',
      route: '/ai-studio',
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
      type: 'exam',
      titleFr: 'Évaluation Complète (20 Pts)',
      titleAr: 'امتحان تقييمي رسمي (20 نقطة)',
      descFr: 'Épreuve officielle en 3 parties progressives avec barème et corrigé type A4.',
      descAr: 'اختبار تأليفي أو استكشافي رسمي من 3 أقسام متدرجة ومجموع 20 نقطة مع الإصلاح.',
      icon: 'quiz',
      accent: '#14251D',
      badgeFr: 'Officiel',
      badgeAr: 'رسمي',
      previewKind: 'exam',
      route: '/editor',
    },
    {
      type: 'exercises',
      titleFr: 'Série d’Exercices Gradués',
      titleAr: 'تمارين وتطبيقات متدرجة',
      descFr: 'Exercices ciblés avec barème, indications méthodologiques et solutions pas à pas.',
      descAr: 'تمارين تدريبية مصنفة حسب الصعوبة مع توجيهات الأولياء والإصلاح المفصل.',
      icon: 'assignment',
      accent: '#2D6A4F',
      badgeFr: 'Entraînement',
      badgeAr: 'تدريب',
      previewKind: 'cards',
      route: '/editor',
    },
    {
      type: 'summary',
      titleFr: 'Synthèse de Cours',
      titleAr: 'تلخيص واستخراج الأفكار',
      descFr: 'Extraction des points essentiels, définitions et glossaire à partir de documents ou photos.',
      descAr: 'استخلاص العناصر الأساسية والمصطلحات من وثائق أو صور كراس التلميذ.',
      icon: 'summarize',
      accent: '#1B4332',
      badgeFr: 'Rapide',
      badgeAr: 'سريع',
      previewKind: 'prose',
      route: '/summarize',
    },
    {
      type: 'worksheet',
      titleFr: 'Fiche d’Entraînement A4',
      titleAr: 'ورقة عمل وتدريب مطبوعة',
      descFr: 'Feuille imprimable avec DNA didactique et variantes d’exercices prêtes à l’emploi.',
      descAr: 'ورقة عمل قابلة للطباعة مع تنويع الوضعيات والتطبيقات.',
      icon: 'draw',
      accent: '#8A5A00',
      badgeFr: 'Imprimable',
      badgeAr: 'طباعة',
      previewKind: 'table',
      route: '/generate',
    },
    {
      type: 'article',
      titleFr: 'Article Pédagogique',
      titleAr: 'مقال ونصيحة بيداغوجية',
      descFr: 'Publication pour la communauté des enseignants et conseils pratiques pour parents.',
      descAr: 'مقال إرشادي موجه لشبكة المعلمين والأولياء لدعم التمدرس.',
      icon: 'article',
      accent: '#14251D',
      badgeFr: 'Communauté',
      badgeAr: 'مجتمع',
      previewKind: 'prose',
      route: '/article-studio',
    },
  ];

  readonly activeOption = computed(() => {
    const sel = this.selectedOutput();
    return sel ? this.outputOptions.find((o) => o.type === sel) ?? null : null;
  });

  ngOnInit() {
    this.route.queryParamMap.subscribe((params) => {
      const out = params.get('output') as CreateOutputType | null;
      if (out && this.outputOptions.some((o) => o.type === out)) {
        this.selectedOutput.set(out);
      }
    });
  }

  selectOutput(opt: OutputCardOption) {
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

    if (sel === 'memo') {
      // The source is already in the store; the studio generates from it, no second form.
      this.router.navigate(['/ai-studio']);
    } else if (sel === 'summary') {
      this.router.navigate(['/summarize']);
    } else if (sel === 'exam' || sel === 'exercises') {
      this.router.navigate(['/editor'], {
        queryParams: { type: sel === 'exam' ? 'exam' : 'exercise_sheet' },
      });
    } else if (sel === 'worksheet') {
      this.router.navigate(['/generate']);
    } else if (sel === 'article') {
      this.router.navigate(['/article-studio']);
    } else if (sel === 'lesson-plan') {
      // Flow for lesson-plan
      this.generateLessonPlan(source);
    } else if (sel === 'series') {
      // Flow for series
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
