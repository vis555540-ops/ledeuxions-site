# 양몰이 강아지 6종 — 32×32 픽셀아트 (왼쪽 보기, 줄: 가만/걷기/달리기/하품/앉기/짖기)
import numpy as np, os, json
from PIL import Image

W = H = 32
OUT = (58, 44, 40)          # 외곽선
MP = (238, 140, 150)        # 볼
TG = (232, 105, 120)        # 혀

def layer(): return np.zeros((H, W, 4), np.uint8)
def put(L, x, y, c):
    x = int(round(x)); y = int(round(y))
    if 0 <= x < W and 0 <= y < H: L[y, x] = (c[0], c[1], c[2], 255)
def ell(L, cx, cy, rx, ry, c):
    for y in range(H):
        for x in range(W):
            if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1.0: L[y, x] = (*c, 255)
def rect(L, x0, y0, x1, y1, c):
    for y in range(int(y0), int(y1) + 1):
        for x in range(int(x0), int(x1) + 1): put(L, x, y, c)
def outline(L, c=OUT):
    m = L[..., 3] > 0
    o = np.zeros_like(m)
    o[1:, :] |= m[:-1, :]; o[:-1, :] |= m[1:, :]; o[:, 1:] |= m[:, :-1]; o[:, :-1] |= m[:, 1:]
    o &= ~m
    R = L.copy(); R[o] = (*c, 255); return R
def comp(*Ls):
    R = layer()
    for L in Ls:
        m = L[..., 3] > 0; R[m] = L[m]
    return R
def shift(L, dx, dy):
    R = layer()
    ys, xs = np.nonzero(L[..., 3])
    for y, x in zip(ys, xs):
        nx, ny = x + dx, y + dy
        if 0 <= nx < W and 0 <= ny < H: R[ny, nx] = L[y, x]
    return R
def recolor(L, mask_fn, c):
    for y in range(H):
        for x in range(W):
            if L[y, x, 3] and mask_fn(x, y): L[y, x] = (*c, 255)

# ── 종 정의 ─────────────────────────────────────────────
#  몸: 주색, 몸2: 주색 밝은 쪽(등·이마), 얼굴: 주둥이·가슴·배, 얼굴2: 그 그림자
#  귀: 위/늘어짐, 꼬리: 깃털/말림/뭉툭/처짐, 이마줄: 흰 줄, 안장: 등에 검은 안장, 다리: 길이, 털: 삽살개 덥수룩
종들 = {
  '보더콜리':   dict(몸=(50,40,44),   몸2=(96,80,84),    얼굴=(252,250,245), 얼굴2=(222,216,206), 귀='위',   꼬리='깃털', 이마줄=True,  안장=None,        다리=5, 털=False),
  '저먼셰퍼드': dict(몸=(198,138,74), 몸2=(216,164,104), 얼굴=(236,196,140), 얼굴2=(210,166,110), 귀='위',   꼬리='처짐', 이마줄=False, 안장=(52,42,40),  다리=5, 털=False),
  '코기':       dict(몸=(234,150,76), 몸2=(246,180,112), 얼굴=(252,250,245), 얼굴2=(222,216,206), 귀='위큰', 꼬리='뭉툭', 이마줄=True,  안장=None,        다리=3, 털=False),
  '진도견':     dict(몸=(244,222,182),몸2=(250,236,208), 얼굴=(253,247,234), 얼굴2=(228,214,190), 귀='위',   꼬리='말림', 이마줄=False, 안장=None,        다리=5, 털=False),
  '삽살개':     dict(몸=(156,152,150),몸2=(190,186,184), 얼굴=(214,210,206), 얼굴2=(184,180,176), 귀='늘어짐',꼬리='깃털', 이마줄=False, 안장=None,        다리=4, 털=True),
  '골든리트리버':dict(몸=(222,174,88), 몸2=(236,198,120), 얼굴=(246,226,172), 얼굴2=(220,196,140), 귀='늘어짐',꼬리='깃털', 이마줄=False, 안장=None,        다리=5, 털=False),
}

