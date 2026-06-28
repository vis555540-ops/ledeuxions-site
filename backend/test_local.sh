#!/usr/bin/env bash
# 백엔드 로컬 테스트 — 서버가 동작 중일 때 실행
# 사용: ./test_local.sh [sample.mp3] [photo.jpg] [doc.png]

set -e
HOST="${HOST:-http://localhost:5000}"
KEY="${INTERNAL_API_KEY:-dev}"

AUDIO="${1:-}"
IMG="${2:-}"
DOC="${3:-}"

echo "=== Health ==="
curl -s "$HOST/health" | python3 -m json.tool
echo

if [ -n "$AUDIO" ] && [ -f "$AUDIO" ]; then
    echo "=== Transcribe: $AUDIO ==="
    curl -s -X POST "$HOST/v1/transcribe" \
        -H "X-API-Key: $KEY" \
        -F "file=@$AUDIO" \
        -F "lang=ko" | python3 -m json.tool
    echo
fi

if [ -n "$IMG" ] && [ -f "$IMG" ]; then
    echo "=== Remove BG: $IMG → /tmp/out.png ==="
    curl -s -X POST "$HOST/v1/remove-bg" \
        -H "X-API-Key: $KEY" \
        -F "file=@$IMG" \
        --output /tmp/out.png
    ls -la /tmp/out.png
    echo
fi

if [ -n "$DOC" ] && [ -f "$DOC" ]; then
    echo "=== OCR: $DOC ==="
    curl -s -X POST "$HOST/v1/ocr" \
        -H "X-API-Key: $KEY" \
        -F "file=@$DOC" \
        -F "lang=kor+eng" | python3 -m json.tool
    echo
fi
