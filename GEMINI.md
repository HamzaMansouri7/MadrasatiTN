# Madrasati TN (مدرستي تونس) — Architecture & Project Standards

## 1. Overview & Vision
Madrasati TN (مدرستي تونس) is a **collaborative Teacher–Parent Educational Resource Hub** for the Tunisian primary education system (1ère à 6ème Année). It is not an LMS or virtual school; it is a structured knowledge bank connecting official CNP textbooks, teacher-authored exercises/corrections, and parent home practice.

- **Knowledge Hierarchy:** `Book (CNP) ➔ Chapter ➔ Topic / Module ➔ Exercises ➔ Step-by-Step Corrections`.
- **Core Loop:** Teachers publish & verify ➔ AI enriches (OCR, summaries, hints, variations) ➔ Parents discover & practice ➔ Resource-centric Teacher ↔ Parent communication.
- **Stack:** Angular 21 (Standalone, Signals, OnPush) + Tailwind CSS + Express SSR + Google Gemini AI.
- **Core Value Pillars:**
  1. A4 printable official ministry exam layout with teacher watermark & attribution.
  2. Free VPS disk-backed storage engine (`/api/upload`) eliminating third-party cloud costs.
  3. Direct 1-click WhatsApp document and assignment distribution.
  4. Homework solver for parents with notebook photo uploads and bilingual AI explanations.

---

## 2. Directory Structure & Path Aliases

The codebase follows the enterprise **Feature-based + Core / Shared** Angular architecture:

```
src/
├── app/
│   ├── core/                        # Singleton services, state management, models, static data
│   │   ├── models/                  # Domain contracts (education.model.ts)
│   │   ├── services/                # EducationStore, FirebaseService, LanguageService
│   │   ├── data/                    # CNP scraped textbooks registry (cnp-books.data.ts)
│   │   └── index.ts                 # Barrel export: import from '@core'
│   │
│   ├── shared/                      # Reusable presentational components and widgets
│   │   ├── components/              # NavbarComponent, AuthModalComponent
│   │   └── index.ts                 # Barrel export: import from '@shared'
│   │
│   ├── features/                    # Domain features (routed & workspace components)
│   │   ├── landing/                 # Public presentation & conversion landing page
│   │   ├── teacher/                 # Teacher classroom manager, course/exam publisher
│   │   ├── parent/                  # Parent multi-child tracker & direct teacher messaging
│   │   ├── solve/                   # Parent homework solver, camera upload & AI explanation
│   │   ├── discovery/               # 38 CNP official textbooks & public repository
│   │   └── index.ts                 # Barrel export: import from '@features'
│   │
│   ├── app.ts                       # Main application shell
│   ├── app.html                     # Root layout & view switcher
│   ├── app.css                      # Global styles and print media queries
│   └── app.routes.ts                # Route configuration
│
├── server.ts                        # Express SSR server + `/api/upload` + `/api/ai/*`
└── uploads/                         # VPS local disk upload storage (static-served)
```

### TypeScript Path Aliases (`tsconfig.json`)
- `@core` & `@core/*` ➔ `src/app/core/*`
- `@shared` & `@shared/*` ➔ `src/app/shared/*`
- `@features` & `@features/*` ➔ `src/app/features/*`

---

## 3. State Management & Reactivity
- **Framework:** Pure Angular Signals (`signal`, `computed`, `effect`) within `@core/services/education-store.ts`.
- **Change Detection:** Mandatory `ChangeDetectionStrategy.OnPush` on every component.
- **Control Flow:** Exclusively use modern syntax (`@if`, `@for`, `@switch`, `@case`).

---

## 4. Storage & Zero-Cost Infrastructure
- **VPS File Storage (`/api/upload`):** Files and notebook photos are uploaded as base64 to `/api/upload` and saved directly to the VPS disk under `/uploads`.
- **Static Serving:** Served via `express.static('uploads')` at `http://<host>:<port>/uploads/<filename>`.
- **Benefit:** Zero Firebase Storage limits (no 5GB cap, zero egress bills).

---

## 5. Official A4 Print & Watermark Engine
- **CSS Engine:** Defined in `src/styles.css` under `@media print`.
- **Layout:** Forces 100% white background, hides navbar, action buttons, modals, and headers.
- **Ministry Header:** Republic of Tunisia (`الجمهورية التونسية - وزارة التربية`) + Student identification block (`الاسم واللقب / القسم / العدد /20`).
- **Watermark:** 45-degree diagonal `MADRASATI TN` watermark stamp across printable sheets + teacher attribution footer.

---

## 6. Internationalization (FR / AR) Rules
- **Rule:** Never use backslash-escaped apostrophes (`\'`) inside Angular template interpolations (`{{ ... }}`). Angular's parser treats them as unparsed text or syntax errors.
- **Convention:** Add all UI strings with French and Arabic variants to `LanguageService.dictionary` in `src/app/core/services/language.service.ts` and reference them via `lang.t('keyName')`.

---

## 7. Deployment Playbook (Contabo VPS)
- **Host:** `169.58.107.183` (Contabo Ubuntu 24)
- **User:** `root`
- **SSH Key:** Local ed25519 key (`~/.ssh/id_ed25519`)
- **Windows SSH Syntax:** Always pass `-F NUL` to bypass permission bugs:
  ```powershell
  ssh -F NUL -i C:/Users/lassa/.ssh/id_ed25519 root@169.58.107.183 "<command>"
  ```
- **PM2 Service:** `MadrasatiTN` running on Port `3004`.
- **Deployment Pipeline:**
  ```bash
  cd /root/MadrasatiTN && git pull origin main && pnpm run build && pm2 reload MadrasatiTN
  ```

---

## 8. Commercial Parascolaire Pipeline & Copy Guard Standards
- **Strict Private Isolation:** Commercial workbooks (PDFs and archive JSONs) are strictly untracked (`parascolaire/` in `.gitignore`) and NEVER exposed via public HTTP endpoints (`public/` or `/uploads`).
- **Contabo VPS Location:** Private system path `/var/madrasati/private/parascolaire/index.jsonl`.
- **Knowledge Adapter:** `fromParascolairePatterns()` in `src/server/knowledge-source.ts` reads the index server-side only and injects exercise patterns + max 1–2 inspiration examples flagged `[INSPIRATION ONLY - DO NOT COPY]`.
- **Anti-Plagiarism Copy Guard:** `checkCopyGuard()` in `src/server/post-checks.ts` measures n-gram Jaccard similarity between generated exercises and source inspirations. If similarity >= 40%, `/api/ai/generate-exercise` automatically re-prompts the AI with perturbation constraints to ensure 100% original output.
- **Model Standard:** `gemini-3.7-flash` (with `gemini-3.8-flash` fallback) across all OCR extraction scripts and server routes.
