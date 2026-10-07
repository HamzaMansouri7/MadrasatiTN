import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { EducationStore, LanguageService, FirebaseService, ExerciseItem, Homework } from '@core';

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
      <div class="bg-[#0B2947] text-white rounded-[24px] p-6 sm:p-8 relative overflow-hidden shadow-sm animate-in fade-in duration-500">
        <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div class="space-y-2">
            <div class="inline-flex items-center gap-2 bg-white/10 text-white border border-white/15 text-xs px-3 py-1 rounded-full font-medium">
              <span class="material-icons text-sm text-[#E0AA32]">local_fire_department</span>
              {{ store.activeStudent()?.streakDays || 0 }} {{ lang.t('streakLabel') }}
            </div>

            <h1 class="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-white">
              {{ studentGreeting() }}
            </h1>
            <p class="text-[#8CA9C4] text-xs sm:text-sm max-w-lg">
              {{ lang.t('studentSub') }}
            </p>
          </div>

          <!-- Gamification Points Card -->
          <div class="bg-white/10 p-4 rounded-[14px] border border-white/15 text-center shrink-0">
            <p class="text-[11px] text-[#8CA9C4] font-medium flex items-center justify-center gap-1">
              <span class="material-icons text-sm text-[#E0AA32]">emoji_events</span>
              {{ lang.t('successPoints') }}
            </p>
            <p class="font-display text-3xl font-bold text-[#E0AA32] my-0.5">{{ store.activeStudent()?.totalPoints || 0 }}</p>
            <p class="text-[11px] font-medium text-[#8CA9C4]">
              {{ store.activeStudent()?.completedExercisesCount || 0 }} {{ lang.tr('exercices résolus', 'تمرين منجز بنجاح') }}
            </p>
          </div>
        </div>
      </div>

      <!-- Main Student Sections Grid -->
      <div class="grid lg:grid-cols-3 gap-6">
        
        <!-- Left 2 Cols: Homework & Active Practice -->
        <div class="lg:col-span-2 space-y-6">
          
          <!-- Homework Section -->
          <div class="bg-white rounded-2xl p-6 border border-[#E7DFCF] shadow-sm space-y-4">
            <div class="flex items-center justify-between border-b border-[#F0EBDD] pb-3">
              <div class="flex items-center gap-2">
                <span class="material-icons text-[#BF5B34]">assignment</span>
                <h3 class="font-display font-semibold text-[#14251D] text-base">{{ lang.t('myHomeworks') }}</h3>
              </div>
              <span class="text-xs text-[#8A5A00] font-medium bg-[#F2ECDE] px-3 py-1 rounded-full border border-[#E7DFCF]">
                {{ store.classHomeworks().length }} {{ lang.tr('devoirs enregistrés', 'واجبات مدرجة') }}
              </span>
            </div>

            <div class="space-y-4">
              @for (hw of store.classHomeworks(); track hw.id) {
                <div class="bg-[#FBF8F1] rounded-2xl p-5 border border-[#E7DFCF] space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="bg-[#F2ECDE] text-[#8A5A00] text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-[#E7DFCF]">
                      {{ translateSubject(hw.subject) }}
                    </span>
                    <span class="text-xs text-[#C1121F] font-medium flex items-center gap-1">
                      <span class="material-icons text-sm">schedule</span> {{ lang.tr('À rendre :', 'تاريخ التسليم:') }} {{ hw.dueDate }}
                    </span>
                  </div>

                  <div>
                    <h4 class="font-semibold text-[#14251D] text-sm">{{ hw.title }}</h4>
                    <p class="text-xs text-[#5B6B60] mt-1">{{ hw.instructions }}</p>
                  </div>

                  <div class="bg-white p-3 rounded-xl border border-[#E7DFCF] flex items-center justify-between text-xs">
                    <span class="text-[#4A5A50] font-medium">
                      {{ lang.tr('Contient', 'يتكون من') }} {{ hw.exercises.length }} {{ lang.tr('exercices', 'تمارين') }} (Total : {{ hw.totalPoints }} pts)
                    </span>
                    <button
                      (click)="startHomework(hw)"
                      class="bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer shadow-sm flex items-center gap-1">
                      <span class="material-icons text-sm">edit_note</span> {{ lang.t('solveBtn') }}
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Interactive Practice Bank -->
          <div class="bg-white rounded-2xl p-6 border border-[#E7DFCF] shadow-sm space-y-4">
            <div class="flex items-center justify-between border-b border-[#F0EBDD] pb-3">
              <div class="flex items-center gap-2">
                <span class="material-icons text-[#2D6A4F]">fitness_center</span>
                <h3 class="font-display font-semibold text-[#14251D] text-base">{{ lang.t('practiceZone') }}</h3>
              </div>
            </div>

            <div class="grid md:grid-cols-2 gap-4">
              @for (ex of store.exercisesBank(); track ex.id) {
                <div class="bg-[#FBF8F1] rounded-2xl p-4 border border-[#E7DFCF] space-y-3 flex flex-col justify-between">
                  <div class="space-y-1.5">
                    <div class="flex items-center justify-between text-[10px]">
                      <span class="bg-[#F2ECDE] text-[#1B4332] font-semibold px-2 py-0.5 rounded-full border border-[#E7DFCF]">{{ translateSubject(ex.subject) }}</span>
                      <span class="text-[#6B7A70] font-medium">{{ translateDifficulty(ex.difficulty) }}</span>
                    </div>
                    <h4 class="font-semibold text-[#14251D] text-xs">{{ ex.title }}</h4>
                    <p class="text-xs text-[#5B6B60] italic">"{{ ex.promptText }}"</p>
                  </div>

                  <button
                    (click)="openPracticeExercise(ex)"
                    class="bg-[#FBF8F1] hover:bg-[#F2ECDE] text-[#4A5A50] font-medium text-xs py-2 px-3 rounded-xl border border-[#E7DFCF] transition-colors cursor-pointer flex items-center justify-center gap-1">
                    <span class="material-icons text-sm text-[#2D6A4F]">psychology</span>
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
          <div class="bg-[#14251D] text-[#FBF8F1] rounded-[28px] p-6 border border-white/10 shadow-sm space-y-4">
            <div class="flex items-center gap-2 border-b border-white/10 pb-3">
              <span class="material-icons text-[#F2C14E] text-2xl">auto_awesome</span>
              <div>
                <h3 class="font-display font-semibold text-sm">{{ lang.t('aiTutorTitle') }}</h3>
                <p class="text-[11px] text-[#9DBBA8]">
                  {{ lang.tr('Pose une question sur tes cours !', 'اطرح أسئلتك واطلب تبسيط الدروس!') }}
                </p>
              </div>
            </div>

            <div class="space-y-3 text-xs">
              <p class="text-[#B7C7BC] leading-relaxed">
                {{ lang.tr("Tu n'as pas bien compris une notion de Mathématiques, de Français ou de Sciences ? Demande-moi une explication simple !", 'لم تفهم جيدا قاعدة في الرياضيات، أو اللغة العربية أو العلوم؟ اسألني هنا وسأشرحها لك ببساطة!') }}
              </p>

              <label for="tutor-question-input" class="sr-only">Question pour le tuteur IA</label>
              <input
                id="tutor-question-input"
                type="text"
                [value]="tutorQuestion()"
                (input)="onTutorQuestionInput($event)"
                placeholder="Ex: Explique-moi la photosynthèse, اشرح لي الجملة الاسمية..."
                class="w-full bg-white/10 border border-white/15 text-[#FBF8F1] placeholder-[#9DBBA8] rounded-xl p-3 outline-none text-xs" />

              <button
                [disabled]="isTutorLoading()"
                (click)="askTutorAi()"
                class="w-full bg-[#F2C14E] hover:opacity-90 text-[#14251D] font-semibold py-2.5 rounded-xl cursor-pointer transition-opacity flex items-center justify-center gap-2">
                @if (isTutorLoading()) {
                  <span class="material-icons animate-spin text-sm">sync</span>
                  <span>{{ lang.tr('Réflexion du tuteur...', 'المعلم الذكي يفكر في الإجابة...') }}</span>
                } @else {
                  <span class="material-icons text-sm">forum</span>
                  <span>{{ lang.t('askAiBtn') }}</span>
                }
              </button>

              @if (tutorResponse(); as resp) {
                <div class="bg-white/5 p-3.5 rounded-2xl border border-white/10 text-xs space-y-2 mt-2">
                  <p class="font-semibold text-[#F2C14E]">
                    💡 {{ lang.tr('Explication du Tuteur :', 'توضيح المعلم الذكي:') }}
                  </p>
                  <p class="text-[#B7C7BC] leading-relaxed">{{ resp.explanation }}</p>

                  @if (resp.analogy) {
                    <div class="bg-black/20 p-2.5 rounded-xl text-[#F2C14E]">
                      <span class="font-semibold">{{ lang.tr('Image parlante :', 'مثال توضيحي:') }}</span> {{ resp.analogy }}
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
      <div class="fixed inset-0 z-50 bg-[#14251D]/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-[28px] max-w-2xl w-full p-6 space-y-5 border border-[#E7DFCF] shadow-sm max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between border-b border-[#F0EBDD] pb-3">
            <div>
              <span class="bg-[#F2ECDE] text-[#8A5A00] text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-[#E7DFCF]">
                {{ hw.subject }}
              </span>
              <h3 class="font-display font-semibold text-[#14251D] text-lg mt-1">{{ hw.title }}</h3>
            </div>
            <button (click)="activeHomeworkToSolve.set(null)" class="text-[#6B7A70] hover:text-[#14251D] cursor-pointer">
              <span class="material-icons">close</span>
            </button>
          </div>

          <!-- Exercises Loop -->
          <div class="space-y-4 text-xs">
            @for (ex of hw.exercises; track ex.id) {
              <div class="bg-[#FBF8F1] p-4 rounded-2xl border border-[#E7DFCF] space-y-2">
                <h4 class="font-semibold text-[#14251D]">{{ ex.title }} ({{ ex.points }} pts)</h4>
                <p class="text-[#4A5A50] bg-white p-3 rounded-xl border border-[#E7DFCF] leading-relaxed font-mono">
                  {{ ex.promptText }}
                </p>

                <!-- Hints Accordion -->
                @if (ex.hints && ex.hints.length > 0) {
                  <details class="bg-[#F2ECDE] p-2.5 rounded-xl border border-[#E7DFCF] text-[#8A5A00]">
                    <summary class="font-semibold cursor-pointer flex items-center gap-1">
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

            <div class="space-y-2 pt-2 border-t border-[#E7DFCF]">
              <label for="student-answer-textarea" class="block font-semibold text-[#14251D]">
                {{ lang.tr('Rédige tes réponses ici :', 'اكتب إجابتك ومحاولتك هنا:') }}
              </label>
              <textarea
                id="student-answer-textarea"
                [value]="studentAnswerText()"
                (input)="onStudentAnswerInput($event)"
                rows="4"
                placeholder="Écris tes calculs et tes phrases de réponse..."
                class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl p-3 outline-none"></textarea>
            </div>

            <div class="bg-[#FBF8F1] p-4 rounded-2xl border border-[#E7DFCF] text-[#14251D] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p class="font-semibold flex items-center gap-1.5">
                  <span class="material-icons text-[#BF5B34] text-sm">photo_camera</span>
                  {{ lang.tr('Joins la photo de ton cahier :', 'أرفق صورة واضحة من كراستك:') }}
                </p>
                <p class="text-[11px] text-[#5B6B60]">
                  {{ lang.tr("Prends en photo ton travail manuscrit directement", 'التقط صورة الواجب مباشرة من هاتفك أو حاسوبك') }}
                </p>
              </div>

              <div class="flex items-center gap-2">
                <input
                  type="file"
                  #cameraInput
                  (change)="handlePhotoUpload($event)"
                  accept="image/*"
                  capture="environment"
                  class="hidden" />
                <button
                  type="button"
                  (click)="cameraInput.click()"
                  class="bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors">
                  <span class="material-icons text-sm">add_a_photo</span>
                  {{ uploadedPhotoUrl() ? lang.tr('Changer photo ✔️', 'تغيير الصورة ✔️') : lang.tr('Prendre en photo', 'التقاط صورة') }}
                </button>
              </div>
            </div>

            @if (uploadedPhotoUrl()) {
              <div class="p-2.5 bg-white rounded-xl border border-[#E7DFCF] flex items-center gap-3">
                <img [src]="uploadedPhotoUrl()" alt="Aperçu cahier" class="w-16 h-16 rounded-lg object-cover border border-[#E7DFCF]" />
                <div class="text-xs">
                  <p class="font-semibold text-[#1B4332] flex items-center gap-1">
                    <span class="material-icons text-xs">verified</span> {{ lang.t('photoReady') }}
                  </p>
                  <p class="text-[11px] text-[#6B7A70]">Sera transmise directement avec votre devoir</p>
                </div>
              </div>
            }

            <button
              (click)="submitHomework()"
              class="w-full bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold py-3 rounded-xl cursor-pointer text-sm shadow-sm transition-colors">
              {{ lang.tr("Envoyer le devoir à l'enseignant", 'إرسال الواجب للمعلم الآن') }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- MODAL: PRACTICE EXERCISE -->
    @if (activePracticeExercise(); as ex) {
      <div class="fixed inset-0 z-50 bg-[#14251D]/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-[28px] max-w-lg w-full p-6 space-y-4 border border-[#E7DFCF] shadow-sm">
          <div class="flex items-center justify-between border-b border-[#F0EBDD] pb-3">
            <h3 class="font-display font-semibold text-[#14251D] text-base">{{ ex.title }}</h3>
            <button (click)="activePracticeExercise.set(null)" class="text-[#6B7A70] hover:text-[#14251D] cursor-pointer">
              <span class="material-icons">close</span>
            </button>
          </div>

          <div class="space-y-3 text-xs">
            <div class="bg-[#FBF8F1] p-4 rounded-2xl border border-[#E7DFCF] leading-relaxed font-mono">
              {{ ex.promptText }}
            </div>

            @if (showSolution()) {
              <div class="bg-[#F2ECDE] text-[#1B4332] p-4 rounded-2xl border border-[#E7DFCF] space-y-1">
                <span class="font-semibold">{{ lang.tr('Correction :', 'الإصلاح:') }}</span>
                <p class="whitespace-pre-line">{{ ex.solutionText }}</p>
              </div>
            } @else {
              <button
                (click)="showSolution.set(true)"
                class="w-full bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold py-2.5 rounded-xl cursor-pointer transition-colors">
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
  readonly firebase = inject(FirebaseService);

  isUserLoggedIn(): boolean {
    return !!(this.firebase.userProfile() || this.firebase.currentUser());
  }

  studentGreeting(): string {
    const profile = this.firebase.userProfile();
    if (profile?.displayName) {
      return this.lang.tr(`Bonjour ${profile.displayName}`, `مرحباً ${profile.displayName}`);
    }
    const user = this.firebase.currentUser();
    if (user?.displayName) {
      return this.lang.tr(`Bonjour ${user.displayName}`, `مرحباً ${user.displayName}`);
    }
    return this.lang.tr('Espace Élève', 'فضاء التلميذ');
  }

  readonly activeHomeworkToSolve = signal<Homework | null>(null);
  readonly activePracticeExercise = signal<ExerciseItem | null>(null);
  readonly showSolution = signal<boolean>(false);

  readonly studentAnswerText = signal("Exercice 1 : 145 x 24 = 3480 kg d'oranges.\nExercice 2 : 35 x 12 = 420.\nExercice 3 : Périmètre = 146 m, grillage = 143 m.");
  readonly uploadedPhotoUrl = signal<string | null>(null);
  readonly isPhotoUploading = signal<boolean>(false);

  readonly tutorQuestion = signal('');
  readonly isTutorLoading = signal<boolean>(false);
  readonly tutorResponse = signal<TutorExplanation | null>(null);

  startHomework(hw: Homework) {
    this.activeHomeworkToSolve.set(hw);
  }

  async handlePhotoUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    this.isPhotoUploading.set(true);

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      const base64Data = await base64Promise;

      const authHeaders = await this.firebase.getAuthHeaders();
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          kind: 'notebooks',
          uid: this.firebase.currentUser()?.uid,
          filename: `notebook_${Date.now()}_${file.name}`,
          base64Data,
          contentType: file.type,
        }),
      });
      const data = await res.json();
      if (data.success && data.url) {
        this.uploadedPhotoUrl.set(data.url);
      } else {
        alert('Échec de l\'envoi de la photo');
      }
    } catch (err) {
      console.error(err);
      alert('Erreur lors du téléversement de la photo');
    } finally {
      this.isPhotoUploading.set(false);
    }
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
      '🎉 Félicitations ! Ton devoir a été soumis à l\'enseignant avec succès !',
      '🎉 تهانينا! تم تسليم واجبك للمعلم بنجاح!'
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
          grade: this.store.activeStudent()?.grade || '4ème Année',
          subject: 'Général',
          language: this.lang.lang(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        this.tutorResponse.set(data.explanation || data.result);
      }
    } catch (err) {
      console.error(err);
    } finally {
      this.isTutorLoading.set(false);
    }
  }

  translateSubject(subject: string): string {
    const map: Record<string, { fr: string; ar: string }> = {
      'Mathématiques': { fr: 'Mathématiques', ar: 'الرياضيات' },
      'Français': { fr: 'Français', ar: 'الفرنسية' },
      'اللغة العربية': { fr: 'اللغة العربية', ar: 'اللغة العربية' },
      'Arabe': { fr: 'Arabe', ar: 'اللغة العربية' },
      'Éveil Scientifique': { fr: 'Éveil Scientifique', ar: 'الإيقاظ العلمي' },
      'Anglais': { fr: 'Anglais', ar: 'الانجليزية' },
    };
    const entry = map[subject];
    return entry ? (this.lang.isArabic() ? entry.ar : entry.fr) : subject;
  }

  translateDifficulty(difficulty: string): string {
    const map: Record<string, { fr: string; ar: string }> = {
      'Facile': { fr: 'Facile', ar: 'سهل' },
      'Moyen': { fr: 'Moyen', ar: 'متوسط' },
      'Difficile': { fr: 'Difficile', ar: 'صعب' },
    };
    const entry = map[difficulty];
    return entry ? (this.lang.isArabic() ? entry.ar : entry.fr) : difficulty;
  }
}
