import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BlogCardComponent } from './blog-card';
import { BlogPost, LanguageService } from '@core';

describe('BlogCardComponent', () => {
  let fixture: ComponentFixture<BlogCardComponent>;
  let component: BlogCardComponent;

  const mockPost: BlogPost = {
    id: 'b-1',
    title: 'Comment préparer les examens',
    excerpt: 'Voici nos 5 astuces pour **réussir** les examens...',
    content: 'Contenu complet...',
    subject: 'Mathématiques',
    grade: '5ème Année',
    tags: ['astuces', 'examens'],
    publishedAt: '2026-10-01',
    authorName: 'Sami',
    authorTitle: 'Professeur Principal',
    readTimeMinutes: 4,
    likesCount: 12,
    comments: [],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BlogCardComponent],
      providers: [LanguageService],
    }).compileComponents();

    fixture = TestBed.createComponent(BlogCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('post', mockPost);
    fixture.detectChanges();
  });

  it('should render post title and cleaned excerpt', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Comment préparer les examens');
    expect(el.textContent).toContain('Voici nos 5 astuces pour réussir les examens...');
  });

  it('should emit open and like events', () => {
    let openedPost: BlogPost | undefined;
    let likedPostId: string | undefined;

    component.open.subscribe((p) => {
      openedPost = p;
    });
    component.like.subscribe((id) => {
      likedPostId = id;
    });

    const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
    // First button is like button
    buttons[0].click();
    expect(likedPostId).toBe('b-1');

    // Second button is read more button
    buttons[1].click();
    expect(openedPost?.id).toBe('b-1');
  });
});
