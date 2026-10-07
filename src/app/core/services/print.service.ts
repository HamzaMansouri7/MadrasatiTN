import { Injectable } from '@angular/core';

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Only http(s), site-relative and data:image URLs may reach the print popup. */
function safeUrl(url: string): string {
  const u = url.trim();
  return /^(https?:\/\/|\/|data:image\/)/i.test(u) ? escapeHtml(u) : '';
}

const SHEET_CSS = `
  @page { size: A4 portrait; margin: 8mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #ffffff; width: 100%; height: auto; }
  .print-sheet { width: 100%; page-break-after: always; break-after: page; display: flex; justify-content: center; align-items: flex-start; }
  .print-sheet:last-child { page-break-after: auto; break-after: auto; }
  img { max-width: 100%; max-height: 275mm; width: auto; height: auto; object-fit: contain; display: block; margin: 0 auto; }
`;

/** Single place for every print path (A4 page, scanned-image popup, PDF open). SSR-safe. */
@Injectable({ providedIn: 'root' })
export class PrintService {
  /** Prints the current page (global `@media print` rules in styles.css decide what shows). */
  printPage(): void {
    if (typeof window === 'undefined') return;
    window.print();
  }

  /**
   * Prints scanned pages, one image per A4 sheet, in a popup.
   * Returns false when the popup was blocked or there is nothing to print.
   */
  printImages(urls: string[], title: string): boolean {
    if (typeof window === 'undefined') return false;
    const sheets = urls.map((u) => safeUrl(u)).filter(Boolean);
    if (sheets.length === 0) return false;
    const w = window.open('', '_blank');
    if (!w) return false;

    const safeTitle = escapeHtml(title);
    const imagesHtml = sheets
      .map((url, i) => `<div class="print-sheet"><img src="${url}" alt="${safeTitle} — Page ${i + 1}" /></div>`)
      .join('');

    w.document.write(`<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>${safeTitle}</title>
  <style>${SHEET_CSS}</style>
</head>
<body>
  ${imagesHtml}
  <script>
    window.onload = function() {
      setTimeout(function() { window.focus(); window.print(); }, 300);
    };
  </script>
</body>
</html>`);
    w.document.close();
    return true;
  }

  /** Course/document print: PDF opens in a tab, scans print as A4 sheets, otherwise prints the page. */
  printCourse(course: { title: string; pdfUrl?: string; imageUrls?: string[] } | null | undefined): void {
    if (typeof window === 'undefined') return;
    if (course?.pdfUrl && safeUrl(course.pdfUrl)) {
      window.open(course.pdfUrl, '_blank', 'noopener');
      return;
    }
    if (course?.imageUrls?.length && this.printImages(course.imageUrls, course.title)) return;
    this.printPage();
  }
}
