import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { EducationStore } from '../services/education-store';
import { LanguageService } from '../services/language.service';
import { ExerciseItem, Homework } from '../models/education.model';

export interface TutorExplanation {
  explanation: string;
  analogy?: string;
  checkQuestion?: string;
}

@Component({
  selector: 'app-student-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <div class="space-y-6">
      
      <!-- Student Banner -->
      <div class="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div class="absolute right-0 bottom-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div class="space-y-2">
            <div class="inline-flex items-center gap-2 bg-white/20 text-white border border-white/30 text-xs px-3 py-1 rounded-full font-bold">
              <span class="material-icons text-sm">local_fire_department</span>
              {{ store.activeStudent().streakDays }} {{ lang.t('streakLabel') }}
            </div>
            
            <h1 class="text-2xl sm:text-3xl font-black tracking-tight">
              {{ lang.tr('Bonjour', 'مرحباً') }} {{ store.activeStudent().name }} ! 👋
            </h1>
            <p class="text-amber-100 text-xs sm:text-sm max-w-lg">
              {{ lang.t('studentSub') }}
            </p>
          </div>

          <!-- Gamification Points Card -->
          <div class="bg-white/15 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-center shrink-0">
            <p class="text-[11px] text-amber-200 font-bold uppercase tracking-wider">
              {{ lang.t('successPoints') }}
            </p>
            <p class="text-3xl font-black text-white my-0.5">🏆 {{ store.activeStudent().totalPoints }}</p>
            <p class="text-[11px] font-semibold text-amber-100">
              42 {{ lang.tr('exercices résolus', 'تمرين منجز بنجاح') }}
            </p>
          </div>
        </div>
      </div>

      <!-- Main Student Sections Grid -->
      <div class="grid lg:grid-cols-3 gap-6">
        
        <!-- Left 2 Cols: Homework & Active Practice -->
        <div class="lg:col-span-2 space-y-6">
          
          <!-- Homework Section -->
          <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <div class="flex items-center gap-2">
                <span class="material-icons text-amber-500">assignment</span>
                <h3 class="font-extrabold text-slate-900 text-base">{{ lang.t('myHomeworks') }}</h3>
              </div>
              <span class="text-xs text-amber-700 font-bold bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                {{ store.classHomeworks().length }} {{ lang.tr('devoirs enregistrés', 'واجبات مدرجة') }}
              </span>
            </div>

            <div class="space-y-4">
              @for (hw of store.classHomeworks(); track hw.id) {
                <div class="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                      {{ hw.subject }}
                    </span>
                    <span class="text-xs text-rose-700 font-bold flex items-center gap-1">
                      <span class="material-icons text-sm">schedule</span> {{ lang.tr('À rendre :', 'تاريخ التسليم:') }} {{ hw.dueDate }}
                    </span>
                  </div>

                  <div>
                    <h4 class="font-bold text-slate-900 text-sm">{{ hw.title }}</h4>
                    <p class="text-xs text-slate-600 mt-1">{{ hw.instructions }}</p>
                  </div>

                  <div class="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <span class="text-slate-700 font-medium">
                      {{ lang.tr('Contient', 'يتكون من') }} {{ hw.exercises.length }} {{ lang.tr('exercices', 'تمارين') }} (Total : {{ hw.totalPoints }} pts)
                    </span>
                    <button
                      (click)="startHomework(hw)"
                      class="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1">
                      <span class="material-icons text-sm">edit_note</span> {{ lang.t('solveBtn') }}
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Interactive Practice Bank -->
          <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <div class="flex items-center gap-2">
                <span class="material-icons text-emerald-600">fitness_center</span>
                <h3 class="font-extrabold text-slate-900 text-base">{{ lang.t('practiceZone') }}</h3>
              </div>
            </div>

            <div class="grid md:grid-cols-2 gap-4">
              @for (ex of store.exercisesBank(); track ex.id) {
                <div class="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3 flex flex-col justify-between">
                  <div class="space-y-1.5">
                    <div class="flex items-center justify-between text-[10px]">
                      <span class="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">{{ ex.subject }}</span>
                      <span class="text-slate-500 font-medium">{{ ex.difficulty }}</span>
                    </div>
                    <h4 class="font-bold text-slate-900 text-xs">{{ ex.title }}</h4>
                    <p class="text-xs text-slate-600 italic">"{{ ex.promptText }}"</p>
                  </div>

                  <button
                    (click)="openPracticeExercise(ex)"
                    class="bg-white hover:bg-slate-100 text-emerald-700 font-bold text-xs py-2 px-3 rounded-xl border border-slate-200 cursor-pointer flex items-center justify-center gap-1">
                    <span class="material-icons text-sm">psychology</span>
                    {{ lang.tr('Réfléchir & Voir Indices', 'التفكير وعرض الإرشادات') }}
                  </button>
                </div>
              }
            </div>
          </div>

        </div>

        <!-- Right Col: AI Tutor Helper & Quick Actions -->
        <div class="space-y-6">
          
          <!-- AI Tutor Helper Box -->
          <div class="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl p-6 border border-indigo-800 shadow-md space-y-4">
            <div class="flex items-center gap-2 border-b border-indigo-800/80 pb-3">
              <span class="material-icons text-amber-400 text-2xl">auto_awesome</span>
              <div>
                <h3 class="font-bold text-sm">{{ lang.t('aiTutorTitle') }}</h3>
                <p class="text-[11px] text-indigo-200">
                  {{ lang.tr('Pose une question sur tes cours !', 'اطرح أسئلتك واطلب تبسيط الدروس!') }}
                </p>
              </div>
            </div>

            <div class="space-y-3 text-xs">
              <p class="text-indigo-100 leading-relaxed">
                {{ lang.tr("Tu n'as pas bien compris une notion de Mathématiques, de Français ou de Sciences ? Demande-moi une explication simple !", 'لم تفهم جيدا قاعدة في الرياضيات، أو اللغة العربية أو العلوم؟ اسألني هنا وسأشرحها لك ببساطة!') }}
              </p>

              <label for="tutor-question-input" class="sr-only">Question pour le tuteur IA</label>
              <input
                id="tutor-question-input"
                type="text"
                [value]="tutorQuestion()"
                (input)="onTutorQuestionInput($event)"
                placeholder="Ex: Explique-moi la photosynthèse, اشرح لي الجملة الاسمية..."
                class="w-full bg-white/10 border border-white/20 text-white placeholder-indigo-300 rounded-xl p-3 outline-none text-xs" />

              <button
                [disabled]="isTutorLoading()"
                (click)="askTutorAi()"
                class="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold py-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2">
                @if (isTutorLoading()) {
                  <span class="material-icons animate-spin text-sm">sync</span>
                  <span>{{ lang.tr('Réflexion du tuteur...', 'المعلم الذكي يفكر في الإجابة...') }}</span>
                } @else {
                  <span class="material-icons text-sm">forum</span>
                  <span>{{ lang.t('askAiBtn') }}</span>
                }
              </button>

              @if (tutorResponse(); as resp) {
                <div class="bg-white/10 p-3.5 rounded-2xl border border-white/20 text-xs space-y-2 mt-2">
                  <p class="font-bold text-amber-300">
                    💡 {{ lang.tr('Explication du Tuteur :', 'توضيح المعلم الذكي:') }}
                  </p>
                  <p class="text-indigo-100 leading-relaxed">{{ resp.explanation }}</p>
                  
                  @if (resp.analogy) {
                    <div class="bg-black/20 p-2.5 rounded-xl text-amber-200">
                      <span class="font-bold">{{ lang.tr('Image parlante :', 'مثال توضيحي:') }}</span> {{ resp.analogy }}
                    </div>
                  }
                </div>
              }
            </div>
          </div>

        </div>

      </div>

    </div>

    <!-- MODAL: INTERACTIVE HOMEWORK SOLVER -->
    @if (activeHomeworkToSolve(); as hw) {
      <div class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 border border-slate-200 shadow-xl max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span class="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                {{ hw.subject }}
              </span>
              <h3 class="font-bold text-slate-900 text-lg mt-1">{{ hw.title }}</h3>
            </div>
            <button (click)="activeHomeworkToSolve.set(null)" class="text-slate-400 hover:text-slate-600 cursor-pointer">
              <span class="material-icons">close</span>
            </button>
          </div>

          <!-- Exercises Loop -->
          <div class="space-y-4 text-xs">
            @for (ex of hw.exercises; track ex.id) {
              <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <h4 class="font-bold text-slate-900">{{ ex.title }} ({{ ex.points }} pts)</h4>
                <p class="text-slate-700 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed font-mono">
                  {{ ex.promptText }}
                </p>

                <!-- Hints Accordion -->
                @if (ex.hints && ex.hints.length > 0) {
                  <details class="bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-amber-900">
                    <summary class="font-bold cursor-pointer flex items-center gap-1">
                      <span class="material-icons text-sm">lightbulb</span> {{ lang.tr("Besoins d'un indice ?", 'هل تحتاج إرشادات للحل؟') }}
                    </summary>
                    <ul class="list-disc list-inside mt-1 space-y-1">
                      @for (hint of ex.hints; track hint) {
                        <li>{{ hint }}</li>
                      }
                    </ul>
                  </details>
                }
              </div>
            }

            <div class="space-y-2 pt-2 border-t border-slate-200">
              <label for="student-answer-textarea" class="block font-bold text-slate-800">
                {{ lang.tr('Rédige tes réponses ici :', 'اكتب إجابتك ومحاولتك هنا:') }}
              </label>
              <textarea
                id="student-answer-textarea"
                [value]="studentAnswerText()"
                (input)="onStudentAnswerInput($event)"
                rows="4"
                placeholder="Écris tes calculs et tes phrases de réponse..."
                class="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 outline-none"></textarea>
            </div>

            <div class="bg-indigo-50 p-3 rounded-2xl border border-indigo-200 text-indigo-900 flex items-center justify-between">
              <div>
                <p class="font-bold">{{ lang.tr('Ou joins une photo de ton cahier :', 'أو أرفق صورة من كراستك:') }}</p>
                <p class="text-[11px] text-indigo-700">
                  {{ lang.tr("Simuler l'envoi de la photo de ton exercice écrit", 'محاكاة التقاط صورة الواجب المكتوب') }}
                </p>
              </div>
              <button
                (click)="simulatePhotoUpload()"
                class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1 cursor-pointer">
                <span class="material-icons text-sm">photo_camera</span>
                {{ uploadedPhotoUrl() ? lang.tr('Photo attachée ✔️', 'تم إرفاق الصورة ✔️') : lang.tr('Prendre photo', 'التقاط صورة') }}
              </button>
            </div>

            <button
              (click)="submitHomework()"
              class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-2xl cursor-pointer text-sm shadow-xs">
              {{ lang.tr("Envoyer le devoir à l'enseignant", 'إرسال الواجب للمعلم الآن') }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- MODAL: PRACTICE EXERCISE -->
    @if (activePracticeExercise(); as ex) {
      <div class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-slate-200 shadow-xl">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 class="font-bold text-slate-900 text-base">{{ ex.title }}</h3>
            <button (click)="activePracticeExercise.set(null)" class="text-slate-400 hover:text-slate-600 cursor-pointer">
              <span class="material-icons">close</span>
            </button>
          </div>

          <div class="space-y-3 text-xs">
            <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200 leading-relaxed font-mono">
              {{ ex.promptText }}
            </div>

            @if (showSolution()) {
              <div class="bg-emerald-50 text-emerald-900 p-4 rounded-2xl border border-emerald-200 space-y-1">
                <span class="font-bold">{{ lang.tr('Correction :', 'الإصلاح:') }}</span>
                <p class="whitespace-pre-line">{{ ex.solutionText }}</p>
              </div>
            } @else {
              <button
                (click)="showSolution.set(true)"
                class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl cursor-pointer">
                {{ lang.tr('Afficher la correction', 'عرض الإصلاح السليم') }}
              </button>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class StudentHomeComponent {
  readonly store = inject(EducationStore);
  readonly lang = inject(LanguageService);

  readonly activeHomeworkToSolve = signal<Homework | null>(null);
  readonly activePracticeExercise = signal<ExerciseItem | null>(null);
  readonly showSolution = signal<boolean>(false);

  readonly studentAnswerText = signal("Exercice 1 : 145 x 24 = 3480 kg d'oranges.\nExercice 2 : 35 x 12 = 420.\nExercice 3 : Périmètre = 146 m, grillage = 143 m.");
  readonly uploadedPhotoUrl = signal<string | null>(null);

  readonly tutorQuestion = signal('');
  readonly isTutorLoading = signal<boolean>(false);
  readonly tutorResponse = signal<TutorExplanation | null>(null);

  startHomework(hw: Homework) {
    this.activeHomeworkToSolve.set(hw);
  }

  simulatePhotoUpload() {
    this.uploadedPhotoUrl.set('https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&auto=format&fit=crop&q=80');
  }

  submitHomework() {
    const hw = this.activeHomeworkToSolve();
    if (!hw) return;

    this.store.submitHomeworkAnswer(hw.id, this.studentAnswerText(), this.uploadedPhotoUrl() || undefined);
    this.activeHomeworkToSolve.set(null);
    const msg = this.lang.tr(
      '🎉 Félicitations Ahmed ! Ton devoir a été soumis à Mme Amel avec succès !',
      '🎉 تهانينا يا أحمد! تم تسليم واجبك للمعلمة أمل بنجاح!'
    );
    alert(msg);
  }

  openPracticeExercise(ex: ExerciseItem) {
    this.showSolution.set(false);
    this.activePracticeExercise.set(ex);
  }

  onTutorQuestionInput(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.tutorQuestion.set(val);
  }

  onStudentAnswerInput(event: Event) {
    const val = (event.target as HTMLTextAreaElement).value;
    this.studentAnswerText.set(val);
  }

  async askTutorAi() {
    if (!this.tutorQuestion()) return;
    this.isTutorLoading.set(true);

    try {
      const res = await fetch('/api/ai/explain-concept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept: this.tutorQuestion(),
          grade: this.store.activeStudent().grade,
          subject: 'Général',
        }),
      });
      const data = await res.json();
      if (data.success) {
        this.tutorResponse.set(data.result);
      }
    } catch (err) {
      console.error(err);
    } finally {
      this.isTutorLoading.set(false);
    }
  }
}
