import { Type } from '@google/genai';
import { Skill } from './types';

export interface ArticleMessage {
  role: 'user' | 'assistant' | string;
  content: string;
}

export interface CurrentArticleData {
  title?: string;
  summary?: string;
  subject?: string;
  grade?: string;
  chapter?: string;
  contentMarkdown?: string;
}

export interface ArticleSkillInput {
  messages?: ArticleMessage[];
  currentArticle?: CurrentArticleData;
  userPrompt?: string;
  language?: string;
  lang?: 'ar' | 'fr';
  chapter?: string;
  isFreeTopic?: boolean;
  tags?: string[];
}

const STR = { type: Type.STRING } as const;
const STR_ARR = { type: Type.ARRAY, items: STR } as const;

export const CHAT_ARTICLE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    replyText: STR,
    updatedArticle: {
      type: Type.OBJECT,
      properties: {
        title: STR,
        summary: STR,
        subject: STR,
        grade: STR,
        contentMarkdown: STR,
      },
      required: ['title', 'summary', 'subject', 'grade', 'contentMarkdown'],
    },
    suggestedChips: STR_ARR,
  },
  required: ['replyText', 'updatedArticle', 'suggestedChips'],
};

export const articleSkill: Skill<ArticleSkillInput> = {
  id: 'article-s9',
  version: '1.0.0',
  chain: 'D',
  temperature: 0.5,
  schema: CHAT_ARTICLE_SCHEMA,
  build: (input) => {
    const cur = input.currentArticle || {};
    // Cap messages to the last 12 turns to prevent context window explosion
    const recentMessages = (input.messages || []).slice(-12);
    const historyStr = recentMessages
      .map((m) => `${m.role === 'user' ? 'Enseignant' : 'Assistant IA'}: ${(m.content || '').slice(0, 1000)}`)
      .join('\n');

    // Cap existing article markdown (max 10,000 characters)
    const existingMarkdown = (cur.contentMarkdown || '').slice(0, 10000);
    const safeUserPrompt = (input.userPrompt || '').slice(0, 2000);
    const tagsStr = (input.tags || []).slice(0, 8).map((t) => `#${t}`).join(', ');

    return [
      `OBJECTIF (S9) : Co-rédaction assistée d'articles pédagogiques et billets de blog pour l'éducation primaire en Tunisie.`,
      input.isFreeTopic
        ? `CADRE DU BILLET : BLOG PÉDAGOGIQUE LIBRE & ORIENTATION ÉDUCATIVE\n- Mots-clés : ${tagsStr || '#نصائح_تربوية, #توجيه_الأولياء'}\n- Public : Parents d'élèves et enseignants tunisiens. Veille à l'absence totale de conseils médicaux, juridiques ou affirmations non étayées.`
        : `CADRE CURRICULAIRE : CNP OFFICIEL\n- Matière : ${cur.subject || 'Général'}\n- Niveau : ${cur.grade || 'Primaire'}\n- Thème : ${input.chapter || cur.chapter || 'Général'}`,
      ``,
      `POLITIQUE DE MODIFICATION (PATCH-STYLE PRESERVATION) :`,
      `- Conserve scrupuleusement les parties déjà rédigées de l'article sauf si l'enseignant demande explicitement leur suppression ou réécriture.`,
      `- Ne vide JAMAIS une section existante par inadvertance.`,
      `- Intègre les nouveaux ajouts harmonieusement avec des titres ##, listes à puces et callouts (> [!TIP] ou > [!NOTE]).`,
      ``,
      `HISTORIQUE DES 12 DERNIERS ÉCHANGES :`,
      historyStr || '(Début de la conversation)',
      ``,
      `DEMANDE ACTUELLE DE L'ENSEIGNANT :`,
      `"${safeUserPrompt}"`,
      ``,
      `ÉTAT COURANT DE L'ARTICLE :`,
      `- Titre : ${cur.title || 'Sans titre'}`,
      `- Résumé : ${cur.summary || ''}`,
      `- Contenu existant :`,
      existingMarkdown || '(Vide)',
    ].join('\n\n');
  },
};
