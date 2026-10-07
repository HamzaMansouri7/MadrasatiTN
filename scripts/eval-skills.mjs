#!/usr/bin/env node
/**
 * MadrasatiTN — AI skill evaluation harness (PLAN-ai-skills.md task K7).
 * Sends a fixed set of inputs (grades 1/3/5, AR + FR) to the text endpoints of a RUNNING server and
 * checks each reply automatically: HTTP ok, required fields, output language, banned phrases, length,
 * exercise sanity. Writes EVAL-REPORT.md + scripts/eval-results.json.
 * It cannot judge pedagogy: a teacher must read EVAL-REPORT.md "Samples" before trusting a pass.
 *
 * Run: node scripts/eval-skills.mjs [--only generate-exercise,variant] [--delay 7000]
 * Needs: server on SERVER_URL (default http://localhost:4000). Uses free AI quota: ~1 call per case.
 */
import { writeFileSync } from 'node:fs';

const BASE = process.env['SERVER_URL'] || 'http://localhost:4000';
const args = process.argv.slice(2);
const arg = (name, def) => (args.includes(name) ? args[args.indexOf(name) + 1] : def);
const ONLY = arg('--only', '') ? arg('--only', '').split(',') : null;
const DELAY = Number(arg('--delay', 7000)); // server limit is 12 req/min (aiRateLimiter)

const G1 = '1ère Année', G3 = '3ème Année', G5 = '5ème Année';
const MATH = 'Mathématiques', ARAB = 'اللغة العربية', FR = 'Français', SCI = 'Éveil Scientifique';

