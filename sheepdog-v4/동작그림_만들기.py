import numpy as np, os, zipfile, json
from PIL import Image

W = H = 32
OUT = (58, 44, 40)

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

# ---------------- SHEEP ----------------
WOOL = (252, 250, 245); WOOL2 = (226, 220, 208)
CREAM = (244, 214, 186); CREAM2 = (218, 178, 148)
PINK = (248, 170, 172); HOOF = (95, 72, 64)
GRASS = (150, 215, 100); GRASS2 = (90, 165, 66)

def sheep(head=(0, 0), body_dy=0, legs=None, sit=False, eyes='open', mouth='closed', grass=False, zz=0):
    legs = legs or {}
    def leg(name, x):
        dx, dy, h = legs.get(name, (0, 0, 5))
        L = layer()
        y0 = 23 + body_dy + dy
        rect(L, x + dx, y0, x + dx + 2, y0 + h, CREAM)
        rect(L, x + dx, y0 + h, x + dx + 2, y0 + h, HOOF)
        return outline(L)
    B = layer()
    parts = [(18, 18, 9, 6.5), (10.5, 15, 3.5, 3.5), (13.5, 12.5, 3.5, 3.5), (18, 11.5, 3.5, 3.5),
             (22.5, 12.5, 3.5, 3.5), (26, 15.5, 3.5, 3.5), (26.5, 20, 3, 3), (22, 24, 2.5, 2.5),
             (15, 24, 2.5, 2.5), (28.5, 17.5, 2, 2)]
    for p in parts: ell(B, *p, WOOL)
    m = B[..., 3] > 0
    for y in range(H):
        for x in range(W):
            if m[y, x] and (y >= 22 or x >= 27): B[y, x] = (*WOOL2, 255)
    if sit:
        ell(B, 12, 25.5, 3, 1.8, CREAM); ell(B, 17.5, 26, 2.5, 1.5, CREAM)
    B = shift(outline(B), 0, body_dy)

    hx, hy = head
    Hd = layer()
    ell(Hd, 3.6, 12.5, 2.1, 1.3, CREAM); ell(Hd, 15.4, 12.5, 2.1, 1.3, CREAM)      # ears
    ell(Hd, 9.5, 13.5, 4.3, 3.6, CREAM)                                             # face
    cap = layer(); ell(cap, 9.5, 8.5, 6, 5.2, WOOL); ell(cap, 4.5, 9.5, 2.2, 2.2, WOOL); ell(cap, 14.5, 9.5, 2.2, 2.2, WOOL)
    cm = cap[..., 3] > 0
    for y in range(H):
        for x in range(W):
            if cm[y, x] and (y <= 10 or (y == 11 and x % 3 == 1)): Hd[y, x] = cap[y, x]
    if eyes == 'open':
        rect(Hd, 6, 13, 7, 14, OUT); rect(Hd, 11, 13, 12, 14, OUT)
        put(Hd, 6, 13, (120, 100, 95)); put(Hd, 11, 13, (120, 100, 95))
    elif eyes == 'closed':
        for x in (6, 7): put(Hd, x, 14, OUT)
        for x in (11, 12): put(Hd, x, 14, OUT)
    elif eyes == 'wide':
        rect(Hd, 5, 12, 7, 14, OUT); rect(Hd, 11, 12, 13, 14, OUT)
        put(Hd, 5, 12, WOOL); put(Hd, 11, 12, WOOL)
    rect(Hd, 5, 15, 6, 15, PINK); rect(Hd, 13, 15, 14, 15, PINK)
    if mouth == 'closed':
        put(Hd, 9, 16, CREAM2); put(Hd, 10, 16, CREAM2)
    else:
        put(Hd, 9, 16, OUT); put(Hd, 10, 16, OUT); put(Hd, 9, 17, PINK); put(Hd, 10, 17, PINK)
    Hd = shift(outline(Hd), hx, hy)

    G = layer()
    if grass:
        for (x, y, c) in [(2, 28, GRASS2), (3, 26, GRASS), (3, 27, GRASS), (3, 28, GRASS), (4, 28, GRASS2),
                          (5, 25, GRASS), (5, 26, GRASS), (5, 27, GRASS2), (5, 28, GRASS2), (6, 28, GRASS),
                          (7, 26, GRASS), (7, 27, GRASS), (7, 28, GRASS2), (8, 28, GRASS), (9, 27, GRASS), (9, 28, GRASS2)]:
            put(G, x, y, c)
    Z = layer()
    if zz:
        base = [(2, 6), (3, 6), (2, 7), (2, 8), (3, 8)]  # small z
        for (x, y) in base: put(Z, x + 24 + zz, y + 1 - zz * 2, OUT)
        for (x, y) in [(0, 0), (1, 0), (1, 1), (0, 2), (1, 2)]:
            put(Z, x + 24 + zz, y + 1 - zz * 2, OUT)
    if sit:
        return comp(G, Z, B, Hd)
    return comp(G, Z, leg('BL', 20), leg('BR', 24), B, leg('FL', 10), leg('FR', 14), Hd)

