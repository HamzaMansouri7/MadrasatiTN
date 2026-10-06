import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const PALETTE = [
  '#0B2947', // Deep Navy
  '#2D6A4F', // Forest Green
  '#007CC2', // Tunisian Sky Blue
  '#8A5A00', // Ochre Amber
  '#742A2A', // Brick Red
  '#486581', // Slate Blue
  '#1B4332', // Deep Cypress
  '#005F96', // Cobalt
];

@Component({
  selector: 'app-user-avatar, app-teacher-avatar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (displayUrl(); as src) {
      <img
        [src]="src"
        [alt]="name() || 'Avatar'"
        loading="lazy"
        [width]="pixelDimension()"
        [height]="pixelDimension()"
        (error)="onImgError()"
        [class]="sizeClasses() + ' ' + customClass()"
        class="rounded-full object-cover shrink-0 border border-[#CBD9E2]/60 shadow-2xs" />
    } @else {
      <div
        [style.backgroundColor]="bgColor()"
        [style.width.px]="pixelDimension()"
        [style.height.px]="pixelDimension()"
        [class]="sizeClasses() + ' ' + customClass()"
        class="rounded-full flex items-center justify-center font-bold text-white uppercase tracking-tight shrink-0 shadow-2xs select-none">
        <span [class]="textSizeClass()">{{ initials() }}</span>
      </div>
    }
  `,
})
export class TeacherAvatarComponent {
  readonly name = input<string | null | undefined>('');
  readonly avatarUrl = input<string | null | undefined>('');
  readonly avatarId = input<string | null | undefined>('');
  readonly gender = input<'female' | 'male' | 'other' | null | undefined>(null);
  readonly size = input<AvatarSize>('md');
  readonly customClass = input<string>('');

  /** Set when the user's own photo failed to load → use the illustrated fallback. */
  readonly photoFailed = signal<boolean>(false);
  /** Set when the illustrated fallback also failed → use the initials badge. */
  readonly fallbackFailed = signal<boolean>(false);

  /** The user's own photo (e.g. Google). Legacy Unsplash stock placeholders do not count. */
  private readonly ownPhotoUrl = computed(() => {
    const url = this.avatarUrl();
    return url && !url.includes('images.unsplash.com') ? url : null;
  });

  readonly fallbackUrl = computed(() => {
    const id = this.avatarId();
    if (id) {
      if (id === 'teacher-female' || id === 'female') return '/assets/avatars/teacher-female.webp';
      if (id === 'teacher-male' || id === 'male') return '/assets/avatars/teacher-male.webp';
      return `/assets/avatars/${id}.svg`;
    }

    const g = this.gender();
    if (g === 'female') return '/assets/avatars/teacher-female.webp';
    if (g === 'male') return '/assets/avatars/teacher-male.webp';

    return null;
  });

  readonly displayUrl = computed(() => {
    const own = this.ownPhotoUrl();
    if (own && !this.photoFailed()) return own;
    return this.fallbackFailed() ? null : this.fallbackUrl();
  });

  onImgError() {
    if (this.ownPhotoUrl() && !this.photoFailed()) this.photoFailed.set(true);
    else this.fallbackFailed.set(true);
  }

  readonly initials = computed(() => {
    const raw = (this.name() || '').trim();
    if (!raw) return 'TN';
    const parts = raw.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return raw.slice(0, 2).toUpperCase();
  });

  readonly bgColor = computed(() => {
    const raw = this.name() || 'Madrasati';
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = raw.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % PALETTE.length;
    return PALETTE[idx];
  });

  readonly pixelDimension = computed(() => {
    switch (this.size()) {
      case 'xs': return 24;
      case 'sm': return 32;
      case 'md': return 40;
      case 'lg': return 56;
      case 'xl': return 80;
      case '2xl': return 112;
      default: return 40;
    }
  });

  readonly sizeClasses = computed(() => {
    switch (this.size()) {
      case 'xs': return 'w-6 h-6';
      case 'sm': return 'w-8 h-8';
      case 'md': return 'w-10 h-10';
      case 'lg': return 'w-14 h-14';
      case 'xl': return 'w-20 h-20';
      case '2xl': return 'w-28 h-28';
      default: return 'w-10 h-10';
    }
  });

  readonly textSizeClass = computed(() => {
    switch (this.size()) {
      case 'xs': return 'text-[10px]';
      case 'sm': return 'text-xs';
      case 'md': return 'text-sm';
      case 'lg': return 'text-lg';
      case 'xl': return 'text-2xl';
      case '2xl': return 'text-4xl';
      default: return 'text-sm';
    }
  });
}

export const UserAvatarComponent = TeacherAvatarComponent;
