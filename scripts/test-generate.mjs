import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

async function main() {
  console.log('Sending request to Gemini 2.5 Flash...');
  const prompt = `أنت متفقد بيداغوجي للتعليم الأساسي بالجمهورية التونسية.
أنتج تمريناً تطبيقياً واحداً بصيغة JSON حصراً حول درس: حرف الميم (م) - لتلاميذ السنة الأولى أساسي (الثلاثي الأول).
الصيغة المطلوبة JSON فقط دون أي كود ماركداون:
{
  "title": "عنوان التمرين",
  "chapter": "الوحدة 1 : مدرستي وأسرتي",
  "subject": "اللغة العربية",
  "grade": "1ère Année",
  "trimester": "Trimestre 1",
  "promptText": "نص التمرين كاملاً مشكولاً بدقة لتلميذ في سن 6 سنوات",
  "options": ["خيار 1", "خيار 2", "خيار 3"],
  "correctAnswer": "الإجابة الصحيحة",
  "solutionText": "شرح الإصلاح بالتفصيل",
  "hints": ["تلميح مساعدة أول", "تلميح ثانٍ"],
  "points": 5
}`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
    }
  });

  console.log('--- RESULT FROM GEMINI ---');
  console.log(response.text);
}

main().catch(err => {
  console.error('Error details:', err);
});
