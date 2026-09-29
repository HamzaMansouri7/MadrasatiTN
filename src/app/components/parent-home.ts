import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { EducationStore } from '../services/education-store';
import { LanguageService } from '../services/language.service';

@Component({
  selector: 'app-parent-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <div class="space-y-6">
      
      <!-- Parent Header Banner -->
      <div class="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div class="absolute right-0 top-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
        
        <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div class="space-y-2">
            <div class="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs px-3 py-1 rounded-full font-semibold">
              <span class="material-icons text-sm">verified_user</span> {{ lang.t('parentTitle') }}
            </div>
            
            <div class="flex items-center gap-3 pt-1">
              <img [src]="store.activeStudent().avatarUrl" alt="Student" class="w-14 h-14 rounded-full border-2 border-indigo-400 object-cover shadow-sm" />
              <div>
                <h1 class="text-2xl font-black tracking-tight flex items-center gap-2">
                  {{ store.activeStudent().name }}
                  <span class="text-xs bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 px-2.5 py-0.5 rounded-full font-semibold">
                    {{ store.activeStudent().grade }}
                  </span>
                </h1>
                <p class="text-xs text-indigo-200">{{ store.activeStudent().school }}</p>
              </div>
            </div>
          </div>

          <!-- Sibling Switcher -->
          <div class="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 space-y-1.5 shrink-0">
            <p class="text-[11px] text-indigo-200 font-semibold uppercase tracking-wider">
              {{ lang.t('switchChild') }}
            </p>
            <div class="flex items-center gap-2">
              @for (st of store.students(); track st.id) {
                <button
                  (click)="store.setActiveStudent(st.id)"
                  [class]="store.activeStudentId() === st.id ? 'bg-white text-indigo-900 font-extrabold shadow-sm' : 'bg-white/10 text-white hover:bg-white/20 font-medium'"
                  class="px-3.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-2">
                  <span class="material-icons text-sm">face</span>
                  {{ st.name }}
                </button>
              }
            </div>
          </div>
        </div>
      </div>

      <!-- Today's Learning Summary & Progress Overview -->
      <div class="grid md:grid-cols-3 gap-6">
        
        <!-- Left 2 Cols: Announcements & Agenda -->
        <div class="md:col-span-2 space-y-6">
          
          <!-- Official Teacher Announcements (Replacing FB Groups) -->
          <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <div class="flex items-center gap-2">
                <span class="material-icons text-rose-600">campaign</span>
                <div>
                  <h3 class="font-extrabold text-slate-900 text-base">{{ lang.t('announcementsTitle') }}</h3>
                  <p class="text-xs text-slate-500">
                    {{ lang.t('announcementsSub') }} {{ store.activeStudent().name }}
                  </p>
                </div>
              </div>
              <span class="bg-rose-50 text-rose-700 font-bold text-xs px-3 py-1 rounded-full border border-rose-200">
                {{ store.classAnnouncements().length }} {{ lang.tr('annonces actives', 'إعلانات جارية') }}
              </span>
            </div>

            <div class="space-y-4">
              @for (a of store.classAnnouncements(); track a.id) {
                <div class="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex items-center gap-2.5">
                      <img [src]="a.teacherAvatar" alt="Teacher" class="w-9 h-9 rounded-full object-cover border border-slate-300" />
                      <div>
                        <h4 class="font-bold text-slate-900 text-xs">{{ a.title }}</h4>
                        <p class="text-[10px] text-slate-500">{{ a.teacherName }} • {{ a.date }}</p>
                      </div>
                    </div>

                    @if (a.isPinned) {
                      <span class="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span class="material-icons text-[12px]">push_pin</span> {{ lang.tr('Examen', 'امتحان') }}
                      </span>
                    }
                  </div>

                  <p class="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200/80 leading-relaxed">
                    {{ a.content }}
                  </p>

                  <div class="flex items-center justify-between pt-1">
                    <button
                      (click)="confirmRead(a.id)"
                      [disabled]="confirmedIds().has(a.id)"
                      [class]="confirmedIds().has(a.id) 
                        ? 'bg-emerald-100 text-emerald-800 font-bold' 
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer'"
                      class="text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all">
                      <span class="material-icons text-sm">check_circle</span>
                      {{ confirmedIds().has(a.id) ? lang.t('readConfirmed') : lang.t('confirmReadBtn') }}
                    </button>

                    <span class="text-[11px] text-slate-400">
                      {{ a.confirmedByParentsCount }} {{ lang.tr('parents ont validé', 'أولياء قاموا بالإعلام') }}
                    </span>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Active Homework & Deadlines -->
          <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <div class="flex items-center gap-2">
                <span class="material-icons text-amber-500">assignment</span>
                <h3 class="font-extrabold text-slate-900 text-base">
                  {{ lang.t('homeworksTitle') }} {{ store.activeStudent().name }}
                </h3>
              </div>
            </div>

            <div class="space-y-3">
              @for (hw of store.classHomeworks(); track hw.id) {
                <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div class="space-y-1">
                    <div class="flex items-center gap-2">
                      <span class="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {{ hw.subject }}
                      </span>
                      <h4 class="font-bold text-slate-900 text-xs">{{ hw.title }}</h4>
                    </div>
                    <p class="text-xs text-slate-600">{{ hw.instructions }}</p>
                  </div>

                  <div class="shrink-0 text-right">
                    <p class="text-xs text-rose-700 font-bold flex items-center gap-1 justify-end">
                      <span class="material-icons text-sm">schedule</span> {{ hw.dueDate }}
                    </p>
                    <span class="text-[11px] text-slate-500">
                      {{ hw.exercises.length }} {{ lang.tr('exercices inclus', 'تمارين مرفقة') }}
                    </span>
                  </div>
                </div>
              }
            </div>
          </div>

        </div>

        <!-- Right Col: Progress Metrics & Teacher Contacts -->
        <div class="space-y-6">
          
          <!-- Subject Performance Cards -->
          <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div class="border-b border-slate-100 pb-3">
              <h3 class="font-extrabold text-slate-900 text-base">{{ lang.t('progressTitle') }}</h3>
              <p class="text-xs text-slate-500">
                {{ lang.tr('Progression moyenne dans le programme', 'المعدل والنسبة التقديرية لإنجاز البرنامج') }}
              </p>
            </div>

            <div class="space-y-3">
              @for (sp of store.activeStudent().subjectsProgress; track sp.subject) {
                <div class="space-y-1">
                  <div class="flex items-center justify-between text-xs font-semibold">
                    <span class="text-slate-800">{{ sp.subject }}</span>
                    <span class="font-bold text-slate-900">{{ sp.score }}%</span>
                  </div>
                  <div class="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all duration-500"
                      [style.width.%]="sp.score"
                      [style.backgroundColor]="sp.color"></div>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Teacher Contact & Office Hours -->
          <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div class="border-b border-slate-100 pb-3">
              <h3 class="font-extrabold text-slate-900 text-base">{{ lang.t('teachersTitle') }}</h3>
              <p class="text-xs text-slate-500">
                {{ lang.tr('Contact direct et professionnel sans spam', 'التواصل المباشر مع المعلمين بكل تحفّظ ومهنية') }}
              </p>
            </div>

            <div class="space-y-3">
              @for (t of store.teachers(); track t.id) {
                <div class="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <img [src]="t.avatarUrl" alt="Teacher" class="w-10 h-10 rounded-full object-cover border border-slate-300" />
                    <div>
                      <h4 class="font-bold text-slate-900 text-xs">{{ t.name }}</h4>
                      <p class="text-[10px] text-slate-500">{{ t.subjects.join(', ') }}</p>
                    </div>
                  </div>

                  <button
                    (click)="contactTeacher(t.name)"
                    class="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] px-3 py-1.5 rounded-xl border border-indigo-200 flex items-center gap-1 cursor-pointer">
                    <span class="material-icons text-xs">chat</span> {{ lang.t('messageBtn') }}
                  </button>
                </div>
              }
            </div>
          </div>

        </div>

      </div>
    </div>
  `,
})
export class ParentHomeComponent {
  readonly store = inject(EducationStore);
  readonly lang = inject(LanguageService);

  readonly confirmedIds = signal<Set<string>>(new Set());

  confirmRead(id: string) {
    this.store.confirmAnnouncementRead(id);
    const newSet = new Set(this.confirmedIds());
    newSet.add(id);
    this.confirmedIds.set(newSet);
  }

  contactTeacher(teacherName: string) {
    const msg = this.lang.tr(
      `Messagerie sécurisée envoyée à ${teacherName}. L'enseignant vous répondra durant ses heures de permanence.`,
      `تم إرسال الرسالة بنجاح إلى المعلم(ة) ${teacherName}. سيتم إجابتكم في أوقات التواصل المخصصة.`
    );
    alert(msg);
  }
}
