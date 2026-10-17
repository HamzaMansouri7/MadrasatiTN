import { Type } from '@google/genai';
import { Skill } from './types';

/** One turn of the conversation sent by the client (history is client-side; the server is stateless). */
export interface ChatTurn {
  role: 'user' | 'bot';
  text: string;
}

export type ChatRole = 'teacher' | 'parent';

/** The intents the drawer can route. "generate" intents open a Create tool; the rest answer inline. */
export type ChatIntent =
  | 'ask'
  | 'solve'
  | 'exercises'
  | 'memo'
  | 'plan'
  | 'infographic'
  | 'find'
  | 'off_topic';

export interface ChatClassifyInput {
  message: string;
  history?: ChatTurn[];
  role: ChatRole;
  context?: { grade?: string; subject?: string; topicId?: string };
  lang?: 'ar' | 'fr';
}

export interface ChatAnswerInput extends ChatClassifyInput {
  intent: ChatIntent;
  contextBlockStr?: string;
}

const STR = { type: Type.STRING } as const;

/** Only teachers may reach the teacher-only tools. */
const TEACHER_INTENTS: ReadonlySet<ChatIntent> = new Set(['plan']);
export function allowIntentForRole(intent: ChatIntent, role: ChatRole): ChatIntent {
  if (role !== 'teacher' && TEACHER_INTENTS.has(intent)) return 'ask';
  return intent;
}

// Arabic keywords are written with \u escapes on purpose: the bundler mangles literal Arabic
// inside a RegExp, so literal matching fails at runtime even though the source looks right.
const AR = {
  jadhadha: 'جذاذة', // جذاذة
  infographic: 'إ?ا?نفوغراف', // (إ/ا)نفوغراف
  resume: 'ملخّ?ص', // ملخّص / ملخص
  revision: 'مراجعة', // مراجعة
  serie: 'سلسلة', // سلسلة
  tamarin: 'تما?رين', // تمارين / تمرين
  solve: 'حلّ?|صحّ?ح', // حل / صحح
  find: 'ابحث|كتاب', // ابحث / كتاب
  // scholarly signals that block a false off_topic
  school:
    'اشرح|ساعد|فهم|درس|رياضيات|قراءة|قواعد', // اشرح ساعد فهم درس رياضيات قراءة قواعد
};

/** Strong lexical signals (FR + AR + dialect), checked in priority order. */
const INTENT_KEYWORDS: { intent: ChatIntent; re: RegExp }[] = [
  { intent: 'plan', re: new RegExp(`${AR.jadhadha}|fiche\\s+p[ée]dagogique|pr[ée]paration\\s+(de\\s+)?le[çc]on`, 'i') },
  { intent: 'infographic', re: new RegExp(`infographie|infographic|${AR.infographic}|visuel`, 'i') },
  { intent: 'memo', re: new RegExp(`r[ée]sum[ée]|fiche\\s+de\\s+r[ée]vision|r[ée]vision|${AR.resume}|${AR.revision}`, 'i') },
  { intent: 'exercises', re: new RegExp(`exercices?|s[ée]rie\\s+d|${AR.tamarin}|${AR.serie}|devoirs?`, 'i') },
  { intent: 'solve', re: new RegExp(`r[ée]sou[ds]|corrige|${AR.solve}`, 'i') },
  { intent: 'find', re: new RegExp(`cherche|trouve|livre|${AR.find}`, 'i') },
];

const SCHOOL_SIGNAL = new RegExp(`explique|comprend|aide|devoir|le[çc]on|math|lecture|conjug|grammaire|${AR.school}`, 'i');

/**
 * The cheap classifier confuses generate-intents and over-fires off_topic. A strong keyword in
 * the message overrides the model, and a school keyword blocks a false off_topic. The model's
 * answer is still the fallback when nothing matches.
 */
export function refineIntent(rawMessage: string, modelIntent: ChatIntent): ChatIntent {
  // Normalize so Arabic written in a different Unicode form still matches the keyword codepoints.
  const message = typeof rawMessage.normalize === 'function' ? rawMessage.normalize('NFC') : rawMessage;
  for (const { intent, re } of INTENT_KEYWORDS) {
    if (re.test(message)) return intent;
  }
  if (modelIntent === 'off_topic' && SCHOOL_SIGNAL.test(message)) return 'ask';
  return modelIntent;
}

export const CHAT_CLASSIFY_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    intent: {
      type: Type.STRING,
      enum: ['ask', 'solve', 'exercises', 'memo', 'plan', 'infographic', 'find', 'off_topic'],
    },
    grade: STR,
    subject: STR,
    topicId: STR,
    lang: { type: Type.STRING, enum: ['ar', 'fr'] },
    confidence: { type: Type.NUMBER },
    clarify: STR,
  },
  required: ['intent', 'confidence'],
};

export const CHAT_ANSWER_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    reply: STR,
    followUp: STR,
  },
  required: ['reply'],
};

const recentHistory = (history?: ChatTurn[]): string => {
  if (!history?.length) return '';
  return history
    .slice(-6)
    .map((t) => `${t.role === 'user' ? 'UTILISATEUR' : 'ASSISTANT'}: ${t.text.slice(0, 500)}`)
    .join('\n');
};

/**
 * S20a — cheap classifier. Reads the message (+ recent turns and page context) and returns the
 * intent plus any grade/subject/topicId it can infer, or a single clarifying question. It never
 * answers; it only routes. Dialect and Franco-Arabe input must be understood here.
 */
