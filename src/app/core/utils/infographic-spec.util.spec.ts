import { describe, expect, it } from 'vitest';
import { generateSchoolDiagram } from './diagram-generator.util';
import {
  normalizeInfographicSpec,
  specQualityIssues,
  sanitizeImagePrompt,
  sanitizeImageUrl,
  sanitizeSvg,
} from './infographic-spec.util';

const item = (n: number) => ({ title: `T${n}`, text: `Texte ${n}`, icon: 'bolt' });

describe('sanitizeSvg', () => {
  it('keeps a plain svg', () => {
    const out = sanitizeSvg('<svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill="#fff"/></svg>');
    expect(out).toContain('<svg');
    expect(out).toContain('viewBox="0 0 10 10"');
    expect(out).toContain('<circle');
  });

  it('strips scripts, handlers and external references', () => {
    const out = sanitizeSvg(
      '<svg viewBox="0 0 10 10"><script>alert(1)</script><rect onclick="x()" width="5" height="5" fill="url(http://evil)"/>' +
        '<image href="http://evil/a.png"/><use href="http://evil#a"/></svg>',
    );
    expect(out).not.toMatch(/script|onclick|evil|image/i);
  });

  it('rejects non-svg input and oversize markup', () => {
    expect(sanitizeSvg('<div>hi</div>')).toBe('');
    expect(sanitizeSvg(42)).toBe('');
    expect(sanitizeSvg('<svg>' + 'x'.repeat(13_000) + '</svg>')).toBe('');
  });

  it('keeps internal #references', () => {
    const out = sanitizeSvg('<svg><defs><g id="a"><circle r="2"/></g></defs><use href="#a"/></svg>');
    expect(out).toContain('href="#a"');
  });
});

describe('sanitizeImagePrompt', () => {
  it('appends strengthened text-free suffix and clips length', () => {
    const prompt = sanitizeImagePrompt('A boy reading a math book');
    expect(prompt).toContain('no text, no letters, no numbers, no labels, no watermark, no symbols, no writing');
  });

  it('rejects prompts containing Arabic characters', () => {
    expect(sanitizeImagePrompt('تلميذ يقرأ كتابا')).toBeUndefined();
    expect(sanitizeImagePrompt('A boy reading كتاب')).toBeUndefined();
  });

  it('preserves existing text-free mentions without duplicating suffix', () => {
    const prompt = sanitizeImagePrompt('A tree in spring, no text');
    expect(prompt).toBe('A tree in spring, no text');
  });
});

describe('sanitizeImageUrl', () => {
  it('accepts valid /uploads/ urls', () => {
    expect(sanitizeImageUrl('/uploads/img-123.webp')).toBe('/uploads/img-123.webp');
  });

  it('rejects external or malicious urls', () => {
    expect(sanitizeImageUrl('https://evil.com/a.png')).toBeUndefined();
    expect(sanitizeImageUrl('javascript:alert(1)')).toBeUndefined();
    expect(sanitizeImageUrl('/other/path.png')).toBeUndefined();
  });
});

describe('generateSchoolDiagram', () => {
  const items = [
    { title: 'Étape 1', subtitle: 'Départ' },
    { title: 'Étape 2', subtitle: 'Milieu' },
    { title: 'Étape 3', subtitle: 'Arrivée' },
  ];

  it('generates valid sanitized SVG for cycle-ring', () => {
    const svg = generateSchoolDiagram('cycle-ring', items, { theme: 'kids', lang: 'ar' });
    expect(svg).toContain('<svg');
    expect(svg).toContain('dir="rtl"');
    expect(svg).toContain('Étape 1');
  });

  it('generates valid sanitized SVG for numbered-staircase', () => {
    const svg = generateSchoolDiagram('numbered-staircase', items, { theme: 'official', lang: 'fr' });
    expect(svg).toContain('<svg');
    expect(svg).toContain('dir="ltr"');
    expect(svg).toContain('Étape 2');
  });

  it('generates valid sanitized SVG for snake-road', () => {
    const svg = generateSchoolDiagram('snake-road', items, { theme: 'kids', lang: 'ar' });
    expect(svg).toContain('<svg');
    expect(svg).toContain('path');
  });

  it('generates valid sanitized SVG for pyramid', () => {
    const svg = generateSchoolDiagram('pyramid', items, { theme: 'kids', lang: 'ar' });
    expect(svg).toContain('<svg');
    expect(svg).toContain('polygon');
  });

  it('generates valid sanitized SVG for quadrant-grid', () => {
    const gridItems = [
      { title: 'Nord', subtitle: 'Haut' },
      { title: 'Sud', subtitle: 'Bas' },
      { title: 'Est', subtitle: 'Droite' },
      { title: 'Ouest', subtitle: 'Gauche' },
    ];
    const svg = generateSchoolDiagram('quadrant-grid', gridItems, { theme: 'kids', lang: 'fr' });
    expect(svg).toContain('<svg');
    expect(svg).toContain('Nord');
    expect(svg).toContain('Sud');
  });

  it('generates valid sanitized SVG for pros-cons', () => {
    const svg = generateSchoolDiagram('pros-cons', items, { theme: 'official', lang: 'ar' });
    expect(svg).toContain('<svg');
    expect(svg).toContain('dir="rtl"');
  });

  it('returns empty string on empty items', () => {
    expect(generateSchoolDiagram('pyramid', [])).toBe('');
  });
});

