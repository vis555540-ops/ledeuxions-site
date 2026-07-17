"""얼굴 복원 서비스 — GFPGAN 기반.

특징:
- 흐릿한 얼굴, 오래된 사진, 저해상도 인물사진 복원
- 모델은 첫 호출 시 자동 다운로드 (~350MB)
- 배경까지 업스케일하려면 bg_upsampler로 Real-ESRGAN 조합 가능 (기본 꺼짐 — 메모리 절약)

설치 (backend venv에서):
    pip install gfpgan realesrgan basicsr facexlib

주의: basicsr는 torchvision 최신 버전과 호환 이슈가 있을 수 있음.
      실패하면: pip install basicsr --no-deps 후 누락 의존성 수동 설치.
"""

import io
import os
from typing import Optional

import numpy as np
from PIL import Image


_restorer = None


def _get_restorer():
    global _restorer
    if _restorer is None:
        from gfpgan import GFPGANer
        # 모델 자동 다운로드 위치: ~/.cache 또는 실행 디렉토리 gfpgan/weights/
        model_path = os.environ.get(
            "GFPGAN_MODEL",
            "https://github.com/TencentARC/GFPGAN/releases/download/v1.3.0/GFPGANv1.3.pth",
        )
        _restorer = GFPGANer(
            model_path=model_path,
            upscale=2,               # 얼굴 영역 2배 업스케일
            arch="clean",
            channel_multiplier=2,
            bg_upsampler=None,        # 배경 업스케일 없음 (메모리 절약)
        )
    return _restorer


def restore_face(image_bytes: bytes) -> bytes:
    """이미지 바이트를 받아 얼굴이 복원된 JPG 바이트로 반환."""
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    # EXIF orientation 반영
    try:
        from PIL import ImageOps
        img = ImageOps.exif_transpose(img)
    except Exception:
        pass

    # 너무 큰 이미지는 리사이즈 (메모리 보호, 긴 변 2048)
    max_side = 2048
    if max(img.size) > max_side:
        ratio = max_side / max(img.size)
        img = img.resize(
            (int(img.width * ratio), int(img.height * ratio)),
            Image.LANCZOS,
        )

    # GFPGAN은 BGR ndarray를 받음
    arr = np.array(img)[:, :, ::-1]  # RGB → BGR

    restorer = _get_restorer()
    _, _, restored = restorer.enhance(
        arr,
        has_aligned=False,
        only_center_face=False,
        paste_back=True,
    )

    if restored is None:
        # 얼굴 미검출 → 원본 반환
        out_img = img
    else:
        out_img = Image.fromarray(restored[:, :, ::-1])  # BGR → RGB

    buf = io.BytesIO()
    out_img.save(buf, format="JPEG", quality=92)
    return buf.getvalue()


def warmup():
    _get_restorer()
