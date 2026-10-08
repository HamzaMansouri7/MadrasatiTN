# Infographic Slot Prompting & User Editing Blueprint

## 1. How AI Prompts Generate Content for Slots
Every template in the registry acts as a strict contract. The backend skill builds a JSON schema directly from `template.slots`:

```typescript
// Auto-generated prompt instructions from template slots:
const prompt = `
Generate a structured educational infographic for the topic: "${topic}".
Output must be strict JSON matching this schema:
{
  "mainTitle": string (max 60 chars),
  "groupAIntro": string (max 200 chars),
  "groupBIntro": string (max 200 chars),
  "groupAMilestones": array of 5 items [{ percent: string, label: string }],
  "groupBMilestones": array of 5 items [{ percent: string, label: string }],
  "summaryStages": array of 3 items [{ phase: string, desc: string }]
}
Rules: Clear Tunisian curriculum terminology, Western digits (0-9), no text in image slots.
`;
```

---

## 2. User Editing & Per-Section Regeneration

### Mode A: Real-time Inline Typing (`contenteditable="true"`)
- Every text element is rendered as live HTML.
- Teachers can directly click, edit, add accents, or fix typos on any heading, bullet, or table cell.
- Changes are instantly synced to the internal document model (`doc.values`).

### Mode B: Targeted AI Regeneration ("إعادة توليد هذا القسم")
- If the user wants only one section rewritten (e.g. `summaryStages`), the client calls:
  `POST /api/ai/generate-infographic?section=summaryStages`
- The backend runs a mini-prompt for that single slot and replaces `doc.values.summaryStages` without modifying the rest of the infographic.

---

## 3. Storage & Print Output
- The filled document is stored as lightweight JSON `{ templateId, values, author }`.
- Print CSS (`@page { size: A4; margin: 0; }`) outputs razor-sharp vector graphics with 100% white margins and exact color retention.
