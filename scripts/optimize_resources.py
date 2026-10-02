"""Optimize extracted resources: PNG -> WebP (max width 1600px, q82) and update manifests.

Enforces RESOURCE-PIPELINE.md quality rules. Safe to re-run (skips already-converted items).
Originals stay re-extractable from the source PDFs referenced in each manifest item's `ref`.

Usage: python scripts/optimize_resources.py
"""
import json
import os

from PIL import Image

PUBLIC = "public"
INDEX = os.path.join(PUBLIC, "assets", "resources", "index.json")
MAX_WIDTH = 1600
QUALITY = 82


def optimize_item(item: dict) -> tuple[bool, int, int]:
    """Convert one manifest item's image to WebP. Returns (changed, bytes_before, bytes_after)."""
    rel = item.get("relPath", "")
    src = os.path.join(PUBLIC, rel.replace("/", os.sep))
    if not rel.lower().endswith(".png") or not os.path.exists(src):
        return False, 0, 0

    before = os.path.getsize(src)
    dest = src[: -len(".png")] + ".webp"

    with Image.open(src) as img:
        if img.width > MAX_WIDTH:
            ratio = MAX_WIDTH / img.width
            img = img.resize((MAX_WIDTH, round(img.height * ratio)), Image.LANCZOS)
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
        img.save(dest, "WEBP", quality=QUALITY, method=6)

    os.remove(src)
    item["file"] = os.path.basename(dest)
    item["relPath"] = rel[: -len(".png")] + ".webp"
    return True, before, os.path.getsize(dest)


def main() -> None:
    with open(INDEX, encoding="utf-8") as f:
        index = json.load(f)

    total_before = total_after = converted = 0
    for manifest_rel in index.get("manifests", []):
        manifest_path = os.path.join(PUBLIC, manifest_rel.replace("/", os.sep))
        with open(manifest_path, encoding="utf-8") as f:
            manifest = json.load(f)

        changed = False
        for item in manifest.get("items", []):
            did, before, after = optimize_item(item)
            if did:
                changed = True
                converted += 1
                total_before += before
                total_after += after

        if changed:
            with open(manifest_path, "w", encoding="utf-8") as f:
                json.dump(manifest, f, ensure_ascii=False, indent=2)

    print(f"converted: {converted} images")
    print(f"before: {total_before / 1e6:.1f} MB  after: {total_after / 1e6:.1f} MB")


if __name__ == "__main__":
    main()
