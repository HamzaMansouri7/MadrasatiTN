// Aggregate bench raw files into one per-model table. usage: node summary.mjs bench.*.raw.json
import fs from 'node:fs';

const rows = process.argv.slice(2).flatMap((f) => JSON.parse(fs.readFileSync(f, 'utf8')));
const by = {};
for (const r of rows) (by[r.model] ||= []).push(r);

const pct = (n, d) => (d ? Math.round((100 * n) / d) + '%' : '-');
const med = (a) => (a.length ? [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)] : 0);
const p90 = (a) => (a.length ? [...a].sort((x, y) => x - y)[Math.floor(a.length * 0.9)] : 0);

const out = Object.entries(by).map(([model, rs]) => {
  const cls = rs.map((r) => r.classify);
  const ans = rs.map((r) => r.answer).filter(Boolean);
  const clsMs = cls.filter((c) => c.ok).map((c) => c.ms);
  const ansMs = ans.filter((a) => a.ok).map((a) => a.ms);
  const flagCount = {};
  for (const a of ans) for (const f of a.flags || []) flagCount[f] = (flagCount[f] || 0) + 1;
  const tok = (list, k) => list.reduce((s, x) => s + (x.usage?.[k] || 0), 0);
  return {
    model,
    cases: rs.length,
    clsOk: pct(cls.filter((c) => c.ok).length, cls.length),
    intentRaw: pct(rs.filter((r) => r.rawIntentOk).length, rs.length),
    intentRefined: pct(rs.filter((r) => r.refinedIntentOk).length, rs.length),
    ansOk: pct(ans.filter((a) => a.ok).length, ans.length),
    clsMedMs: med(clsMs),
    ansMedMs: med(ansMs),
    ansP90Ms: p90(ansMs),
    tokPerTurn: Math.round((tok(cls, 'in') + tok(cls, 'out') + tok(ans, 'in') + tok(ans, 'out')) / rs.length),
    reasoningPerTurn: Math.round((tok(cls, 'reasoning') + tok(ans, 'reasoning')) / rs.length),
    flags: flagCount,
  };
});
out.sort((a, b) => parseInt(b.intentRefined) - parseInt(a.intentRefined) || a.ansMedMs - b.ansMedMs);
console.table(out.map(({ flags, ...r }) => r));
for (const r of out) console.log(r.model.padEnd(52), JSON.stringify(r.flags));
