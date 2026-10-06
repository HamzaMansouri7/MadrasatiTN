import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  ProfileService,
  FirebaseService,
  LanguageService,
  EducationStore,
  GradeLevel,
  UserRole,
  ChildProfile,
} from '@core';
import { TeacherAvatarComponent } from '@shared';

export type ProfileTab = 'profile' | 'children' | 'saved' | 'settings' | 'published';

@Component({
  selector: 'app-profile-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterLink, TeacherAvatarComponent],
  template: `
    <div class="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      
      <!-- Top Profile Header / Cartouche Officielle -->
      <div class="bg-[#14251D] text-[#FBF8F1] rounded-2xl p-6 shadow-md relative overflow-hidden border border-[#233D30]">
        <div class="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <!-- Avatar + Upload/Change overlay -->
          <div class="relative group shrink-0">
            <app-teacher-avatar
              [avatarUrl]="profile()?.photoURL"
              [avatarId]="profile()?.photoURL?.startsWith('/assets/avatars/') ? profile()?.photoURL?.replace('/assets/avatars/', '')?.replace('.svg', '') : undefined"
              [name]="profile()?.displayName"
              size="xl"
              class="ring-4 ring-[#2D6A4F]/60 rounded-full" />
            
            @if (currentRole() !== 'student') {
              <label
                class="absolute inset-0 rounded-full bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity text-[11px] font-semibold">
                <span class="material-icons text-lg">photo_camera</span>
                <span>{{ isUploadingAvatar() ? '...' : lang.tr('Changer', 'تغيير') }}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  class="hidden"
                  (change)="handleAvatarSelected($event)"
                  [disabled]="isUploadingAvatar()" />
              </label>
            }
          </div>

          <div class="space-y-2 text-center sm:text-left flex-1">
            <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 class="font-display font-semibold text-xl sm:text-2xl tracking-tight text-[#FBF8F1]">
                {{ profile()?.displayName || lang.tr('Utilisateur Madrasati', 'مستخدم مدرستي') }}
              </h1>
              <span class="text-xs px-2.5 py-0.5 rounded-full font-medium bg-[#2D6A4F] text-[#FBF8F1] border border-[#3E8B67]">
                {{ roleLabel() }}
              </span>
              @if (currentRole() === 'teacher') {
                <a
                  [routerLink]="['/teachers', profile()?.uid]"
                  class="text-xs px-2.5 py-0.5 rounded-full font-medium bg-[#007CC2]/30 text-[#85D4FF] border border-[#007CC2]/60 hover:bg-[#007CC2]/50 transition-colors flex items-center gap-1">
                  <span class="material-icons text-xs">visibility</span>
                  {{ lang.tr('Voir ma page publique', 'عرض صفحتي العامة') }}
                </a>
              }
            </div>

            <p class="text-xs text-[#B7C7BC]">
              {{ profile()?.email || lang.tr('Compte personnel sécurisé', 'حساب شخصي مؤمن') }}
              @if (profile()?.school) {
                <span> · {{ profile()?.school }}</span>
              }
            </p>

            <!-- Role Switcher (if dual role) -->
            <div class="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span class="text-[11px] text-[#8EA395]">{{ lang.tr('Rôle actif :', 'الدور النشط:') }}</span>
              <button
                (click)="switchRole('parent')"
                [class]="currentRole() === 'parent' ? 'bg-[#F2C14E] text-[#14251D] font-bold' : 'bg-[#233D30] text-[#B7C7BC] hover:text-white'"
                class="text-xs px-3 py-1 rounded-lg transition-colors cursor-pointer border border-[#3A5A4A]">
                {{ lang.tr('Parent', 'ولي أمر') }}
              </button>
              <button
                (click)="switchRole('teacher')"
                [class]="currentRole() === 'teacher' ? 'bg-[#F2C14E] text-[#14251D] font-bold' : 'bg-[#233D30] text-[#B7C7BC] hover:text-white'"
                class="text-xs px-3 py-1 rounded-lg transition-colors cursor-pointer border border-[#3A5A4A]">
                {{ lang.tr('Enseignant', 'معلم') }}
              </button>
              <button
                (click)="switchRole('student')"
                [class]="currentRole() === 'student' ? 'bg-[#F2C14E] text-[#14251D] font-bold' : 'bg-[#233D30] text-[#B7C7BC] hover:text-white'"
                class="text-xs px-3 py-1 rounded-lg transition-colors cursor-pointer border border-[#3A5A4A]">
                {{ lang.tr('Élève', 'تلميذ') }}
              </button>
            </div>
          </div>
        </div>

        <!-- Completeness Meter -->
        @if (completeness().score < 100) {
          <div class="mt-5 pt-4 border-t border-[#233D30] space-y-2">
            <div class="flex items-center justify-between text-xs">
              <span class="text-[#B7C7BC] font-medium flex items-center gap-1.5">
                <span class="material-icons text-sm text-[#F2C14E]">insights</span>
                {{ lang.tr('Complétude du profil', 'اكتمال الملف الشخصي') }}
              </span>
              <span class="font-mono font-bold text-[#F2C14E]">{{ completeness().score }}%</span>
            </div>
            <div class="w-full bg-[#0D1A14] h-2 rounded-full overflow-hidden border border-[#233D30]">
              <div class="bg-[#F2C14E] h-full transition-all duration-300" [style.width.%]="completeness().score"></div>
            </div>
            @if (completeness().missingSteps.length > 0) {
              <p class="text-[11px] text-[#9DBBA8]">
                {{ lang.tr('À compléter :', 'مطلوب للإكمال:') }} {{ completeness().missingSteps.join(' · ') }}
              </p>
            }
          </div>
        }
      </div>

      <!-- Navigation Tabs -->
      <div class="flex items-center gap-2 border-b border-[#E7DFCF] pb-2 overflow-x-auto">
        <button
          (click)="setTab('profile')"
          [class]="activeTab() === 'profile' ? 'bg-[#2D6A4F] text-[#FBF8F1]' : 'bg-[#F2ECDE] text-[#4A5A50] hover:bg-[#E7DFCF]'"
          class="px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors shrink-0 flex items-center gap-1.5">
          <span class="material-icons text-sm">badge</span>
          {{ lang.tr('Informations & Profil', 'المعلومات الشخصية') }}
        </button>

        @if (currentRole() === 'parent') {
          <button
            (click)="setTab('children')"
            [class]="activeTab() === 'children' ? 'bg-[#2D6A4F] text-[#FBF8F1]' : 'bg-[#F2ECDE] text-[#4A5A50] hover:bg-[#E7DFCF]'"
            class="px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors shrink-0 flex items-center gap-1.5">
            <span class="material-icons text-sm">family_restroom</span>
            {{ lang.tr('Mes Enfants', 'أبنائي') }}
            <span class="bg-[#14251D] text-[#FBF8F1] text-[10px] px-1.5 py-0.2 rounded-full">{{ children().length }}</span>
          </button>
        }

        @if (currentRole() === 'teacher') {
          <button
            (click)="setTab('published')"
            [class]="activeTab() === 'published' ? 'bg-[#2D6A4F] text-[#FBF8F1]' : 'bg-[#F2ECDE] text-[#4A5A50] hover:bg-[#E7DFCF]'"
            class="px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors shrink-0 flex items-center gap-1.5">
            <span class="material-icons text-sm">library_books</span>
            {{ lang.tr('Contenus Pédagogiques', 'المحتويات المنشورة') }}
          </button>
        }

        <button
          (click)="setTab('saved')"
          [class]="activeTab() === 'saved' ? 'bg-[#2D6A4F] text-[#FBF8F1]' : 'bg-[#F2ECDE] text-[#4A5A50] hover:bg-[#E7DFCF]'"
          class="px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors shrink-0 flex items-center gap-1.5">
          <span class="material-icons text-sm">bookmark</span>
          {{ lang.tr('Favoris & Enregistrements', 'المحفوظات والمتابعات') }}
          <span class="bg-[#14251D] text-[#FBF8F1] text-[10px] px-1.5 py-0.2 rounded-full">{{ store.totalWatchlistCount() }}</span>
        </button>

        <button
          (click)="setTab('settings')"
          [class]="activeTab() === 'settings' ? 'bg-[#2D6A4F] text-[#FBF8F1]' : 'bg-[#F2ECDE] text-[#4A5A50] hover:bg-[#E7DFCF]'"
          class="px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors shrink-0 flex items-center gap-1.5">
          <span class="material-icons text-sm">settings</span>
          {{ lang.tr('Paramètres & Compte', 'الإعدادات والحساب') }}
        </button>
      </div>

      <!-- TAB 1: PROFILE EDIT FORM -->
      @if (activeTab() === 'profile') {
        <div class="bg-white rounded-2xl p-6 border border-[#E7DFCF] space-y-6 shadow-xs">
          <div>
            <h2 class="font-display font-semibold text-base text-[#14251D]">
              {{ lang.tr('Données d’identification et profil', 'بيانات الهوية والملف') }}
            </h2>
            <p class="text-xs text-[#6B7A70]">
              {{ lang.tr('Gérez vos informations personnelles et vos coordonnées.', 'إدارة بياناتك الشخصية ومعلومات الاتصال.') }}
            </p>
          </div>

          <!-- Student Illustrated Avatar Selector -->
          @if (currentRole() === 'student') {
            <div class="space-y-3">
              <p class="block text-xs font-semibold text-[#14251D]">
                {{ lang.tr('Choisissez votre avatar illustré', 'اختر صورتك الرمزية') }}
              </p>
              <div class="grid grid-cols-3 sm:grid-cols-6 gap-3">
                @for (avId of ['avatar-1', 'avatar-2', 'avatar-3', 'avatar-4', 'avatar-5', 'avatar-6']; track avId) {
                  <button
                    type="button"
                    (click)="selectStudentAvatar(avId)"
                    [class]="selectedStudentAvatar() === avId ? 'ring-3 ring-[#2D6A4F] bg-[#F2ECDE]' : 'border border-[#E7DFCF] bg-[#FBF8F1] hover:bg-[#F2ECDE]'"
                    class="p-2 rounded-xl flex flex-col items-center gap-2 cursor-pointer transition-all">
                    <img [src]="'/assets/avatars/' + avId + '.svg'" alt="Avatar" class="w-12 h-12 rounded-full" />
                    <span class="text-[11px] font-mono text-[#14251D]">{{ avId }}</span>
                  </button>
                }
              </div>
            </div>
          }

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label for="pf-1" class="block text-xs font-semibold text-[#14251D] mb-1">
                {{ currentRole() === 'student' ? lang.tr('Pseudo élève *', 'الاسم المستعار للتلميذ *') : lang.tr('Nom et prénom *', 'الاسم واللقب *') }}
              </label>
              <input id="pf-1"
                type="text"
                [(ngModel)]="editName"
                placeholder="Ex: Mohamed Ben Ali"
                class="w-full bg-[#FBF8F1] border border-[#D5CDBC] rounded-xl px-3.5 py-2.5 text-xs text-[#14251D] focus:outline-none focus:border-[#2D6A4F]" />
            </div>

            <div>
              <label for="pf-2" class="block text-xs font-semibold text-[#14251D] mb-1">
                {{ lang.tr('Adresse email', 'البريد الإلكتروني') }}
              </label>
              <input id="pf-2"
                type="email"
                [value]="profile()?.email || ''"
                disabled
                class="w-full bg-[#F2ECDE] border border-[#D5CDBC] rounded-xl px-3.5 py-2.5 text-xs text-[#6B7A70] cursor-not-allowed" />
            </div>

            @if (currentRole() === 'parent') {
              <div>
                <label for="pf-3" class="block text-xs font-semibold text-[#14251D] mb-1">
                  {{ lang.tr('Numéro de téléphone (Privé)', 'رقم الهاتف (خاص ومحمى)') }}
                </label>
                <input id="pf-3"
                  type="tel"
                  [(ngModel)]="editPhone"
                  placeholder="Ex: +216 98 123 456"
                  class="w-full bg-[#FBF8F1] border border-[#D5CDBC] rounded-xl px-3.5 py-2.5 text-xs text-[#14251D] focus:outline-none focus:border-[#2D6A4F]" />
                <span class="text-[10px] text-[#6B7A70] mt-1 block">
                  🔒 {{ lang.tr('Strictement confidentiel, jamais partagé publiquement.', 'سري تماماً، لا يظهر للعموم إطلاقاً.') }}
                </span>
              </div>

              <div>
                <label for="pf-4" class="block text-xs font-semibold text-[#14251D] mb-1">
                  {{ lang.tr('Gouvernorat / Ville', 'الولاية / المدينة') }}
                </label>
                <input id="pf-4"
                  type="text"
                  [(ngModel)]="editDelegation"
                  placeholder="Ex: Ariana, Tunis, Sousse"
                  class="w-full bg-[#FBF8F1] border border-[#D5CDBC] rounded-xl px-3.5 py-2.5 text-xs text-[#14251D] focus:outline-none focus:border-[#2D6A4F]" />
              </div>
            }

            @if (currentRole() === 'teacher') {
              <div>
                <label for="pf-5" class="block text-xs font-semibold text-[#14251D] mb-1">
                  {{ lang.tr('Titre pédagogique', 'الصفة البيداغوجية') }}
                </label>
                <input id="pf-5"
                  type="text"
                  [(ngModel)]="editTitle"
                  placeholder="Ex: Professeur principal de l'enseignement primaire"
                  class="w-full bg-[#FBF8F1] border border-[#D5CDBC] rounded-xl px-3.5 py-2.5 text-xs text-[#14251D] focus:outline-none focus:border-[#2D6A4F]" />
              </div>

              <div>
                <label for="pf-6" class="block text-xs font-semibold text-[#14251D] mb-1">
                  {{ lang.tr('Établissement scolaire', 'المؤسسة التربوية') }}
                </label>
                <input id="pf-6"
                  type="text"
                  [(ngModel)]="editSchool"
                  placeholder="Ex: École Primaire Habib Bourguiba"
                  class="w-full bg-[#FBF8F1] border border-[#D5CDBC] rounded-xl px-3.5 py-2.5 text-xs text-[#14251D] focus:outline-none focus:border-[#2D6A4F]" />
              </div>

              <div>
                <label for="pf-7" class="block text-xs font-semibold text-[#14251D] mb-1">
                  {{ lang.tr('Délégation / Gouvernorat', 'المعتمدية / المندوبية') }}
                </label>
                <input id="pf-7"
                  type="text"
                  [(ngModel)]="editDelegation"
                  placeholder="Ex: Ariana Ville, Ariana"
                  class="w-full bg-[#FBF8F1] border border-[#D5CDBC] rounded-xl px-3.5 py-2.5 text-xs text-[#14251D] focus:outline-none focus:border-[#2D6A4F]" />
              </div>

              <div>
                <label for="pf-8" class="block text-xs font-semibold text-[#14251D] mb-1">
                  {{ lang.tr('Identifiant CNP / Ministère (Privé)', 'المعرف المهني (خاص)') }}
                </label>
                <input id="pf-8"
                  type="text"
                  [(ngModel)]="editCnpId"
                  placeholder="Ex: CNP-TN-XXXX"
                  class="w-full bg-[#FBF8F1] border border-[#D5CDBC] rounded-xl px-3.5 py-2.5 text-xs text-[#14251D] focus:outline-none focus:border-[#2D6A4F]" />
              </div>
            }

            @if (currentRole() === 'student') {
              <div>
                <label for="pf-9" class="block text-xs font-semibold text-[#14251D] mb-1">
                  {{ lang.tr('Classe / Niveau scolaire *', 'القسم / المستوى الدراسي *') }}
                </label>
                <select id="pf-9"
                  [(ngModel)]="editGrade"
                  class="w-full bg-[#FBF8F1] border border-[#D5CDBC] rounded-xl px-3.5 py-2.5 text-xs text-[#14251D] focus:outline-none focus:border-[#2D6A4F]">
                  <option value="1ère Année">1ère Année (السنة الأولى)</option>
                  <option value="2ème Année">2ème Année (السنة الثانية)</option>
                  <option value="3ème Année">3ème Année (السنة الثالثة)</option>
                  <option value="4ème Année">4ème Année (السنة الرابعة)</option>
                  <option value="5ème Année">5ème Année (السنة الخامسة)</option>
                  <option value="6ème Année">6ème Année (السنة السادسة)</option>
                </select>
              </div>

              <div>
                <label for="pf-10" class="block text-xs font-semibold text-[#14251D] mb-1">
                  {{ lang.tr('École primaire', 'المدرسة الابتدائية') }}
                </label>
                <input id="pf-10"
                  type="text"
                  [(ngModel)]="editSchool"
                  placeholder="Ex: École de la République"
                  class="w-full bg-[#FBF8F1] border border-[#D5CDBC] rounded-xl px-3.5 py-2.5 text-xs text-[#14251D] focus:outline-none focus:border-[#2D6A4F]" />
              </div>
            }
          </div>

          @if (currentRole() === 'teacher') {
            <div class="space-y-2">
              <label for="pf-11" class="block text-xs font-semibold text-[#14251D]">
                {{ lang.tr('Présentation biographique & démarche pédagogique', 'التعريف البيداغوجي والمنهجية') }}
              </label>
              <textarea id="pf-11"
                [(ngModel)]="editBio"
                rows="3"
                maxlength="500"
                placeholder="Ex: Enseignant passionné de mathématiques et d'éveil scientifique..."
                class="w-full bg-[#FBF8F1] border border-[#D5CDBC] rounded-xl p-3 text-xs text-[#14251D] focus:outline-none focus:border-[#2D6A4F]"></textarea>
              <span class="text-[10px] text-[#6B7A70] block text-right">
                {{ editBio.length }}/500 {{ lang.tr('caractères', 'حرف') }}
              </span>
            </div>
          }

          <div class="flex items-center justify-end gap-3 pt-3 border-t border-[#E7DFCF]">
            <button
              (click)="saveProfile()"
              [disabled]="isSaving()"
              class="bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] px-5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50">
              <span class="material-icons text-sm">save</span>
              {{ isSaving() ? lang.tr('Enregistrement...', 'جاري الحفظ...') : lang.tr('Enregistrer les modifications', 'حفظ التغييرات') }}
            </button>
          </div>
        </div>
      }

      <!-- TAB 2: CHILDREN MANAGEMENT (PARENT ONLY) -->
      @if (activeTab() === 'children' && currentRole() === 'parent') {
        <div class="space-y-5">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="font-display font-semibold text-base text-[#14251D]">
                {{ lang.tr('Espace Enfants & Suivi Scolaire', 'فضاء الأبناء والمتابعة الدراسية') }}
              </h2>
              <p class="text-xs text-[#6B7A70]">
                {{ lang.tr('Ajoutez vos enfants pour personnaliser leurs exercices et suivre leurs progrès.', 'أضف أبناءك لتخصيص التمارين ومتابعة تقدمهم.') }}
              </p>
            </div>
            <button
              (click)="openAddChildModal()"
              class="bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 shadow-xs">
              <span class="material-icons text-sm">add</span>
              {{ lang.tr('Ajouter un enfant', 'إضافة ابن') }}
            </button>
          </div>

          @if (children().length === 0) {
            <div class="bg-white rounded-2xl p-8 border border-[#E7DFCF] text-center space-y-4 shadow-xs">
              <div class="w-16 h-16 bg-[#F2ECDE] rounded-full flex items-center justify-center mx-auto text-[#2D6A4F]">
                <span class="material-icons text-3xl">child_care</span>
              </div>
              <div class="space-y-1">
                <h3 class="font-display font-semibold text-base text-[#14251D]">
                  {{ lang.tr('Aucun enfant enregistré pour le moment', 'لم يتم تسجيل أي تلميذ بعد') }}
                </h3>
                <p class="text-xs text-[#6B7A70] max-w-md mx-auto">
                  {{ lang.tr('Ajoutez vos enfants pour générer des devoirs adaptés à leur niveau et synchroniser leur progression.', 'أضف أبناءك للوصول إلى التمارين المخصصة لمستواهم وتتبع تقدمهم.') }}
                </p>
              </div>
              <button
                (click)="openAddChildModal()"
                class="bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] px-5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors inline-flex items-center gap-1.5">
                <span class="material-icons text-sm">add_circle</span>
                {{ lang.tr('Ajouter mon premier enfant', 'إضافة ابني الأول') }}
              </button>
            </div>
          } @else {
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              @for (child of children(); track child.id) {
                <div class="bg-white rounded-2xl p-5 border border-[#E7DFCF] space-y-4 shadow-xs hover:border-[#2D6A4F] transition-all">
                  <div class="flex items-center gap-3">
                    <img [src]="'/assets/avatars/' + child.avatarId + '.svg'" alt="Avatar" class="w-12 h-12 rounded-full border border-[#D5CDBC]" />
                    <div class="flex-1 min-w-0">
                      <h4 class="font-display font-semibold text-sm text-[#14251D] truncate">{{ child.nickname }}</h4>
                      <p class="text-xs text-[#2D6A4F] font-medium">{{ child.grade }}</p>
                      @if (child.school) {
                        <p class="text-[11px] text-[#6B7A70] truncate">{{ child.school }}</p>
                      }
                    </div>
                  </div>

                  <div class="flex items-center justify-between pt-3 border-t border-[#E7DFCF] text-xs">
                    <button
                      (click)="store.setActiveStudent(child.id)"
                      [class]="store.activeStudentId() === child.id ? 'bg-[#2D6A4F] text-[#FBF8F1]' : 'bg-[#F2ECDE] text-[#14251D] hover:bg-[#E7DFCF]'"
                      class="px-3 py-1.5 rounded-lg font-semibold cursor-pointer transition-colors flex items-center gap-1">
                      <span class="material-icons text-xs">{{ store.activeStudentId() === child.id ? 'check_circle' : 'radio_button_unchecked' }}</span>
                      {{ store.activeStudentId() === child.id ? lang.tr('Actif', 'النشط') : lang.tr('Sélectionner', 'تحديد') }}
                    </button>
                    
                    <div class="flex items-center gap-1">
                      <button
                        (click)="confirmDeleteChild(child)"
                        class="text-[#C1121F] hover:bg-[#FDF0ED] p-1.5 rounded-lg transition-colors cursor-pointer"
                        title="Supprimer">
                        <span class="material-icons text-base">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- TAB 3: SAVED WATCHLIST -->
      @if (activeTab() === 'saved') {
        <div class="bg-white rounded-2xl p-6 border border-[#E7DFCF] space-y-6 shadow-xs">
          <div>
            <h2 class="font-display font-semibold text-base text-[#14251D]">
              {{ lang.tr('Documents enregistrés et enseignants suivis', 'الوثائق المحفوظة والمعلمون المتابعون') }}
            </h2>
            <p class="text-xs text-[#6B7A70]">
              {{ lang.tr('Retrouvez tous vos favoris synchronisés avec votre compte.', 'جميع عناصرك المفضلة متزامنة مع حسابك.') }}
            </p>
          </div>

          <!-- Followed Teachers -->
          <div class="space-y-3">
            <h3 class="text-xs font-bold text-[#14251D] uppercase tracking-wider flex items-center gap-1.5">
              <span class="material-icons text-sm text-[#2D6A4F]">school</span>
              {{ lang.tr('Enseignants suivis', 'المعلمون المتابعون') }} ({{ store.watchedTeachers().length }})
            </h3>
            @if (store.watchedTeachers().length === 0) {
              <p class="text-xs text-[#6B7A70] italic bg-[#FBF8F1] p-3 rounded-xl border border-[#E7DFCF]">
                {{ lang.tr('Aucun enseignant suivi pour le moment.', 'لم تقم بمتابعة أي معلم بعد.') }}
              </p>
            } @else {
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                @for (t of store.watchedTeachers(); track t.id) {
                  <div class="bg-[#FBF8F1] p-3 rounded-xl border border-[#E7DFCF] flex items-center justify-between">
                    <div class="flex items-center gap-2.5">
                      <app-teacher-avatar [avatarUrl]="t.avatarUrl" [name]="t.displayName || t.name" size="sm" />
                      <div>
                        <a [routerLink]="['/teachers', t.id]" class="font-semibold text-xs text-[#14251D] hover:text-[#2D6A4F]">
                          {{ t.displayName || t.name }}
                        </a>
                        <p class="text-[11px] text-[#6B7A70]">{{ t.school }}</p>
                      </div>
                    </div>
                    <button
                      (click)="store.toggleWatchlist(t.id, 'teacher')"
                      class="text-xs text-[#C1121F] hover:underline cursor-pointer font-medium">
                      {{ lang.tr('Ne plus suivre', 'إلغاء المتابعة') }}
                    </button>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Saved Courses & Sheets -->
          <div class="space-y-3 pt-3 border-t border-[#E7DFCF]">
            <h3 class="text-xs font-bold text-[#14251D] uppercase tracking-wider flex items-center gap-1.5">
              <span class="material-icons text-sm text-[#2D6A4F]">description</span>
              {{ lang.tr('Fiches et Manuels sauvegardés', 'الوثائق والدروس المحفوظة') }} ({{ store.watchedCourses().length }})
            </h3>
            @if (store.watchedCourses().length === 0) {
              <p class="text-xs text-[#6B7A70] italic bg-[#FBF8F1] p-3 rounded-xl border border-[#E7DFCF]">
                {{ lang.tr('Aucune fiche enregistrée.', 'لا توجد وثائق محفوظة.') }}
              </p>
            } @else {
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                @for (c of store.watchedCourses(); track c.id) {
                  <div class="bg-[#FBF8F1] p-3 rounded-xl border border-[#E7DFCF] flex items-center justify-between">
                    <div class="min-w-0 flex-1 pr-2">
                      <p class="font-semibold text-xs text-[#14251D] truncate">{{ c.title }}</p>
                      <p class="text-[11px] text-[#6B7A70]">{{ c.subject }} · {{ c.grade }}</p>
                    </div>
                    <button
                      (click)="store.toggleWatchlist(c.id, 'course')"
                      class="text-xs text-[#C1121F] hover:underline cursor-pointer font-medium shrink-0">
                      {{ lang.tr('Retirer', 'حذف') }}
                    </button>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }

      <!-- TAB 4: PUBLISHED TEACHER CONTENT -->
      @if (activeTab() === 'published' && currentRole() === 'teacher') {
        <div class="bg-white rounded-2xl p-6 border border-[#E7DFCF] space-y-6 shadow-xs">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="font-display font-semibold text-base text-[#14251D]">
                {{ lang.tr('Mes Publications Pédagogiques', 'منشوراتي البيداغوجية') }}
              </h2>
              <p class="text-xs text-[#6B7A70]">
                {{ lang.tr('Documents, séries d’exercices et devoirs publiés avec votre signature officielle.', 'الوثائق والتمارين المنشورة بتوقيعك الرسمي.') }}
              </p>
            </div>
            <a
              routerLink="/editor"
              class="bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs">
              <span class="material-icons text-sm">add</span>
              {{ lang.tr('Nouvelle fiche A4', 'وثيقة A4 جديدة') }}
            </a>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            @for (c of teacherCourses(); track c.id) {
              <div class="bg-[#FBF8F1] p-4 rounded-xl border border-[#E7DFCF] space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-[11px] font-mono bg-[#EAE4D5] text-[#14251D] px-2 py-0.5 rounded-sm">{{ c.docType || 'Document' }}</span>
                  <span class="text-[11px] text-[#6B7A70]">{{ c.grade }}</span>
                </div>
                <h4 class="font-semibold text-xs text-[#14251D]">{{ c.title }}</h4>
                <p class="text-[11px] text-[#2D6A4F] font-medium">{{ c.subject }}</p>
              </div>
            }
          </div>
        </div>
      }

      <!-- TAB 5: SETTINGS & ACCOUNT -->
      @if (activeTab() === 'settings') {
        <div class="bg-white rounded-2xl p-6 border border-[#E7DFCF] space-y-6 shadow-xs">
          <div>
            <h2 class="font-display font-semibold text-base text-[#14251D]">
              {{ lang.tr('Paramètres du compte & Confidentialité', 'إعدادات الحساب والخصوصية') }}
            </h2>
            <p class="text-xs text-[#6B7A70]">
              {{ lang.tr('Contrôlez vos préférences de notifications, langue et vos droits RGPD.', 'التحكم في الإشعارات واللغة والحقوق الرقمية.') }}
            </p>
          </div>

          <!-- Notification Preferences -->
          <div class="space-y-3">
            <h3 class="text-xs font-bold text-[#14251D] uppercase tracking-wider">
              {{ lang.tr('Préférences des Notifications', 'تفضيلات الإشعارات') }}
            </h3>
            <div class="space-y-2">
              <label class="flex items-center justify-between p-3 rounded-xl bg-[#FBF8F1] border border-[#E7DFCF] cursor-pointer">
                <div>
                  <p class="text-xs font-semibold text-[#14251D]">
                    {{ lang.tr('Notifications d’activités et réponses', 'إشعارات الأنشطة والردود') }}
                  </p>
                  <p class="text-[11px] text-[#6B7A70]">
                    {{ lang.tr('Nouvelles réponses aux questions, corrections et devoirs.', 'إشعار عند إضافة ردود أو تصحيح تمارين.') }}
                  </p>
                </div>
                <input
                  type="checkbox"
                  [(ngModel)]="prefActivity"
                  (change)="savePreferences()"
                  class="w-4 h-4 accent-[#2D6A4F]" />
              </label>

              <label class="flex items-center justify-between p-3 rounded-xl bg-[#FBF8F1] border border-[#E7DFCF] cursor-pointer">
                <div>
                  <p class="text-xs font-semibold text-[#14251D]">
                    {{ lang.tr('Annonces officielles et nouveautés CNP', 'البلاغات الرسمية ومستجدات البرامج') }}
                  </p>
                  <p class="text-[11px] text-[#6B7A70]">
                    {{ lang.tr('Mises à jour des manuels et annonces des enseignants.', 'تحديثات الكتب المدرسية وبلاغات المربين.') }}
                  </p>
                </div>
                <input
                  type="checkbox"
                  [(ngModel)]="prefAnnouncements"
                  (change)="savePreferences()"
                  class="w-4 h-4 accent-[#2D6A4F]" />
              </label>
            </div>
          </div>

          <!-- Language Preference -->
          <div class="space-y-3 pt-3 border-t border-[#E7DFCF]">
            <h3 class="text-xs font-bold text-[#14251D] uppercase tracking-wider">
              {{ lang.tr('Langue de l’interface', 'لغة الواجهة') }}
            </h3>
            <div class="flex gap-3">
              <button
                (click)="setLang('ar')"
                [class]="lang.lang() === 'ar' ? 'bg-[#2D6A4F] text-[#FBF8F1]' : 'bg-[#F2ECDE] text-[#14251D] hover:bg-[#E7DFCF]'"
                class="px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors">
                🇹🇳 العربية (Al-Arabiya)
              </button>
              <button
                (click)="setLang('fr')"
                [class]="lang.lang() === 'fr' ? 'bg-[#2D6A4F] text-[#FBF8F1]' : 'bg-[#F2ECDE] text-[#14251D] hover:bg-[#E7DFCF]'"
                class="px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors">
                🇫🇷 Français
              </button>
            </div>
          </div>

          <!-- Privacy & Data Management (GDPR) -->
          <div class="space-y-3 pt-3 border-t border-[#E7DFCF]">
            <h3 class="text-xs font-bold text-[#14251D] uppercase tracking-wider">
              {{ lang.tr('Gestion des Données Personnelles (RGPD)', 'إدارة البيانات الشخصية') }}
            </h3>
            <div class="flex flex-wrap gap-3">
              <button
                (click)="exportData()"
                class="bg-[#F2ECDE] hover:bg-[#E7DFCF] text-[#14251D] px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 border border-[#D5CDBC]">
                <span class="material-icons text-sm">download</span>
                {{ lang.tr('Exporter mes données (JSON)', 'تصدير بياناتي (JSON)') }}
              </button>

              <button
                (click)="confirmDeleteAccount()"
                class="bg-[#FDF0ED] hover:bg-[#FCE3DE] text-[#C1121F] px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 border border-[#F5C2BA]">
                <span class="material-icons text-sm">delete_forever</span>
                {{ lang.tr('Supprimer mon compte définitivement', 'حذف حسابي نهائياً') }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>

    <!-- MODAL: ADD CHILD -->
    @if (isAddChildModalOpen()) {
      <div class="fixed inset-0 z-50 bg-[#14251D]/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-[#FBF8F1] rounded-2xl max-w-md w-full p-6 space-y-4 border border-[#E7DFCF] shadow-xl">
          <div class="flex items-center justify-between border-b border-[#E7DFCF] pb-3">
            <h3 class="font-display font-semibold text-[#14251D] text-sm">
              {{ lang.tr('Ajouter un enfant', 'إضافة ابن جديد') }}
            </h3>
            <button (click)="isAddChildModalOpen.set(false)" class="text-[#6B7A70] hover:text-[#14251D] cursor-pointer">
              <span class="material-icons">close</span>
            </button>
          </div>

          <div class="space-y-3">
            <div>
              <label for="pf-12" class="block text-xs font-semibold text-[#14251D] mb-1">
                {{ lang.tr('Prénom ou Pseudo de l’élève *', 'اسم أو لقب التلميذ *') }}
              </label>
              <input id="pf-12"
                type="text"
                [(ngModel)]="newChildName"
                placeholder="Ex: Youssef"
                class="w-full bg-white border border-[#D5CDBC] rounded-xl px-3.5 py-2.5 text-xs text-[#14251D] focus:outline-none focus:border-[#2D6A4F]" />
            </div>

            <div>
              <label for="pf-13" class="block text-xs font-semibold text-[#14251D] mb-1">
                {{ lang.tr('Niveau scolaire (Classe) *', 'المستوى الدراسي *') }}
              </label>
              <select id="pf-13"
                [(ngModel)]="newChildGrade"
                class="w-full bg-white border border-[#D5CDBC] rounded-xl px-3.5 py-2.5 text-xs text-[#14251D] focus:outline-none focus:border-[#2D6A4F]">
                <option value="1ère Année">1ère Année (السنة الأولى)</option>
                <option value="2ème Année">2ème Année (السنة الثانية)</option>
                <option value="3ème Année">3ème Année (السنة الثالثة)</option>
                <option value="4ème Année">4ème Année (السنة الرابعة)</option>
                <option value="5ème Année">5ème Année (السنة الخامسة)</option>
                <option value="6ème Année">6ème Année (السنة السادسة)</option>
              </select>
            </div>

            <div>
              <label for="pf-14" class="block text-xs font-semibold text-[#14251D] mb-1">
                {{ lang.tr('Établissement scolaire (Optionnel)', 'المدرسة (اختياري)') }}
              </label>
              <input id="pf-14"
                type="text"
                [(ngModel)]="newChildSchool"
                placeholder="Ex: École Primaire Habib Bourguiba"
                class="w-full bg-white border border-[#D5CDBC] rounded-xl px-3.5 py-2.5 text-xs text-[#14251D] focus:outline-none focus:border-[#2D6A4F]" />
            </div>

            <div>
              <p class="block text-xs font-semibold text-[#14251D] mb-1">
                {{ lang.tr('Avatar illustré', 'الصورة الرمزية') }}
              </p>
              <div class="grid grid-cols-6 gap-2">
                @for (avId of ['avatar-1', 'avatar-2', 'avatar-3', 'avatar-4', 'avatar-5', 'avatar-6']; track avId) {
                  <button
                    type="button"
                    (click)="newChildAvatar = avId"
                    [class]="newChildAvatar === avId ? 'ring-2 ring-[#2D6A4F] bg-[#F2ECDE]' : 'border border-[#E7DFCF] bg-white'"
                    class="p-1 rounded-xl flex items-center justify-center cursor-pointer">
                    <img [src]="'/assets/avatars/' + avId + '.svg'" alt="Avatar" class="w-8 h-8 rounded-full" />
                  </button>
                }
              </div>
            </div>
          </div>

          <div class="flex gap-2 pt-3 border-t border-[#E7DFCF]">
            <button
              (click)="isAddChildModalOpen.set(false)"
              class="flex-1 bg-[#F2ECDE] hover:bg-[#E7DFCF] text-[#14251D] font-semibold py-2.5 rounded-xl text-xs cursor-pointer transition-colors">
              {{ lang.tr('Annuler', 'إلغاء') }}
            </button>
            <button
              (click)="submitAddChild()"
              [disabled]="!newChildName.trim()"
              class="flex-1 bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold py-2.5 rounded-xl text-xs cursor-pointer transition-colors disabled:opacity-50">
              {{ lang.tr('Ajouter', 'تأكيد الإضافة') }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ProfileShellComponent implements OnInit {
  readonly profileService = inject(ProfileService);
  readonly firebase = inject(FirebaseService);
  readonly lang = inject(LanguageService);
  readonly store = inject(EducationStore);
  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);

  readonly profile = this.profileService.userProfile;
  readonly completeness = this.profileService.completeness;
  readonly children = this.profileService.children;

  readonly activeTab = signal<ProfileTab>('profile');
  readonly isSaving = signal<boolean>(false);
  readonly isUploadingAvatar = signal<boolean>(false);
  readonly isAddChildModalOpen = signal<boolean>(false);

  // Profile form state
  editName = '';
  editPhone = '';
  editTitle = '';
  editSchool = '';
  editDelegation = '';
  editCnpId = '';
  editGrade: GradeLevel = '4ème Année';
  editBio = '';
  selectedStudentAvatar = signal<string>('avatar-1');

  // Preferences state
  prefActivity = true;
  prefAnnouncements = true;

  // New child modal state
  newChildName = '';
  newChildGrade: GradeLevel = '1ère Année';
  newChildSchool = '';
  newChildAvatar = 'avatar-1';

  readonly currentRole = computed<UserRole>(() => {
    const p = this.profile();
    return p?.activeRole || p?.role || 'parent';
  });

  readonly roleLabel = computed(() => {
    switch (this.currentRole()) {
      case 'teacher': return this.lang.tr('Enseignant', 'معلم');
      case 'student': return this.lang.tr('Élève', 'تلميذ');
      default: return this.lang.tr('Parent d’élève', 'ولي أمر');
    }
  });

  readonly teacherCourses = computed(() => {
    const p = this.profile();
    if (!p) return [];
    return this.store.courses().filter((c) => c.authorId === p.uid || c.teacherName === p.displayName);
  });

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      if (params['tab']) {
        this.activeTab.set(params['tab'] as ProfileTab);
      }
    });

    const p = this.profile();
    if (p) {
      this.editName = p.displayName || '';
      this.editPhone = p.phone || '';
      this.editTitle = p.title || '';
      this.editSchool = p.school || '';
      this.editDelegation = p.delegation || p.governorate || '';
      this.editCnpId = p.cnpId || '';
      this.editGrade = (p.grade as GradeLevel) || '4ème Année';
      this.editBio = p.bio || '';
      this.prefActivity = p.notificationPrefs?.activity ?? true;
      this.prefAnnouncements = p.notificationPrefs?.announcements ?? true;
    }
  }

  setTab(tab: ProfileTab) {
    this.activeTab.set(tab);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge',
    });
  }

  async switchRole(role: UserRole) {
    await this.profileService.switchRole(role);
  }

  selectStudentAvatar(avId: string) {
    this.selectedStudentAvatar.set(avId);
    void this.profileService.update({ photoURL: `/assets/avatars/${avId}.svg` });
  }

  async handleAvatarSelected(e: Event) {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    this.isUploadingAvatar.set(true);
    try {
      await this.profileService.uploadAvatar(file);
      this.store.showToast(this.lang.tr('Photo de profil mise à jour', 'تم تحديث الصورة الشخصية'));
    } catch (err) {
      console.error('Avatar upload error:', err);
      this.store.showToast(this.lang.tr('Erreur lors du téléchargement de l’avatar', 'فشل تحميل الصورة'));
    } finally {
      this.isUploadingAvatar.set(false);
    }
  }

  async saveProfile() {
    this.isSaving.set(true);
    try {
      await this.profileService.update({
        displayName: this.editName.trim(),
        phone: this.editPhone.trim() || undefined,
        title: this.editTitle.trim() || undefined,
        school: this.editSchool.trim() || undefined,
        delegation: this.editDelegation.trim() || undefined,
        governorate: this.editDelegation.trim() || undefined,
        cnpId: this.editCnpId.trim() || undefined,
        grade: this.currentRole() === 'student' ? this.editGrade : undefined,
        bio: this.editBio.trim() || undefined,
        onboardedAt: Date.now(),
      });
      this.store.showToast(this.lang.tr('Profil enregistré avec succès', 'تم حفظ الملف الشخصي بنجاح'));
    } catch (err) {
      console.error('Save profile error:', err);
      this.store.showToast(this.lang.tr('Erreur lors de l’enregistrement', 'حدث خطأ أثناء الحفظ'));
    } finally {
      this.isSaving.set(false);
    }
  }

  openAddChildModal() {
    this.newChildName = '';
    this.newChildGrade = '1ère Année';
    this.newChildSchool = '';
    this.newChildAvatar = 'avatar-1';
    this.isAddChildModalOpen.set(true);
  }

  async submitAddChild() {
    if (!this.newChildName.trim()) return;
    try {
      await this.profileService.addChild({
        nickname: this.newChildName.trim(),
        grade: this.newChildGrade,
        avatarId: this.newChildAvatar,
        school: this.newChildSchool.trim() || undefined,
      });
      this.isAddChildModalOpen.set(false);
      this.store.showToast(this.lang.tr('Enfant ajouté avec succès', 'تمت إضافة الابن بنجاح'));
    } catch (err) {
      console.error('Add child error:', err);
      this.store.showToast(this.lang.tr('Erreur lors de l’ajout', 'حدث خطأ أثناء الإضافة'));
    }
  }

  async confirmDeleteChild(child: ChildProfile) {
    const ok = confirm(
      this.lang.tr(
        `Êtes-vous sûr de vouloir supprimer ${child.nickname} ? Ses données de progression seront effacées.`,
        `هل أنت متأكد من رغبتك في حذف ${child.nickname}؟ سيتم حذف جميع بيانات تقدمه.`
      )
    );
    if (!ok) return;

    try {
      await this.profileService.deleteChild(child.id);
      this.store.showToast(this.lang.tr('Enfant supprimé', 'تم حذف السجل'));
    } catch (err) {
      console.error('Delete child error:', err);
    }
  }

  async savePreferences() {
    await this.profileService.update({
      notificationPrefs: {
        activity: this.prefActivity,
        announcements: this.prefAnnouncements,
      },
    });
  }

  setLang(langCode: 'fr' | 'ar') {
    this.lang.setLanguage(langCode);
    void this.profileService.update({ preferredLang: langCode });
  }

  async exportData() {
    try {
      const json = await this.profileService.exportUserData();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `madrasati-data-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export data error:', err);
    }
  }

  async confirmDeleteAccount() {
    const ok1 = confirm(
      this.lang.tr(
        'ATTENTION : Êtes-vous certain de vouloir supprimer définitivement votre compte Madrasati TN ?',
        'تنبيه: هل أنت متأكد تماماً من رغبتك في حذف حسابك نهائياً من مدرستي تونس؟'
      )
    );
    if (!ok1) return;

    const ok2 = confirm(
      this.lang.tr(
        'Cette action est irréversible. Toutes vos données (enfants, favoris, publications) seront effacées.',
        'هذا الإجراء نهائي ولا يمكن التراجع عنه. سيتم حذف كافة البيانات.'
      )
    );
    if (!ok2) return;

    await this.profileService.deleteAccount();
    this.router.navigate(['/']);
  }
}
