import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  EducationStore,
  LanguageService,
  GradeLevel,
  PRIMARY_GRADES,
  TUNISIAN_CURRICULUM_CHAPTERS,
  CurriculumChapter,
  CNP_PRIMARY_COURSES,
  Course,
} from '@core';

interface TrimesterGroup {
  trimester: 'Trimestre 1' | 'Trimestre 2' | 'Trimestre 3';
  labelAr: string;
  labelFr: string;
  colorClass: string;
  badgeBg: string;
  topics: CurriculumChapter[];
}

@Component({
  selector: 'app-programme-home',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './programme-home.html',
})
export class ProgrammeHomeComponent {
  readonly store = inject(EducationStore);
  readonly lang = inject(LanguageService);
  readonly router = inject(Router);

  readonly grades = PRIMARY_GRADES;
  readonly selectedGrade = signal<GradeLevel>('4ème Année');
  readonly selectedSubject = signal<string>('all');
  readonly searchQuery = signal<string>('');
  readonly expandedTopicId = signal<string | null>(null);

  // Subject allocation mapping per grade according to official ministry standards
  readonly officialSubjectsByGrade: Record<GradeLevel, string[]> = {
    '1ère Année': ['اللغة العربية', 'Mathématiques', 'Éducation Islamique'],
    '2ème Année': ['اللغة العربية', 'Mathématiques', 'Français', 'Éducation Islamique'],
    '3ème Année': ['اللغة العربية', 'Mathématiques', 'Français', 'Éveil Scientifique', 'Éducation Islamique'],
    '4ème Année': ['اللغة العربية', 'Mathématiques', 'Français', 'Éveil Scientifique', 'Anglais', 'Éducation Islamique'],
    '5ème Année': ['اللغة العربية', 'Mathématiques', 'Français', 'Éveil Scientifique', 'Histoire & Géographie', 'Anglais', 'Éducation Islamique'],
    '6ème Année': ['اللغة العربية', 'Mathématiques', 'Français', 'Éveil Scientifique', 'Histoire & Géographie', 'Anglais', 'Éducation Islamique'],
    '7ème de base': ['Mathématiques', 'Français', 'اللغة العربية'],
    '8ème de base': ['Mathématiques', 'Français', 'اللغة العربية'],
    '9ème de base': ['Mathématiques', 'Français', 'اللغة العربية'],
    'Baccalauréat': ['Mathématiques', 'Français', 'اللغة العربية'],
  };

  readonly availableSubjects = computed(() => {
    const grade = this.selectedGrade();
    return this.officialSubjectsByGrade[grade] || [
      'اللغة العربية',
      'Mathématiques',
      'Français',
      'Éveil Scientifique',
      'Histoire & Géographie',
    ];
  });

  // Filtered chapters for the selected grade and subject
  readonly filteredChapters = computed(() => {
    const grade = this.selectedGrade();
    const subject = this.selectedSubject();
    const q = this.searchQuery().trim().toLowerCase();

    return TUNISIAN_CURRICULUM_CHAPTERS.filter((ch) => {
      if (ch.grade !== grade) return false;
      if (subject !== 'all' && ch.subject !== subject) return false;
      if (!q) return true;

      const titleAr = (ch.titleAr || '').toLowerCase();
      const titleFr = (ch.titleFr || '').toLowerCase();
      const titleEn = (ch.titleEn || '').toLowerCase();
      const subj = (ch.subject || '').toLowerCase();
      return (
        titleAr.includes(q) ||
        titleFr.includes(q) ||
        titleEn.includes(q) ||
        subj.includes(q)
      );
    });
  });

