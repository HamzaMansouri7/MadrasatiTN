import { Injectable, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';

export interface SeoConfig {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogUrl?: string;
  author?: string;
  lang?: 'ar' | 'fr';
  jsonLd?: Record<string, any>;
}

@Injectable({
  providedIn: 'root',
})
export class SeoService {
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly document = inject(DOCUMENT);

  private jsonLdScriptEl?: HTMLScriptElement;

  updateSeo(config: SeoConfig) {
    const defaultTitle = 'Madrasati TN (مدرستي تونس) — المنصة التعليمية للمرحلة الابتدائية بتونس';
    const defaultDesc = 'منصة مدرستي تونس : امتحانات، دروس، تمارين وإصلاحات نموذجية من السنة الأولى إلى السنة السادسة ابتدائي وفق البرنامج الرسمي التونسي.';
    const defaultKeywords = 'امتحانات تونس, تمارين ابتدائي, كتب التقييم, 6eme annee, 1ere annee, devoirs tunisie, cnp books, madrasati tn';
    const baseUrl = 'https://madrastihub.com';

    const title = config.title ? `${config.title} | Madrasati TN` : defaultTitle;
    const desc = config.description || defaultDesc;
    const keywords = config.keywords || defaultKeywords;
    const ogImage = config.ogImage || `${baseUrl}/assets/og-preview.png`;
    const ogUrl = config.ogUrl || (typeof window !== 'undefined' ? window.location.href : baseUrl);

    // Title
    this.titleService.setTitle(title);

    // Meta tags
    this.metaService.updateTag({ name: 'description', content: desc });
    this.metaService.updateTag({ name: 'keywords', content: keywords });
    this.metaService.updateTag({ name: 'author', content: config.author || 'Madrasati TN Team' });

    // OpenGraph Tags
    this.metaService.updateTag({ property: 'og:title', content: title });
    this.metaService.updateTag({ property: 'og:description', content: desc });
    this.metaService.updateTag({ property: 'og:image', content: ogImage });
    this.metaService.updateTag({ property: 'og:url', content: ogUrl });
    this.metaService.updateTag({ property: 'og:type', content: 'article' });
    this.metaService.updateTag({ property: 'og:site_name', content: 'Madrasati TN' });

    // Twitter Card Tags
    this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.metaService.updateTag({ name: 'twitter:title', content: title });
    this.metaService.updateTag({ name: 'twitter:description', content: desc });
    this.metaService.updateTag({ name: 'twitter:image', content: ogImage });

    // Inject JSON-LD Schema.org if provided
    if (config.jsonLd) {
      this.setJsonLd(config.jsonLd);
    }
  }

  setJsonLd(schemaData: Record<string, any>) {
    if (typeof window === 'undefined' || !this.document) return;

    if (!this.jsonLdScriptEl) {
      this.jsonLdScriptEl = this.document.createElement('script');
      this.jsonLdScriptEl.setAttribute('type', 'application/ld+json');
      this.document.head.appendChild(this.jsonLdScriptEl);
    }

    this.jsonLdScriptEl.textContent = JSON.stringify(schemaData);
  }
}
