import { TestBed } from '@angular/core/testing';
import { PrintService, buildWatermark, DEFAULT_WATERMARK, escapeHtml } from './print.service';
import { PRIMARY_GRADES, PRIMARY_SUBJECTS } from '../models/education.model';

describe('PrintService & Watermark Engine', () => {
  let service: PrintService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PrintService],
    });
    service = TestBed.inject(PrintService);
  });

  it('instantiates PrintService correctly', () => {
    expect(service).toBeDefined();
    expect(typeof service.printPage).toBe('function');
  });

  describe('buildWatermark', () => {
    it('returns default watermark when called with no arguments or null', () => {
      expect(buildWatermark()).toBe(DEFAULT_WATERMARK);
      expect(buildWatermark(null)).toBe(DEFAULT_WATERMARK);
      expect(buildWatermark('')).toBe(DEFAULT_WATERMARK);
    });

    it('returns custom watermark if provided as a string', () => {
      expect(buildWatermark('Mon Filigrane')).toBe('Mon Filigrane');
    });

    it('prioritizes customWatermark in options object', () => {
      expect(
        buildWatermark({
          customWatermark: 'Mon Filigrane Personnalisé',
          authorName: 'M. Foulen',
          school: 'École Bourguiba',
        })
      ).toBe('Mon Filigrane Personnalisé');
    });

    it('formats author name and school correctly', () => {
      expect(
        buildWatermark({
          authorName: 'M. Foulen',
          school: 'École Bourguiba',
        })
      ).toBe(`${DEFAULT_WATERMARK} — M. Foulen (École Bourguiba)`);
    });

    it('formats author name without school when school is omitted', () => {
      expect(
        buildWatermark({
          authorName: 'M. Foulen',
        })
      ).toBe(`${DEFAULT_WATERMARK} — M. Foulen`);
    });

    it('uses fallback option if provided and no author is specified', () => {
      expect(
        buildWatermark({
          fallback: 'Madrasati TN — Document Certifié — Enseignant Certifié',
        })
      ).toBe('Madrasati TN — Document Certifié — Enseignant Certifié');
    });
  });

  describe('escapeHtml', () => {
    it('escapes special HTML characters', () => {
      expect(escapeHtml('<script>alert("xss") & test\'s</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;) &amp; test&#39;s&lt;/script&gt;'
      );
    });
  });

  describe('Shared Curriculum Constants', () => {
    it('defines 6 official primary grades', () => {
      expect(PRIMARY_GRADES).toHaveLength(6);
      expect(PRIMARY_GRADES[0]).toBe('1ère Année');
      expect(PRIMARY_GRADES[5]).toBe('6ème Année');
    });

    it('defines 6 core primary subjects', () => {
      expect(PRIMARY_SUBJECTS).toHaveLength(6);
      expect(PRIMARY_SUBJECTS).toContain('Mathématiques');
      expect(PRIMARY_SUBJECTS).toContain('Français');
      expect(PRIMARY_SUBJECTS).toContain('اللغة العربية');
    });
  });
});
