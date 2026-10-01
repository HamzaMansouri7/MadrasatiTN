# Plan d'Implémentation : Studio de Rédaction d'Articles en Mode Chat (`app-article-studio`)

## 1. Vue d'Ensemble & Vision
Le Studio de Rédaction d'Articles est un espace dédié, séparé du studio d'examens A4 (`app-editor-studio`). Il permet aux enseignants de concevoir des articles pédagogiques, des retours d'expérience et des guides pour parents via un **dialogue interactif avec l'IA Gemini** (format Substack / ChatGPT co-pilot), avec aperçu en temps réel style Medium.

---

## 2. Architecture & Fichiers Dédiés

### 2.1 Arborescence Frontend
```
src/app/features/article-studio/
├── article-studio.ts      # Logique de composant (Signals, OnPush, chat & article state)
├── article-studio.html    # Vue Bento split : Chat co-pilot à gauche (40%), Rendu Medium à droite (60%)
└── article-studio.css     # Typographie de lecture, bulles de chat et dock flottant
```

### 2.2 Routage & Rôles
* **Type `UserRole`** (`src/app/core/models/education.model.ts`) : ajout de `'article-editor'`.
* **Sélecteur racine** (`src/app/app.html`) :
  ```html
  @case ('article-editor') {
    <app-article-studio />
  }
  ```
* **Navigation de retour** : utilise `store.previousRole()` pour réintégrer l'espace enseignant ou le blog sans rechargement.

---

## 3. Endpoints Backend (`src/server.ts`)

### 3.1 `POST /api/ai/chat-article`
* **Modèle :** `gemini-2.5-flash`
* **Rôle Système :** Conseiller pédagogique senior spécialisé dans l'enseignement primaire tunisien (1ère à 6ème année).
* **Payload Entrant :**
  ```json
  {
    "messages": [
      { "role": "user" | "assistant", "content": "..." }
    ],
    "currentArticle": {
      "title": "Titre actuel",
      "summary": "Résumé",
      "subject": "Mathématiques",
      "grade": "4ème Année",
      "contentMarkdown": "# Titre\n\nCorps..."
    },
    "userPrompt": "Ajoute une section avec 3 erreurs fréquentes des élèves"
  }
  ```
* **Réponse Structurée :**
  ```json
  {
    "replyText": "Explication de la modification...",
    "updatedArticle": {
      "title": "...",
      "summary": "...",
      "subject": "...",
      "grade": "...",
      "contentMarkdown": "..."
    },
    "suggestedChips": [
      "Ajouter un conseil pratique pour les parents",
      "Générer une illustration pour ce paragraphe",
      "Rédiger la conclusion"
    ]
  }
  ```

### 3.2 `POST /api/ai/generate-illustration`
* **Modèle :** Google Imagen 3 (`imagen-3.0-generate-002`)
* **Stockage :** Écriture directe sur disque VPS (`/uploads/illustrations/<uuid>.png`)
* **URL Publique :** `/uploads/illustrations/<uuid>.png` ($0 de coût tiers).

---

## 4. Gestion des Images (Dual-Engine)

1. **Upload Local (Pièces Jointes) :**
   * Glisser-déposer ou icône trombone dans le chat d'entrée.
   * Upload base64 vers `/api/upload` existant ➔ stockage VPS disk ➔ injection dans l'article.
   * Analyse visuelle par Gemini 2.5 Flash pour générer automatiquement la légende et le commentaire pédagogique.

2. **Génération d'Illustrations par IA :**
   * Déclenchée par chip contextuel ou demande libre dans le chat (ex: *"Génère une illustration pédagogique montrant les fractions avec un gâteau"*).
   * L'image générée est sauvegardée sur le disque VPS et insérée comme image de couverture ou bloc image dans l'article.

---

## 5. Expérience Utilisateur & Design (`ui-ux-pro-max`)

* **Panneau Gauche : Assistant Conversationnel (40% de largeur)**
  * Fil de discussion épuré avec badges de rôle distincts.
  * Puces de suggestions rapides en 1-clic (*"Simplifier le vocabulaire"*, *"Ajouter un exemple tunisien"*, *"Format QCM"*).
  * Dock de saisie ancré en bas avec bouton microphone/texte, trombone d'image et touche entrée.

* **Panneau Droit : Canvas de Lecture Medium (60% de largeur)**
  * Bannière d'illustration de couverture avec bouton de remplacement / génération.
  * Métadonnées : Temps de lecture estimé, niveau scolaire, matière, date et auteur.
  * Corps de texte au format prose (typographie fluide, interligne aéré, citations en exergue).
  * Bouton flottant ou en-tête avec action directe : **"Publier sur le Blog"**.

---

## 6. Flux de Publication

1. L'enseignant finalise l'article dans le chat.
2. Clic sur **"Publier sur le Blog"**.
3. Exécution de `store.addBlogPost(...)` avec enregistrement de l'auteur et des tags.
4. Notification globale envoyée via `FirebaseService.addNotification(...)`.
5. Redirection immédiate vers la vue publique de l'article sur Madrasati TN.