// --- helpers -----------------------------------------------------------------
const arabicRatio = (s) => {
  const letters = (String(s).match(/\p{L}/gu) || []).length;
  const arabic = (String(s).match(/[؀-ۿ]/g) || []).length;
  return letters ? arabic / letters : 0;
};
const BANNED = /key point|introduction here|content goes here|lorem ipsum|\[object|undefined|\bnull\b|TODO|as an ai/i;
const pick = (o, path) => path.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
const textOf = (o, fields) => fields.map((f) => String(pick(o, f) ?? '')).join('\n');

/** expectLang: 'ar' | 'fr' | 'any'. fields: reply paths that must be non-empty and are checked for language/banned. */
const CASES = [
  // generate-exercise (S1)
  ...[
    [G1, ARAB, 'حرف الميم', 'ar'], [G3, MATH, 'الجمع والطرح إلى 1000', 'ar'], [G5, FR, 'Le présent de l\'indicatif', 'fr'],
  ].map(([grade, subject, topic, lang]) => ({
    skill: 'generate-exercise', path: '/api/ai/generate-exercise', label: `${grade} ${subject}`,
    body: { grade, subject, topic, difficulty: 'Moyen', language: lang === 'ar' ? 'ar' : 'fr', role: 'teacher' },
    data: (r) => r.exercise, fields: ['title', 'promptText', 'solutionText'], expectLang: subject === FR ? 'fr' : 'ar', exercise: true,
  })),
  // variant (S3)
  { skill: 'variant', path: '/api/ai/variant', label: `${G3} ${MATH} AR`, body: { originalPromptText: 'احسب: 125 + 238', grade: G3, subject: MATH, topic: 'الجمع', format: 'free', language: 'ar' },
    data: (r) => r.exercise, fields: ['promptText', 'solutionText'], expectLang: 'ar', exercise: true },
  { skill: 'variant', path: '/api/ai/variant', label: `${G5} ${MATH} FR`, body: { originalPromptText: 'Calcule 3/4 + 1/2.', grade: G5, subject: MATH, topic: 'Fractions', format: 'free', language: 'fr' },
    data: (r) => r.exercise, fields: ['promptText', 'solutionText'], expectLang: 'fr', exercise: true },
  // transform-exercise (S2)
  { skill: 'transform-exercise', path: '/api/ai/transform-exercise', label: `${G5} ${MATH} FR`, body: { originalBlock: 'Calcule : 3/4 + 1/2', transformType: 'simplify', grade: G5, subject: MATH, language: 'fr' },
    data: (r) => r.exercise, fields: ['promptText', 'solutionText'], expectLang: 'fr', exercise: true },
  // explain-concept (S6)
  { skill: 'explain-concept', path: '/api/ai/explain-concept', label: `${G3} ${SCI} AR`, body: { concept: 'دورة الماء', grade: G3, subject: SCI, language: 'ar' },
    data: (r) => r.explanation, fields: ['explanation', 'analogy', 'checkQuestion'], expectLang: 'ar', maxChars: 1500 },
  { skill: 'explain-concept', path: '/api/ai/explain-concept', label: `${G5} ${MATH} FR`, body: { concept: 'Fraction irréductible', grade: G5, subject: MATH, language: 'fr' },
    data: (r) => r.explanation, fields: ['explanation', 'analogy', 'checkQuestion'], expectLang: 'fr', maxChars: 1500 },
  // draft-announcement (S10)
  { skill: 'draft-announcement', path: '/api/ai/draft-announcement', label: 'devoir AR', body: { purpose: 'إعلام الأولياء بموعد فرض مراقبة', details: 'فرض مراقبة في الرياضيات', targetAudience: 'الأولياء', grade: G3, subject: MATH, language: 'ar' },
    data: (r) => r.announcement, fields: ['title', 'content'], expectLang: 'ar', maxChars: 1800, noInventedDate: true },
  { skill: 'draft-announcement', path: '/api/ai/draft-announcement', label: 'devoir FR', body: { purpose: 'Annonce de devoir de contrôle', details: 'Devoir de contrôle en mathématiques', targetAudience: 'parents', grade: G5, subject: MATH, language: 'fr' },
    data: (r) => r.announcement, fields: ['title', 'content'], expectLang: 'fr', maxChars: 1800, noInventedDate: true },
  // auto-tag-document (S11)
  { skill: 'auto-tag-document', path: '/api/ai/auto-tag-document', label: 'serie fractions', body: { documentName: 'serie-fractions.pdf', rawText: 'Exercice 1: Réduire la fraction 6/8. Exercice 2: Comparer 3/4 et 2/3.' },
    data: (r) => r.metadata, fields: ['suggestedTitle', 'grade', 'subject', 'trimester', 'docType'], expectLang: 'any' },
  // generate-full-exam (S4, no client yet)
  { skill: 'generate-full-exam', path: '/api/ai/generate-full-exam', label: `${G5} ${MATH} FR`, body: { grade: G5, subject: MATH, trimester: 'Trimestre 1', language: 'fr' },
    data: (r) => r.exam, fields: ['examTitle'], expectLang: 'fr', exam: true },
  // solve-exercise (S5 text, no client yet)
  { skill: 'solve-exercise', path: '/api/ai/solve-exercise', label: `${G5} ${MATH} FR`, body: { exerciseTitle: 'Fractions', exerciseInstructions: 'Calcule 3/4 + 1/2. Donne le résultat sous forme irréductible.', grade: G5, subject: MATH, language: 'fr' },
    data: (r) => r.solution, fields: ['solutionText', 'teacherNotes'], expectLang: 'fr', mustContain: /5\s*\/\s*4|1\s*1\s*\/\s*4|1[,.]25|1 1\/4/ },
];

// --- checks ------------------------------------------------------------------
function check(c, json) {
  const fails = [];
  const d = c.data(json) ?? {};
  for (const f of c.fields) if (!String(pick(d, f) ?? '').trim()) fails.push(`empty ${f}`);
  const text = textOf(d, c.fields);
  if (BANNED.test(text)) fails.push(`banned phrase: ${text.match(BANNED)[0]}`);
  const ar = arabicRatio(text);
  if (c.expectLang === 'ar' && ar < 0.5) fails.push(`expected Arabic, ratio ${ar.toFixed(2)}`);
  if (c.expectLang === 'fr' && ar > 0.1) fails.push(`expected French, Arabic ratio ${ar.toFixed(2)}`);
  if (c.maxChars && text.length > c.maxChars) fails.push(`too long ${text.length}>${c.maxChars}`);
  if (c.noInventedDate && /\b\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}\b/.test(text)) fails.push('invented date (use placeholder)');
  if (c.mustContain && !c.mustContain.test(text)) fails.push('expected result 5/4 not found');
  if (c.exercise) {
    if (d.format === 'qcm' && !(Number.isInteger(d.qcmCorrectIndex) && d.qcmCorrectIndex >= 0 && d.qcmCorrectIndex < (d.qcmOptions || []).length)) fails.push('qcm index not in options');
    if (d.points !== undefined && !(Number(d.points) > 0)) fails.push('points not > 0');
  }
  if (c.exam) {
    const s = d.sections || [];
    if (s.length < 2) fails.push(`only ${s.length} sections`);
    const total = s.reduce((a, x) => a + Number(x.points || 0), 0);
    if (total !== 20) fails.push(`points total ${total} != 20`);
  }
  return fails;
}

