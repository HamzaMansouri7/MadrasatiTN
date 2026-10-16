import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { InfographicDoc, InfographicSpec, SpecImageTarget } from '@core';

/**
 * Certificate preset (شهادة تقدير وتفوق):
 * Official commemorative diploma layout with ornate borders, official header,
 * recipient name line, commendation reason, teacher signature and gold medal seal.
 */
@Component({
  selector: 'app-preset-certificate',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; }
    .cert-frame {
      background: var(--ig-card);
      border: calc(var(--ig-bw, 2px) + 2px) solid var(--ig-border);
      border-radius: var(--ig-radius, 20px);
      padding: 2.25rem 2rem;
      position: relative;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
      text-align: center;
      overflow: hidden;
    }
    .cert-inner-border {
      position: absolute;
      inset: 8px;
      border: 1px dashed var(--ig-border);
      border-radius: calc(var(--ig-radius, 20px) - 6px);
      pointer-events: none;
      opacity: 0.65;
    }
    .cert-corner-top-left { position: absolute; top: 14px; left: 14px; font-size: 20px; opacity: 0.5; color: var(--ig-a); }
    .cert-corner-top-right { position: absolute; top: 14px; right: 14px; font-size: 20px; opacity: 0.5; color: var(--ig-a); }
    .cert-corner-bottom-left { position: absolute; bottom: 14px; left: 14px; font-size: 20px; opacity: 0.5; color: var(--ig-a); }
    .cert-corner-bottom-right { position: absolute; bottom: 14px; right: 14px; font-size: 20px; opacity: 0.5; color: var(--ig-a); }
    .cert-header {
      font-size: 0.825rem;
      font-weight: 700;
      color: var(--ig-muted);
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin-bottom: 0.5rem;
    }
    .cert-title {
      font-size: clamp(1.75rem, 4vw, 2.5rem);
      font-weight: 900;
      letter-spacing: -0.01em;
      line-height: 1.2;
      color: var(--ig-heading);
      margin-bottom: 1.25rem;
    }
    .cert-recipient-intro {
      font-size: 0.95rem;
      color: var(--ig-muted);
      margin-bottom: 0.35rem;
    }
    .cert-name-line {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--ig-title-color);
      border-bottom: 2px dashed var(--ig-border);
      display: inline-block;
      min-width: 280px;
      padding: 0.25rem 1.5rem;
      margin-bottom: 1rem;
    }
    .cert-reason-box {
      background: var(--ig-hero);
      border: 1px solid var(--ig-border);
      border-radius: var(--ig-radius, 16px);
      padding: 1.25rem 1.5rem;
      max-width: 640px;
      margin: 0 auto 1.75rem;
      font-size: 1rem;
      line-height: 1.6;
      color: var(--ig-ink);
      font-style: italic;
    }
    .cert-seal {
      width: 72px;
      height: 72px;
      border-radius: 999px;
      border: 3px double var(--ig-a);
      background: linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 255, 255, 0.95) 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.06);
      margin: 0 auto;
    }
    .cert-footer-grid {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      gap: 1.5rem;
      margin-top: 1.5rem;
      padding-top: 1.25rem;
      border-top: 1px solid var(--ig-border);
      font-size: 0.85rem;
    }
    @media (max-width: 640px) {
      .cert-footer-grid { grid-template-columns: 1fr; gap: 1rem; }
    }
  `,
  template: `
    @let s = spec();
    @let c = s.certificate;
    @let fr = doc().language === 'fr';

    <article class="cert-frame">
      <div class="cert-inner-border" aria-hidden="true"></div>
      <span class="material-icons cert-corner-top-left" aria-hidden="true">military_tech</span>
      <span class="material-icons cert-corner-top-right" aria-hidden="true">military_tech</span>
      <span class="material-icons cert-corner-bottom-left" aria-hidden="true">military_tech</span>
      <span class="material-icons cert-corner-bottom-right" aria-hidden="true">military_tech</span>

      <header class="cert-header">
        <p>{{ fr ? "République Tunisienne — Ministère de l'Éducation" : 'الجمهورية التونسية — وزارة التربية' }}</p>
        <p class="text-xs font-semibold mt-0.5 opacity-80">{{ doc().author?.school || (fr ? 'École Primaire' : 'المدرسة الابتدائية') }}</p>
      </header>

      <h2 class="cert-title font-display">
        {{ c?.recipientTitle || (fr ? "CERTIFICAT DE MÉRITE ET D'EXCELLENCE" : 'شهادة تقدير وتشجيع') }}
      </h2>

      <p class="cert-recipient-intro">
        {{ fr ? "Cette attestation est décernée avec honneur à l'élève :" : 'تُمنح هذه الشهادة بكل فخر واعتزاز للتلميذ(ة) :' }}
      </p>

      <div class="cert-name-line font-display">
        ......................................................
      </div>

      <p class="text-xs sm:text-sm font-semibold mb-3" style="color: var(--ig-muted)">
        {{ fr ? 'Classe :' : 'القسم :' }}
        <span class="font-bold text-[var(--ig-heading)]">{{ c?.grade || doc().grade }}</span>
        @if (c?.schoolYear || doc().author?.schoolYear) {
          <span class="mx-2">•</span>
          {{ fr ? 'Année scolaire :' : 'السنة الدراسية :' }}
          <span class="font-bold text-[var(--ig-heading)]">{{ c?.schoolYear || doc().author?.schoolYear }}</span>
        }
      </p>

      <div class="cert-reason-box">
        <p>« {{ c?.reason || s.subtitle || (fr ? "Pour son travail exemplaire, sa persévérance et son assiduité remarquable." : "تقديرًا لاجتهاده المتميز، وحسن سلوكه ومواظبته المثالية خلال الفصل الدراسي.") }} »</p>
      </div>

      <footer class="cert-footer-grid">
        <div class="text-start">
          <p class="font-bold text-[var(--ig-heading)]">{{ fr ? "L'Enseignant(e) :" : 'المعلم(ة) :' }}</p>
          <p class="font-medium text-xs mt-1" style="color: var(--ig-muted)">{{ doc().author?.name || '............................' }}</p>
          <p class="text-[11px] mt-2 opacity-60">{{ fr ? 'Signature' : 'التوقيع' }}</p>
        </div>

        <div class="cert-seal">
          <span class="material-icons text-xl" style="color: var(--ig-a)" aria-hidden="true">stars</span>
          <span class="text-[9px] font-bold text-center leading-tight tracking-wider uppercase mt-0.5">
            {{ c?.sealText || (fr ? 'Excellence' : 'امتياز') }}
          </span>
        </div>

        <div class="text-end">
          <p class="font-bold text-[var(--ig-heading)]">{{ fr ? 'Fait le :' : 'بتاريخ :' }}</p>
          <p class="font-medium text-xs mt-1" style="color: var(--ig-muted)">........................</p>
          <p class="text-[11px] mt-2 opacity-60">{{ fr ? 'Cachet' : 'الختم' }}</p>
        </div>
      </footer>
    </article>
  `,
})
export class PresetCertificateComponent {
  readonly spec = input.required<InfographicSpec>();
  readonly doc = input.required<InfographicDoc>();
  readonly accent = input.required<(i: number) => string>();
  readonly illustrating = input<string | null>(null);
  readonly illustrate = output<SpecImageTarget>();
}
