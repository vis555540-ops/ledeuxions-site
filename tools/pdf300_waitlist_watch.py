#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""PDF300 얼리액세스 명단 감시 (사원 일감 — 부장 토큰 0)

api.ledeuxions.com/waitlist 를 주기적으로 확인해서
새로 등록한 사람이 생기면 텔레그램 단톡에 알린다.

- 상태 파일에 '이미 알린 이메일'을 저장해 중복 알림 방지
- 주일(일요일)은 조용히 넘어감 (형 안식 원칙)
- 실패해도 조용히 종료 (다음 주기에 다시 시도)

실행: launchd  local.pdf300.waitlist  (30분마다)
"""
import json
import os
import subprocess
import sys
import urllib.request
from datetime import datetime

API = "https://api.ledeuxions.com/waitlist"
ENV_FILE = os.path.expanduser("~/ledeuxions-site/backend/.env")
STATE = os.path.expanduser("~/.claude-memory/pdf300_waitlist_seen.json")
CHAT_ID = "-1003845707613"
TG_SEND = os.path.expanduser("~/bin/tg_send.py")


def admin_key():
    try:
        with open(ENV_FILE, encoding="utf-8") as f:
            for line in f:
                if line.startswith("INTERNAL_API_KEY="):
                    return line.split("=", 1)[1].strip().strip("\"'")
    except OSError:
        pass
    return None


def fetch(key):
    # 키는 헤더로 (쿼리스트링에 특수문자가 들어가면 403 나는 걸 확인함)
    # User-Agent 를 반드시 넣을 것: 기본 Python-urllib 는 Cloudflare 봇 차단에 걸려 403.
    req = urllib.request.Request(API, headers={
        "X-Admin-Key": key,
        "User-Agent": "pdf300-waitlist-watch/1.0 (+ledeuxions.com)",
    })
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode("utf-8"))


def load_seen():
    try:
        with open(STATE, encoding="utf-8") as f:
            return set(json.load(f))
    except (OSError, ValueError):
        return set()


def save_seen(seen):
    os.makedirs(os.path.dirname(STATE), exist_ok=True)
    with open(STATE, "w", encoding="utf-8") as f:
        json.dump(sorted(seen), f, ensure_ascii=False)


def notify(text):
    subprocess.run([sys.executable, TG_SEND, text, CHAT_ID],
                   check=False, capture_output=True, timeout=30)


def main():
    if datetime.now().weekday() == 6:      # 일요일 = 안식
        return
    key = admin_key()
    if not key:
        return
    try:
        data = fetch(key)
    except Exception:
        return                              # 네트워크 문제면 다음 주기에

    entries = data.get("entries") or []
    seen = load_seen()
    fresh = [e for e in entries if e.get("email") and e["email"] not in seen]
    if not fresh:
        return

    lines = ["📬 PDF300 얼리액세스 신규 %d명 (총 %d명)" % (len(fresh), len(entries)), ""]
    for e in fresh[:20]:
        lines.append("· %s  (%s회 사용, %s)" % (
            e.get("email"), e.get("uses", "?"), e.get("country") or "?"))
    if len(fresh) > 20:
        lines.append("· 외 %d명" % (len(fresh) - 20))
    lines += ["", "오픈하면 이분들부터 무료 코드 보내면 돼요."]
    notify("\n".join(lines))

    seen.update(e["email"] for e in fresh)
    save_seen(seen)


if __name__ == "__main__":
    main()
