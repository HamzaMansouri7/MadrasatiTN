import { call, env } from './lib.mjs';
const keys = { key1: env.GEMINI_API_KEY, key2: env.GEMINI_API_KEY_2, key3: env.GEMINI_API_KEY_3 };
const models = ['gemini-flash-lite-latest', 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemma-4-26b-a4b-it', 'gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-3.8-flash'];
for (const [kn, k] of Object.entries(keys)) {
  const row = [];
  for (const m of models) {
    const r = await call({ id: m, provider: 'gemini', model: m }, 'Reply with JSON {"ok":true}', undefined, { geminiKey: k, timeoutMs: 40000 });
    row.push(`${m.replace('gemini-', '')}:${r.ok ? 'OK' : (r.err.match(/HTTP (\d+)/)?.[1] || 'ERR')}`);
  }
  console.log(kn, row.join('  '));
}
