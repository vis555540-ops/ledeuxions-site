# 아이콘 시안 — 형 지적(2026-09-12 「앱 아이콘, 앱 중간에 나오는 것도」).
#
# 지금 아이콘의 문제
#   1. 32px 그림을 512 로 늘려 계단이 거칠다
#   2. 배경이 단색 연두 — 이름이 「달빛 목장」인데 밤이 없다
#   3. 개만 있어 무슨 게임인지 안 보인다 (양을 모는 게임인데)
#   4. maskable 도 같은 그림이라 둥글게 잘리면 귀가 날아간다
#
# 그래서: 64px 격자에 밤 목장 한 장면(달·언덕·울타리·양·개)을 담고 8배로 키운다.
#         maskable 은 같은 장면을 안쪽 80% 안에 넣어 잘려도 안 상한다.
# 파일명은 「시안」을 붙인다 — 쓰던 아이콘을 덮지 않는다.
import os, sys
from PIL import Image

밤 = (28, 37, 64)          # manifest 의 background_color(#1c2540) 와 같은 계열
언덕, 언덕2 = (46, 84, 60), (36, 66, 48)
달빛 = (255, 246, 208)
양몸, 양얼굴 = (246, 244, 238), (60, 64, 78)
개검, 개흰 = (44, 48, 62), (240, 238, 232)
울 = (198, 182, 152)
선 = (22, 26, 42)

def 판(n): return Image.new('RGBA', (n, n), 밤 + (255,))
def 칠(im, x0, y0, x1, y1, c):
    d = im.load()
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            if 0 <= x < im.width and 0 <= y < im.height: d[x, y] = c
def 점(im, x, y, c):
    if 0 <= x < im.width and 0 <= y < im.height: im.load()[x, y] = c
def 원(im, cx, cy, r, c):
    for y in range(-r, r + 1):
        for x in range(-r, r + 1):
            if x * x + y * y <= r * r: 점(im, cx + x, cy + y, c)


def 장면(n=64, 여백=0):
    """n×n 밤 목장. 여백(px)만큼 안쪽으로 밀어 그린다 — maskable 용."""
    im = 판(n)
    s = n - 여백 * 2                      # 실제로 그림이 들어갈 폭
    def X(v): return 여백 + round(v * s / 64)
    def Y(v): return 여백 + round(v * s / 64)

    원(im, X(46), Y(15), max(2, round(7 * s / 64)), 달빛)          # 달
    for (bx, by) in ((14, 8), (24, 17), (55, 30), (9, 24), (36, 7)):   # 별
        점(im, X(bx), Y(by), 달빛)

    import math
    꼭대기 = {}
    for x in range(여백, 여백 + s):                                 # 언덕 — 완만한 능선 하나
        h = Y(41) - round(3 * s / 64 * math.sin((x - 여백) / max(1, s) * 3.14))
        꼭대기[x] = h
        칠(im, x, h, x, 여백 + s - 1, 언덕2)
        칠(im, x, h, x, h + max(1, round(2 * s / 64)), 언덕)        # 달빛 받는 능선만 밝게

    # 양 한 마리만, 뒤쪽 오른편에 작게 — 무슨 게임인지 알려주는 역할이면 충분하다
    w, h = max(5, round(10 * s / 64)), max(4, round(7 * s / 64))
    sx, sy = X(46), Y(38)
    칠(im, sx, sy, sx + w, sy + h, 양몸)
    칠(im, sx + w - 2, sy - 1, sx + w + 2, sy + 2, 양얼굴)          # 고개
    칠(im, sx + 1, sy + h + 1, sx + 2, sy + h + 2, 양얼굴)          # 다리
    칠(im, sx + w - 3, sy + h + 1, sx + w - 2, sy + h + 2, 양얼굴)

    # 개 — 아이콘의 주인공이라 크게, 앞쪽 가운데. 검은 몸에 흰 얼굴이 밤에 제일 잘 읽힌다
    u = s / 64.0
    def R(x0, y0, x1, y1, c): 칠(im, X(x0), Y(y0), X(x1), Y(y1), c)
    R(16, 40, 34, 44, 개검)                                        # 등
    R(16, 44, 34, 50, 개검)                                        # 몸통
    R(19, 48, 31, 50, 개흰)                                        # 가슴·배 (흰 띠)
    R(14, 42, 18, 46, 개검)                                        # 꼬리 쪽 엉덩이
    R(10, 38, 14, 44, 개검)                                        # 꼬리
    R(30, 32, 42, 44, 개검)                                        # 머리
    R(33, 36, 41, 43, 개흰)                                        # 얼굴 흰 무늬
    R(36, 40, 42, 44, 개흰)                                        # 주둥이
    for i in range(4):                                             # 귀 — 위로 좁혀 세모로
        R(29 + i, 27 + i, 33, 28 + i, 개검)
        R(39, 27 + i, 43 - i, 28 + i, 개검)
    점(im, X(35), Y(38), 선); 점(im, X(39), Y(38), 선)              # 눈
    점(im, X(35), Y(37), 달빛); 점(im, X(39), Y(37), 달빛)          # 눈빛 한 점
    R(39, 42, 41, 43, 선)                                          # 코
    R(18, 50, 21, 55, 개검)                                        # 앞다리 — 땅까지 닿게
    R(28, 50, 31, 55, 개검)
    R(23, 51, 26, 54, 개검)                                        # 뒷다리 하나 더
    return im


밖 = os.path.dirname(os.path.abspath(__file__))
크게 = lambda im, n: im.resize((n, n), Image.NEAREST)

보통 = 장면(64, 0)
마스크 = 장면(64, 7)        # 안쪽 80% 안에만 — 둥글게 잘려도 안 상한다

크게(보통, 512).save(os.path.join(밖, '아이콘_시안_512.png'))
크게(보통, 192).save(os.path.join(밖, '아이콘_시안_192.png'))
크게(마스크, 512).save(os.path.join(밖, '아이콘_시안_512_maskable.png'))

# 비교표 — 지금 것과 나란히
옛 = Image.open(os.path.join(밖, '아이콘_512.png')).convert('RGBA')
표 = Image.new('RGBA', (560, 300), (245, 245, 245, 255))
표.alpha_composite(크게(옛.resize((64, 64), Image.NEAREST), 240), (20, 40))
표.alpha_composite(크게(보통, 240), (300, 40))
표.save(os.path.join(밖, '아이콘_시안_비교.png'))
print('아이콘_시안_512 / _192 / _512_maskable / _비교  만듦')
