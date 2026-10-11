import os
import sys
import json
from pathlib import Path
import fitz
from google import genai
from google.genai import types
from dotenv import load_dotenv

sys.stdout.reconfigure(encoding='utf-8')
load_dotenv()

key = os.getenv('GEMINI_API_KEY')
if not key:
    print("No GEMINI_API_KEY found")
    sys.exit(1)

client = genai.Client(api_key=key)

pdf_path = 'parascolaire/6eme/francais/Sagesse_6eme_Complet.pdf'
doc = fitz.open(pdf_path)
page = doc[4]  # page 5
pix = page.get_pixmap(dpi=200)
img_bytes = pix.tobytes('jpeg')
doc.close()

prompt = """Tu es un expert pédagogique tunisien du primaire.
Analyse cette page scannée d'un manuel parascolaire tunisien.
Extrais fidèlement tous les éléments (exercices, résumés de cours/règles, corrigés/solutions).
Pour chaque item:
- kind: 'exercise' | 'lesson' | 'answer'
- number: numéro de l'exercice ou ''
- instruction: consigne
- body: texte complet, phrases à compléter, questions
- figureDesc: description de schéma ou illustration si présente, sinon ''
- answer: réponse ou correction si présente dans la page, sinon null
- confidence: score de confiance OCR entre 0.0 et 1.0

Format attendu (JSON strict):
{
  "book": "sagesse_6eme_francais",
  "page": 5,
  "grade": "6ème Année",
  "subject": "Français",
  "topicGuess": "intitulé précis du thème ou de la leçon",
  "items": [
    {
      "kind": "exercise",
      "number": "1",
      "instruction": "...",
      "body": "...",
      "figureDesc": "",
      "answer": null,
      "confidence": 0.95
    }
  ]
}"""

print("Sending request to gemini-2.5-flash...")
resp = client.models.generate_content(
    model='gemini-3.8-flash',
    contents=[
        types.Part.from_bytes(data=img_bytes, mime_type='image/jpeg'),
        prompt
    ],
    config=types.GenerateContentConfig(
        response_mime_type='application/json'
    )
)

print("Response received!")
data = json.loads(resp.text)
print("Topic guess:", data.get('topicGuess'))
print("Items count:", len(data.get('items', [])))
for item in data.get('items', []):
    print(f"[{item.get('kind')}] No {item.get('number')}: {item.get('instruction')[:60]}... (conf: {item.get('confidence')})")
