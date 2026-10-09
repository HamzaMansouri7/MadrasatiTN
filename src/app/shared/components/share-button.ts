import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService } from '@core';

export type ShareVariant = 'button' | 'icon' | 'pill' | 'menu';
export type ShareAccent = 'green' | 'blue' | 'amber' | 'neutral';

@Component({
  selector: 'app-share-button',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Keeps card-level click handlers from firing when the share menu is used. -->
    <div class="relative inline-block text-left" role="presentation" (click)="$event.stopPropagation()" (keydown)="$event.stopPropagation()">
      @switch (variant()) {
        @case ('icon') {
          <button
            type="button"
            (click)="toggleMenu()"
            [class]="iconBtnClass()"
            [attr.aria-label]="label()"
            [title]="copied() ? lang.tr('Lien copié !', 'تم نسخ الرابط!') : label()">
            <span class="material-icons text-[18px]">{{ copied() ? 'check' : 'share' }}</span>
          </button>
        }

        @case ('pill') {
          <button
            type="button"
            (click)="toggleMenu()"
            [class]="pillBtnClass()"
            [attr.aria-label]="label()">
            <span class="material-icons text-[14px]">{{ copied() ? 'check' : 'share' }}</span>
            <span>{{ copied() ? lang.tr('Copié !', 'تم النسخ!') : label() }}</span>
          </button>
        }

        @default {
          <button
            type="button"
            (click)="toggleMenu()"
            [class]="standardBtnClass()"
            [attr.aria-label]="label()">
            <span class="material-icons text-sm">{{ copied() ? 'check' : 'share' }}</span>
            <span>{{ copied() ? lang.tr('Lien copié !', 'تم نسخ الرابط!') : label() }}</span>
          </button>
        }
      }

      <!-- Popover Menu with Options (Facebook, WhatsApp, Copy Link, Native Share) -->
      @if (menuOpen()) {
        <div
          class="absolute z-50 bottom-full mb-2 ltr:left-0 rtl:right-0 w-48 bg-white rounded-xl shadow-xl border border-[#E7DFCF] p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150">
          
          <!-- Native Share Sheet (Mobile / Desktop supported) -->
          @if (canNativeShare()) {
            <button
              type="button"
              (click)="onNativeShare()"
              class="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#14251D] hover:bg-[#F2ECDE] rounded-lg transition-colors cursor-pointer text-left rtl:text-right">
              <span class="material-icons text-sm text-[#2D6A4F]">ios_share</span>
              <span>{{ lang.tr('Partager (Système)', 'مشاركة عبر النظام') }}</span>
            </button>
          }

          <!-- WhatsApp Share -->
          <button
            type="button"
            (click)="onWhatsAppShare()"
            class="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#14251D] hover:bg-[#25D366]/10 hover:text-[#128C7E] rounded-lg transition-colors cursor-pointer text-left rtl:text-right">
            <span class="material-icons text-sm text-[#25D366]">chat</span>
            <span>WhatsApp</span>
          </button>

          <!-- Facebook Share -->
          <button
            type="button"
            (click)="onFacebookShare()"
            class="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#14251D] hover:bg-[#1877F2]/10 hover:text-[#1877F2] rounded-lg transition-colors cursor-pointer text-left rtl:text-right">
            <span class="material-icons text-sm text-[#1877F2]">public</span>
            <span>Facebook</span>
          </button>

          <!-- Copy Public Link -->
          <button
            type="button"
            (click)="onCopyLink()"
            class="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#14251D] hover:bg-[#F2ECDE] rounded-lg transition-colors cursor-pointer text-left rtl:text-right">
            <span class="material-icons text-sm text-[#6B7A70]">{{ copied() ? 'check' : 'link' }}</span>
            <span>{{ copied() ? lang.tr('Lien copié ✓', 'تم النسخ ✓') : lang.tr('Copier le lien', 'نسخ الرابط') }}</span>
          </button>
        </div>

        <!-- Backdrop overlay to dismiss popover -->
        <button
          type="button"
          tabindex="-1"
          [attr.aria-label]="lang.tr('Fermer', 'إغلاق')"
          class="fixed inset-0 z-40 cursor-default"
          (click)="menuOpen.set(false)"></button>
      }
    </div>
  `,
})
export class ShareButtonComponent {
  readonly lang = inject(LanguageService);

  readonly url = input.required<string>();
  readonly title = input<string>('Madrasati TN');
  readonly text = input<string>('');
  readonly variant = input<ShareVariant>('button');
  readonly accent = input<ShareAccent>('green');
  readonly customLabel = input<string>('');

  readonly menuOpen = signal(false);
  readonly copied = signal(false);

  readonly canNativeShare = computed(() => {
    return typeof navigator !== 'undefined' && !!navigator.share;
  });

  readonly label = computed(() => {
    if (this.customLabel()) return this.customLabel();
    return this.lang.tr('Partager', 'مشاركة');
  });

  protected readonly standardBtnClass = computed(() => {
    const base = 'font-semibold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2';
    switch (this.accent()) {
      case 'blue':
        return `${base} bg-[#007CC2] hover:bg-[#006EAD] text-white focus-visible:outline-[#007CC2]`;
      case 'amber':
        return `${base} bg-[#8A5A00] hover:bg-[#6D4700] text-white focus-visible:outline-[#8A5A00]`;
      case 'neutral':
        return `${base} bg-[#FBF8F1] hover:bg-[#F2ECDE] text-[#4A5A50] border border-[#E7DFCF]`;
      case 'green':
      default:
        return `${base} bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] focus-visible:outline-[#2D6A4F]`;
    }
  });

  protected readonly pillBtnClass = computed(() => {
    const base = 'px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer border';
    switch (this.accent()) {
      case 'blue':
        return `${base} bg-[#007CC2]/10 text-[#007CC2] border-[#007CC2]/20 hover:bg-[#007CC2]/20`;
      case 'amber':
        return `${base} bg-[#8A5A00]/10 text-[#8A5A00] border-[#8A5A00]/20 hover:bg-[#8A5A00]/20`;
      case 'neutral':
        return `${base} bg-[#FBF8F1] text-[#4A5A50] border-[#E7DFCF] hover:bg-[#F2ECDE]`;
      case 'green':
      default:
        return `${base} bg-[#2D6A4F]/10 text-[#2D6A4F] border-[#2D6A4F]/20 hover:bg-[#2D6A4F]/20`;
    }
  });

  protected readonly iconBtnClass = computed(() => {
    const base = 'w-8 h-8 shrink-0 rounded-lg border flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2';
    if (this.copied()) {
      return `${base} bg-[#2D6A4F] text-[#FBF8F1] border-[#2D6A4F]`;
    }
    return `${base} bg-[#FBF8F1] hover:bg-[#F2ECDE] text-[#4A5A50] border-[#E7DFCF] focus-visible:outline-[#2D6A4F]`;
  });

  getResolvedUrl(): string {
    const raw = this.url();
    if (!raw) return typeof window !== 'undefined' ? window.location.href : 'https://madrastihub.com';
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${raw.startsWith('/') ? '' : '/'}${raw}`;
    }
    return `https://madrastihub.com${raw.startsWith('/') ? '' : '/'}${raw}`;
  }

  toggleMenu() {
    // If native share is available and user clicked a compact icon/button on mobile, prioritize native share sheet directly
    if (this.canNativeShare() && (this.variant() === 'icon' || this.variant() === 'pill')) {
      void this.onNativeShare();
      return;
    }
    this.menuOpen.update((v) => !v);
  }

  async onNativeShare() {
    this.menuOpen.set(false);
    const resolvedUrl = this.getResolvedUrl();
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: this.title(),
          text: this.text() || this.title(),
          url: resolvedUrl,
        });
        return;
      }
    } catch {
      // User cancelled share dialog
    }
    await this.onCopyLink();
  }

  onFacebookShare() {
    this.menuOpen.set(false);
    const resolvedUrl = this.getResolvedUrl();
    if (typeof window !== 'undefined') {
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(resolvedUrl)}`,
        '_blank',
        'noopener,width=680,height=640',
      );
    }
  }

  onWhatsAppShare() {
    this.menuOpen.set(false);
    const resolvedUrl = this.getResolvedUrl();
    const msg = `${this.title()}\n${resolvedUrl}`;
    if (typeof window !== 'undefined') {
      window.open(
        `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`,
        '_blank',
        'noopener',
      );
    }
  }

  async onCopyLink() {
    this.menuOpen.set(false);
    const resolvedUrl = this.getResolvedUrl();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(resolvedUrl);
        this.copied.set(true);
        setTimeout(() => this.copied.set(false), 2500);
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
      }
    }
  }
}