describe('normalizeInfographicSpec', () => {
  it('accepts a valid hero-cards spec and clips fields', () => {
    const spec = normalizeInfographicSpec({
      preset: 'hero-cards',
      title: 'Les fractions',
      hero: { label: '1/2' },
      items: [item(1), item(2), item(3), item(4), item(5), item(6), item(7)],
      remember: ['a', 'b', 'c', 'd'],
    });
    expect(spec?.items).toHaveLength(6);
    expect(spec?.remember).toHaveLength(3);
    expect(spec?.hero?.label).toBe('1/2');
  });

  it('normalizes image prompts, wantsImage and uploads imageUrl on items and hero', () => {
    const spec = normalizeInfographicSpec({
      preset: 'hero-cards',
      title: 'Les sciences',
      hero: {
        label: 'Bio',
        wantsImage: true,
        imagePrompt: 'A green leaf cell under microscope',
        imageUrl: '/uploads/hero-bio.webp',
      },
      items: [
        {
          title: 'Cellule',
          text: 'Unité de base',
          icon: 'eco',
          wantsImage: true,
          imagePrompt: 'Microscopic plant cell structure',
          imageUrl: '/uploads/cell.webp',
        },
        item(2),
        item(3),
        item(4),
      ],
      remember: ['Retenir 1'],
    });
    expect(spec?.hero?.wantsImage).toBe(true);
    expect(spec?.hero?.imageUrl).toBe('/uploads/hero-bio.webp');
    expect(spec?.hero?.imagePrompt).toContain('no text');
    expect(spec?.items[0].wantsImage).toBe(true);
    expect(spec?.items[0].imageUrl).toBe('/uploads/cell.webp');
    expect(spec?.items[0].imagePrompt).toContain('no text');
  });

  it('accepts problem preset with situation, table, questions, and writing lines', () => {
    const probSpec = normalizeInfographicSpec({
      preset: 'problem',
      title: 'المسألة الرياضية : شراء اللوازم',
      subtitle: 'حساب ثمن المشتريات والمبلغ المتبقي',
      problem: {
        situation: 'اشترى أحمد 3 كراريس ثمن الكراس 1200 م، وقلمين ثمن القلم الواحد 650 م.',
        table: {
          headers: ['الشيء', 'الكمية', 'سعر الوحدة'],
          rows: [
            ['كراس', '3', '1200 م'],
            ['قلم', '2', '650 م'],
          ],
        },
        questions: [
          { text: 'احسب ثمن الكراريس.', linesCount: 2 },
          { text: 'احسب المبلغ الجملي للمشتريات.', linesCount: 3 },
        ],
        wantsImage: true,
        imagePrompt: 'A student buying notebooks and pens in a stationary shop',
        imageUrl: '/uploads/shop.webp',
      },
      remember: ['المبلغ المتبقي = المبلغ الجملي - ثمن المشتريات'],
    });

    expect(probSpec?.preset).toBe('problem');
    expect(probSpec?.problem?.situation).toContain('اشترى أحمد');
    expect(probSpec?.problem?.table?.headers).toHaveLength(3);
    expect(probSpec?.problem?.table?.rows).toHaveLength(2);
    expect(probSpec?.problem?.questions).toHaveLength(2);
    expect(probSpec?.problem?.imageUrl).toBe('/uploads/shop.webp');
    expect(probSpec?.remember).toHaveLength(1);
  });

  it('drops imagePrompt on blocks marked wantsImage=false (no button)', () => {
    const spec = normalizeInfographicSpec({
      preset: 'hero-cards',
      title: 'Abstract',
      items: [{ ...item(1), wantsImage: false, imagePrompt: 'An idea' }, item(2), item(3), item(4)],
    });
    expect(spec?.items[0].imagePrompt).toBeUndefined();
  });

  it('keeps an English imageStory and drops an Arabic one', () => {
    const base = { preset: 'hero-cards', title: 'S', items: [item(1), item(2), item(3), item(4)] };
    expect(normalizeInfographicSpec({ ...base, imageStory: 'Water cycle: sea, clouds, rain' })?.imageStory).toBe(
      'Water cycle: sea, clouds, rain',
    );
    expect(normalizeInfographicSpec({ ...base, imageStory: 'دورة الماء' })?.imageStory).toBeUndefined();
  });

  it('preserves per-doc imageLibrary', () => {
    const spec = normalizeInfographicSpec({
      preset: 'hero-cards',
      title: 'Test Library',
      items: [item(1), item(2), item(3), item(4)],
      imageLibrary: {
        'Cellule': '/uploads/cell.webp',
        'T1': '/uploads/t1.webp',
      },
    });
    expect(spec?.imageLibrary).toBeDefined();
    expect(spec?.imageLibrary?.['Cellule']).toBe('/uploads/cell.webp');
    expect(spec?.imageLibrary?.['T1']).toBe('/uploads/t1.webp');
  });

  it('accepts presets: comparison, lesson-stages, central-picture', () => {
    const comparison = normalizeInfographicSpec({
      preset: 'comparison',
      title: 'Le vivant et le non-vivant',
      items: [item(1), item(2)],
      columns: [
        { title: 'Êtres vivants', points: ['Respirent', 'Grandissent'] },
        { title: 'Objets inanimés', points: ['Ne respirent pas'] },
      ],
      remember: ['Point clé'],
    });
    expect(comparison?.preset).toBe('comparison');
    expect(comparison?.columns).toHaveLength(2);

    const stages = normalizeInfographicSpec({
      preset: 'lesson-stages',
      title: 'Séance de grammaire',
      items: [item(1), item(2)],
      stages: [
        { stageNumber: 1, title: 'Découverte', teacherActivity: 'Présente la phrase', learnerActivity: 'Lit et observe' },
        { stageNumber: 2, title: 'Entraînement', teacherActivity: 'Guider', learnerActivity: 'Pratique' },
      ],
      remember: ['Règle'],
    });
    expect(stages?.preset).toBe('lesson-stages');
    expect(stages?.stages).toHaveLength(2);
  });

  it('falls back to the requested preset and a safe icon', () => {
    const spec = normalizeInfographicSpec(
      { preset: 'nope', title: 'Cycle', items: [{ title: 'a', text: 'b', icon: 'rm -rf' }, item(2), item(3)] },
      'circular-flow',
    );
    expect(spec?.preset).toBe('circular-flow');
    expect(spec?.items[0].icon).toBe('star');
  });

  it('returns null when too few items or no title', () => {
    expect(normalizeInfographicSpec({ preset: 'hero-cards', title: 'x', items: [item(1)] })).toBeNull();
    expect(normalizeInfographicSpec({ preset: 'timeline', items: [item(1), item(2), item(3)] })).toBeNull();
    expect(normalizeInfographicSpec(null)).toBeNull();
  });
});

