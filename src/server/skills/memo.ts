import { Skill } from './types';
import { MEMO_SCHEMA } from '../memo-schema';

export interface MemoSkillInput {
  grade?: string;
  subject?: string;
  topic?: string;
  mode?: string;
  instructions?: string;
  blockToRegenerate?: string;
  extractedText?: string;
}

export const memoSkill: Skill<MemoSkillInput> = {
  id: 'memo-s8',
  version: '1.0.0',
  chain: 'A',
  temperature: 0.3,
  schema: MEMO_SCHEMA,
  build: (input) => {
    const parts: string[] = [
      `MISSION FICHE MÉMO (S8) : Conçois une fiche mémo visuelle structurée conforme au modèle "Ma fiche mémo".`,
    ];

    const s = (input.subject || '').toLowerCase();
    if (s.includes('math') || s.includes('رياضيات')) {
      parts.push(`ADAPTATION MATHÉMATIQUES :
- "steps" : Méthode pas à pas claire (étapes de calcul ou construction géométrique).
- "cards" : Propriétés mathématiques, définitions ou théorèmes clés.
- "formula" : Règle ou formule mathématique essentielle.
- "example" : Exemple chiffré rigoureux avec détail de résolution.`);
    } else if (s.includes('éveil') || s.includes('science') || s.includes('علمي')) {
      parts.push(`ADAPTATION ÉVEIL SCIENTIFIQUE :
- "steps" : Démarche d'investigation ou cycle naturel (observation ➔ hypothèse ➔ conclusion).
- "cards" : Concepts scientifiques clés avec définitions et illustrations textuelles.
- "remember" : Règles de santé, sécurité ou faits scientifiques fondamentaux.`);
    } else {
      parts.push(`ADAPTATION LINGUISTIQUE (Français / Arabe) :
- "steps" : Règle de grammaire / conjugaison / orthographe découpée pas à pas.
- "cards" : Nature des mots, types de compléments ou catégories grammaticales.
- "example" : Phrase modèle décortiquée avec son analyse syntaxique.`);
    }

    parts.push(`RÈGLES STRICTES DE QUALITÉ :
- "quote" : Uniquement une devise ou un encouragement pédagogique simple (ne pas inventer de faux proverbes).
- "remember" : 2 à 4 points incontournables faciles à mémoriser pour un enfant.`);

    if (input.blockToRegenerate) {
      parts.push(`MISSION SPÉCIFIQUE : Régénère UNIQUEMENT le bloc "${input.blockToRegenerate}".`);
    }

    if (input.instructions) {
      parts.push(`Consignes pédagogiques complémentaires : "${input.instructions}"`);
    }

    return parts.join('\n\n');
  },
};
