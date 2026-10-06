---
name: delete-exact-duplicates
description: "When organizing image/file datasets, delete byte-identical duplicates outright (don't park them)"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 8a596474-058e-455a-baad-285a27e95818
---

When organizing datasets, **delete 100% byte-identical (md5-equal) duplicates outright** — do not move them to a `_duplicates/` holding folder. Keep any file that is not 100% identical (near-dup / same-content-different-bytes stays).

**Why:** user confirmed "delete the duplicated always" and earlier "if not fully duplicated to 100% keep it".

**How to apply:** dedupe by md5; `rm` the exact copies; keep content-variants (e.g. different resolution/redraw of same worksheet).
