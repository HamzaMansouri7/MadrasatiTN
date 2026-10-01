# Studio / Platform — Idea Backlog (owner: Hamza)

One unified solution must cover all ideas below. Collected one by one; architecture designed after list is complete.

## Idea 1 — Medium-style blog/article writing
Teacher writes blogs/educational articles like Medium: clean centered canvas, minimal top toolbar, frictionless long-form writing (→ Variante B shell). Distinct from A4 exam mode (Variante A, 3-column).

## Idea 2 — Exercise as labeled, linked, watermarked resource
Teacher creates an exercise with:
- **Label/tag** (topic taxonomy — e.g. "Grammaire : GNS/GV")
- **Link to a course** (Book→Chapter→Topic→Exercise hierarchy; "Basé sur Chapitre 4 de [manuel]")
- **Trimestre** (T1/T2/T3)
- **Teacher's personal watermark** (mandatory attribution on every print/export)

## Idea 3 — Complete teacher profile
Teacher profile must include (in addition to existing fields):
- **Spécialité** (matière principale — already partly in signup)
- **Genre** (drives gendered FR/AR labels معلم/معلمة — partly done)
- **Photo/avatar** (real uploaded image, not default Unsplash)

## Idea 4 — Star rating on articles/blogs
Parents rate an article/blog **1–5 stars**. Average + count shown on the article card; feeds teacher credibility score.

## Idea 5 — Threaded comments on posts/articles
Parents AND teachers can comment on any post/article, and reply to comments (threaded). Role badge shown on each comment. (Comment model with replies already exists for courses/exercises — extend to blog.)

## Idea 6 — Q&A "Stack Overflow classique"
Parent raises a question on the platform; any parent OR teacher can answer; the asker marks one answer as **✓ Résolu** (accepted answer pinned on top). Teacher accepted-answers feed credibility. (QuestionThread/QuestionAnswer models exist — add solved/accepted mechanics.)

## Idea 7 — Système de Réputation pédagogique
- Réponse acceptée (✓ Résolu) → gros points de contribution pour le répondeur.
- Vote utile (👍) sur une réponse → petits points.
- Cumul → niveaux/badges (ex: Bronze → مساهم نشيط → Expert Certifié) affichés sur le profil et à côté du nom dans chaque réponse.
- Motive enseignants ET parents à répondre; nourrit la crédibilité (lié Idea 4/6).

## Idea 8 — Suivi d'Enseignants (Abonnements)
- Parent s'abonne à un enseignant (bouton "Suivre" sur le profil).
- Notification à chaque publication de l'enseignant suivi (exercice, article, corrigé, annonce).
- Fil personnalisé **"Mes abonnements"** filtrant la bibliothèque sur les enseignants suivis.
- Compteur d'abonnés visible sur le profil → crédibilité (lié Ideas 4/7).
- Sens unique parent→enseignant; pas de follow-back, pas de DM.

## Idea 9 — Compteurs de contribution par rôle
Toute contribution est comptée et affichée sur le profil + l'espace de l'utilisateur :
- **Enseignant** : docs publiés, exercices, articles, corrigés, réponses acceptées, abonnés.
- **Parent** : questions posées, réponses données, commentaires, notes attribuées.
- Tableau de bord "Mes contributions" dans chaque espace; alimente la réputation (Idea 7).

## Idea 10 — Favoris (bookmarks) universels
Naming retenu : **"Mes Favoris"** (المفضلة) — icône bookmark.
- Tout est enregistrable : cours, exercices, articles, enseignants, questions Q&A.
- Page dédiée "Mes Favoris" par espace, groupée par type + filtrable (niveau/matière).
- Persisté par compte (Firestore) — pas seulement localStorage; sync multi-appareils.
- (Watchlist localStorage existante = base à migrer/renommer.)

## Idea 11 — "Variante IA" (clonage intelligent d'exercice)
Bouton **"Générer une variante ✨"** directement sur la carte d'exercice (pas caché dans le Studio) :
- Gemini génère une variante : même topic, même format, même difficulté — chiffres/contexte changés.
- **Enseignant** → la variante s'ouvre dans le Studio (éditer, valider, publier).
- **Parent** → variante instantanée imprimable, non publiée, badge "Variante IA — non vérifiée par un enseignant".
- Respecte le quota IA global (rate-limit serveur existant).

## Idea 12 — Packs de révision
Grouper des exercices en dossier imprimable (ex: "Révision T1 Maths 4e"), partageable d'un lien.

