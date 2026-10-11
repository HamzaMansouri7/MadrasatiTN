# Bibliothèque parascolaire — Madrasati TN

Banque d’exercices du primaire tunisien (1ère à 6ème année), organisée par livre, classe, matière, thème, format et corrigé. Elle sert de matière de référence pour les trois moteurs: presets d’exercices, agent de rédaction, livres privés.

**17 livres · 899 pages · 3158 exercices · 2981 prêts (94%) · 761 avec corrigé (24%) · 1802 liés au programme officiel (57%)**

## Organisation

```
parascolaire/
  livres/<classe>/<livre>/book.json       fiche du livre (nom, classe, matière, totaux)
  livres/<classe>/<livre>/exercices.json  tous les exercices du livre, une ligne par exercice
  livres/<classe>/<livre>/pages/NNN.json  une page (texte, thème, qualité, liens)
  MATRIX.md                               matrices de repérage (classe, matière, thème, corrigé…)
  matrix.json                             mêmes chiffres, lisibles par les moteurs
  tools/build_matrix.py                   régénère MATRIX.md et matrix.json
  tools/build_readme.py                   régénère ce fichier
```

Tout est régénérable à partir de `livres/`. Les fichiers générés ne s’éditent pas à la main.

## Les livres

| Classe | Livre | Matière | Pages | Exercices | Prêts | Avec corrigé | Liés au programme |
|---|---|---|---|---|---|---|---|
| 1ère Année | Évaluations 1ère année — Maths & Arabe | Mathématiques | 72 | 240 | 240 | 0 | 211 |
| 2ème Année | Évaluations 2ème année — Toutes matières | Arabe | 58 | 224 | 215 | 0 | 63 |
| 3ème Année | Examens 3ème année — Toutes matières | Arabe | 71 | 251 | 237 | 0 | 94 |
| 4ème Année | Mathématiques 4ème année — Exercices et corrigés | Mathématiques | 140 | 528 | 489 | 322 | 344 |
| 4ème Année | Production écrite 4ème année — Arabe | Arabe | 39 | 47 | 46 | 0 | 15 |
| 5ème Année | Devoirs 5ème année — Trimestre 1, matières mixtes | Mathématiques | 51 | 23 | 20 | 1 | 17 |
| 5ème Année | Mathématiques 5ème année — Exercices corrigés | Mathématiques | 8 | 14 | 14 | 7 | 14 |
| 5ème Année | Mathématiques 5ème année — Exercices et évaluations | Mathématiques | 88 | 343 | 286 | 0 | 306 |
| 5ème Année | Éveil scientifique 5ème année — Évaluations | Éveil scientifique | 8 | 21 | 21 | 0 | 8 |
| 6ème Année | Concours 6ème année — Mathématiques (corrigés) | Mathématiques | 18 | 45 | 41 | 42 | 45 |
| 6ème Année | Concours blanc 6ème année — Éveil scientifique (corrigé) | Éveil scientifique | 3 | 10 | 10 | 9 | 10 |
| 6ème Année | Examen de lecture 6ème année — Arabe (corrigé) | Arabe | 6 | 21 | 21 | 11 | 3 |
| 6ème Année | Français 6ème année — Lire et s'exprimer | Français | 129 | 426 | 418 | 287 | 286 |
| 6ème Année | Grammaire arabe 6ème année — Cahier de règles | Arabe | 61 | 147 | 141 | 0 | 56 |
| 6ème Année | Soutien 6ème année — Maths et Français | Mathématiques | 132 | 646 | 619 | 73 | 162 |
| 6ème Année | Épreuve modèle 6ème année — Mathématiques (corrigée) | Mathématiques | 6 | 13 | 13 | 5 | 13 |
| 6ème Année | Éveil scientifique 6ème année — Cours et exercices | Éveil scientifique | 57 | 159 | 150 | 4 | 155 |
| **Total** | | | **899** | **3158** | **2981** | **761** | **1802** |

## Par classe

| Classe | Exercices | Prêts | Avec corrigé | Liés au programme |
|---|---|---|---|---|
| 1ère Année | 240 | 240 (100%) | 0 (0%) | 211 (87%) |
| 2ème Année | 224 | 215 (95%) | 0 (0%) | 63 (28%) |
| 3ème Année | 251 | 237 (94%) | 0 (0%) | 94 (37%) |
| 4ème Année | 575 | 535 (93%) | 322 (56%) | 359 (62%) |
| 5ème Année | 401 | 341 (85%) | 8 (1%) | 345 (86%) |
| 6ème Année | 1467 | 1413 (96%) | 431 (29%) | 730 (49%) |

Le détail (matière, thème, format, examens, qualité) est dans [MATRIX.md](MATRIX.md).

## Un exercice (`exercices.json`)

Champs présents sur chaque ligne:

| Champ | Valeur d’exemple |
|---|---|
| `id` | `"evaluations_maths_arabe_p002_i2"` |
| `book` | `"evaluations_maths_arabe"` |
| `page` | `2` |
| `grade` | `"1ère Année"` |
| `subject` | `"Arabe"` |
| `theme` | `"Lecture: vie quotidienne"` |
| `pageType` | `"mixed"` |
| `examScope` | `null` |
| `examTrimester` | `null` |
| `kind` | `"exercise"` |
| `number` | `"1"` |
| `format` | `"matching"` |
| `difficulty` | `"easy"` |
| `topicId` | `"ar-1-u3"` |
| `correction` | `"none"` |
| `hasAnswer` | `false` |
| `correctionPages` | `[]` |
| `quality` | `"verified"` |
| `accuracy` | `0.95` |
| `tier` | `"ready"` |
| `bookTitle` | `"Évaluations 1ère année — Maths & Arabe"` |

- `tier`: `ready` (utilisable), `pending_audit` (texte pas encore contrôlé), `shelved` (écarté).
- `correction`: `inline` (réponse dans l’exercice), `self_contained`, `linked` (corrigé sur une autre page du livre), `no_correction_yet`, `none`.
- `topicId`: chapitre du programme officiel; vide si l’exercice n’est pas encore rattaché.
- `format`: `fill_blank`, `calculation`, `matching`, `qcm`, `problem_solving`, `text_production`, `true_false`, `free`.
- `difficulty`: estimée d’après la position dans le livre (indicatif).

## Utilisation par moteur

| Moteur | Filtre conseillé | Remarque |
|---|---|---|
| Presets d’exercices | `tier = ready`, `correction` dans (`inline`, `self_contained`, `linked`), `topicId` renseigné | Table 12 de MATRIX.md: quel format est assez fourni. |
| Agent de rédaction | `tier = ready`, par `topicId` ou thème | Les exercices servent d’exemples de style et de niveau, pas de texte à recopier. |
| Livres privés | un dossier `livres/<classe>/<livre>/` complet | Le nom du livre est dans `book.json` (`title`). |

## Limites connues

- 1356 exercices (42%) n’ont pas de `topicId`: ils ne sortent pas dans une recherche par chapitre (table 11 de MATRIX.md).
- 177 exercices ne sont pas `ready` (texte non contrôlé).
- Le format de chaque exercice est détecté par règles: environ 40% restent `free`.
- La difficulté est une estimation, pas une mesure.
- Les corrigés `linked` ont été rattachés par IA et non vérifiés à la main.
