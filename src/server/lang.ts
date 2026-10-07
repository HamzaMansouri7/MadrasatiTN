/**
 * Language resolution and strict prompt injection rules for Madrasati TN AI pipelines.
 */

/** Arabic is the primary language in Tunisia — default 'ar' unless caller explicitly specifies 'fr'. */
export const resolveLang = (raw: unknown): 'ar' | 'fr' => (raw === 'fr' ? 'fr' : 'ar');

/** Absolute output-language rule injected into every generative prompt. */
export const langRule = (lang: 'ar' | 'fr'): string =>
  lang === 'ar'
    ? `RÈGLE LINGUISTIQUE ABSOLUE : l'arabe est la langue principale. Rédige TOUS les champs texte (titres, énoncés, consignes, corrections, indices, conseils) en ARABE LITTÉRAIRE scolaire tunisien (العربية الفصحى المدرسية). EXCEPTION : si la matière est le Français, rédige en français ; si c'est l'Anglais, en anglais.`
    : `RÈGLE LINGUISTIQUE ABSOLUE : rédige TOUS les champs texte en FRANÇAIS clair et soigné, conforme au programme tunisien. EXCEPTION : matière Anglais → anglais ; matière اللغة العربية → arabe.`;
