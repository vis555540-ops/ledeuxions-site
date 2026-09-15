# 달빛 목장 — 첫 화면이 휑해서 채울 배경 소재. (형 지시 2026-09-12 「집이랑 나무랑 풀도 없고」)
# 개·양·늑대와 같은 그림체: 32px 격자, 1픽셀 진한 외곽선, 색 4~5개, 안티앨리어싱 없음.
# 쓰는 쪽은 그냥 이 PNG 들을 얹으면 된다. 게임.js·index.html 은 건드리지 않는다.
import os, sys
from PIL import Image

선 = (38, 42, 58)          # 밤 외곽선 — 검정 대신 남색이라야 밤하늘에 안 튄다

def 판(w, h):
    return Image.new('RGBA', (w, h), (0, 0, 0, 0))

def 칠(im, x0, y0, x1, y1, c):
    d = im.load()
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            if 0 <= x < im.width and 0 <= y < im.height:
                d[x, y] = c

def 점(im, x, y, c):
    if 0 <= x < im.width and 0 <= y < im.height:
        im.load()[x, y] = c

def 테두리(im):
    """불투명한 칸의 바깥쪽에 1픽셀 선을 두른다."""
    d = im.load()
    채운곳 = {(x, y) for y in range(im.height) for x in range(im.width) if d[x, y][3] > 0}
    for (x, y) in list(채운곳):
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if (nx, ny) not in 채운곳 and 0 <= nx < im.width and 0 <= ny < im.height:
                d[nx, ny] = 선


def 집():
    """48×44 — 목장 주인 집. 창에 불이 켜져 있어 밤에 따뜻해 보인다."""
    im = 판(48, 44)
    벽, 벽2 = (198, 152, 108), (158, 116, 78)
    지붕, 지붕2 = (176, 74, 64), (132, 52, 46)
    불, 문 = (255, 220, 120), (120, 84, 56)

    칠(im, 6, 20, 41, 41, 벽)                      # 벽
    칠(im, 6, 36, 41, 41, 벽2)                     # 벽 아랫단(그늘)
    for i in range(19):                            # 지붕 — 한 줄씩 좁혀서 박공
        칠(im, 2 + i, 19 - i, 45 - i, 19 - i, 지붕 if i % 3 else 지붕2)
    칠(im, 12, 25, 19, 32, 불)                     # 왼쪽 창
    칠(im, 28, 25, 35, 32, 불)                     # 오른쪽 창
    for x in (15, 16, 31, 32):                     # 창틀 세로
        칠(im, x, 25, x, 32, 지붕2)
    for y in (28, 29):                             # 창틀 가로
        칠(im, 12, y, 19, y, 지붕2); 칠(im, 28, y, 35, y, 지붕2)
    칠(im, 21, 31, 26, 41, 문)                     # 문
    점(im, 25, 36, 불)                             # 손잡이
    칠(im, 34, 6, 38, 18, 벽2)                     # 굴뚝
    테두리(im)
    return im


def 나무(큰=True):
    """큰 24×34 / 작은 18×26 — 잎을 세 덩이로 올려 둥글게."""
    w, h = (24, 34) if 큰 else (18, 26)
    im = 판(w, h)
    잎, 잎2 = (62, 116, 76), (86, 150, 96)
    줄기, 줄기2 = (112, 80, 54), (84, 58, 38)
    cx = w // 2
    칠(im, cx - 2, h - 11, cx + 1, h - 1, 줄기)
    칠(im, cx - 2, h - 11, cx - 1, h - 1, 줄기2)
    덩이 = [(cx, h - 14, 7), (cx - 5, h - 19, 6), (cx + 5, h - 19, 6), (cx, h - 24, 7)] if 큰 \
        else [(cx, h - 11, 5), (cx - 4, h - 15, 5), (cx + 4, h - 15, 5), (cx, h - 19, 5)]
    for (ox, oy, r) in 덩이:
        for y in range(-r, r + 1):
            for x in range(-r, r + 1):
                if x * x + y * y <= r * r:
                    점(im, ox + x, oy + y, 잎2 if (x + y) % 3 == 0 else 잎)
    테두리(im)
    return im


