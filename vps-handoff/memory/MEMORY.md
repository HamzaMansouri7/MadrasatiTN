# Memory Index

- [Design system (Cartouche)](design-system-cartouche.md) — all UI follows DESIGN.md, match landing pixel-perfect, use frontend-design + ui-ux-pro-max skills
- [Delete exact duplicates](delete-exact-duplicates.md) — dataset org: rm 100% byte-identical dupes outright, keep near-dups
- [Product vision: Resource hub](product-vision-resource-hub.md) — teacher↔parent resource hub (not LMS), Resource model, Book→Chapter→Topic→Exercise, AI enriches
- [AI grounding layer](ai-grounding-layer.md) — KnowledgeSource + retrieveContext shared by all /api/ai/*; AR default; extend via adapters not endpoints
- [Gemini key location](gemini-key-location.md) — key in repo .env (gitignored); app doesn't auto-load .env; never ask owner again
- [Teachers are authors](teachers-are-authors.md) — attribution layer not content; author links on cards primary, directory secondary; real stats only
- [Public-first access model](public-first-access-model.md) — all read features free/no-login; gate only studio/follow/comment/ask at action level; merge parent space into library
- [No browser unless asked](no-browser-unless-asked.md) — never open/drive a browser (Playwright, screenshots) unless owner explicitly orders; also in global ~/.claude/CLAUDE.md
- [Firebase project madrasti](firebase-project-madrasti.md) — live = cursor-ai-presentations (renamed Madrasti); never switch to madrasti-a46d6, real users