# ---------------- DOG ----------------
DK = (50, 40, 44); DK2 = (96, 80, 84); WH = (252, 250, 245); WH2 = (222, 216, 206)
MP = (238, 140, 150); TG = (232, 105, 120)

def dog(head=(0, 0), body_dy=0, legs=None, sit=False, eyes='open', mouth='closed', tail=(0, 0), ears=0, bark=False):
    legs = legs or {}
    def leg(name, x):
        dx, dy, h = legs.get(name, (0, 0, 5))
        L = layer()
        y0 = 22 + body_dy + dy
        rect(L, x + dx, y0, x + dx + 2, y0 + h, WH)
        rect(L, x + dx, y0, x + dx + 2, y0 + 1, DK)
        rect(L, x + dx, y0 + h, x + dx + 2, y0 + h, WH2)
        return outline(L)
    T = layer()
    ell(T, 27.5, 14, 2.3, 2.3, DK); ell(T, 29, 11, 2.2, 2.2, DK); ell(T, 29, 8.5, 1.8, 1.8, DK)
    ell(T, 29, 7.5, 1.3, 1.3, WH)
    T = shift(outline(T), tail[0], tail[1] + body_dy)
    B = layer()
    ell(B, 19.5, 17.5, 8.8, 6.2, DK)
    for y in range(H):
        for x in range(W):
            if B[y, x, 3] and y <= 13: B[y, x] = (*DK2, 255)
    ell(B, 15, 19, 4.2, 4, WH)
    rect(B, 13, 21, 25, 23, WH)
    if sit:
        ell(B, 25, 23, 3.8, 3.2, DK)
        rect(B, 23, 25, 26, 26, WH); rect(B, 23, 26, 26, 26, WH2)
    B = shift(outline(B), 0, body_dy)
    E = layer()
    rect(E, 3, 7, 7, 10, DK); rect(E, 4, 5, 6, 6, DK); rect(E, 5, 4, 6, 4, DK); put(E, 5, 6, MP)
    rect(E, 12, 7, 16, 10, DK); rect(E, 13, 5, 15, 6, DK); rect(E, 13, 4, 14, 4, DK); put(E, 14, 6, MP)
    E = shift(outline(E), head[0], head[1] + ears)
    Hd = layer()
    ell(Hd, 9.5, 11.5, 6.2, 5.6, DK)
    for y in range(H):
        for x in range(W):
            if Hd[y, x, 3] and y <= 8: Hd[y, x] = (*DK2, 255)
    ell(Hd, 9.5, 13.2, 4.6, 3.9, WH); rect(Hd, 9, 6, 10, 10, WH)
    ell(Hd, 8, 15.5, 3.6, 2.2, WH)
    if eyes == 'open':
        rect(Hd, 7, 11, 7, 12, OUT); rect(Hd, 12, 11, 12, 12, OUT)
    else:
        for x in (6, 7): put(Hd, x, 12, OUT)
        for x in (12, 13): put(Hd, x, 12, OUT)
    put(Hd, 5, 13, MP); put(Hd, 14, 13, MP)
    rect(Hd, 6, 14, 7, 14, DK)
    if mouth == 'closed':
        put(Hd, 8, 16, DK); put(Hd, 9, 16, DK)
    elif mouth == 'half':
        ell(Hd, 8, 16.5, 3.4, 2.4, WH)
        rect(Hd, 6, 16, 9, 16, DK); rect(Hd, 6, 17, 9, 17, DK); rect(Hd, 7, 17, 8, 17, MP)
    else:
        ell(Hd, 8, 17, 3.6, 3, WH)
        rect(Hd, 5, 16, 10, 19, DK); rect(Hd, 6, 17, 9, 18, MP); rect(Hd, 7, 18, 8, 19, TG)
    Hd = shift(outline(Hd), head[0], head[1])
    K = layer()
    if bark:
        for (x, y) in [(2, 10), (1, 12), (2, 14), (3, 8), (3, 16)]: put(K, x + head[0], y, OUT)
    if sit:
        return comp(T, E, B, leg('FL', 12), leg('FR', 16), Hd, K)
    return comp(T, E, leg('BL', 21), leg('BR', 25), B, leg('FL', 12), leg('FR', 16), Hd, K)

