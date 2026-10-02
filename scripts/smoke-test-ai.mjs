#!/usr/bin/env node
/**
 * MadrasatiTN — AI Endpoint Smoke Tests
 * Run: node scripts/smoke-test-ai.mjs
 * Requires: dev server running on http://localhost:4000
 */

const BASE = process.env['SERVER_URL'] || 'http://localhost:4000';

const PASS = '\x1b[32m✓ PASS\x1b[0m';
const FAIL = '\x1b[31m✗ FAIL\x1b[0m';
const WARN = '\x1b[33m⚠ WARN\x1b[0m';

async function hit(name, path, body) {
  const t0 = Date.now();
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });
    const ms = Date.now() - t0;
    const json = await res.json().catch(() => ({}));
    const ok = res.ok && (json.success !== false);
    const icon = ok ? PASS : (res.ok ? WARN : FAIL);
    console.log(`${icon}  [${ms}ms] ${name} — HTTP ${res.status}`);
    if (!ok) {
      console.log(`       └─ body: ${JSON.stringify(json).slice(0, 200)}`);
    }
    return { name, ok, ms, status: res.status };
  } catch (err) {
    const ms = Date.now() - t0;
    console.log(`${FAIL}  [${ms}ms] ${name} — ${err.message}`);
    return { name, ok: false, ms, error: err.message };
  }
}

const GRADE = '4ème Année';
const SUBJECT = 'Mathématiques';
const TOPIC = 'Fractions et nombres décimaux';
// 1x1 white PNG — vision endpoints only need a decodable image to exercise the pipeline.
const PNG_PIXEL = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==';

// Payload keys mirror each endpoint's req.body destructure in src/server.ts — keep in sync.
const TESTS = [
  ['generate-exercise', '/api/ai/generate-exercise', { grade: GRADE, subject: SUBJECT, topic: TOPIC, difficulty: 'Moyen', language: 'fr' }],
  ['transform-exercise', '/api/ai/transform-exercise', { originalBlock: 'Calcule : 3/4 + 1/2', transformType: 'simplify', grade: GRADE, subject: SUBJECT, language: 'fr' }],
  ['generate-full-exam', '/api/ai/generate-full-exam', { grade: GRADE, subject: SUBJECT, trimester: 'Trimestre 1', language: 'fr' }],
  ['solve-exercise', '/api/ai/solve-exercise', { promptText: 'Calcule 3/4 + 1/2. Donne le résultat sous forme irréductible.', grade: GRADE, subject: SUBJECT, language: 'fr' }],
  ['draft-announcement', '/api/ai/draft-announcement', { purpose: 'Annonce de devoir de contrôle', details: 'Devoir de contrôle le 15 octobre sur les fractions', targetAudience: 'parents', grade: GRADE, subject: SUBJECT, language: 'fr' }],
  ['explain-concept', '/api/ai/explain-concept', { concept: 'Fraction irréductible', grade: GRADE, subject: SUBJECT, language: 'fr' }],
  ['auto-tag-document', '/api/ai/auto-tag-document', { documentName: 'serie-fractions.pdf', rawText: 'Exercice 1: Réduire la fraction 6/8. Exercice 2: Comparer 3/4 et 2/3.' }],
  ['photo-solve', '/api/ai/photo-solve', { base64Data: PNG_PIXEL, contentType: 'image/png', language: 'fr' }],
  ['summarize-docs', '/api/ai/summarize-docs', { images: [{ base64Data: PNG_PIXEL, contentType: 'image/png' }], grade: GRADE, subject: SUBJECT, language: 'fr' }],
  ['analyze-worksheet', '/api/ai/analyze-worksheet', { base64Data: PNG_PIXEL, contentType: 'image/png', documentName: 'smoke-worksheet.png' }],
  ['generate-similar', '/api/ai/generate-similar', { dna: { grade: GRADE, subject: SUBJECT, topic: TOPIC, difficulty: 'Moyen', exerciseTypes: ['calcul'], competencies: ['réduire une fraction'] }, count: 1 }],
  ['variant', '/api/ai/variant', { originalPromptText: 'Calcule 3/4 + 1/2', grade: GRADE, subject: SUBJECT, topic: TOPIC, format: 'free', language: 'fr' }],
  ['chat-article', '/api/ai/chat-article', { messages: [{ role: 'user', content: 'Écris une introduction sur les fractions pour la 4ème année.' }], userPrompt: 'Écris une introduction sur les fractions pour la 4ème année.', language: 'fr' }],
  ['generate-illustration', '/api/ai/generate-illustration', { promptText: 'A simple fraction diagram showing 3/4 of a circle' }],
];

(async () => {
  console.log(`\n MadrasatiTN AI Smoke Tests → ${BASE}\n${'─'.repeat(60)}`);
  const results = [];
  for (const [name, path, body] of TESTS) {
    results.push(await hit(name, path, body));
  }
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  const avgMs = Math.round(results.reduce((s, r) => s + r.ms, 0) / results.length);
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`Results: ${passed}/${results.length} passed | ${failed} failed | avg ${avgMs}ms`);
  if (failed > 0) {
    results.filter((r) => !r.ok).forEach((r) => console.log(`  x ${r.name} (${r.ms}ms)`));
    process.exit(1);
  } else {
    console.log('All AI endpoints responding correctly.');
  }
})();
