import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EducationStore, SourceInput, chapterById, chapterTitle } from '@core';

/** Where each old `/create?output=…` value now lives. */
const OUTPUT_ROUTES: Record<string, string> = {
  memo: '/ai-studio?tab=infographic',
  summary: '/ai-studio?tab=memo',
  'lesson-plan': '/editor?type=lesson_plan',
  exercises: '/editor?type=exercise_sheet',
  exam: '/editor?type=exam',
  worksheet: '/editor?type=exercise_sheet',
  series: '/series/new',
  article: '/article-studio',
  solve: '/solve',
  similar: '/generate',
};

/** First tab of the creation bar: "مركز الإنشاء" lands here. */
const DEFAULT_ROUTE = '/ai-studio?tab=infographic';

/**
 * `/create` has no page of its own: the tools are tabs (CreateTabsComponent). This only forwards,
 * carrying a chapter picked in the programme (`?topicId=`) as a pre-fill for the tool's form.
 */
@Component({
  selector: 'app-create-hub',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class CreateHubComponent implements OnInit {
  private readonly store = inject(EducationStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  ngOnInit() {
    const params = this.route.snapshot.queryParamMap;
    const ch = chapterById(params.get('topicId'));
    if (ch) {
      const language = ch.subject === 'Français' || ch.subject === 'Anglais' ? 'fr' : 'ar';
      const prefill: SourceInput = {
        mode: 'topic',
        topic: chapterTitle(ch, language),
        topicId: ch.id,
        grade: ch.grade,
        subject: ch.subject,
        trimester: ch.trimester,
        language,
      };
      this.store.prefillSource.set(prefill);
    }
    const target = OUTPUT_ROUTES[params.get('output') ?? ''] ?? DEFAULT_ROUTE;
    void this.router.navigateByUrl(target, { replaceUrl: true });
  }
}
