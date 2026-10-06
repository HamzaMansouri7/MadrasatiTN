import { Type } from '@google/genai';

export interface MemoPromptInput {
  mode: 'topic' | 'text' | 'image' | 'file' | 'resource';
  topic?: string;
  text?: string;
  grade?: string;
  subject?: string;
  trimester?: string;
  instructions?: string;
  extractedText?: string;
  blockToRegenerate?: 'steps' | 'cards' | 'example' | 'remember' | 'formula' | 'quote';
  currentMemo?: Record<string, unknown>;
}

export const MEMO_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    subtitle: { type: Type.STRING },
    grade: { type: Type.STRING },
    subject: { type: Type.STRING },
    topic: { type: Type.STRING },
    language: { type: Type.STRING, enum: ['ar', 'fr'] },
    steps: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          n: { type: Type.INTEGER },
          heading: { type: Type.STRING },
          body: { type: Type.STRING },
        },
        required: ['n', 'heading', 'body'],
      },
    },
    cards: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          label: { type: Type.STRING },
          definition: { type: Type.STRING },
          examples: { type: Type.ARRAY, items: { type: Type.STRING } },
          icon: { type: Type.STRING },
          color: { type: Type.STRING },
        },
        required: ['id', 'label', 'definition', 'examples'],
      },
    },
    example: {
      type: Type.OBJECT,
      properties: {
        sentence: { type: Type.STRING },
        analysis: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              word: { type: Type.STRING },
              role: { type: Type.STRING },
            },
            required: ['word', 'role'],
          },
        },
      },
      required: ['sentence', 'analysis'],
    },
    remember: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    formula: {
      type: Type.OBJECT,
      properties: {
        parts: { type: Type.ARRAY, items: { type: Type.STRING } },
        note: { type: Type.STRING },
      },
      required: ['parts', 'note'],
    },
    quote: { type: Type.STRING },
    extractedText: { type: Type.STRING },
    timeline: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          stepOrDate: { type: Type.STRING },
          title: { type: Type.STRING },
          description: { type: Type.STRING },
        },
        required: ['stepOrDate', 'title', 'description'],
      },
    },
    comparisonTable: {
      type: Type.OBJECT,
      properties: {
        headers: { type: Type.ARRAY, items: { type: Type.STRING } },
        rows: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              label: { type: Type.STRING },
              cells: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['label', 'cells'],
          },
        },
      },
      required: ['headers', 'rows'],
    },
    conjugationGrid: {
      type: Type.OBJECT,
      properties: {
        verb: { type: Type.STRING },
        tense: { type: Type.STRING },
        rows: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              pronoun: { type: Type.STRING },
              form: { type: Type.STRING },
              example: { type: Type.STRING },
            },
            required: ['pronoun', 'form'],
          },
        },
      },
      required: ['verb', 'tense', 'rows'],
    },
  },
  required: ['title', 'grade', 'subject', 'topic', 'language', 'steps', 'cards', 'remember'],
} as const;

export const BLOCK_SCHEMAS: Record<string, object> = {
  steps: {
    type: Type.OBJECT,
    properties: { steps: MEMO_SCHEMA.properties.steps },
    required: ['steps'],
  },
  cards: {
    type: Type.OBJECT,
    properties: { cards: MEMO_SCHEMA.properties.cards },
    required: ['cards'],
  },
  example: {
    type: Type.OBJECT,
    properties: { example: MEMO_SCHEMA.properties.example },
    required: ['example'],
  },
  remember: {
    type: Type.OBJECT,
    properties: { remember: MEMO_SCHEMA.properties.remember },
    required: ['remember'],
  },
  formula: {
    type: Type.OBJECT,
    properties: { formula: MEMO_SCHEMA.properties.formula },
    required: ['formula'],
  },
  quote: {
    type: Type.OBJECT,
    properties: { quote: { type: Type.STRING } },
    required: ['quote'],
  },
  timeline: {
    type: Type.OBJECT,
    properties: { timeline: MEMO_SCHEMA.properties.timeline },
    required: ['timeline'],
  },
  comparisonTable: {
    type: Type.OBJECT,
    properties: { comparisonTable: MEMO_SCHEMA.properties.comparisonTable },
    required: ['comparisonTable'],
  },
  conjugationGrid: {
    type: Type.OBJECT,
    properties: { conjugationGrid: MEMO_SCHEMA.properties.conjugationGrid },
    required: ['conjugationGrid'],
  },
};

