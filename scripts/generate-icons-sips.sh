#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT_DIR/icon.png"
OUT_DIR="$ROOT_DIR/public/icons"

if [ ! -f "$SRC" ]; then
  echo "Place your source icon at: $SRC"
  exit 1
fi

mkdir -p "$OUT_DIR"

# sizes: 16,32,48,72,96,128,144,152,180,192,256,384,512
sizes=(16 32 48 72 96 128 144 152 180 192 256 384 512)
for s in "${sizes[@]}"; do
  out="$OUT_DIR/icon-${s}x${s}.png"
  sips -Z $s "$SRC" --out "$out" >/dev/null
  echo "created $out"
done

# apple-touch-icon (180)
cp "$OUT_DIR/icon-180x180.png" "$OUT_DIR/apple-touch-icon.png"
# favicons
cp "$OUT_DIR/icon-32x32.png" "$OUT_DIR/favicon-32x32.png"
cp "$OUT_DIR/icon-16x16.png" "$OUT_DIR/favicon-16x16.png"
# android icons
cp "$OUT_DIR/icon-192x192.png" "$OUT_DIR/android-chrome-192x192.png"
cp "$OUT_DIR/icon-512x512.png" "$OUT_DIR/android-chrome-512x512.png"

echo "Icons generated in $OUT_DIR"
