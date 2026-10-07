import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { EducationStore, FirebaseService, LanguageService, downscaleImage } from '@core';

export interface SummarizeResult {
  title: string;
  grade: string;
  subject: string;
  trimester?: string;
  summaryMarkdown: string;
  keyPoints: string[];
  glossary: { term: string; def: string }[];
}

export interface UploadedImage {
  id: string;
  file: File;
  previewUrl: string;
  base64Data: string;
  contentType: string;
}

const SUMMARIZE_COUNT_KEY = 'madrasati_summarize_count';

@Component({
  selector: 'app-summarize-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './summarize-home.html',
})
export class SummarizeHomeComponent {
  readonly lang = inject(LanguageService);
  readonly store = inject(EducationStore);
  private readonly firebase = inject(FirebaseService);
  private readonly router = inject(Router);

  // Optional pre-classification: when the user picks a grade/subject the
  // server grounds the summary in the matching CNP curriculum (better accuracy).
  readonly GRADES = ['1ère Année', '2ème Année', '3ème Année', '4ème Année', '5ème Année', '6ème Année'];
  readonly SUBJECTS = ['Mathématiques', 'Français', 'اللغة العربية', 'Éveil Scientifique', 'Histoire & Géographie', 'Anglais'];
  readonly selGrade = signal('');
  readonly selSubject = signal('');

  readonly state = signal<'idle' | 'analyzing' | 'done' | 'error'>('idle');
  readonly images = signal<UploadedImage[]>([]);
  readonly result = signal<SummarizeResult | null>(null);
  readonly errorMessage = signal('');
  readonly summaryCopied = signal(false);
  readonly shareSaved = signal(false);
  readonly shareUrl = signal<string | null>(null);
  readonly showSignupNudge = signal(false);

  async onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const filesArray = Array.from(input.files);
    await this.processFiles(filesArray);
    input.value = '';
  }

  onDragOver(e: DragEvent) {
    e.preventDefault();
  }

  async onFileDrop(e: DragEvent) {
    e.preventDefault();
    if (!e.dataTransfer?.files) return;
    const filesArray = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
    if (filesArray.length > 0) {
      await this.processFiles(filesArray);
    }
  }

  private async processFiles(files: File[]) {
    const current = [...this.images()];
    const remainingSlots = 8 - current.length;
    if (remainingSlots <= 0) return;

    const toProcess = files.slice(0, remainingSlots);
    const newImages: UploadedImage[] = [];

    for (const file of toProcess) {
      try {
        const { base64Data, contentType } = await downscaleImage(file);

        newImages.push({
          id: Math.random().toString(36).substring(2, 9),
          file,
          previewUrl: base64Data,
          base64Data,
          contentType,
        });
      } catch (err) {
        console.error('File read error:', err);
      }
    }

    this.images.set([...current, ...newImages]);
  }

  removeImage(index: number) {
    const current = [...this.images()];
    current.splice(index, 1);
    this.images.set(current);
  }

  async generateSummary() {
    const imgList = this.images();
    if (imgList.length === 0) return;

    this.state.set('analyzing');
    this.result.set(null);
    this.errorMessage.set('');

    try {
      const payload = {
        files: imgList.map((img, idx) => ({
          name: `doc-${idx + 1}`,
          data: img.base64Data,
          mimeType: img.contentType,
        })),
        images: imgList.map((img) => ({
          base64Data: img.base64Data,
          contentType: img.contentType,
        })),
        language: this.lang.lang(),
        ...(this.selGrade() ? { grade: this.selGrade() } : {}),
        ...(this.selSubject() ? { subject: this.selSubject() } : {}),
      };

      const res = await fetch('/api/ai/summarize-docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      const sum = data.summary || data.result;

      if (data.success && sum) {
        this.result.set(sum as SummarizeResult);
        this.state.set('done');
        this.bumpSummarizeCount();
      } else {
        this.errorMessage.set(data.error || '');
        this.state.set('error');
      }
    } catch (err) {
      console.error('summarize-docs error:', err);
      this.state.set('error');
    }
  }

  private bumpSummarizeCount() {
    if (typeof localStorage === 'undefined') return;
    try {
      const count = (parseInt(localStorage.getItem(SUMMARIZE_COUNT_KEY) || '0', 10) || 0) + 1;
      localStorage.setItem(SUMMARIZE_COUNT_KEY, String(count));
      if (count >= 2 && !this.firebase.userProfile()) {
        this.showSignupNudge.set(true);
      }
    } catch {
      // localStorage unavailable
    }
  }

  reset() {
    this.state.set('idle');
    this.images.set([]);
    this.result.set(null);
    this.errorMessage.set('');
    this.shareSaved.set(false);
    this.shareUrl.set(null);
  }

  private buildFullText(r: SummarizeResult, withTitle = true): string {
    let text = withTitle ? `# ${r.title} (${r.grade} - ${r.subject})\n\n` : '';
    text += `${r.summaryMarkdown}\n\n`;
    if (r.keyPoints?.length) {
      text += `## ${this.lang.t('summarizeKeyPoints')}\n` + r.keyPoints.map((k) => `- ${k}`).join('\n') + '\n\n';
    }
    if (r.glossary?.length) {
      text += `## ${this.lang.t('summarizeGlossary')}\n` + r.glossary.map((g) => `- **${g.term}**: ${g.def}`).join('\n');
    }
    return text;
  }

  async copySummary() {
    const r = this.result();
    if (!r || typeof navigator === 'undefined') return;

    const text = this.buildFullText(r);

    try {
      await navigator.clipboard.writeText(text);
      this.summaryCopied.set(true);
      setTimeout(() => this.summaryCopied.set(false), 2500);
    } catch (err) {
      console.error('Clipboard error:', err);
    }
  }

  printSummary() {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  async shareSummary() {
    const r = this.result();
    if (!r) return;

    try {
      // Persist via the store so the published-worksheets cache is refreshed
      // and the summary appears in the library/blog immediately. The exercise
      // shape must match GeneratedExercise — the /generate?sheet= viewer
      // renders ex.title + ex.promptText (whitespace-pre-line).
      const saved = await this.store.saveWorksheet({
        title: r.title,
        grade: r.grade,
        subject: r.subject,
        topic: r.title,
        exercises: [
          {
            title: r.title,
            promptText: this.buildFullText(r, false),
            format: 'free',
          },
        ],
        authorName: 'Madrasati TN AI',
        authorRole: 'ai',
        customWatermark: 'Madrasati TN — ملخص مادة',
      });

      if (saved) {
        // shareUrl (/generate?sheet=ID) is the route that resolves saved
        // sheets and gets crawler OG injection.
        const url = `${window.location.origin}${saved.shareUrl || `/generate?sheet=${saved.id}`}`;
        this.shareUrl.set(url);
        this.shareSaved.set(true);
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(url);
        }
      }
    } catch (err) {
      console.error('Share save error:', err);
    }
  }

  openSignup() {
    this.store.openSignupModal('parent');
  }

  formatMarkdown(md: string): string {
    if (!md) return '';
    return md
      .replace(/^## (.*$)/gim, '<h3 class="font-display font-semibold text-lg text-[#14251D] mt-4 mb-2">$1</h3>')
      .replace(/^# (.*$)/gim, '<h2 class="font-display font-bold text-xl text-[#14251D] mt-4 mb-2">$1</h2>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/^\* (.*$)/gim, '<li class="mr-4 list-disc">$1</li>')
      .replace(/^- (.*$)/gim, '<li class="mr-4 list-disc">$1</li>')
      .replace(/\n\n/g, '<br/><br/>');
  }
}