def dog(P, head=(0,0), body_dy=0, legs=None, sit=False, eyes='open', mouth='closed', tail=(0,0), ears=0, bark=False):
    DK, DK2, FC, FC2 = P['몸'], P['몸2'], P['얼굴'], P['얼굴2']
    legs = legs or {}
    lh = P['다리']
    body_dy += (5 - lh)            # 다리 짧으면 몸이 내려온다
    def leg(name, x):
        dx, dy, h = legs.get(name, (0, 0, lh))
        h = min(h, lh)
        L = layer(); y0 = 22 + body_dy + dy
        rect(L, x+dx, y0, x+dx+2, y0+h, FC if P['이마줄'] else DK)
        rect(L, x+dx, y0, x+dx+2, y0+1, DK)
        rect(L, x+dx, y0+h, x+dx+2, y0+h, FC2 if P['이마줄'] else OUT if False else DK2)
        return outline(L)
    # 꼬리
    T = layer()
    k = P['꼬리']
    if k == '깃털':
        ell(T, 27.5, 14, 2.3, 2.3, DK); ell(T, 29, 11, 2.2, 2.2, DK); ell(T, 29, 8.5, 1.8, 1.8, DK); ell(T, 29, 7.5, 1.3, 1.3, FC)
    elif k == '말림':
        ell(T, 26.5, 12, 3.2, 3.0, DK); ell(T, 26.5, 12, 1.2, 1.1, FC); ell(T, 27, 15, 1.6, 1.6, DK)
    elif k == '뭉툭':
        ell(T, 27.5, 14.5, 1.6, 1.6, DK)
    elif k == '처짐':
        ell(T, 27.5, 15, 2.1, 2.1, DK); ell(T, 28.5, 18, 2.0, 2.0, DK); ell(T, 29, 21, 1.7, 1.7, DK); put(T, 29, 22, FC)
    T = shift(outline(T), tail[0], tail[1] + body_dy)
    # 몸
    B = layer()
    ell(B, 19.5, 17.5, 8.8, 6.2, DK)
    recolor(B, lambda x, y: y <= 13, DK2)
    if P['안장']: recolor(B, lambda x, y: y <= 15 and 13 <= x <= 26, P['안장'])
    ell(B, 15, 19, 4.2, 4, FC)                       # 가슴
    rect(B, 13, 21, 25, 23, FC)                       # 배
    if P['털']:
        for (x, y) in [(14,14),(17,13),(20,13),(23,14),(26,16),(15,24),(19,24),(23,24)]: put(B, x, y, FC2)
    if sit:
        ell(B, 25, 23, 3.8, 3.2, DK)
        rect(B, 23, 25, 26, 26, FC); rect(B, 23, 26, 26, 26, FC2)
    B = shift(outline(B), 0, body_dy)
    # 귀
    E = layer(); g = P['귀']
    if g in ('위', '위큰'):
        s = 1 if g == '위큰' else 0
        rect(E, 3, 7, 7, 10, DK); rect(E, 4, 5-s, 6, 6, DK); rect(E, 5, 4-s, 6, 4-s, DK); put(E, 5, 6, MP)
        rect(E, 12, 7, 16, 10, DK); rect(E, 13, 5-s, 15, 6, DK); rect(E, 13, 4-s, 14, 4-s, DK); put(E, 14, 6, MP)
        if P['안장']: recolor(E, lambda x, y: y <= 6, P['안장'])
    else:  # 늘어짐
        c = P['몸'] if not P['털'] else (120,116,114)
        rect(E, 3, 8, 5, 15, c); put(E, 4, 16, c); rect(E, 14, 8, 16, 15, c); put(E, 15, 16, c)
    E = shift(outline(E), head[0], head[1] + ears)
    # 머리
    Hd = layer()
    ell(Hd, 9.5, 11.5, 6.2, 5.6, DK)
    recolor(Hd, lambda x, y: y <= 8, DK2)
    if P['안장']: recolor(Hd, lambda x, y: y <= 7 and 6 <= x <= 13, P['안장'])
    ell(Hd, 9.5, 13.2, 4.6, 3.9, FC)                  # 주둥이
    if P['이마줄']: rect(Hd, 9, 6, 10, 10, FC)
    ell(Hd, 8, 15.5, 3.6, 2.2, FC)
    if eyes == 'open':
        rect(Hd, 7, 11, 7, 12, OUT); rect(Hd, 12, 11, 12, 12, OUT)
    else:
        for x in (6, 7): put(Hd, x, 12, OUT)
        for x in (12, 13): put(Hd, x, 12, OUT)
    put(Hd, 5, 13, MP); put(Hd, 14, 13, MP)
    rect(Hd, 6, 14, 7, 14, OUT)                        # 코
    if mouth == 'closed':
        put(Hd, 8, 16, FC2); put(Hd, 9, 16, FC2)
    elif mouth == 'half':
        ell(Hd, 8, 16.5, 3.4, 2.4, FC); rect(Hd, 6, 16, 9, 16, OUT); rect(Hd, 6, 17, 9, 17, OUT); rect(Hd, 7, 17, 8, 17, MP)
    else:
        ell(Hd, 8, 17, 3.6, 3, FC); rect(Hd, 5, 16, 10, 19, OUT); rect(Hd, 6, 17, 9, 18, MP); rect(Hd, 7, 18, 8, 19, TG)
    if P['털']:  # 앞머리
        for x in range(4, 15): put(Hd, x, 9 + (x % 2), DK2)
        for x in (5, 8, 11): put(Hd, x, 10, DK)
    Hd = shift(outline(Hd), head[0], head[1])
    K = layer()
    if bark:
        for (x, y) in [(2, 10), (1, 12), (2, 14), (3, 8), (3, 16)]: put(K, x + head[0], y, OUT)
    if sit: return comp(T, E, B, leg('FL', 12), leg('FR', 16), Hd, K)
    return comp(T, E, leg('BL', 21), leg('BR', 25), B, leg('FL', 12), leg('FR', 16), Hd, K)

