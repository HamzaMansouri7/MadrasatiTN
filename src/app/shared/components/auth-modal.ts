import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EducationStore, LanguageService, FirebaseService, UserRole } from '@core';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (store.isAuthModalOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14251D]/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div class="bg-[#FBF8F1] rounded-2xl shadow-xl border border-[#E7DFCF] max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh]">
          
          <!-- Header Banner -->
          <div class="bg-[#14251D] p-6 text-[#FBF8F1] relative">
            <button
              (click)="store.closeAuthModal()"
              class="absolute top-4 right-4 text-[#B7C7BC] hover:text-[#FBF8F1] p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              title="Fermer">
              <span class="material-icons text-lg">close</span>
            </button>

            <div class="flex items-center gap-3 mb-2">
              <div class="w-10 h-10 rounded-xl bg-[#1B4332] text-[#FBF8F1] font-display font-semibold flex items-center justify-center text-lg shadow-xs">
                م
              </div>
              <div>
                <h3 class="text-xl font-display font-semibold tracking-tight text-[#FBF8F1]">Madrasati TN</h3>
                <p class="text-xs text-[#9DBBA8]">
                  {{ lang.tr('Plateforme Éducative Tunisienne', 'المنصة التعليمية التونسية') }}
                </p>
              </div>
            </div>

            <!-- Mode Switcher Tabs -->
            <div class="flex bg-[#1B4332]/40 p-1 rounded-xl mt-4 border border-[#1B4332]/50">
              <button
                type="button"
                (click)="store.authModalMode.set('login')"
                [class]="store.authModalMode() === 'login' ? 'bg-[#FBF8F1] text-[#14251D] font-semibold shadow-xs' : 'text-[#B7C7BC] hover:text-[#FBF8F1] font-medium'"
                class="flex-1 py-2 text-xs rounded-lg transition-colors cursor-pointer text-center">
                {{ lang.tr('Se connecter', 'تسجيل الدخول') }}
              </button>
              <button
                type="button"
                (click)="store.authModalMode.set('signup')"
                [class]="store.authModalMode() === 'signup' ? 'bg-[#FBF8F1] text-[#14251D] font-semibold shadow-xs' : 'text-[#B7C7BC] hover:text-[#FBF8F1] font-medium'"
                class="flex-1 py-2 text-xs rounded-lg transition-colors cursor-pointer text-center">
                {{ lang.tr('Créer un compte', 'إنشاء حساب جديد') }}
              </button>
            </div>
          </div>

          <!-- Body Content -->
          <div class="p-6 overflow-y-auto space-y-5 bg-[#FBF8F1]">

            <!-- Error Banner -->
            @if (errorMessage()) {
              <div class="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 animate-in fade-in shadow-xs">
                <span class="material-icons text-base shrink-0 text-red-600 mt-0.5">error_outline</span>
                <span class="flex-1 font-medium leading-relaxed">{{ errorMessage() }}</span>
                <button type="button" (click)="errorMessage.set(null)" class="text-red-500 hover:text-red-800 cursor-pointer">
                  <span class="material-icons text-sm">close</span>
                </button>
              </div>
            }

            <!-- POST-GOOGLE COMPLETION STEP: Google gives no gender / subject / school -->
            @if (completionMode()) {
              <div class="space-y-4">
                <div class="text-center space-y-1">
                  <span class="material-icons text-3xl text-[#2D6A4F]">how_to_reg</span>
                  <h3 class="font-display font-semibold text-[#14251D] text-base">
                    {{ lang.tr('Complétez votre profil', 'أكمل ملفك الشخصي') }}
                  </h3>
                  <p class="text-xs text-[#5B6B60]">
                    {{ lang.tr('Une dernière étape pour personnaliser votre espace.', 'خطوة أخيرة لتخصيص فضائك.') }}
                  </p>
                </div>

                <div>
                  <span class="block text-xs font-semibold text-[#14251D] mb-2">
                    {{ lang.t('authSignupAs') }} *
                  </span>
                  <div class="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      (click)="selectedCompletionRole.set('teacher')"
                      [class]="selectedCompletionRole() === 'teacher' ? 'border-[#1B4332] bg-[#F2ECDE] text-[#1B4332] ring-2 ring-[#1B4332]' : 'border-[#CBD9E2] text-[#5B6B60]'"
                      class="p-2 rounded-xl border text-center cursor-pointer flex flex-col items-center bg-white text-xs">
                      <span class="material-icons text-base mb-0.5 text-[#1B4332]">school</span>
                      {{ lang.tr('Enseignant', 'معلم(ة)') }}
                    </button>
                    <button
                      type="button"
                      (click)="selectedCompletionRole.set('parent')"
                      [class]="selectedCompletionRole() === 'parent' ? 'border-[#8A5A00] bg-[#F2ECDE] text-[#8A5A00] ring-2 ring-[#8A5A00]' : 'border-[#CBD9E2] text-[#5B6B60]'"
                      class="p-2 rounded-xl border text-center cursor-pointer flex flex-col items-center bg-white text-xs">
                      <span class="material-icons text-base mb-0.5 text-[#8A5A00]">family_restroom</span>
                      {{ lang.tr('Parent', 'ولي أمر') }}
                    </button>
                    <button
                      type="button"
                      (click)="selectedCompletionRole.set('student')"
                      [class]="selectedCompletionRole() === 'student' ? 'border-[#BF5B34] bg-[#F2ECDE] text-[#BF5B34] ring-2 ring-[#BF5B34]' : 'border-[#CBD9E2] text-[#5B6B60]'"
                      class="p-2 rounded-xl border text-center cursor-pointer flex flex-col items-center bg-white text-xs">
                      <span class="material-icons text-base mb-0.5 text-[#BF5B34]">auto_stories</span>
                      {{ lang.tr('Élève', 'تلميذ(ة)') }}
                    </button>
                  </div>
                </div>

                <div>
                  <span class="block text-xs font-medium text-[#486581] mb-1">{{ lang.tr('Genre *', 'الجنس *') }}</span>
                  <div class="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      (click)="signupGender = 'male'"
                      [class]="signupGender === 'male' ? 'bg-[#007CC2] text-white font-bold border-[#007CC2]' : 'bg-white text-[#486581] border-[#CBD9E2] hover:border-[#007CC2]'"
                      class="text-xs p-3 rounded-[10px] border transition-all cursor-pointer flex items-center justify-center gap-1.5">
                      <span class="material-icons text-sm">man</span>
                      {{ lang.tr('Homme', 'ذكر') }}
                    </button>
                    <button
                      type="button"
                      (click)="signupGender = 'female'"
                      [class]="signupGender === 'female' ? 'bg-[#007CC2] text-white font-bold border-[#007CC2]' : 'bg-white text-[#486581] border-[#CBD9E2] hover:border-[#007CC2]'"
                      class="text-xs p-3 rounded-[10px] border transition-all cursor-pointer flex items-center justify-center gap-1.5">
                      <span class="material-icons text-sm">woman</span>
                      {{ lang.tr('Femme', 'أنثى') }}
                    </button>
                  </div>
                </div>

                @if (selectedCompletionRole() === 'teacher') {
                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <label for="cp-school" class="block text-xs font-medium text-[#486581] mb-1">
                        {{ lang.tr('École primaire *', 'المدرسة الابتدائية *') }}
                      </label>
                      <input
                        id="cp-school"
                        type="text"
                        [(ngModel)]="signupSchool"
                        placeholder="Ex: École Habib Bourguiba"
                        class="w-full text-xs p-3 bg-white border border-[#CBD9E2] rounded-[10px] text-[#102A43] placeholder:text-[#829AB1] focus:border-[#007CC2] outline-none transition-all" />
                    </div>
                    <div>
                      <label for="cp-gov" class="block text-xs font-medium text-[#486581] mb-1">
                        {{ lang.tr('Gouvernorat *', 'الولاية *') }}
                      </label>
                      <input
                        id="cp-gov"
                        type="text"
                        [(ngModel)]="signupGov"
                        placeholder="Ex: Ariana, Tunis, Sfax"
                        class="w-full text-xs p-3 bg-white border border-[#CBD9E2] rounded-[10px] text-[#102A43] placeholder:text-[#829AB1] focus:border-[#007CC2] outline-none transition-all" />
                    </div>
                  </div>

                  <div>
                    <label for="cp-subject" class="block text-xs font-medium text-[#486581] mb-1">
                      {{ lang.tr("Matière principale d'enseignement *", 'المادة الرئيسية للتدريس *') }}
                    </label>
                    <select
                      id="cp-subject"
                      [(ngModel)]="signupSubject"
                      class="w-full text-xs p-3 bg-white border border-[#CBD9E2] rounded-[10px] text-[#102A43] outline-none focus:border-[#007CC2]">
                      <option value="Mathématiques">Mathématiques (الرياضيات)</option>
                      <option value="Langue Arabe">Langue Arabe (اللغة العربية)</option>
                      <option value="Français">Français (اللغة الفرنسية)</option>
                      <option value="Éveil Scientifique">Éveil Scientifique (الأيقاظ العلمي)</option>
                      <option value="Éducation Islamique">Éducation Islamique (التربية الإسلامية)</option>
                    </select>
                  </div>
                }

                <button
                  type="button"
                  (click)="submitCompletion()"
                  [disabled]="isLoading()"
                  class="w-full bg-[#007CC2] hover:bg-[#006EAD] text-white font-semibold text-sm py-3 rounded-[10px] shadow-xs transition-colors cursor-pointer disabled:opacity-50">
                  {{ lang.tr('Terminer et accéder à mon espace', 'إنهاء والدخول إلى فضائي') }}
                </button>
              </div>
            } @else {

            <!-- Google Sign-In Quick Action -->
            <button
              type="button"
              (click)="handleGoogleAuth()"
              [disabled]="isLoading()"
              class="w-full flex items-center justify-center gap-3 bg-white hover:bg-[#F2ECDE] text-[#14251D] font-semibold text-sm py-3 px-4 rounded-xl border border-[#E7DFCF] shadow-xs transition-colors cursor-pointer">
              <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>{{ lang.tr('Continuer avec Google', 'المتابعة بواسطة جوجل') }}</span>
            </button>

            <!-- Separator -->
            <div class="flex items-center my-3">
              <div class="flex-grow border-t border-[#E7DFCF]"></div>
              <span class="px-3 text-[11px] text-[#5B6B60] font-medium">
                {{ lang.tr('ou avec vos identifiants', 'أو بالبيانات الشخصية') }}
              </span>
              <div class="flex-grow border-t border-[#E7DFCF]"></div>
            </div>

            <!-- SIGNUP MODE: Role Choice -->
            @if (store.authModalMode() === 'signup') {
              <div class="space-y-3">
                <div>
                  <span class="block text-xs font-semibold text-[#14251D] mb-2">
                    {{ lang.t('authSignupAs') }} *
                  </span>
                  <div class="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      (click)="store.authModalRole.set('teacher')"
                      [class]="store.authModalRole() === 'teacher' ? 'border-[#1B4332] bg-[#F2ECDE] text-[#1B4332] ring-2 ring-[#1B4332]' : 'border-[#E7DFCF] hover:bg-[#F2ECDE] text-[#5B6B60]'"
                      class="p-2.5 rounded-xl border text-center transition-colors cursor-pointer flex flex-col items-center bg-white">
                      <span class="material-icons text-xl mb-1 text-[#1B4332]">school</span>
                      <span class="text-xs font-semibold">{{ lang.tr('Enseignant', 'معلم(ة)') }}</span>
                    </button>

                    <button
                      type="button"
                      (click)="store.authModalRole.set('parent')"
                      [class]="store.authModalRole() === 'parent' ? 'border-[#8A5A00] bg-[#F2ECDE] text-[#8A5A00] ring-2 ring-[#8A5A00]' : 'border-[#E7DFCF] hover:bg-[#F2ECDE] text-[#5B6B60]'"
                      class="p-2.5 rounded-xl border text-center transition-colors cursor-pointer flex flex-col items-center bg-white">
                      <span class="material-icons text-xl mb-1 text-[#8A5A00]">family_restroom</span>
                      <span class="text-xs font-semibold">{{ lang.tr('Parent', 'ولي أمر') }}</span>
                    </button>

                    <button
                      type="button"
                      (click)="store.authModalRole.set('student')"
                      [class]="store.authModalRole() === 'student' ? 'border-[#BF5B34] bg-[#F2ECDE] text-[#BF5B34] ring-2 ring-[#BF5B34]' : 'border-[#E7DFCF] hover:bg-[#F2ECDE] text-[#5B6B60]'"
                      class="p-2.5 rounded-xl border text-center transition-colors cursor-pointer flex flex-col items-center bg-white">
                      <span class="material-icons text-xl mb-1 text-[#BF5B34]">auto_stories</span>
                      <span class="text-xs font-semibold">{{ lang.tr('Élève', 'تلميذ(ة)') }}</span>
                    </button>
                  </div>
                </div>

                <!-- Dynamic Fields by Role -->
                <div class="space-y-3">
                  <div>
                    <label for="su-name" class="block text-xs font-medium text-[#486581] mb-1">
                      {{ store.authModalRole() === 'student' ? lang.t('authStudentName') : lang.t('authFullName') }} *
                    </label>
                    <input
                      id="su-name"
                      type="text"
                      [(ngModel)]="signupName"
                      [placeholder]="namePlaceholder()"
                      class="w-full text-xs p-3 bg-white border border-[#CBD9E2] rounded-[10px] text-[#102A43] placeholder:text-[#829AB1] focus:border-[#007CC2] focus:ring-3 focus:ring-[#E8F5FC] outline-none transition-all" />
                  </div>

                  <!-- Gender (drives gendered FR/AR labels: Enseignant/Enseignante, معلم/معلمة) -->
                  <div>
                    <span class="block text-xs font-medium text-[#486581] mb-1">{{ lang.tr('Genre *', 'الجنس *') }}</span>
                    <div class="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        (click)="signupGender = 'male'"
                        [class]="signupGender === 'male'
                          ? 'bg-[#007CC2] text-white font-bold border-[#007CC2]'
                          : 'bg-white text-[#486581] border-[#CBD9E2] hover:border-[#007CC2]'"
                        class="text-xs p-3 rounded-[10px] border transition-all cursor-pointer flex items-center justify-center gap-1.5">
                        <span class="material-icons text-sm">man</span>
                        {{ lang.tr('Homme', 'ذكر') }}
                      </button>
                      <button
                        type="button"
                        (click)="signupGender = 'female'"
                        [class]="signupGender === 'female'
                          ? 'bg-[#007CC2] text-white font-bold border-[#007CC2]'
                          : 'bg-white text-[#486581] border-[#CBD9E2] hover:border-[#007CC2]'"
                        class="text-xs p-3 rounded-[10px] border transition-all cursor-pointer flex items-center justify-center gap-1.5">
                        <span class="material-icons text-sm">woman</span>
                        {{ lang.tr('Femme', 'أنثى') }}
                      </button>
                    </div>
                  </div>

                  @if (store.authModalRole() === 'teacher') {
                    <div class="space-y-2">
                      <div class="grid grid-cols-2 gap-2">
                        <div>
                          <label for="su-school" class="block text-xs font-medium text-[#486581] mb-1">École primaire *</label>
                          <input
                            id="su-school"
                            type="text"
                            [(ngModel)]="signupSchool"
                            placeholder="Ex: École Habib Bourguiba"
                            class="w-full text-xs p-3 bg-white border border-[#CBD9E2] rounded-[10px] text-[#102A43] placeholder:text-[#829AB1] focus:border-[#007CC2] focus:ring-3 focus:ring-[#E8F5FC] outline-none transition-all" />
                        </div>
                        <div>
                          <label for="su-gov" class="block text-xs font-medium text-[#486581] mb-1">Gouvernorat *</label>
                          <input
                            id="su-gov"
                            type="text"
                            [(ngModel)]="signupGov"
                            placeholder="Ex: Ariana, Tunis, Sfax"
                            class="w-full text-xs p-3 bg-white border border-[#CBD9E2] rounded-[10px] text-[#102A43] placeholder:text-[#829AB1] focus:border-[#007CC2] focus:ring-3 focus:ring-[#E8F5FC] outline-none transition-all" />
                        </div>
                      </div>

                      <div>
                        <label for="su-subject" class="block text-xs font-medium text-[#486581] mb-1">
                          {{ lang.tr("Matière principale d'enseignement *", 'المادة الرئيسية للتدريس *') }}
                        </label>
                        <select
                          id="su-subject"
                          [(ngModel)]="signupSubject"
                          class="w-full text-xs p-3 bg-white border border-[#CBD9E2] rounded-[10px] text-[#102A43] outline-none focus:border-[#007CC2]">
                          <option value="Mathématiques">Mathématiques (الرياضيات)</option>
                          <option value="Langue Arabe">Langue Arabe (اللغة العربية)</option>
                          <option value="Français">Français (اللغة الفرنسية)</option>
                          <option value="Éveil Scientifique">Éveil Scientifique (الأيقاظ العلمي)</option>
                          <option value="Éducation Islamique">Éducation Islamique (التربية الإسلامية)</option>
                          <option value="Sciences de la Vie">Sciences de la Vie (علوم الحياة والأرض)</option>
                        </select>
                      </div>
                    </div>
                  }

                  @if (store.authModalRole() === 'parent') {
                    <div class="space-y-2">
                      <div class="grid grid-cols-2 gap-2">
                        <div>
                          <label for="su-phone" class="block text-xs font-medium text-[#486581] mb-1">
                            {{ lang.tr('Numéro de téléphone *', 'رقم الهاتف *') }}
                          </label>
                          <input
                            id="su-phone"
                            type="tel"
                            [(ngModel)]="signupPhone"
                            placeholder="+216 98 123 456"
                            class="w-full text-xs p-3 bg-white border border-[#CBD9E2] rounded-[10px] text-[#102A43] placeholder:text-[#829AB1] focus:border-[#007CC2] outline-none transition-all" />
                        </div>
                        <div>
                          <label for="su-child-grade" class="block text-xs font-medium text-[#486581] mb-1">
                            {{ lang.tr("Niveau de l'enfant *", "مستوى الطفل *") }}
                          </label>
                          <select
                            id="su-child-grade"
                            [(ngModel)]="signupGrade"
                            class="w-full text-xs p-3 bg-white border border-[#CBD9E2] rounded-[10px] text-[#102A43] outline-none focus:border-[#007CC2]">
                            <option value="1ère Année">1ère Année (السنة الأولى)</option>
                            <option value="2ème Année">2ème Année (السنة الثانية)</option>
                            <option value="3ème Année">3ème Année (السنة الثالثة)</option>
                            <option value="4ème Année">4ème Année (السنة الرابعة)</option>
                            <option value="5ème Année">5ème Année (السنة الخامسة)</option>
                            <option value="6ème Année">6ème Année (السنة السادسة)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  }

                  @if (store.authModalRole() === 'student') {
                    <div>
                      <label for="su-student-grade" class="block text-xs font-medium text-[#486581] mb-1">
                        {{ lang.tr('Classe / Niveau', 'القسم / السنة الدراسية') }} *
                      </label>
                      <select
                        id="su-student-grade"
                        [(ngModel)]="signupGrade"
                        class="w-full text-xs p-3 bg-white border border-[#CBD9E2] rounded-[10px] text-[#102A43] outline-none focus:border-[#007CC2]">
                        <option value="1ère Année">1ère Année Primaire (السنة الأولى)</option>
                        <option value="2ème Année">2ème Année Primaire (السنة الثانية)</option>
                        <option value="3ème Année">3ème Année Primaire (السنة الثالثة)</option>
                        <option value="4ème Année">4ème Année Primaire (السنة الرابعة)</option>
                        <option value="5ème Année">5ème Année Primaire (السنة الخامسة)</option>
                        <option value="6ème Année">6ème Année Primaire (السنة السادسة)</option>
                      </select>
                    </div>
                  }

                  <div>
                    <label for="su-email" class="block text-xs font-medium text-[#486581] mb-1">
                      {{ store.authModalRole() === 'student' ? lang.tr('Code secret ou Email parent', 'الرمز السري أو بريد الولي') : lang.tr('Adresse Email', 'البريد الإلكتروني') }} *
                    </label>
                    <input
                      id="su-email"
                      type="email"
                      [(ngModel)]="signupEmail"
                      [placeholder]="store.authModalRole() === 'teacher' ? 'professeur@education.tn' : 'contact@famille.tn'"
                      class="w-full text-xs p-3 bg-white border border-[#CBD9E2] rounded-[10px] text-[#102A43] placeholder:text-[#829AB1] focus:border-[#007CC2] focus:ring-3 focus:ring-[#E8F5FC] outline-none transition-all" />
                  </div>

                  <div>
                    <label for="su-password" class="block text-xs font-medium text-[#486581] mb-1">
                      {{ store.authModalRole() === 'student' ? lang.tr('Code PIN ou Mot de passe (min 6 car.)', 'الرمز السري أو كلمة المرور (6 أحرف/أرقام على الأقل)') : lang.tr('Mot de passe (min 6 caractères)', 'كلمة العبور (6 أحرف على الأقل)') }} *
                    </label>
                    <input
                      id="su-password"
                      type="password"
                      [(ngModel)]="signupPassword"
                      placeholder="••••••••"
                      class="w-full text-xs p-3 bg-white border border-[#CBD9E2] rounded-[10px] text-[#102A43] outline-none focus:border-[#007CC2] transition-all" />
                  </div>

                  <button
                    type="button"
                    (click)="handleSignupSubmit()"
                    class="w-full bg-[#007CC2] hover:bg-[#006EAD] text-white font-semibold text-sm py-3 rounded-[10px] shadow-xs transition-colors cursor-pointer mt-2">
                    {{ lang.tr('Créer mon espace gratuitement', 'إنشاء الفضاء مجاناً') }}
                  </button>
                </div>
              </div>
            }

            <!-- LOGIN MODE -->
            @if (store.authModalMode() === 'login') {
              <div class="space-y-3">
                <div>
                  <label for="li-email" class="block text-xs font-medium text-[#5B6B60] mb-1">
                    {{ lang.t('authEmailOrUser') }}
                  </label>
                  <input
                    id="li-email"
                    type="email"
                    [(ngModel)]="loginEmail"
                    placeholder="exemple@madrasati.tn"
                    class="w-full text-xs p-3 bg-white border border-[#E7DFCF] rounded-xl text-[#14251D] placeholder:text-[#6B7A70] focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] outline-none" />
                </div>

                <div>
                  <div class="flex items-center justify-between mb-1">
                    <label for="li-password" class="text-xs font-medium text-[#5B6B60]">
                      {{ lang.tr('Mot de passe', 'كلمة العبور') }}
                    </label>
                    <a href="javascript:void(0)" class="text-[11px] text-[#8A5A00] hover:underline">
                      {{ lang.tr('Mot de passe oublié ?', 'نسيت كلمة السر؟') }}
                    </a>
                  </div>
                  <input
                    id="li-password"
                    type="password"
                    [(ngModel)]="loginPassword"
                    placeholder="••••••••"
                    class="w-full text-xs p-3 bg-white border border-[#E7DFCF] rounded-xl text-[#14251D] outline-none" />
                </div>

                <button
                  type="button"
                  (click)="handleEmailLogin()"
                  class="w-full bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold text-sm py-3.5 rounded-xl shadow-xs transition-colors cursor-pointer">
                  {{ lang.tr('Se connecter', 'تسجيل الدخول') }}
                </button>

                <!-- 1-Click Fast Demo Logins -->
                <div class="pt-4 border-t border-[#E7DFCF]">
                  <p class="text-[11px] font-semibold text-[#5B6B60] text-center mb-2.5">
                    {{ lang.tr('Accès rapide Démo 1-Clic :', 'دخول فوري تجريبي بنقرة واحدة:') }}
                  </p>
                  <div class="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      (click)="quickDemoLogin('teacher')"
                      class="p-2.5 rounded-[10px] bg-white hover:bg-[#F3FAFD] text-[#007CC2] border border-[#CBD9E2] text-xs font-semibold transition-colors cursor-pointer text-center flex flex-col items-center">
                      <span class="material-icons text-base mb-0.5 text-[#007CC2]">school</span>
                      {{ lang.tr('Enseignant', 'معلم(ة)') }}
                      <span class="block text-[10px] text-[#829AB1] font-normal">Démo</span>
                    </button>
                    <button
                      type="button"
                      (click)="quickDemoLogin('parent')"
                      class="p-2.5 rounded-[10px] bg-white hover:bg-[#FFF5DD] text-[#B7791F] border border-[#CBD9E2] text-xs font-semibold transition-colors cursor-pointer text-center flex flex-col items-center">
                      <span class="material-icons text-base mb-0.5 text-[#B7791F]">family_restroom</span>
                      {{ lang.tr('Parent', 'ولي أمر') }}
                      <span class="block text-[10px] text-[#829AB1] font-normal">Démo</span>
                    </button>
                    <button
                      type="button"
                      (click)="quickDemoLogin('student')"
                      class="p-2.5 rounded-[10px] bg-white hover:bg-[#FCEBF0] text-[#D9486E] border border-[#CBD9E2] text-xs font-semibold transition-colors cursor-pointer text-center flex flex-col items-center">
                      <span class="material-icons text-base mb-0.5 text-[#D9486E]">auto_stories</span>
                      {{ lang.tr('Élève', 'تلميذ(ة)') }}
                      <span class="block text-[10px] text-[#829AB1] font-normal">Démo</span>
                    </button>
                  </div>
                </div>
              </div>
            }

            }

          </div>

          <!-- Footer note -->
          <div class="p-4 bg-[#F2ECDE] border-t border-[#E7DFCF] text-center text-[11px] text-[#5B6B60]">
            {{ lang.t('authMinistryCompliance') }}
          </div>

        </div>
      </div>
    }
  `,
})
export class AuthModalComponent {
  readonly store = inject(EducationStore);
  readonly lang = inject(LanguageService);
  readonly firebase = inject(FirebaseService);

  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  // Signup fields
  signupName = '';
  signupGender: 'male' | 'female' = 'male';
  signupEmail = '';
  signupPassword = '';
  signupSchool = '';
  signupGov = '';
  signupPhone = '';
  signupGrade = '4ème Année';
  signupSubject = 'Mathématiques';

  // Login fields
  loginEmail = '';
  loginPassword = '';

  namePlaceholder(): string {
    const role = this.store.authModalRole();
    if (role === 'teacher') {
      return this.lang.tr('Prénom et Nom (ex: Prof. Ben Amor)', 'الاسم واللقب (مثال: أستاذ بن عمر)');
    }
    if (role === 'parent') {
      return this.lang.tr('Prénom et Nom du tuteur', 'اسم الولي واللقب');
    }
    return this.lang.tr('Prénom et Nom de l\'élève', 'اسم التلميذ واللقب');
  }

  // Post-Google profile completion (Google gives no gender/subject/school)
  readonly completionMode = signal<boolean>(false);
  readonly selectedCompletionRole = signal<UserRole>('teacher');

  constructor() {
    // Reset error when switching auth modal mode
    effect(() => {
      this.store.authModalMode();
      this.errorMessage.set(null);
    });

    // A redirect-based Google login resumes after a full page reload:
    // reopen the modal directly on the completion step.
    effect(() => {
      if (this.firebase.needsProfileCompletion()) {
        this.firebase.needsProfileCompletion.set(false);
        const currentProfileRole = this.firebase.userProfile()?.role || 'teacher';
        this.selectedCompletionRole.set(currentProfileRole);
        this.completionMode.set(true);
        this.store.openLoginModal();
      }
    });
  }

  async handleGoogleAuth() {
    this.errorMessage.set(null);
    this.isLoading.set(true);
    try {
      const targetRole = this.store.authModalMode() === 'signup'
        ? this.store.authModalRole()
        : (this.store.currentRole() === 'home' ? 'teacher' : this.store.currentRole());

      const profile = await this.firebase.loginWithGoogle(targetRole as UserRole);
      if (profile) {
        this.selectedCompletionRole.set(profile.role);
        const needsGender = !profile.gender;
        const needsSubject = profile.role === 'teacher' && !profile.primarySubject;
        if (needsGender || needsSubject) {
          // Keep the modal open on a short completion step instead of closing.
          this.completionMode.set(true);
          return;
        }
        this.store.switchRole(profile.role);
        this.store.closeAuthModal();
      }
    } catch (err: unknown) {
      this.errorMessage.set(err instanceof Error ? err.message : 'Erreur lors de la connexion Google');
    } finally {
      this.isLoading.set(false);
    }
  }

  async submitCompletion() {
    this.errorMessage.set(null);
    const role = this.selectedCompletionRole();

    if (role === 'teacher' && (!this.signupSchool.trim() || !this.signupGov.trim())) {
      this.errorMessage.set(this.lang.tr('Veuillez renseigner votre école et votre gouvernorat.', 'يرجى إدخال المدرسة والولاية.'));
      return;
    }

    this.isLoading.set(true);
    try {
      await this.firebase.updateUserProfile({
        role,
        gender: this.signupGender,
        primarySubject: role === 'teacher' ? this.signupSubject : undefined,
        school: this.signupSchool.trim() || undefined,
        delegation: this.signupGov.trim() || undefined,
      });
      this.completionMode.set(false);
      this.store.switchRole(role);
      this.store.closeAuthModal();
    } catch (err: unknown) {
      this.errorMessage.set(err instanceof Error ? err.message : 'Erreur lors de la mise à jour du profil');
    } finally {
      this.isLoading.set(false);
    }
  }

  async handleSignupSubmit() {
    this.errorMessage.set(null);

    // Validation
    const name = this.signupName.trim();
    const email = this.signupEmail.trim();
    const password = this.signupPassword.trim();
    const role = this.store.authModalRole();

    if (!name) {
      this.errorMessage.set(this.lang.tr('Veuillez renseigner votre nom complet.', 'يرجى إدخال الاسم واللقب.'));
      return;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.errorMessage.set(this.lang.tr('Veuillez saisir une adresse email valide.', 'يرجى إدخال بريد إلكتروني صالح.'));
      return;
    }

    if (!password || password.length < 6) {
      this.errorMessage.set(this.lang.tr('Le mot de passe / code doit comporter au moins 6 caractères.', 'كلمة المرور / الرمز السري يجب أن تتكون من 6 أحرف/أرقام على الأقل.'));
      return;
    }

    if (role === 'teacher' && (!this.signupSchool.trim() || !this.signupGov.trim())) {
      this.errorMessage.set(this.lang.tr('Veuillez renseigner votre école et votre gouvernorat.', 'يرجى إدخال المدرسة والولاية.'));
      return;
    }

    if (role === 'parent' && !this.signupPhone.trim()) {
      this.errorMessage.set(this.lang.tr('Veuillez renseigner votre numéro de téléphone.', 'يرجى إدخال رقم الهاتف للتواصل.'));
      return;
    }

    this.isLoading.set(true);
    try {
      const profile = await this.firebase.signup({
        displayName: name,
        email,
        password,
        role,
        school: this.signupSchool.trim() || undefined,
        delegation: this.signupGov.trim() || undefined,
        phone: this.signupPhone.trim() || undefined,
        grade: this.signupGrade,
        primarySubject: role === 'teacher' ? this.signupSubject : undefined,
        gender: this.signupGender,
      });
      this.store.switchRole(profile.role);
      this.store.closeAuthModal();
    } catch (err: unknown) {
      this.errorMessage.set(err instanceof Error ? err.message : 'Erreur lors de la création du compte');
    } finally {
      this.isLoading.set(false);
    }
  }

  async handleEmailLogin() {
    this.errorMessage.set(null);
    const email = this.loginEmail.trim();
    const password = this.loginPassword.trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.errorMessage.set(this.lang.tr('Veuillez renseigner une adresse email valide.', 'يرجى إدخال بريد إلكتروني صالح.'));
      return;
    }

    if (!password) {
      this.errorMessage.set(this.lang.tr('Veuillez saisir votre mot de passe.', 'يرجى إدخال كلمة المرور.'));
      return;
    }

    this.isLoading.set(true);
    try {
      const targetRole = this.store.currentRole() === 'home' ? 'teacher' : this.store.currentRole();
      const profile = await this.firebase.loginWithEmail(email, password, targetRole);
      this.store.switchRole(profile.role);
      this.store.closeAuthModal();
    } catch (err: unknown) {
      this.errorMessage.set(err instanceof Error ? err.message : 'Identifiants ou mot de passe incorrects');
    } finally {
      this.isLoading.set(false);
    }
  }

  async quickDemoLogin(role: 'teacher' | 'parent' | 'student') {
    this.errorMessage.set(null);
    this.isLoading.set(true);
    try {
      if (role === 'teacher') {
        await this.firebase.loginWithEmail('enseignant.demo@madrasati.tn', undefined, 'teacher');
        this.store.switchRole('teacher');
      } else if (role === 'parent') {
        await this.firebase.loginWithEmail('parent.demo@madrasati.tn', undefined, 'parent');
        this.store.switchRole('parent');
      } else {
        await this.firebase.loginWithEmail('eleve.demo@madrasati.tn', undefined, 'student');
        this.store.switchRole('student');
      }
      this.store.closeAuthModal();
    } catch (err: unknown) {
      this.errorMessage.set(err instanceof Error ? err.message : 'Erreur accès démo');
    } finally {
      this.isLoading.set(false);
    }
  }
}
