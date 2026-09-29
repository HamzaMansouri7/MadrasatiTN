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
                    (click)="openTeacherContact(t)"
                    class="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] px-3 py-1.5 rounded-xl border border-indigo-200 flex items-center gap-1 cursor-pointer">
                    <span class="material-icons text-xs">chat</span> {{ lang.t('messageBtn') }}
                  </button>
                </div>
              }
            </div>
          </div>

        </div>

      </div>

      <!-- DIRECT TEACHER MESSAGING MODAL -->
      @if (activeContactTeacher(); as teacher) {
        <div class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div class="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <div class="flex items-center gap-2">
                <span class="material-icons text-indigo-600">forum</span>
                <h3 class="font-bold text-slate-900 text-base">
                  {{ lang.tr('Contacter', 'مراسلة المعلم(ة)') }} {{ teacher.name }}
                </h3>
              </div>
              <button (click)="activeContactTeacher.set(null)" class="text-slate-400 hover:text-slate-600 cursor-pointer">
                <span class="material-icons">close</span>
              </button>
            </div>

            <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <img [src]="teacher.avatarUrl" alt="Teacher" class="w-12 h-12 rounded-full object-cover border border-slate-300" />
              <div>
                <p class="font-bold text-slate-900 text-xs">{{ teacher.name }}</p>
                <p class="text-[11px] text-slate-500">{{ teacher.title }}</p>
                <p class="text-[10px] text-emerald-700 font-semibold mt-0.5">
                  {{ lang.tr('Élève concerné :', 'التلميذ المعني:') }} <strong>{{ store.activeStudent().name }} ({{ store.activeStudent().grade }})</strong>
                </p>
              </div>
            </div>

            @if (messageSentSuccess()) {
              <div class="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 text-emerald-950 text-center space-y-2">
                <span class="material-icons text-emerald-600 text-3xl">check_circle</span>
                <h4 class="font-bold text-sm">{{ lang.tr('Message transmis avec succès !', 'تم إرسال رسالتكم بنجاح!') }}</h4>
                <p class="text-xs text-emerald-800">
                  {{ lang.tr("L'enseignant vous répondra durant ses heures de permanence sur Madrasati TN.", 'سيصلكم الرد في فضاء الأولياء خلال أوقات التواصل الرسمية.') }}
                </p>
                <button
                  (click)="activeContactTeacher.set(null)"
                  class="mt-2 bg-emerald-600 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer">
                  {{ lang.tr('Fermer', 'إغلاق') }}
                </button>
              </div>
            } @else {
              <div class="space-y-3 text-xs">
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">
                    {{ lang.tr('Objet du message', 'موضوع الرسالة') }}
                  </label>
                  <select
                    [value]="messageSubject()"
                    (change)="messageSubject.set($any($event.target).value)"
                    class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none">
                    <option value="Question sur un devoir">Question sur un devoir / سؤال حول واجب</option>
                    <option value="Absence ou retard prévisible">Absence ou retard prévisible / إشعار بغياب أو تأخير</option>
                    <option value="Demande de rendez-vous">Demande de rendez-vous / طلب موعد لمقابلة المعلم</option>
                    <option value="Évolution des résultats">Évolution des résultats / استفسار حول النتائج</option>
                  </select>
                </div>

                <div>
                  <label class="block font-semibold text-slate-700 mb-1">
                    {{ lang.tr('Votre message', 'نص الرسالة') }}
                  </label>
                  <textarea
                    [value]="messageBody()"
                    (input)="messageBody.set($any($event.target).value)"
                    rows="4"
                    placeholder="Rédigez votre message avec bienveillance et clarté..."
                    class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none"></textarea>
                </div>

                <div class="flex items-center gap-2 pt-2">
                  <button
                    (click)="sendMessageToTeacher()"
                    class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl cursor-pointer shadow-xs">
                    {{ lang.tr('Envoyer via la Plateforme', 'إرسال الرسالة عبر المنصة') }}
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class ParentHomeComponent {
  readonly store = inject(EducationStore);
  readonly lang = inject(LanguageService);

  readonly confirmedIds = signal<Set<string>>(new Set());
  readonly activeContactTeacher = signal<any | null>(null);
  readonly messageSubject = signal('Question sur un devoir');
  readonly messageBody = signal('');
  readonly messageSentSuccess = signal<boolean>(false);

  confirmRead(id: string) {
    this.store.confirmAnnouncementRead(id);
    const newSet = new Set(this.confirmedIds());
    newSet.add(id);
    this.confirmedIds.set(newSet);
  }

  openTeacherContact(teacher: any) {
    this.messageSentSuccess.set(false);
    this.messageBody.set('');
    this.activeContactTeacher.set(teacher);
  }

  sendMessageToTeacher() {
    this.messageSentSuccess.set(true);
  }
}
