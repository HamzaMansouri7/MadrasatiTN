import { Pipe, PipeTransform, inject } from '@angular/core';
import { LanguageService } from '@core';

@InjectableTimeAgo()
@Pipe({
  name: 'timeAgo',
  standalone: true,
  pure: false,
})
export class TimeAgoPipe implements PipeTransform {
  private readonly lang = inject(LanguageService);

  transform(value?: number | null): string {
    if (!value || typeof value !== 'number') return '';
    const now = Date.now();
    const diff = Math.max(0, now - value);

    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diff < minute) {
      return this.lang.t('timeAgoJustNow');
    }
    if (diff < hour) {
      const count = Math.max(1, Math.floor(diff / minute));
      return this.lang.t('timeAgoMin', { count });
    }
    if (diff < day) {
      const count = Math.max(1, Math.floor(diff / hour));
      return this.lang.t('timeAgoHour', { count });
    }
    const days = Math.max(1, Math.floor(diff / day));
    return this.lang.t('timeAgoDay', { count: days });
  }
}

function InjectableTimeAgo(): ClassDecorator {
  return () => {};
}
