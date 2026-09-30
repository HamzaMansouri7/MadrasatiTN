# Madrasati TN (مدرستي تونس) — Progress & System Architecture

**Last Updated:** September 30, 2026  
**Production URL:** [https://madrastihub.com](https://madrastihub.com) | [https://www.madrastihub.com](https://www.madrastihub.com)  
**Deployment Server:** Contabo Ubuntu 24 VPS (`169.58.107.183:3004`) behind Nginx Reverse Proxy with Let's Encrypt SSL.

---

## 1. Executive Summary
Madrasati TN is transformed into a high-performance **Collaborative Pedagogical & Document Exchange Hub** dedicated to the Tunisian primary educational ecosystem (1ère à 6ème Année). It replaces fragmented Facebook groups and informal WhatsApp threads with a unified, distraction-free platform featuring:
1. Notion-style Block Writing Studio & Live A4 Print Engine (`EditorStudioComponent`).
2. Multimodal AI Document Ingestion & Vision OCR (Gemini 2.5 Flash) for photos, screenshots, and PDFs.
3. Strict 4-Facet Classification Matrix (Grade, Subject, Trimester, DocType) preventing library corruption.
4. Official Republic of Tunisia header and authenticated teacher legal watermark attribution.
5. Real-time Firebase Notification System with interactive navbar dropdown drawer.
6. Verified Google Authentication with Firestore synchronization and session caching.

---

## 2. Completed Milestones

### Milestone 1: Production Infrastructure & SSL (`madrastihub.com`)
* **Nginx Configuration:** Reverse proxy to port `3004` with HTTP/1.1 WebSocket and chunked transfer support.
* **Certbot SSL:** TLS 1.3 certificate installed and auto-renewed on `madrastihub.com` and `www.madrastihub.com`.
* **Zero-Cost VPS Storage:** `/api/upload` base64 disk storage engine saving directly to `/root/MadrasatiTN/uploads`, served via Express static.

### Milestone 2: Block Writing Studio (`EditorStudioComponent`)
* **Location:** `src/app/features/editor/`
* **Block Types:** `heading1-3`, `paragraph`, `callout` (Tip/Warning/Definition), `exercise` (with points & solution), `image`, `cartouche` (Republic header & student ID block), `divider`.
* **Triple View Engine:** Single Editor view, Side-by-Side Split Screen, and Live Printable A4 Page.
* **1-Click Publishing:** Instant dispatch to the Document Bank and Pedagogical Blog with automated teacher attribution stamps.

### Milestone 3: Multimodal Vision OCR & Classification Engine
* **Location:** `src/server.ts` (`/api/ai/auto-tag-document`) & `src/app/features/teacher/teacher-home.ts`
* **Multimodal Processing:** Sends base64 image data directly to Gemini 2.5 Flash (`inlineData`), performing full OCR extraction from camera snapshots and screenshots of exam sheets.
* **Classification Rules:**
  * **Grade:** `1ère Année` à `6ème Année`
  * **Subject:** `Mathématiques`, `Français`, `اللغة العربية`, `Éveil Scientifique`, `Histoire & Géographie`, `Anglais`
  * **Trimester:** `Trimestre 1`, `Trimestre 2`, `Trimestre 3`
  * **Type:** `Devoir de Contrôle`, `Devoir de Synthèse`, `Fiche de Révision`, `Série d'Exercices`
* **Markdown Transcription:** Converts raw image text into clean, structured Markdown exercises with points, instructions, and corrections.

### Milestone 4: Identity Attribution & Watermark Engine
* **Teacher Metadata:** Extracted from authenticated Firebase profile (`displayName`, `school`, `uid`).
* **Stamp Pattern:** `Madrasati TN — Document Certifié — ${teacherName} (${school})`.
* **Official Republic Header:** `الجمهورية التونسية - وزارة التربية` with student ID block (`الاسم واللقب / القسم / العدد /20`) on all printable A4 layouts.

### Milestone 5: Real-Time Firebase Notification System
* **Location:** `src/app/core/services/firebase.service.ts` & `src/app/shared/components/navbar.ts`
* **Real-time Listener:** `onSnapshot` listener on Firestore `notifications` collection (ordered by timestamp desc, limit 20).
* **Interactive UI:** Header bell dropdown with animated unread badge counter, colored type icons, timestamps, "Tout lire" 1-click button, and direct role routing.
* **Automated Dispatch:** Triggers real-time alerts whenever a teacher publishes a document, exam, blog post, or answers a parent question.

### Milestone 6: Parent Document Bank & Discovery
* **Location:** `src/app/features/parent/parent-home.ts` & `src/app/features/discovery/public-discovery.ts`
* **Pagination:** Strict 9-item chunks with dynamic page buttons, items range counter (`عرض 1 - 9 من أصل 45 وثيقة`), and auto-reset to page 1 on filter changes.
* **1-Click WhatsApp Sharing:** Encoded URLs for immediate distribution to classroom parent groups.

---

## 3. Technology Stack & Directory Map

```
src/
├── app/
│   ├── core/                        # Store, State, Models, Services
│   │   ├── models/education.model.ts
│   │   ├── services/education-store.ts
│   │   ├── services/firebase.service.ts
│   │   └── services/language.service.ts
│   │
│   ├── shared/components/
│   │   ├── navbar.ts                # Search, Bell Dropdown, Auth Avatar, Flag Badge
│   │   └── auth-modal.ts            # Google Popup & Email Credentials Modal
│   │
│   ├── features/
│   │   ├── editor/                  # Notion-Style Block Studio (Editor / Split / A4 Print)
│   │   ├── teacher/                 # Classroom management, OCR Uploads, Exam Creator
│   │   ├── parent/                  # 9-Item Paginated Document Bank & Multi-child Ledger
│   │   ├── student/                 # Interactive Homework Solver & AI Tutor
│   │   ├── discovery/               # 38 CNP Official Scraped Textbooks & Search
│   │   └── landing/                 # Public Showcase & Conversion Page
│   │
│   └── server.ts                    # SSR + /api/upload + Gemini 2.5 Flash Vision OCR
```

---

## 4. Deployment Command Reference (Contabo VPS)

```powershell
# Windows Deployment One-Liner
ssh -F NUL -i C:/Users/lassa/.ssh/id_ed25519 root@169.58.107.183 "cd /root/MadrasatiTN && git pull origin main && pnpm run build && pm2 reload MadrasatiTN"
```
