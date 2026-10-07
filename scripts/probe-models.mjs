// Probe every candidate (provider, model) with one tiny Arabic JSON call and report pass/fail + latency.
// Reads repo .env itself (the app does not). Keys are never printed.
// Usage: node scripts/probe-models.mjs [--images] [--out scripts/probe-results.json]
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const WITH_IMAGES = args.includes('--images');
const OUT = args.includes('--out') ? args[args.indexOf('--out') + 1] : 'scripts/probe-results.json';

// --- env ---
try {
  for (const line of readFileSync(resolve('.env'), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
} catch { /* no .env: rely on the shell */ }

const geminiKeys = [...new Set(Object.entries(process.env)
  .filter(([k, v]) => k.startsWith('GEMINI_API_KEY') && v)
  .flatMap(([, v]) => v.split(/[,\n]/)).map((k) => k.trim()).filter(Boolean))];
const mistralKey = process.env.MISTRAL_API_KEY || '';
const openRouterKey = process.env.OPENROUTER_API_KEY || '';
const nvidiaKey = process.env.NVIDIA_API_KEY || '';
const cfAccount = process.env.CLOUDFLARE_ACCOUNT_ID || '';
const cfToken = process.env.CLOUDFLARE_API_TOKEN || '';

// --- candidates ---
const GEMINI_MODELS = [
  'gemini-flash-latest', 'gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-3.5-flash',
  'gemini-flash-lite-latest', 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-2.5-flash', 'gemini-2.5-flash-lite',
];
const MISTRAL_MODELS = ['mistral-medium-latest', 'mistral-small-latest', 'magistral-medium-latest', 'magistral-small-latest', 'ministral-14b-latest'];
const MISTRAL_VISION = ['mistral-small-latest', 'mistral-medium-latest'];
const CF_TEXT = [
  '@cf/meta/llama-3.3-70b-instruct-fp8-fast', '@cf/openai/gpt-oss-120b', '@cf/qwen/qwen3-30b-a3b-fp8',
  '@cf/mistralai/mistral-small-3.1-24b-instruct', '@cf/google/gemma-4-26b-a4b-it', '@cf/meta/llama-4-scout-17b-16e-instruct',
];
const CF_VISION = ['@cf/meta/llama-4-scout-17b-16e-instruct', '@cf/meta/llama-3.2-11b-vision-instruct'];
const CF_IMAGES = [
  '@cf/black-forest-labs/flux-1-schnell', '@cf/black-forest-labs/flux-2-klein-4b', '@cf/black-forest-labs/flux-2-klein-9b',
  '@cf/leonardo/lucid-origin', '@cf/bytedance/stable-diffusion-xl-lightning',
];
const OPENROUTER_MODELS = ['google/gemma-4-31b-it:free', 'google/gemma-4-26b-a4b-it:free', 'nvidia/nemotron-3-super-120b-a12b:free', 'nvidia/nemotron-3-ultra-550b-a55b:free'];
const NVIDIA_MODELS = ['nvidia/nemotron-3-ultra-550b-a55b', 'meta/llama-3.2-11b-vision-instruct', 'nvidia/nemotron-3.5-lightning-30b-a3b'];

const PROMPT = 'أجب بصيغة JSON فقط دون أي نص آخر: {"ok": true, "word": "<كلمة عربية واحدة تعني مدرسة>"}';
const SCHEMA = { type: 'object', properties: { ok: { type: 'boolean' }, word: { type: 'string' } }, required: ['ok', 'word'] };
// 1x1 red PNG for the vision probe.
const PNG_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const VISION_PROMPT = 'ما لون هذه الصورة؟ أجب بصيغة JSON فقط: {"ok": true, "color": "<اللون بالعربية>"}';

const results = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const status = (msg) => msg.match(/\b(400|401|402|403|404|422|429|500|502|503|504)\b/)?.[1] || '?';
const parseJSON = (text) => {
  const t = String(text || '').replace(/```json/gi, '').replace(/```/g, '').trim();
  const start = t.indexOf('{');
  return JSON.parse(start > 0 ? t.slice(start, t.lastIndexOf('}') + 1) : t);
};

// One retry after a pause on transient errors (503 overload, 429 burst limit) so flaky != dead.
async function withRetry(fn) {
  try { return await fn(); } catch (err) {
    if (!/HTTP (429|503)/.test(String(err.message))) throw err;
    await sleep(4000);
    const out = (await fn()) || {};
    return { ...out, note: `${out.note || ''} retried`.trim() };
  }
}

async function probe(label, fn) {
  const t0 = Date.now();
  try {
    const extra = (await withRetry(fn)) || {};
    const r = { ...label, pass: true, ms: Date.now() - t0, ...extra };
    results.push(r);
    console.log(`PASS ${r.ms.toString().padStart(5)}ms ${label.provider} ${label.model} ${label.task}${extra.note ? '  (' + extra.note + ')' : ''}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const r = { ...label, pass: false, ms: Date.now() - t0, status: status(msg), error: msg.slice(0, 160) };
    results.push(r);
    console.log(`FAIL ${r.ms.toString().padStart(5)}ms ${label.provider} ${label.model} ${label.task}  ${r.status} ${r.error}`);
  }
}

// --- Gemini (REST, JSON mode + responseSchema) ---
async function gemini(key, model, parts) {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      contents: [{ parts: parts.map((p) => ('text' in p ? p : { inlineData: { mimeType: p.mime, data: p.data } })) }],
      generationConfig: { responseMimeType: 'application/json', responseSchema: SCHEMA, temperature: 0.2 },
    }),
    signal: AbortSignal.timeout(45000),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(`HTTP ${r.status} ${data?.error?.message || ''}`);
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
  const out = parseJSON(text);
  if (out.ok !== true) throw new Error('bad JSON: ' + text.slice(0, 80));
  return { word: out.word, modelVersion: data.modelVersion, note: data.modelVersion };
}

// --- OpenAI-compatible chat (Mistral, Cloudflare, OpenRouter, NVIDIA) ---
async function openaiCompat(baseUrl, key, model, parts, { jsonMode = true } = {}) {
  const content = parts.map((p) => ('text' in p ? { type: 'text', text: p.text } : { type: 'image_url', image_url: { url: `data:${p.mime};base64,${p.data}` } }));
  const body = { model, messages: [{ role: 'user', content }], temperature: 0.2, max_tokens: 200 };
  if (jsonMode) body.response_format = { type: 'json_object' };
  const r = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(45000),
  });
  const raw = await r.text();
  if (!r.ok) throw new Error(`HTTP ${r.status} ${raw.slice(0, 120)}`);
  const data = JSON.parse(raw);
  const text = data?.choices?.[0]?.message?.content || '';
  const out = parseJSON(text);
  if (out.ok !== true) throw new Error('bad JSON: ' + text.slice(0, 80));
  return { word: out.word ?? out.color, note: jsonMode ? 'json_object' : 'plain' };
}
// Try JSON mode first, fall back to plain parsing (some Cloudflare models reject response_format).
async function openaiCompatAuto(baseUrl, key, model, parts) {
  try { return await openaiCompat(baseUrl, key, model, parts, { jsonMode: true }); }
  catch (err) {
    if (!/HTTP 4(00|22)/.test(err.message)) throw err;
    return await openaiCompat(baseUrl, key, model, parts, { jsonMode: false });
  }
}

const TEXT = [{ text: PROMPT }];
const VISION = [{ text: VISION_PROMPT }, { mime: 'image/png', data: PNG_B64 }];

async function main() {
  console.log(`Gemini keys: ${geminiKeys.length} | Mistral: ${mistralKey ? 'yes' : 'no'} | OpenRouter: ${openRouterKey ? 'yes' : 'no'} | NVIDIA: ${nvidiaKey ? 'yes' : 'no'} | Cloudflare: ${cfAccount && cfToken ? 'yes' : 'no'}\n`);

  for (const model of GEMINI_MODELS) {
    for (let i = 0; i < geminiKeys.length; i++) {
      await probe({ provider: 'gemini', model, key: i + 1, task: 'text' }, () => gemini(geminiKeys[i], model, TEXT));
    }
  }
  if (geminiKeys[0]) await probe({ provider: 'gemini', model: 'gemini-flash-latest', key: 1, task: 'vision' }, () => gemini(geminiKeys[0], 'gemini-flash-latest', VISION));

  if (mistralKey) {
    const base = 'https://api.mistral.ai/v1';
    for (const model of MISTRAL_MODELS) { await probe({ provider: 'mistral', model, task: 'text' }, () => openaiCompat(base, mistralKey, model, TEXT)); await sleep(3000); }
    for (const model of MISTRAL_VISION) { await probe({ provider: 'mistral', model, task: 'vision' }, () => openaiCompat(base, mistralKey, model, VISION)); await sleep(3000); }
  }

  if (cfAccount && cfToken) {
    const base = `https://api.cloudflare.com/client/v4/accounts/${cfAccount}/ai/v1`;
    for (const model of CF_TEXT) await probe({ provider: 'cloudflare', model, task: 'text' }, () => openaiCompatAuto(base, cfToken, model, TEXT));
    // llama-3.2-11b-vision needs a one-time license 'agree' prompt, deliberately not auto-accepted here.
    for (const model of CF_VISION.filter((m) => !m.includes('llama-3.2-11b-vision'))) await probe({ provider: 'cloudflare', model, task: 'vision' }, () => openaiCompatAuto(base, cfToken, model, VISION));
    if (WITH_IMAGES) {
      for (const model of CF_IMAGES) {
        await probe({ provider: 'cloudflare', model, task: 'image' }, async () => {
          const url = `https://api.cloudflare.com/client/v4/accounts/${cfAccount}/ai/run/${model}`;
          const scene = 'a friendly cartoon school building, no text';
          let r;
          if (model.includes('flux-2')) {
            // flux-2 models take multipart/form-data instead of JSON.
            const fd = new FormData();
            fd.append('prompt', scene); fd.append('width', '1024'); fd.append('height', '768');
            r = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${cfToken}` }, body: fd, signal: AbortSignal.timeout(60000) });
          } else {
            r = await fetch(url, {
              method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfToken}` },
              body: JSON.stringify({ prompt: scene, steps: 4 }), signal: AbortSignal.timeout(60000),
            });
          }
          const ct = r.headers.get('content-type') || '';
          if (!r.ok) throw new Error(`HTTP ${r.status} ${(await r.text()).slice(0, 120)}`);
          if (ct.startsWith('image/')) { const b = Buffer.from(await r.arrayBuffer()); return { note: `binary ${ct} ${b.length}B` }; }
          const data = await r.json();
          const b64 = data?.result?.image;
          if (!b64) throw new Error('no image in JSON: ' + JSON.stringify(data).slice(0, 100));
          return { note: `json b64 ${Buffer.from(b64, 'base64').length}B` };
        });
      }
    }
  }

  if (openRouterKey) {
    for (const model of OPENROUTER_MODELS) await probe({ provider: 'openrouter', model, task: 'text' }, () => openaiCompat('https://openrouter.ai/api/v1', openRouterKey, model, TEXT));
  }
  if (nvidiaKey) {
    for (const model of NVIDIA_MODELS) await probe({ provider: 'nvidia', model, task: 'text' }, () => openaiCompat('https://integrate.api.nvidia.com/v1', nvidiaKey, model, TEXT));
  }

  if (WITH_IMAGES) {
    await probe({ provider: 'pollinations', model: 'flux', task: 'image' }, async () => {
      const r = await fetch(`https://image.pollinations.ai/prompt/${encodeURIComponent('a friendly cartoon school building, no text')}?width=512&height=384&nologo=true&safe=true&private=true&seed=7&model=flux`, { signal: AbortSignal.timeout(30000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const b = Buffer.from(await r.arrayBuffer());
      if (b.length < 1000) throw new Error('no image');
      return { note: `${b.length}B` };
    });
  }

  // Summary table: one row per (provider, model, task), passes per key.
  const groups = new Map();
  for (const r of results) {
    const k = `${r.task}|${r.provider}|${r.model}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(r);
  }
  const rows = [...groups.entries()].map(([k, rs]) => {
    const [task, provider, model] = k.split('|');
    const ok = rs.filter((r) => r.pass);
    const avg = ok.length ? Math.round(ok.reduce((s, r) => s + r.ms, 0) / ok.length) : '';
    const errs = [...new Set(rs.filter((r) => !r.pass).map((r) => r.status))].join('/');
    return { task, provider, model, verdict: ok.length === rs.length ? 'PASS' : ok.length ? 'PARTIAL' : 'FAIL', score: `${ok.length}/${rs.length}`, avg, errs };
  }).sort((a, b) => a.task.localeCompare(b.task) || ['PASS', 'PARTIAL', 'FAIL'].indexOf(a.verdict) - ['PASS', 'PARTIAL', 'FAIL'].indexOf(b.verdict));
  const md = ['| Task | Provider | Model | Verdict | Pass | Avg ms | Errors |', '|---|---|---|---|---|---|---|',
    ...rows.map((r) => `| ${r.task} | ${r.provider} | ${r.model} | ${r.verdict} | ${r.score} | ${r.avg} | ${r.errs} |`)].join('\n');
  console.log('\n' + md);
  const passed = results.filter((r) => r.pass).length;
  console.log(`\n${passed}/${results.length} calls passed`);
  writeFileSync(resolve(OUT), JSON.stringify({ date: new Date().toISOString(), results, rows }, null, 2));
  writeFileSync(resolve(OUT.replace(/\.json$/, '.md')), md + '\n');
  console.log(`written ${OUT}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
