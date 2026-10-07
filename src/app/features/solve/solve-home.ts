import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EducationStore, FirebaseService, LanguageService, AiClient } from '@core';

interface PhotoSolveResult {
  extractedText: string;
  grade: string;
  subject: string;
  solutionText: string;
  parentGuide: string;
  checkQuestion?: string;
}

const SOLVE_COUNT_KEY = 'madrasati_solve_count';

@Component({
  selector: 'app-solve-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './solve-home.html',
})
export class SolveHomeComponent {
  readonly lang = inject(LanguageService);
  readonly store = inject(EducationStore);
  private readonly firebase = inject(FirebaseService);
  private readonly ai = inject(AiClient);

  readonly state = signal<'idle' | 'analyzing' | 'done' | 'error'>('idle');
  readonly previewUrl = signal<string | null>(null);
  readonly result = signal<PhotoSolveResult | null>(null);
  readonly errorMessage = signal('');
  readonly solutionCopied = signal(false);
  /** Soft signup nudge after a couple of free solves — never a blocker. */
  readonly showSignupNudge = signal(false);

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.solvePhoto(file);
    input.value = '';
  }

  onDragOver(e: DragEvent) {
    e.preventDefault();
  }

  onFileDrop(e: DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) this.solvePhoto(file);
  }

  async solvePhoto(file: File) {
    this.state.set('analyzing');
    this.result.set(null);
    this.errorMessage.set('');

    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('read error'));
        reader.readAsDataURL(file);
      });
      this.previewUrl.set(base64Data);

      const res = await this.ai.post('photo-solve', {
        photoBase64: base64Data,
        base64Data,
        mimeType: file.type,
        contentType: file.type,
      }, { fallbackError: '' });
      const sol = res.ok ? res.data['solution'] || res.data['result'] : undefined;

      if (sol) {
        this.result.set(sol as PhotoSolveResult);
        this.state.set('done');
        this.bumpSolveCount();
      } else {
        this.errorMessage.set(res.ok ? '' : res.error);
        this.state.set('error');
      }
    } catch (err) {
      console.error('photo-solve error:', err);
      this.state.set('error');
    }
  }

  private bumpSolveCount() {
    if (typeof localStorage === 'undefined') return;
    try {
      const count = (parseInt(localStorage.getItem(SOLVE_COUNT_KEY) || '0', 10) || 0) + 1;
      localStorage.setItem(SOLVE_COUNT_KEY, String(count));
      if (count >= 2 && !this.firebase.userProfile()) {
        this.showSignupNudge.set(true);
      }
    } catch {
      // storage unavailable — nudge simply never shows
    }
  }

  reset() {
    this.state.set('idle');
    this.previewUrl.set(null);
    this.result.set(null);
    this.errorMessage.set('');
  }

  async copySolution() {
    const r = this.result();
    if (!r || typeof navigator === 'undefined') return;
    try {
      await navigator.clipboard.writeText(`${r.extractedText}\n\n${r.solutionText}`);
      this.solutionCopied.set(true);
      setTimeout(() => this.solutionCopied.set(false), 2500);
    } catch (err) {
      console.error('Clipboard error:', err);
    }
  }

  openSignup() {
    this.store.openSignupModal('parent');
  }
}
