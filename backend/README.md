# LeDeuxions AI Backend (Mac mini)

Apple Silicon Mac mini에서 동작하는 FastAPI 서버. **Whisper(받아쓰기) + rembg(배경 제거) + EasyOCR(한국어 OCR)** 세 모델을 한 프로세스에서 서빙합니다.

## 요구사항

- macOS 13+
- **Python 3.10 ~ 3.12 필수** ⚠️
  - Python 3.13/3.14는 torch/easyocr 휠 미배포 → 설치 실패
  - `brew install python@3.12` 권장
- ffmpeg (Whisper 디코딩에 사용)
  ```bash
  brew install ffmpeg
  ```
- 디스크 약 8GB (모델 캐시)
- 메모리 8GB+ (large-v3 사용시 12GB+ 권장)

## 설치

```bash
cd backend

# 가상환경 — 반드시 python3.12로 명시!
# (python3가 3.14를 가리키면 torch 휠 못 찾음)
python3.12 -m venv .venv
source .venv/bin/activate
python --version    # Python 3.12.x 확인

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
# → 출력에서 Tunnel UUID 메모해두기 (예: 3f4a8...).
#   같은 계정에 다른 터널들이 있으면 이름 기반 명령이 엉뚱한 터널을
#   잡을 수 있음. 가급적 UUID로 지정하는 게 안전.

# 4) DNS 라우팅 — 이름 대신 UUID 권장
#    이름으로 했다가 다른 터널(예: neko-api)에 잘못 잡히면:
#      cloudflared tunnel route dns --overwrite-dns <UUID> ai.ledeuxions.com
#    로 강제 교정 가능.
cloudflared tunnel route dns <UUID> ai.ledeuxions.com

# 5) config 파일은 기존 게 있다면 건드리지 말고 별도 파일로!
#    ~/.cloudflared/ai-config.yml
#      tunnel: <UUID>
#      credentials-file: /Users/YOU/.cloudflared/<UUID>.json
#      ingress:
#        - hostname: ai.ledeuxions.com
#          service: http://localhost:5000
#        - service: http_status:404

# 6) 실행 (config 파일 명시)
cloudflared tunnel --config ~/.cloudflared/ai-config.yml run <UUID>
```

이렇게 하면 외부에서 `https://ai.ledeuxions.com`이 맥미니의 5000 포트로 안전하게 연결됩니다 (포트포워딩 X). **기존 터널/도메인은 그대로 보존됩니다.**

### 운영 팁

- launchd로 백엔드+터널 둘 다 등록하면 재부팅·crash 시 자동 복구
- `launchctl list | grep ledeuxions` 으로 양쪽 상태 확인
- 로그: `tail -f /tmp/ledeuxions-*.log`

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
