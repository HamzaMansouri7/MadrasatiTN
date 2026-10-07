import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QaThreadComponent } from './qa-thread';
import { LanguageService, QuestionThread } from '@core';

describe('QaThreadComponent', () => {
  let fixture: ComponentFixture<QaThreadComponent>;
  let component: QaThreadComponent;

  const mockThread: QuestionThread = {
    id: 't-1',
    title: 'Question sur les fractions',
    content: 'Comment expliquer les fractions simples à un enfant ?',
    subject: 'Mathématiques',
    grade: '4ème Année',
    parentName: 'Mohamed',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    answers: [
      {
        id: 'a-1',
        threadId: 't-1',
        teacherName: 'Mme Ben Ali',
        teacherTitle: 'Professeure de Mathématiques',
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        content: 'Utilisez des schémas visuels en pizza ou carrés.',
        isVerifiedAnswer: true,
        likesCount: 3,
      },
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QaThreadComponent],
      providers: [LanguageService],
    }).compileComponents();

    fixture = TestBed.createComponent(QaThreadComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('thread', mockThread);
    fixture.detectChanges();
  });

  it('should render title and answers', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Question sur les fractions');
    expect(el.textContent).toContain('Mme Ben Ali');
  });

  it('should emit reply event when reply button is clicked', () => {
    fixture.componentRef.setInput('canReply', true);
    fixture.detectChanges();

    let emitted: QuestionThread | undefined;
    component.reply.subscribe((t) => {
      emitted = t;
    });

    const replyBtn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(replyBtn).toBeTruthy();
    replyBtn.click();
    expect(emitted?.id).toBe('t-1');
  });
});
