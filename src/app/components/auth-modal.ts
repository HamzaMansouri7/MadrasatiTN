import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EducationStore } from '../services/education-store';
import { LanguageService } from '../services/language.service';
import { FirebaseService } from '../services/firebase.service';
import { UserRole } from '../models/education.model';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (store.isAuthModalOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div class="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh]">
          
          <!-- Header Banner -->
          <div class="bg-gradient-to-r from-emerald-700 via-teal-700 to-indigo-800 p-6 text-white relative">
            <button
              (click)="store.closeAuthModal()"
              class="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              title="Fermer">
              <span class="material-icons">close</span>
            </button>

            <div class="flex items-center gap-3 mb-2">
              <div class="w-10 h-10 rounded-2xl bg-white text-emerald-800 font-extrabold flex items-center justify-center text-lg font-arabic shadow-md">
                م
              </div>
              <div>
                <h3 class="text-xl font-extrabold tracking-tight">Madrasati TN</h3>
                <p class="text-xs text-emerald-100">
                  {{ lang.tr('Plateforme Éducative Tunisienne', 'المنصة التعليمية التونسية') }}
                </p>
              </div>
            </div>

            <!-- Mode Switcher Tabs -->
            <div class="flex bg-black/20 p-1 rounded-2xl mt-4">
              <button
                type="button"
                (click)="store.authModalMode.set('login')"
                [class]="store.authModalMode() === 'login' ? 'bg-white text-emerald-950 font-bold shadow-xs' : 'text-white/80 hover:text-white font-medium'"
                class="flex-1 py-2 text-xs rounded-xl transition-all cursor-pointer text-center">
                {{ lang.tr('Se connecter', 'تسجيل الدخول') }}
              </button>
              <button
                type="button"
                (click)="store.authModalMode.set('signup')"
                [class]="store.authModalMode() === 'signup' ? 'bg-white text-emerald-950 font-bold shadow-xs' : 'text-white/80 hover:text-white font-medium'"
                class="flex-1 py-2 text-xs rounded-xl transition-all cursor-pointer text-center">
                {{ lang.tr('Créer un compte', 'إنشاء حساب جديد') }}
              </button>
            </div>
          </div>

          <!-- Body Content -->
          <div class="p-6 overflow-y-auto space-y-5">

            <!-- Google Sign-In Quick Action -->
            <button
              type="button"
              (click)="handleGoogleAuth()"
              [disabled]="isLoading()"
              class="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm py-3 px-4 rounded-2xl border border-slate-300 shadow-xs hover:border-slate-400 transition-all cursor-pointer">
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
              <div class="flex-grow border-t border-slate-200"></div>
              <span class="px-3 text-[11px] text-slate-400 uppercase font-semibold">
                {{ lang.tr('ou avec vos identifiants', 'أو بالبيانات الشخصية') }}
              </span>
              <div class="flex-grow border-t border-slate-200"></div>
            </div>

            <!-- SIGNUP MODE: Role Choice ("signup as : *") -->
            @if (store.authModalMode() === 'signup') {
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-2">
                  {{ lang.t('authSignupAs') }} *
                </label>
                <div class="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    (click)="store.authModalRole.set('teacher')"
                    [class]="store.authModalRole() === 'teacher' ? 'border-emerald-600 bg-emerald-50/80 text-emerald-900 ring-2 ring-emerald-500' : 'border-slate-200 hover:bg-slate-50 text-slate-700'"
                    class="p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center">
                    <span class="text-xl mb-1">👩‍🏫</span>
                    <span class="text-xs font-bold">{{ lang.tr('Enseignant', 'معلم(ة)') }}</span>
                  </button>

                  <button
                    type="button"
                    (click)="store.authModalRole.set('parent')"
                    [class]="store.authModalRole() === 'parent' ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 ring-2 ring-indigo-500' : 'border-slate-200 hover:bg-slate-50 text-slate-700'"
                    class="p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center">
                    <span class="text-xl mb-1">👨‍👩‍👦</span>
                    <span class="text-xs font-bold">{{ lang.tr('Parent', 'ولي أمر') }}</span>
                  </button>

                  <button
                    type="button"
                    (click)="store.authModalRole.set('student')"
                    [class]="store.authModalRole() === 'student' ? 'border-amber-600 bg-amber-50/80 text-amber-900 ring-2 ring-amber-500' : 'border-slate-200 hover:bg-slate-50 text-slate-700'"
                    class="p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center">
                    <span class="text-xl mb-1">🎒</span>
                    <span class="text-xs font-bold">{{ lang.tr('Élève', 'تلميذ(ة)') }}</span>
                  </button>
                </div>
              </div>

              <!-- Dynamic Fields by Role -->
              <div class="space-y-3">
                <div>
                  <label class="block text-xs font-semibold text-slate-600 mb-1">
                    {{ store.authModalRole() === 'student' ? lang.t('authStudentName') : lang.t('authFullName') }} *
                  </label>
                  <input
                    type="text"
                    [(ngModel)]="signupName"
                    [placeholder]="store.authModalRole() === 'teacher' ? 'Mme Amel Ben Ali' : (store.authModalRole() === 'parent' ? 'M. Youssef Mansouri' : 'Ahmed Mansouri')"
                    class="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 outline-none" />
                </div>

                @if (store.authModalRole() === 'teacher') {
                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <label class="block text-xs font-semibold text-slate-600 mb-1">École primaire *</label>
                      <input
                        type="text"
                        [(ngModel)]="signupSchool"
                        placeholder="Ex: École Habib Bourguiba"
                        class="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl outline-none" />
                    </div>
                    <div>
                      <label class="block text-xs font-semibold text-slate-600 mb-1">Gouvernorat *</label>
                      <input
                        type="text"
                        [(ngModel)]="signupGov"
                        placeholder="Ex: Ariana, Tunis, Sfax"
                        class="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl outline-none" />
                    </div>
                  </div>
                }

                @if (store.authModalRole() === 'parent') {
                  <div>
                    <label class="block text-xs font-semibold text-slate-600 mb-1">
                      {{ lang.tr('Numéro WhatsApp (pour alertes devoirs)', 'رقم الواتساب لاستلام الإشعارات') }} *
                    </label>
                    <input
                      type="tel"
                      [(ngModel)]="signupPhone"
                      placeholder="+216 98 123 456"
                      class="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl outline-none" />
                  </div>
                }

                @if (store.authModalRole() === 'student') {
                  <div>
                    <label class="block text-xs font-semibold text-slate-600 mb-1">
                      {{ lang.tr('Classe / Niveau', 'القسم / السنة الدراسية') }} *
                    </label>
                    <select
                      [(ngModel)]="signupGrade"
                      class="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl outline-none">
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
                  <label class="block text-xs font-semibold text-slate-600 mb-1">
                    {{ store.authModalRole() === 'student' ? lang.tr('Code secret ou Email parent', 'الرمز السري أو بريد الولي') : lang.tr('Adresse Email', 'البريد الإلكتروني') }} *
                  </label>
                  <input
                    type="email"
                    [(ngModel)]="signupEmail"
                    [placeholder]="store.authModalRole() === 'teacher' ? 'professeur@education.tn' : 'contact@famille.tn'"
                    class="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl outline-none" />
                </div>

                <div>
                  <label class="block text-xs font-semibold text-slate-600 mb-1">
                    {{ store.authModalRole() === 'student' ? lang.tr('Code PIN (4 chiffres)', 'الرمز السري (4 أرقام)') : lang.tr('Mot de passe', 'كلمة العبور') }} *
                  </label>
                  <input
                    type="password"
                    [(ngModel)]="signupPassword"
                    placeholder="••••••••"
                    class="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl outline-none" />
                </div>

                <button
                  type="button"
                  (click)="handleSignupSubmit()"
                  class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm py-3.5 rounded-2xl shadow-md transition-all cursor-pointer mt-2">
                  {{ lang.tr('Créer mon espace gratuitement', 'إنشاء الفضاء مجاناً') }} 🚀
                </button>
              </div>
            }

            <!-- LOGIN MODE -->
            @if (store.authModalMode() === 'login') {
              <div class="space-y-3">
                <div>
                  <label class="block text-xs font-semibold text-slate-600 mb-1">
                    {{ lang.t('authEmailOrUser') }}
                  </label>
                  <input
                    type="email"
                    [(ngModel)]="loginEmail"
                    placeholder="exemple@madrasati.tn"
                    class="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:bg-white focus:border-emerald-600" />
                </div>

                <div>
                  <div class="flex items-center justify-between mb-1">
                    <label class="text-xs font-semibold text-slate-600">
                      {{ lang.tr('Mot de passe', 'كلمة العبور') }}
                    </label>
                    <a href="javascript:void(0)" class="text-[11px] text-emerald-700 hover:underline">
                      {{ lang.tr('Mot de passe oublié ?', 'نسيت كلمة السر؟') }}
                    </a>
                  </div>
                  <input
                    type="password"
                    [(ngModel)]="loginPassword"
                    placeholder="••••••••"
                    class="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl outline-none" />
                </div>

                <button
                  type="button"
                  (click)="handleEmailLogin()"
                  class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm py-3.5 rounded-2xl shadow-md transition-all cursor-pointer">
                  {{ lang.tr('Se connecter', 'تسجيل الدخول') }}
                </button>

                <!-- 1-Click Fast Demo Logins -->
                <div class="pt-4 border-t border-slate-200">
                  <p class="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center mb-2.5">
                    {{ lang.tr('⚡ Accès rapide Démo 1-Clic :', '⚡ دخول فوري تجريبي بنقرة واحدة:') }}
                  </p>
                  <div class="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      (click)="quickDemoLogin('teacher')"
                      class="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-semibold transition-all cursor-pointer text-center">
                      👩‍🏫 Mme Amel
                      <span class="block text-[10px] text-emerald-700 font-normal">Enseignante</span>
                    </button>
                    <button
                      type="button"
                      (click)="quickDemoLogin('parent')"
                      class="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 text-xs font-semibold transition-all cursor-pointer text-center">
                      👨‍👩‍👦 M. Youssef
                      <span class="block text-[10px] text-indigo-700 font-normal">Parent</span>
                    </button>
                    <button
                      type="button"
                      (click)="quickDemoLogin('student')"
                      class="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold transition-all cursor-pointer text-center">
                      🎒 Ahmed
                      <span class="block text-[10px] text-amber-700 font-normal">Élève 4ème</span>
                    </button>
                  </div>
                </div>
              </div>
            }

          </div>

          <!-- Footer note -->
          <div class="p-4 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-500">
            🇹🇳 {{ lang.t('authMinistryCompliance') }}
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

  // Signup fields
  signupName = 'Mme Dorsaf Tlili';
  signupEmail = 'professeur@madrasati.tn';
  signupPassword = 'password123';
  signupSchool = 'École Primaire Habib Bourguiba';
  signupGov = 'Ariana';
  signupPhone = '+216 98 123 456';
  signupGrade = '4ème Année';

  // Login fields
  loginEmail = 'professeur@madrasati.tn';
  loginPassword = 'password123';

  async handleGoogleAuth() {
    this.isLoading.set(true);
    try {
      const targetRole = this.store.authModalMode() === 'signup' 
        ? this.store.authModalRole() 
        : (this.store.currentRole() === 'home' ? 'teacher' : this.store.currentRole());
      
      const profile = await this.firebase.loginWithGoogle(targetRole as UserRole);
      if (profile) {
        this.store.switchRole(profile.role);
        this.store.closeAuthModal();
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  handleSignupSubmit() {
    const role = this.store.authModalRole();
    this.firebase.signup({
      displayName: this.signupName || 'Nouvel Utilisateur',
      email: this.signupEmail || 'user@madrasati.tn',
      role,
      school: this.signupSchool,
      phone: this.signupPhone,
      grade: this.signupGrade,
    });
    this.store.switchRole(role);
    this.store.closeAuthModal();
  }

  handleEmailLogin() {
    const targetRole = this.store.currentRole() === 'home' ? 'teacher' : this.store.currentRole();
    this.firebase.loginWithEmail(this.loginEmail, targetRole);
    this.store.switchRole(targetRole);
    this.store.closeAuthModal();
  }

  quickDemoLogin(role: 'teacher' | 'parent' | 'student') {
    if (role === 'teacher') {
      this.firebase.loginWithEmail('amel.benali@madrasati.tn', 'teacher', 'Mme Amel Ben Ali');
      this.store.switchRole('teacher');
    } else if (role === 'parent') {
      this.firebase.loginWithEmail('youssef.mansouri@madrasati.tn', 'parent', 'M. Youssef Mansouri');
      this.store.switchRole('parent');
    } else {
      this.firebase.loginWithEmail('ahmed@madrasati.tn', 'student', 'Ahmed Mansouri');
      this.store.switchRole('student');
    }
    this.store.closeAuthModal();
  }
}
