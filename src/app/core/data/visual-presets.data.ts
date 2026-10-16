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
    presetId: 'auto',
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
    name: 'Handwritten Notes & Lettering',
    nameFr: 'Notes Manuscrites & Calligraphie',
    nameAr: 'ملاحظات دفتر التلميذ والخط البارز',
    summary: 'Lined cream notebook paper, expressive hand-lettered titles, red margin, pen headings, yellow highlighter, dashed callouts.',
    basePrompt: 'Create realistic student study notes on lined school paper with expressive hand-lettered titles, pen headings, sketches, and highlights.',
    styleBlock:
      'Handwritten Notes & Hand Lettering — realistic handwritten study notes on lined notebook paper, with expressive hand-lettered titles, headings, underlines, highlights, arrows, small sketches, formulas, and concise explanations. Natural study-note structure with readable handwritten and lettering elements.',
    themeId: 'handwritten',
    presetId: 'hero-cards',
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
      { name: 'title', type: 'string', description: 'Lesson title in decorative hand-lettered style', required: true },
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
        'Handwritten Notes & Hand Lettering — realistic handwritten study notes on lined notebook paper, with expressive hand-lettered titles, headings, underlines, highlights, arrows, small sketches, formulas, and concise explanations. Natural study-note structure with readable handwritten and lettering elements.',
        'Automatically choose the most appropriate number of sections, annotations, sketches, formulas, and supporting visual elements according to the topic.'
      ),
  },

  '/xray': {
    command: '/xray',
    name: 'X-Ray / How It Works',
    nameFr: 'Écorché & Comment ça marche',
    nameAr: 'مخطط تشريحي وكيف يعمل',
    summary: 'Technical millimeter graph paper, cutaway anatomical or mechanical inside-view, sequential how-it-works mechanism steps, labeled parts, and round close-up insets.',
    basePrompt: 'Create an anatomical or mechanical cross-section on engineering grid paper revealing internal layers and explaining how the mechanism works step by step.',
    styleBlock:
      'X-Ray / How It Works — detailed cutaway anatomical or mechanical cross-section on technical graph paper, revealing internal layers, sequential mechanism steps demonstrating how it works, labeled parts, circular close-up insets, and technical data callouts.',
    themeId: 'graph-paper',
    presetId: 'central-picture',
    defaultModel: 'nvidia-flux-1-dev',
    imageSlots: [
      {
        name: 'cutaway',
        description: 'Detailed cutaway illustration showing internal anatomy or mechanism without text or labels',
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
      { name: 'title', type: 'string', description: 'Organ, machine, or mechanism name', required: true },
      { name: 'profile', type: 'Array<{label: string, value: string}>', description: 'Vital specs table' },
      { name: 'parts', type: 'Array<{name: string, note: string}>', description: 'Labeled parts list with HTML leader indicators', required: true },
      { name: 'steps', type: 'Array<{stepNumber: number, title: string, description: string}>', description: 'Step-by-step how it works explanation' },
      { name: 'closeups', type: 'Array<{name: string, text: string}>', description: 'Circular inset explanations' },
      { name: 'facts', type: 'string[]', description: 'Key biological or technical facts' },
      { name: 'careTips', type: 'string[]', description: 'Health or maintenance guidelines' },
    ],
    compilePrompt: (topic: string) =>
      buildBasePrompt(
        topic,
        'X-Ray / How It Works — detailed cutaway anatomical or mechanical cross-section on technical graph paper, revealing internal layers, sequential mechanism steps demonstrating how it works, labeled parts, circular close-up insets, and technical data callouts.',
        'Automatically choose the most appropriate number of cutaway layers, close-up insets, callout labels, mechanism steps, and supporting visual elements according to the topic.'
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
    presetId: 'comparison',
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
    name: 'Scientific Diagram & Anatomy Chart',
    nameFr: 'Schéma Scientifique & Planche Anatomique',
    nameAr: 'رسم بياني علمي ولوحة تشريحية',
    summary: 'Scientific diagram, labeled anatomy chart, process flows, system loops, labeled parts/organs, cycle rings, and connecting arrows.',
    basePrompt: 'Create a clean scientific diagram or labeled anatomy chart with structured nodes, labeled organs or components, arrows, and step descriptions.',
    styleBlock:
      'Diagram & Anatomy Chart — clean scientific diagram or labeled anatomy chart with structured sections, labeled parts/organs, leader callouts, directional arrows, connectors, symbols, and simplified explanations.',
    themeId: 'official',
    presetId: 'auto',
    defaultModel: 'nvidia-flux-1-dev',
    imageSlots: [
      {
        name: 'diagram-backdrop',
        description: 'Text-free background or illustrative anatomical scene behind HTML connectors',
        count: 1,
        textFree: true,
      },
    ],
    schemaFields: [
      { name: 'title', type: 'string', description: 'System, organism, or process title', required: true },
      { name: 'nodes', type: 'Array<{id: string, label: string, text: string}>', description: 'Diagram nodes or labeled anatomical parts', required: true },
      { name: 'links', type: 'Array<{from: string, to: string, label?: string}>', description: 'Causal flow connectors or relationship links' },
    ],
    compilePrompt: (topic: string) =>
      buildBasePrompt(
        topic,
        'Diagram & Anatomy Chart — clean scientific diagram or labeled anatomy chart with structured sections, labeled parts/organs, leader callouts, directional arrows, connectors, symbols, and simplified explanations.',
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
    themeId: 'kids',
    presetId: 'mindmap',
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
    presetId: 'central-picture',
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
    presetId: 'picture-rows',
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
    themeId: 'official',
    presetId: 'timeline',
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
    summary: 'Modular grid of printable double-sided revision cards with terms, definitions, examples, pronunciation hints, and visual cues.',
    basePrompt: 'Create a set of printable revision flashcards for key lesson vocabulary and definitions.',
    styleBlock:
      'Flashcards — modular printable double-sided study cards with vocabulary word, phonetics, definition, example sentence, and visual hint illustration.',
    themeId: 'fiche',
    presetId: 'flashcards',
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

  '/cycle': {
    command: '/cycle',
    name: 'Circular Cycle / Flow',
    nameFr: 'Cycle Circulaire / Boucle',
    nameAr: 'مخطط دوري متكرر',
    summary: 'Repeating loop of cyclical stages (life cycles, seasons, water cycle, biological cycles) where the final stage reconnects to the beginning.',
    basePrompt: 'Create an educational repeating cycle diagram showing sequential circular stages returning to the start.',
    styleBlock:
      'Cycle — clean circular flow diagram with 3 to 6 ordered stages in a continuous loop, curved directional connecting arrows, step badges, and concise explanatory text for each stage.',
    themeId: 'kids',
    presetId: 'circular-flow',
    defaultModel: 'nvidia-flux-1-dev',
    imageSlots: [
      {
        name: 'cycle-stages',
        description: 'Text-free illustration for each stage in the circular cycle',
        count: 4,
        textFree: true,
      },
    ],
    schemaFields: [
      { name: 'title', type: 'string', description: 'Cycle or system title', required: true },
      { name: 'subtitle', type: 'string', description: 'Learning objective or cycle scope' },
      { name: 'stages', type: 'Array<{stepNumber: number, title: string, description: string, icon?: string}>', description: 'Cyclical stages leading back to stage 1', required: true },
      { name: 'takeaway', type: 'string', description: 'Core takeaway or biological rule' },
    ],
    compilePrompt: (topic: string) =>
      buildBasePrompt(
        topic,
        'Cycle — clean circular flow diagram with 3 to 6 ordered stages in a continuous loop, curved directional connecting arrows, step badges, and concise explanatory text for each stage.',
        'Automatically choose the most appropriate number of stages, arrows, badges, and supporting visual elements according to the topic.'
      ),
  },

  '/steps': {
    command: '/steps',
    name: 'Step-by-Step & Interface',
    nameFr: 'Tutoriel & Interface',
    nameAr: 'خطوات العمل وشاشة التطبيق',
    summary: 'Numbered step-by-step practical tutorial or digital tool guide beside a clean simplified simulated screen interface.',
    basePrompt: 'Create a step-by-step tutorial guide with numbered instructions and a simplified interactive interface or procedure screen.',
    styleBlock:
      'Steps & Interface — clear step-by-step procedure guide with numbered action steps, concrete instructions, and a simplified simulated screen or form interface mockup.',
    themeId: 'lilac',
    presetId: 'steps-interface',
    defaultModel: 'nvidia-flux-1-dev',
    imageSlots: [
      {
        name: 'step-icons',
        description: 'Small text-free action icon per step',
        count: 4,
        textFree: true,
      },
    ],
    schemaFields: [
      { name: 'title', type: 'string', description: 'Tutorial or task title', required: true },
      { name: 'appName', type: 'string', description: 'Name of the tool or procedure', required: true },
      { name: 'steps', type: 'Array<{stepNumber: number, title: string, instruction: string}>', description: 'Ordered step instructions', required: true },
      { name: 'interfaceFields', type: 'Array<{label: string, kind: string, options?: string[]}>', description: 'Simulated interface fields' },
    ],
    compilePrompt: (topic: string) =>
      buildBasePrompt(
        topic,
        'Steps & Interface — clear step-by-step procedure guide with numbered action steps, concrete instructions, and a simplified simulated screen or form interface mockup.',
        'Automatically choose the most appropriate number of steps, interface fields, icons, and supporting visual elements according to the topic.'
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