# ---------------- ANIMATIONS ----------------
up = (0, 0, 4)
SHEEP = {
    'idle': [dict(), dict(head=(0, 1))],
    'walk': [dict(legs={'FL': up, 'BR': up}),
             dict(body_dy=1, head=(0, 1)),
             dict(legs={'FR': up, 'BL': up}),
             dict(body_dy=1, head=(0, 1))],
    'eat':  [dict(head=(-2, 3), grass=True),
             dict(head=(-2, 6), grass=True),
             dict(head=(-2, 6), grass=True, mouth='open'),
             dict(head=(-2, 6), grass=True),
             dict(head=(-2, 3), grass=True)],
    'sit':  [dict(sit=True, body_dy=2, head=(0, 2)),
             dict(sit=True, body_dy=2, head=(0, 2), eyes='closed')],
    'sleep': [dict(sit=True, body_dy=2, head=(0, 3), eyes='closed', zz=1),
              dict(sit=True, body_dy=2, head=(0, 3), eyes='closed', zz=2)],
    'alert': [dict(body_dy=-1, head=(0, -2), eyes='wide'),
              dict(eyes='wide')],
}
DOG = {
    'idle': [dict(), dict(tail=(1, 0), ears=1)],
    'walk': [dict(legs={'FL': (-1, 0, 4), 'BR': (-1, 0, 4)}),
             dict(body_dy=1, head=(0, 1)),
             dict(legs={'FR': (-1, 0, 4), 'BL': (-1, 0, 4)}),
             dict(body_dy=1, head=(0, 1))],
    'run':  [dict(legs={'FL': (2, 0, 5), 'FR': (1, 0, 5), 'BL': (-2, 0, 5), 'BR': (-1, 0, 5)}, body_dy=1, head=(0, 1), ears=1),
             dict(legs={'FL': (0, 0, 5), 'FR': (-1, 0, 5), 'BL': (1, 0, 4), 'BR': (2, 0, 4)}),
             dict(legs={'FL': (-3, -1, 4), 'FR': (-2, -1, 4), 'BL': (2, -1, 4), 'BR': (3, -1, 4)}, body_dy=-1, head=(-1, -1), ears=-1, tail=(0, -1)),
             dict(legs={'FL': (-1, 0, 5), 'FR': (0, 0, 5), 'BL': (0, 0, 5), 'BR': (1, 0, 5)}, head=(0, 0))],
    'yawn': [dict(eyes='closed'),
             dict(eyes='closed', mouth='half'),
             dict(eyes='closed', mouth='open', head=(0, -1)),
             dict(eyes='closed', mouth='half')],
    'sit':  [dict(sit=True, body_dy=1, head=(0, 1)),
             dict(sit=True, body_dy=1, head=(0, 1), eyes='closed')],
    'bark': [dict(mouth='open', head=(-1, 0), bark=True),
             dict(mouth='closed')],
}

OUTDIR = '/mnt/user-data/outputs'; os.makedirs(OUTDIR, exist_ok=True)
FR = '/home/claude/frames'; os.makedirs(FR, exist_ok=True)

def build(name, fn, anims):
    rows = []; meta = {}; files = []
    for aname, frames in anims.items():
        imgs = []
        for i, kw in enumerate(frames):
            arr = fn(**kw); im = Image.fromarray(arr, 'RGBA'); imgs.append(im)
            p = f'{FR}/{name}_{aname}_{i}.png'; im.save(p); files.append(p)
        rows.append((aname, imgs))
        meta[aname] = {'row': len(rows) - 1, 'frames': len(frames), 'frame_size': 32}
    maxw = max(len(r[1]) for r in rows)
    sheet = Image.new('RGBA', (maxw * 32, len(rows) * 32))
    for r, (aname, imgs) in enumerate(rows):
        for c, im in enumerate(imgs): sheet.paste(im, (c * 32, r * 32))
    sheet.save(f'{OUTDIR}/{name}_sheet.png')
    json.dump(meta, open(f'{OUTDIR}/{name}_sheet.json', 'w'), indent=1, ensure_ascii=False)
    # preview 6x
    pv = sheet.resize((sheet.width * 6, sheet.height * 6), Image.NEAREST)
    bg = Image.new('RGBA', pv.size, (124, 186, 96, 255)); bg.alpha_composite(pv)
    bg.save(f'{OUTDIR}/{name}_preview.png')
    # gifs
    for aname, imgs in rows:
        gs = []
        for im in imgs:
            g = Image.new('RGBA', (32 * 6, 32 * 6), (124, 186, 96, 255))
            g.alpha_composite(im.resize((192, 192), Image.NEAREST)); gs.append(g.convert('P', palette=Image.ADAPTIVE))
        gs[0].save(f'{OUTDIR}/{name}_{aname}.gif', save_all=True, append_images=gs[1:], duration=140, loop=0)
    return files

files = build('sheep', sheep, SHEEP) + build('collie', dog, DOG)
with zipfile.ZipFile(f'{OUTDIR}/frames_png.zip', 'w') as z:
    for f in files: z.write(f, os.path.basename(f))
print('done', len(files))
