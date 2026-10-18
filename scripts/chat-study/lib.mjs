import fs from 'node:fs';

export const env = {};
for (const l of fs.readFileSync(new URL('../../.env', import.meta.url), 'utf8').split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
}

const lower = (s) =>
  s && typeof s === 'object'
    ? Array.isArray(s)
      ? s.map(lower)
      : Object.fromEntries(Object.entries(s).map(([k, v]) => [k, k === 'type' && typeof v === 'string' ? v.toLowerCase() : lower(v)]))
    : s;

const ENDPOINTS = {
  nvidia: () => ({ base: 'https://integrate.api.nvidia.com/v1', key: env.NVIDIA_API_KEY }),
  groq: () => ({ base: 'https://api.groq.com/openai/v1', key: env.GROQ_API_KEY }),
  openrouter: () => ({ base: 'https://openrouter.ai/api/v1', key: env.OPENROUTER_API_KEY }),
  cloudflare: () => ({
    base: `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/ai/v1`,
    key: env.CLOUDFLARE_API_TOKEN,
  }),
};

const parseJson = (t) => JSON.parse(String(t || '').replace(/```json/g, '').replace(/```/g, '').trim());

function missingRequired(json, schema) {
  const req = schema?.required || [];
  return req.filter((k) => json?.[k] === undefined || json?.[k] === null);
}

/** One model call, shaped like production (gemini: responseSchema; others: json_object + schema in prompt). */
export async function call(cand, prompt, schema, { temperature = 0.2, timeoutMs = 90000, geminiKey = env.GEMINI_API_KEY, thinking } = {}) {
  if (cand.provider === 'groq') await new Promise((r) => setTimeout(r, Number(process.env.PACE_MS || 0)));
  const t0 = Date.now();
  const res = { id: cand.id, ok: false, ms: 0, usage: { in: 0, out: 0, reasoning: 0 } };
  try {
    let text;
    if (cand.provider === 'gemini') {
      const gen = { responseMimeType: 'application/json', temperature };
      if (schema) gen.responseSchema = schema;
      if (thinking !== undefined) gen.thinkingConfig = { thinkingBudget: thinking };
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${cand.model}:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: gen }),
          signal: AbortSignal.timeout(timeoutMs),
        },
      );
      const raw = await r.text();
      if (!r.ok) throw new Error(`HTTP ${r.status} ${raw.slice(0, 160)}`);
      const d = JSON.parse(raw);
      text = d.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
      const u = d.usageMetadata || {};
      res.usage = { in: u.promptTokenCount || 0, out: u.candidatesTokenCount || 0, reasoning: u.thoughtsTokenCount || 0 };
    } else {
      const ep = ENDPOINTS[cand.provider]();
      const note = schema
        ? `\n\nRéponds uniquement avec un objet JSON valide respectant ce schéma :\n${JSON.stringify(lower(schema))}`
        : '';
      const r = await fetch(`${ep.base}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ep.key}` },
        body: JSON.stringify({
          model: cand.model,
          messages: [{ role: 'user', content: prompt + note }],
          response_format: { type: 'json_object' },
          temperature,
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      const raw = await r.text();
      if (!r.ok) throw new Error(`HTTP ${r.status} ${raw.slice(0, 160)}`);
      const d = JSON.parse(raw);
      const msg = d.choices?.[0]?.message || {};
      text = msg.content || '';
      const u = d.usage || {};
      res.usage = {
        in: u.prompt_tokens || 0,
        out: u.completion_tokens || 0,
        reasoning: u.completion_tokens_details?.reasoning_tokens || 0,
      };
    }
    res.rawText = text;
    if (!text.trim()) throw new Error('EMPTY');
    res.json = parseJson(text);
    const miss = missingRequired(res.json, schema);
    if (miss.length) throw new Error(`SCHEMA missing ${miss.join(',')}`);
    res.ok = true;
  } catch (e) {
    res.err = String(e.message || e).replace(/\s+/g, ' ').slice(0, 200);
  }
  res.ms = Date.now() - t0;
  return res;
}

/** Run fn over items with a concurrency limit. */
export async function pool(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const k = i++;
        out[k] = await fn(items[k], k);
      }
    }),
  );
  return out;
}
