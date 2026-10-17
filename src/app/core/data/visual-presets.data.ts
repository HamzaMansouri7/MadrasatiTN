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
    defaultModel: 'flux-2-klein-4b',
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
    defaultModel: 'flux-2-klein-4b',
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
    defaultModel: 'flux-2-klein-4b',
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
    defaultModel: 'flux-2-klein-4b',
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
    defaultModel: 'flux-2-klein-4b',
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
    defaultModel: 'flux-2-klein-4b',
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
    defaultModel: 'flux-2-klein-4b',
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
    defaultModel: 'flux-2-klein-4b',
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
    defaultModel: 'flux-2-klein-4b',
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
    defaultModel: 'flux-2-klein-4b',
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
    defaultModel: 'flux-2-klein-4b',
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
    defaultModel: 'flux-2-klein-4b',
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

  '/cheatsheet': {
    command: '/cheatsheet',
    name: 'Cheat Sheet / Fiche Mémo',
    nameFr: 'Fiche Mémo / Aide-mémoire',
    nameAr: 'بطاقة تلخيص ومراجعة مركزة',
    summary: 'Condensed summary card packed with essential definitions, formulas, rules and practical examples for fast exam revision.',
    basePrompt: 'Create a dense, high-yield educational revision cheat sheet with essential rules, formulas, key definitions, and quick examples.',
    styleBlock:
      'Cheat Sheet — high-density educational study fiche with structured cards, bold mnemonic keywords, clear rules, highlighted formulas, and compact examples designed for rapid review.',
    themeId: 'fiche',
    presetId: 'hero-cards',
    defaultModel: 'flux-2-klein-4b',
    imageSlots: [
      {
        name: 'concept-diagram',
        description: 'Text-free summary schematic or memory anchor icon',
        count: 1,
        textFree: true,
      },
    ],
    schemaFields: [
      { name: 'title', type: 'string', description: 'Subject or chapter title', required: true },
      { name: 'subtitle', type: 'string', description: 'Cheat sheet focus or exam level', required: true },
      { name: 'cards', type: 'Array<{title: string, text: string, icon?: string}>', description: 'Dense rule and definition cards', required: true },
      { name: 'remember', type: 'string[]', description: 'Essential points to memorize', required: true },
    ],
    compilePrompt: (topic: string) =>
      buildBasePrompt(
        topic,
        'Cheat Sheet — high-density educational study fiche with structured cards, bold mnemonic keywords, clear rules, highlighted formulas, and compact examples designed for rapid review.',
        'Automatically choose the most appropriate number of cards, rules, icons, and supporting visual elements according to the topic.'
      ),
  },

  '/didyouknow': {
    command: '/didyouknow',
    name: 'Did You Know?',
    nameFr: 'Le Saviez-Vous ?',
    nameAr: 'هل تعلم ؟ حقائق مدهشة',
    summary: 'Captivating central discovery image surrounded by fascinating, surprising scientific and cultural facts with explanatory cards.',
    basePrompt: 'Create an engaging educational fact-sheet centered around a striking discovery visual with surprising and verified scientific facts.',
    styleBlock:
      'Did You Know — captivating central illustration surrounded by curious, unexpected, and educational facts that ignite curiosity and scientific exploration.',
    themeId: 'kids',
    presetId: 'central-picture',
    defaultModel: 'flux-2-klein-4b',
    imageSlots: [
      {
        name: 'central-discovery',
        description: 'Vibrant text-free visual depicting the scientific wonder or historical curiosity',
        count: 1,
        textFree: true,
      },
    ],
    schemaFields: [
      { name: 'title', type: 'string', description: 'Curiosity theme title', required: true },
      { name: 'subtitle', type: 'string', description: 'Surprising question or inquiry hook' },
      { name: 'facts', type: 'Array<{title: string, text: string, icon: string}>', description: 'Curious facts explained simply', required: true },
      { name: 'takeaway', type: 'string', description: 'Inspiring summary message' },
    ],
    compilePrompt: (topic: string) =>
      buildBasePrompt(
        topic,
        'Did You Know — captivating central illustration surrounded by curious, unexpected, and educational facts that ignite curiosity and scientific exploration.',
        'Automatically choose the most appropriate number of facts, cards, icons, and supporting visual elements according to the topic.'
      ),
  },

  '/roadmap': {
    command: '/roadmap',
    name: 'Learning Roadmap',
    nameFr: 'Feuille de Route & Progression',
    nameAr: 'خارطة طريق تعليمية',
    summary: 'Milestone-driven pedagogical roadmap mapping progressive competencies, skill checkpoints, and term objectives.',
    basePrompt: 'Create a progressive learning roadmap with ordered chronological stages, milestones, prerequisites, and competency checkpoints.',
    styleBlock:
      'Roadmap — structured sequential progression timeline with ordered competency milestones, skill badges, and clear progressive steps toward learning mastery.',
    themeId: 'official',
    presetId: 'timeline',
    defaultModel: 'flux-2-klein-4b',
    imageSlots: [
      {
        name: 'milestone-icons',
        description: 'Text-free milestone icons for key checkpoints',
        count: 3,
        textFree: true,
      },
    ],
    schemaFields: [
      { name: 'title', type: 'string', description: 'Competency path or project roadmap title', required: true },
      { name: 'subtitle', type: 'string', description: 'Learning goal or curriculum period' },
      { name: 'milestones', type: 'Array<{stepNumber: number, title: string, text: string, icon?: string}>', description: 'Ordered milestone progression', required: true },
      { name: 'finalGoal', type: 'string', description: 'Ultimate mastery milestone' },
    ],
    compilePrompt: (topic: string) =>
      buildBasePrompt(
        topic,
        'Roadmap — structured sequential progression timeline with ordered competency milestones, skill badges, and clear progressive steps toward learning mastery.',
        'Automatically choose the most appropriate number of milestones, badges, and supporting visual elements according to the topic.'
      ),
  },

  '/tree': {
    command: '/tree',
    name: 'Tree Diagram',
    nameFr: 'Arbre des Concepts & Taxonomie',
    nameAr: 'شجرة المفاهيم والتصنيف',
    summary: 'Hierarchical tree classification branching from a root concept into thematic categories, sub-families, and concrete examples.',
    basePrompt: 'Create a hierarchical tree classification structure branching from a core concept into sub-categories and concrete examples.',
    styleBlock:
      'Tree Diagram — hierarchical branching concept tree radiating from a root node into thematic branches, sub-categories, and concrete pedagogical instances.',
    themeId: 'kids',
    presetId: 'mindmap',
    defaultModel: 'flux-2-klein-4b',
    imageSlots: [
      {
        name: 'root-icon',
        description: 'Text-free central root emblem or classification subject icon',
        count: 1,
        textFree: true,
      },
    ],
    schemaFields: [
      { name: 'title', type: 'string', description: 'Root taxonomy or classification subject', required: true },
      { name: 'rootConcept', type: 'string', description: 'Central core node', required: true },
      { name: 'branches', type: 'Array<{title: string, items: string[], icon?: string}>', description: 'Branching sub-families and examples', required: true },
    ],
    compilePrompt: (topic: string) =>
      buildBasePrompt(
        topic,
        'Tree Diagram — hierarchical branching concept tree radiating from a root node into thematic branches, sub-categories, and concrete pedagogical instances.',
        'Automatically choose the most appropriate number of branches, nodes, icons, and supporting visual elements according to the topic.'
      ),
  },

  '/compare': {
    command: '/compare',
    name: 'Comparison Matrix',
    nameFr: 'Tableau Comparatif A vs B',
    nameAr: 'جدول مقارنة بين مفهومين',
    summary: 'Side-by-side comparison matrix highlighting differences, distinct properties, and common features between two entities.',
    basePrompt: 'Create a structured side-by-side comparison between two entities, highlighting distinctive differences and shared commonalities.',
    styleBlock:
      'Comparison Matrix — balanced two-column comparison layout with color-coded side-by-side attributes, distinct characteristics, and shared commonalities.',
    themeId: 'kids',
    presetId: 'comparison',
    defaultModel: 'flux-2-klein-4b',
    imageSlots: [
      {
        name: 'side-a-image',
        description: 'Text-free visual depiction of entity A',
        count: 1,
        textFree: true,
      },
      {
        name: 'side-b-image',
        description: 'Text-free visual depiction of entity B',
        count: 1,
        textFree: true,
      },
    ],
    schemaFields: [
      { name: 'title', type: 'string', description: 'Comparison topic (e.g. Vertébrés vs Invertébrés)', required: true },
      { name: 'sideA', type: '{title: string, points: string[]}', description: 'Entity A properties', required: true },
      { name: 'sideB', type: '{title: string, points: string[]}', description: 'Entity B properties', required: true },
      { name: 'common', type: 'string[]', description: 'Shared common traits' },
    ],
    compilePrompt: (topic: string) =>
      buildBasePrompt(
        topic,
        'Comparison Matrix — balanced two-column comparison layout with color-coded side-by-side attributes, distinct characteristics, and shared commonalities.',
        'Automatically choose the most appropriate number of comparison points, icons, and supporting visual elements according to the topic.'
      ),
  },

  '/quizcard': {
    command: '/quizcard',
    name: 'Quiz & MCQ Card',
    nameFr: 'Fiche QCM & Quiz',
    nameAr: 'بطاقة سؤال واختبار متعدد الخيارات',
    summary: 'Formative multiple choice evaluation card with question prompt, 4 clear choice options, pedagogical hint, and step-by-step explanation.',
    basePrompt: 'Create a formative multiple-choice question card with a clear question, 4 distinct choices, an answer key, and an explanatory note.',
    styleBlock:
      'Quiz Card — formative multiple-choice question layout with high-contrast choices, letter bubbles, helpful hint, and detailed solution explanation.',
    themeId: 'lilac',
    presetId: 'quizcard',
    defaultModel: 'flux-2-klein-4b',
    imageSlots: [
      {
        name: 'question-illustration',
        description: 'Text-free illustration setting the problem context or scenario',
        count: 1,
        textFree: true,
      },
    ],
    schemaFields: [
      { name: 'title', type: 'string', description: 'Quiz topic or concept tested', required: true },
      { name: 'question', type: 'string', description: 'Clear question statement', required: true },
      { name: 'choices', type: 'Array<{id: string, text: string, isCorrect: boolean}>', description: '4 answer choices', required: true },
      { name: 'explanation', type: 'string', description: 'Correction and pedagogical reason', required: true },
      { name: 'hint', type: 'string', description: 'Helpful hint for reflection' },
    ],
    compilePrompt: (topic: string) =>
      buildBasePrompt(
        topic,
        'Quiz Card — formative multiple-choice question layout with high-contrast choices, letter bubbles, helpful hint, and detailed solution explanation.',
        'Automatically choose the most appropriate question, choices, hint, and supporting visual elements according to the topic.'
      ),
  },

  '/certificate': {
    command: '/certificate',
    name: 'Certificate of Achievement',
    nameFr: "Certificat de Réussite & d'Excellence",
    nameAr: 'شهادة تقدير وتشجيع وتفوق',
    summary: 'Commemorative A4 certificate and diploma with ornate official borders, student recipient line, commendation reason, and teacher signature seal.',
    basePrompt: 'Create a formal commemorative certificate of achievement with ornate official borders, student recipient line, pedagogical citation, and seal.',
    styleBlock:
      'Certificate — formal commemorative diploma layout with ornate decorative borders, official header, student name line, commendation text, signature zone, and official seal.',
    themeId: 'official',
    presetId: 'certificate',
    defaultModel: 'flux-2-klein-4b',
    imageSlots: [],
    schemaFields: [
      { name: 'title', type: 'string', description: 'Certificate title', required: true },
      { name: 'reason', type: 'string', description: 'Commendation reason or pedagogical merit', required: true },
      { name: 'grade', type: 'string', description: 'Class level' },
      { name: 'schoolYear', type: 'string', description: 'School year' },
      { name: 'teacherName', type: 'string', description: 'Teacher name' },
      { name: 'schoolName', type: 'string', description: 'School name' },
    ],
    compilePrompt: (topic: string) =>
      buildBasePrompt(
        topic,
        'Certificate — formal commemorative diploma layout with ornate decorative borders, official header, student name line, commendation text, signature zone, and official seal.',
        'Automatically choose the most appropriate title, commendation citation, honorific wording, and supporting elements according to the topic.'
      ),
  },

  '/venn': {
    command: '/venn',
    name: 'Venn Diagram',
    nameFr: 'Diagramme de Venn',
    nameAr: 'مخطط مجموعات فين المتداخلة',
    summary: 'Intersecting conceptual sets diagram comparing two or three categories with distinct attributes and a central shared intersection zone.',
    basePrompt: 'Create a Venn diagram comparing concepts through overlapping sets with distinct traits and shared intersection points.',
    styleBlock:
      'Venn Diagram — intersecting mathematical or conceptual set diagram with distinct attribute chips for each set and an overlapping common zone.',
    themeId: 'kids',
    presetId: 'venn',
    defaultModel: 'flux-2-klein-4b',
    imageSlots: [],
    schemaFields: [
      { name: 'title', type: 'string', description: 'Venn comparison title', required: true },
      { name: 'setA', type: '{title: string, items: string[]}', description: 'Set A unique traits', required: true },
      { name: 'setB', type: '{title: string, items: string[]}', description: 'Set B unique traits', required: true },
      { name: 'overlap', type: '{title: string, items: string[]}', description: 'Intersection shared traits', required: true },
      { name: 'setC', type: '{title: string, items: string[]}', description: 'Optional third set traits' },
    ],
    compilePrompt: (topic: string) =>
      buildBasePrompt(
        topic,
        'Venn Diagram — intersecting mathematical or conceptual set diagram with distinct attribute chips for each set and an overlapping common zone.',
        'Automatically choose the most appropriate sets, intersection traits, chips, and supporting visual elements according to the topic.'
      ),
  },

  '/idcard': {
    command: '/idcard',
    name: 'ID & Classification Card',
    nameFr: "Fiche Signalétique & Carte d'Identité",
    nameAr: 'بطاقة هوية وتعريف علمية',
    summary: 'Identity card for animals, plants, historical personalities, or scientific entities with portrait slot, key stats grid, and curious facts.',
    basePrompt: 'Create an identity sheet and classification profile for an animal, plant, historic figure, or scientific subject with key statistics and facts.',
    styleBlock:
      'ID Card — structured identification card layout featuring a subject photo or emblem, classification category, key statistic badges with icons, and did-you-know facts.',
    themeId: 'encyclopedia',
    presetId: 'idcard',
    defaultModel: 'flux-2-klein-4b',
    imageSlots: [
      {
        name: 'entity-portrait',
        description: 'Text-free portrait or natural habitat photo of the subject',
        count: 1,
        textFree: true,
      },
    ],
    schemaFields: [
      { name: 'title', type: 'string', description: 'Sheet title', required: true },
      { name: 'entityName', type: 'string', description: 'Name of the animal, plant or figure', required: true },
      { name: 'category', type: 'string', description: 'Classification group or domain', required: true },
      { name: 'scientificName', type: 'string', description: 'Scientific Latin name or title' },
      { name: 'stats', type: 'Array<{label: string, value: string, icon?: string}>', description: 'Key quantitative attributes', required: true },
      { name: 'facts', type: 'string[]', description: 'Curious facts or behavioral observations', required: true },
    ],
    compilePrompt: (topic: string) =>
      buildBasePrompt(
        topic,
        'ID Card — structured identification card layout featuring a subject photo or emblem, classification category, key statistic badges with icons, and did-you-know facts.',
        'Automatically choose the most appropriate statistics, facts, icons, and supporting visual elements according to the topic.'
      ),
  },

  '/analogy': {
    command: '/analogy',
    name: 'Visual Analogy Bridge',
    nameFr: "Pont d'Analogie Visuelle",
    nameAr: 'المقاربة التمثيلية وجسر التشبيه',
    summary: 'Two-panel analogy bridge linking an everyday familiar situation to an abstract or complex scientific concept with a connective bridge note.',
    basePrompt: 'Create a pedagogical analogy bridging an everyday familiar concept to an abstract scientific or mathematical concept with a connecting explanation.',
    styleBlock:
      'Analogy — visual bridge layout connecting a familiar everyday metaphor on one side to an abstract curriculum concept on the other, unified by a central analogy banner.',
    themeId: 'comic',
    presetId: 'analogy',
    defaultModel: 'flux-2-klein-4b',
    imageSlots: [
      {
        name: 'familiar-image',
        description: 'Text-free illustration of the familiar everyday metaphor',
        count: 1,
        textFree: true,
      },
      {
        name: 'abstract-image',
        description: 'Text-free illustration of the scientific or abstract concept',
        count: 1,
        textFree: true,
      },
    ],
    schemaFields: [
      { name: 'title', type: 'string', description: 'Lesson topic', required: true },
      { name: 'familiar', type: '{concept: string, description: string, keyPoints: string[]}', description: 'Everyday intuitive model', required: true },
      { name: 'abstract', type: '{concept: string, description: string, keyPoints: string[]}', description: 'Scientific concept being taught', required: true },
      { name: 'bridgeNote', type: 'string', description: 'Core analogy rule connecting both concepts', required: true },
    ],
    compilePrompt: (topic: string) =>
      buildBasePrompt(
        topic,
        'Analogy — visual bridge layout connecting a familiar everyday metaphor on one side to an abstract curriculum concept on the other, unified by a central analogy banner.',
        'Automatically choose the most appropriate analogy sides, key points, icons, and supporting visual elements according to the topic.'
      ),
  },

  '/flyer': {
    command: '/flyer',
    name: 'School Flyer & Event Poster',
    nameFr: 'Affiche & Annonce Scolaire',
    nameAr: 'إعلان ومطوية مدرسية',
    summary: 'School announcement flyer and event poster featuring event title, logistics bar (date, time, place), program sections, and parent reminder notice.',
    basePrompt: 'Create a vibrant school announcement flyer with event title, logistics badges, program sections, and instructions for parents.',
    styleBlock:
      'Flyer — school announcement and event poster layout with eye-catching header badge, logistics pills (date, time, location), structured detail cards, and parent notice banner.',
    themeId: 'poster',
    presetId: 'flyer',
    defaultModel: 'flux-2-klein-4b',
    imageSlots: [
      {
        name: 'event-banner',
        description: 'Text-free celebration or event thematic illustration',
        count: 1,
        textFree: true,
      },
    ],
    schemaFields: [
      { name: 'title', type: 'string', description: 'Sheet title', required: true },
      { name: 'badge', type: 'string', description: 'Event category badge', required: true },
      { name: 'eventTitle', type: 'string', description: 'Main event title', required: true },
      { name: 'date', type: 'string', description: 'Event date', required: true },
      { name: 'time', type: 'string', description: 'Event time' },
      { name: 'location', type: 'string', description: 'Event place or classroom', required: true },
      { name: 'sections', type: 'Array<{icon: string, title: string, details: string[]}>', description: 'Program details and requirements', required: true },
      { name: 'notice', type: 'string', description: 'Parent signature notice or important reminder' },
    ],
    compilePrompt: (topic: string) =>
      buildBasePrompt(
        topic,
        'Flyer — school announcement and event poster layout with eye-catching header badge, logistics pills (date, time, location), structured detail cards, and parent notice banner.',
        'Automatically choose the most appropriate event sections, logistics details, icons, and supporting visual elements according to the topic.'
      ),
  },

  '/herbarium': {
    command: '/herbarium',
    name: 'Herbarium Specimen Sheet',
    nameFr: "Planche d’herbier",
    nameAr: 'لوحة نبات (هرباريوم)',
    summary: 'Pressed-plant specimen sheet with the plant portrait, its parts as labelled stats, and observation notes.',
    basePrompt: 'Create a botanical specimen sheet for a plant with its parts and observation notes.',
    styleBlock:
      'Herbarium — vintage botanical specimen plate with a pressed-plant portrait, plant parts listed as labelled notes (root, stem, leaf, flower, fruit), habitat, and short observation notes.',
    themeId: 'herbarium',
    presetId: 'idcard',
    defaultModel: 'flux-2-klein-4b',
    imageSlots: [
      {
        name: 'specimen',
        description: 'Text-free botanical illustration of the whole plant',
        count: 1,
        textFree: true,
      }
    ],
    schemaFields: [
      { name: 'title', type: 'string', description: 'Sheet title', required: true },
      { name: 'entityName', type: 'string', description: 'Plant name', required: true },
      { name: 'stats', type: 'Array<{label: string, value: string}>', description: 'Plant parts and habitat notes', required: true },
      { name: 'facts', type: 'string[]', description: 'Observation notes', required: true },
    ],
    compilePrompt: (topic: string) =>
      buildBasePrompt(
        topic,
        'Herbarium — vintage botanical specimen plate with a pressed-plant portrait, plant parts listed as labelled notes (root, stem, leaf, flower, fruit), habitat, and short observation notes.',
        'Automatically choose the most appropriate plant parts, observation notes, and supporting visual elements according to the topic.'
      ),
  },
  '/illustratedmap': {
    command: '/illustratedmap',
    name: 'Illustrated Map Path',
    nameFr: "Carte illustrée",
    nameAr: 'خريطة مصورة',
    summary: 'Numbered stations along a dashed trail from start to finish, each with a short explanation and a small landmark picture.',
    basePrompt: 'Create an illustrated map with ordered stations along a path.',
    styleBlock:
      'Illustrated Map — friendly illustrated map with a dashed trail linking numbered stations from start to finish, each station with a landmark and a short explanation.',
    themeId: 'kids',
    presetId: 'pathmap',
    defaultModel: 'flux-2-klein-4b',
    imageSlots: [
      {
        name: 'landmarks',
        description: 'Small text-free landmark illustration per station',
        count: 5,
        textFree: true,
      }
    ],
    schemaFields: [
      { name: 'title', type: 'string', description: 'Sheet title', required: true },
      { name: 'items', type: 'Array<{title: string, text: string}>', description: 'Ordered stations along the path', required: true },
    ],
    compilePrompt: (topic: string) =>
      buildBasePrompt(
        topic,
        'Illustrated Map — friendly illustrated map with a dashed trail linking numbered stations from start to finish, each station with a landmark and a short explanation.',
        'Automatically choose the most appropriate number of stations, landmarks, and supporting visual elements according to the topic.'
      ),
  },
  '/treasuremap': {
    command: '/treasuremap',
    name: 'Treasure Map Quest',
    nameFr: "Carte au trésor",
    nameAr: 'خريطة الكنز',
    summary: 'Old parchment treasure map where each numbered station is a learning step on the way to the treasure.',
    basePrompt: 'Create a treasure map learning quest with ordered stations.',
    styleBlock:
      'Treasure Map — antique parchment treasure map with a dashed trail, numbered stations as learning challenges, and the treasure at the finish.',
    themeId: 'encyclopedia',
    presetId: 'pathmap',
    defaultModel: 'flux-2-klein-4b',
    imageSlots: [
      {
        name: 'landmarks',
        description: 'Small text-free antique map landmark per station',
        count: 5,
        textFree: true,
      }
    ],
    schemaFields: [
      { name: 'title', type: 'string', description: 'Sheet title', required: true },
      { name: 'items', type: 'Array<{title: string, text: string}>', description: 'Ordered quest stations', required: true },
    ],
    compilePrompt: (topic: string) =>
      buildBasePrompt(
        topic,
        'Treasure Map — antique parchment treasure map with a dashed trail, numbered stations as learning challenges, and the treasure at the finish.',
        'Automatically choose the most appropriate number of quest stations, landmarks, and supporting visual elements according to the topic.'
      ),
  },
  '/boardgame': {
    command: '/boardgame',
    name: 'Revision Board Game',
    nameFr: "Jeu de plateau de révision",
    nameAr: 'لعبة لوحية للمراجعة',
    summary: 'Printable snake board of question squares between start and finish, with short game rules.',
    basePrompt: 'Create a printable revision board game with one question per square.',
    styleBlock:
      'Board Game — printable snake board with numbered question squares between a start and a finish square, plus short game rules.',
    themeId: 'kids',
    presetId: 'boardgame',
    defaultModel: 'flux-2-klein-4b',
    imageSlots: [],
    schemaFields: [
      { name: 'title', type: 'string', description: 'Sheet title', required: true },
      { name: 'items', type: 'Array<{title: string, text: string}>', description: 'Board squares, one short question each', required: true },
      { name: 'remember', type: 'string[]', description: 'Game rules' },
    ],
    compilePrompt: (topic: string) =>
      buildBasePrompt(
        topic,
        'Board Game — printable snake board with numbered question squares between a start and a finish square, plus short game rules.',
        'Automatically choose the most appropriate number of squares and questions according to the topic.'
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
