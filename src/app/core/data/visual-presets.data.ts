import { VisualCommand, VisualPresetDefinition } from '../models/visual-preset.model';

const buildBasePrompt = (
  topic: string,
  styleLine: string,
  elementLine: string
): string => `Create a high-quality educational visualization of ${topic} using the selected visual style.
Adapt the entire layout, composition, information hierarchy, labels, icons, annotations, and presentation specifically to the selected style:
${styleLine}
${elementLine}
Keep all information accurate, readable, logically organized, visually balanced, and educational. Avoid unnecessary decoration and visual clutter.`;

export const VISUAL_PRESETS: Record<VisualCommand, VisualPresetDefinition> = {
  '/infographic': {
    command: '/infographic',
    name: 'Infographic',
    nameFr: 'Infographie Pédagogique',
    nameAr: 'إنفوجرافيك تعليمي',
    summary: 'Visually organized sections, icons, key facts, color-coded hierarchy, and summary takeaway.',
    basePrompt: 'Create a high-quality educational visualization using structured cards and icons.',
    styleBlock:
      'Infographic — visually organized sections/cards, icons, short explanations, key facts, color-coded information, and strong visual hierarchy. Keep text concise and prioritize short headings, labels, and information fragments that remain easy to read.',
    themeId: 'kids',
    defaultModel: 'nvidia-flux-1-dev',
    imageSlots: [
      {
        name: 'central-scene',
        description: 'Central educational concept illustration without text or letters',
        count: 1,
        textFree: true,
      },
    ],
    schemaFields: [
      { name: 'title', type: 'string', description: 'Sheet title', required: true },
      { name: 'subtitle', type: 'string', description: 'Learning objective or context', required: true },
      { name: 'steps', type: 'Array<{icon: string, label: string, text: string}>', description: 'Step-by-step points', required: true },
      { name: 'glossary', type: 'Array<{term: string, definition: string}>', description: 'Key vocabulary terms' },
      { name: 'questions', type: 'string[]', description: 'Comprehension checkpoint questions' },
      { name: 'takeaway', type: 'string', description: 'Core takeaway summary' },
    ],
    compilePrompt: (topic: string) =>
      buildBasePrompt(
        topic,
        'Infographic — visually organized sections/cards, icons, short explanations, key facts, color-coded information, and strong visual hierarchy. Keep text concise and prioritize short headings, labels, and information fragments that remain easy to read.',
        'Automatically choose the most appropriate number of sections, cards, icons, annotations, and supporting visual elements according to the topic.'
      ),
  },

  '/handwritten': {
    command: '/handwritten',
    name: 'Handwritten Notes',
    nameFr: 'Notes Manuscrites de Révision',
    nameAr: 'ملاحظات دفتر التلميذ',
    summary: 'Lined cream notebook paper, red margin, pen headings, yellow highlighter, dashed callouts.',
    basePrompt: 'Create realistic student study notes on lined school paper with pen headings and sketches.',
    styleBlock:
      'Handwritten Notes — realistic handwritten study notes on paper, with headings, underlines, highlights, arrows, small sketches, formulas, and concise explanations. Use a natural study-note structure with clear sections and readable handwritten elements.',
    themeId: 'handwritten',
    defaultModel: 'nvidia-flux-1-dev',
    imageSlots: [
      {
        name: 'diagram',
        description: 'Text-free pencil/ink line sketch of the scientific concept',
        count: 1,
        textFree: true,
      },
      {
        name: 'doodles',
        description: 'Small margin doodle illustrations without text',
        count: 3,
        textFree: true,
      },
    ],
    schemaFields: [
      { name: 'title', type: 'string', description: 'Lesson title in handwriting style', required: true },
      { name: 'date', type: 'string', description: 'Session date' },
      { name: 'topic', type: 'string', description: 'Subject or chapter code', required: true },
      { name: 'sections', type: 'Array<{heading: string, bullets: string[], highlight?: string}>', description: 'Note sections', required: true },
      { name: 'callouts', type: 'Array<{kind: "remember"|"think"|"fact", text: string}>', description: 'Dashed box sticky callouts' },
      { name: 'formulas', type: 'string[]', description: 'Formulas or grammar patterns' },
      { name: 'motto', type: 'string', description: 'Quick memory motto' },
    ],
    compilePrompt: (topic: string) =>
      buildBasePrompt(
        topic,
        'Handwritten Notes — realistic handwritten study notes on paper, with headings, underlines, highlights, arrows, small sketches, formulas, and concise explanations. Use a natural study-note structure with clear sections and readable handwritten elements.',
        'Automatically choose the most appropriate number of sections, annotations, sketches, formulas, and supporting visual elements according to the topic.'
      ),
  },

  '/xray': {
    command: '/xray',
    name: 'X-Ray / Cutaway Diagram',
    nameFr: 'Écorché Anatomique / Vue Éclatée',
    nameAr: 'مخطط تشريحي ومقطع تقني',
    summary: 'Technical millimeter graph paper, 3-column layout, cutaway anatomical diagram, round close-up insets.',
    basePrompt: 'Create an anatomical cross-section on engineering grid paper with circular closeups.',
    styleBlock:
      'Xray / Cutaway — detailed cutaway anatomical or mechanical cross-section on technical graph paper, revealing internal layers, labeled parts, circular close-up insets, and technical data callouts.',
    themeId: 'graph-paper',
    defaultModel: 'nvidia-flux-1-dev',
    imageSlots: [
      {
        name: 'cutaway',
        description: 'Detailed cutaway illustration showing internal anatomy without text or labels',
        count: 1,
        textFree: true,
      },
      {
        name: 'closeups',
        description: 'Circular microscopic or internal part zoom insets without text',
        count: 2,
        textFree: true,
      },
    ],
    schemaFields: [
      { name: 'title', type: 'string', description: 'Organ or machine name', required: true },
      { name: 'profile', type: 'Array<{label: string, value: string}>', description: 'Vital specs table' },
      { name: 'parts', type: 'Array<{name: string, note: string}>', description: 'Labeled parts list with HTML leader indicators', required: true },
      { name: 'closeups', type: 'Array<{name: string, text: string}>', description: 'Circular inset explanations' },
      { name: 'facts', type: 'string[]', description: 'Key biological or technical facts' },
      { name: 'careTips', type: 'string[]', description: 'Health or maintenance guidelines' },
    ],
    compilePrompt: (topic: string) =>
      buildBasePrompt(
        topic,
        'Xray / Cutaway — detailed cutaway anatomical or mechanical cross-section on technical graph paper, revealing internal layers, labeled parts, circular close-up insets, and technical data callouts.',
        'Automatically choose the most appropriate number of cutaway layers, close-up insets, callout labels, and supporting visual elements according to the topic.'
      ),
  },

  '/visualize': {
    command: '/visualize',
    name: 'Conceptual Visualization',
    nameFr: 'Visualisation Métaphorique',
    nameAr: 'تجسيد المفاهيم التجريدية',
    summary: 'Transforms abstract scientific or mathematical concepts into concrete real-world metaphors and physical models.',
    basePrompt: 'Transform abstract concepts into everyday physical analogies and visual models.',
    styleBlock:
      'Visualize — intuitive conceptual visual breakdown using real-world analogies, step-by-step physical models, visual metaphors, and clear comparisons to make abstract concepts instantly concrete.',
    themeId: 'kids',
    defaultModel: 'nvidia-flux-1-dev',
    imageSlots: [
      {
        name: 'focal-model',
        description: 'Visual metaphor or physical model without text',
        count: 1,
        textFree: true,
      },
    ],
    schemaFields: [
      { name: 'title', type: 'string', description: 'Concept title', required: true },
      { name: 'analogy', type: 'string', description: 'Everyday physical analogy explanation', required: true },
      { name: 'comparisons', type: 'Array<{abstractIdea: string, concreteModel: string}>', description: 'Concept bridge pairs' },
      { name: 'stepModels', type: 'string[]', description: 'Physical demonstration progression' },
      { name: 'keyTakeaway', type: 'string', description: 'Intuitive student takeaway' },
    ],
    compilePrompt: (topic: string) =>
      buildBasePrompt(
        topic,
        'Visualize — intuitive conceptual visual breakdown using real-world analogies, step-by-step physical models, visual metaphors, and clear comparisons to make abstract concepts instantly concrete.',
        'Automatically choose the most appropriate number of comparison points, analogies, cards, and supporting visual elements according to the topic.'
      ),
  },

  '/diagram': {
    command: '/diagram',
    name: 'Scientific Diagram',
    nameFr: 'Schéma Scientifique',
    nameAr: 'رسم بياني علمي',
    summary: 'Process flows, system loops, labeled parts, cycle rings, and causal connecting arrows.',
    basePrompt: 'Create a clean scientific diagram with structured nodes, arrows, and step descriptions.',
    styleBlock:
      'Diagram — clean scientific diagram with structured sections, arrows, connectors, labels, symbols, and simplified explanations.',
    themeId: 'official',
    defaultModel: 'nvidia-flux-1-dev',
    imageSlots: [
      {
        name: 'diagram-backdrop',
        description: 'Text-free background or illustrative scene behind HTML connectors',
        count: 1,
        textFree: true,
      },
    ],
    schemaFields: [
      { name: 'title', type: 'string', description: 'System or process title', required: true },
      { name: 'nodes', type: 'Array<{id: string, label: string, text: string}>', description: 'Diagram nodes', required: true },
      { name: 'links', type: 'Array<{from: string, to: string, label?: string}>', description: 'Causal flow connectors' },
    ],
    compilePrompt: (topic: string) =>
      buildBasePrompt(
        topic,
        'Diagram — clean scientific diagram with structured sections, arrows, connectors, labels, symbols, and simplified explanations.',
        'Automatically choose the most appropriate number of sections, labels, connectors, arrows, annotations, and supporting visual elements according to the topic.'
      ),
  },

  '/mindmap': {
    command: '/mindmap',
    name: 'Mind Map',
    nameFr: 'Carte Mentale',
    nameAr: 'خريطة ذهنية',
    summary: 'Central concept hub with branching sub-themes, keywords, and radial color branches.',
    basePrompt: 'Create a hierarchical mind map radiating outward from a central concept.',
    styleBlock:
      'Mind Map — place the topic as the central concept, with logical main branches and sub-branches containing related concepts, keywords, examples, and connections. Organize the information hierarchically and maintain clear relationships between the central concept, main branches, and supporting ideas.',
    themeId: 'mindmap',
    defaultModel: 'nvidia-flux-1-dev',
    imageSlots: [],
    schemaFields: [
      { name: 'centre', type: 'string', description: 'Central theme label', required: true },
      { name: 'branches', type: 'Array<{label: string, icon?: string, children: string[]}>', description: 'Radial branch items', required: true },
    ],
    compilePrompt: (topic: string) =>
      buildBasePrompt(
        topic,
        'Mind Map — place the topic as the central concept, with logical main branches and sub-branches containing related concepts, keywords, examples, and connections. Organize the information hierarchically and maintain clear relationships between the central concept, main branches, and supporting ideas.',
        'Automatically choose the most appropriate number of branches, sub-branches, labels, examples, and supporting visual elements according to the topic.'
      ),
  },

  '/poster': {
    command: '/poster',
    name: 'Classroom Poster',
    nameFr: 'Affiche de Classe',
    nameAr: 'ملصق حائطي للقسم',
    summary: 'High-contrast large-type poster with central focal graphic and 4-7 bold reminder cards.',
    basePrompt: 'Create a high-impact classroom poster with bold typography and clear summary points.',
    styleBlock:
      'Poster — high-impact classroom poster layout with strong bold typography, clear hierarchy, high-contrast palette, central focal illustration, and concise summary points readable from a distance.',
    themeId: 'poster',
    defaultModel: 'nvidia-flux-1-dev',
    imageSlots: [
      {
        name: 'focal-illustration',
        description: 'Vibrant text-free classroom poster hero artwork',
        count: 1,
        textFree: true,
      },
    ],
    schemaFields: [
      { name: 'title', type: 'string', description: 'Bold poster headline', required: true },
      { name: 'messages', type: 'Array<{icon: string, text: string}>', description: '4 to 7 key message blocks', required: true },
    ],
    compilePrompt: (topic: string) =>
      buildBasePrompt(
        topic,
        'Poster — high-impact classroom poster layout with strong bold typography, clear hierarchy, high-contrast palette, central focal illustration, and concise summary points readable from a distance.',
        'Automatically choose the most appropriate number of message cards, icons, focal illustrations, and supporting visual elements according to the topic.'
      ),
  },

  '/comic': {
    command: '/comic',
    name: 'Educational Comic',
    nameFr: 'Bande Dessinée Éducative',
    nameAr: 'قصة مصورة هادفة (BD)',
    summary: '4 to 6 panel sequential story layout with characters, speech bubbles, and step progression.',
    basePrompt: 'Create a sequential comic strip explaining a concept through student character dialogue.',
    styleBlock:
      'Comic — clean sequential multi-panel comic strip with dynamic character interactions, clear dialogue and narration boxes, expressive illustrations, and step-by-step concept progression.',
    themeId: 'comic',
    defaultModel: 'nvidia-flux-1-dev',
    imageSlots: [
      {
        name: 'panels',
        description: 'Panel scene illustration without speech bubbles or text',
        count: 4,
        textFree: true,
      },
    ],
    schemaFields: [
      {
        name: 'panels',
        type: 'Array<{panelNumber: number, sceneDescription: string, character: string, dialogue: string, narration?: string}>',
        description: 'Sequential panel descriptors',
        required: true,
      },
    ],
    compilePrompt: (topic: string) =>
      buildBasePrompt(
        topic,
        'Comic — clean sequential multi-panel comic strip with dynamic character interactions, clear dialogue and narration boxes, expressive illustrations, and step-by-step concept progression.',
        'Automatically choose the most appropriate number of panels, characters, dialogue bubbles, and supporting visual elements according to the topic.'
      ),
  },

  '/timeline': {
    command: '/timeline',
    name: 'Curriculum Timeline',
    nameFr: 'Frise Chronologique',
    nameAr: 'خط زمني تسلسلي',
    summary: 'Chronological events and eras strictly sourced from official curriculum dates.',
    basePrompt: 'Create an educational timeline with sequential milestone events.',
    styleBlock:
      'Timeline — chronological curriculum progression with verified dates, epoch badges, sequential connector, and event cards.',
    themeId: 'timeline',
    defaultModel: 'nvidia-flux-1-dev',
    imageSlots: [
      {
        name: 'epoch-scenes',
        description: 'Text-free historical or natural period vignette',
        count: 2,
        textFree: true,
      },
    ],
    schemaFields: [
      { name: 'title', type: 'string', description: 'Timeline scope title', required: true },
      { name: 'events', type: 'Array<{date: string, label: string, text: string}>', description: 'Ordered events list', required: true },
    ],
    compilePrompt: (topic: string) =>
      buildBasePrompt(
        topic,
        'Timeline — chronological curriculum progression with verified dates, epoch badges, sequential connector, and event cards.',
        'Automatically choose the most appropriate number of chronological events, milestones, and supporting visual elements according to the topic.'
      ),
  },

  '/flashcards': {
    command: '/flashcards',
    name: 'Printable Flashcards',
    nameFr: 'Cartes Mémoire (Flashcards)',
    nameAr: 'بطاقات المراجعة والذاكرة',
    summary: 'Modular grid of printable cards with terms, definitions, pronunciation hints, and icons.',
    basePrompt: 'Create a set of printable revision flashcards for key lesson vocabulary.',
    styleBlock:
      'Flashcards — modular printable double-sided study cards with vocabulary word, phonetics, definition, example sentence, and visual hint illustration.',
    themeId: 'flashcards',
    defaultModel: 'nvidia-flux-1-dev',
    imageSlots: [
      {
        name: 'card-icons',
        description: 'Simple text-free object illustration per flashcard',
        count: 6,
        textFree: true,
      },
    ],
    schemaFields: [
      { name: 'cards', type: 'Array<{word: string, definition: string, example: string}>', description: 'Vocabulary flashcard entries', required: true },
    ],
    compilePrompt: (topic: string) =>
      buildBasePrompt(
        topic,
        'Flashcards — modular printable double-sided study cards with vocabulary word, phonetics, definition, example sentence, and visual hint illustration.',
        'Automatically choose the most appropriate number of flashcards and supporting visual elements according to the topic.'
      ),
  },
};

export const parseVisualCommand = (input: string): { command: VisualCommand; topic: string } | null => {
  const trimmed = input.trim();
  const match = trimmed.match(/^(\/[a-z]+)\s*(.*)$/i);
  if (!match) return null;
  const cmd = match[1].toLowerCase() as VisualCommand;
  if (cmd in VISUAL_PRESETS) {
    return { command: cmd, topic: match[2].trim() };
  }
  return null;
};
