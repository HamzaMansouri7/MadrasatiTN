import { Type } from '@google/genai';
import type { InfographicSlot, InfographicTemplate } from '../../app/core/models/infographic.model';

const STR = { type: Type.STRING } as const;
const NUM = { type: Type.NUMBER } as const;
const STR_ARR = { type: Type.ARRAY, items: STR } as const;

const STAGE_ITEM = {
  type: Type.OBJECT,
  properties: {
    step: STR,
    name: STR,
    minutes: NUM,
    teacherActivity: STR,
    studentActivity: STR,
    modality: STR,
  },
  required: ['step', 'name', 'minutes', 'teacherActivity', 'studentActivity'],
} as const;

/** Value keys a slot reads from `InfographicDoc.values`, with their JSON-schema type. */
function slotValueSchemas(slot: InfographicSlot): Record<string, object> {
  switch (slot.kind) {
    case 'list':
    case 'reflection-lines':
      return slot.valueKey ? { [slot.valueKey]: STR_ARR } : {};
    case 'timeline-stages':
      return slot.valueKey ? { [slot.valueKey]: { type: Type.ARRAY, items: STAGE_ITEM } } : {};
    case 'table':
      return Object.fromEntries((slot.rows ?? []).map((r) => [r.valueKey, STR_ARR]));
    default:
      return {};
  }
}

/**
 * Builds the model's responseSchema from a template, so the schema can never drift
 * from what the renderer reads. `meta` are scalar fields that are not slots (topic, duration...).
 */
export function buildTemplateSchema(template: InfographicTemplate, meta: Record<string, object>) {
  const properties: Record<string, object> = { ...meta };
  for (const slot of template.slots) Object.assign(properties, slotValueSchemas(slot));
  return { type: Type.OBJECT, properties, required: Object.keys(properties) };
}

/** Per-slot size limits (the "complexity budget") as prompt rules, taken from the template. */
export function templateBudgetRules(template: InfographicTemplate): string {
  const lines: string[] = [];
  for (const slot of template.slots) {
    if (!slot.count && !slot.maxChars) continue;
    const keys = Object.keys(slotValueSchemas(slot));
    if (keys.length === 0 || slot.kind === 'timeline-stages') continue;
    const limit = [
      slot.count ? `au maximum ${slot.count} éléments` : '',
      slot.maxChars ? `${slot.maxChars} caractères maximum par élément` : '',
    ]
      .filter(Boolean)
      .join(', ');
    lines.push(`- ${keys.join(' / ')} : ${limit}.`);
  }
  return lines.length ? `LIMITES DE TAILLE PAR RUBRIQUE (lisibilité sur une page A4) :\n${lines.join('\n')}` : '';
}
