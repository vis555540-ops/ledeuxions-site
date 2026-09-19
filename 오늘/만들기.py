#!/usr/bin/env python3
"""오늘의 양몰이 — 날마다 바뀌는 퍼즐을 미리 만들어 둔다 (2026-09-19)
   되감기 방식: 다 끝난 판에서 거꾸로 당겨서 만든다 → 반드시 풀린다.
"""
import json, random

W = H = 7                      # 7×7 칸
def 만들기(씨, 양수=2, 되감기=14):
    r = random.Random(씨)
    벽 = set()
    for _ in range(r.randint(3, 6)):            # 바위 몇 개
        벽.add((r.randrange(1, W-1), r.randrange(1, H-1)))
    우리 = []
    while len(우리) < 양수:
        p = (r.randrange(1, W-1), r.randrange(1, H-1))
        if p not in 벽 and p not in 우리: 우리.append(p)
    양 = list(우리)                              # 다 들어간 상태에서 시작
    개 = None
    for _ in range(200):
        p = (r.randrange(W), r.randrange(H))
        if p not in 벽 and p not in 양: 개 = p; break
    if 개 is None: return None
    뒤 = [(0,1),(0,-1),(1,0),(-1,0)]
    for _ in range(되감기):                      # 거꾸로 당기기
        r.shuffle(뒤)
        for dx, dy in 뒤:
            for i, (sx, sy) in enumerate(양):
                # 개가 양 뒤에 있고, 개와 양이 같이 한 칸 물러날 수 있으면 당긴다
                개자리 = (sx + dx, sy + dy)
                새양 = (sx - dx, sy - dy) if False else (sx + dx, sy + dy)
                새개 = (sx + 2*dx, sy + 2*dy)
                if 개 != 개자리: continue
                if not (0 <= 새개[0] < W and 0 <= 새개[1] < H): continue
                if 새개 in 벽 or 새개 in 양: continue
                양[i] = 개자리; 개 = 새개
                break
            else: continue
            break
    if any(tuple(a) in set(map(tuple, 우리)) for a in 양): return None   # 처음부터 들어가 있으면 버린다
    if 개 in 우리: return None
    return {"벽": sorted(벽), "우리": sorted(우리), "양": sorted(양), "개": list(개)}

판들 = []
씨 = 0
while len(판들) < 150:
    씨 += 1
    p = 만들기(씨, 양수=2 if len(판들) % 3 else 3, 되감기=12 + (len(판들) % 10))
    if p: 판들.append(p)
open("levels.json", "w", encoding="utf-8").write(json.dumps(판들, ensure_ascii=False))
print("판", len(판들), "개 만듦")
