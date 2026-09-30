# Architecture Unifiée — Madrasati TN
> Couvre les 29 items de IDEAS-studio.md (15 idées + U1–U6 + A1–A8) avec 5 briques. Une seule solution, pas 29 features isolées.

## Vue d'ensemble

```
┌───────────────────────────────────────────────────────────────────┐
│                        SHELLS UI (U1–U6)                          │
│  Navbar/roles · Studio-A (exam 3-col) · Studio-B (article)        │
│  Cartes uniformes · Bottom-nav mobile · Onboarding                │
├───────────────┬───────────────────┬───────────────────────────────┤
│ ① RESOURCE    │ ② INTERACTION     │ ③ IDENTITY                    │
│   ENGINE      │    ENGINE         │    & REPUTATION               │
│ (contenu)     │ (social)          │ (profils)                     │
├───────────────┴───────────────────┴───────────────────────────────┤
│ ④ AI GATEWAY  (/api/ai/* — un middleware commun)                  │
├───────────────────────────────────────────────────────────────────┤
│ ⑤ DISCOVERY & NOTIFICATIONS (recherche, fil, favoris, digest)     │
└───────────────────────────────────────────────────────────────────┘
```

## ① Resource Engine — un seul supertype de contenu
Remplace progressivement `Course`/`BlogPost` éclatés.

```ts
interface Resource {
  id: string;
  kind: 'exercise' | 'article' | 'document' | 'pack' | 'book';
  title: string;
  subject: SubjectName; grade: GradeLevel; trimester?: Trimester;
  topic?: string;            // taxonomie (Idea 2) — Book→Chapter→Topic
  tags: string[];
  authorId: string; authorName: string;
  watermarkText: string;     // obligatoire (Idea 2)
  bookRef?: { bookId: string; chapter?: string };  // lien manuel (Idea 2)
  blocks?: EditorBlock[];    // exercise/article (formats QCM/VF/trous/flèches inclus)
  imageUrls?: string[];      // scans
  pdfUrl?: string;           // books CNP
  resourceIds?: string[];    // pack (Idea 12)
  aiGenerated?: boolean; aiVerified?: boolean;  // Variante IA (Idea 11)
  createdAt: string;
}
```
Couvre: Ideas 1, 2, 11, 12 + formats d'exercices (TASK-exercise-formats.md).

## ② Interaction Engine — UNE collection, UN service
Toutes les actions sociales = un seul modèle générique. Compteurs dérivés, jamais stockés à la main.

```ts
interface Interaction {
  id: string;
  type: 'rating' | 'comment' | 'reply' | 'question' | 'answer'
      | 'accept' | 'vote' | 'follow' | 'favorite' | 'report';
  actorId: string; actorRole: 'teacher' | 'parent';
  targetType: 'resource' | 'comment' | 'question' | 'answer' | 'user';
  targetId: string;
  payload?: { stars?: 1|2|3|4|5; text?: string; reason?: string };
  createdAt: string;
}
```
- `rating` → Idea 4 (étoiles articles) · `comment/reply` → Idea 5 · `question/answer/accept` → Idea 6 (✓ Résolu) · `vote` → 👍
- `follow` → Idea 8 (fil "Mes abonnements" = resources where authorId ∈ follows)
- `favorite` → Idea 10 ("Mes Favoris" — migrer watchlist localStorage → Firestore)
- `report` → Idea 13 (file de modération = interactions type=report)
- **Réputation (Idea 7) = ledger dérivé**: accept=+15, vote=+2, publication=+5 → score, niveaux (Bronze/مساهم نشيط/Expert), badges.
- **Contributions (Idea 9) = agrégats par type** sur ce même journal — zéro compteur manuel.

`InteractionService` (Angular, signals) + collection Firestore `interactions`. Un seul point à sécuriser/modérer.

## ③ Identity & Reputation
`UserProfile` (déjà: gender ✔, primarySubject ✔) + à ajouter: **photo uploadée** (via /api/upload existant, Idea 3), `reputationScore`, `level`, `badges[]` (dérivés du ledger). Affichage: profil public enseignant (abonnés, étoiles moyennes, contributions) et espace "Mes contributions" parent.

## ④ AI Gateway — un middleware, N capacités
Tout passe par `/api/ai/*` (originGuard + rate-limit + daily-cap + [plus tard] auth token — déjà en place).

| Endpoint | Couvre | Note |
|---|---|---|
| generate-exercise (+format) | Studio, A7 pack | existant, étendu |
| variant | Idea 11 | même topic/format, chiffres changés |
| explain-concept | A1 tuteur | + injection du contenu de la page (grounding) |
| photo-correct / photo-solve | A2 | Gemini Vision : parent photographie un exercice → résolution pas-à-pas + détection niveau/matière/topic → renvoie exercices similaires (via index ⑤). **Demande réelle confirmée** (posts FB parents type "نجحني سنة خامسة تونس" : photo d'énoncé + "شكون ينجم يعاوني"). |
| summarize / translate / adapt-level | A3 A4 A5 | 3 petits endpoints texte |
| quality-check | A6 | étend auto-tag-document |
| illustrate | A8 | scène → flash-image; schéma → **SVG texte** |

Règles d'accuracy (toutes routes): prompt système strict (rôle+niveau+matière), contexte injecté, refus hors programme, température basse, sortie JSON schématisée, **validation enseignant avant publication**.

## ⑤ Discovery & Notifications
- **Recherche unifiée (Idea 14)**: un index client computed sur Resources (titre+topic+tags+auteur), filtres niveau/matière/type; V2 → index serveur.
- **Fil**: accueil parent = mix (abonnements > populaires > récents).
- **Notifications**: service existant + events follow (Idea 8); digest hebdo (Idea 15) plus tard, via cron serveur.

## Ordre de construction (phases)
1. **P1 — Interaction Engine MVP**: favorites (migration watchlist) + ratings + comments articles. Petit modèle, gros visible.
2. **P2 — Q&A résolu + réputation + contributions + follow** (même moteur, payloads en plus).
3. **P3 — Studio A/B shells** + formats d'exercices (TASK en cours chez Antigravity) + Variante IA.
4. **P4 — IA**: tuteur groundé, photo-correct, translate/adapt/summarize, illustrate.
5. **P5 — Polish**: recherche unifiée, packs, modération UI, bottom-nav, onboarding, cartes uniformes, navbar.

## Décisions clés
- **Un journal d'interactions** au lieu de 8 systèmes — compteurs toujours dérivés.
- **Un supertype Resource** au lieu de Course/Blog/Exercise divergents.
- **Un gateway IA** — jamais d'appel Gemini côté client.
- **UGC ⇒ modération first**: commentaires publics n'ouvrent qu'avec le bouton Signaler (Idea 13).
- Auth serveur réelle (firebase-admin) reste le prérequis avant écriture Firestore par les clients.
