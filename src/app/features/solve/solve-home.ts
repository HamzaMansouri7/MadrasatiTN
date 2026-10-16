import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EducationStore, FirebaseService, LanguageService, AiClient, createStudioSession } from '@core';
import { StudioSessionBannerComponent } from '@shared';

interface PhotoSolveResult {
  extractedText: string;
  grade: string;
  subject: string;
  solutionText: string;
  parentGuide: string;
  checkQuestion?: string;
}

const SOLVE_COUNT_KEY = 'madrasati_solve_count';

/** Last photo and its solution, kept on this device so a reload or a return brings them back. */
interface SolveDraft {
  photo: string;
  mimeType: string;
  result: PhotoSolveResult | null;
}

@Component({
  selector: 'app-solve-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, StudioSessionBannerComponent],
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

  private lastPhoto: { photo: string; mimeType: string } | null = null;

  readonly session = createStudioSession<SolveDraft>('solve', {
    restore: (d) => this.restore(d),
    retry: () => this.retry(),
  });

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
    if (this.session.busy()) return;
    let base64Data: string;
    try {
      base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('read error'));
        reader.readAsDataURL(file);
      });
    } catch (err) {
      console.error('photo-solve read error:', err);
      this.state.set('error');
      return;
    }
    await this.solve(base64Data, file.type);
  }

  private async solve(photo: string, mimeType: string) {
    this.lastPhoto = { photo, mimeType };
    this.previewUrl.set(photo);
    this.result.set(null);
    this.errorMessage.set('');
    this.state.set('analyzing');
    this.session.saveDraft({ photo, mimeType, result: null }, { dirty: false });

    const res = await this.session.run((signal) =>
      this.ai.post('photo-solve', { photoBase64: photo, mimeType }, { fallbackError: '', signal }),
    );
    if (!res) {
      this.state.set('idle');
      return;
    }
    const sol = res.ok ? (res.data['solution'] as PhotoSolveResult | undefined) : undefined;
    if (sol) {
      this.result.set(sol);
      this.state.set('done');
      this.session.saveDraft({ photo, mimeType, result: sol }, { dirty: false });
      this.session.succeed({ scrollTo: 'solve-result' });
      this.bumpSolveCount();
    } else {
      this.errorMessage.set(res.ok ? '' : res.error);
      this.session.fail(res.ok ? this.lang.t('solveErrorHint') : res.error || this.lang.t('solveErrorHint'));
      this.state.set('error');
    }
  }

  private retry() {
    const last = this.lastPhoto ?? this.session.draft();
    if (!last) return;
    this.session.dismissDraft();
    void this.solve(last.photo, last.mimeType);
  }

  private restore(d: SolveDraft) {
    this.lastPhoto = { photo: d.photo, mimeType: d.mimeType };
    this.previewUrl.set(d.photo);
    this.result.set(d.result);
    this.state.set(d.result ? 'done' : 'error');
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
    void this.session.clearDraft();
    this.session.clearError();
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
