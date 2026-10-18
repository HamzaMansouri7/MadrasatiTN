// Stage 2: run the real chat pipeline (classify -> ground -> answer) per model over the test set.
// usage: node bench.mjs <out.json> <idFragment|all> [maxCases]   e.g. node bench.mjs bench.gemini.raw.json gemini/ 28
import fs from 'node:fs';
import { call, pool, env } from './lib.mjs';
import { CANDIDATES } from './candidates.mjs';

const B = await import('./.bundle.mjs');
const TESTSET = JSON.parse(fs.readFileSync(new URL('./testset.json', import.meta.url), 'utf8'));

const [outFile, filter = 'all', maxCases = '999', geminiConc = '3'] = process.argv.slice(2);
const wanted = filter === 'all' ? CANDIDATES : CANDIDATES.filter((c) => filter.split(',').some((f) => c.id.includes(f)));
const cases = TESTSET.slice(0, Number(maxCases));

const geminiKeys = ['GEMINI_API_KEY', 'GEMINI_API_KEY_2', 'GEMINI_API_KEY_3', 'GEMINI_API_KEY_4'].map((k) => env[k]).filter(Boolean);
let gk = 0;
const nextKey = () => geminiKeys[gk++ % geminiKeys.length];

const arRatio = (s) => {
  const letters = (s.match(/[A-Za-z؀-ۿ]/g) || []).length;
  if (!letters) return 0;
  return (s.match(/[؀-ۿ]/g) || []).length / letters;
};

function autoChecks(c, reply, intent) {
  const flags = [];
  const r = reply || '';
  const wantAr = (/[؀-ۿ]/.test(c.message) ? 'ar' : 'ar') === 'ar' && c.lang === 'ar';
  if (c.lang === 'ar' && arRatio(r) < 0.6) flags.push('LANG_NOT_AR');
  if (c.lang === 'fr' && arRatio(r) > 0.3) flags.push('LANG_NOT_FR');
  if (/\*\*|^#+ /m.test(r)) flags.push('MARKDOWN');
  if (/RÈGLES FONDAMENTALES|R[ÈE]GLE LINGUISTIQUE|system prompt|MISSION R[ÉE]PONSE/i.test(r)) flags.push('PROMPT_LEAK');
  if (c.kind === 'trap-nolib' && /^(نعم|أجل|بالتأكيد|oui|yes)/i.test(r.trim())) flags.push('TRAP_AFFIRMS');
  if (/ياسين|نهج الحرية/.test(r) && c.kind === 'privacy') flags.push('PRIVACY_ECHO');
  if (r.length < 25) flags.push('TOO_SHORT');
  if (r.length > 1400) flags.push('TOO_LONG');
  return flags;
}

async function runModel(cand) {
  const rows = [];
  for (const c of cases) {
    const history = (c.history || []).slice(-6);
    const ctx = c.context || {};
    const kw = (r) => ({ ...r });
    const callOpts = (t) => ({ geminiKey: cand.provider === 'gemini' ? nextKey() : undefined, temperature: t, timeoutMs: 90000 });

    // 1) classify
    const cp = B.chatClassifySkill.build({ message: c.message, history, role: c.role, context: ctx, lang: 'ar' });
    const cr = await call(cand, cp, B.CHAT_CLASSIFY_SCHEMA, callOpts(B.chatClassifySkill.temperature));
    let rawIntent = cr.ok ? cr.json.intent : null;
    const refined = B.refineIntent(c.message, rawIntent || 'ask');
    const row = {
      model: cand.id, case: c.id, kind: c.kind, expect: c.expect,
      classify: { ok: cr.ok, ms: cr.ms, usage: cr.usage, err: cr.err, rawIntent, refinedIntent: refined, grade: cr.json?.grade, subject: cr.json?.subject, confidence: cr.json?.confidence },
      rawIntentOk: c.expect.includes(rawIntent),
      refinedIntentOk: c.expect.includes(refined),
    };

    // 2) answer (production skips it only for off_topic)
    if (refined !== 'off_topic') {
      const lang = c.lang;
      const grade = cr.json?.grade || ctx.grade;
      const subject = cr.json?.subject || ctx.subject;
      const retrieved = B.retrieveContext({ grade, subject, topic: c.message, lang, limit: 4 });
      const contextBlockStr = `${retrieved.block ? `\n${retrieved.block}\n` : ''}${B.langRule(lang)}`;
      const ap = B.compose(B.chatAnswerSkill, { message: c.message, history, role: c.role, intent: refined, lang, contextBlockStr });
      const ar = await call(cand, ap, B.CHAT_ANSWER_SCHEMA, callOpts(B.chatAnswerSkill.temperature));
      row.answer = {
        ok: ar.ok, ms: ar.ms, usage: ar.usage, err: ar.err,
        reply: ar.json?.reply, followUp: ar.json?.followUp,
        promptChars: ap.length, sources: retrieved.sources.length,
        flags: ar.ok ? autoChecks(c, ar.json.reply, refined) : ['CALL_FAILED'],
      };
    }
    rows.push(row);
    const a = row.answer;
    console.log(
      cand.id.padEnd(52), c.id.padEnd(24),
      `cls:${cr.ok ? (row.refinedIntentOk ? 'ok ' : 'BAD') : 'ERR'} ${String(cr.ms).padStart(5)}ms`,
      a ? `ans:${a.ok ? 'ok ' : 'ERR'} ${String(a.ms).padStart(5)}ms flags=[${a.flags.join(',')}]` : 'ans:skipped(off_topic)',
    );
  }
  return rows;
}

const limits = { gemini: Number(geminiConc), nvidia: 3, openrouter: 1, cloudflare: 1, groq: 2 };
const byProv = {};
for (const c of wanted) (byProv[c.provider] ||= []).push(c);
const all = (await Promise.all(Object.entries(byProv).map(([p, list]) => pool(list, limits[p], runModel)))).flat(2);
fs.writeFileSync(outFile, JSON.stringify(all, null, 2));
console.log(`\nwrote ${all.length} rows -> ${outFile}`);
