#!/usr/bin/env bash
# LeDeuxions AI Backend 실행
# 첫 실행 전: python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt

set -e
cd "$(dirname "$0")"

# .env 로드
if [ -f .env ]; then
    set -a; source .env; set +a
fi

# venv 활성화 (있으면)
if [ -d .venv ]; then
    source .venv/bin/activate
fi

PORT="${PORT:-5000}"

echo "🚀 LeDeuxions AI Backend → http://0.0.0.0:${PORT}"
echo "   docs: http://localhost:${PORT}/docs"

# Mac mini 18GB는 1 worker 권장 (모델이 메모리에 상주)
exec uvicorn main:app \
    --host 0.0.0.0 \
    --port "${PORT}" \
    --workers 1 \
    --timeout-keep-alive 75
