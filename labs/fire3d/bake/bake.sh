#!/bin/sh
# <takibi-fire> の素材を、計算モデル（labs/fire3d）から書き出す。
# 要るもの: playwright-cli、python3（Pillow、numpy）、ffmpeg。WebGL2 の動くブラウザで撮る。
# 使い方: sh labs/fire3d/bake/bake.sh
set -eu
ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
WORK=${WORK:-$ROOT/labs/fire3d/bake/work}
PORT=${PORT:-8765}
mkdir -p "$WORK"
# labs を配信する（playwright は file:// を開けない）
(cd "$ROOT/labs" && python3 -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1) &
SERVER=$!
trap 'kill $SERVER 2>/dev/null; playwright-cli -s=bake close >/dev/null 2>&1 || true' EXIT
sed -e "s|__WORK__|$WORK|" -e "s|__PORT__|$PORT|" "$ROOT/labs/fire3d/bake/capture.js" > "$WORK/capture.js"
playwright-cli -s=bake open "http://127.0.0.1:$PORT/fire3d/index.html?bake=1" >/dev/null
playwright-cli -s=bake run-code --filename="$WORK/capture.js"
playwright-cli -s=bake --raw eval "JSON.stringify(window.__bakeMeta)" > "$WORK/meta.raw"
python3 "$ROOT/labs/fire3d/bake/assemble.py" "$WORK" "$ROOT/packages/takibi/src"
