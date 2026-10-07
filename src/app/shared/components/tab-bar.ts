import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

export type TabAccent = 'blue' | 'green' | 'library';

export interface TabItem<T extends string = string> {
  key: T;
  label: string;
  icon?: string;
  count?: number;
}

/**
 * Reusable presentational tab bar for workspace category switching.
 * Supports 2-way binding via [(active)]="tab".
 */
@Component({
  selector: 'app-tab-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="border-b px-6 pt-3 flex flex-wrap items-center justify-between gap-4" [class]="containerClass()">
      <div class="flex flex-wrap gap-2">
        @for (tab of tabs(); track tab.key) {
          <button
            type="button"
            (click)="selectTab(tab.key)"
            [class]="active() === tab.key ? activeClass() : inactiveClass()"
            class="px-4 py-3 border-b-2 text-xs flex items-center gap-2 transition-all cursor-pointer rounded-t-lg">
            @if (tab.icon) {
              <span class="material-icons text-base">{{ tab.icon }}</span>
            }
            <span>{{ tab.label }}</span>
            @if (tab.count !== undefined) {
              <span class="opacity-80">({{ tab.count }})</span>
            }
          </button>
        }
      </div>
      <ng-content select="[tabEnd]" />
    </div>
  `,
})
export class TabBarComponent<T extends string = string> {
  readonly tabs = input.required<TabItem<T>[]>();
  readonly active = model.required<T>();
  readonly accent = input<TabAccent>('blue');

  selectTab(key: T) {
    if (this.active() !== key) {
      this.active.set(key);
    }
  }

  containerClass(): string {
    switch (this.accent()) {
      case 'green':
      case 'library':
        return 'border-[#E7DFCF] bg-[#FBF8F1]';
      default:
        return 'border-[#E3ECF2] bg-[#F7F9FB]';
    }
  }

  activeClass(): string {
    switch (this.accent()) {
      case 'green':
        return 'border-[#2D6A4F] text-[#2D6A4F] bg-white font-semibold shadow-xs';
      case 'library':
        return 'border-[#14251D] text-[#14251D] bg-white font-semibold shadow-xs';
      default:
        return 'border-[#007CC2] text-[#007CC2] bg-white font-semibold shadow-xs';
    }
  }

  inactiveClass(): string {
    switch (this.accent()) {
      case 'green':
        return 'border-transparent text-[#5B6B60] font-medium hover:text-[#2D6A4F]';
      case 'library':
        return 'border-transparent text-[#5B6B60] font-medium hover:text-[#14251D]';
      default:
        return 'border-transparent text-[#486581] font-medium hover:text-[#007CC2]';
    }
  }
}
