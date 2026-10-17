import { Injectable, signal } from '@angular/core';

/** One page of an extracted textbook (public/assets/resources/<grade>/.../manifest.json). */
export interface LibraryResourceItem {
  id: string;
  title: string;
  grade: string;
  subject: string;
  relPath: string;
}

/** Accent-free lowercase key: '4ème Année' and '4eme-annee' both give '4eme annee'. */
const fold = (s: string): string =>
  (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[-_]+/g, ' ').trim();

/** Subject family shared by the app's names, the manifests' names and the Arabic labels. */
function subjectFamily(subject: string): string {
  const s = fold(subject);
  if (/math|رياضيات/.test(s)) return 'math';
  if (/arab|عربية/.test(s)) return 'arabic';
  if (/eveil|science|إيقاظ|ايقاظ/.test(s)) return 'science';
  if (/fran|فرنسية/.test(s)) return 'french';
  if (/angl|engl|إنجليزية|انجليزية/.test(s)) return 'english';
  if (/islam|إسلامية|اسلامية/.test(s)) return 'islamic';
  if (/hist|geo|تاريخ|جغرافيا/.test(s)) return 'history_geo';
  return s;
}

/**
 * The official textbook pages listed in public/assets/resources/index.json, loaded once and shared by
 * every studio source card.
 */
@Injectable({ providedIn: 'root' })
export class LibraryResourcesService {
  readonly items = signal<LibraryResourceItem[]>([]);
  readonly loaded = signal(false);
  private loading: Promise<void> | null = null;

  load(): Promise<void> {
    if (typeof window === 'undefined') return Promise.resolve();
    this.loading ??= this.fetchAll();
    return this.loading;
  }

  /** Pages for one grade and subject (a manifest covering several subjects, e.g. "maths-arabe", matches each). */
  forClass(grade: string, subject: string): LibraryResourceItem[] {
    const g = fold(grade);
    const family = subjectFamily(subject);
    return this.items().filter(
      (it) => fold(it.grade) === g && fold(it.subject).split(' ').some((part) => subjectFamily(part) === family),
    );
  }

  private async fetchAll() {
    try {
      // index.json lists manifest paths ({ manifests: [...] }); each manifest holds the items.
      const res = await fetch('/assets/resources/index.json');
      if (!res.ok) return;
      const idx = await res.json();
      const paths: string[] = Array.isArray(idx?.manifests) ? idx.manifests : [];
      const manifests = await Promise.all(
        paths.map(async (p) => {
          try {
            const r = await fetch('/' + p.replace(/^\//, ''));
            return r.ok ? ((await r.json()) as { items?: LibraryResourceItem[] }) : null;
          } catch {
            return null;
          }
        }),
      );
      this.items.set(manifests.flatMap((m) => m?.items ?? []));
    } catch {
      // No catalogue: the card shows its empty message.
    } finally {
      this.loaded.set(true);
    }
  }
}
