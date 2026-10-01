import puppeteer from 'puppeteer-core';
import { GoogleGenAI } from '@google/genai';
import { writeFileSync, readFileSync, existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const uploadsDir = join(process.cwd(), 'uploads', 'exercises');

if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}

// 4 Distinct Lessons & 4 Distinct Exercise Types
const TASKS = [
  {
    id: 'ex_baa_matching',
    letter: 'حرف الباء (ب)',
    type: 'الربط بالأسهم (Matching Syllables)',
    unit: 'الوحدة 1 : مدرستي وأسرتي',
    prompt: `أنت متفقد بيداغوجي للتعليم الأساسي بتونس.
أنتج تمريناً بَصَرِياً تفاعلياً لتلاميذ السنة الأولى أساسي: مادة اللغة العربية، الثلاثي الأول.
الدرس: حرف الباء (ب).
نوع التمرين: الربط بالأسهم بين الصورة والمقطع الصوتي المناسب (بَـ / بُـ / بِـ).
الصيغة المطلوبة JSON فقط دون ماركداون:
{
  "title": "أَرْبِطُ كُلَّ صُورَةٍ بِالمَقْطَعِ المُنَاسِبِ لِحَرْفِ البَاءِ [ب]",
  "instructions": "أَنْظُرُ إِلَى الصُّوَرِ، ثُمَّ أَرْبِطُ بِسَهْمٍ بَيْنَ كُلِّ صُورَةٍ وَالمَقْطَعِ الصَّوْتِيِّ الَّذِي يَبْدَأُ بِهِ اسْمُهَا.",
  "type": "matching",
  "items": [
    { "word": "بَقَرَةٌ", "syllable": "بَـ", "svgPrompt": "Cute friendly dairy cow for kindergarten, cartoon vector style, isolated on white background" },
    { "word": "بُرْتُقَالٌ", "syllable": "بُـ", "svgPrompt": "A single fresh bright orange fruit with green leaf, cartoon vector style, isolated on white background" },
    { "word": "بِنْتٌ", "syllable": "بِـ", "svgPrompt": "A cute happy 1st grade school girl smiling with backpack, cartoon vector style, isolated on white background" }
  ],
  "syllables": ["بَـ", "بُـ", "بِـ"],
  "solution": "بَقَرَةٌ ➔ [بَـ] (بَـقَرَةٌ) ، بُرْتُقَالٌ ➔ [بُـ] (بُـرْتُقَالٌ) ، بِنْتٌ ➔ [بِـ] (بِـنْتٌ).",
  "points": 6
}`
  },
  {
    id: 'ex_raa_odd_one_out',
    letter: 'حرف الراء (ر)',
    type: 'شطب الدخيل (Odd-One-Out)',
    unit: 'الوحدة 1 : مدرستي وأسرتي',
    prompt: `أنت متفقد بيداغوجي للتعليم الأساسي بتونس.
أنتج تمريناً بَصَرِياً لتلاميذ السنة الأولى أساسي: مادة اللغة العربية، الثلاثي الأول.
الدرس: حرف الراء (ر).
نوع التمرين: شطب الدخيل (العثور على الصورة التي لا تحتوي على حرف الراء وشطبها بعلامة X).
الصيغة المطلوبة JSON فقط دون ماركداون:
{
  "title": "أَشْطُبُ الصُّورَةَ الدَّخِيلَةَ الَّتِي لَا تَحْتَوِي عَلَى حَرْفِ الرَّاءِ [ر]",
  "instructions": "أَسْتَمِعُ إِلَى أَسْمَاءِ الصُّوَرِ جَيِّداً، ثُمَّ أَضَعُ عَلَامَةَ (X) عَلَى الصُّورَةِ الَّتِي لَا أَسْمَعُ فِي اسْمِهَا حَرْفَ الرَّاءِ [ر].",
  "type": "odd_one_out",
  "items": [
    { "word": "رِيشَةٌ", "hasLetter": true, "svgPrompt": "A colorful soft bird feather for children, vector cartoon style, isolated on white background" },
    { "word": "خَرُوفٌ", "hasLetter": true, "svgPrompt": "A cute fluffy woolly white sheep for kids, vector cartoon style, isolated on white background" },
    { "word": "كَلْبٌ", "hasLetter": false, "svgPrompt": "A cute friendly golden puppy dog sitting, cartoon vector style, isolated on white background" },
    { "word": "رُمَّانٌ", "hasLetter": true, "svgPrompt": "A fresh whole red pomegranate fruit with crown, cartoon vector style, isolated on white background" }
  ],
  "intruder": "كَلْبٌ",
  "solution": "الصُّورَةُ الدَّخِيلَةُ هِيَ 'كَلْبٌ' لِأَنَّ اسْمَهَا لَا يَحْتَوِي عَلَى صَوْتِ حَرْفِ الرَّاءِ [ر]، بَيْنَمَا بَقِيَّةُ الكَلِمَاتِ تَتَضَمَّنُ الرَّاءَ.",
  "points": 5
}`
  },
  {
    id: 'ex_daal_puzzle',
    letter: 'حرف الدال (د)',
    type: 'تركيب المقاطع (Syllable Building)',
    unit: 'الوحدة 1 : مدرستي وأسرتي',
    prompt: `أنت متفقد بيداغوجي للتعليم الأساسي بتونس.
أنتج تمريناً بَصَرِياً لتلاميذ السنة الأولى أساسي: مادة اللغة العربية، الثلاثي الأول.
الدرس: حرف الدال (د).
نوع التمرين: تركيب مقاطع صوتية لبناء كلمات ذات معنى تتوافق مع الصورة التوضيحية.
الصيغة المطلوبة JSON فقط دون ماركداون:
{
  "title": "أُرَكِّبُ المَقَاطِعَ الصَّوْتِيَّةَ لِأُكَوِّنَ اسْمَ كُلِّ صُورَةٍ",
  "instructions": "أَنْظُرُ إِلَى الصُّورَةِ، ثُمَّ أُجَمِّعُ المَقَاطِعَ المُعْطَاةَ لِكِتَابَةِ الكَلِمَةِ الصَّحِيحَةِ فِي الإِطَارِ.",
  "type": "syllable_puzzle",
  "items": [
    { "word": "دَارٌ", "parts": ["دَا", "رٌ"], "svgPrompt": "A cozy small colorful house with red roof and chimney for 1st graders, cartoon vector style, isolated on white background" },
    { "word": "دُبٌّ", "parts": ["دُ", "بٌّ"], "svgPrompt": "A cute brown teddy bear sitting happily, cartoon vector style, isolated on white background" },
    { "word": "دِيكٌ", "parts": ["دِي", "كٌ"], "svgPrompt": "A proud colorful rooster farm bird, bright red crest, cartoon vector style, isolated on white background" }
  ],
  "solution": "1. [دَا] + [رٌ] = دَارٌ | 2. [دُ] + [بٌّ] = دُبٌّ | 3. [دِي] + [كٌ] = دِيكٌ.",
  "points": 6
}`
  },
  {
    id: 'ex_seen_sound_circle',
    letter: 'حرف السين (س)',
    type: 'الوعي الصوتي والتمييز (Sound Identification)',
    unit: 'الوحدة 2 : حيي وقريتي وألعابي',
    prompt: `أنت متفقد بيداغوجي للتعليم الأساسي بتونس.
أنتج تمريناً بَصَرِياً لتلاميذ السنة الأولى أساسي: مادة اللغة العربية، الثلاثي الأول.
الدرس: حرف السين (س).
نوع التمرين: الوعي الصوتي (إحاطة الصور التي تحتوي على حرف السين).
الصيغة المطلوبة JSON فقط دون ماركداون:
{
  "title": "أُحِيطُ بِدَائِرَةٍ الصُّوَرَ الَّتِي أَسْمَعُ فِي اسْمِهَا حَرْفَ السِّينِ [س]",
  "instructions": "أَنْظُرُ إِلَى الصُّوَرِ، ثُمَّ أُحِيطُ فَقَطْ الصُّوَرَ الَّتِي تَبْدَأُ أَوْ تَحْتَوِي عَلَى صَوْتِ حَرْفِ السِّينِ [س].",
  "type": "sound_circle",
  "items": [
    { "word": "سَيَّارَةٌ", "hasLetter": true, "svgPrompt": "A cheerful red toy car for children, clean vector cartoon style, isolated on white background" },
    { "word": "سَمَكَةٌ", "hasLetter": true, "svgPrompt": "A cute colorful little fish swimming with smile, cartoon vector style, isolated on white background" },
    { "word": "شَمْسٌ", "hasLetter": false, "svgPrompt": "A smiling bright cartoon sun with rays, vector cartoon style, isolated on white background" },
    { "word": "سَاعَةٌ", "hasLetter": true, "svgPrompt": "A colorful friendly round wall clock for school classroom, cartoon vector style, isolated on white background" }
  ],
  "solution": "الصُّوَرُ الصَّحِيحَةُ هِيَ: سَيَّارَةٌ (سَـ)، سَمَكَةٌ (سَـ)، سَاعَةٌ (سَا). بَيْنَمَا 'شَمْسٌ' تَبْدَأُ بِحَرْفِ الشِّينِ.",
  "points": 5
}`
  }
];

