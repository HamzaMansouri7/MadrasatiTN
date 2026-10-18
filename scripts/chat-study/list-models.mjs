import fs from 'node:fs';
const env = {};
for (const l of fs.readFileSync(new URL('../../.env', import.meta.url), 'utf8').split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
}
const out = {};
const j = async (url, headers = {}) => {
  const r = await fetch(url, { headers, signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`${r.status} ${(await r.text()).slice(0, 120)}`);
  return r.json();
};
const run = async (name, fn) => { try { out[name] = await fn(); } catch (e) { out[name] = { error: String(e.message || e) }; } };

await run('gemini', async () => {
  const d = await j(`https://generativelanguage.googleapis.com/v1beta/models?pageSize=200&key=${env.GEMINI_API_KEY}`);
  return d.models.filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
    .map((m) => m.name.replace('models/', '')).filter((n) => !/image|tts|embed|aqa|veo|imagen|live|audio|robotics|computer/.test(n));
});
await run('nvidia', async () => {
  const d = await j('https://integrate.api.nvidia.com/v1/models', { Authorization: `Bearer ${env.NVIDIA_API_KEY}` });
  return d.data.map((m) => m.id).filter((n) => !/embed|rerank|vision|vl|clip|nvclip|parse|guard|safety|reward|retriev|asr|tts|speech|diffusion|flux|stable|cosmos|bge|paligemma|neva|kosmos|fuyu|deplot|riva|usdcode|esm|genmol|molmim/i.test(n));
});
await run('openrouter_free', async () => {
  const d = await j('https://openrouter.ai/api/v1/models');
  return d.data.filter((m) => m.pricing && Number(m.pricing.prompt) === 0 && Number(m.pricing.completion) === 0 && (m.architecture?.output_modalities || ['text']).join() === 'text')
    .map((m) => m.id);
});
await run('cloudflare', async () => {
  const d = await j(`https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/ai/models/search?task=Text%20Generation&per_page=100`, { Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}` });
  return d.result.map((m) => m.name);
});
await run('codecraft', async () => {
  const d = await j(`${env.CODECRAFT_BASE_URL || 'https://codecraftapi.com/v1'}/models`, { Authorization: `Bearer ${env.CODECRAFT_API_KEY}` });
  return d.data.map((m) => m.id);
});
fs.writeFileSync(new URL('./models-listing.json', import.meta.url), JSON.stringify(out, null, 2));
for (const [k, v] of Object.entries(out)) console.log(k, Array.isArray(v) ? v.length : v);
