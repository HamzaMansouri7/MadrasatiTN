import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TeacherCardComponent } from './teacher-card';
import { provideRouter } from '@angular/router';
import { LanguageService, TeacherProfile } from '@core';

describe('TeacherCardComponent', () => {
  let fixture: ComponentFixture<TeacherCardComponent>;
  let component: TeacherCardComponent;

  const mockTeacher: TeacherProfile = {
    id: 't-1',
    name: 'Mme Fatma',
    displayName: 'Mme Fatma Ben Salah',
    title: 'Professeure de Français',
    school: 'École Hannibal',
    subjects: ['Français'],
    taughtGrades: ['4ème Année'],
    bio: 'Enseignante dévouée depuis 10 ans.',
    verified: 'verified',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeacherCardComponent],
      providers: [provideRouter([]), LanguageService],
    }).compileComponents();

    fixture = TestBed.createComponent(TeacherCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('teacher', mockTeacher);
    fixture.detectChanges();
  });

  it('should render teacher name, title and school', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Mme Fatma Ben Salah');
    expect(el.textContent).toContain('Professeure de Français');
    expect(el.textContent).toContain('École Hannibal');
  });

  it('should emit toggleWatch on bookmark button click', () => {
    let watched: TeacherProfile | undefined;
    component.toggleWatch.subscribe((t) => {
      watched = t;
    });

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button).toBeTruthy();
    button.click();
    expect(watched?.id).toBe('t-1');
  });
});
