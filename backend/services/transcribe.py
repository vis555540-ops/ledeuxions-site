"""Whisper 받아쓰기 서비스 — faster-whisper 기반.

특징:
- 모델은 첫 호출 시 lazy 로딩 (~1.5GB 메모리, large-v3 기준)
- 호출 후 메모리에 상주해서 두 번째 호출부터 빠름
- 한국어 우선이지만 lang="auto"로도 가능
"""

import os
import tempfile
from typing import Optional

from faster_whisper import WhisperModel


_model: Optional[WhisperModel] = None


def _get_model() -> WhisperModel:
    global _model
    if _model is None:
        name = os.environ.get("WHISPER_MODEL", "large-v3")
        compute = os.environ.get("WHISPER_COMPUTE", "int8")
        # Mac mini는 device="cpu" 사용 (Apple Silicon이라도 faster-whisper는 CPU 백엔드가 가장 안정)
        # 더 빠른 속도를 원하면 mlx-whisper로 교체 권장
        _model = WhisperModel(name, device="cpu", compute_type=compute)
    return _model


def transcribe(audio_bytes: bytes, lang: str = "ko") -> dict:
    """오디오 바이트를 받아 텍스트로 변환. 한국어 기본."""
    model = _get_model()

    # faster-whisper는 파일 경로를 받음 → 임시 파일 사용
    with tempfile.NamedTemporaryFile(suffix=".audio", delete=False) as f:
        f.write(audio_bytes)
        path = f.name

    try:
        if lang == "auto":
            lang = None
        segments, info = model.transcribe(
            path,
            language=lang,
            beam_size=5,
            vad_filter=True,  # 무음 구간 건너뛰기 (속도 + 정확도 ↑)
        )

        seg_list = []
        full_text = []
        for s in segments:
            seg_list.append({
                "start": round(s.start, 2),
                "end": round(s.end, 2),
                "text": s.text.strip(),
            })
            full_text.append(s.text)

        return {
            "text": "".join(full_text).strip(),
            "language": info.language,
            "language_probability": round(info.language_probability, 3),
            "duration": round(info.duration, 2),
            "segments": seg_list,
        }
    finally:
        try:
            os.unlink(path)
        except OSError:
            pass


def warmup():
    """서버 시작 시 모델 미리 로딩 (콜드스타트 제거)."""
    _get_model()
