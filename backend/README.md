# LeDeuxions AI Backend (Mac mini)

Apple Silicon Mac mini에서 동작하는 FastAPI 서버. **Whisper(받아쓰기) + rembg(배경 제거) + EasyOCR(한국어 OCR)** 세 모델을 한 프로세스에서 서빙합니다.

## 요구사항

- macOS 13+
- Python 3.10 ~ 3.12
- ffmpeg (Whisper 디코딩에 사용)
  ```bash
  brew install ffmpeg
  ```
- 디스크 약 8GB (모델 캐시)
- 메모리 8GB+ (large-v3 사용시 12GB+ 권장)

## 설치

```bash
cd backend

# 가상환경
python3 -m venv .venv
source .venv/bin/activate

# 의존성 설치
pip install -r requirements.txt

# 환경 변수 설정
cp .env.example .env
# .env 열어서 INTERNAL_API_KEY를 긴 랜덤값으로 바꾸세요
#   openssl rand -hex 32
```

## 실행

```bash
./run.sh

# 또는 직접
uvicorn main:app --host 0.0.0.0 --port 5000
```

첫 실행 시:
- Whisper 모델 다운로드 (~3GB, ~/.cache/huggingface/)
- rembg 모델 다운로드 (~170MB, ~/.u2net/)
- EasyOCR 모델 다운로드 (~80MB × 2언어, ~/.EasyOCR/)

총 약 6GB가 자동 캐시됩니다. **두 번째 실행부터는 빠릅니다.**

## 백그라운드 실행 + 자동 재시작 (Mac mini 운영)

### launchd 사용 (권장)

`~/Library/LaunchAgents/com.ledeuxions.aibackend.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>com.ledeuxions.aibackend</string>
  <key>WorkingDirectory</key><string>/Users/YOU/path/to/backend</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>-lc</string>
    <string>./run.sh</string>
  </array>
  <key>KeepAlive</key><true/>
  <key>RunAtLoad</key><true/>
  <key>StandardOutPath</key><string>/tmp/ledeuxions-backend.log</string>
  <key>StandardErrorPath</key><string>/tmp/ledeuxions-backend.err</string>
</dict>
</plist>
```

```bash
launchctl load ~/Library/LaunchAgents/com.ledeuxions.aibackend.plist
```

## Cloudflare Tunnel로 외부 노출

```bash
# 1) 설치
brew install cloudflared

# 2) 로그인
cloudflared tunnel login

# 3) 터널 생성 (한 번만)
cloudflared tunnel create ledeuxions-ai

# 4) 도메인 연결
cloudflared tunnel route dns ledeuxions-ai pdf.ledeuxions.com

# 5) ~/.cloudflared/config.yml 작성
#   tunnel: <터널-id>
#   credentials-file: /Users/YOU/.cloudflared/<터널-id>.json
#   ingress:
#     - hostname: pdf.ledeuxions.com
#       service: http://localhost:5000
#     - service: http_status:404

# 6) 백그라운드 실행
cloudflared tunnel run ledeuxions-ai
```

이렇게 하면 외부에서 `https://pdf.ledeuxions.com`이 맥미니의 5000 포트로 안전하게 연결됩니다 (포트포워딩 X).

## API

### `GET /health`
```bash
curl http://localhost:5000/health
```

### `POST /v1/transcribe`
```bash
curl -X POST http://localhost:5000/v1/transcribe \
  -H "X-API-Key: $INTERNAL_API_KEY" \
  -F "file=@sample.m4a" \
  -F "lang=ko"
```

응답:
```json
{
  "text": "안녕하세요 ...",
  "language": "ko",
  "duration": 120.5,
  "segments": [{"start": 0.0, "end": 5.2, "text": "..."}],
  "elapsed": 12.3
}
```

### `POST /v1/remove-bg`
```bash
curl -X POST http://localhost:5000/v1/remove-bg \
  -H "X-API-Key: $INTERNAL_API_KEY" \
  -F "file=@photo.jpg" \
  --output out.png
```

### `POST /v1/ocr`
```bash
curl -X POST http://localhost:5000/v1/ocr \
  -H "X-API-Key: $INTERNAL_API_KEY" \
  -F "file=@document.png" \
  -F "lang=kor+eng"
```

응답:
```json
{
  "text": "줄1\n줄2\n...",
  "language": "kor+eng",
  "blocks": [
    {"text": "줄1", "confidence": 0.95, "bbox": [[10,20],[100,20],[100,40],[10,40]]}
  ],
  "num_blocks": 12,
  "elapsed": 1.8
}
```

## 처리량 (M2 Mac mini 18GB 기준 — 참고치)

| 작업 | 첫 호출 (콜드) | 두 번째 (웜) |
|---|---|---|
| Whisper 1분 음성 | ~30초 | ~10초 |
| rembg 1024×1024 | ~3초 | ~0.8초 |
| OCR A4 한 페이지 | ~5초 | ~1.5초 |

**모델은 메모리에 상주합니다** (총 ~5GB). 사용자 1~3명 동시는 쾌적.

## 모델 변경

`.env`에서:
- `WHISPER_MODEL=medium` — 정확도 ↓, 메모리/속도 ↑
- `WHISPER_MODEL=small` — 더 가벼움
- `REMBG_MODEL=u2netp` — 경량 (속도 2배, 품질 약간 ↓)
- `REMBG_MODEL=isnet-general-use` — 더 정확 (느림)

## 문제해결

**메모리 부족**: `WHISPER_MODEL=medium`으로 변경, 또는 `WHISPER_COMPUTE=int8_float16`.

**ffmpeg 없다는 에러**: `brew install ffmpeg`.

**EasyOCR 첫 실행 멈춤**: 모델 다운로드 중. ~80MB × 2 = ~160MB. 인터넷 확인.

**PaddleOCR 쓰고 싶다면**: Mac M-series에서 paddlepaddle 빌드가 불안정. 정확도 비슷한 EasyOCR로 시작해서 필요시 교체 권장.
