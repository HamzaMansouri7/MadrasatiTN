import puppeteer from 'puppeteer-core';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function renderHtmlToImage() {
  const jsonPath = join(process.cwd(), 'uploads', 'exercises', 'illustrated-exercise-sample.json');
  const outputPath = join(process.cwd(), 'uploads', 'exercises', 'exercise_meem_worksheet.png');

  if (!existsSync(jsonPath)) {
    throw new Error('illustrated-exercise-sample.json not found');
  }

  const exercise = JSON.parse(readFileSync(jsonPath, 'utf-8'));

  // Build HTML with INLINE SVGs for 100% reliable image rendering
  const itemsHtml = exercise.items.map(item => {
    let svgContent = '';
    const localSvgPath = join(process.cwd(), item.imagePath.replace(/^\//, ''));
    if (existsSync(localSvgPath)) {
      svgContent = readFileSync(localSvgPath, 'utf-8');
    }
    return `
      <div class="card">
        <div class="img-box">${svgContent}</div>
        <div class="word">${item.word}</div>
      </div>
    `;
  }).join('');

  const fullHtml = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <title>${exercise.title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #ffffff; padding: 24px; direction: rtl; }
    .sheet { max-width: 820px; margin: 0 auto; background: #ffffff; border: 2.5px solid #0284c7; border-radius: 20px; padding: 36px; box-shadow: 0 10px 25px rgba(2, 132, 199, 0.08); position: relative; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px dashed #94a3b8; padding-bottom: 16px; margin-bottom: 20px; font-weight: 700; color: #334155; font-size: 15px; }
    .tag-row { display: flex; gap: 8px; margin-bottom: 18px; }
    .badge { display: inline-block; background: #e0f2fe; color: #0369a1; padding: 6px 14px; border-radius: 999px; font-size: 13px; font-weight: bold; }
    .badge-amber { background: #fef3c7; color: #92400e; }
    .badge-green { background: #dcfce7; color: #166534; }
    .title { font-size: 24px; font-weight: 800; color: #0f172a; margin-bottom: 12px; }
    .instruction { font-size: 17px; font-weight: 600; color: #0369a1; background: #f0f9ff; border-right: 5px solid #0284c7; padding: 14px 18px; border-radius: 10px; margin-bottom: 28px; line-height: 1.6; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
    .card { border: 2px solid #e2e8f0; border-radius: 16px; padding: 16px 12px; text-align: center; background: #f8fafc; display: flex; flex-direction: column; align-items: center; justify-content: space-between; }
    .img-box { width: 130px; height: 130px; display: flex; align-items: center; justify-content: center; background: #ffffff; border-radius: 12px; padding: 10px; box-shadow: inset 0 2px 6px rgba(0,0,0,0.04); margin-bottom: 14px; }
    .img-box svg { width: 100%; height: 100%; object-fit: contain; }
    .word { font-size: 22px; font-weight: 800; color: #1e293b; }
    .solution-box { background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 14px; padding: 18px; }
    .solution-title { font-weight: 800; color: #15803d; font-size: 16px; margin-bottom: 6px; }
    .solution-text { color: #166534; font-size: 15px; line-height: 1.5; font-weight: 600; }
    .footer { text-align: center; margin-top: 24px; font-size: 13px; color: #94a3b8; font-weight: bold; border-top: 1px solid #f1f5f9; padding-top: 12px; }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div>الجمهورية التونسية — وزارة التربية</div>
      <div>${exercise.classification.grade} — ${exercise.classification.subject}</div>
      <div>العدد: ..... / ${exercise.points}</div>
    </div>
    <div class="tag-row">
      <span class="badge">${exercise.classification.unit}</span>
      <span class="badge badge-amber">${exercise.classification.lesson}</span>
      <span class="badge badge-green">${exercise.classification.competency}</span>
    </div>
    <h1 class="title">${exercise.title}</h1>
    <div class="instruction">${exercise.instructions}</div>

    <div class="grid">
      ${itemsHtml}
    </div>

    <div class="solution-box">
      <div class="solution-title">✅ عناصر الإصلاح وسلم التقييم:</div>
      <div class="solution-text">${exercise.solution}</div>
    </div>
    <div class="footer">منصة مدرستي تونس (Madrasati TN) — بنك التمارين البصرية الرسمية</div>
  </div>
</body>
</html>`;

  // Write finalized standalone HTML file
  const standaloneHtmlPath = join(process.cwd(), 'uploads', 'exercises', 'exercise-preview-inline.html');
  writeFileSync(standaloneHtmlPath, fullHtml, 'utf-8');

  console.log('Launching Edge via Puppeteer to capture retina PNG image...');
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 900, height: 1100, deviceScaleFactor: 2 });
  await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

  const sheetElement = await page.$('.sheet');
  if (sheetElement) {
    await sheetElement.screenshot({ path: outputPath, type: 'png' });
  } else {
    await page.screenshot({ path: outputPath, type: 'png' });
  }

  await browser.close();
  console.log(`SUCCESS: Created high-resolution image at ${outputPath}`);
}

renderHtmlToImage().catch(console.error);
