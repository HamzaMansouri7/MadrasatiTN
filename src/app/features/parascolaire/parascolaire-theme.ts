import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LanguageService } from '@core';
import { ShareButtonComponent } from '@shared';
import { ParascolaireService } from './parascolaire.service';
import { bookTitle, findBook, findTheme, mediaUrl, neighbours, subjectColor, subjectLabel, themeTitle } from './parascolaire.logic';
import { SlotRowComponent } from './ui/slot-row';
import { ViewerDialogComponent, ViewerImage } from './ui/viewer-dialog';

@Component({
  selector: 'app-parascolaire-theme',
  standalone: true,
  imports: [RouterLink, SlotRowComponent, ViewerDialogComponent, ShareButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="parascolaire bg-[var(--p-page)] -mx-3 sm:-mx-6 lg:-mx-8 xl:-mx-10 -mt-6 -mb-[4.5rem] px-3 sm:px-6 lg:px-8 xl:px-10 pt-6 pb-[4.5rem] min-h-[72vh]">
      <div class="max-w-[1280px] mx-auto space-y-6">
        <a
          [routerLink]="bookLink()"
          class="inline-flex items-center gap-1 min-h-[44px] text-[0.9375rem] text-[var(--p-blue)] hover:underline underline-offset-4">
          <span class="material-icons text-[1.125rem] rtl:rotate-180" aria-hidden="true">arrow_back</span>
          {{ bookName() || lang.tr('Parascolaire', 'الدعم المدرسي') }}
        </a>

        @switch (svc.state()) {
          @case ('error') {
            <div class="p-lined border border-[var(--p-rule)] rounded-[8px] p-8 space-y-4" role="alert">
              <p class="p-display text-[1.25rem] text-[var(--p-err)]">{{ lang.tr('Le catalogue est indisponible.', 'الفهرس غير متاح حاليًا.') }}</p>
              <button type="button" class="p-btn p-btn-primary" (click)="svc.load(true)">{{ lang.tr('Réessayer', 'إعادة المحاولة') }}</button>
            </div>
          }
          @case ('ready') {
            @if (theme(); as t) {
              <header class="space-y-2">
                <p class="flex items-center gap-2 text-[0.9375rem] text-[var(--p-pencil)]">
                  <span class="w-2.5 h-2.5 rounded-full shrink-0" [style.background]="color()" aria-hidden="true"></span>
                  <span>{{ subjectName() }}</span>
                </p>
                <h1 class="p-display text-[1.75rem] sm:text-[2.5rem] leading-[1.15] max-w-[32ch]">{{ themeName() }}</h1>
                <p class="text-[0.9375rem] text-[var(--p-pencil)]">{{ lang.tr(t.exerciseCount + ' exercices dans le livre', t.exerciseCount + ' تمرينًا في الكتاب') }}</p>
                <div class="pt-2">
                  <app-share-button
                    [url]="shareUrl()"
                    [title]="themeName()"
                    [text]="themeName()"
                    [details]="shareDetails()"
                    variant="button"
                    accent="blue"
                    placement="down"
                    [customLabel]="lang.tr('Partager ce thème', 'مشاركة هذا الموضوع')" />
                </div>
              </header>

              <div class="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-start">
                <!-- Infographic -->
                <section class="bg-[var(--p-surface)] border border-[var(--p-rule)] rounded-[8px] p-5 space-y-4" aria-labelledby="p-ig">
                  <h2 id="p-ig" class="p-display text-[1.25rem]">{{ lang.tr('Infographie', 'إنفوغرافيك') }}</h2>
                  @if (t.slots.infographic.status === 'ready') {
                    <button type="button" class="block w-full bg-[var(--p-sunk)] rounded-[4px] p-2 cursor-zoom-in" (click)="openInfographic()" [attr.aria-label]="lang.tr('Ouvrir en grand', 'فتح بحجم كبير')">
                      <img
                        [src]="igFull()"
                        [alt]="igAlt()"
                        class="mx-auto max-h-[70vh] w-auto max-w-full object-contain rounded-[4px]"
                        decoding="async" />
                    </button>
                    <div class="flex flex-wrap gap-3">
                      <button type="button" class="p-btn p-btn-primary" (click)="openInfographic()">{{ lang.tr('Ouvrir en grand', 'فتح بحجم كبير') }}</button>
                      <a class="p-btn p-btn-secondary" [href]="igFull()" [attr.download]="t.id + '.webp'">{{ lang.tr("Télécharger l'image", 'تنزيل الصورة') }}</a>
                    </div>
                  } @else {
                    <div class="border border-[var(--p-rule)] rounded-[8px] overflow-hidden">
                      <div class="bg-[var(--p-surface)] p-4"><app-p-slot-row kind="infographic" [status]="t.slots.infographic.status" /></div>
                      <div class="p-lined h-12 border-t border-[var(--p-rule)]" aria-hidden="true"></div>
                    </div>
                  }
                </section>

                <div class="space-y-4">
                  <!-- Course -->
                  <section class="bg-[var(--p-surface)] border border-[var(--p-rule)] rounded-[8px] p-5 space-y-4" aria-labelledby="p-cs">
                    <h2 id="p-cs" class="p-display text-[1.25rem]">{{ lang.tr('Cours en diaporama', 'الدرس في شرائح') }}</h2>
                    @if (t.slots.course.status === 'ready') {
                      <button type="button" class="block w-full bg-[var(--p-sunk)] rounded-[4px] p-2 cursor-pointer" (click)="openCourse()" [attr.aria-label]="lang.tr('Lire le cours', 'قراءة الدرس')">
                        <img [src]="courseThumb()" [alt]="courseAlt()" class="mx-auto w-full object-contain rounded-[4px]" loading="lazy" decoding="async" />
                      </button>
                      <p class="text-[0.9375rem] text-[var(--p-pencil)]">{{ lang.tr(pageCount() + ' diapositives', pageCount() + ' شرائح') }}</p>
                      <div class="flex flex-wrap gap-3">
                        <button type="button" class="p-btn p-btn-primary" (click)="openCourse()">{{ lang.tr('Lire le cours', 'قراءة الدرس') }}</button>
                        <a class="p-btn p-btn-secondary" [href]="pdfUrl()" [attr.download]="t.id + '.pdf'">{{ lang.tr('Télécharger le PDF', 'تنزيل PDF') }}</a>
                      </div>
                    } @else {
                      <div class="border border-[var(--p-rule)] rounded-[8px] overflow-hidden"><div class="bg-[var(--p-surface)] p-4"><app-p-slot-row kind="course" [status]="t.slots.course.status" /></div><div class="p-lined h-12 border-t border-[var(--p-rule)]" aria-hidden="true"></div></div>
                    }
                  </section>

                  <!-- Video -->
                  <section class="bg-[var(--p-surface)] border border-[var(--p-rule)] rounded-[8px] p-5 space-y-4" aria-labelledby="p-vd">
                    <h2 id="p-vd" class="p-display text-[1.25rem]">{{ lang.tr('Vidéo', 'فيديو') }}</h2>
                    @if (t.slots.video.status === 'ready') {
                      <video class="w-full rounded-[4px] bg-black" controls preload="metadata" [src]="videoUrl()"></video>
                    } @else {
                      <div class="border border-[var(--p-rule)] rounded-[8px] overflow-hidden"><div class="bg-[var(--p-surface)] p-4"><app-p-slot-row kind="video" [status]="t.slots.video.status" /></div><div class="p-lined h-12 border-t border-[var(--p-rule)]" aria-hidden="true"></div></div>
                    }
                  </section>
                </div>
              </div>

              <nav class="flex flex-wrap justify-between gap-3 pt-2" [attr.aria-label]="lang.tr('Thèmes du livre', 'مواضيع الكتاب')">
                @if (near().prev; as p) {
                  <a class="p-btn p-btn-secondary" [routerLink]="themeLink(p.id)">{{ lang.tr('Thème précédent', 'الموضوع السابق') }}</a>
                } @else {
                  <span></span>
                }
                @if (near().next; as n) {
                  <a class="p-btn p-btn-secondary" [routerLink]="themeLink(n.id)">{{ lang.tr('Thème suivant', 'الموضوع التالي') }}</a>
                }
              </nav>
            } @else {
              <div class="p-lined border border-[var(--p-rule)] rounded-[8px] p-8 space-y-4">
                <p class="p-display text-[1.25rem]">{{ lang.tr('Ressource introuvable', 'المورد غير موجود') }}</p>
                <a class="p-btn p-btn-primary" [routerLink]="bookLink()">{{ lang.tr('Retour au livre', 'العودة إلى الكتاب') }}</a>
              </div>
            }
          }
          @default {
            <div class="space-y-4" aria-busy="true">
              <div class="p-skeleton h-[44px] max-w-[520px]"></div>
              <div class="p-skeleton h-[360px]"></div>
            </div>
          }
        }
      </div>

      <app-p-viewer [(open)]="viewerOpen" [(index)]="viewerIndex" [images]="viewerImages()" [label]="viewerLabel()" />
    </div>
  `,
})
export class ParascolaireThemeComponent {
  readonly lang = inject(LanguageService);
  readonly svc = inject(ParascolaireService);
  private readonly route = inject(ActivatedRoute);
  private readonly params = toSignal(this.route.paramMap, { initialValue: this.route.snapshot.paramMap });

  readonly viewerOpen = signal(false);
  readonly viewerIndex = signal(0);
  readonly viewerImages = signal<ViewerImage[]>([]);
  readonly viewerLabel = signal('');

  readonly classe = computed(() => this.params().get('classe') ?? '');
  readonly livre = computed(() => this.params().get('livre') ?? '');
  readonly themeId = computed(() => this.params().get('theme') ?? '');
  readonly book = computed(() => findBook(this.svc.catalog(), this.classe(), this.livre()));
  readonly theme = computed(() => findTheme(this.book(), this.themeId()));
  readonly near = computed(() => neighbours(this.book(), this.themeId()));
  readonly bookLink = computed(() => ['/parascolaire', this.classe(), this.livre()]);
  readonly themeName = computed(() => themeTitle(this.theme(), this.lang.isArabic()));
  readonly bookName = computed(() => bookTitle(this.book(), this.lang.isArabic()));
  readonly shareUrl = computed(() => `/parascolaire/${this.classe()}/${this.livre()}/${this.themeId()}`);
  readonly shareDetails = computed(() => [this.bookName(), this.subjectName()]);

  readonly color = computed(() => subjectColor(this.theme()?.subject ?? ''));
  readonly subjectName = computed(() => subjectLabel(this.theme()?.subject ?? '', this.lang.isArabic()));
  readonly igFull = computed(() => mediaUrl(this.theme()?.slots.infographic.full));
  readonly igAlt = computed(() => this.lang.tr('Infographie : ', 'إنفوغرافيك: ') + this.themeName());
  readonly courseThumb = computed(() => mediaUrl(this.theme()?.slots.course.thumb));
  readonly courseAlt = computed(() => this.lang.tr('Cours : ', 'الدرس: ') + this.themeName());
  readonly pdfUrl = computed(() => mediaUrl(this.theme()?.slots.course.pdf));
  readonly videoUrl = computed(() => mediaUrl(this.theme()?.slots.video.file));
  readonly pageCount = computed(() => this.theme()?.slots.course.pages?.length ?? 0);

  constructor() {
    void this.svc.load();
  }

  themeLink(id: string): string[] {
    return ['/parascolaire', this.classe(), this.livre(), id];
  }

  openInfographic(): void {
    this.viewerImages.set([{ src: this.igFull(), alt: this.igAlt() }]);
    this.viewerLabel.set(this.igAlt());
    this.viewerIndex.set(0);
    this.viewerOpen.set(true);
  }

  openCourse(): void {
    const t = this.theme();
    const pages = t?.slots.course.pages ?? [];
    this.viewerImages.set(
      pages.map((p, i) => ({ src: mediaUrl(p), alt: this.courseAlt() + ' ' + (i + 1) + '/' + pages.length })),
    );
    this.viewerLabel.set(this.courseAlt());
    this.viewerIndex.set(0);
    this.viewerOpen.set(true);
  }
}
