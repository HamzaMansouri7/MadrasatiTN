/**
 * Parascolaire KnowledgeSource Adapter
 *
 * Plugs local commercial textbook OCR exercises (tier=ready) into the
 * server KnowledgeSource layer with provenance and curriculum topic linkage.
 * Silent no-op if data/parascolaire/index.json does not exist.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { KnowledgeSource, registerSources } from './knowledge-source';

export interface ParascolaireSourceRow extends KnowledgeSource {
  topicId?: string;
  book?: string;
  bookDisplayName?: string;
  page?: number;
  theme?: string;
  format?: string;
  difficulty?: string;
  hasAnswer?: boolean;
  correction?: string | null;
}

export function loadParascolaireBundle(): ParascolaireSourceRow[] {
  const possiblePaths = [
    join(process.cwd(), 'data/parascolaire/index.json'),
    join(import.meta.dirname, '../../data/parascolaire/index.json'),
    join(import.meta.dirname, '../../../data/parascolaire/index.json'),
  ];

  const foundPath = possiblePaths.find((p) => {
    try {
      return existsSync(p);
    } catch {
      return false;
    }
  });

  if (!foundPath) return [];

  try {
    const raw = readFileSync(foundPath, 'utf-8');
    const data = JSON.parse(raw);
    const rows: ParascolaireSourceRow[] = Array.isArray(data) ? data : data.items || [];
    return rows;
  } catch {
    // Silent no-op on read or parse failure
    return [];
  }
}

export function registerParascolaireSources(): void {
  const rows = loadParascolaireBundle();
  if (rows.length > 0) {
    registerSources(rows);
  }
}

