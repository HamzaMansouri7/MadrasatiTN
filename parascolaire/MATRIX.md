# Guide des matrices — bibliothèque parascolaire

Généré par `parascolaire/tools/build_matrix.py` à partir de `livres/` uniquement. Ne pas éditer à la main.

**Où chercher**

| Besoin | Fichier |
|---|---|
| Un livre | `livres/<classe>/<livre>/book.json` |
| Les exercices d’un livre (classe, thème, format, corrigé, niveau) | `livres/<classe>/<livre>/exercices.json` |
| Une page (texte, thème, qualité) | `livres/<classe>/<livre>/pages/NNN.json` |
| Les chiffres de ce guide en JSON | `matrix.json` |

## 0. Les livres

Un livre = un dossier dans `livres/<classe>/<livre>/` avec `book.json`, `exercices.json` et `pages/NNN.json`. Prêts = exercices contrôlés ou corrigés.

| # | Classe | Nom du livre | Matière | Dossier | Pages | Exercices | Prêts |
|---|---|---|---|---|---|---|---|
| 1 | 1ère Année | Évaluations 1ère année — Maths & Arabe | Mathématiques | `livres/1ere_annee/evaluations_maths_arabe` | 72 | 240 | 240 |
| 2 | 2ème Année | Évaluations 2ème année — Toutes matières | Arabe | `livres/2eme_annee/evaluations_toutes_matieres` | 58 | 224 | 215 |
| 3 | 3ème Année | Examens 3ème année — Toutes matières | Arabe | `livres/3eme_annee/examens_toutes_matieres` | 71 | 251 | 237 |
| 4 | 4ème Année | Mathématiques 4ème année — Exercices et corrigés | Mathématiques | `livres/4eme_annee/mathematiques_exercices_corriges` | 140 | 528 | 489 |
| 5 | 4ème Année | Production écrite 4ème année — Arabe | Arabe | `livres/4eme_annee/production_ecrite_arabe` | 39 | 47 | 46 |
| 6 | 5ème Année | Devoirs 5ème année — Trimestre 1, matières mixtes | Mathématiques | `livres/5eme_annee/devoirs_trimestre_1_matieres_mixtes` | 51 | 23 | 20 |
| 7 | 5ème Année | Mathématiques 5ème année — Exercices corrigés | Mathématiques | `livres/5eme_annee/exercices_mathematiques_corriges` | 8 | 14 | 14 |
| 8 | 5ème Année | Mathématiques 5ème année — Exercices et évaluations | Mathématiques | `livres/5eme_annee/mathematiques_exercices_evaluations` | 88 | 343 | 286 |
| 9 | 5ème Année | Éveil scientifique 5ème année — Évaluations | Éveil scientifique | `livres/5eme_annee/eveil_scientifique_evaluations` | 8 | 21 | 21 |
| 10 | 6ème Année | Concours 6ème année — Mathématiques (corrigés) | Mathématiques | `livres/6eme_annee/concours_mathematiques_corriges` | 18 | 45 | 41 |
| 11 | 6ème Année | Concours blanc 6ème année — Éveil scientifique (corrigé) | Éveil scientifique | `livres/6eme_annee/concours_blanc_eveil_scientifique_corrige` | 3 | 10 | 10 |
| 12 | 6ème Année | Examen de lecture 6ème année — Arabe (corrigé) | Arabe | `livres/6eme_annee/examen_lecture_arabe_corrige` | 6 | 21 | 21 |
| 13 | 6ème Année | Français 6ème année — Lire et s'exprimer | Français | `livres/6eme_annee/francais_lire_et_sexprimer` | 129 | 426 | 418 |
| 14 | 6ème Année | Grammaire arabe 6ème année — Cahier de règles | Arabe | `livres/6eme_annee/grammaire_arabe_cahier_regles` | 61 | 147 | 141 |
| 15 | 6ème Année | Soutien 6ème année — Maths et Français | Mathématiques | `livres/6eme_annee/soutien_maths_francais` | 132 | 646 | 619 |
| 16 | 6ème Année | Épreuve modèle 6ème année — Mathématiques (corrigée) | Mathématiques | `livres/6eme_annee/epreuve_modele_mathematiques_corrigee` | 6 | 13 | 13 |
| 17 | 6ème Année | Éveil scientifique 6ème année — Cours et exercices | Éveil scientifique | `livres/6eme_annee/eveil_scientifique_cours_exercices` | 57 | 159 | 150 |
| **Total** |  |  |  |  | **947** | **3158** | **2981** |

## 1. Matrice par classe

Chiffres globaux. Contrôlés = exercices sur une page auditée. Avec corrigé = réponse dans l’exercice, sur la page ou sur une page de corrigé liée.

| Classe | Livres | Pages | Pages propres | Thèmes | Items de cours | Exercices | Contrôlés | Avec corrigé | Examens | Examens avec corrigé |
|---|---|---|---|---|---|---|---|---|---|---|
| 1ère Année | 1 | 71 | 44 | 24 | 40 | 240 | 116 | 0 | 1 | 0 |
| 2ème Année | 1 | 57 | 3 | 31 | 56 | 224 | 122 | 0 | 34 | 0 |
| 3ème Année | 1 | 66 | 7 | 40 | 44 | 251 | 112 | 0 | 40 | 0 |
| 4ème Année | 2 | 174 | 49 | 31 | 134 | 575 | 268 | 182 | 37 | 28 |
| 5ème Année | 4 | 149 | 67 | 49 | 173 | 401 | 213 | 8 | 1 | 0 |
| 6ème Année | 8 | 382 | 121 | 65 | 248 | 1467 | 843 | 91 | 99 | 25 |
| **Total** | **17** | **899** | **291** | **232** | **695** | **3158** | **1674** | **281** | **212** | **53** |

## 2. Matrice classe par matière

Cellule = pages / exercices. La matière est une étiquette par page (un livre peut mêler plusieurs matières).

