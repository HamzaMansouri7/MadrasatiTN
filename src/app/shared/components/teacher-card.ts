import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService, TeacherProfile } from '@core';
import { TeacherAvatarComponent } from './teacher-avatar';

@Component({
  selector: 'app-teacher-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TeacherAvatarComponent],
  template: `
    <div class="bg-white rounded-2xl p-6 border border-[#E7DFCF] shadow-xs space-y-4 text-center hover:shadow-[0_18px_45px_-30px_rgba(20,38,29,0.5)] transition-shadow flex flex-col justify-between">
      <div class="space-y-4">
        <div class="relative inline-block mx-auto">
          <app-teacher-avatar
            [name]="teacher().displayName || teacher().name"
            [avatarUrl]="teacher().avatarUrl"
            [avatarId]="teacher().avatarId"
            [gender]="teacher().gender"
            size="xl" />

          @if (teacher().verified === 'verified') {
            <span
              class="material-icons absolute bottom-0 right-0 rtl:right-auto rtl:left-0 bg-[#2D6A4F] text-[#FBF8F1] rounded-full text-base p-0.5 border-2 border-white"
              [title]="lang.tr('Enseignant Certifié Éducation Nationale', 'مربٍ معتمد وموثق لدى المنصة')">
              verified
            </span>
          }
        </div>

        <div>
          <h3 class="font-display font-semibold text-[#14251D] text-base flex items-center justify-center gap-1.5">
            {{ teacher().displayName || teacher().name }}
            <span class="text-[#2D6A4F] font-semibold bg-[#E8F5FC] border border-[#2D6A4F]/20 px-1.5 py-0.5 rounded text-[10px]">TN</span>
          </h3>
          <p class="text-xs text-[#5B6B60] font-medium">{{ teacher().title }}</p>
          <p class="text-[11px] text-[#2D6A4F] font-semibold mt-0.5">{{ teacher().school }}</p>
        </div>

        @if (teacher().bio; as bio) {
          @if (bio.trim().length > 0) {
            <p class="text-xs text-[#4A5A50] line-clamp-3 bg-[#FBF8F1] p-3 rounded-xl border border-[#E7DFCF] text-start">
              {{ bio }}
            </p>
          }
        }

        <!-- Subject tags -->
        @if (teacher().subjects && teacher().subjects.length > 0) {
          <div class="flex flex-wrap justify-center gap-1.5 pt-1">
            @for (s of teacher().subjects.slice(0, 3); track s) {
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#E8F5FC] text-[#007CC2]">
                {{ lang.translateSubject(s) }}
              </span>
            }
          </div>
        }
      </div>

      <div class="flex items-center gap-2 pt-3 border-t border-[#E7DFCF]">
        <button
          type="button"
          (click)="toggleWatch.emit(teacher())"
          [class]="isWatched() ? 'bg-[#F2ECDE] text-[#8A5A00] border-[#8A5A00]/40' : 'bg-[#FBF8F1] hover:bg-[#F2ECDE] text-[#4A5A50] border-[#E7DFCF]'"
          class="px-3 py-2.5 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1 cursor-pointer transition-colors"
          [title]="isWatched() ? 'Ne plus suivre' : 'Suivre cet enseignant'">
          <span class="material-icons text-sm" aria-hidden="true">{{ isWatched() ? 'bookmark' : 'bookmark_border' }}</span>
          <span>{{ isWatched() ? lang.tr('Suivi', 'متابع') : lang.tr('Suivre', 'متابعة') }}</span>
        </button>

        <a
          [routerLink]="['/teachers', teacher().id]"
          class="flex-1 bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold text-xs py-2.5 rounded-xl cursor-pointer flex items-center justify-center gap-1 transition-colors shadow-xs">
          <span class="material-icons text-sm" aria-hidden="true">badge</span>
          <span>{{ lang.tr('Voir le profil', 'عرض الملف') }}</span>
        </a>
      </div>
    </div>
  `,
})
export class TeacherCardComponent {
  readonly lang = inject(LanguageService);

  readonly teacher = input.required<TeacherProfile>();
  readonly isWatched = input<boolean>(false);

  readonly toggleWatch = output<TeacherProfile>();
}
