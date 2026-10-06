// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed, getTestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';
import { signal } from '@angular/core';
import { MemoDoc, MemoLayout } from '../../../core/models/memo.model';
import { EducationStore } from '../../../core/services/education-store';
import { LanguageService } from '../../../core/services/language.service';

try {
  getTestBed().initTestEnvironment(BrowserTestingModule, platformBrowserTesting());
} catch {
  // already initialized
}
import {
  MemoTreeLayoutComponent,
  MemoStepsLayoutComponent,
  MemoCardsLayoutComponent,
  MemoTimelineLayoutComponent,
  MemoTableLayoutComponent,
  MemoConjugationLayoutComponent,
} from './index';

const FIXTURE_FR: MemoDoc = {
  title: 'Les déterminants',
  subtitle: 'Articles définis et indéfinis - 6ème année',
  grade: '6ème Année',
  subject: 'Français',
  topic: 'Les déterminants',
  language: 'fr',
  steps: [
    { n: 1, heading: 'Repérer le nom', body: 'Identifier le mot désignant une chose ou un être.' },
    { n: 2, heading: 'Identifier le petit mot devant', body: 'Vérifier son accord en genre et nombre.' },
  ],
  cards: [
    { id: 'c1', label: 'Article défini', definition: 'Désigne un être connu.', examples: ['le chat', 'la maison'] },
    { id: 'c2', label: 'Article indéfini', definition: 'Désigne un être non précisé.', examples: ['un livre', 'une fille'] },
  ],
  example: {
    sentence: 'Le mécanicien répare une voiture.',
    analysis: [
      { word: 'Le', role: 'article défini' },
      { word: 'une', role: 'article indéfini' },
    ],
  },
  remember: ['Le déterminant s\'accorde toujours avec le nom.'],
  formula: { parts: ['DÉTERMINANT', '+', 'NOM', '=', 'GROUPE NOMINAL'], note: 'Règle de base' },
  quote: 'Apprendre aujourd\'hui pour réussir demain !',
};

const FIXTURE_AR: MemoDoc = {
  title: 'المفعول المطلق',
  subtitle: 'أنواعه وإعرابه - السنة السادسة',
  grade: '6ème Année',
  subject: 'اللغة العربية',
  topic: 'المفعول المطلق',
  language: 'ar',
  steps: [
    { n: 1, heading: 'البحث عن الفعل', body: 'تحديد الفعل الرئيسي في الجملة.' },
    { n: 2, heading: 'استخراج المصدر المشتق', body: 'البحث عن مصدر من لفظ الفعل.' },
  ],
  cards: [
    { id: 'c1', label: 'مؤكد للفعل', definition: 'يؤكد معنى الفعل دون زيادة.', examples: ['قرأتُ قراءةً'] },
    { id: 'c2', label: 'مبين للنوع', definition: 'يوضح صفة الفعل وهيئته.', examples: ['صبرتُ صبراً جميلاً'] },
  ],
  example: {
    sentence: 'رتّل القارئ القرآن ترتيلاً جميلاً.',
    analysis: [
      { word: 'ترتيلاً', role: 'مفعول مطلق منصوب' },
    ],
  },
  remember: ['المفعول المطلق مصدر منصوب دائماً.'],
  formula: { parts: ['فعل', '+', 'مصدر من لفظه', '=', 'مفعول مطلق'], note: 'القاعدة الأساسية' },
  quote: 'طلب العلم فريضة وطريق النجاح',
};

