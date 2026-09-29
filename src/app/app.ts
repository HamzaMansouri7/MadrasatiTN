import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NavbarComponent } from './components/navbar';
import { TeacherHomeComponent } from './components/teacher-home';
import { ParentHomeComponent } from './components/parent-home';
import { StudentHomeComponent } from './components/student-home';
import { PublicDiscoveryComponent } from './components/public-discovery';
import { EducationStore } from './services/education-store';
import { LanguageService } from './services/language.service';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NavbarComponent,
    TeacherHomeComponent,
    ParentHomeComponent,
    StudentHomeComponent,
    PublicDiscoveryComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly store = inject(EducationStore);
  readonly lang = inject(LanguageService);
}
