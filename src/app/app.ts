import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NavbarComponent } from './components/navbar';
import { TeacherHomeComponent } from './components/teacher-home';
import { ParentHomeComponent } from './components/parent-home';
import { StudentHomeComponent } from './components/student-home';
import { PublicDiscoveryComponent } from './components/public-discovery';
import { LandingHomeComponent } from './components/landing-home';
import { AuthModalComponent } from './components/auth-modal';
import { EducationStore } from './services/education-store';
import { LanguageService } from './services/language.service';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NavbarComponent,
    LandingHomeComponent,
    TeacherHomeComponent,
    ParentHomeComponent,
    StudentHomeComponent,
    PublicDiscoveryComponent,
    AuthModalComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly store = inject(EducationStore);
  readonly lang = inject(LanguageService);
}
