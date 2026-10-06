---
name: teachers-are-authors
description: "Teachers = authors/attribution layer, not content — directory is secondary; author links on resource cards are the primary surface"
metadata: 
  node_type: memory
  type: project
  originSessionId: 0229ee92-d645-4094-bb01-780bb438fd69
---

Owner decision (2026-10-02): per the resource-hub vision ([[product-vision-resource-hub]]), teachers in the public app are an **attribution/trust layer**, not a content type. Primary surface = clickable author name on every resource card → teacher profile (their uploads + follow). The دليل المعلمين rayon in the library stays but is secondary (landing page for author clicks). Stats shown must be real (upload counts) — no fake ratings/reviews theater. Mock teacher data was removed; real cards mirror from Firestore `teachers` collection via `syncTeacherCard()` ([[ai-grounding-layer]] session).

**How to apply:** when touching resource cards, wire author → profile; never reintroduce seeded/fake teacher profiles or invented ratings.
