#!/usr/bin/env bash
# Run on the VPS from the repo root:  bash vps-handoff/install.sh
# Installs the owner's Claude memory + global rules so the VPS Claude session knows the same context.
set -euo pipefail

REPO="$(pwd)"
SRC="$(cd "$(dirname "$0")" && pwd)"
# Claude Code keys project memory by the absolute repo path with every non-alphanumeric char turned into '-'.
SLUG="$(printf '%s' "$REPO" | sed 's#[^A-Za-z0-9]#-#g')"
MEM_DIR="$HOME/.claude/projects/$SLUG/memory"

mkdir -p "$MEM_DIR"
cp -n "$SRC"/memory/*.md "$MEM_DIR"/          # -n: never overwrite memory already written on the VPS

if [ ! -f "$HOME/.claude/CLAUDE.md" ]; then
  cp "$SRC/global-CLAUDE.md" "$HOME/.claude/CLAUDE.md"
else
  echo "~/.claude/CLAUDE.md already exists, left untouched (compare with $SRC/global-CLAUDE.md)"
fi

echo "Memory installed in: $MEM_DIR"
echo "Files:"; ls "$MEM_DIR"
echo "Note: gemini-key-location.md describes the LOCAL Windows path; on the VPS the key is in this repo's .env."
