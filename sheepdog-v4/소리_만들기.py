# 양몰이 소리 — 전부 여기서 만든다. 원곡. 외부 소리 파일 없음.
# 실행: python3 소리_만들기.py  →  소리/*.wav 생성 (ffmpeg 있으면 mp3도)
import numpy as np, os, subprocess, shutil, math

SR = 32000
OUT = '소리'; os.makedirs(OUT, exist_ok=True)

NOTE = {'C':0,'D':2,'E':4,'F':5,'G':7,'A':9,'B':11}
def hz(name):
    if name in ('.', None): return 0
    n = NOTE[name[0]]; i = 1
    if name[1] in '#b': n += 1 if name[1]=='#' else -1; i = 2
    octv = int(name[i:])
    return 440.0 * 2 ** ((n + (octv-4)*12 - 9) / 12)

# ── 파형 ─────────────────────────────────────────────────────
def env(n, a=0.005, d=0.06, s=0.7, r=0.05):
    t = np.arange(n)/SR; T = n/SR
    e = np.ones(n)*s
    ia = int(a*SR); idd = int(d*SR); ir = int(r*SR)
    if ia: e[:ia] = np.linspace(0,1,ia)
    if idd: e[ia:ia+idd] = np.linspace(1,s,min(idd, max(0,n-ia)))[:max(0,min(idd,n-ia))]
    if ir and n > ir: e[-ir:] *= np.linspace(1,0,ir)
    return e

def pulse(f, n, duty=0.5, vib=0.0, vibf=5.5):
    t = np.arange(n)/SR
    fr = f * (1 + vib*np.sin(2*np.pi*vibf*t) * np.clip((t-0.08)/0.1,0,1))
    ph = np.cumsum(fr)/SR % 1.0
    return np.where(ph < duty, 1.0, -1.0)

def tri(f, n):
    t = np.arange(n)/SR; ph = (f*t) % 1.0
    return 4*np.abs(ph-0.5)-1

def noise(n, seed=0):
    return np.random.RandomState(seed).uniform(-1,1,n)

def lowpass(x, cutoff):
    a = math.exp(-2*math.pi*cutoff/SR); y = np.zeros_like(x); z = 0.0
    for i in range(len(x)): z = a*z + (1-a)*x[i]; y[i] = z
    return y

# ── 트랙 렌더 ───────────────────────────────────────────────
def render(tracks, bpm, bars, beats=4, sub=2, echo=0.0):
    """tracks: list of dict(kind, vol, notes=[(name, len_in_subbeats), ...], duty, vib)
       sub = 서브비트(8분음표면 2)"""
    step = 60/bpm/sub
    total = int(bars*beats*sub*step*SR) + int(0.6*SR)
    mix = np.zeros(total)
    for tr in tracks:
        buf = np.zeros(total); pos = 0.0
        for nm, ln in tr['notes']:
            n = int(ln*step*SR); i0 = int(pos*SR)
            if nm != '.':
                f = hz(nm); k = tr['kind']
                if k == 'pulse': w = pulse(f, n, tr.get('duty',.5), tr.get('vib',0))
                elif k == 'tri': w = tri(f, n)
                elif k == 'kick':
                    t = np.arange(n)/SR; w = np.sin(2*np.pi*(120*np.exp(-t*30)+40)*t)*np.exp(-t*25)
                elif k == 'snare':
                    t = np.arange(n)/SR; w = (lowpass(noise(n, 3), 3500)*1.8 + np.sin(2*np.pi*180*t)*0.5)*np.exp(-t*22)
                elif k == 'hat':
                    t = np.arange(n)/SR; w = (noise(n, 7) - lowpass(noise(n,7), 4000))*np.exp(-t*60)
                if k in ('pulse','tri'):
                    w = w*env(n, s=tr.get('sus',.75), r=tr.get('rel',.04)) * tr.get('gate',1)
                buf[i0:i0+n] += w[:total-i0] * tr['vol']
            pos += ln*step
        mix += buf
    if echo:
        d = int(60/bpm*1.5*SR); e = np.zeros_like(mix); e[d:] = mix[:-d]*echo; mix += e
    return mix

