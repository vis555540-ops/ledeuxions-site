"""한국어 OCR 서비스 — EasyOCR 기반 (Mac M-series 친화).

특징:
- 모델은 첫 호출 시 자동 다운로드 (~70MB per language)
- Reader 인스턴스는 언어 조합별로 캐싱
- 텍스트 + 좌표 + 신뢰도 함께 반환
"""

import io
from typing import List

import numpy as np
from PIL import Image
import easyocr


# 언어 조합별 Reader 캐시
_readers: dict = {}


# 외부에서 받는 lang 문자열 → EasyOCR 언어 코드
LANG_MAP = {
    "kor": ["ko"],
    "eng": ["en"],
    "kor+eng": ["ko", "en"],
    "jpn": ["ja", "en"],
    "chi_sim": ["ch_sim", "en"],
    "chi_tra": ["ch_tra", "en"],
}


def _get_reader(langs: List[str]):
    key = ",".join(sorted(langs))
    if key not in _readers:
        # gpu=False — Mac에서는 MPS 직접 사용 안 함, CPU/CoreML 백엔드 사용
        _readers[key] = easyocr.Reader(langs, gpu=False, verbose=False)
    return _readers[key]


def ocr_image(image_bytes: bytes, lang: str = "kor+eng") -> dict:
    langs = LANG_MAP.get(lang, ["ko", "en"])
    reader = _get_reader(langs)

    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    # EXIF orientation 반영
    try:
        from PIL import ImageOps
        img = ImageOps.exif_transpose(img)
    except Exception:
        pass

    arr = np.array(img)
    results = reader.readtext(arr, paragraph=False)

    blocks = []
    full_lines = []
    for item in results:
        # item: (bbox, text, confidence)
        bbox, text, conf = item
        blocks.append({
            "text": text,
            "confidence": round(float(conf), 3),
            "bbox": [[round(float(p[0]), 1), round(float(p[1]), 1)] for p in bbox],
        })
        full_lines.append(text)

    return {
        "text": "\n".join(full_lines),
        "language": lang,
        "blocks": blocks,
        "num_blocks": len(blocks),
    }


def warmup(lang: str = "kor+eng"):
    """주 사용 언어 미리 로딩."""
    _get_reader(LANG_MAP.get(lang, ["ko", "en"]))
