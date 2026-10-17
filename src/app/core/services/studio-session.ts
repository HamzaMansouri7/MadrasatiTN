import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { AiClient } from './ai-client';
import { EducationStore } from './education-store';
import { LanguageService } from './language.service';
import { StorageVaultService } from './storage-vault.service';

export type StudioErrorKind = 'quota' | 'offline' | 'busy' | 'timeout' | 'generic';

export interface StudioError {
  kind: StudioErrorKind;
  message: string;
}

export interface StudioFieldCheck {
  /** DOM id of the field, focused when it is the first invalid one. */
  id: string;
  ok: boolean;
  message: string;
}

export interface StudioSessionOptions<D> {
  /** Puts a saved draft back into the tool (the "restore draft" banner). */
  restore?(draft: D): void;
  /** Re-runs the last generation (error and interrupted banners). */
  retry?(): void;
  /** Puts back the result replaced by the last regeneration. */
  undo?(previous: unknown): void;
}

interface StoredSession<D> {
  draft?: D;
  /** True while a generation runs; still true on the next visit means the page was left mid-run. */
  pending?: boolean;
  savedAt?: number;
}

const ABORTED = Symbol('aborted');
const DEFAULT_TIMEOUT_MS = 180_000;
const DRAFT_DEBOUNCE_MS = 600;

/** Live studio sessions, read by the leave guard to know whether work would be lost. */
@Injectable({ providedIn: 'root' })
export class StudioSessionRegistry {
  private readonly sessions = signal<ReadonlySet<StudioSession<unknown>>>(new Set());

  add(s: StudioSession<unknown>) {
    this.sessions.update((set) => new Set(set).add(s));
  }

  remove(s: StudioSession<unknown>) {
    this.sessions.update((set) => {
      const next = new Set(set);
      next.delete(s);
      return next;
    });
  }

  /** Sessions holding unsaved input or a running generation. */
  unsaved(): StudioSession<unknown>[] {
    return [...this.sessions()].filter((s) => s.unsaved());
  }
}

/**
 * Per-tool state shared by the eight creation tools: busy/cancel, error classification,
 * required-field checks, local draft (IndexedDB) with restore, interrupted-run detection,
 * undo of the last regeneration, offline and leave-page warnings.
 * Create it in a field initializer with `createStudioSession(key)`.
 */
export class StudioSession<D = unknown> {
  readonly busy = signal(false);
  readonly error = signal<StudioError | null>(null);
  readonly dirty = signal(false);
  readonly online = signal(true);
  /** Draft found from an earlier visit, offered by the banner until restored or dismissed. */
  readonly draft = signal<D | null>(null);
  /** The previous visit was closed while a generation ran. */
  readonly interrupted = signal(false);
  readonly savedAt = signal<number | null>(null);
  readonly fieldErrors = signal<Record<string, string>>({});
  readonly previous = signal<{ value: unknown } | null>(null);
  readonly startedAt = signal<number | null>(null);
  private readonly reminderDismissed = signal(false);

  readonly unsaved = computed(() => this.busy() || this.dirty());
  readonly canRetry: boolean;
  readonly canRestore: boolean;
  readonly guestReminder = computed(
    () => this.dirty() && !this.busy() && !this.reminderDismissed() && !this.store.isSignedIn(),
  );
  readonly status = computed(() => {
    if (this.busy()) return this.lang.tr('Génération…', 'جارٍ التوليد…');
    if (this.savedAt()) return this.lang.tr('Enregistré', 'محفوظ');
    return '';
  });

  private controller: AbortController | null = null;
  private timedOut = false;
  private draftTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingDraft: D | null = null;
  private readonly storageKey: string;
  private writes: Promise<void> = Promise.resolve();

  constructor(
    readonly key: string,
    private readonly opts: StudioSessionOptions<D>,
    private readonly vault: StorageVaultService,
    private readonly store: EducationStore,
    private readonly lang: LanguageService,
    private readonly ai: AiClient,
  ) {
    this.storageKey = `studio_session_${key}`;
    this.canRetry = !!opts.retry;
    this.canRestore = !!opts.restore;
  }

  /** Browser-only setup: stored state, connectivity and the native leave warning. */
  attach(destroyRef: DestroyRef, registry: StudioSessionRegistry) {
    registry.add(this as StudioSession<unknown>);
    destroyRef.onDestroy(() => this.detach(registry));
    if (typeof window === 'undefined') return;

    this.online.set(typeof navigator === 'undefined' ? true : navigator.onLine);
    window.addEventListener('online', this.onOnline);
    window.addEventListener('offline', this.onOffline);
    window.addEventListener('beforeunload', this.onBeforeUnload);
    void this.load();
  }