function buildHtmlForExercise(task, data, svgMap) {
  let contentHtml = '';

  if (data.type === 'matching') {
    contentHtml = `
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 24px;">
        ${data.items.map(item => `
          <div class="card">
            <div class="img-box">${svgMap[item.word] || ''}</div>
            <div class="word">${item.word}</div>
            <div style="width: 16px; height: 16px; border-radius: 50%; background: #0284c7; margin: 10px auto 0;"></div>
          </div>
        `).join('')}
      </div>
      <div style="display: flex; justify-content: space-around; background: #e0f2fe; padding: 18px; border-radius: 14px; margin-bottom: 28px;">
        ${data.syllables.map(s => `
          <div style="text-align: center;">
            <div style="width: 16px; height: 16px; border-radius: 50%; background: #0284c7; margin: 0 auto 8px;"></div>
            <span style="font-size: 26px; font-weight: 800; color: #0369a1; background: white; padding: 8px 24px; border-radius: 12px; border: 2px solid #38bdf8; display: inline-block;">${s}</span>
          </div>
        `).join('')}
      </div>
    `;
  } else if (data.type === 'odd_one_out') {
    contentHtml = `
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px;">
        ${data.items.map(item => `
          <div class="card" style="position: relative;">
            <div class="img-box">${svgMap[item.word] || ''}</div>
            <div class="word">${item.word}</div>
            <div style="margin-top: 10px; width: 34px; height: 34px; border: 2px dashed #94a3b8; border-radius: 8px; margin: 10px auto 0; display: flex; align-items: center; justify-content: center; font-size: 18px; color: #cbd5e1;">[ ]</div>
          </div>
        `).join('')}
      </div>
    `;
  } else if (data.type === 'syllable_puzzle') {
    contentHtml = `
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 28px;">
        ${data.items.map(item => `
          <div class="card">
            <div class="img-box">${svgMap[item.word] || ''}</div>
            <div style="display: flex; gap: 8px; justify-content: center; margin-bottom: 12px;">
              ${item.parts.map(p => `
                <span style="background: #fef3c7; color: #b45309; font-size: 20px; font-weight: 800; padding: 4px 12px; border-radius: 8px; border: 1.5px solid #fde68a;">${p}</span>
              `).join('<span style="font-size: 20px; font-weight: bold; color: #94a3b8;">+</span>')}
            </div>
            <div style="border: 2px dashed #0284c7; background: #ffffff; border-radius: 10px; height: 42px; display: flex; align-items: center; justify-content: center; font-size: 18px; color: #94a3b8; font-weight: bold;">
              الكَلِمَةُ: ....................
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } else {
    // Sound circle
    contentHtml = `
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px;">
        ${data.items.map(item => `
          <div class="card">
            <div class="img-box">${svgMap[item.word] || ''}</div>
            <div class="word">${item.word}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <title>${data.title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #ffffff; padding: 24px; direction: rtl; }
    .sheet { max-width: 820px; margin: 0 auto; background: #ffffff; border: 2.5px solid #0284c7; border-radius: 20px; padding: 36px; box-shadow: 0 10px 25px rgba(2, 132, 199, 0.08); position: relative; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px dashed #94a3b8; padding-bottom: 16px; margin-bottom: 18px; font-weight: 700; color: #334155; font-size: 15px; }
    .tag-row { display: flex; gap: 8px; margin-bottom: 16px; }
    .badge { display: inline-block; background: #e0f2fe; color: #0369a1; padding: 6px 14px; border-radius: 999px; font-size: 13px; font-weight: bold; }
    .badge-amber { background: #fef3c7; color: #92400e; }
    .badge-green { background: #dcfce7; color: #166534; }
    .title { font-size: 23px; font-weight: 800; color: #0f172a; margin-bottom: 12px; }
    .instruction { font-size: 16px; font-weight: 600; color: #0369a1; background: #f0f9ff; border-right: 5px solid #0284c7; padding: 12px 18px; border-radius: 10px; margin-bottom: 24px; line-height: 1.6; }
    .card { border: 2px solid #e2e8f0; border-radius: 16px; padding: 14px 10px; text-align: center; background: #f8fafc; }
    .img-box { width: 120px; height: 120px; display: flex; align-items: center; justify-content: center; background: #ffffff; border-radius: 12px; padding: 8px; box-shadow: inset 0 2px 6px rgba(0,0,0,0.04); margin: 0 auto 12px; }
    .img-box svg { width: 100%; height: 100%; object-fit: contain; }
    .word { font-size: 21px; font-weight: 800; color: #1e293b; }
    .solution-box { background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 14px; padding: 16px; margin-top: 16px; }
    .solution-title { font-weight: 800; color: #15803d; font-size: 15px; margin-bottom: 6px; }
    .solution-text { color: #166534; font-size: 14.5px; line-height: 1.5; font-weight: 600; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #94a3b8; font-weight: bold; border-top: 1px solid #f1f5f9; padding-top: 10px; }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div>الجمهورية التونسية — وزارة التربية</div>
      <div>1ère Année — اللغة العربية</div>
      <div>العدد: ..... / ${data.points}</div>
    </div>
    <div class="tag-row">
      <span class="badge">${task.unit}</span>
      <span class="badge badge-amber">${task.letter}</span>
      <span class="badge badge-green">${task.type}</span>
    </div>
    <h1 class="title">${data.title}</h1>
    <div class="instruction">${data.instructions}</div>

    ${contentHtml}

    <div class="solution-box">
      <div class="solution-title">✅ عناصر الإصلاح والتوجيه البيداغوجي:</div>
      <div class="solution-text">${data.solution}</div>
    </div>
    <div class="footer">منصة مدرستي تونس (Madrasati TN) — بنك التمارين البصرية الرسمية</div>
  </div>
</body>
</html>`;
}

async function run() {
  console.log(`Starting batch generation for ${TASKS.length} distinct exercise worksheets...`);
  
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const generatedImages = [];

  for (let i = 0; i < TASKS.length; i++) {
    const task = TASKS[i];
    console.log(`\n[${i + 1}/${TASKS.length}] Generating: ${task.letter} - ${task.type}...`);

    // 1. Generate Exercise Data
    const genRes = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: task.prompt,
      config: { responseMimeType: 'application/json' }
    });
    const data = JSON.parse(genRes.text || '{}');

    // 2. Generate SVGs for items
    const svgMap = {};
    for (const item of data.items) {
      console.log(`   🎨 Drawing vector art: ${item.word}...`);
      const svgRes = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Create a clean, charming SVG vector illustration: ${item.svgPrompt}. Output ONLY raw SVG code starting with <svg and ending with </svg>. Use viewBox="0 0 200 200", clean smooth vibrant colors. No markdown.`
      });
      let cleanSvg = (svgRes.text || '').trim();
      if (cleanSvg.startsWith('```')) {
        cleanSvg = cleanSvg.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '').trim();
      }
      svgMap[item.word] = cleanSvg;
    }

    // 3. Render HTML to PNG image
    const fullHtml = buildHtmlForExercise(task, data, svgMap);
    const page = await browser.newPage();
    await page.setViewport({ width: 900, height: 1100, deviceScaleFactor: 2 });
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

    const finalImageFilename = `${task.id}_worksheet.png`;
    const finalImagePath = join(uploadsDir, finalImageFilename);

    const sheetElement = await page.$('.sheet');
    if (sheetElement) {
      await sheetElement.screenshot({ path: finalImagePath, type: 'png' });
    } else {
      await page.screenshot({ path: finalImagePath, type: 'png' });
    }
    await page.close();

    console.log(`   ✅ Finished worksheet PNG: ${finalImageFilename}`);
    generatedImages.push({
      id: task.id,
      letter: task.letter,
      type: task.type,
      filename: finalImageFilename,
      path: finalImagePath
    });
  }

  await browser.close();
  console.log('\n=======================================');
  console.log('ALL WORKSHEET IMAGES GENERATED SUCCESSFULLY:');
  console.log(JSON.stringify(generatedImages, null, 2));
}

run().catch(console.error);