describe('Memo Studio Layouts', () => {
  let mockStore: {
    memo: ReturnType<typeof signal<MemoDoc | null>>;
    memoLayout: ReturnType<typeof signal<MemoLayout>>;
    updateMemoField: (field: keyof MemoDoc, value: unknown) => void;
    regenerateMemoBlock: () => Promise<{ ok: boolean }>;
    addMemoCard: () => void;
    removeMemoCard: () => void;
    addMemoStep: () => void;
    removeMemoStep: () => void;
  };

  const mockLang = {
    lang: signal<'fr' | 'ar'>('fr'),
    tr: (fr: string, ar: string) => fr,
    t: (k: string) => k,
  };

  beforeEach(async () => {
    mockStore = {
      memo: signal<MemoDoc | null>(null),
      memoLayout: signal<MemoLayout>('tree'),
      updateMemoField: (field: keyof MemoDoc, value: unknown) => {
        mockStore.memo.update((doc) => doc ? { ...doc, [field]: value } : doc);
      },
      regenerateMemoBlock: () => Promise.resolve({ ok: true }),
      addMemoCard: () => {},
      removeMemoCard: () => {},
      addMemoStep: () => {},
      removeMemoStep: () => {},
    };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [
        MemoTreeLayoutComponent,
        MemoStepsLayoutComponent,
        MemoCardsLayoutComponent,
        MemoTimelineLayoutComponent,
        MemoTableLayoutComponent,
        MemoConjugationLayoutComponent,
      ],
      providers: [
        { provide: EducationStore, useValue: mockStore },
        { provide: LanguageService, useValue: mockLang },
      ],
    }).compileComponents();
  });

  it('renders Tree layout in French and updates store on edit', () => {
    const fixture = TestBed.createComponent(MemoTreeLayoutComponent);
    fixture.componentInstance.memo = FIXTURE_FR;
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Les déterminants');
    expect(el.textContent).toContain('Article défini');

    mockStore.memo.set(FIXTURE_FR);
    fixture.componentInstance.onUpdateField('title', {
      target: { innerText: 'Les déterminants (modifié)' },
    } as unknown as FocusEvent);

    expect(mockStore.memo()?.title).toBe('Les déterminants (modifié)');
  });

  it('renders Tree layout in Arabic', () => {
    const fixture = TestBed.createComponent(MemoTreeLayoutComponent);
    fixture.componentInstance.memo = FIXTURE_AR;
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('المفعول المطلق');
    expect(el.textContent).toContain('مؤكد للفعل');
  });

  it('renders Steps layout in French and Arabic', () => {
    const fixtureFr = TestBed.createComponent(MemoStepsLayoutComponent);
    fixtureFr.componentInstance.memo = FIXTURE_FR;
    fixtureFr.detectChanges();

    const elFr = fixtureFr.nativeElement as HTMLElement;
    expect(elFr.textContent).toContain('01');
    expect(elFr.textContent).toContain('Repérer le nom');

    const fixtureAr = TestBed.createComponent(MemoStepsLayoutComponent);
    fixtureAr.componentInstance.memo = FIXTURE_AR;
    fixtureAr.detectChanges();

    const elAr = fixtureAr.nativeElement as HTMLElement;
    expect(elAr.textContent).toContain('المفعول المطلق');
  });

  it('renders Cards layout in French and Arabic', () => {
    const fixtureFr = TestBed.createComponent(MemoCardsLayoutComponent);
    fixtureFr.componentInstance.memo = FIXTURE_FR;
    fixtureFr.detectChanges();

    const elFr = fixtureFr.nativeElement as HTMLElement;
    expect(elFr.textContent).toContain('Les déterminants');
    expect(elFr.textContent).toContain('Article défini');

    const fixtureAr = TestBed.createComponent(MemoCardsLayoutComponent);
    fixtureAr.componentInstance.memo = FIXTURE_AR;
    fixtureAr.detectChanges();

    const elAr = fixtureAr.nativeElement as HTMLElement;
    expect(elAr.textContent).toContain('المفعول المطلق');
  });

  it('renders Timeline layout in French and Arabic', () => {
    const fixtureFr = TestBed.createComponent(MemoTimelineLayoutComponent);
    fixtureFr.componentInstance.memo = FIXTURE_FR;
    fixtureFr.detectChanges();

    const elFr = fixtureFr.nativeElement as HTMLElement;
    expect(elFr.textContent).toContain('Les déterminants');
    expect(elFr.textContent).toContain('Repérer le nom');

    const fixtureAr = TestBed.createComponent(MemoTimelineLayoutComponent);
    fixtureAr.componentInstance.memo = FIXTURE_AR;
    fixtureAr.detectChanges();

    const elAr = fixtureAr.nativeElement as HTMLElement;
    expect(elAr.textContent).toContain('المفعول المطلق');
  });

  it('renders Table layout in French and Arabic', () => {
    const fixtureFr = TestBed.createComponent(MemoTableLayoutComponent);
    fixtureFr.componentInstance.memo = FIXTURE_FR;
    fixtureFr.detectChanges();

    const elFr = fixtureFr.nativeElement as HTMLElement;
    expect(elFr.textContent).toContain('Les déterminants');
    expect(elFr.textContent).toContain('Article défini');

    const fixtureAr = TestBed.createComponent(MemoTableLayoutComponent);
    fixtureAr.componentInstance.memo = FIXTURE_AR;
    fixtureAr.detectChanges();

    const elAr = fixtureAr.nativeElement as HTMLElement;
    expect(elAr.textContent).toContain('المفعول المطلق');
  });

  it('renders Conjugation layout in French and Arabic', () => {
    const fixtureFr = TestBed.createComponent(MemoConjugationLayoutComponent);
    fixtureFr.componentInstance.memo = FIXTURE_FR;
    fixtureFr.detectChanges();

    const elFr = fixtureFr.nativeElement as HTMLElement;
    expect(elFr.textContent).toContain('Les déterminants');

    const fixtureAr = TestBed.createComponent(MemoConjugationLayoutComponent);
    fixtureAr.componentInstance.memo = FIXTURE_AR;
    fixtureAr.detectChanges();

    const elAr = fixtureAr.nativeElement as HTMLElement;
    expect(elAr.textContent).toContain('المفعول المطلق');
  });
});
