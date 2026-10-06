---
name: firebase-project-madrasti
description: "Live Firebase project is cursor-ai-presentations (display name renamed Madrasti); do NOT switch to madrasti-a46d6, real users live there"
metadata:
  node_type: memory
  type: project
  originSessionId: 928ea218-7580-4dd5-a4b2-2b1ccf7e3822
  modified: 2026-10-06T19:39:59.863Z
---

Live app stays on Firebase project ID `cursor-ai-presentations` (number 33479552411, database `ai-studio-madrasatitnespac-...`). The owner renamed its display name to "Madrasti" on 2026-10-06 (verified via `firebase projects:list`). IDs cannot be renamed, and the app config was not changed.

A second, empty project `madrasti-a46d6` (number 300804416235) also exists, with no apps or database. Its web config is saved but inactive in `firebase-applet-config.madrasti.json`. Decision (2026-10-06): keep things as they are, no switch.

**Why:** real users and data live in the old project; a switch would log them out or lose data.
**How to apply:** never swap `firebase-applet-config.json` / `.firebaserc` or migrate without an explicit, careful go-ahead. Production Firestore deploys (`firebase deploy --only firestore:rules,firestore:indexes`) are blocked by the permission classifier, so the owner runs them. Don't confuse the two projects, both display as "madrasti".
