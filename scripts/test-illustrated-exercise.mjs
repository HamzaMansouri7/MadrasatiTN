import { GoogleGenAI } from '@google/genai';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

const outputDir = join(process.cwd(), 'uploads', 'exercises');
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

async function generateIllustratedExercise() {
  console.log('1. Generating structured, classified exercise...');
  const prompt = `أنت متفقد بيداغوجي للتعليم الأساسي بالجمهورية التونسية.
أنتج تمريناً بَصَرِياً مصوراً لتلاميذ السنة الأولى أساسي - الثلاثي الأول - مادة اللغة العربية.
الدرس: حرف الميم (م).
التصنيف المطلوب:
- السنة: 1ère Année
- المادة: اللغة العربية
- الثلاثي: Trimestre 1
- الوحدة: الوحدة 1 (مدرستي وأسرتي)
- المهارة: الوعي الصوتي البصري (ربط الصورة بالصوت)

الصيغة المطلوبة JSON حصراً:
{
  "classification": {
    "grade": "1ère Année",
    "subject": "اللغة العربية",
    "trimester": "Trimestre 1",
    "unit": "الوحدة 1 : مدرستي وأسرتي",
    "lesson": "حرف الميم (م)",
    "competency": "الوعي الصوتي والبصري"
  },
  "title": "أُحِيطُ الصُّورَةَ الَّتِي أَسْمَعُ فِي اسْمِهَا حَرْفَ المِيمِ [م]",
  "instructions": "أَنْظُرُ إِلَى الصُّوَرِ، ثُمَّ أُحِيطُ بِدَائِرَةٍ حَمْرَاءَ الصُّوَرَ الَّتِي تَبْدَأُ بِحَرْفِ المِيمِ [م].",
  "items": [
    {
      "id": "item-1",
      "word": "مَوْزٌ",
      "hasTargetLetter": true,
      "svgPrompt": "A single cute, friendly ripe yellow banana for kindergarten children, clean vector cartoon style, thick outlines, isolated on white background"
    },
    {
      "id": "item-2",
      "word": "قَلَمٌ",
      "hasTargetLetter": true,
      "svgPrompt": "A colorful friendly school pencil/pen for 1st grade students, cute cartoon vector style, isolated on white background"
    },
    {
      "id": "item-3",
      "word": "بَابٌ",
      "hasTargetLetter": false,
      "svgPrompt": "A simple cute wooden school door, cartoon vector style, isolated on white background"
    },
    {
      "id": "item-4",
      "word": "مِقَصٌّ",
      "hasTargetLetter": true,
      "svgPrompt": "A cute safe kid scissors for school crafts, red and yellow, cartoon vector style, isolated on white background"
    }
  ],
  "correctAnswers": ["مَوْزٌ", "قَلَمٌ", "مِقَصٌّ"],
  "solution": "الصُّوَرُ الصَّحِيحَةُ هِيَ: مَوْزٌ (مَـ)، قَلَمٌ (ـمٌ)، مِقَصٌّ (مِـ). بَيْنَمَا 'بَابٌ' يَبْدَأُ بِحَرْفِ البَاءِ.",
  "points": 5
}`;

  const res = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });

  const exercise = JSON.parse(res.text || '{}');
  console.log('Classification:', exercise.classification);
  console.log(`Exercise has ${exercise.items?.length || 0} illustrated items.`);

  // Generate vector SVG illustrations for the items
  for (const item of exercise.items) {
    console.log(`2. Generating visual illustration for: ${item.word}...`);
    const svgRes = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Create a clean, charming SVG illustration: ${item.svgPrompt}.
Output ONLY raw valid SVG code starting with <svg and ending with </svg>.
Use viewBox="0 0 200 200", smooth vibrant child-friendly colors, thick clean strokes. No markdown formatting.`,
    });

    let rawSvg = (svgRes.text || '').trim();
    if (rawSvg.startsWith('```')) {
      rawSvg = rawSvg.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '').trim();
    }

    const svgFilename = `item_${item.id}_${Date.now()}.svg`;
    const svgPath = join(outputDir, svgFilename);
    writeFileSync(svgPath, rawSvg, 'utf-8');
    item.imagePath = `/uploads/exercises/${svgFilename}`;
  }

  // Save the full illustrated exercise JSON
  const finalPath = join(outputDir, 'illustrated-exercise-sample.json');
  writeFileSync(finalPath, JSON.stringify(exercise, null, 2), 'utf-8');

  // Also create a standalone HTML sheet to preview immediately
  const htmlPreview = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <title>${exercise.title}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8fafc; padding: 20px; direction: rtl; }
    .sheet { max-width: 800px; margin: 0 auto; background: white; border: 2px solid #e2e8f0; border-radius: 16px; padding: 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
    .header { display: flex; justify-content: space-between; border-bottom: 2px dashed #cbd5e1; padding-bottom: 16px; margin-bottom: 24px; font-weight: bold; color: #475569; }
    .title { font-size: 22px; color: #1e293b; margin-bottom: 8px; }
    .instruction { font-size: 17px; color: #0284c7; background: #f0f9ff; padding: 12px 16px; border-radius: 8px; margin-bottom: 24px; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
    .card { border: 2px solid #e2e8f0; border-radius: 12px; padding: 12px; text-align: center; background: #ffffff; transition: transform 0.2s; }
    .card svg, .card img { width: 120px; height: 120px; display: block; margin: 0 auto 12px; }
    .word { font-size: 20px; font-weight: bold; color: #334155; }
    .solution-box { background: #f0fdf4; border: 1px solid #86efac; border-radius: 12px; padding: 16px; margin-top: 24px; }
    .solution-title { font-weight: bold; color: #166534; margin-bottom: 8px; }
    .solution-text { color: #15803d; font-size: 15px; }
    .badge { display: inline-block; background: #e0e7ff; color: #4338ca; padding: 4px 10px; border-radius: 999px; font-size: 13px; }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div>الجمهورية التونسية — وزارة التربية</div>
      <div>${exercise.classification.grade} — ${exercise.classification.subject}</div>
      <div>العدد: .... / ${exercise.points}</div>
    </div>
    <div style="margin-bottom: 12px;">
      <span class="badge">${exercise.classification.unit}</span>
      <span class="badge" style="background:#fef3c7; color:#92400e;">${exercise.classification.lesson}</span>
      <span class="badge" style="background:#dcfce7; color:#166534;">${exercise.classification.competency}</span>
    </div>
    <h1 class="title">${exercise.title}</h1>
    <div class="instruction">${exercise.instructions}</div>

    <div class="grid">
      ${exercise.items.map(item => `
        <div class="card">
          <div style="height:120px; display:flex; align-items:center; justify-content:center;">
            <img src="${item.imagePath}" alt="${item.word}" style="max-height:100%; max-width:100%;" />
          </div>
          <div class="word">${item.word}</div>
        </div>
      `).join('')}
    </div>

    <div class="solution-box">
      <div class="solution-title">✅ عناصر الإصلاح وسلم التقييم:</div>
      <div class="solution-text">${exercise.solution}</div>
    </div>
  </div>
</body>
</html>`;

  writeFileSync(join(outputDir, 'exercise-preview.html'), htmlPreview, 'utf-8');
  console.log('SUCCESS: Generated illustrated exercise and preview HTML at uploads/exercises/exercise-preview.html');
}

generateIllustratedExercise().catch(console.error);
