# 늑대·여우 — 개_그리기.py 의 점찍기 코드를 그대로 빌려 쓴다. 그림체를 맞추려고.
# 시트: 32×32 칸, 가로 4칸 · 세로 2줄 (0줄=걷기 4칸, 1줄=도망 2칸) → 128×64
import os, sys, re
from PIL import Image

원본 = os.path.expanduser('~/ledeuxions-site/sheepdog/개_그리기.py')
소스 = open(원본, encoding='utf-8').read()
윗부분 = 소스.split('# ── 동작')[0]          # dog() 까지만 가져온다
ns = {}
exec(compile(윗부분, 원본, 'exec'), ns)
dog, layer, put, rect, outline, shift = ns['dog'], ns['layer'], ns['put'], ns['rect'], ns['outline'], ns['shift']
OUT = ns['OUT']

들짐승 = {
  # 늑대: 잿빛에 검은 안장, 선 귀, 덥수룩한 꼬리, 긴 다리
  '늑대': dict(몸=(104,110,122), 몸2=(142,148,160), 얼굴=(214,218,226), 얼굴2=(176,182,192),
               귀='위', 꼬리='깃털', 이마줄=False, 안장=(58,62,74), 다리=6, 털=False),
  # 여우: 주황에 흰 가슴·흰 꼬리끝(깃털 꼬리 끝칸이 얼굴색이라 저절로 하얘진다), 큰 귀, 짧은 다리
  '여우': dict(몸=(226,118,44), 몸2=(244,152,74), 얼굴=(250,246,238), 얼굴2=(226,214,198),
               귀='위큰', 꼬리='깃털', 이마줄=False, 안장=None, 다리=4, 털=False),
}

동작 = {
  # 걷기 4칸 — 개와 같은 걸음새라 나란히 놔도 안 튄다
  '걷기': [dict(legs={'FL': (-1, 0, 4), 'BR': (-1, 0, 4)}),
           dict(body_dy=1, head=(0, 1)),
           dict(legs={'FR': (-1, 0, 4), 'BL': (-1, 0, 4)}),
           dict(body_dy=1, head=(0, 1))],
  # 도망 2칸 — 달리기에서 제일 벌어진 칸과 제일 모인 칸. 꼬리 내리고 귀 눕힘
  '도망': [dict(legs={'FL': (3, 0, 5), 'FR': (2, 0, 5), 'BL': (-3, 0, 5), 'BR': (-2, 0, 5)},
                body_dy=1, head=(1, 1), ears=2, tail=(-1, 2), eyes='open', mouth='half'),
           dict(legs={'FL': (-3, -1, 4), 'FR': (-2, -1, 4), 'BL': (2, -1, 4), 'BR': (3, -1, 4)},
                body_dy=-1, head=(0, -1), ears=2, tail=(-1, 2), mouth='half')],
}

밖 = sys.argv[1] if len(sys.argv) > 1 else '.'
os.makedirs(밖, exist_ok=True)
만든것 = {}
for 이름, P in 들짐승.items():
    줄들 = [[Image.fromarray(dog(P, **kw), 'RGBA') for kw in 칸들] for 칸들 in 동작.values()]
    시트 = Image.new('RGBA', (4 * 32, len(줄들) * 32))
    for r, 칸들 in enumerate(줄들):
        for c, im in enumerate(칸들): 시트.paste(im, (c * 32, r * 32))
    시트.save(f'{밖}/{이름}.png')
    만든것[이름] = 시트
    print(이름, 시트.size)

# 크게 모아보기 (형이 눈으로 볼 것)
배경 = (124, 186, 96, 255)
큰 = Image.new('RGBA', (4 * 32 * 5 + 40, 2 * 32 * 5 * 2 + 60), 배경)
y = 20
for 이름, s in 만든것.items():
    큰.alpha_composite(s.resize((s.width * 5, s.height * 5), Image.NEAREST), (20, y))
    y += s.height * 5 + 20
큰.save(f'{밖}/늑대여우_크게.png')
print('모아보기', 큰.size)
