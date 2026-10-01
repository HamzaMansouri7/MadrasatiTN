import { GoogleGenAI } from '@google/genai';
import { writeFileSync } from 'node:fs';

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

async function main() {
  const prompt = `أنت متفقد بيداغوجي للتعليم الأساسي بالجمهورية التونسية.
أنتج ورقة تمارين كاملة من 3 تمارين تطبيقية متنوعة لتلاميذ السنة الأولى أساسي - الثلاثي الأول - الوحدة 1 (مدرستي وأسرتي - حرف الميم وحرف الباء).
المطلوب JSON صالح 100% يحتوي على مصفوفة exercises:
{
  "unit": "الوحدة 1 : مدرستي وأسرتي",
  "subject": "اللغة العربية",
  "grade": "1ère Année",
  "trimester": "Trimestre 1",
  "exercises": [
    {
      "id": "ex-1",
      "type": "الوعي الصوتي",
      "title": "أتعرف صوت الحرف",
      "promptText": "نص التمرين مشكولاً بدقة",
      "options": ["خيار 1", "خيار 2", "خيار 3"],
      "correctAnswer": "الإجابة الصحيحة",
      "solutionText": "شرح الإصلاح",
      "points": 6
    },
    {
      "id": "ex-2",
      "type": "تركيب المقاطع",
      "title": "أركب مقاطع لأكون كلمة",
      "promptText": "نص التمرين مشكولاً بدقة",
      "options": ["خيار 1", "خيار 2", "خيار 3"],
      "correctAnswer": "الإجابة الصحيحة",
      "solutionText": "شرح الإصلاح",
      "points": 7
    },
    {
      "id": "ex-3",
      "type": "إنتاج كتابي وترتيب",
      "title": "أرتب كلمات لأبني جملة",
      "promptText": "نص التمرين مشكولاً بدقة",
      "options": ["خيار 1", "خيار 2", "خيار 3"],
      "correctAnswer": "الإجابة الصحيحة",
      "solutionText": "شرح الإصلاح",
      "points": 7
    }
  ]
}`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
    }
  });

  const data = JSON.parse(response.text || '{}');
  writeFileSync('scripts/last-generated-series.json', JSON.stringify(data, null, 2), 'utf-8');
  console.log('BATCH_GENERATION_SUCCESS');
  console.log(JSON.stringify(data, null, 2));
}

main().catch(console.error);
