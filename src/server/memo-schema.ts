import { Type } from '@google/genai';
import { SUMMARY_SECTION_TYPES } from '../app/core/utils/summary.util';

const STR = { type: Type.STRING } as const;
const STR_LIST = { type: Type.ARRAY, items: STR } as const;

/** One section of the revision document; only the fields of its type are filled. */
export const SUMMARY_SECTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, enum: [...SUMMARY_SECTION_TYPES] },
    heading: STR,
    text: STR,
    items: STR_LIST,
    steps: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { heading: STR, body: STR },
        required: ['heading', 'body'],
      },
    },
    solution: STR,
    table: {
      type: Type.OBJECT,
      properties: {
        headers: STR_LIST,
        rows: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: { label: STR, cells: STR_LIST },
            required: ['label', 'cells'],
          },
        },
      },
    },
    conjugation: {
      type: Type.OBJECT,
      properties: {
        verb: STR,
        tense: STR,
        rows: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: { pronoun: STR, form: STR, example: STR },
            required: ['pronoun', 'form'],
          },
        },
      },
    },
    timeline: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { stepOrDate: STR, title: STR, description: STR },
        required: ['title', 'description'],
      },
    },
    exercises: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { question: STR, answer: STR },
        required: ['question', 'answer'],
      },
    },
  },
  required: ['type', 'heading'],
} as const;

export const SUMMARY_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: STR,
    subtitle: STR,
    objective: STR,
    language: { type: Type.STRING, enum: ['ar', 'fr'] },
    sections: { type: Type.ARRAY, items: SUMMARY_SECTION_SCHEMA },
    extractedText: STR,
  },
  required: ['title', 'objective', 'language', 'sections'],
} as const;

/** Answer shape when only one section is regenerated. */
export const SUMMARY_ONE_SECTION_SCHEMA = {
  type: Type.OBJECT,
  properties: { section: SUMMARY_SECTION_SCHEMA },
  required: ['section'],
} as const;
