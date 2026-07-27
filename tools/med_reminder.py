#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""형 복약 알림 (사원 일감 — 부장 토큰 0)

형이 약봉지를 넘기며 "이거 부장이 맡아줘" 한 것. 하루 3회.
[[user_형_건강상태_종합]] [[user_형_단기기억_앵커]]

- 시간은 ~/.claude-memory/med_schedule.json 에서 읽는다. 비어 있으면 아무것도 안 한다.
- launchd 가 10분마다 깨우고, 예정 시각을 지났는데 오늘 아직 안 보냈으면 보낸다.
  (맥이 잠깐 꺼져 있었어도 켜지면 늦게라도 알려준다 — 놓치는 것보다 늦는 게 낫다)
- 같은 약은 하루 한 번만 알린다.
- ⚠️ 약 이름·용량은 절대 문자에 쓰지 않는다. 형 폰을 남이 볼 수도 있다.

schedule.json 예시:
{"tz_note":"로컬시간", "grace_min":90,
 "doses":[{"key":"morning","at":"08:30","label":"아침 약"},
          {"key":"lunch","at":"13:00","label":"점심 약"},
          {"key":"night","at":"22:30","label":"자기 전 약"}]}
"""
import json
import os
import subprocess
import sys
from datetime import datetime

CFG = os.path.expanduser("~/.claude-memory/med_schedule.json")
STATE = os.path.expanduser("~/.claude-memory/med_sent.json")
TG_SEND = os.path.expanduser("~/bin/tg_send.py")
CHAT_ID = "-1003845707613"

MSG = {
    "morning": "💊 {label} 드실 시간이에요 ({at}).",
    "lunch": "💊 {label} 시간이에요 ({at}). 밥 드셨으면 30분 뒤예요.",
    "night": "💊 {label} 시간이에요 ({at}). 오늘 고생하셨어요.",
}


def load(path, default):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return default


def main():
    cfg = load(CFG, {})
    doses = cfg.get("doses") or []
    if not doses:
        return                                  # 시간 미설정 = 아무 동작 안 함

    grace = int(cfg.get("grace_min", 90))       # 이 시간 지나면 그냥 넘긴다(밤에 깨우지 않게)
    now = datetime.now()
    today = now.strftime("%Y-%m-%d")
    state = load(STATE, {})
    if state.get("date") != today:
        state = {"date": today, "sent": []}

    changed = False
    for d in doses:
        key, at, label = d.get("key"), d.get("at"), d.get("label", "약")
        if not key or not at or key in state["sent"]:
            continue
        try:
            hh, mm = [int(x) for x in at.split(":")]
        except ValueError:
            continue
        due = now.replace(hour=hh, minute=mm, second=0, microsecond=0)
        late = (now - due).total_seconds() / 60.0
        if 0 <= late <= grace:
            text = MSG.get(key, "💊 {label} 시간이에요 ({at}).").format(label=label, at=at)
            subprocess.run([sys.executable, TG_SEND, text, CHAT_ID],
                           check=False, capture_output=True, timeout=30)
            state["sent"].append(key)
            changed = True

    if changed:
        os.makedirs(os.path.dirname(STATE), exist_ok=True)
        with open(STATE, "w", encoding="utf-8") as f:
            json.dump(state, f, ensure_ascii=False)


if __name__ == "__main__":
    main()
