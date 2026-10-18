import fs from 'node:fs';
import { call, pool } from './lib.mjs';
import { CANDIDATES } from './candidates.mjs';

const B = await import('./.bundle.mjs');

const prompt = B.chatClassifySkill.build({
  message: 'ساعدني في فهم الكسور للسنة الخامسة',
  role: 'parent',
  lang: 'ar',
});

const byProv = {};
for (const c of CANDIDATES) (byProv[c.provider] ||= []).push(c);
const limits = { gemini: 2, nvidia: 3, openrouter: 1, cloudflare: 2, groq: 1 };

const results = (
  await Promise.all(
    Object.entries(byProv).map(([p, list]) =>
      pool(list, limits[p], async (cand) => {
        const r = await call(cand, prompt, B.CHAT_CLASSIFY_SCHEMA, { timeoutMs: 90000 });
        console.log(
          r.ok ? 'OK  ' : 'FAIL',
          cand.id.padEnd(66),
          String(r.ms).padStart(6) + 'ms',
          `in:${r.usage.in} out:${r.usage.out} rsn:${r.usage.reasoning}`,
          r.ok ? `intent=${r.json.intent}` : r.err.slice(0, 90),
        );
        return { cand, ok: r.ok, ms: r.ms, usage: r.usage, intent: r.json?.intent, err: r.err };
      }),
    ),
  )
).flat();

fs.writeFileSync('smoke.raw.json', JSON.stringify(results, null, 2));
console.log(`\n${results.filter((r) => r.ok).length}/${results.length} ok`);
