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

  transform(value?: number | string | null): string {
    if (!value) return '';
    let ts: number;
    if (typeof value === 'number') {
      ts = value;
    } else {
      const parsed = Date.parse(value);
      if (!Number.isNaN(parsed)) {
        ts = parsed;
      } else {
        const num = Number(value);
        if (!Number.isNaN(num) && num > 0) {
          ts = num;
        } else {
          return String(value);
        }
      }
    }
    const now = Date.now();
    const diff = Math.max(0, now - ts);

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
  return () => undefined;
}
