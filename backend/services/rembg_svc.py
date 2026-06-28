"""배경 제거 서비스 — rembg(u2net) 기반.

특징:
- onnxruntime이 Mac에서 CoreML provider 자동 사용 → Apple Silicon에서 빠름
- 1024×1024 이미지 1초 내외
- 모델은 첫 호출 시 자동 다운로드 (~170MB) → ~/.u2net/
"""

import io
import os
from typing import Optional

from PIL import Image
from rembg import remove, new_session


_session = None


def _get_session():
    global _session
    if _session is None:
        model = os.environ.get("REMBG_MODEL", "u2net")
        # 사용 가능 모델:
        #   u2net (범용, 기본)
        #   u2netp (경량)
        #   isnet-general-use (고화질, 디테일 좋음)
        #   silueta (사람 특화)
        #   sam (Segment Anything, 가장 정확하지만 무거움)
        _session = new_session(model)
    return _session


def remove_background(image_bytes: bytes) -> bytes:
    """이미지 바이트를 받아 배경이 제거된 PNG 바이트로 반환."""
    img = Image.open(io.BytesIO(image_bytes))

    # EXIF orientation 반영 (회전된 사진 정상화)
    try:
        from PIL import ImageOps
        img = ImageOps.exif_transpose(img)
    except Exception:
        pass

    out = remove(img, session=_get_session())

    buf = io.BytesIO()
    out.save(buf, format="PNG", optimize=True)
    return buf.getvalue()


def warmup():
    """모델 미리 로딩 (콜드스타트 제거)."""
    _get_session()
