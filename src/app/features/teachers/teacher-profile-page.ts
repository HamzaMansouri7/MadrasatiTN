import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import {
  EducationStore,
  LanguageService,
  TeacherProfile,
  TeacherProfileService,
  TeacherStats,
} from '@core';
import { TeacherAvatarComponent } from '@shared';

@Component({
  selector: 'app-teacher-profile-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TeacherAvatarComponent],
  template: `
    <div class="min-h-screen bg-[#F4F6F5] py-8 px-4 sm:px-6 lg:px-8">
      <div class="max-w-5xl mx-auto space-y-6">

        <!-- Back Link & Top Bar -->
        <div class="flex items-center justify-between gap-4">
          <a routerLink="/teachers"
             class="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2D6A4F] hover:underline cursor-pointer">
            <span class="material-icons text-sm rtl:rotate-180">arrow_back</span>
            <span>{{ lang.tr('Retour à l’annuaire', 'العودة إلى دليل المعلمين') }}</span>
          </a>

          <!-- Share Button -->
          <button
            type="button"
            (click)="shareProfile()"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#FBF8F1] text-[#14251D] border border-[#CBD9E2] rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer">
            <span class="material-icons text-sm">{{ shareCopied() ? 'check' : 'share' }}</span>
            <span>{{ shareCopied() ? lang.tr('Lien copié ✓', 'تم نسخ الرابط ✓') : lang.tr('Partager le profil', 'مشاركة الملف') }}</span>
          </button>
        </div>

        @if (isLoading()) {
          <div class="bg-white rounded-2xl border border-[#E7DFCF] p-16 text-center space-y-3 shadow-xs">
            <span class="material-icons text-4xl text-[#2D6A4F] animate-spin">sync</span>
            <p class="text-sm font-medium text-[#5B6B60]">{{ lang.tr('Chargement du profil…', 'جارٍ تحميل الملف البيداغوجي…') }}</p>
          </div>
        } @else if (!teacher()) {
          <!-- Friendly 404 state -->
          <div class="bg-white rounded-2xl border border-[#E7DFCF] p-16 text-center space-y-4 shadow-xs">
            <span class="material-icons text-5xl text-[#829AB1]/60">person_off</span>
            <h2 class="font-display font-bold text-lg text-[#14251D]">
              {{ lang.tr('Enseignant introuvable', 'المعلم غير موجود') }}
            </h2>
            <p class="text-xs text-[#5B6B60] max-w-[40ch] mx-auto">
              {{ lang.tr('Ce profil n’existe pas ou a été mis à jour récemment.', 'هذا الملف غير متوفر أو تم تحديثه مؤخراً.') }}
            </p>
            <a routerLink="/teachers"
               class="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2D6A4F] text-white font-bold rounded-xl text-xs shadow-xs hover:bg-[#1B4332] transition-colors">
              <span>{{ lang.tr('Consulter tous les enseignants', 'تصفح جميع المعلمين') }}</span>
            </a>
          </div>
        } @else {
          <!-- Profile Card Header -->
          <div class="bg-white rounded-3xl border border-[#E7DFCF] p-6 sm:p-8 shadow-xs space-y-6">
            <div class="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-start">
              
              <!-- Avatar -->
              <div class="relative shrink-0">
                <app-teacher-avatar
                  [name]="teacher()?.displayName || teacher()?.name"
                  [avatarUrl]="teacher()?.avatarUrl"
                  [avatarId]="teacher()?.avatarId"
                  [gender]="teacher()?.gender"
                  size="2xl" />
                
                @if (teacher()?.verified === 'verified') {
                  <span class="material-icons absolute bottom-0 right-0 rtl:right-auto rtl:left-0 bg-[#2D6A4F] text-[#FBF8F1] rounded-full text-lg p-1 border-2 border-white shadow-xs"
                        [title]="lang.tr('Enseignant Certifié Éducation Nationale', 'معلم معتمد وموثق لدى المنصة')">
                    verified
                  </span>
                }
              </div>

              <!-- Main Info -->
              <div class="flex-1 min-w-0 space-y-2">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div class="flex items-center justify-center sm:justify-start gap-2">
                      <h1 class="font-display font-bold text-xl sm:text-2xl text-[#14251D]">
                        {{ teacher()?.displayName || teacher()?.name }}
                      </h1>
                      <span class="text-[#2D6A4F] font-bold bg-[#E8F5FC] border border-[#2D6A4F]/20 px-2 py-0.5 rounded-full text-[10px]">
                        TN
                      </span>
                    </div>
                    <p class="text-xs sm:text-sm font-semibold text-[#5B6B60] mt-0.5">
                      {{ teacher()?.title }}
                    </p>
                  </div>

                  <!-- Follow / Watchlist Button -->
                  <button
                    type="button"
                    (click)="store.toggleWatchlist(teacher()!.id, 'teacher')"
                    [class]="store.isWatched(teacher()!.id, 'teacher') ? 'bg-[#F2ECDE] text-[#8A5A00] border-[#8A5A00]/40 font-bold' : 'bg-[#FBF8F1] hover:bg-[#F2ECDE] text-[#14251D] border-[#CBD9E2] font-semibold'"
                    class="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs border transition-colors shadow-2xs cursor-pointer">
                    <span class="material-icons text-sm">{{ store.isWatched(teacher()!.id, 'teacher') ? 'bookmark' : 'bookmark_border' }}</span>
                    <span>{{ store.isWatched(teacher()!.id, 'teacher') ? lang.tr('Suivi', 'متابع') : lang.tr('Suivre cet enseignant', 'متابعة هذا المعلم') }}</span>
                  </button>
                </div>

                <!-- School & Delegation -->
                <div class="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-[#2D6A4F]">
                  <span class="inline-flex items-center gap-1 font-semibold">
                    <span class="material-icons text-sm">school</span>
                    <span>{{ teacher()?.school }}</span>
                  </span>
                  @if (teacher()?.delegation) {
                    <span class="text-[#829AB1]">•</span>
                    <span class="inline-flex items-center gap-1 text-[#5B6B60]">
                      <span class="material-icons text-sm">location_on</span>
                      <span>{{ teacher()?.delegation }}</span>
                    </span>
                  }
                </div>

                <!-- Bio -->
                @if (teacher()?.bio) {
                  <p class="text-xs sm:text-sm text-[#4A5A50] leading-relaxed bg-[#FBF8F1] p-4 rounded-2xl border border-[#E7DFCF] mt-3">
                    {{ teacher()?.bio }}
                  </p>
                }
              </div>
            </div>

            <!-- Subject & Grade Tags -->
            <div class="flex flex-wrap items-center gap-2 pt-4 border-t border-[#E7DFCF]">
              @for (subject of teacher()?.subjects || []; track subject) {
                <span class="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#E8F5FC] text-[#007CC2] border border-[#007CC2]/20 text-xs font-semibold">
                  <span class="material-icons text-xs">book</span>
                  <span>{{ lang.translateSubject(subject) }}</span>
                </span>
              }
              @for (grade of teacher()?.taughtGrades || []; track grade) {
                <span class="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#F2ECDE] text-[#8A5A00] border border-[#8A5A00]/20 text-xs font-semibold">
                  <span class="material-icons text-xs">grade</span>
                  <span>{{ lang.translateGrade(grade) }}</span>
                </span>
              }
            </div>

            <!-- Real Stats Row -->
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div class="bg-[#F7F9FB] rounded-2xl p-4 text-center border border-[#E6EEF3]">
                <p class="font-display font-bold text-xl text-[#14251D]">
                  {{ stats()?.coursesCount || 0 }}
                </p>
                <p class="text-xs text-[#6B7A70] font-medium mt-0.5">
                  {{ lang.tr('Fiches & Cours A4', 'الدروس والوثائق A4') }}
                </p>
              </div>

              <div class="bg-[#F7F9FB] rounded-2xl p-4 text-center border border-[#E6EEF3]">
                <p class="font-display font-bold text-xl text-[#14251D]">
                  {{ stats()?.exercisesCount || 0 }}
                </p>
                <p class="text-xs text-[#6B7A70] font-medium mt-0.5">
                  {{ lang.tr('Séries d’exercices', 'سلاسل التمارين') }}
                </p>
              </div>

              <div class="col-span-2 sm:col-span-1 bg-[#F7F9FB] rounded-2xl p-4 text-center border border-[#E6EEF3]">
                @if ((stats()?.totalDocuments || 0) === 0) {
                  <span class="inline-block font-display font-bold text-sm text-[#2D6A4F] bg-[#2D6A4F]/10 px-3 py-1 rounded-full">
                    {{ lang.tr('Nouvel auteur certifié', 'مربٍ مسجل حديثاً') }}
                  </span>
                  <p class="text-[11px] text-[#6B7A70] mt-1">
                    {{ lang.tr('Contributions en cours', 'المشاركات قيد النشر') }}
                  </p>
                } @else {
                  <p class="font-display font-bold text-xl text-[#2D6A4F]">
                    {{ stats()?.totalDocuments }}
                  </p>
                  <p class="text-xs text-[#6B7A70] font-medium mt-0.5">
                    {{ lang.tr('Total ressources publiées', 'مجموع الموارد المنشورة') }}
                  </p>
                }
              </div>
            </div>
          </div>

          <!-- Published Resources Section -->
          <div class="bg-white rounded-3xl border border-[#E7DFCF] p-6 sm:p-8 shadow-xs space-y-6">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E7DFCF] pb-4">
              <div class="flex items-center gap-2">
                <span class="material-icons text-[#2D6A4F]">menu_book</span>
                <h2 class="font-display font-bold text-lg text-[#14251D]">
                  {{ lang.tr('Ressources pédagogiques publiées', 'الموارد البيداغوجية المنشورة') }}
                </h2>
              </div>

              <!-- Content Filter Tabs -->
              <div class="flex items-center gap-1 bg-[#F2ECDE]/60 p-1 rounded-xl text-xs">
                <button
                  type="button"
                  (click)="activeContentTab.set('all')"
                  [class]="activeContentTab() === 'all' ? 'bg-white text-[#14251D] font-bold shadow-xs' : 'text-[#6B7A70] hover:text-[#14251D]'"
                  class="px-3 py-1.5 rounded-lg transition-all cursor-pointer">
                  {{ lang.tr('Tout', 'الكل') }}
                </button>
                <button
                  type="button"
                  (click)="activeContentTab.set('courses')"
                  [class]="activeContentTab() === 'courses' ? 'bg-white text-[#14251D] font-bold shadow-xs' : 'text-[#6B7A70] hover:text-[#14251D]'"
                  class="px-3 py-1.5 rounded-lg transition-all cursor-pointer">
                  {{ lang.tr('Fiches A4', 'وثائق A4') }}
                </button>
                <button
                  type="button"
                  (click)="activeContentTab.set('exercises')"
                  [class]="activeContentTab() === 'exercises' ? 'bg-white text-[#14251D] font-bold shadow-xs' : 'text-[#6B7A70] hover:text-[#14251D]'"
                  class="px-3 py-1.5 rounded-lg transition-all cursor-pointer">
                  {{ lang.tr('Exercices', 'تمارين') }}
                </button>
              </div>
            </div>

            <!-- Author's Resources List -->
            @if (filteredAuthorCourses().length === 0) {
              <div class="text-center py-12 text-[#829AB1] space-y-2">
                <span class="material-icons text-3xl opacity-60">folder_open</span>
                <p class="text-xs">
                  {{ lang.tr('Aucun document publié pour le moment dans cette catégorie.', 'لا توجد وثائق منشورة حالياً ضمن هذا التصنيف.') }}
                </p>
              </div>
            } @else {
              <div class="grid sm:grid-cols-2 gap-4">
                @for (c of filteredAuthorCourses(); track c.id) {
                  <div class="p-4 rounded-2xl bg-[#FBF8F1] border border-[#E7DFCF] hover:border-[#2D6A4F] transition-colors space-y-3">
                    <div class="flex items-start justify-between gap-2">
                      <div class="space-y-1">
                        <span class="text-[10px] font-bold uppercase tracking-wider text-[#2D6A4F] bg-[#2D6A4F]/10 px-2 py-0.5 rounded-md">
                          {{ lang.translateSubject(c.subject) }} • {{ lang.translateGrade(c.grade) }}
                        </span>
                        <h4 class="text-xs sm:text-sm font-bold text-[#14251D] line-clamp-2">
                          {{ c.title }}
                        </h4>
                      </div>
                      <span class="material-icons text-[#007CC2] text-lg">description</span>
                    </div>

                    <p class="text-[11px] text-[#5B6B60] line-clamp-2 leading-relaxed">
                      {{ c.summary || c.content }}
                    </p>

                    <div class="flex items-center justify-between pt-2 border-t border-[#E7DFCF] text-xs">
                      <span class="text-[10px] text-[#829AB1]">{{ c.createdAt }}</span>
                      <a [routerLink]="['/discovery']" [queryParams]="{ doc: c.id }"
                         class="text-xs font-bold text-[#2D6A4F] hover:underline flex items-center gap-1">
                        <span>{{ lang.tr('Consulter & Imprimer', 'معاينة وطباعة') }}</span>
                        <span class="material-icons text-xs rtl:rotate-180">arrow_forward</span>
                      </a>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }

      </div>
    </div>
  `,
})
export class TeacherProfilePageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly store = inject(EducationStore);
  readonly lang = inject(LanguageService);
  private readonly profileService = inject(TeacherProfileService);
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);

  readonly teacher = signal<TeacherProfile | null>(null);
  readonly stats = signal<TeacherStats | null>(null);
  readonly isLoading = signal<boolean>(true);
  readonly shareCopied = signal<boolean>(false);
  readonly activeContentTab = signal<'all' | 'courses' | 'exercises'>('all');

  readonly authorCourses = computed(() => {
    const t = this.teacher();
    if (!t) return [];
    const name = t.displayName || t.name;
    return this.store.courses().filter((c) => c.authorId === t.id || c.teacherName === name);
  });

  readonly filteredAuthorCourses = computed(() => {
    const tab = this.activeContentTab();
    const list = this.authorCourses();
    if (tab === 'courses') {
      return list.filter((c) => c.docType === 'Fiche de Cours' || c.docType === 'Manuel Scolaire' || c.docType === 'Fiche Mémento');
    }
    if (tab === 'exercises') {
      return list.filter((c) => c.docType !== 'Fiche de Cours' && c.docType !== 'Manuel Scolaire' && c.docType !== 'Fiche Mémento');
    }
    return list;
  });

  async ngOnInit() {
    this.route.paramMap.subscribe(async (params) => {
      const id = params.get('id');
      if (!id) {
        this.isLoading.set(false);
        return;
      }

      this.isLoading.set(true);

      // Try fetching profile from Firestore or local store
      let profile = await this.profileService.getTeacherProfile(id);
      if (!profile) {
        const local = this.store.teachers().find((t) => t.id === id);
        if (local) profile = local;
      }

      this.teacher.set(profile);
      this.isLoading.set(false);

      if (profile) {
        const name = profile.displayName || profile.name;
        this.titleService.setTitle(`${name} | ${profile.title} - مدرستي تونس`);
        this.metaService.updateTag({
          name: 'description',
          content: profile.bio || `Profil pédagogique de ${name}, ${profile.title} sur Madrasati TN.`,
        });

        // Load stats
        const realStats = await this.profileService.getTeacherStats(id);
        this.stats.set(realStats);
      }
    });
  }

  shareProfile() {
    if (typeof window === 'undefined') return;
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: this.teacher()?.displayName || this.teacher()?.name || 'Profil Enseignant',
        url,
      }).catch(() => undefined);
    } else {
      navigator.clipboard.writeText(url).then(() => {
        this.shareCopied.set(true);
        setTimeout(() => this.shareCopied.set(false), 2500);
      }).catch(() => undefined);
    }
  }
}