| Classe | Mathématiques | Arabe | Français | Éveil scientifique | Éducation islamique | Histoire-Géographie | Éducation civique | Autre | Total |
|---|---|---|---|---|---|---|---|---|---|
| 1ère Année | 38 p / 129 ex | 33 p / 111 ex | - | - | - | - | - | - | 71 p / 240 ex |
| 2ème Année | 18 p / 77 ex | 26 p / 86 ex | - | 7 p / 34 ex | 6 p / 27 ex | - | - | - | 57 p / 224 ex |
| 3ème Année | 14 p / 65 ex | 25 p / 96 ex | 14 p / 34 ex | 8 p / 37 ex | 5 p / 19 ex | - | - | - | 66 p / 251 ex |
| 4ème Année | 136 p / 528 ex | 37 p / 47 ex | - | - | - | - | - | 1 p / 0 ex | 174 p / 575 ex |
| 5ème Année | 107 p / 379 ex | 10 p / 1 ex | - | 11 p / 21 ex | 5 p / 0 ex | 11 p / 0 ex | 5 p / 0 ex | - | 149 p / 401 ex |
| 6ème Année | 78 p / 312 ex | 66 p / 168 ex | 175 p / 799 ex | 63 p / 188 ex | - | - | - | - | 382 p / 1467 ex |
| **Total** | **391 p / 1490 ex** | **197 p / 509 ex** | **189 p / 833 ex** | **89 p / 280 ex** | **16 p / 46 ex** | **11 p / 0 ex** | **5 p / 0 ex** | **1 p / 0 ex** | **899 p / 3158 ex** |

## 3. Matrice matière par thème

Thèmes normalisés par classe, avec pages, exercices et exercices avec corrigé.

### Mathématiques