# ── 동작 (v2 게임의 줄 순서와 같음) ──────────────────────
DOG = {
    '가만': [dict(), dict(tail=(1, 0), ears=1)],
    '걷기': [dict(legs={'FL': (-1, 0, 4), 'BR': (-1, 0, 4)}), dict(body_dy=1, head=(0, 1)),
             dict(legs={'FR': (-1, 0, 4), 'BL': (-1, 0, 4)}), dict(body_dy=1, head=(0, 1))],
    '달리기': [dict(legs={'FL': (2, 0, 5), 'FR': (1, 0, 5), 'BL': (-2, 0, 5), 'BR': (-1, 0, 5)}, body_dy=1, head=(0, 1), ears=1),
               dict(legs={'FL': (0, 0, 5), 'FR': (-1, 0, 5), 'BL': (1, 0, 4), 'BR': (2, 0, 4)}),
               dict(legs={'FL': (-3, -1, 4), 'FR': (-2, -1, 4), 'BL': (2, -1, 4), 'BR': (3, -1, 4)}, body_dy=-1, head=(-1, -1), ears=-1, tail=(0, -1)),
               dict(legs={'FL': (-1, 0, 5), 'FR': (0, 0, 5), 'BL': (0, 0, 5), 'BR': (1, 0, 5)})],
    '하품': [dict(eyes='closed'), dict(eyes='closed', mouth='half'), dict(eyes='closed', mouth='open', head=(0, -1)), dict(eyes='closed', mouth='half')],
    '앉기': [dict(sit=True, body_dy=1, head=(0, 1)), dict(sit=True, body_dy=1, head=(0, 1), eyes='closed')],
    '짖기': [dict(mouth='open', head=(-1, 0), bark=True), dict(mouth='closed')],
}

OUT_DIR = '/home/claude/game/개'; os.makedirs(OUT_DIR, exist_ok=True)
PV = '/home/claude/game/미리보기'; os.makedirs(PV, exist_ok=True)

def build(name, P):
    rows = []
    for aname, frames in DOG.items():
        rows.append([Image.fromarray(dog(P, **kw), 'RGBA') for kw in frames])
    sheet = Image.new('RGBA', (4 * 32, len(rows) * 32))
    for r, imgs in enumerate(rows):
        for c, im in enumerate(imgs): sheet.paste(im, (c * 32, r * 32))
    sheet.save(f'{OUT_DIR}/{name}.png')
    # 미리보기 gif (가만→걷기→앉기→짖기 순서로 한 바퀴)
    gs = []
    for r, dur in [(0, 400), (1, 130), (4, 500), (5, 150), (2, 90)]:
        for im in rows[r] * (2 if r in (1, 2) else 1):
            g = Image.new('RGBA', (192, 192), (124, 186, 96, 255)); g.alpha_composite(im.resize((192, 192), Image.NEAREST))
            gs.append((g.convert('P', palette=Image.ADAPTIVE), dur))
    gs[0][0].save(f'{PV}/{name}.gif', save_all=True, append_images=[g for g, _ in gs[1:]], duration=[d for _, d in gs], loop=0)
    return sheet

sheets = {n: build(n, P) for n, P in 종들.items()}
# 한 장 모아보기 (가만 첫 칸, 6배)
board = Image.new('RGBA', (6 * 40 * 6, 40 * 6), (124, 186, 96, 255))
for i, (n, s) in enumerate(sheets.items()):
    fr = s.crop((0, 0, 32, 32)).resize((192, 192), Image.NEAREST)
    board.alpha_composite(fr, (i * 240 + 24, 24))
board.save(f'{PV}/6종_모아보기.png')
board2 = Image.new('RGBA', (6 * 40 * 6, 40 * 6), (124, 186, 96, 255))
for i, (n, s) in enumerate(sheets.items()):
    fr = s.crop((0, 128, 32, 160)).resize((192, 192), Image.NEAREST)
    board2.alpha_composite(fr, (i * 240 + 24, 24))
board2.save(f'{PV}/6종_앉기.png')
print('완료', list(sheets))
