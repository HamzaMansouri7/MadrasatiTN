/**
 * Zero-hallucination pedagogy annotator for silent BD pages (Arabic & French).
 *
 * Pillar 1 — keywords: Gemini Vision extracts 4–6 OBJECTS/ACTIONS/PLACES physically
 *            visible in the image (Arabic / French). No narrative, no character names.
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

// --- Load GEMINI_API_KEY from .env ---
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
  '2eme-annee': {
    1: ['هَذَا / هَذِهِ', 'فِي / عَلَى / أَمَامَ / وَرَاءَ', 'مَاذَا يَفْعَلُ؟ / مَاذَا تَفْعَلُ؟'],
    2: ['يَذْهَبُ إِلَى / يَرْجِعُ مِنْ', 'لِمَاذَا؟ / لِأَنَّ', 'كَانَ / أَصْبَحَ', 'كَمْ / كَيْفَ'],
    3: ['ثُمَّ / بَعْدَ ذَلِكَ', 'عِنْدَمَا / حِينَمَا', 'مَا أَجْمَلَ...!'],
  },
  '4eme-annee': {
    1: ["C'est / Ce sont...", 'dans / sur / sous / devant / derrière', 'Qui est-ce ? / Qu’est-ce que c’est ?'],
    2: ['pour + infinitif / parce que...', 'le matin / le soir / aujourd’hui', 'Il faut + infinitif'],
    3: ['d’abord / ensuite / puis / enfin', 'aimer / préférer / quel beau... !', 'Où... ? / Comment... ? / Pourquoi... ?'],
  },
  '5eme-annee': {
    1: ['Passé composé / Présent', 'Il y a... / près de / loin de', 'Adjectifs qualificatifs (accords)'],
    2: ['Il faut / Il ne faut pas / Devoir', 'plus... que / moins... que / aussi... que', 'donc / pour que'],
    3: ['Un jour / Tout à coup / Finalement', 'Si + présent...', 'trouver que / penser que'],
  },
};

const KEYWORDS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ['keywords'],
};

const PROMPT_AR = `أنت نظام تعرف بصري دقيق لصور قصص صامتة موجهة لتلاميذ المرحلة الابتدائية في تونس.
استخرج من هذه الصورة 4 إلى 6 كلمات مفاتيح بالعربية الفصحى فقط:
- أشياء وأماكن وأفعال مرئية فعلاً في الصورة (مثال: حديقة، شجرة، نهر، يلعب، يركض).
- ممنوع منعاً باتاً: أسماء الشخصيات، القصة أو النوايا، أي شيء غير مرئي مباشرة.
- كل كلمة مفردة أو فعل مضارع بسيط، بدون تشكيل زائد.
أجب بصيغة JSON فقط: {"keywords": ["...", "..."]}`;

const PROMPT_FR = `Tu es un système de reconnaissance visuelle précis pour des planches d'expression orale et bandes dessinées de l'école primaire en Tunisie.
Extrais de cette image 4 à 6 mots-clés en français uniquement :
- Objets, lieux et actions réellement visibles dans l'image (ex. : ballon, arbre, cour de récréation, jouer, courir).
- Strictement interdit : noms de personnages inventés, narration, intentions ou éléments non visibles.
- Chaque mot doit être un nom commun singulier/pluriel ou un verbe à l'infinitif/présent simple.
Réponds au format JSON uniquement : {"keywords": ["...", "..."]}`;

async function extractKeywords(imagePath, lang = 'ar') {
  const data = readFileSync(imagePath).toString('base64');
  const models = ['gemini-3.1-flash-lite', 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite-preview'];
  const prompt = lang === 'fr' ? PROMPT_FR : PROMPT_AR;

  for (const model of models) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await ai.models.generateContent({
          model,
          contents: [
            { inlineData: { mimeType: 'image/webp', data } },
            { text: prompt },
          ],
          config: { responseMimeType: 'application/json', responseSchema: KEYWORDS_SCHEMA, temperature: 0.1 },
        });
        const parsed = JSON.parse((res.text || '').trim());
        if (Array.isArray(parsed.keywords) && parsed.keywords.length > 0) {
          return parsed.keywords.slice(0, 6);
        }
      } catch (err) {
        await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
      }
    }
  }
  return [];
}

async function main() {
  const index = JSON.parse(readFileSync('public/assets/resources/index.json', 'utf8'));
  let annotated = 0, skipped = 0, failed = 0;

  for (const manifestRel of index.manifests) {
    const manifestPath = join('public', manifestRel);
    if (!existsSync(manifestPath)) continue;
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    if (!manifest.items?.some((i) => i.topic === 'bandes-dessinees')) continue;

    const itemsToProcess = manifest.items.filter(
      (item) => item.topic === 'bandes-dessinees' && !item.pedagogy?.keywords?.length
    );

    if (itemsToProcess.length === 0) {
      skipped += manifest.items.filter((i) => i.topic === 'bandes-dessinees').length;
      continue;
    }

    const CONCURRENCY = 5;
    for (let i = 0; i < itemsToProcess.length; i += CONCURRENCY) {
      const batch = itemsToProcess.slice(i, i + CONCURRENCY);
      await Promise.all(
        batch.map(async (item) => {
          const imagePath = join('public', item.relPath);
          try {
            const keywords = await extractKeywords(imagePath, item.lang || 'ar');
            if (keywords.length === 0) {
              failed++;
              return;
            }
            item.pedagogy = {
              keywords,
              structures: STRUCTURES[item.grade]?.[item.trimester] ?? [],
              verifiedBy: null,
            };
            annotated++;
            console.log(`${item.id} (${item.lang || 'ar'}): ${keywords.join(item.lang === 'fr' ? ', ' : '، ')}`);
          } catch (err) {
            failed++;
            console.error(`${item.id}: FAILED — ${err.message}`);
          }
        })
      );
      // Save manifest after each batch
      writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  console.log(`\nDone! Annotated: ${annotated}, Skipped (already done): ${skipped}, Failed: ${failed}`);
}

main();