| Classe | Thème | Pages | Exercices | Avec corrigé |
|---|---|---|---|---|
| 1ère Année | Addition jusqu'à 10 | 2 | 7 | 0 |
| 1ère Année | Addition jusqu'à 20 | 4 | 16 | 0 |
| 1ère Année | Calculs avec la monnaie | 3 | 18 | 0 |
| 1ère Année | Comparaison et rangement des nombres | 5 | 20 | 0 |
| 1ère Année | Dizaines et groupements | 3 | 9 | 0 |
| 1ère Année | Décomposition des nombres jusqu'à 10 | 4 | 12 | 0 |
| 1ère Année | Les nombres de 0 à 9 | 3 | 4 | 0 |
| 1ère Année | Monnaie : pièces et millimes | 6 | 19 | 0 |
| 1ère Année | Nombres de 10 à 20 | 3 | 8 | 0 |
| 1ère Année | Nombres ordinaux | 2 | 5 | 0 |
| 1ère Année | Problèmes additifs | 1 | 3 | 0 |
| 1ère Année | Réunion d'ensembles | 2 | 8 | 0 |
| 2ème Année | Addition et soustraction | 1 | 7 | 0 |
| 2ème Année | Calcul mental | 3 | 12 | 0 |
| 2ème Année | Géométrie : figures et lignes | 2 | 11 | 0 |
| 2ème Année | Monnaie : les millimes | 4 | 17 | 0 |
| 2ème Année | Numération et comparaison des nombres | 1 | 4 | 0 |
| 2ème Année | Problèmes additifs et soustractifs | 3 | 11 | 0 |
| 2ème Année | Situations-problèmes (sorties, fête de l'arbre) | 2 | 11 | 0 |
| 2ème Année | Évaluation et repérage | 1 | 2 | 0 |
| 2ème Année | Évaluations et annales | 1 | 2 | 0 |
| 3ème Année | Calcul mental | 3 | 17 | 0 |
| 3ème Année | Mesures de longueur | 1 | 3 | 0 |
| 3ème Année | Monnaie tunisienne | 3 | 18 | 0 |
| 3ème Année | Numération jusqu'à 9999 | 2 | 9 | 0 |
| 3ème Année | Polygones | 1 | 2 | 0 |
| 3ème Année | Problèmes additifs et soustractifs | 2 | 9 | 0 |
| 3ème Année | Repérage sur quadrillage | 1 | 5 | 0 |
| 3ème Année | Situations-problèmes et budget | 1 | 2 | 0 |
| 4ème Année | Addition et soustraction | 4 | 19 | 10 |
| 4ème Année | Angles | 3 | 11 | 0 |
| 4ème Année | Division euclidienne | 11 | 37 | 20 |
| 4ème Année | Droites, points et segments | 8 | 36 | 12 |
| 4ème Année | Grands nombres | 10 | 41 | 23 |
| 4ème Année | Longueurs | 7 | 22 | 8 |
| 4ème Année | Masses et capacités | 6 | 24 | 1 |
| 4ème Année | Monnaie | 8 | 24 | 2 |
| 4ème Année | Multiplication et multiples | 9 | 34 | 15 |
| 4ème Année | Numération jusqu'à 9 999 | 10 | 30 | 3 |
| 4ème Année | Numération jusqu'à 999 | 7 | 24 | 9 |
| 4ème Année | Problèmes | 5 | 16 | 7 |
| 4ème Année | Périmètre et aire | 7 | 26 | 24 |
| 4ème Année | Quadrillage et parcours | 4 | 23 | 9 |
| 4ème Année | Rectangle et carré | 2 | 8 | 0 |
| 4ème Année | Révisions et évaluations | 29 | 106 | 33 |
| 4ème Année | Temps et calendrier | 6 | 47 | 6 |
| 5ème Année | Angles, cercle et triangles | 9 | 35 | 0 |
| 5ème Année | Divers | 2 | 0 | 0 |
| 5ème Année | Division euclidienne | 6 | 22 | 0 |
| 5ème Année | Droites, médiatrice et bissectrice | 7 | 17 | 0 |
| 5ème Année | Fractions | 3 | 12 | 0 |
| 5ème Année | Grands nombres entiers | 9 | 29 | 0 |
| 5ème Année | Mesures d'aires et unités agraires | 13 | 48 | 0 |
| 5ème Année | Mesures de durées | 6 | 21 | 0 |
| 5ème Année | Mesures de masses et de capacités | 4 | 14 | 0 |
| 5ème Année | Nombres décimaux : notions et comparaison | 7 | 32 | 4 |
| 5ème Année | Opérations sur les décimaux | 13 | 52 | 2 |
| 5ème Année | Opérations sur les entiers | 3 | 8 | 0 |
| 5ème Année | Problèmes d'achat, vente et bénéfice | 8 | 32 | 1 |
| 5ème Année | Problèmes de synthèse et vie courante | 8 | 32 | 0 |
| 5ème Année | Proportionnalité et problèmes de mesures | 3 | 8 | 0 |
| 5ème Année | Quadrilatères, symétrie et repérage | 6 | 17 | 0 |
| 6ème Année | Angles et symétrie axiale | 5 | 19 | 4 |
| 6ème Année | Cercle et disque | 2 | 4 | 0 |
| 6ème Année | Constructions géométriques | 3 | 11 | 0 |
| 6ème Année | Durées, vitesse et échelle | 9 | 26 | 6 |
| 6ème Année | Fractions | 5 | 15 | 4 |
| 6ème Année | Listes d'épreuves | 1 | 0 | 0 |
| 6ème Année | Mesures et conversions | 4 | 22 | 9 |
| 6ème Année | Modèles d'examens régionaux | 1 | 0 | 0 |
| 6ème Année | Multiples et diviseurs | 4 | 25 | 5 |
| 6ème Année | Nombres décimaux et opérations | 2 | 15 | 6 |
| 6ème Année | Pages de titre | 1 | 0 | 0 |
| 6ème Année | Pourcentages et proportionnalité | 8 | 26 | 11 |
| 6ème Année | Problèmes de synthèse et révisions | 12 | 54 | 6 |
| 6ème Année | Présentation du manuel | 1 | 0 | 0 |
| 6ème Année | Puissances | 4 | 24 | 0 |
| 6ème Année | Périmètres et aires | 6 | 20 | 3 |
| 6ème Année | Sommaires | 1 | 0 | 0 |
| 6ème Année | Statistiques et graphiques | 6 | 31 | 6 |
| 6ème Année | Volumes et capacités | 3 | 20 | 0 |

### Arabe

| Classe | Thème | Pages | Exercices | Avec corrigé |
|---|---|---|---|---|
| 1ère Année | Compréhension de texte | 1 | 3 | 0 |
| 1ère Année | Enrichissement de phrases | 4 | 8 | 0 |
| 1ère Année | La hamza | 1 | 5 | 0 |
| 1ère Année | Lecture: nature et saisons | 4 | 14 | 0 |
| 1ère Année | Lecture: vie quotidienne | 2 | 9 | 0 |
| 1ère Année | Lettres et sons: ز و ح | 4 | 22 | 0 |
| 1ère Année | Lettres et sons: ف ق ط | 3 | 17 | 0 |
| 1ère Année | Ordonner des phrases et cohérence textuelle | 6 | 12 | 0 |
| 1ère Année | Personnages, lieux et événements du récit | 2 | 7 | 0 |
| 1ère Année | Production écrite: images et scènes | 2 | 2 | 0 |
| 1ère Année | Substitution et transformation de phrases | 3 | 5 | 0 |
| 1ère Année | Syllabe fermée et lettre ت | 1 | 7 | 0 |
| 2ème Année | Calligraphie et graphie des lettres | 3 | 9 | 0 |
| 2ème Année | Compréhension: l'argent et l'épargne | 2 | 10 | 0 |
| 2ème Année | Compréhension: la maladie | 2 | 8 | 0 |
| 2ème Année | Compréhension: le texte narratif | 4 | 18 | 0 |
| 2ème Année | Compréhension: nature et animaux | 2 | 15 | 0 |
| 2ème Année | Description de scènes et d'images | 2 | 2 | 0 |
| 2ème Année | Dictée et orthographe | 1 | 3 | 0 |
| 2ème Année | Production écrite: ordonner des événements | 2 | 5 | 0 |
| 2ème Année | Production écrite: phrases et dialogue | 2 | 5 | 0 |
| 2ème Année | Production écrite: suite de récit | 2 | 4 | 0 |
| 2ème Année | Évaluations et annales | 2 | 0 | 0 |
| 2ème Année | Évaluations et consignes | 2 | 7 | 0 |
| 3ème Année | Compréhension de l'oral | 3 | 19 | 0 |
| 3ème Année | Compréhension de l'écrit : la classe et la maison | 3 | 9 | 0 |
| 3ème Année | Compréhension de l'écrit : le texte narratif | 4 | 20 | 0 |
| 3ème Année | Conjugaison : le passé et les pronoms | 3 | 11 | 0 |
| 3ème Année | Dictée | 1 | 2 | 0 |
| 3ème Année | Grammaire : la phrase verbale | 2 | 8 | 0 |
| 3ème Année | Grammaire : ponctuation et connecteurs | 2 | 9 | 0 |
| 3ème Année | Grammaire : pronoms personnels | 1 | 4 | 0 |
| 3ème Année | Hygiène, ablutions et sourates | 1 | 4 | 0 |
| 3ème Année | Production écrite : dialogue et récit | 2 | 4 | 0 |
| 3ème Année | Production écrite : phrases et paragraphe | 1 | 3 | 0 |
| 3ème Année | Production écrite : récit illustré | 1 | 2 | 0 |
| 3ème Année | Évaluation de la production écrite | 1 | 1 | 0 |
| 4ème Année | Cadres spatio-temporels et temps du récit | 1 | 0 | 0 |
| 4ème Année | Description d'un personnage | 4 | 0 | 0 |
| 4ème Année | Description de la nature et des paysages | 3 | 0 | 0 |
| 4ème Année | Description de lieux (village, bâtiments) | 3 | 9 | 0 |
| 4ème Année | Description des animaux | 1 | 0 | 0 |
| 4ème Année | Description des saisons et du temps | 5 | 0 | 0 |
| 4ème Année | Dialogue et lettre | 1 | 0 | 0 |
| 4ème Année | Expression des sentiments et émotions | 4 | 0 | 0 |
| 4ème Année | Expressions, proverbes et mots de liaison | 4 | 1 | 0 |
| 4ème Année | Le récit et l'incident perturbateur | 2 | 14 | 0 |
| 4ème Année | Lexique et vocabulaire de la production écrite | 3 | 0 | 0 |
| 4ème Année | Planification et évaluation de la production écrite | 1 | 0 | 0 |
| 4ème Année | Production écrite : sujets variés et textes modèles | 5 | 23 | 0 |
| 5ème Année | Le complément circonstanciel de lieu | 1 | 0 | 0 |
| 5ème Année | Le complément circonstanciel de temps | 2 | 0 | 0 |
| 5ème Année | Le groupe coordonné | 1 | 1 | 1 |
| 5ème Année | Les syntagmes prépositionnel et adjectival | 1 | 0 | 0 |
| 5ème Année | Noms propres et verbes trilitères | 1 | 0 | 0 |
| 5ème Année | Types et nature du verbe | 1 | 0 | 0 |
| 5ème Année | Verbe sain et verbe défectueux | 1 | 0 | 0 |
| 5ème Année | Verbe simple et verbe augmenté | 2 | 0 | 0 |
| 6ème Année | Compréhension de l'écrit | 6 | 21 | 9 |
| 6ème Année | Conjugaison: pronoms et suffixes | 8 | 34 | 0 |
| 6ème Année | Inna et ses sœurs | 2 | 4 | 0 |
| 6ème Année | Kâna et ses sœurs | 2 | 4 | 0 |
| 6ème Année | L'impératif | 3 | 9 | 0 |
| 6ème Année | La phrase nominale: le prédicat | 2 | 4 | 0 |
| 6ème Année | Le duel | 2 | 4 | 0 |
| 6ème Année | Le masdar | 4 | 10 | 0 |
| 6ème Année | Le pluriel féminin sain | 2 | 5 | 0 |
| 6ème Année | Le pluriel masculin sain | 2 | 4 | 0 |
| 6ème Année | Le verbe doublé (mudhaʿʿaf) | 2 | 0 | 0 |
| 6ème Année | Le verbe défectueux | 9 | 5 | 0 |
| 6ème Année | Les cinq noms et l'annexion | 4 | 9 | 0 |
| 6ème Année | Les compléments | 5 | 14 | 0 |
| 6ème Année | Les participes | 4 | 16 | 0 |
| 6ème Année | Les pronoms | 4 | 8 | 0 |
| 6ème Année | Les pronoms relatifs | 2 | 4 | 0 |
| 6ème Année | Orthographe de la hamza | 3 | 13 | 0 |

### Français

| Classe | Thème | Pages | Exercices | Avec corrigé |
|---|---|---|---|---|
| 3ème Année | Compréhension de texte | 2 | 7 | 0 |
| 3ème Année | Construction de phrases | 3 | 9 | 0 |
| 3ème Année | La routine quotidienne | 2 | 6 | 0 |
| 3ème Année | Lecture de l'heure | 1 | 1 | 0 |
| 3ème Année | Numération et notation | 1 | 1 | 0 |
| 3ème Année | Vocabulaire de la maison | 2 | 4 | 0 |
| 3ème Année | Écriture et dictée | 3 | 6 | 0 |
| 6ème Année | Conjugaison | 9 | 44 | 2 |
| 6ème Année | Contes et récits légendaires | 7 | 16 | 0 |
| 6ème Année | Divers | 2 | 0 | 0 |
| 6ème Année | Eau, énergie et environnement | 18 | 112 | 0 |
| 6ème Année | Grammaire: la phrase | 7 | 43 | 0 |
| 6ème Année | Internet et technologies | 12 | 76 | 0 |
| 6ème Année | Le texte narratif | 48 | 177 | 0 |
| 6ème Année | Lexique et vocabulaire | 4 | 25 | 0 |
| 6ème Année | Métiers, citoyenneté et vie sociale | 8 | 41 | 0 |
| 6ème Année | Orthographe et accords | 3 | 18 | 0 |
| 6ème Année | Production écrite et lettres | 10 | 9 | 0 |
| 6ème Année | Révisions et évaluations | 20 | 133 | 0 |
| 6ème Année | Santé et hygiène de vie | 13 | 49 | 0 |
| 6ème Année | Textes descriptifs et biographiques | 6 | 24 | 0 |
| 6ème Année | Textes documentaires | 8 | 32 | 0 |

### Éveil scientifique

| Classe | Thème | Pages | Exercices | Avec corrigé |
|---|---|---|---|---|
| 2ème Année | Alimentation équilibrée | 1 | 4 | 0 |
| 2ème Année | Hygiène et santé | 1 | 6 | 0 |
| 2ème Année | Le corps humain | 1 | 5 | 0 |
| 2ème Année | Le temps et l'ordre chronologique | 1 | 5 | 0 |
| 2ème Année | Prévention des accidents et sécurité | 1 | 5 | 0 |
| 2ème Année | Repérage dans l'espace | 1 | 4 | 0 |
| 2ème Année | Sport et santé | 1 | 5 | 0 |
| 3ème Année | Animaux domestiques | 1 | 6 | 0 |
| 3ème Année | Classification des animaux | 1 | 5 | 0 |
| 3ème Année | Déplacement de l'homme et des animaux | 1 | 3 | 0 |
| 3ème Année | Déplacement des animaux | 1 | 6 | 0 |
| 3ème Année | Lecture de l'heure | 1 | 3 | 0 |
| 3ème Année | Mesure du temps et repères temporels | 1 | 4 | 0 |
| 3ème Année | Reproduction des animaux | 1 | 4 | 0 |
| 3ème Année | Événements périodiques | 1 | 6 | 0 |
| 5ème Année | La germination | 3 | 8 | 0 |
| 5ème Année | Le cycle de l'eau et sa potabilisation | 1 | 3 | 0 |
| 5ème Année | Le milieu de vie | 1 | 3 | 0 |
| 5ème Année | Les chaînes alimentaires | 2 | 7 | 0 |
| 5ème Année | Les sources de lumière | 1 | 0 | 0 |
| 5ème Année | Propagation de la lumière et ombre | 2 | 0 | 0 |
| 5ème Année | Vision et milieux transparents | 1 | 0 | 0 |
| 6ème Année | Chaînes alimentaires et reproduction des plantes | 3 | 4 | 0 |
| 6ème Année | Composition de l'air | 3 | 6 | 0 |
| 6ème Année | Divers | 2 | 1 | 0 |
| 6ème Année | L'air et ses propriétés | 7 | 34 | 10 |
| 6ème Année | L'eau et sa pollution | 4 | 17 | 0 |
| 6ème Année | L'électricité | 2 | 1 | 0 |
| 6ème Année | La circulation sanguine et le sang | 9 | 31 | 6 |
| 6ème Année | La combustion | 2 | 0 | 0 |
| 6ème Année | La lumière et la vision | 3 | 0 | 0 |
| 6ème Année | La respiration | 6 | 23 | 0 |
| 6ème Année | Les aimants et la boussole | 7 | 23 | 0 |
| 6ème Année | Les groupes d'aliments et l'alimentation équilibrée | 7 | 22 | 0 |
| 6ème Année | Santé, défense de l'organisme et maladies | 3 | 10 | 4 |
| 6ème Année | Énergie, besoins et troubles alimentaires | 5 | 16 | 0 |

### Éducation islamique

| Classe | Thème | Pages | Exercices | Avec corrigé |
|---|---|---|---|---|
| 2ème Année | Bonnes manières à table | 2 | 10 | 0 |
| 2ème Année | Comportement à l'école | 1 | 3 | 0 |
| 2ème Année | Les piliers de l'islam | 1 | 6 | 0 |
| 2ème Année | Politesse d'entrée et autorisation | 2 | 8 | 0 |
| 3ème Année | Création, environnement et propreté | 1 | 5 | 0 |
| 3ème Année | Droits des parents et liens de parenté | 1 | 3 | 0 |
| 3ème Année | Les ablutions et la prière | 1 | 4 | 0 |
| 3ème Année | Sourates At-Tîn et Ash-Sharh | 1 | 3 | 0 |
| 3ème Année | Évaluation | 1 | 4 | 0 |
| 5ème Année | La prière | 1 | 0 | 0 |
| 5ème Année | La purification: les ablutions | 2 | 0 | 0 |
| 5ème Année | Le bon comportement et la bonne parole | 1 | 0 | 0 |
| 5ème Année | Les parents et la famille | 1 | 0 | 0 |

### Histoire-Géographie

| Classe | Thème | Pages | Exercices | Avec corrigé |
|---|---|---|---|---|
| 5ème Année | Activités économiques de Carthage | 1 | 0 | 0 |
| 5ème Année | Civilisation capsienne | 1 | 0 | 0 |
| 5ème Année | Continents et océans | 1 | 0 | 0 |
| 5ème Année | Expansion et institutions de Carthage | 1 | 0 | 0 |
| 5ème Année | Habitat et équipements agricoles | 1 | 0 | 0 |
| 5ème Année | Le paysage rural | 1 | 0 | 0 |
| 5ème Année | Orientation et points cardinaux | 1 | 0 | 0 |
| 5ème Année | Reliefs du monde | 1 | 0 | 0 |
| 5ème Année | Repères chronologiques et calendriers | 2 | 0 | 0 |
| 5ème Année | Situation de la Tunisie | 1 | 0 | 0 |

### Éducation civique

| Classe | Thème | Pages | Exercices | Avec corrigé |
|---|---|---|---|---|
| 5ème Année | Droits et devoirs de l'élève | 2 | 0 | 0 |
| 5ème Année | La famille: fonctions | 1 | 0 | 0 |
| 5ème Année | La famille: relations | 1 | 0 | 0 |
| 5ème Année | La famille: structure | 1 | 0 | 0 |

### Autre

| Classe | Thème | Pages | Exercices | Avec corrigé |
|---|---|---|---|---|
| 4ème Année | Présentation de la collection | 1 | 0 | 0 |


## 4. Matrice des corrigés

Par classe et matière. Comptage exact, identique à l’export NotebookLM: un exercice a un corrigé seulement si son texte est retrouvé pour CE numéro d’exercice.

| Classe | Matière | Exercices | Réponse dans l’exercice | Réponse sur la page | Corrigé exact sur page liée | Total avec corrigé | Page liée, sans correspondance exacte | Sans corrigé | % avec corrigé |
|---|---|---|---|---|---|---|---|---|---|
| 1ère Année | Mathématiques | 129 | 0 | 0 | 0 | 0 | 0 | 129 | 0% |
| 1ère Année | Arabe | 111 | 0 | 0 | 0 | 0 | 0 | 111 | 0% |
| 2ème Année | Arabe | 86 | 0 | 0 | 0 | 0 | 0 | 86 | 0% |
| 2ème Année | Mathématiques | 77 | 0 | 0 | 0 | 0 | 0 | 77 | 0% |
| 2ème Année | Éveil scientifique | 34 | 0 | 0 | 0 | 0 | 0 | 34 | 0% |
| 2ème Année | Éducation islamique | 27 | 0 | 0 | 0 | 0 | 0 | 27 | 0% |
| 3ème Année | Arabe | 96 | 0 | 0 | 0 | 0 | 0 | 96 | 0% |
| 3ème Année | Mathématiques | 65 | 0 | 0 | 0 | 0 | 0 | 65 | 0% |
| 3ème Année | Éveil scientifique | 37 | 0 | 0 | 0 | 0 | 0 | 37 | 0% |
| 3ème Année | Français | 34 | 0 | 0 | 0 | 0 | 0 | 34 | 0% |
| 3ème Année | Éducation islamique | 19 | 0 | 0 | 0 | 0 | 0 | 19 | 0% |
| 4ème Année | Mathématiques | 528 | 22 | 0 | 160 | 182 | 140 | 206 | 34% |
| 4ème Année | Arabe | 47 | 0 | 0 | 0 | 0 | 0 | 47 | 0% |
| 5ème Année | Mathématiques | 379 | 7 | 0 | 0 | 7 | 0 | 372 | 1% |
| 5ème Année | Éveil scientifique | 21 | 0 | 0 | 0 | 0 | 0 | 21 | 0% |
| 5ème Année | Arabe | 1 | 1 | 0 | 0 | 1 | 0 | 0 | 100% |
| 6ème Année | Français | 799 | 2 | 0 | 0 | 2 | 285 | 512 | 0% |
| 6ème Année | Mathématiques | 312 | 17 | 43 | 0 | 60 | 39 | 213 | 19% |
| 6ème Année | Éveil scientifique | 188 | 20 | 0 | 0 | 20 | 9 | 159 | 10% |
| 6ème Année | Arabe | 168 | 6 | 3 | 0 | 9 | 1 | 158 | 5% |
| **Total** |  | **3158** | **75** | **46** | **160** | **281** | **474** | **2403** | **8%** |

## 5. Matrice livre par classe et matière

Quels livres couvrent quelle matière.

| Livre | Classe | Pages | Matières (pages) |
|---|---|---|---|
| Évaluations 1ère année — Maths & Arabe | 1ère Année | 71 | Mathématiques 38, Arabe 33 |
| Évaluations 2ème année — Toutes matières | 2ème Année | 57 | Arabe 26, Mathématiques 18, Éveil scientifique 7, Éducation islamique 6 |
| Examens 3ème année — Toutes matières | 3ème Année | 66 | Arabe 25, Mathématiques 14, Français 14, Éveil scientifique 8, Éducation islamique 5 |
| Mathématiques 4ème année — Exercices et corrigés | 4ème Année | 137 | Mathématiques 136, Autre 1 |
| Production écrite 4ème année — Arabe | 4ème Année | 37 | Arabe 37 |
| Devoirs 5ème année — Trimestre 1, matières mixtes | 5ème Année | 49 | Mathématiques 14, Histoire-Géographie 11, Arabe 10, Éducation islamique 5, Éducation civique 5, Éveil scientifique 4 |
| Mathématiques 5ème année — Exercices corrigés | 5ème Année | 6 | Mathématiques 6 |
| Mathématiques 5ème année — Exercices et évaluations | 5ème Année | 87 | Mathématiques 87 |
| Éveil scientifique 5ème année — Évaluations | 5ème Année | 7 | Éveil scientifique 7 |
| Concours 6ème année — Mathématiques (corrigés) | 6ème Année | 18 | Mathématiques 18 |
| Concours blanc 6ème année — Éveil scientifique (corrigé) | 6ème Année | 3 | Éveil scientifique 3 |
| Examen de lecture 6ème année — Arabe (corrigé) | 6ème Année | 6 | Arabe 6 |
| Français 6ème année — Lire et s'exprimer | 6ème Année | 126 | Français 126 |
| Grammaire arabe 6ème année — Cahier de règles | 6ème Année | 60 | Arabe 60 |
| Soutien 6ème année — Maths et Français | 6ème Année | 108 | Mathématiques 55, Français 49, Éveil scientifique 4 |
| Épreuve modèle 6ème année — Mathématiques (corrigée) | 6ème Année | 5 | Mathématiques 5 |
| Éveil scientifique 6ème année — Cours et exercices | 6ème Année | 56 | Éveil scientifique 56 |

## 6. Matrice formats de page par matière

Nombre de pages contenant chaque format (étiquette de page). Une page peut avoir plusieurs formats.

| Format (page) | Mathématiques | Arabe | Français | Éveil scientifique | Éducation islamique | Total |
|---|---|---|---|---|---|---|
| schema_tableau | 233 | 69 | 29 | 71 | 6 | 408 |
| autre | 108 | 98 | 74 | 55 | 10 | 345 |
| calcul | 340 | 0 | 0 | 3 | 0 | 343 |
| texte_a_trous | 85 | 79 | 83 | 30 | 10 | 287 |
| probleme | 286 | 0 | 0 | 3 | 0 | 289 |
| production_ecrite | 28 | 109 | 86 | 18 | 7 | 248 |
| lecture_comprehension | 2 | 70 | 124 | 29 | 5 | 230 |
| appariement | 18 | 27 | 16 | 26 | 8 | 95 |
| vrai_faux | 2 | 12 | 53 | 24 | 3 | 94 |
| qcm | 9 | 12 | 32 | 9 | 1 | 63 |
| dictee | 0 | 12 | 3 | 0 | 0 | 15 |
| tableau_schema | 0 | 0 | 0 | 0 | 1 | 1 |
| **Pages** | **391** | **197** | **189** | **89** | **16** | **882** |

## 6b. Matrice classe par format d’exercice

Formats détectés par règles sur la consigne et l’énoncé.

| Classe | free | fill_blank | calculation | matching | qcm | problem_solving | text_production | true_false | Total |
|---|---|---|---|---|---|---|---|---|---|
| 1ère Année | 30 | 117 | 23 | 36 | 27 | 1 | 6 | 0 | 240 |
| 2ème Année | 52 | 71 | 48 | 26 | 18 | 6 | 3 | 0 | 224 |
| 3ème Année | 55 | 80 | 22 | 37 | 25 | 32 | 0 | 0 | 251 |
| 4ème Année | 172 | 105 | 132 | 38 | 27 | 57 | 44 | 0 | 575 |
| 5ème Année | 97 | 107 | 128 | 36 | 12 | 20 | 0 | 1 | 401 |
| 6ème Année | 587 | 483 | 162 | 62 | 93 | 69 | 2 | 9 | 1467 |
| **Total** | **993** | **963** | **515** | **235** | **202** | **185** | **55** | **10** | **3158** |

## 7. Matrice difficulté

Estimée d’après la position de la page dans le livre (heuristique, non vérifiée).

| Classe | Matière | easy | medium | hard | n/a | Total |
|---|---|---|---|---|---|---|
| 1ère Année | Mathématiques | 0 | 36 | 88 | 5 | 129 |
| 1ère Année | Arabe | 68 | 37 | 0 | 6 | 111 |
| 2ème Année | Arabe | 65 | 16 | 4 | 1 | 86 |
| 2ème Année | Mathématiques | 0 | 66 | 11 | 0 | 77 |
| 2ème Année | Éveil scientifique | 0 | 0 | 34 | 0 | 34 |
| 2ème Année | Éducation islamique | 0 | 0 | 27 | 0 | 27 |
| 3ème Année | Arabe | 82 | 9 | 4 | 1 | 96 |
| 3ème Année | Mathématiques | 0 | 64 | 0 | 1 | 65 |
| 3ème Année | Éveil scientifique | 0 | 27 | 10 | 0 | 37 |
| 3ème Année | Français | 0 | 0 | 34 | 0 | 34 |
| 3ème Année | Éducation islamique | 0 | 0 | 19 | 0 | 19 |
| 4ème Année | Mathématiques | 169 | 246 | 102 | 11 | 528 |
| 4ème Année | Arabe | 0 | 1 | 46 | 0 | 47 |
| 5ème Année | Mathématiques | 119 | 156 | 100 | 4 | 379 |
| 5ème Année | Éveil scientifique | 3 | 10 | 8 | 0 | 21 |
| 5ème Année | Arabe | 0 | 1 | 0 | 0 | 1 |
| 6ème Année | Français | 213 | 290 | 293 | 3 | 799 |
| 6ème Année | Mathématiques | 94 | 115 | 96 | 7 | 312 |
| 6ème Année | Éveil scientifique | 61 | 102 | 19 | 6 | 188 |
| 6ème Année | Arabe | 37 | 67 | 64 | 0 | 168 |
| **Total** |  | **911** | **1243** | **959** | **45** | **3158** |

## 8. Matrice des examens

Portée: single, short_test, trimester, full_year, exam_part, unknown.

| Classe | Matière | Examens | single | short_test | trimester | full_year | exam_part | unknown | Avec corrigé |
|---|---|---|---|---|---|---|---|---|---|
| 1ère Année | Mathématiques | 1 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| 2ème Année | Arabe | 14 | 0 | 0 | 14 | 0 | 0 | 0 | 0 |
| 2ème Année | Mathématiques | 12 | 0 | 0 | 12 | 0 | 0 | 0 | 0 |
| 2ème Année | Éveil scientifique | 4 | 0 | 0 | 4 | 0 | 0 | 0 | 0 |
| 2ème Année | Éducation islamique | 4 | 0 | 0 | 4 | 0 | 0 | 0 | 0 |
| 3ème Année | Arabe | 12 | 0 | 0 | 10 | 0 | 0 | 2 | 0 |
| 3ème Année | Mathématiques | 11 | 0 | 0 | 9 | 0 | 0 | 2 | 0 |
| 3ème Année | Français | 7 | 0 | 0 | 7 | 0 | 0 | 0 | 0 |
| 3ème Année | Éveil scientifique | 6 | 0 | 1 | 5 | 0 | 0 | 0 | 0 |
| 3ème Année | Éducation islamique | 4 | 0 | 0 | 3 | 0 | 0 | 1 | 0 |
| 4ème Année | Mathématiques | 37 | 0 | 15 | 18 | 3 | 0 | 1 | 28 |
| 5ème Année | Mathématiques | 1 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| 6ème Année | Mathématiques | 48 | 0 | 5 | 5 | 14 | 18 | 6 | 17 |
| 6ème Année | Français | 45 | 0 | 4 | 6 | 1 | 33 | 1 | 4 |
| 6ème Année | Arabe | 5 | 0 | 0 | 2 | 0 | 0 | 3 | 3 |
| 6ème Année | Éveil scientifique | 1 | 0 | 0 | 0 | 1 | 0 | 0 | 1 |
| **Total** |  | **212** | **0** | **25** | **101** | **19** | **51** | **16** | **53** |

## 9. Matrice qualité par livre

Propres = liées à un chapitre. Contrôlées = audit OK. Corrigées = texte refait. À auditer = jamais contrôlées.

| Livre | Classe | Pages | Propres | Contrôlées (ok) | Corrigées | À auditer |
|---|---|---|---|---|---|---|
| Évaluations 1ère année — Maths & Arabe | 1ère Année | 71 | 44 | 28 | 6 | 37 |
| Évaluations 2ème année — Toutes matières | 2ème Année | 57 | 3 | 29 | 1 | 27 |
| Examens 3ème année — Toutes matières | 3ème Année | 66 | 7 | 33 | 0 | 33 |
| Mathématiques 4ème année — Exercices et corrigés | 4ème Année | 137 | 43 | 54 | 10 | 73 |
| Production écrite 4ème année — Arabe | 4ème Année | 37 | 6 | 25 | 0 | 12 |
| Devoirs 5ème année — Trimestre 1, matières mixtes | 5ème Année | 49 | 20 | 20 | 1 | 28 |
| Mathématiques 5ème année — Exercices corrigés | 5ème Année | 6 | 3 | 5 | 0 | 1 |
| Mathématiques 5ème année — Exercices et évaluations | 5ème Année | 87 | 43 | 36 | 8 | 43 |
| Éveil scientifique 5ème année — Évaluations | 5ème Année | 7 | 1 | 6 | 0 | 1 |
| Concours 6ème année — Mathématiques (corrigés) | 6ème Année | 18 | 16 | 9 | 3 | 6 |
| Concours blanc 6ème année — Éveil scientifique (corrigé) | 6ème Année | 3 | 2 | 1 | 2 | 0 |
| Examen de lecture 6ème année — Arabe (corrigé) | 6ème Année | 6 | 0 | 6 | 0 | 0 |
| Français 6ème année — Lire et s'exprimer | 6ème Année | 126 | 33 | 65 | 17 | 43 |
| Grammaire arabe 6ème année — Cahier de règles | 6ème Année | 60 | 10 | 28 | 3 | 29 |
| Soutien 6ème année — Maths et Français | 6ème Année | 108 | 6 | 53 | 0 | 55 |
| Épreuve modèle 6ème année — Mathématiques (corrigée) | 6ème Année | 5 | 4 | 4 | 1 | 0 |
| Éveil scientifique 6ème année — Cours et exercices | 6ème Année | 56 | 50 | 28 | 3 | 25 |

## 10. Matrice de disponibilité

Prêts = utilisables pour générer. À auditer = pas encore contrôlés. Écartés = qualité trop faible.

| Classe | Matière | Exercices | Prêts | À auditer | Écartés | % prêts |
|---|---|---|---|---|---|---|
| 1ère Année | Mathématiques | 129 | 129 | 0 | 0 | 100% |
| 1ère Année | Arabe | 111 | 111 | 0 | 0 | 100% |
| 2ème Année | Arabe | 86 | 78 | 8 | 0 | 90% |
| 2ème Année | Mathématiques | 77 | 77 | 0 | 0 | 100% |
| 2ème Année | Éveil scientifique | 34 | 33 | 1 | 0 | 97% |
| 2ème Année | Éducation islamique | 27 | 27 | 0 | 0 | 100% |
| 3ème Année | Arabe | 96 | 87 | 9 | 0 | 90% |
| 3ème Année | Mathématiques | 65 | 60 | 5 | 0 | 92% |
| 3ème Année | Éveil scientifique | 37 | 37 | 0 | 0 | 100% |
| 3ème Année | Français | 34 | 34 | 0 | 0 | 100% |
| 3ème Année | Éducation islamique | 19 | 19 | 0 | 0 | 100% |
| 4ème Année | Mathématiques | 528 | 489 | 39 | 0 | 92% |
| 4ème Année | Arabe | 47 | 46 | 1 | 0 | 97% |
| 5ème Année | Mathématiques | 379 | 319 | 60 | 0 | 84% |
| 5ème Année | Éveil scientifique | 21 | 21 | 0 | 0 | 100% |
| 5ème Année | Arabe | 1 | 1 | 0 | 0 | 100% |
| 6ème Année | Français | 799 | 790 | 9 | 0 | 98% |
| 6ème Année | Mathématiques | 312 | 285 | 27 | 0 | 91% |
| 6ème Année | Éveil scientifique | 188 | 176 | 12 | 0 | 93% |
| 6ème Année | Arabe | 168 | 162 | 6 | 0 | 96% |
| **Total** |  | **3158** | **2981** | **177** | **0** | **94%** |

## 11. Matrice du lien au programme officiel

Un exercice lié a un `topicId` du programme officiel: c’est la condition pour le retrouver par chapitre.

| Classe | Matière | Exercices | Liés au programme officiel | Non liés | % liés |
|---|---|---|---|---|---|
| 1ère Année | Mathématiques | 129 | 118 | 11 | 91% |
| 1ère Année | Arabe | 111 | 93 | 18 | 83% |
| 2ème Année | Arabe | 86 | 32 | 54 | 37% |
| 2ème Année | Mathématiques | 77 | 31 | 46 | 40% |
| 2ème Année | Éveil scientifique | 34 | 0 | 34 | 0% |
| 2ème Année | Éducation islamique | 27 | 0 | 27 | 0% |
| 3ème Année | Arabe | 96 | 46 | 50 | 47% |
| 3ème Année | Mathématiques | 65 | 29 | 36 | 44% |
| 3ème Année | Éveil scientifique | 37 | 19 | 18 | 51% |
| 3ème Année | Français | 34 | 0 | 34 | 0% |
| 3ème Année | Éducation islamique | 19 | 0 | 19 | 0% |
| 4ème Année | Mathématiques | 528 | 344 | 184 | 65% |
| 4ème Année | Arabe | 47 | 15 | 32 | 31% |
| 5ème Année | Mathématiques | 379 | 337 | 42 | 88% |
| 5ème Année | Éveil scientifique | 21 | 8 | 13 | 38% |
| 5ème Année | Arabe | 1 | 0 | 1 | 0% |
| 6ème Année | Français | 799 | 361 | 438 | 45% |
| 6ème Année | Mathématiques | 312 | 145 | 167 | 46% |
| 6ème Année | Éveil scientifique | 188 | 165 | 23 | 87% |
| 6ème Année | Arabe | 168 | 59 | 109 | 35% |
| **Total** |  | **3158** | **1802** | **1356** | **57%** |

## 12. Matrice des presets

Cellule = exercices prêts avec corrigé / exercices prêts, par format et matière. Sert à choisir quels presets alimenter.

| Format | Mathématiques | Français | Arabe | Éveil scientifique | Éducation islamique |
|---|---|---|---|---|---|
| free | 55 / 332 | 0 / 365 | 8 / 154 | 6 / 89 | 0 / 6 |
| fill_blank | 57 / 327 | 1 / 344 | 0 / 159 | 5 / 56 | 0 / 24 |
| calculation | 76 / 442 | 0 / 0 | 1 / 24 | 1 / 10 | 0 / 1 |
| matching | 19 / 100 | 0 / 17 | 0 / 53 | 3 / 44 | 0 / 10 |
| qcm | 6 / 57 | 0 / 77 | 0 / 37 | 1 / 18 | 0 / 3 |
| problem_solving | 19 / 101 | 1 / 14 | 1 / 6 | 0 / 45 | 0 / 2 |
| text_production | 0 / 0 | 0 / 2 | 0 / 52 | 0 / 0 | 0 / 0 |
| true_false | 0 / 0 | 0 / 5 | 0 / 0 | 3 / 5 | 0 / 0 |
