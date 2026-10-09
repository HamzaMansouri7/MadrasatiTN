import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DocCardComponent } from './doc-card';
import { Course, LanguageService } from '@core';

describe('DocCardComponent', () => {
  let fixture: ComponentFixture<DocCardComponent>;
  let component: DocCardComponent;

  const mockCourse: Course = {
    id: 'c-1',
    classId: 'class-1',
    title: 'Exercices Fractions 4ème',
    summary: 'Fiche d exercices sur les fractions simples.',
    subject: 'Mathématiques',
    grade: '4ème Année',
    authorId: 't-1',
    teacherName: 'Mme Ben Ali',
    docType: 'Série d\'Exercices',
    content: 'Contenu du cours...',
    createdAt: 'Hier à 10:00',
    viewsCount: 5,
    tags: ['fractions'],
    trimester: 'Trimestre 1',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocCardComponent],
      providers: [LanguageService],
    }).compileComponents();

    fixture = TestBed.createComponent(DocCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('course', mockCourse);
    fixture.detectChanges();
  });

  it('should render course title and summary', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Exercices Fractions 4ème');
    expect(el.textContent).toContain('Fiche d exercices sur les fractions simples.');
  });

  it('should render a share button and emit print and preview events', () => {
    let printedCourse: Course | undefined;
    let previewedCourse: Course | undefined;

    component.print.subscribe((c) => {
      printedCourse = c;
    });
    component.preview.subscribe((c) => {
      previewedCourse = c;
    });

    // Sharing moved into <app-share-button>; the card itself no longer emits copyLink.
    expect(fixture.nativeElement.querySelector('app-share-button')).toBeTruthy();

    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    // First button: print, last button: preview (the share menu buttons sit in between).
    buttons[0].click();
    expect(printedCourse?.id).toBe('c-1');

    buttons[buttons.length - 1].click();
    expect(previewedCourse?.id).toBe('c-1');
  });
});
