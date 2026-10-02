/**
 * Zero-hallucination pedagogy annotator for silent BD pages (أنيسي).
 *
 * Pillar 1 — keywords: Gemini Vision extracts 4–6 OBJECTS/ACTIONS/PLACES physically
 *            visible in the image (Arabic فصحى). No narrative, no character names.
 * Pillar 2 — structures: official grammar patterns per grade/trimester (static table
 *            below — curriculum-sourced, NEVER vision-generated).
 * Pillar 3 — verifiedBy: null (draft) until a teacher validates in the app.
 *
 * Idempotent: items that already have pedagogy.keywords are skipped.
 * Usage: node scripts/annotate-bd.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { GoogleGenAI, Type } from '@google/genai';

// --- Load GEMINI_API_KEY from .env (the app does not auto-load it) ---
const envPath = join(process.cwd(), '.env');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z_]+)\s*=\s*"?([^"]*)"?$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('GEMINI_API_KEY missing (.env)');
  process.exit(1);
}
const ai = new GoogleGenAI({ apiKey });

// --- Pillar 2: official oral-expression patterns (curriculum-sourced, drafts until teacher-verified) ---
const STRUCTURES = {
  '1ere-annee': {
    1: ['هَذَا / هَذِهِ', 'مَاذَا يَفْعَلُ؟ / مَاذَا تَفْعَلُ؟', 'فِي / عَلَى / تَحْتَ'],
    2: ['أَمَامَ / وَرَاءَ', 'يَذْهَبُ إِلَى / تَذْهَبُ إِلَى', 'هُنَا / هُنَاكَ'],
    3: ['كَانَ / أَصْبَحَ', 'لِمَاذَا؟ / لِأَنَّ', 'ثُمَّ / بَعْدَ ذَلِكَ'],
  },
};

const KEYWORDS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ['keywords'],
};

const PROMPT = `أنت نظام تعرف بصري دقيق لصور قصص صامتة موجهة لتلاميذ السنة الأولى ابتدائي في تونس.
استخرج من هذه الصورة 4 إلى 6 كلمات مفاتيح بالعربية الفصحى فقط:
- أشياء وأماكن وأفعال مرئية فعلاً في الصورة (مثال: حديقة، شجرة، نهر، يلعب، يركض).
- ممنوع منعاً باتاً: أسماء الشخصيات، القصة أو النوايا، أي شيء غير مرئي مباشرة.
- كل كلمة مفردة أو فعل مضارع بسيط، بدون تشكيل زائد.
أجب بصيغة JSON فقط: {"keywords": ["...", "..."]}`;

async function extractKeywords(imagePath) {
  const data = readFileSync(imagePath).toString('base64');
  const res = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      { inlineData: { mimeType: 'image/webp', data } },
      { text: PROMPT },
    ],
    config: { responseMimeType: 'application/json', responseSchema: KEYWORDS_SCHEMA, temperature: 0.1 },
  });
  const parsed = JSON.parse((res.text || '').trim());
  return Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 6) : [];
}

const index = JSON.parse(readFileSync('public/assets/resources/index.json', 'utf8'));
let annotated = 0, skipped = 0, failed = 0;

for (const manifestRel of index.manifests) {
  const manifestPath = join('public', manifestRel);
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  if (!manifest.items?.some((i) => i.topic === 'bandes-dessinees')) continue;

  let changed = false;
  for (const item of manifest.items) {
    if (item.topic !== 'bandes-dessinees') continue;
    if (item.pedagogy?.keywords?.length) { skipped++; continue; }

    const imagePath = join('public', item.relPath);
    try {
      const keywords = await extractKeywords(imagePath);
      if (keywords.length === 0) { failed++; continue; }
      item.pedagogy = {
        keywords,
        structures: STRUCTURES[item.grade]?.[item.trimester] ?? [],
        verifiedBy: null,
      };
      changed = true;
      annotated++;
      console.log(`${item.id}: ${keywords.join('، ')}`);
    } catch (err) {
      failed++;
      console.error(`${item.id}: FAILED — ${err.message}`);
    }
    // Write after every item so an interrupt loses nothing (idempotent resume).
    if (changed) writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  }
}

console.log(`\nannotated: ${annotated}, skipped (already done): ${skipped}, failed: ${failed}`);
