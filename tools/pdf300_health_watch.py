#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""PDF300 상태 감시 (사원 일감 — 부장 토큰 0)

어제(2026-07-27) pdf.ledeuxions.com 요청의 약 35%가 죽은 백엔드로 가고 있었는데
26일 동안 아무도 몰랐다. 그게 다시는 조용히 일어나지 않게 하는 스크립트다.
[[reference_터널_유령프로세스_교훈]]

검사 항목
  1. pdf300.com / www / 한국어판 응답
  2. 서버도구 백엔드(pdf.ledeuxions.com) — /health 를 여러 번 때려
     ★ 같은 주소가 서로 다른 백엔드를 물고 있는지(라우팅 분기) 탐지
  3. 실제 도구 1개 왕복(strip-metadata) — 200 + PDF 로 오는지
  4. api 게이트웨이 /health

문제를 처음 발견했을 때만 텔레그램으로 알리고,
복구되면 '정상으로 돌아옴'을 한 번 알린다. (같은 알림 반복 안 함)
"""
import json
import os
import subprocess
import sys
import urllib.request
from datetime import datetime

CHAT_ID = "-1003845707613"
TG_SEND = os.path.expanduser("~/bin/tg_send.py")
STATE = os.path.expanduser("~/.claude-memory/pdf300_health_state.json")
UA = {"User-Agent": "pdf300-health-watch/1.0 (+ledeuxions.com)"}
TIMEOUT = 25

# 최소 PDF (메타데이터 포함) — 도구 왕복 테스트용
TINY_PDF = (
    b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
    b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
    b"3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\n"
    b"4 0 obj<</Title(t)/Author(a)>>endobj\n"
    b"trailer<</Root 1 0 R/Info 4 0 R>>\n%%EOF\n"
)


def get(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
        return r.getcode(), r.read()


def post_file(url, field, filename, data):
    boundary = "----pdf300health"
    body = (
        ("--%s\r\nContent-Disposition: form-data; name=\"%s\"; filename=\"%s\"\r\n"
         "Content-Type: application/pdf\r\n\r\n" % (boundary, field, filename)).encode()
        + data + ("\r\n--%s--\r\n" % boundary).encode()
    )
    h = dict(UA)
    h["Content-Type"] = "multipart/form-data; boundary=%s" % boundary
    req = urllib.request.Request(url, data=body, headers=h)
    with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
        return r.getcode(), r.read(8)


def check():
    """문제 목록을 돌려준다. 빈 리스트 = 정상."""
    problems = []

    for name, url in (("pdf300.com", "https://pdf300.com/"),
                      ("www.pdf300.com", "https://www.pdf300.com/"),
                      ("한국어판", "https://ledeuxions.com/web-projects/pdf300/")):
        try:
            code, _ = get(url)
            if code != 200:
                problems.append("%s 응답 %s" % (name, code))
        except Exception as e:
            problems.append("%s 접속 불가 (%s)" % (name, type(e).__name__))

    # 라우팅 분기 탐지: /health 를 6번 때려 서로 다른 백엔드가 답하는지
    seen = {}
    for _ in range(6):
        try:
            _, body = get("https://pdf.ledeuxions.com/health")
            d = json.loads(body.decode("utf-8", "ignore"))
            tag = d.get("host") or d.get("service") or "?"
            seen[tag] = seen.get(tag, 0) + 1
        except Exception:
            seen["ERROR"] = seen.get("ERROR", 0) + 1
    if len(seen) > 1:
        problems.append("⚠️ 서버도구 주소가 백엔드 %d개로 갈리는 중: %s "
                        "(작년 그 유령 프로세스 재발 의심)" % (len(seen), seen))
    elif "ERROR" in seen:
        problems.append("서버도구 백엔드 응답 없음")

    # 실제 도구 왕복
    try:
        code, head = post_file("https://pdf.ledeuxions.com/strip-metadata",
                               "file", "t.pdf", TINY_PDF)
        if code != 200 or not head.startswith(b"%PDF"):
            problems.append("도구 왕복 실패 (strip-metadata %s)" % code)
    except Exception as e:
        problems.append("도구 왕복 실패 (%s)" % type(e).__name__)

    try:
        code, _ = get("https://api.ledeuxions.com/health")
        if code != 200:
            problems.append("게이트웨이 응답 %s" % code)
    except Exception:
        problems.append("게이트웨이 접속 불가")

    return problems


def notify(text):
    subprocess.run([sys.executable, TG_SEND, text, CHAT_ID],
                   check=False, capture_output=True, timeout=30)


def main():
    problems = check()
    try:
        with open(STATE, encoding="utf-8") as f:
            prev = json.load(f)
    except (OSError, ValueError):
        prev = {"bad": False}

    if problems and not prev.get("bad"):
        notify("🚨 PDF300 이상 감지 (%s)\n\n%s\n\n부장이 보면 확인해줘요."
               % (datetime.now().strftime("%m/%d %H:%M"),
                  "\n".join("· " + p for p in problems)))
    elif not problems and prev.get("bad"):
        notify("✅ PDF300 정상으로 돌아왔어요 (%s)"
               % datetime.now().strftime("%m/%d %H:%M"))

    os.makedirs(os.path.dirname(STATE), exist_ok=True)
    with open(STATE, "w", encoding="utf-8") as f:
        json.dump({"bad": bool(problems), "problems": problems,
                   "checked": datetime.now().isoformat()}, f, ensure_ascii=False)


if __name__ == "__main__":
    main()