describe('specQualityIssues', () => {
  const base = (items: { title: string; text: string }[]) =>
    normalizeInfographicSpec({ preset: 'hero-cards', title: 'Les nombres', items: items.map((i) => ({ ...i, icon: 'star' })) })!;

  it('flags merged cards, duplicate titles and picture captions', () => {
    const issues = specQualityIssues(
      base([
        { title: 'العدد 1', text: 'تمثيل العدد 1 بقلم واحد.' },
        { title: 'العدد 3 و 4', text: 'أعدّ الأشياء.' },
        { title: 'العدد 1', text: 'أكتب 1.' },
      ]),
    );
    expect(issues).toHaveLength(3);
  });

  it('passes clean teaching cards', () => {
    expect(
      specQualityIssues(
        base([
          { title: 'العدد 1', text: 'أعدّ شيئًا واحدًا وأكتب 1.' },
          { title: 'العدد 2', text: 'أعدّ شيئين وأكتب 2.' },
          { title: 'العدد 3', text: 'أعدّ ثلاثة أشياء وأكتب 3.' },
        ]),
      ),
    ).toEqual([]);
  });

  it('keeps an exact count between 1 and 10 only', () => {
    const spec = normalizeInfographicSpec({
      preset: 'hero-cards',
      title: 'N',
      items: [
        { title: 'A', text: 'a', icon: 'looks_3', count: 3 },
        { title: 'B', text: 'b', icon: 'star', count: 40 },
        { title: 'C', text: 'c', icon: 'star' },
      ],
    });
    expect(spec?.items.map((i) => i.count)).toEqual([3, undefined, undefined]);
    expect(spec?.items[0].icon).toBe('looks_3');
  });
});

