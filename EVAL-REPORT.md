# Rapport d'Audit Complet : Pipeline & Paramètres de Génération d'Images

**Date :** 2026-10-07  
**Projet :** Madrasati TN  
**Périmètre :** Moteur d'images (`image-chain.ts`), Endpoints API (`ai.routes.ts`), Services & Features (`worksheet-generator`, `article-studio`, `storage.ts`).

---

## 1. Synthèse Exécutive

Le sous-système de génération d'images fonctionne grâce à une chaîne hybride gratuite (Cloudflare Workers AI > Pollinations > Fallback SVG). Cependant, l'audit technique révèle **10 failles architecturales et incohérences majeures** entre les besoins métier des composants frontend et le moteur backend :

| # | Composant | Type de Faille | Gravité | Impact |
|---|-----------|----------------|---------|--------|
| **1** | `worksheet-generator.ts` | Concurrence non maîtrisée (`Promise.all`) | **Critique** | Épuise le rate limiter IP (8 req/min) et crashe Pollinations dès le 1er clic sur une fiche complète. |
| **2** | `ai.routes.ts` / `worksheet.ts` | Double saut LLM redondant | **Moyenne** | Gaspille 1 à 2 secondes de latence et des tokens pour réécrire un prompt déjà rédigé en anglais par l'IA. |
| **3** | `article-studio.ts` | Paramètre métier manquant (`kind`) | **Élevée** | La branche `article-cover` du backend est un code mort; les couvertures héritent du style générique 4:3. |
| **4** | `image-chain.ts` (`cfJson`) | Perte des dimensions dans le payload | **Élevée** | `req.width` et `req.height` sont ignorés pour les modèles Cloudflare JSON (`flux-1-schnell`, `lucid-origin`). |
| **5** | Global (`ai.routes.ts`) | Résolution rigide `1024x768` | **Moyenne** | Format inadapté : cartes A4 déformées (besoin de carré 1:1) et bannières d'articles rognées (besoin de 16:9). |
| **6** | `storage.ts` / `ai.routes.ts` | Non-respect du standard WebP | **Élevée** | Fichiers PNG bruts de 1.5 Mo+ sauvés sur disque sans compression WebP (saturation de l'espace disque VPS). |
| **7** | `ai.routes.ts` | Verrouillage déterministe du `seed` | **Moyenne** | Impossible de regénérer une variante : un texte identique produit toujours la même image. |
| **8** | Global (`ai.routes.ts`) | Absence de cache d'images & déduplication | **Moyenne** | Même requête = ré-inférence systématique et création de doublons disque UUID. |
| **9** | `image-chain.ts` | Pollution du prompt positif (anti-text) | **Moyenne** | Concaténation de "no text, no letters" dans le prompt positif des modèles à diffusion (tokens parasites). |
| **10** | `ai.routes.ts` | Fragilité du Fallback SVG | **Moyenne** | Les LLMs génèrent fréquemment du SVG non valide ou tronqué, provoquant une erreur 500 au lieu d'une image de secours. |

---

## 2. Analyse Détaillée par Fonctionnalité

### A. Générateur de Fiches d'Exercices (`/generate` — `worksheet-generator.ts`)
- **Flux du Prompt :**
  1. `worksheet.ts` génère `ex.imagePrompt` (description concrète en anglais sans texte).
  2. `worksheet-generator.ts` appelle `store.generateIllustration(ex.imagePrompt, style)`.
  3. `buildImagePrompt` dans `ai.routes.ts` réexécute un appel Gemini (Chaîne B) pour résumer ce texte en 35 mots et deviner la catégorie.
- **Gaps Identifiés :**
  - **Rafale concurrente non bridée :** `Promise.all(list.map(...))` lance 6 à 10 requêtes simultanées. Or, le garde-fou IP `aiPerIpMinuteLimiter` plafonne à 8 requêtes/minute et 60/jour. Une seule fiche peut déclencher un blocage HTTP 429 ou épuiser 15% du quota journalier de l'utilisateur.
  - **Incompatibilité Pollinations :** En cas de bascule sur Pollinations, sa limite stricte d'une image toutes les 30–60s par IP provoque des erreurs immédiates 402/429 pour 80% des exercices.
  - **Perte de contexte :** Le composant possède `dna.grade` et `dna.subject` mais ne les transmet pas à l'API.

---

### B. Studio d'Articles Pédagogiques (`/article-studio` — `article-studio.ts`)
- **Flux du Prompt :**
  1. Le studio envoie uniquement `promptText: article.title`.
- **Gaps Identifiés :**
  - **Code Mort Backend :** La route `ai.routes.ts` (L154) contient :
    ```ts
    let category: ImageCategory = input.kind === 'article-cover' ? 'article' : 'generic';
    ```
    Comme `kind: 'article-cover'` n'est jamais envoyé, le style éditorial dédié `IMAGE_STYLES.article` (*"wide editorial cover illustration, flat vector..."*) n'est jamais activé.
  - **Prompt Appauvri :** Le titre seul ("Les fractions") est trop abstrait. Le résumé et le corps de l'article sont ignorés par le prompt.
  - **Inadéquation du Ratio :** Les couvertures d'articles web nécessitent du 16:9 (`1200x630` ou `1024x576`). Le backend renvoie du 4:3 (`1024x768`), provoquant des bandes noires ou des recadrages CSS agressifs.

---

## 3. Analyse de l'Infrastructure & Chaîne de Modèles (`image-chain.ts`)

### A. Format et Stockage sur le VPS (`storage.ts`)
- **Règle Projet Enfreinte :** Le standard projet impose un flux direct en `.webp` (qualité 82, sans étape PNG).
- **Réalité sur Disque :** `saveGenerated` enregistre directement le buffer renvoyé par le fournisseur (`illustration_${UUID}.${res.ext}`). Cloudflare Flux renvoie du PNG non compressé (1.2 à 2.0 Mo par image).
- **Absence de Déduplication :** Des illustrations récurrentes (ex. "5 pommes sur une table") génèrent des fichiers disques distincts à chaque appel.

### B. Gestion des Fournisseurs & Modèles
- **Cloudflare JSON (`cfJson`) :** Les modèles `cf-flux-1-schnell` et `cf-lucid-origin` envoient uniquement `{ prompt: req.prompt, steps: 4 }`. Les champs `width` et `height` déclarés dans `ImageRequest` sont ignorés.
- **Pollinations Flux :** Modèle gratuit sans clé mais marqué `watermarked: true`. Il appose un filigrane visible et subit un rate-limiting IP drastique.
- **Hedge Racing Latency :** Le délai de secours `IMAGE_HEDGE_MS` est fixé à 8000ms. Si Cloudflare tarde, le client attend 8 secondes avant que le fournisseur suivant ne soit sollicité.

---

## 4. Recommandations Architecturales Directes

1. **Adapter les Ratios aux Contextes :**
   - Fiches d'exercices : carré `512x512` ou `640x480`.
   - Couvertures d'articles : `1200x630` ou `1024x576` avec envoi explicite de `kind: 'article-cover'`.
2. **File d'Attente Séquentielle (Concurrence Fiches) :**
   - Remplacer `Promise.all` par un exécuteur avec concurrence maximale de 2 (ou batch séquentiel) pour préserver le rate limiter et le fournisseur.
3. **Supprimer le Double Saut LLM :**
   - Si `promptText` est déjà un `imagePrompt` produit par une compétence IA, court-circuiter `buildImagePrompt` et l'injecter directement dans le template de style.
4. **Compression WebP Immédiate :**
   - Convertir tout buffer image reçu en WebP (qualité 82) avant écriture sous `/uploads/generated/`.
5. **Déverrouiller le Seed :**
   - Ajouter un paramètre optionnel `seed?: number` (ou bouton "Variante" incrémentant le seed) au lieu de hasher strictement la chaîne de caractères.

---

## 5. Correctifs Implémentés & Validés (2026-10-07)

1. **Fix 1 (`/chat-article` reply):** Ajout de l'alias `assistantMessage -> replyText` dans [compat.ts](file:///c:/Users/lassa/Documents/GitHub/MadrasatiTN/src/server/routes/compat.ts#L80) et test unitaire validé dans `compat.spec.ts`.
2. **Fix 2 (Throttling des illustrations):** Remplacement du `Promise.all` par une file de 2 requêtes simultanées et gestion du code HTTP 429 avec attente selon l'en-tête `Retry-After` dans [worksheet-generator.ts](file:///c:/Users/lassa/Documents/GitHub/MadrasatiTN/src/app/features/generate/worksheet-generator.ts#L225) et [education-store.ts](file:///c:/Users/lassa/Documents/GitHub/MadrasatiTN/src/app/core/services/education-store.ts#L1093).
3. **Fix 3 (Variation de Seed & Boutons Régénération):** Prise en compte du paramètre `variation` dans [ai.routes.ts](file:///c:/Users/lassa/Documents/GitHub/MadrasatiTN/src/server/routes/ai.routes.ts#L919) via `seedFor(promptText + variation)`. Boutons interactifs "Variante" ajoutés sur les cartes d'exercices et dans le studio d'articles.
4. **Fix 4 (Cache des illustrations):** Mise en cache dans `exerciseCache` avec clé `hashKey({prompt, style, variation})`. Contournement automatique du cache quand `variation > 0`.
5. **Fix 6 (Test A/B du Prompt `IMAGE_COMMON`):** Test comparatif réalisé sur Flux. Le prompt avec interdiction explicite de texte empêche la génération de caractères parasites dans les livres ouverts; la constante a donc été conservée.
6. **Tests & Build :** 23 suites de tests (115 tests unitaires) au vert (`pnpm test`), validation TypeScript (`pnpm tsc --noEmit`), lint ESLint sans erreur, build production réussi (`pnpm build`).

