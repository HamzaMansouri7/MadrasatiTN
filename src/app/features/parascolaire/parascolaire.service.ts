import { Injectable, signal } from '@angular/core';
import { ParascolaireCatalog } from './parascolaire.models';

export type CatalogState = 'idle' | 'loading' | 'ready' | 'error';

/** Loads catalog.json once, in the browser only (SSR renders the loading skeleton). */
@Injectable({ providedIn: 'root' })
export class ParascolaireService {
  readonly catalog = signal<ParascolaireCatalog | null>(null);
  readonly state = signal<CatalogState>('idle');

  async load(force = false): Promise<void> {
    if (typeof window === 'undefined') return;
    if (!force && (this.state() === 'loading' || this.state() === 'ready')) return;
    this.state.set('loading');
    try {
      const res = await fetch('/api/parascolaire/catalog', { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`catalog ${res.status}`);
      const data = (await res.json()) as ParascolaireCatalog;
      if (!data || !Array.isArray(data.books) || !Array.isArray(data.classes)) throw new Error('catalog shape');
      this.catalog.set(data);
      this.state.set('ready');
    } catch {
      this.state.set('error');
    }
  }
}
