// Quality probe: same real task for every model that passed probe-models.mjs, outputs saved for review.
// Text: Arabic school exercise (grade 3 math) in JSON. Images: one pedagogical scene per generator.
// Usage: node scripts/probe-quality.mjs <outDir>
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const OUT = resolve(process.argv[2] || 'scripts/quality-out');
mkdirSync(OUT, { recursive: true });
try {
  for (const line of readFileSync(resolve('.env'), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
} catch { /* rely on shell */ }

const gKey = [...new Set(Object.entries(process.env).filter(([k, v]) => k.startsWith('GEMINI_API_KEY') && v).flatMap(([, v]) => v.split(',')).map((s) => s.trim()).filter(Boolean))][0];
const { MISTRAL_API_KEY: mKey, OPENROUTER_API_KEY: oKey, CLOUDFLARE_ACCOUNT_ID: cfId, CLOUDFLARE_API_TOKEN: cfTok } = process.env;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const PROMPT = `أنت معلم تونسي للسنة الثالثة من التعليم الأساسي. أنتج تمرين رياضيات واحدا حول جمع وطرح الأعداد الأقل من 1000 بصيغة JSON فقط:
{"title": "...", "promptText": "نص التمرين بثلاثة أسئلة مرقمة بأعداد واضحة", "solutionText": "الإصلاح المفصل بالحساب الصحيح لكل سؤال", "hints": ["تلميح", "تلميح"], "points": 10}
اكتب كل النصوص بالعربية الفصحى المدرسية.`;

const SCENE = 'friendly cartoon illustration for children: a smiling teacher and three pupils counting apples in a bright classroom, flat colors, clean lines, no text, no numbers';

const parse = (t) => {
  const s = String(t || '').replace(/```json/gi, '').replace(/```/g, '').trim();
  const a = s.indexOf('{');
  return JSON.parse(a > 0 ? s.slice(a, s.lastIndexOf('}') + 1) : s);
};
async function retry(fn) {
  try { return await fn(); } catch (e) {
    if (!/HTTP (429|503)/.test(String(e.message))) throw e;
    await sleep(5000); return fn();
  }
}
const chat = (base, key, model, jsonMode = true) => async () => {
  const body = { model, messages: [{ role: 'user', content: PROMPT }], temperature: 0.4, max_tokens: 1500 };
  if (jsonMode) body.response_format = { type: 'json_object' };
  const r = await fetch(`${base}/chat/completions`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` }, body: JSON.stringify(body), signal: AbortSignal.timeout(90000) });
  const raw = await r.text();
  if (!r.ok) throw new Error(`HTTP ${r.status} ${raw.slice(0, 100)}`);
  return JSON.parse(raw).choices?.[0]?.message?.content || '';
};
const gem = (model) => async () => {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': gKey },
    body: JSON.stringify({ contents: [{ parts: [{ text: PROMPT }] }], generationConfig: { responseMimeType: 'application/json', temperature: 0.4 } }), signal: AbortSignal.timeout(90000),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(`HTTP ${r.status} ${d?.error?.message || ''}`.slice(0, 120));
  return d.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
};

const cfBase = `https://api.cloudflare.com/client/v4/accounts/${cfId}/ai/v1`;
const TEXT = [
  ['gemini', 'gemini-flash-lite-latest', gem('gemini-flash-lite-latest')],
  ['gemini', 'gemini-3.5-flash-lite', gem('gemini-3.5-flash-lite')],
  ['gemini', 'gemini-3.1-flash-lite', gem('gemini-3.1-flash-lite')],
  ['gemini', 'gemini-3.6-flash', gem('gemini-3.6-flash')],
  ['gemini', 'gemini-3.7-flash', gem('gemini-3.7-flash')],
  ['gemini', 'gemini-3.5-flash', gem('gemini-3.5-flash')],
  ['cloudflare', 'llama-3.3-70b-instruct-fp8-fast', chat(cfBase, cfTok, '@cf/meta/llama-3.3-70b-instruct-fp8-fast')],
  ['cloudflare', 'gpt-oss-120b', chat(cfBase, cfTok, '@cf/openai/gpt-oss-120b')],
  ['cloudflare', 'qwen3-30b-a3b-fp8', chat(cfBase, cfTok, '@cf/qwen/qwen3-30b-a3b-fp8')],
  ['cloudflare', 'mistral-small-3.1-24b', chat(cfBase, cfTok, '@cf/mistralai/mistral-small-3.1-24b-instruct')],
  ['cloudflare', 'llama-4-scout-17b', chat(cfBase, cfTok, '@cf/meta/llama-4-scout-17b-16e-instruct')],
  ['mistral', 'ministral-14b-latest', chat('https://api.mistral.ai/v1', mKey, 'ministral-14b-latest')],
  ['openrouter', 'nemotron-3-super-120b', chat('https://openrouter.ai/api/v1', oKey, 'nvidia/nemotron-3-super-120b-a12b:free')],
  ['openrouter', 'nemotron-3-ultra-550b', chat('https://openrouter.ai/api/v1', oKey, 'nvidia/nemotron-3-ultra-550b-a55b:free')],
];

const arRatio = (s) => { const letters = s.replace(/[^\p{L}]/gu, ''); return letters ? (letters.match(/[؀-ۿ]/g) || []).length / letters.length : 0; };

const textResults = [];
for (const [provider, model, fn] of TEXT) {
  const t0 = Date.now();
  try {
    const raw = await retry(fn);
    const ms = Date.now() - t0;
    let o = null; let validJson = true;
    try { o = parse(raw); } catch { validJson = false; }
    const all = o ? [o.title, o.promptText, o.solutionText, ...(o.hints || [])].filter(Boolean).join(' ') : raw;
    const res = {
      provider, model, ms, validJson,
      fields: o ? ['title', 'promptText', 'solutionText', 'hints', 'points'].filter((k) => o[k] != null && o[k] !== '').length : 0,
      arabic: Math.round(arRatio(all) * 100),
      chars: all.length,
      output: o || raw.slice(0, 1500),
    };
    textResults.push(res);
    console.log(`OK   ${provider} ${model} ${ms}ms json=${validJson} fields=${res.fields}/5 ar=${res.arabic}% chars=${res.chars}`);
  } catch (e) {
    textResults.push({ provider, model, error: String(e.message).slice(0, 120) });
    console.log(`FAIL ${provider} ${model} ${e.message.slice(0, 100)}`);
  }
  await sleep(provider === 'mistral' ? 3000 : 400);
}
writeFileSync(join(OUT, 'quality-text.json'), JSON.stringify(textResults, null, 2));

// --- images ---
const IMG = [
  ['cloudflare', 'flux-1-schnell', async () => { const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfId}/ai/run/@cf/black-forest-labs/flux-1-schnell`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfTok}` }, body: JSON.stringify({ prompt: SCENE, steps: 4 }), signal: AbortSignal.timeout(90000) }); if (!r.ok) throw new Error(`HTTP ${r.status}`); return Buffer.from((await r.json()).result.image, 'base64'); }],
  ['cloudflare', 'lucid-origin', async () => { const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfId}/ai/run/@cf/leonardo/lucid-origin`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfTok}` }, body: JSON.stringify({ prompt: SCENE }), signal: AbortSignal.timeout(90000) }); if (!r.ok) throw new Error(`HTTP ${r.status}`); return Buffer.from((await r.json()).result.image, 'base64'); }],
  ['cloudflare', 'sdxl-lightning', async () => { const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfId}/ai/run/@cf/bytedance/stable-diffusion-xl-lightning`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfTok}` }, body: JSON.stringify({ prompt: SCENE }), signal: AbortSignal.timeout(90000) }); if (!r.ok) throw new Error(`HTTP ${r.status}`); return Buffer.from(await r.arrayBuffer()); }],
  ...['flux-2-klein-4b', 'flux-2-klein-9b'].map((m) => ['cloudflare', m, async () => { const fd = new FormData(); fd.append('prompt', SCENE); fd.append('width', '1024'); fd.append('height', '768'); const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfId}/ai/run/@cf/black-forest-labs/${m}`, { method: 'POST', headers: { Authorization: `Bearer ${cfTok}` }, body: fd, signal: AbortSignal.timeout(90000) }); if (!r.ok) throw new Error(`HTTP ${r.status}`); const d = await r.json(); return Buffer.from(d.result.image, 'base64'); }]),
  ['pollinations', 'flux', async () => { const r = await fetch(`https://image.pollinations.ai/prompt/${encodeURIComponent(SCENE)}?width=1024&height=768&nologo=true&safe=true&private=true&seed=11&model=flux`, { signal: AbortSignal.timeout(60000) }); if (!r.ok) throw new Error(`HTTP ${r.status}`); return Buffer.from(await r.arrayBuffer()); }],
];
for (const [provider, model, fn] of IMG) {
  const t0 = Date.now();
  try {
    const b = await retry(fn);
    const ext = b[0] === 0x89 ? 'png' : b[0] === 0xff ? 'jpg' : 'webp';
    const file = join(OUT, `img-${provider}-${model}.${ext}`);
    writeFileSync(file, b);
    console.log(`IMG  ${provider} ${model} ${Date.now() - t0}ms ${b.length}B -> ${file}`);
  } catch (e) { console.log(`IMG FAIL ${provider} ${model} ${e.message.slice(0, 100)}`); }
}
