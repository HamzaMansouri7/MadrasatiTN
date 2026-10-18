import { describe, expect, it } from 'vitest';
import { CHAT_TOOLS, buildChatPrefill, isChatToolIntent } from './chat-tools';

describe('chat tools registry', () => {
  it('covers every generate intent with a route and both labels', () => {
    for (const intent of ['exercises', 'plan', 'memo', 'infographic', 'series'] as const) {
      const t = CHAT_TOOLS[intent];
      expect(t.route.startsWith('/')).toBe(true);
      expect(t.label.fr.length).toBeGreaterThan(0);
      expect(t.label.ar.length).toBeGreaterThan(0);
    }
  });

  it('recognises only generate intents', () => {
    expect(isChatToolIntent('series')).toBe(true);
    expect(isChatToolIntent('ask')).toBe(false);
    expect(isChatToolIntent(undefined)).toBe(false);
  });

  it('prefills the studio from the request and the classifier result', () => {
    const p = buildChatPrefill('  crée une série sur les angles  ', { grade: '5ème Année', subject: 'Mathématiques', topicId: 'math-5-ch1', lang: 'fr' });
    expect(p.mode).toBe('topic');
    expect(p.topic).toBe('crée une série sur les angles');
    expect(p.instructions).toBe('crée une série sur les angles');
    expect(p.grade).toBe('5ème Année');
    expect(p.topicId).toBe('math-5-ch1');
    expect(p.language).toBe('fr');
  });

  it('defaults to Arabic and caps long requests', () => {
    const p = buildChatPrefill('x'.repeat(900), undefined);
    expect(p.language).toBe('ar');
    expect(p.instructions?.length).toBe(500);
    expect(p.topic?.length).toBe(200);
  });
});