describe('picture-rows, keyword and instruction', () => {
  const rows = (keyword: string) =>
    normalizeInfographicSpec({
      preset: 'picture-rows',
      title: 'Embellir notre classe',
      instruction: 'Observe chaque image, puis écris une phrase.',
      items: [
        { title: 'Ramasser', text: 'Le garçon ramasse les papiers.', icon: 'star', keyword, imagePrompt: 'a boy picking up paper' },
        { title: 'Nettoyer', text: 'La fille nettoie la table.', icon: 'star', imagePrompt: 'a girl cleaning a desk' },
      ],
      remember: ['Qui fait quoi, où ?'],
    });

  it('accepts the picture-rows preset and keeps the instruction', () => {
    const spec = rows('ramasse');
    expect(spec?.preset).toBe('picture-rows');
    expect(spec?.instruction).toBe('Observe chaque image, puis écris une phrase.');
  });

  it('keeps a keyword that occurs in the text', () => {
    expect(rows('ramasse')?.items[0].keyword).toBe('ramasse');
  });

  it('drops a keyword that is not in the text', () => {
    expect(rows('balaie')?.items[0].keyword).toBeUndefined();
  });
});

describe('normalizeInfographicSpec block presets', () => {
  const base = (preset: string, extra: Record<string, unknown>) =>
    normalizeInfographicSpec({ preset, title: 'Titre', items: [], remember: [], ...extra });

  it('keeps a quiz and relabels choices A, B, C', () => {
    const spec = base('quizcard', {
      quiz: { question: 'Combien ?', explanation: 'Parce que.', choices: [{ id: 'x', text: '3', isCorrect: true }, { text: '4' }, { text: '' }] },
    });
    expect(spec?.quiz?.choices.map((c) => c.id)).toEqual(['A', 'B']);
    expect(spec?.quiz?.choices[0].isCorrect).toBe(true);
  });

  it('rejects a quiz preset without a usable quiz', () => {
    expect(base('quizcard', { quiz: { question: 'Q', choices: [{ text: 'seul' }] } })).toBeNull();
  });

  it('never keeps model-written names on a certificate', () => {
    const spec = base('certificate', { certificate: { reason: 'Bon travail', teacherName: 'Inventé', studentNamePlaceholder: 'Ali' } });
    expect(spec?.certificate).toEqual({ reason: 'Bon travail', recipientTitle: undefined, grade: undefined, schoolYear: undefined, sealText: undefined });
  });

  it('keeps venn sets and fills a missing overlap', () => {
    const spec = base('venn', { venn: { setA: { title: 'A', items: ['a'] }, setB: { title: 'B', items: ['b'] } } });
    expect(spec?.venn?.overlap).toEqual({ title: '', items: [] });
  });

  it('keeps id card, analogy and flyer blocks', () => {
    expect(base('idcard', { idCard: { entityName: 'Chameau', category: 'Mammifère', stats: [{ label: 'Poids', value: '500 kg' }], facts: ['f'] } })?.idCard?.stats).toHaveLength(1);
    const side = (c: string) => ({ concept: c, description: 'd', keyPoints: ['k'] });
    expect(base('analogy', { analogy: { familiar: side('Pompe'), abstract: side('Cœur'), bridgeNote: 'b' } })?.analogy?.abstract.concept).toBe('Cœur');
    expect(base('flyer', { flyer: { badge: 'Sortie', eventTitle: 'Visite', date: 'Lundi', location: 'Musée', sections: [{ icon: 'nope', title: 'Prévoir', details: ['eau'] }] } })?.flyer?.sections[0].icon).toBe('star');
  });

  it('sanitizes block image urls', () => {
    const spec = base('idcard', { idCard: { entityName: 'X', category: 'Y', stats: [], facts: [], imageUrl: 'javascript:alert(1)' } });
    expect(spec?.idCard?.imageUrl).toBeUndefined();
  });
});

describe('normalizeInfographicSpec wave 2 presets', () => {
  const items = (n: number) => Array.from({ length: n }, (_, i) => ({ title: `Case ${i + 1}`, text: `Question ${i + 1} ?`, icon: 'star' }));
  const spec = (preset: string, n: number) => normalizeInfographicSpec({ preset, title: 'Titre', items: items(n), remember: ['Lance le dé'] });

  it('keeps a pathmap with 3 to 8 stations', () => {
    expect(spec('pathmap', 5)?.items).toHaveLength(5);
    expect(spec('pathmap', 2)).toBeNull();
    expect(spec('pathmap', 12)?.items).toHaveLength(8);
  });

  it('needs at least 6 squares on a boardgame and keeps its rules', () => {
    expect(spec('boardgame', 5)).toBeNull();
    const board = spec('boardgame', 10);
    expect(board?.items).toHaveLength(10);
    expect(board?.remember).toEqual(['Lance le dé']);
  });
});

describe('specQualityIssues block presets', () => {
  it('flags a thin id card so the route retries once', () => {
    const spec = normalizeInfographicSpec({ preset: 'idcard', title: 'Olivier', items: [], remember: [], idCard: { entityName: 'Olivier', category: '', stats: [], facts: [] } });
    expect(spec && specQualityIssues(spec).some((i) => i.includes('idCard'))).toBe(true);
  });
});