## Idea 13 — Signalement / modération
Bouton "Signaler" sur tout contenu UGC (commentaires, Q&A, docs). Obligatoire dès l'ouverture des commentaires publics.

## Idea 14 — Recherche globale unifiée
Une barre unique cherchant tout (docs, articles, Q&A, enseignants) avec filtres niveau/matière.

## Idea 15 — Digest hebdomadaire (PLUS TARD — accepté mais pas maintenant)
Notification/email résumant les nouveautés des enseignants suivis.

## Rejeté
- ~~Suivi enfant côté parent (checklist exercices faits + progression)~~ — refusé par owner.

## UI — améliorations validées
- **U1. Navbar redesign** — header actuel à refaire; navigation par rôle plus claire.
- **U2. Studio Variante A (3 colonnes exam) + Variante B (article Medium)** — mode selon docType.
- **U3. Cartes documents uniformes** — miniatures ratio fixe, skeleton loading, badges cohérents.
- **U4. États vides + squelettes** — chaque liste vide a illustration + CTA.
- **U5. Bottom-nav mobile** — espace parent ≤5 items en bas d'écran sur téléphone.
- **U6. Visite guidée 1ère connexion** — 3-4 bulles par rôle.

## IA — fonctionnalités validées
- **A1. Tuteur contextuel (chatbot groundé)** — pas de bulle générique : sur un exercice ("Explique-moi / donne un indice"), dans le Studio, et aide-rédaction Q&A. Accuracy = prompt système strict (rôle, niveau, matière) + contenu de la page injecté + refus hors programme primaire tunisien + température basse + endpoints serveur (quota existant).
- **A2. Correction par photo** — parent photographie le devoir fait → Gemini Vision compare au corrigé → feedback bienveillant.
- **A3. Résumé parent-friendly** — bouton "Résumer" sur article/chapitre.
- **A4. Traduction FR↔AR** d'un exercice/article en 1 clic.
- **A5. Adaptation de niveau** — "Simplifier pour 2e" / "Complexifier pour 6e" sur tout exercice.
- **A6. Contrôle qualité à l'upload** — score lisibilité + détection doublon avant publication (étend l'OCR auto-tag).
- **A7. Pack auto** — "Génère un pack révision T1 Maths 4e" assemblé depuis la banque (lié Idea 12).
- **A8. Illustration auto d'exercice** — bouton Studio : scènes d'énoncé (marché, ferme…) via gemini-2.5-flash-image (quota free tier à confirmer) ; schémas précis (géométrie, droites graduées, fractions) via **SVG généré par le modèle texte** — exact, net en A4, léger. Jamais d'image IA pour un schéma mathématique.

## Idea 16 — Dual-Mode Universal Creation Studio (Teacher vs Parent)
Le Studio est partagé par les enseignants ET les parents avec adaptation dynamique selon le rôle :
- **Enseignant (Éditeur Officiel) :** En-tête officiel ministère (`الجمهورية التونسية - وزارة التربية`), filigrane nominatif enseignant, barème chiffré (/20), publication directe dans la banque publique, export corrigé officiel.
- **Parent (Atelier Révision Maison) :** En-tête personnalisé bienveillant (*"Cahier d'entraînement de [Prénom] — 5ème Année"*), filigrane protection (*"Entraînement Maison — Madrasati TN"*), pas de barème scolaire stressant, sauvegarde privée dans le profil de l'enfant (non publié dans la banque publique).

<!-- next ideas appended below -->

## IA — fonctionnalités validées (suite)
- **A9. Barre d'outils IA flottante intra-exercice (Teacher & Parent) :** Sur chaque carte exercice dans le canevas :
  - `[✨ Variante similaire]` : Génère un clone pédagogique avec nouvelles valeurs/noms.
  - `[🖼️ Image / SVG]` : Illustration de situation (marché, école) ou schéma mathématique vectoriel SVG net pour l'impression A4.
  - `[🔍 Corrigé adapté au rôle]` : 
    - *Pour Enseignant* : barème détaillé, variantes de réponses acceptées, critères officiels d'évaluation.
    - *Pour Parent* : solution directe + guide pédagogique étape par étape ("Comment lui expliquer son erreur sans le bloquer").
- **A10. Chips de prompts contextuels pré-remplis :** Suggestions directes en 1 clic sous chaque exercice selon la matière :
  - *"Rendre plus concret avec la vie quotidienne tunisienne (dinars, villes, prénoms)"*
  - *"Simplifier le vocabulaire pour un élève en difficulté"*
  - *"Ajouter un piège classique d'examen trimestriel"*
  - *"Transformer en QCM ou exercice à relier"*

