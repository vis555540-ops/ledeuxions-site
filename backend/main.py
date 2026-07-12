"""LeDeuxions AI Backend — FastAPI

엔드포인트:
  GET  /health
  POST /v1/transcribe   (multipart: file, form: lang=ko|auto|en|...)
  POST /v1/remove-bg    (multipart: file)
  POST /v1/ocr          (multipart: file, form: lang=kor+eng|kor|eng|...)

인증:
  X-API-Key 헤더에 INTERNAL_API_KEY 값과 일치해야 함.
  Cloudflare Worker만 호출하는 구조. 브라우저가 직접 호출하지 않음.
"""

import os
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Header, HTTPException, UploadFile, File, Form, Depends
from fastapi.responses import Response, JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from services.transcribe import transcribe, warmup as warm_whisper
from services.rembg_svc import remove_background, warmup as warm_rembg
from services.ocr import ocr_image, warmup as warm_ocr

# 얼굴 복원은 선택 기능 — gfpgan 미설치 환경에서도 서버는 뜨게
try:
    from services.restore_face import restore_face
    HAS_RESTORE = True
except ImportError:
    HAS_RESTORE = False


INTERNAL_API_KEY = os.environ.get("INTERNAL_API_KEY", "")
ALLOWED_ORIGINS = [o.strip() for o in os.environ.get("ALLOWED_ORIGINS", "*").split(",") if o.strip()]

# 모델별 최대 업로드 크기 (바이트)
MAX_SIZES = {
    "transcribe": 200 * 1024 * 1024,  # 200MB (긴 음성 허용)
    "remove-bg":   25 * 1024 * 1024,   # 25MB
    "ocr":         25 * 1024 * 1024,
    "restore-face": 25 * 1024 * 1024,
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 서버 시작 시 모델 워밍업 (콜드스타트 제거).
    # 무거우면 주석 처리하고 첫 호출 시 lazy load 사용.
    print("[warmup] Whisper 로딩…")
    try:
        warm_whisper()
        print("[warmup] Whisper OK")
    except Exception as e:
        print(f"[warmup] Whisper 실패: {e}")

    print("[warmup] rembg 로딩…")
    try:
        warm_rembg()
        print("[warmup] rembg OK")
    except Exception as e:
        print(f"[warmup] rembg 실패: {e}")

    print("[warmup] OCR 로딩…")
    try:
        warm_ocr()
        print("[warmup] OCR OK")
    except Exception as e:
        print(f"[warmup] OCR 실패: {e}")

    yield


app = FastAPI(
    title="LeDeuxions AI Backend",
    version="1.0.0",
    docs_url="/docs",
    lifespan=lifespan,
)

# CORS — 브라우저가 직접 호출하는 경우를 위해. Worker만 호출하면 사실상 불필요.
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS if ALLOWED_ORIGINS else ["*"],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


# --- Auth dep ---
def require_api_key(x_api_key: str = Header(None)) -> str:
    if not INTERNAL_API_KEY:
        # 개발 모드: API key 미설정이면 인증 패스
        return "dev"
    if not x_api_key or x_api_key != INTERNAL_API_KEY:
        raise HTTPException(401, "invalid api key")
    return x_api_key


# --- Endpoints ---

@app.get("/health")
def health():
    services = ["whisper", "rembg", "ocr"]
    if HAS_RESTORE:
        services.append("restore-face")
    return {
        "status": "ok",
        "services": services,
        "ts": int(time.time()),
    }


@app.post("/v1/transcribe")
async def ep_transcribe(
    file: UploadFile = File(...),
    lang: str = Form("ko"),
    _key: str = Depends(require_api_key),
):
    data = await file.read()
    if len(data) > MAX_SIZES["transcribe"]:
        raise HTTPException(413, f"file too large (max {MAX_SIZES['transcribe']} bytes)")
    if not data:
        raise HTTPException(400, "empty file")
    t0 = time.time()
    try:
        result = transcribe(data, lang=lang)
    except Exception as e:
        raise HTTPException(500, f"transcribe failed: {e}")
    result["elapsed"] = round(time.time() - t0, 2)
    return JSONResponse(result)


@app.post("/v1/remove-bg")
async def ep_remove_bg(
    file: UploadFile = File(...),
    _key: str = Depends(require_api_key),
):
    data = await file.read()
    if len(data) > MAX_SIZES["remove-bg"]:
        raise HTTPException(413, f"file too large (max {MAX_SIZES['remove-bg']} bytes)")
    if not data:
        raise HTTPException(400, "empty file")
    try:
        png = remove_background(data)
    except Exception as e:
        raise HTTPException(500, f"remove-bg failed: {e}")

    # 결과 파일명 헤더 (브라우저에서 자동 사용)
    base = (file.filename or "image").rsplit(".", 1)[0]
    out_name = f"{base}_no-bg.png"
    return Response(
        content=png,
        media_type="image/png",
        headers={"Content-Disposition": f'attachment; filename="{out_name}"'},
    )


@app.post("/v1/restore-face")
async def ep_restore_face(
    file: UploadFile = File(...),
    _key: str = Depends(require_api_key),
):
    if not HAS_RESTORE:
        raise HTTPException(503, "restore-face not installed on this server (pip install gfpgan)")
    data = await file.read()
    if len(data) > MAX_SIZES["restore-face"]:
        raise HTTPException(413, f"file too large (max {MAX_SIZES['restore-face']} bytes)")
    if not data:
        raise HTTPException(400, "empty file")
    try:
        jpg = restore_face(data)
    except Exception as e:
        raise HTTPException(500, f"restore-face failed: {e}")

    base = (file.filename or "photo").rsplit(".", 1)[0]
    out_name = f"{base}_restored.jpg"
    return Response(
        content=jpg,
        media_type="image/jpeg",
        headers={"Content-Disposition": f'attachment; filename="{out_name}"'},
    )


@app.post("/v1/ocr")
async def ep_ocr(
    file: UploadFile = File(...),
    lang: str = Form("kor+eng"),
    _key: str = Depends(require_api_key),
):
    data = await file.read()
    if len(data) > MAX_SIZES["ocr"]:
        raise HTTPException(413, f"file too large (max {MAX_SIZES['ocr']} bytes)")
    if not data:
        raise HTTPException(400, "empty file")
    t0 = time.time()
    try:
        result = ocr_image(data, lang=lang)
    except Exception as e:
        raise HTTPException(500, f"ocr failed: {e}")
    result["elapsed"] = round(time.time() - t0, 2)
    return JSONResponse(result)
