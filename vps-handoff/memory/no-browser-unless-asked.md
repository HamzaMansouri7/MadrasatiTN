---
name: no-browser-unless-asked
description: Never open or drive a browser (Playwright etc.) unless the owner explicitly orders it
metadata:
  node_type: memory
  type: feedback
  originSessionId: f23f8bed-49e7-496e-a422-85923e7a112f
  modified: 2026-10-06T17:18:25.901Z
---

Do not open a browser, use Playwright, or take screenshots on my own initiative. Only when the owner explicitly asks.

**Why:** on 2026-10-06 I opened Playwright to check the memo studio without being asked and the owner stopped it and asked for this to be a global rule.

**How to apply:** verify with lint/test/build, and state that no visual check was done. Also written to the global `C:\Users\lassa\.claude\CLAUDE.md`. See [[design-system-cartouche]] for UI work.