  private detach(registry: StudioSessionRegistry) {
    registry.remove(this as StudioSession<unknown>);
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.onOnline);
      window.removeEventListener('offline', this.onOffline);
      window.removeEventListener('beforeunload', this.onBeforeUnload);
    }
    // Leaving mid-run keeps `pending` stored, so the next visit says the run stopped.
    const wasBusy = this.busy();
    this.controller?.abort();
    this.flushDraft(wasBusy);
  }

  private readonly onOnline = () => this.online.set(true);
  private readonly onOffline = () => this.online.set(false);
  private readonly onBeforeUnload = () => {
    this.flushDraft(this.busy());
  };

  private async load() {
    const stored = await this.vault.getAsset<StoredSession<D>>(this.storageKey);
    if (!stored) return;
    if (stored.pending) {
      this.interrupted.set(true);
      void this.vault.saveAsset(this.storageKey, { ...stored, pending: false });
    }
    if (stored.draft !== undefined && stored.draft !== null && this.opts.restore) this.draft.set(stored.draft);
  }

  /**
   * Runs one generation: ignores a second click while busy, refuses when offline, aborts on
   * cancel or timeout (the late result is dropped) and turns failures into a classified error.
   * Resolves `undefined` when nothing usable came back.
   */
  async run<T>(task: (signal: AbortSignal) => Promise<T>, options: { timeoutMs?: number } = {}): Promise<T | undefined> {
    if (this.busy()) return undefined;
    if (!this.online()) {
      this.error.set(this.classify('', 'offline'));
      return undefined;
    }

    const controller = new AbortController();
    this.controller = controller;
    this.timedOut = false;
    this.busy.set(true);
    this.startedAt.set(Date.now());
    this.error.set(null);
    this.interrupted.set(false);
    this.ai.lastFailure = null;
    void this.writeStored({ pending: true });

    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const timer = timeoutMs > 0
      ? setTimeout(() => {
        this.timedOut = true;
        controller.abort();
      }, timeoutMs)
      : null;
    const aborted = new Promise<typeof ABORTED>((resolve) =>
      controller.signal.addEventListener('abort', () => resolve(ABORTED), { once: true }),
    );

    try {
      const result = await Promise.race([task(controller.signal), aborted]);
      if (result === ABORTED) {
        if (this.timedOut) this.error.set(this.classify('', 'timeout'));
        return undefined;
      }
      return result;
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        if (this.timedOut) this.error.set(this.classify('', 'timeout'));
      } else {
        this.fail(err instanceof Error ? err.message : '');
      }
      return undefined;
    } finally {
      if (timer) clearTimeout(timer);
      if (this.controller === controller) this.controller = null;
      this.busy.set(false);
      this.startedAt.set(null);
      void this.writeStored({ pending: false });
    }
  }

  cancel() {
    this.controller?.abort();
  }

  /** Shows a failed generation as one clear message; the input is never touched. */
  fail(message?: string | null) {
    // Store helpers that return an empty result still leave the server's reason on the AI client.
    const last = this.ai.lastFailure;
    const text = message?.trim() || last?.error || '';
    const status = last && (!message || message === last.error) ? last.status : undefined;
    this.error.set(this.classify(status === 429 || status === 503 ? `${text} ${status}` : text));
  }

  clearError() {
    this.error.set(null);
  }

  /** Success: toast, "saved" status and the result scrolled into view. */
  succeed(options: { message?: string; scrollTo?: string } = {}) {
    this.error.set(null);
    this.savedAt.set(Date.now());
    this.store.showToast(options.message ?? this.lang.tr('Terminé', 'تم'), 'success');
    const id = options.scrollTo;
    if (id && typeof document !== 'undefined') {
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    }
  }

  /** Marks missing fields and focuses the first one. Returns true when all pass. */
  validate(checks: StudioFieldCheck[]): boolean {
    const errors: Record<string, string> = {};
    for (const c of checks) if (!c.ok) errors[c.id] = c.message;
    this.fieldErrors.set(errors);
    const first = checks.find((c) => !c.ok);
    if (first && typeof document !== 'undefined') {
      setTimeout(() => document.getElementById(first.id)?.focus(), 0);
    }
    return !first;
  }

  fieldError(id: string): string {
    return this.fieldErrors()[id] ?? '';
  }

  clearFieldError(id: string) {
    if (!this.fieldErrors()[id]) return;
    this.fieldErrors.update((e) => {
      const next = { ...e };
      delete next[id];
      return next;
    });
  }

  markDirty() {
    this.dirty.set(true);
  }

  /** Work is safe (saved to the account or deliberately discarded). */
  markClean() {
    this.dirty.set(false);
  }

  /** Stores the tool's input/result locally (debounced); flags unsaved work unless `dirty: false`. */
  saveDraft(draft: D, options: { dirty?: boolean } = {}) {
    if (options.dirty ?? true) this.dirty.set(true);
    this.pendingDraft = draft;
    if (this.draftTimer) clearTimeout(this.draftTimer);
    this.draftTimer = setTimeout(() => this.flushDraft(this.busy()), DRAFT_DEBOUNCE_MS);
  }

  private flushDraft(pending: boolean) {
    if (this.draftTimer) {
      clearTimeout(this.draftTimer);
      this.draftTimer = null;
    }
    const draft = this.pendingDraft;
    this.pendingDraft = null;
    if (draft === null) {
      if (pending) void this.writeStored({ pending: true });
      return;
    }
    const savedAt = Date.now();
    this.savedAt.set(savedAt);
    void this.writeStored({ draft, pending, savedAt });
  }

  restoreDraft() {
    const d = this.draft();
    this.draft.set(null);
    // The draft stays stored, so restoring it alone is not unsaved work.
    if (d !== null && this.opts.restore) this.opts.restore(d);
  }

  dismissDraft() {
    this.draft.set(null);
  }

  dismissInterrupted() {
    this.interrupted.set(false);
  }

  dismissReminder() {
    this.reminderDismissed.set(true);
  }

  retry() {
    this.error.set(null);
    this.interrupted.set(false);
    this.opts.retry?.();
  }

  /** Forgets the stored draft (new document, or the work was saved to the account). */
  async clearDraft() {
    if (this.draftTimer) clearTimeout(this.draftTimer);
    this.draftTimer = null;
    this.pendingDraft = null;
    this.draft.set(null);
    this.dirty.set(false);
    this.savedAt.set(null);
    this.writes = this.writes.then(() => this.vault.deleteAsset(this.storageKey));
    await this.writes;
  }

  /** Keeps the result a regeneration is about to replace, for the undo button. */
  keepUndo(value: unknown) {
    this.previous.set(value === null || value === undefined ? null : { value });
  }

  undo() {
    const p = this.previous();
    this.previous.set(null);
    if (p && this.opts.undo) this.opts.undo(p.value);
  }

  dismissUndo() {
    this.previous.set(null);
  }

  /** Read-modify-write, chained so a draft save and a pending flag never overwrite each other. */
  private writeStored(patch: StoredSession<D>): Promise<void> {
    this.writes = this.writes.then(async () => {
      const current = (await this.vault.getAsset<StoredSession<D>>(this.storageKey)) ?? {};
      await this.vault.saveAsset(this.storageKey, { ...current, ...patch });
    });
    return this.writes;
  }

  private classify(message: string, forced?: StudioErrorKind): StudioError {
    const offline = typeof navigator !== 'undefined' && !navigator.onLine;
    const kind: StudioErrorKind =
      forced ??
      (offline || /failed to fetch|networkerror|load failed|erreur réseau/i.test(message)
        ? 'offline'
        : /compte gratuit|mode découverte/i.test(message) && !this.store.isSignedIn()
          ? 'quota'
          : /sollicit|indisponible|trop de requêtes|quota|\b(429|502|503|504)\b/i.test(message)
            ? 'busy'
            : /timeout|délai/i.test(message)
              ? 'timeout'
              : 'generic');

    const t = (fr: string, ar: string) => this.lang.tr(fr, ar);
    switch (kind) {
      case 'quota':
        return { kind, message: t('Le quota d’essai du jour est atteint. Créez un compte gratuit pour continuer.', 'انتهت حصة التجربة لهذا اليوم. أنشئ حسابًا مجانيًا للمتابعة.') };
      case 'offline':
        return { kind, message: t('Pas de connexion Internet. Vos saisies sont conservées.', 'لا يوجد اتصال بالإنترنت. ما كتبته محفوظ.') };
      case 'busy':
        return { kind, message: t('Le service IA est très sollicité. Réessayez dans une minute.', 'خدمة الذكاء الاصطناعي مشغولة الآن. أعد المحاولة بعد دقيقة.') };
      case 'timeout':
        return { kind, message: t('La génération a pris trop de temps. Réessayez.', 'استغرق التوليد وقتًا طويلًا. أعد المحاولة.') };
      default:
        return { kind, message: message.replace(/\s\d{3}$/, '').trim() || t('La génération a échoué. Réessayez.', 'تعذّر التوليد. أعد المحاولة.') };
    }
  }
}

/** Creates the tool's session; call from a field initializer (needs an injection context). */
export function createStudioSession<D = unknown>(key: string, opts: StudioSessionOptions<D> = {}): StudioSession<D> {
  const session = new StudioSession<D>(
    key,
    opts,
    inject(StorageVaultService),
    inject(EducationStore),
    inject(LanguageService),
    inject(AiClient),
  );
  session.attach(inject(DestroyRef), inject(StudioSessionRegistry));
  return session;
}
