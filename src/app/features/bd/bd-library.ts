import { ChangeDetectionStrategy, Component, HostListener, computed, inject, signal } from '@angular/core';
import { LanguageService } from '@core';

/** One page/item inside a resource manifest (shape defined in RESOURCE-PIPELINE.md). */
export interface BdItem {
  id: string;
  grade: string;
  subject: string;
  subSubject?: string;
  trimester: number;
  topic: string;
  title: string;
  file: string;
  relPath: string;
  lang: string;
  ref: string;
  labels: string[];
}

interface ResourceManifest {
  source: string;
  count: number;
  items: BdItem[];
}

const GRADE_LABELS: Record<string, { fr: string; ar: string }> = {
  '1ere-annee': { fr: '1ère Année', ar: 'السنة الأولى' },
  '2eme-annee': { fr: '2ème Année', ar: 'السنة الثانية' },
  '3eme-annee': { fr: '3ème Année', ar: 'السنة الثالثة' },
  '4eme-annee': { fr: '4ème Année', ar: 'السنة الرابعة' },
  '5eme-annee': { fr: '5ème Année', ar: 'السنة الخامسة' },
  '6eme-annee': { fr: '6ème Année', ar: 'السنة السادسة' },
};

@Component({
  selector: 'app-bd-library',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './bd-library.html',
})
export class BdLibraryComponent {
  readonly lang = inject(LanguageService);

  readonly items = signal<BdItem[]>([]);
  readonly isLoading = signal(true);
  readonly activeGrade = signal<string>('all');
  readonly selectedIndex = signal<number | null>(null);
  readonly linkCopied = signal(false);

  readonly grades = computed(() => {
    const seen = new Set(this.items().map((i) => i.grade));
    return Object.keys(GRADE_LABELS).filter((g) => seen.has(g));
  });

  readonly filteredItems = computed(() => {
    const grade = this.activeGrade();
    const all = this.items();
    return grade === 'all' ? all : all.filter((i) => i.grade === grade);
  });

  readonly selectedItem = computed(() => {
    const idx = this.selectedIndex();
    return idx === null ? null : this.filteredItems()[idx] ?? null;
  });

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadManifests();
    }
  }

  private async loadManifests() {
    try {
      const idxRes = await fetch('assets/resources/index.json');
      const idx = await idxRes.json();
      const paths: string[] = Array.isArray(idx.manifests) ? idx.manifests : [];
      const manifests = await Promise.all(
        paths.map(async (p) => {
          try {
            const r = await fetch(p);
            return (await r.json()) as ResourceManifest;
          } catch {
            return null;
          }
        }),
      );
      this.items.set(manifests.filter((m): m is ResourceManifest => !!m).flatMap((m) => m.items));

      // Deep link: /bd?p=<itemId> opens the reader directly on that page.
      const target = new URLSearchParams(window.location.search).get('p');
      if (target) {
        const pos = this.filteredItems().findIndex((i) => i.id === target);
        if (pos >= 0) this.selectedIndex.set(pos);
      }
    } catch (err) {
      console.error('BD manifests load error:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  gradeLabel(slug: string): string {
    const g = GRADE_LABELS[slug];
    return g ? this.lang.tr(g.fr, g.ar) : slug;
  }

  setGrade(grade: string) {
    this.activeGrade.set(grade);
    this.selectedIndex.set(null);
  }

  openReader(index: number) {
    this.selectedIndex.set(index);
    this.linkCopied.set(false);
  }

  closeReader() {
    this.selectedIndex.set(null);
  }

  prev() {
    const idx = this.selectedIndex();
    if (idx !== null && idx > 0) this.selectedIndex.set(idx - 1);
  }

  next() {
    const idx = this.selectedIndex();
    if (idx !== null && idx < this.filteredItems().length - 1) this.selectedIndex.set(idx + 1);
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    if (this.selectedIndex() === null) return;
    if (event.key === 'Escape') this.closeReader();
    else if (event.key === 'ArrowLeft') this.prev();
    else if (event.key === 'ArrowRight') this.next();
  }

  printCurrent() {
    if (this.selectedItem()) window.print();
  }

  shareUrl(): string {
    const item = this.selectedItem();
    if (!item || typeof window === 'undefined') return '';
    return `${window.location.origin}/bd?p=${item.id}`;
  }

  async copyLink() {
    const url = this.shareUrl();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      this.linkCopied.set(true);
      setTimeout(() => this.linkCopied.set(false), 2500);
    } catch (err) {
      console.error('Clipboard error:', err);
    }
  }

  async shareNative() {
    const item = this.selectedItem();
    const url = this.shareUrl();
    if (!item || !url) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: item.title, url });
      } catch {
        // user cancelled — nothing to do
      }
    } else {
      await this.copyLink();
    }
  }
}
