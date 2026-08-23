"""PDF 목표용량 압축 — PDF300 계승 (형 G2B/나라장터 업로드 용량제한용).

목표 용량(KB)을 주면 '그 이하로, 최대한 또렷하게' 자동 압축한다.
원리:
  - 각 페이지를 이미지로 렌더(DPI 조절) → JPEG(quality) → 새 PDF로 조립.
  - 용량은 DPI에 대해 단조증가 → DPI를 '이진탐색'해서 목표 이하 중 최대 DPI를 찾음.
  - 최저 DPI로도 목표를 넘으면 JPEG quality를 단계적으로 낮춰 재시도.
주의: 결과는 '이미지 기반 PDF'(텍스트 선택 불가). 스캔본·도면·제출용 '용량 맞추기'에 적합.
      텍스트 PDF의 검색기능이 꼭 필요하면 이 방식은 부적합(그건 별도 모드 필요).
참고: 원래 PDF300(이음 desktop tk앱)의 sample→estimate→target 압축 로직을 웹 백엔드로 재구현.
"""

import io
import fitz  # PyMuPDF


def _render_size_pdf(doc: "fitz.Document", dpi: int, quality: int) -> bytes:
    """주어진 dpi/quality로 모든 페이지를 JPEG 이미지화하여 새 PDF 바이트 반환.
    원본 페이지의 물리적 크기(pt)는 유지하고 내부 해상도(dpi)만 바꾼다."""
    out = fitz.open()
    try:
        for page in doc:
            rect = page.rect  # 원본 페이지 크기(pt) 유지
            pix = page.get_pixmap(dpi=dpi, alpha=False)
            jpg = pix.tobytes(output="jpeg", jpg_quality=quality)
            newpage = out.new_page(width=rect.width, height=rect.height)
            newpage.insert_image(newpage.rect, stream=jpg)
        return out.tobytes(deflate=True, garbage=4)
    finally:
        out.close()


def compress_to_target(
    pdf_bytes: bytes,
    target_kb: int,
    max_dpi: int = 200,
    min_dpi: int = 30,
    base_quality: int = 75,
    quality_floor_steps=(65, 55, 45, 35),
) -> tuple[bytes, dict]:
    """PDF를 target_kb 이하로 압축. (결과 바이트, 메타정보) 반환.

    전략:
      1) quality=base_quality 고정, DPI를 [min_dpi, max_dpi]에서 이진탐색
         → 목표 이하가 되는 '최대 DPI' 채택 (가장 또렷).
      2) min_dpi@base_quality 로도 목표 초과면 → quality를 단계적으로 낮춰 min_dpi에서 재시도.
      3) 그래도 안 되면 최저설정 결과를 best-effort로 반환(목표 초과 표시).
    """
    if target_kb <= 0:
        raise ValueError("target_kb must be > 0")
    target = target_kb * 1024

    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    if doc.page_count == 0:
        doc.close()
        raise ValueError("empty pdf (0 pages)")

    doc_page_count = doc.page_count
    orig_size = len(pdf_bytes)
    attempts = 0
    best = None  # (dpi, quality, data)

    # 🚨 2026-08-22: 원본이 이미 목표 이하인데도 렌더를 돌려서 파일을 '키워' 보냈다.
    #    33KB 넣으면 224KB 가 나왔다. 압축 도구가 파일을 키우면 그건 어떤 경우에도 틀렸다.
    #    원본이 이미 목표 안이면 손대지 않고 그대로 돌려준다.
    if orig_size <= target:
        doc.close()
        return pdf_bytes, {
            "ok": True,
            "target_kb": target_kb,
            "hit_target": True,
            "orig_kb": round(orig_size / 1024, 1),
            "out_kb": round(orig_size / 1024, 1),
            "reduction_pct": 0,
            "dpi": None,
            "quality": None,
            "pages": doc_page_count,
            "attempts": 0,
            "note": "already under target - original returned untouched",
        }

    try:
        # --- 1) base_quality 에서 DPI 이진탐색 ---
        lo, hi = min_dpi, max_dpi
        while lo <= hi:
            mid = (lo + hi) // 2
            data = _render_size_pdf(doc, mid, base_quality)
            attempts += 1
            if len(data) <= target:
                best = (mid, base_quality, data)  # 들어감 → 더 높은 DPI 시도
                lo = mid + 1
            else:
                hi = mid - 1

        # --- 2) min_dpi 로도 초과 → quality 낮춰 재시도 ---
        if best is None:
            for q in quality_floor_steps:
                data = _render_size_pdf(doc, min_dpi, q)
                attempts += 1
                if len(data) <= target:
                    best = (min_dpi, q, data)
                    break

        # --- 3) 그래도 실패 → 최저설정 best-effort ---
        hit = best is not None
        if best is None:
            data = _render_size_pdf(doc, min_dpi, quality_floor_steps[-1])
            attempts += 1
            best = (min_dpi, quality_floor_steps[-1], data)

        dpi, quality, data = best

        # 🚨 압축했는데 원본보다 커지면 원본을 준다. 손님이 손해 볼 이유가 없다.
        if len(data) >= orig_size:
            return pdf_bytes, {
                "ok": True,
                "target_kb": target_kb,
                "hit_target": orig_size <= target,
                "orig_kb": round(orig_size / 1024, 1),
                "out_kb": round(orig_size / 1024, 1),
                "reduction_pct": 0,
                "dpi": None,
                "quality": None,
                "pages": doc_page_count,
                "attempts": attempts,
                "note": "compression would enlarge the file - original returned",
            }

        meta = {
            "ok": True,
            "target_kb": target_kb,
            "hit_target": hit,                       # 목표 이하 달성 여부
            "orig_kb": round(orig_size / 1024, 1),
            "out_kb": round(len(data) / 1024, 1),
            "reduction_pct": round((1 - len(data) / orig_size) * 100, 1) if orig_size else 0,
            "dpi": dpi,
            "quality": quality,
            "pages": doc.page_count,
            "attempts": attempts,
        }
        return data, meta
    finally:
        doc.close()


def estimate(pdf_bytes: bytes, max_samples: int = 8) -> dict:
    """(보조) 균등 샘플 페이지로 페이지당 평균 픽셀량을 보고 대략적 정보 반환.
    원래 PDF300의 sample→estimate 감각을 웹용으로 단순화. 실제 압축은 compress_to_target가 정확."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    try:
        n = doc.page_count
        if n == 0:
            return {"pages": 0}
        step = max(1, n // max_samples)
        idxs = list(range(0, n, step))[:max_samples]
        return {
            "pages": n,
            "orig_kb": round(len(pdf_bytes) / 1024, 1),
            "sampled_pages": idxs,
            "note": "정확한 결과는 compress_to_target가 이진탐색으로 목표에 맞춤",
        }
    finally:
        doc.close()


def warmup():
    """워밍업 — 1x1 PDF로 라이브러리 로드 확인."""
    d = fitz.open()
    d.new_page(width=10, height=10)
    b = d.tobytes()
    d.close()
    _ = fitz.open(stream=b, filetype="pdf")
    return True
