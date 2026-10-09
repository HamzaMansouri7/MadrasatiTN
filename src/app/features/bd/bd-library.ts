import { ChangeDetectionStrategy, Component, HostListener, computed, inject, signal } from '@angular/core';
import { LanguageService, escapeHtml } from '@core';
import { ShareButtonComponent } from '@shared';

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
  /** Zero-hallucination oral-expression support (see RESOURCE-PIPELINE.md §3b). */
  pedagogy?: {
    /** Objects/actions physically visible in the image (vision-extracted). */
    keywords: string[];
    /** Official grammar patterns for the module (curriculum-sourced). */
    structures: string[];
    /** Teacher uid once validated; null = draft. */
    verifiedBy?: string | null;
  };
}

interface ResourceManifest {
  source: string;
  count: number;
  items: BdItem[];
}

/** One album = the pages of one source book for a grade and trimester. */
export interface BdAlbum {
  key: string;
  title: string;
  grade: string;
  trimester: number;
  cover: BdItem;
  pages: BdItem[];
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
  standalone: true,
  imports: [ShareButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './bd-library.html',
})
export class BdLibraryComponent {
  readonly lang = inject(LanguageService);

  readonly items = signal<BdItem[]>([]);
  readonly isLoading = signal(true);
  readonly activeGrade = signal<string>('all');
  readonly activeTrimester = signal<number>(0);
  readonly activeAlbumKey = signal<string | null>(null);
  readonly selectedIndex = signal<number | null>(null);
  readonly zoomed = signal(false);

  readonly grades = computed(() => {
    const seen = new Set(this.items().map((i) => i.grade));
    return Object.keys(GRADE_LABELS).filter((g) => seen.has(g));
  });

  readonly trimesters = computed(() =>
    [...new Set(this.items().map((i) => i.trimester))].sort((a, b) => a - b),
  );

  private readonly levelItems = computed(() => {
    const grade = this.activeGrade();
    const trim = this.activeTrimester();
    return this.items().filter((i) => (grade === 'all' || i.grade === grade) && (!trim || i.trimester === trim));
  });

  readonly albums = computed<BdAlbum[]>(() => {
    const map = new Map<string, BdAlbum>();
    for (const item of this.levelItems()) {
      const key = this.albumKeyOf(item);
      const album = map.get(key);
      if (album) album.pages.push(item);
      else {
        map.set(key, {
          key,
          title: item.title.replace(/\s*(صفحة|page|planche)\s*\d+.*$/i, '').trim() || item.title,
          grade: item.grade,
          trimester: item.trimester,
          cover: item,
          pages: [item],
        });
      }
    }
    return [...map.values()];
  });

  readonly activeAlbum = computed(() => {
    const key = this.activeAlbumKey();
    return key ? this.albums().find((a) => a.key === key) ?? null : null;
  });

  /** Pages the reader steps through: the open album, else everything matching the filters. */
  readonly filteredItems = computed(() => this.activeAlbum()?.pages ?? this.levelItems());

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
      this.items.set(manifests.filter((m): m is ResourceManifest => !!m).flatMap((m) => m.items).filter((i) => i.topic === 'bandes-dessinees'));