  // Trimester columns breakdown
  readonly trimesterColumns = computed<TrimesterGroup[]>(() => {
    const chapters = this.filteredChapters();

    const t1Topics = chapters.filter((c) => c.trimester === 'Trimestre 1');
    const t2Topics = chapters.filter((c) => c.trimester === 'Trimestre 2');
    const t3Topics = chapters.filter((c) => c.trimester === 'Trimestre 3');

    return [
      {
        trimester: 'Trimestre 1',
        labelAr: 'الثلاثي الأول',
        labelFr: '1er Trimestre',
        colorClass: 'border-emerald-500 bg-emerald-50/40 text-emerald-900',
        badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        topics: t1Topics,
      },
      {
        trimester: 'Trimestre 2',
        labelAr: 'الثلاثي الثاني',
        labelFr: '2ème Trimestre',
        colorClass: 'border-amber-500 bg-amber-50/40 text-amber-900',
        badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
        topics: t2Topics,
      },
      {
        trimester: 'Trimestre 3',
        labelAr: 'الثلاثي الثالث',
        labelFr: '3ème Trimestre',
        colorClass: 'border-indigo-500 bg-indigo-50/40 text-indigo-900',
        badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        topics: t3Topics,
      },
    ];
  });

  // Statistics
  readonly totalGradeTopics = computed(() => {
    return TUNISIAN_CURRICULUM_CHAPTERS.filter(
      (c) => c.grade === this.selectedGrade()
    ).length;
  });

  readonly confirmedTopicsCount = computed(() => {
    return TUNISIAN_CURRICULUM_CHAPTERS.filter(
      (c) => c.grade === this.selectedGrade() && c.status === 'confirmed'
    ).length;
  });

  readonly relatedCnpBooks = computed<Course[]>(() => {
    const grade = this.selectedGrade();
    const subject = this.selectedSubject();
    return CNP_PRIMARY_COURSES.filter((b) => {
      if (b.grade !== grade) return false;
      if (subject !== 'all' && b.subject !== subject) return false;
      return true;
    });
  });

  setGrade(grade: GradeLevel) {
    this.selectedGrade.set(grade);
    this.selectedSubject.set('all');
    this.expandedTopicId.set(null);
  }

  setSubject(subject: string) {
    this.selectedSubject.set(subject);
  }

  toggleExpand(topicId: string) {
    this.expandedTopicId.update((curr) => (curr === topicId ? null : topicId));
  }

  /** Thumbnails exist for Arabic and Éveil rows only (their TOC page numbers are verified). */
  hasThumb(topic: CurriculumChapter): boolean {
    return /^(ar|sci)-/.test(topic.id);
  }

  goToGenerator(topic: CurriculumChapter) {
    const title = this.lang.isArabic() ? topic.titleAr : topic.titleFr;
    this.router.navigate(['/generate'], {
      queryParams: {
        grade: topic.grade,
        subject: topic.subject,
        topic: title,
        topicId: topic.id,
      },
    });
  }

  goToDiscovery(topic: CurriculumChapter) {
    this.router.navigate(['/discovery'], { queryParams: { topicId: topic.id } });
  }

  goToCreateStudio(topic: CurriculumChapter) {
    this.router.navigate(['/create'], {
      queryParams: {
        grade: topic.grade,
        subject: topic.subject,
        topicId: topic.id,
      },
    });
  }

  getSubjectIcon(subject: string): string {
    switch (subject) {
      case 'Mathématiques':
        return 'calculate';
      case 'Français':
        return 'menu_book';
      case 'اللغة العربية':
        return 'auto_stories';
      case 'Éveil Scientifique':
        return 'biotech';
      case 'Histoire & Géographie':
        return 'public';
      case 'Anglais':
        return 'language';
      case 'Éducation Islamique':
        return 'mosque';
      default:
        return 'menu_book';
    }
  }

  getSubjectBadgeColor(subject: string): string {
    switch (subject) {
      case 'Mathématiques':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Français':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'اللغة العربية':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Éveil Scientifique':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'Histoire & Géographie':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Anglais':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Éducation Islamique':
        return 'bg-green-50 text-green-700 border-green-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  }
}