export const chatClassifySkill: Skill<ChatClassifyInput> = {
  id: 'chat-classify-s20a',
  version: '1.0.0',
  chain: 'A',
  temperature: 0.1,
  schema: CHAT_CLASSIFY_SCHEMA,
  build: (input) => {
    const ctx = input.context || {};
    return [
      `MISSION CLASSIFICATION CONVERSATION (S20a) : tu routes un message dans l'assistant scolaire "Madrasati TN" (primaire tunisien, 1ère–6ème). Tu NE réponds pas, tu classes seulement.`,
      `RÔLE DE L'UTILISATEUR : ${input.role === 'teacher' ? 'enseignant' : 'parent'}.`,
      `CONTEXTE DE LA PAGE (si fourni) — niveau: ${ctx.grade || '—'} | matière: ${ctx.subject || '—'} | topicId: ${ctx.topicId || '—'}.`,
      recentHistory(input.history) ? `HISTORIQUE RÉCENT :\n${recentHistory(input.history)}` : '',
      `INTENTS POSSIBLES :`,
      `- "ask" : expliquer une notion, question de compréhension, aide aux devoirs (par défaut en cas de doute).`,
      `- "solve" : résoudre un exercice précis donné dans le message.`,
      `- "exercises" : demande de créer des exercices / une série.`,
      `- "memo" : demande d'un résumé / fiche de révision.`,
      `- "plan" : demande d'une fiche pédagogique (جذاذة) — réservé à l'enseignant.`,
      `- "infographic" : demande d'une infographie / visuel.`,
      `- "find" : chercher une ressource existante (livre, exercice, chapitre).`,
      `- "off_topic" : hors sujet scolaire (politique, médical, contenu adulte, violence, vie privée d'un enfant, bavardage sans lien avec l'école).`,
      `CONSIGNES :`,
      `- La TRÈS GRANDE MAJORITÉ des messages sont scolaires. En cas de doute, choisis "ask". Ne choisis "off_topic" QUE si le message n'a clairement AUCUN lien avec l'école primaire (ex : politique, santé, contenu adulte). Une demande d'exercice, de leçon, de résumé, de fiche ou d'explication n'est JAMAIS "off_topic".`,
      `- Comprends l'arabe standard, le dialecte tunisien ET le franco-arabe ("chnowa", "9raya", "5ème", "jam3", "madersa"). Mappe "5ème"→"5ème Année", etc.`,
      `- "grade", "subject", "topicId" : déduis-les du message, sinon du contexte de la page, sinon laisse vide.`,
      `- "lang" : langue du MESSAGE de l'utilisateur — "ar" si le message est en arabe (même en dialecte ou franco-arabe), "fr" si le message est en français.`,
      `- "clarify" : UNE seule question courte UNIQUEMENT si le niveau OU la matière manque ET est indispensable pour répondre. Sinon chaîne vide.`,
      `- "confidence" : 0.0 à 1.0.`,
      `- Ne demande JAMAIS de données personnelles sur un enfant (nom, école, adresse).`,
      `EXEMPLES : "chnowa el jam3" → ask. "أنشئ سلسلة تمارين حول الجمع" → exercises, lang ar. "fais-moi un résumé de la leçon" → memo. "explique les fractions" → ask, lang fr. "crée une جذاذة" (enseignant) → plan. "qui va gagner les élections ?" → off_topic.`,
    ]
      .filter(Boolean)
      .join('\n\n');
  },
};

/**
 * S20b — the answer step. Replies conversationally, grounded strictly in the official-curriculum
 * context block, in the user's role register. For "generate" intents it gives a short lead-in;
 * the route attaches a card linking to the real Create tool.
 */
export const chatAnswerSkill: Skill<ChatAnswerInput> = {
  id: 'chat-answer-s20b',
  version: '1.0.0',
  chain: 'A',
  temperature: 0.4,
  schema: CHAT_ANSWER_SCHEMA,
  build: (input) => {
    const parentTone = input.role === 'parent';
    const generate = input.intent === 'exercises' || input.intent === 'memo' || input.intent === 'plan' || input.intent === 'infographic';
    return [
      `MISSION RÉPONSE ASSISTANT (S20b) : tu es l'assistant scolaire "Madrasati TN" pour le primaire tunisien.`,
      `REGISTRE : ${parentTone
        ? 'tu parles à un PARENT — langage simple et rassurant, pas de jargon pédagogique, explique comment aider son enfant à la maison.'
        : 'tu parles à un ENSEIGNANT — registre pédagogique, tu peux employer le vocabulaire du métier (compétence, objectif, trace écrite).'}`,
      `RÈGLES :`,
      `- Fonde ta réponse EXCLUSIVEMENT sur les références officielles ci-dessus quand elles existent ; ne les contredis jamais et n'invente pas de faits hors programme.`,
      `- Réponds dans la langue demandée (${input.lang === 'fr' ? 'français' : 'arabe'}), de façon concise et directe.`,
      generate
        ? `- L'utilisateur veut créer un document ("${input.intent}"). Donne une phrase d'introduction courte ; NE génère PAS le document complet ici (l'application ouvrira l'outil dédié). Propose éventuellement en "followUp" ce qu'il faut préciser.`
        : `- Réponds complètement à la question. "followUp" : une question de suivi courte et utile, ou chaîne vide.`,
      `- Ne demande jamais de données personnelles sur un enfant.`,
      `MESSAGE DE L'UTILISATEUR :\n${input.message.slice(0, 2000)}`,
      recentHistory(input.history) ? `HISTORIQUE RÉCENT :\n${recentHistory(input.history)}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');
  },
};