export function buildMemoPrompt(input: MemoPromptInput, lang: 'ar' | 'fr', grounding = ''): string {
  const isAr = lang === 'ar';
  const langInstruction = isAr
    ? `RÈGLE LINGUISTIQUE ABSOLUE : l'arabe est la langue principale. Rédige TOUS les champs texte (titre, sous-titre, étapes, cartes, exemple, analyse, à retenir, formule) en ARABE LITTÉRAIRE scolaire tunisien (العربية الفصحى المدرسية). EXCEPTION : si la matière est le Français, rédige en français ; si c'est l'Anglais, en anglais.`
    : `RÈGLE LINGUISTIQUE ABSOLUE : rédige TOUS les champs texte en FRANÇAIS clair et soigné, conforme au programme tunisien. EXCEPTION : matière Anglais → anglais ; matière اللغة العربية → arabe.`;

  const wordingRule = (input.mode === 'text' || input.mode === 'image' || input.mode === 'file')
    ? `RÈGLE DE FIDÉLITÉ STRICTE : Conserve fidèlement la terminologie et la formulation de l'enseignant fournies dans le texte ou l'image source. Ne modifie pas les définitions données par l'enseignant et n'invente aucun fait ni contenu hors programme.`
    : `RÈGLE CURRICULUM : Respecte rigoureusement les notions officielles du programme primaire tunisien. N'invente aucun fait ni concept non abordé à ce niveau.`;

  const contextParts: string[] = [
    `Tu es un enseignant tunisien d'élite et un concepteur de supports pédagogiques visuels (Fiche Mémo synthétique A4 pour le primaire).`,
    langInstruction,
    wordingRule,
  ];

  if (grounding) {
    contextParts.push(`\nCONTEXTE PÉDAGOGIQUE OFFICIEL CNP :\n${grounding}\n`);
  }

  contextParts.push(
    `NIVEAU : ${input.grade || 'Primaire'}`,
    `MATIÈRE : ${input.subject || 'Général'}`,
    input.trimester ? `TRIMESTRE : ${input.trimester}` : '',
    input.topic ? `NOTION / SUJET : ${input.topic}` : '',
  );

  if (input.blockToRegenerate) {
    contextParts.push(
      `\nMISSION : Régénère UNIQUEMENT le bloc "${input.blockToRegenerate}" pour cette fiche mémo.`,
      input.currentMemo ? `Fiche mémo actuelle : ${JSON.stringify(input.currentMemo)}` : '',
      input.instructions ? `Consignes particulières de l'enseignant : "${input.instructions}"` : '',
    );
    return contextParts.filter(Boolean).join('\n');
  }

  contextParts.push(`\nOBJECTIF : Produire une fiche mémo visuelle structurée complète (modèle "Ma fiche mémo").`);

  if (input.mode === 'text' && input.text) {
    contextParts.push(`\nTEXTE FOURNI PAR L'ENSEIGNANT :\n"""\n${input.text}\n"""`);
  } else if (input.extractedText) {
    contextParts.push(`\nTEXTE EXTRAIT DU DOCUMENT / IMAGE :\n"""\n${input.extractedText}\n"""`);
  }

  if (input.mode === 'image' || input.mode === 'file' || input.mode === 'resource') {
    contextParts.push(`\nIMPORTANT : Pour le champ "extractedText", retranscris fidèlement tout le texte visible dans le document/image soumis.`);
  }

  if (input.instructions) {
    contextParts.push(`\nCONSIGNES SPÉCIFIQUES DE L'ENSEIGNANT : "${input.instructions}"`);
  }

  contextParts.push(
    `\nSTRUCTURE ATTENDUE DANS LE JSON :`,
    `- title : Titre percutant et élégant (ex: "Les déterminants", "اسم الفاعل").`,
    `- subtitle : Sous-titre précisant la portée pédagogique (ex: "Les articles définis et indéfinis - 6ème année").`,
    `- grade, subject, topic, language ("${lang}").`,
    `- steps : Tableau ordonné de 3 à 4 étapes claires ("Ma méthode pas à pas" : { n: 1..4, heading, body }).`,
    `- cards : 2 à 4 cartes de concepts clés ({ id, label, definition, examples, icon, color }). Couleurs conseillées : emerald, amber, rose, sky.`,
    `- example : Une phrase modèle décortiquée avec son analyse ({ sentence, analysis: [{ word, role }] }).`,
    `- remember : Liste de 2 à 4 règles mémo incontournables ("À ne pas oublier !").`,
    `- formula : { parts: ["DÉTERMINANT", "+", "NOM", "=", "GROUPE NOMINAL"], note: "Règle de composition" }.`,
    `- quote : Phrase motivante ou proverbe adapté au niveau primaire.`,
    `- timeline (optionnel si sujet chronologique / historique / processus) : [{ stepOrDate, title, description }]`,
    `- comparisonTable (optionnel si sujet comparatif) : { headers: ["Critère", "A", "B"], rows: [{ label, cells: [...] }] }`,
    `- conjugationGrid (optionnel si sujet de conjugaison / grammaire) : { verb, tense, rows: [{ pronoun, form, example }] }`,
  );

  return contextParts.filter(Boolean).join('\n');
}
