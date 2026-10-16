import { describe, expect, it } from 'vitest';
import { INFOGRAPHIC_SCHEMA, infographicSchemaFor } from './infographic';

const props = (s: typeof INFOGRAPHIC_SCHEMA) => s.properties as Record<string, { required?: string[] }>;

describe('infographicSchemaFor', () => {
  it('keeps only the chosen preset block, with its required fields', () => {
    const p = props(infographicSchemaFor('venn'));
    expect(p['venn']?.required).toEqual(['setA', 'setB', 'overlap']);
    expect(p['quiz']).toBeUndefined();
    expect(p['flyer']).toBeUndefined();
  });

  it('keeps every block but optional in auto mode', () => {
    const p = props(infographicSchemaFor('auto'));
    expect(p['quiz']).toBeDefined();
    expect(p['quiz']?.required).toBeUndefined();
  });

  it('does not touch the shared schema', () => {
    infographicSchemaFor('auto');
    expect(props(INFOGRAPHIC_SCHEMA)['quiz']?.required).toBeDefined();
  });
});