      // Deep link: /discovery?bd=<itemId> opens the reader directly on that page.
      const target = new URLSearchParams(window.location.search).get('bd');
      const found = target ? this.items().find((i) => i.id === target) : undefined;
      if (found) {
        this.activeAlbumKey.set(this.albumKeyOf(found));
        const pos = this.filteredItems().findIndex((i) => i.id === found.id);
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

  private albumKeyOf(item: BdItem): string {
    return `${item.grade}|${item.trimester}|${item.ref.split('#')[0]}`;
  }

  trimesterLabel(n: number): string {
    return this.lang.tr(`Trimestre ${n}`, `الثلاثي ${['', 'الأول', 'الثاني', 'الثالث'][n] || n}`);
  }

  setGrade(grade: string) {
    this.activeGrade.set(grade);
    this.activeAlbumKey.set(null);
    this.selectedIndex.set(null);
  }

  setTrimester(trim: number) {
    this.activeTrimester.set(trim);
    this.activeAlbumKey.set(null);
    this.selectedIndex.set(null);
  }

  openAlbum(key: string) {
    this.activeAlbumKey.set(key);
  }

  closeAlbum() {
    this.activeAlbumKey.set(null);
    this.selectedIndex.set(null);
  }

  openReader(index: number) {
    this.zoomed.set(false);
    this.selectedIndex.set(index);
  }

  closeReader() {
    this.zoomed.set(false);
    this.selectedIndex.set(null);
  }

  goTo(index: number) {
    this.zoomed.set(false);
    this.selectedIndex.set(index);
  }

  prev() {
    const idx = this.selectedIndex();
    if (idx !== null && idx > 0) this.goTo(idx - 1);
  }

  next() {
    const idx = this.selectedIndex();
    if (idx !== null && idx < this.filteredItems().length - 1) this.goTo(idx + 1);
  }

  toggleZoom() {
    this.zoomed.update((z) => !z);
  }

  private touchStartX = 0;

  onTouchStart(event: TouchEvent) {
    this.touchStartX = event.touches[0]?.clientX ?? 0;
  }

  /** Horizontal swipe turns the page (swipe left = next), ignored while zoomed. */
  onTouchEnd(event: TouchEvent) {
    if (this.zoomed()) return;
    const dx = (event.changedTouches[0]?.clientX ?? 0) - this.touchStartX;
    if (Math.abs(dx) < 50) return;
    if (dx < 0) this.next();
    else this.prev();
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    if (this.selectedIndex() === null) return;
    if (event.key === 'Escape') this.closeReader();
    else if (event.key === 'ArrowLeft') this.prev();
    else if (event.key === 'ArrowRight') this.next();
    else if (event.key === 'z' || event.key === 'Z') this.toggleZoom();
  }

  printCurrent() {
    const item = this.selectedItem();
    if (!item || typeof window === 'undefined') return;
    // Dedicated print window: exactly one A4 sheet, image scaled to fit, source line under it.
    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) return;
    const ped = item.pedagogy;
    const chips = (arr: string[]) => arr.map((k) => `<span>${escapeHtml(k)}</span>`).join('');
    const pedagogyHtml = ped?.keywords?.length
      ? `<div class="ped"><strong>${this.lang.t('bdKeywords')}</strong> ${chips(ped.keywords)}` +
        (ped.structures?.length ? `<br/><strong>${this.lang.t('bdStructures')}</strong> ${chips(ped.structures)}` : '') +
        `</div>`
      : '';
    w.document.write(`<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>${escapeHtml(item.title)}</title>
<style>
  @page { size: A4 portrait; margin: 8mm; }
  body { margin: 0; font-family: 'Noto Sans Arabic', sans-serif; color: #14251D; }
  img { display: block; width: 100%; max-height: 230mm; object-fit: contain; }
  .ped { margin-top: 3mm; font-size: 10pt; line-height: 1.9; }
  .ped span { border: 0.3mm solid #E7DFCF; border-radius: 3mm; padding: 0.5mm 2.5mm; margin: 0 1mm; display: inline-block; }
  .src { margin-top: 2mm; text-align: center; font-size: 8pt; color: #5B6B60; }
</style></head><body>
  <img src="${window.location.origin}/${item.relPath}" onload="setTimeout(function(){window.print();window.close();},150)" />
  ${pedagogyHtml}
  <p class="src">${escapeHtml(item.title)} — Madrasati TN · ${escapeHtml(item.ref)}</p>
</body></html>`);
    w.document.close();
  }

  shareUrl(): string {
    const item = this.selectedItem();
    if (!item || typeof window === 'undefined') return '';
    return `${window.location.origin}/discovery?bd=${item.id}`;
  }
}
