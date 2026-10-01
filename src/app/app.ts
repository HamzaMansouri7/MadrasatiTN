import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { EducationStore, LanguageService } from '@core';
import { NavbarComponent, AuthModalComponent } from '@shared';
import {
  LandingHomeComponent,
  TeacherHomeComponent,
  ParentHomeComponent,
  StudentHomeComponent,
  PublicDiscoveryComponent,
  EditorStudioComponent,
  ArticleStudioComponent,
} from '@features';

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
    EditorStudioComponent,
    ArticleStudioComponent,
    AuthModalComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly store = inject(EducationStore);
  readonly lang = inject(LanguageService);
}