// --- run ---------------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cases = CASES.filter((c) => !ONLY || ONLY.includes(c.skill));
const results = [];
for (const [i, c] of cases.entries()) {
  const t0 = Date.now();
  let status = 0, json = null, fails = [];
  try {
    const res = await fetch(`${BASE}${c.path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(c.body), signal: AbortSignal.timeout(90000) });
    status = res.status;
    json = await res.json().catch(() => null);
    if (!res.ok || !json || json.success === false) fails.push(`HTTP ${status} ${JSON.stringify(json)?.slice(0, 120)}`);
    else fails = check(c, json);
  } catch (e) { fails.push(`request failed: ${e.message}`); }
  const ms = Date.now() - t0;
  const r = { skill: c.skill, label: c.label, ok: fails.length === 0, ms, status, fails, sample: json && c.fields ? textOf(c.data(json) ?? {}, c.fields).slice(0, 500) : '' };
  results.push(r);
  console.log(`${r.ok ? 'PASS' : 'FAIL'} ${String(ms).padStart(6)}ms ${c.skill} [${c.label}]${r.ok ? '' : '  ' + fails.join('; ')}`);
  if (i < cases.length - 1) await sleep(DELAY);
}

// --- report ------------------------------------------------------------------
const passed = results.filter((r) => r.ok).length;
const bySkill = [...new Set(results.map((r) => r.skill))].map((s) => {
  const rs = results.filter((r) => r.skill === s);
  const avg = Math.round(rs.reduce((a, r) => a + r.ms, 0) / rs.length);
  return `| ${s} | ${rs.filter((r) => r.ok).length}/${rs.length} | ${avg} | ${[...new Set(rs.flatMap((r) => r.fails))].join('; ') || ''} |`;
});
const md = [
  `# EVAL REPORT — ${new Date().toISOString()}`, '', `Server: ${BASE} | ${passed}/${results.length} cases passed (automatic checks only)`, '',
  '| Skill | Pass | Avg ms | Failures |', '|---|---|---|---|', ...bySkill, '',
  '## Samples (for human pedagogy review — passing here does NOT mean the content is correct)', '',
  ...results.map((r) => `### ${r.skill} — ${r.label} — ${r.ok ? 'PASS' : 'FAIL'}\n${r.sample ? '```\n' + r.sample + '\n```' : '(no content)'}\n`),
].join('\n');
writeFileSync('EVAL-REPORT.md', md);
writeFileSync('scripts/eval-results.json', JSON.stringify({ date: new Date().toISOString(), base: BASE, results }, null, 2));
console.log(`\n${passed}/${results.length} passed → EVAL-REPORT.md`);
process.exit(passed === results.length ? 0 : 1);
