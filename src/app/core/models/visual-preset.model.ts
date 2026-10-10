export type VisualCommand =
  | '/infographic'
  | '/handwritten'
  | '/xray'
  | '/visualize'
  | '/diagram'
  | '/mindmap'
  | '/poster'
  | '/comic'
  | '/timeline'
  | '/flashcards';

export interface VisualImageSlot {
  name: string;
  description: string;
  count: number;
  textFree: true;
}

export interface VisualContentSchemaField {
  name: string;
  type: string;
  description: string;
  required?: boolean;
}

export interface VisualPresetDefinition {
  command: VisualCommand;
  name: string;
  nameFr: string;
  nameAr: string;
  summary: string;
  basePrompt: string;
  styleBlock: string;
  themeId: string;
  defaultModel: string;
  imageSlots: VisualImageSlot[];
  schemaFields: VisualContentSchemaField[];
  compilePrompt: (topic: string) => string;
}