def write(name, x, loop_trim=None, norm=0.85):
    if loop_trim: x = x[:int(loop_trim*SR)]
    x = x / (np.max(np.abs(x)) + 1e-9) * norm
    x16 = (x*32767).astype('<i2')
    p = f'{OUT}/{name}.wav'
    with open(p,'wb') as f:
        import struct
        data = x16.tobytes()
        f.write(b'RIFF'+struct.pack('<I',36+len(data))+b'WAVEfmt '+struct.pack('<IHHIIHH',16,1,1,SR,SR*2,2,16)+b'data'+struct.pack('<I',len(data))+data)
    if shutil.which('ffmpeg'):
        subprocess.run(['ffmpeg','-y','-loglevel','error','-i',p,'-codec:a','libmp3lame','-b:a','96k',f'{OUT}/{name}.mp3'])
    print(name, round(len(x)/SR,2),'초')

# ══════════════════════════════════════════════════════════
#  1) 목장 — 놀이 중 배경음. F장조 128bpm, 16마디 되풀이
# ══════════════════════════════════════════════════════════
BPM = 128
멜로디 = [  # (음, 8분음표 수)  마디마다 8
 ('A4',2),('C5',1),('A4',1),('F4',2),('G4',2),
 ('G4',2),('E4',1),('G4',1),('C5',2),('B4',2),
 ('A4',2),('F4',1),('A4',1),('D5',2),('C5',2),
 ('Bb4',3),('A4',1),('G4',2),('F4',2),
 ('A4',2),('C5',1),('A4',1),('F5',2),('E5',2),
 ('D5',2),('C5',1),('B4',1),('G4',4),
 ('Bb4',2),('D5',1),('F5',1),('D5',2),('C5',2),
 ('A4',3),('G4',1),('F4',4),
 ('C5',2),('A4',1),('C5',1),('F5',2),('A5',2),
 ('G5',2),('E5',1),('C5',1),('G4',4),
 ('F5',2),('E5',1),('D5',1),('A4',2),('D5',2),
 ('D5',3),('C5',1),('Bb4',2),('A4',2),
 ('F5',2),('A4',1),('C5',1),('A5',2),('G5',2),
 ('E5',2),('C5',1),('G4',1),('E5',2),('D5',2),
 ('D5',2),('F5',1),('D5',1),('Bb4',2),('C5',2),
 ('C5',2),('D5',1),('E5',1),('F5',3),('.',1),
]
코드 = ['F','C','Dm','Bb','F','C','Bb','C']*2
근음 = {'F':('F2','C3'),'C':('C3','G2'),'Dm':('D3','A2'),'Bb':('Bb2','F3')}
화음 = {'F':('F4','A4','C5'),'C':('E4','G4','C5'),'Dm':('D4','F4','A4'),'Bb':('D4','F4','Bb4')}
베이스, 아르페, 킥, 스네어, 햇 = [], [], [], [], []
for i, c in enumerate(코드):
    r, f = 근음[c]
    베이스 += [(r,1),('.',1),(f,1),('.',1),(r,1),(r,1),(f,1),('.',1)] if i%4!=3 else [(r,1),('.',1),(f,1),('.',1),(r,1),(f,1),(r,1),(f,1)]
    a,b,d = 화음[c]
    아르페 += [(a,1),(b,1),(d,1),(b,1)]*2
    킥 += [('C2',1),('.',3),('C2',1),('.',1),('C2',1),('.',1)]
    스네어 += [('.',2),('C2',1),('.',3),('C2',1),('.',1)]
    햇 += [('C2',1)]*8
목장 = render([
    dict(kind='pulse', vol=.32, notes=멜로디, duty=.25, vib=.006, sus=.7, rel=.05),
    dict(kind='pulse', vol=.09, notes=아르페, duty=.5, sus=.4, rel=.03),
    dict(kind='tri',   vol=.45, notes=베이스, sus=.9, rel=.02),
    dict(kind='kick',  vol=.6,  notes=킥),
    dict(kind='snare', vol=.28, notes=스네어),
    dict(kind='hat',   vol=.07, notes=햇),
], BPM, 16, echo=.18)
write('배경_목장', 목장, loop_trim=16*4*60/BPM)

