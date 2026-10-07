# EVAL REPORT — 2026-10-07T05:30:13.517Z

Server: http://localhost:4000 | 2/13 cases passed (automatic checks only)

| Skill | Pass | Avg ms | Failures |
|---|---|---|---|
| generate-exercise | 2/3 | 61626 | request failed: The operation was aborted due to timeout |
| variant | 0/2 | 7099 | request failed: fetch failed |
| transform-exercise | 0/1 | 6 | request failed: fetch failed |
| explain-concept | 0/2 | 28 | request failed: fetch failed |
| draft-announcement | 0/2 | 10 | request failed: fetch failed |
| auto-tag-document | 0/1 | 10 | request failed: fetch failed |
| generate-full-exam | 0/1 | 9 | request failed: fetch failed |
| solve-exercise | 0/1 | 11 | request failed: fetch failed |

## Samples (for human pedagogy review — passing here does NOT mean the content is correct)

### generate-exercise — 1ère Année اللغة العربية — FAIL
(no content)

### generate-exercise — 3ème Année Mathématiques — PASS
```
حل مسألة رياضية: حساب المبلغ المتبقي
اشترى سليم من المكتبيّة محفظة بثمن 2450 ميليما وكراسا بثمن 850 ميليما. سلّم سليم للمكتبي قطعة مالية من فئة 5000 ميليم. احسب المبلغ الذي أرجعه المكتبي لسليم.
1) الثمن الجملي للمشتريات: 2450 + 850 = 3300 ميليما. 2) المبلغ الذي أرجعه المكتبي: 5000 - 3300 = 1700 ميليما.
```

### generate-exercise — 5ème Année Français — PASS
```
Rédiger un paragraphe narratif sur l’entraide à l’école
Imagine une situation où tes camarades s’entraident pendant une activité scolaire (par exemple, un projet de classe, un jeu de récréation, ou un devoir difficile). Écris un paragraphe narratif de 5 à 6 phrases qui raconte cette situation. Dans ton texte, utilise au moins trois adjectifs qualificatifs pour décrire les personnes, les actions ou les sentiments. Veille à ce que chaque verbe soit correctement accordé avec son sujet et à ce que t
```

### variant — 3ème Année Mathématiques AR — FAIL
(no content)

### variant — 5ème Année Mathématiques FR — FAIL
(no content)

### transform-exercise — 5ème Année Mathématiques FR — FAIL
(no content)

### explain-concept — 3ème Année Éveil Scientifique AR — FAIL
(no content)

### explain-concept — 5ème Année Mathématiques FR — FAIL
(no content)

### draft-announcement — devoir AR — FAIL
(no content)

### draft-announcement — devoir FR — FAIL
(no content)

### auto-tag-document — serie fractions — FAIL
(no content)

### generate-full-exam — 5ème Année Mathématiques FR — FAIL
(no content)

### solve-exercise — 5ème Année Mathématiques FR — FAIL
(no content)
