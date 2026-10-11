# Opal test — parascolaire exercise generator

**Goal:** feed one real seed exercise from your library into Google Opal and have it generate new exercises in the same style, with corrections.

## Files
- Seed exercise: `parascolaire/opal_sample.json`
  (4ème · Mathématiques · Multiplication et multiples · `math-4-ch3` · with answer)

---

## The prompt (paste into Opal's prompt step)

```
You are a Tunisian primary-school maths teacher creating exercises for 4ème année
(CEB Tunisian curriculum). Arabic is the language of instruction; write every
exercise and its correction in fully-vowelled Modern Standard Arabic (التشكيل كامل),
exactly like the seed.

SEED EXERCISE (style, level and format to imitate):
{{seed}}

TASK:
Generate {{count}} NEW exercises on the theme "{{theme}}" for {{grade}}.
Rules:
- Same difficulty and same format as the seed ({{format}}).
- Change the numbers, names and context — never copy the seed's values.
- Numbers stay in the 4ème range (results under 1000).
- Tunisian context (دينار, مليم, Tunisian first names: أمين, فاطمة, ياسين…).
- For each exercise give: رقم, نصّ التمرين (the statement), then الحلّ (full worked correction).

OUTPUT: JSON array, each item {"number","statement_ar","answer_ar"}. No extra text.
```

Opal inputs to wire: `seed` = contents of `opal_sample.json`, `theme` = "Multiplication et multiples", `grade` = "4ème Année", `format` = "fill_blank", `count` = 5.

---

## Step-by-step in Opal (opal.withgoogle.com)

1. Sign in with your Google account → **Create new app** (blank).
2. Add an **Input** node for `count` (number, default 5). Optional inputs for `theme`/`grade` if you want to reuse across topics.
3. Add a **Text/Constant** node and paste the whole `opal_sample.json` content → name it `seed`.
4. Add a **Generate (LLM)** node. Paste the prompt above; map `{{seed}}`, `{{theme}}`, `{{grade}}`, `{{format}}`, `{{count}}` to the nodes.
5. Add an **Output** node showing the LLM result.
6. **Run**. Read the 5 generated exercises + corrections.

## What to judge
- Arabic correct and fully vowelled?
- Maths correct in الحلّ (do the arithmetic yourself on 1–2)?
- Numbers in 4ème range, Tunisian context respected?
- Format matches the seed?

If good → we scale: export a whole topic (or book) the same way and batch-generate.
If weak → tell me which part failed; we tune the prompt or switch the seed.