# ══════════════════════════════════════════════════════════
#  2) 첫화면 — 느리고 조용. 96bpm 8마디
# ══════════════════════════════════════════════════════════
BPM2 = 96
첫멜 = [('F4',4),('A4',2),('C5',2), ('G4',6),('E4',2), ('A4',4),('F4',2),('D5',2), ('C5',6),('.',2),
        ('A4',4),('C5',2),('F5',2), ('E5',4),('C5',2),('G4',2), ('Bb4',4),('A4',2),('G4',2), ('F4',6),('.',2)]
첫코드 = ['F','C','Dm','C','F','C','Bb','F']
첫베 = []; 첫아 = []
for c in 첫코드:
    r, f = 근음[c]; 첫베 += [(r,4),(f,4)]
    a,b,d = 화음[c]; 첫아 += [(a,1),(b,1),(d,1),(b,1)]*2
첫화면 = render([
    dict(kind='tri',   vol=.5,  notes=첫멜, sus=.8, rel=.08),
    dict(kind='pulse', vol=.07, notes=첫아, duty=.5, sus=.35, rel=.05),
    dict(kind='tri',   vol=.35, notes=첫베, sus=.9, rel=.05),
], BPM2, 8, echo=.25)
write('배경_첫화면', 첫화면, loop_trim=8*4*60/BPM2)

# ══════════════════════════════════════════════════════════
#  3) 짧은 것들
# ══════════════════════════════════════════════════════════
이김 = render([dict(kind='pulse', vol=.4, duty=.25, notes=[('C5',1),('E5',1),('G5',1),('C6',2),('.',1),('G5',1),('C6',3)], sus=.8),
               dict(kind='tri', vol=.4, notes=[('C3',2),('G3',2),('C4',4)], sus=.9)], 150, 1, beats=5, sub=2)
write('이김', 이김)
짐 = render([dict(kind='pulse', vol=.35, duty=.5, notes=[('E4',2),('Eb4',2),('D4',2),('Db4',4)], sus=.8),
             dict(kind='tri', vol=.4, notes=[('A2',4),('Ab2',6)], sus=.9)], 110, 1, beats=5, sub=2)
write('짐', 짐)
들임 = render([dict(kind='pulse', vol=.4, duty=.25, notes=[('E5',1),('A5',2)], sus=.8)], 240, 1, beats=1, sub=3)
write('들임', 들임)

# 짖기: 종별 6개 버전 (주파수가 다름)
강아지_음성 = {
    '보더콜리': {'f1':330, 'f2':270},
    '저먼셰퍼드': {'f1':240, 'f2':180},
    '코기': {'f1':420, 'f2':330},
    '진도견': {'f1':200, 'f2':150},
    '삽살개': {'f1':480, 'f2':380},
    '골든리트리버': {'f1':360, 'f2':280},
}

for 종, 음성 in 강아지_음성.items():
    f1, f2 = 음성['f1'], 음성['f2']
    n = int(.13*SR); t = np.arange(n)/SR
    # 주파수: f1 → f2 로 떨어짐 (지수 감소)
    f = f1*np.exp(-t*9) + f2; ph = np.cumsum(f)/SR%1
    w = np.where(ph<.5,1,-1)*np.exp(-t*18)*.8 + lowpass(noise(n,5),2500)*np.exp(-t*30)*.9
    w2 = np.concatenate([w, np.zeros(int(.05*SR)), w*.8])
    write(f'짖기_{종}', w2)
# 양 울음: 톱니파 + 떨림
n = int(.32*SR); t = np.arange(n)/SR
f = 440*(1+.06*np.sin(2*np.pi*14*t))*(1-.15*t); ph = np.cumsum(f)/SR%1
w = (2*ph-1)*.6 + tri(880, n)*.2
w = lowpass(w, 2600) * np.minimum(1,t*40) * np.exp(-t*4)
write('양', w)
# 누름(단추)
n = int(.06*SR); t = np.arange(n)/SR
write('누름', np.where(((t*880)%1)<.5,1,-1)*np.exp(-t*60))