def 울타리():
    """16×14 — 옆으로 이어 붙이면 한 줄이 된다. 오른쪽 끝 한 칸은 다음 것과 맞물린다."""
    im = 판(16, 14)
    나무색, 그늘 = (216, 198, 166), (168, 150, 120)
    for x in (2, 10):                              # 기둥 둘
        칠(im, x, 2, x + 2, 13, 나무색)
        칠(im, x + 2, 2, x + 2, 13, 그늘)
    칠(im, 0, 5, 15, 6, 나무색)                    # 가로대 위
    칠(im, 0, 9, 15, 10, 나무색)                   # 가로대 아래
    칠(im, 0, 6, 15, 6, 그늘)
    칠(im, 0, 10, 15, 10, 그늘)
    테두리(im)
    return im


def 풀():
    """10×8 — 바닥에 뿌려 빈 데를 메운다."""
    im = 판(10, 8)
    진, 연 = (64, 122, 76), (92, 158, 96)
    for (x, 높이) in ((1, 4), (3, 6), (5, 7), (7, 5), (8, 3)):
        칠(im, x, 7 - 높이, x, 7, 진 if x % 2 else 연)
    테두리(im)
    return im


def 바위():
    """14×10 — 개울가에 놓는다."""
    im = 판(14, 10)
    돌, 돌2 = (152, 154, 160), (116, 118, 126)
    칠(im, 2, 4, 11, 9, 돌)
    칠(im, 4, 2, 9, 3, 돌)
    칠(im, 2, 7, 11, 9, 돌2)
    점(im, 5, 4, 돌2); 점(im, 8, 5, 돌2)
    테두리(im)
    return im


def 달():
    """20×20 — 「달빛 목장」이니 달은 크게. 외곽선 없이 은은하게 둔다."""
    im = 판(20, 20)
    밝, 옅 = (255, 246, 208), (232, 222, 178)
    r = 9
    for y in range(-r, r + 1):
        for x in range(-r, r + 1):
            if x * x + y * y <= r * r:
                점(im, 10 + x, 10 + y, 밝)
    for (ox, oy, rr) in ((6, 7, 2), (13, 12, 3), (9, 14, 2)):   # 달무늬
        for y in range(-rr, rr + 1):
            for x in range(-rr, rr + 1):
                if x * x + y * y <= rr * rr:
                    점(im, ox + x, oy + y, 옅)
    return im


밖 = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.abspath(__file__))
배경폴더 = os.path.join(밖, '배경')
os.makedirs(배경폴더, exist_ok=True)

만들것 = {
    '집': 집(), '나무': 나무(True), '나무작은': 나무(False),
    '울타리': 울타리(), '풀': 풀(), '바위': 바위(), '달': 달(),
}
for 이름, im in 만들것.items():
    im.save(os.path.join(배경폴더, f'{이름}.png'))
    print(f'배경/{이름}.png  {im.width}×{im.height}')

# 한눈에 보라고 미리보기도 한 장 — 밤하늘 위에 늘어놓은 것
미리 = Image.new('RGBA', (180, 120), (26, 32, 54, 255))
미리.alpha_composite(만들것['달'], (150, 6))
미리.alpha_composite(만들것['나무'], (6, 60))
미리.alpha_composite(만들것['집'], (46, 50))
미리.alpha_composite(만들것['나무작은'], (100, 68))
for i in range(12):
    미리.alpha_composite(만들것['울타리'], (i * 15, 104))
for x in (4, 36, 122, 158):
    미리.alpha_composite(만들것['풀'], (x, 88))
미리.alpha_composite(만들것['바위'], (122, 84))
미리.resize((540, 360), Image.NEAREST).save(os.path.join(배경폴더, '_미리보기.png'))
print('배경/_미리보기.png')
