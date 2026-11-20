#!/usr/bin/env python3
"""홈 검색창용 색인 만들기: sitemap.xml → assets/search-index.json

사용법 (저장소 맨 위에서):  python3 scripts/build-search-index.py
새 페이지를 sitemap.xml 에 넣은 뒤 한 번 돌려주면 검색에 잡힌다.
자주 찾는 말(동의어)은 아래 KEYWORDS 에 손으로 더한다.
"""
import html, json, re, sys
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parent.parent
SKIP_LANG = re.compile(r'/(en|ja|es|pt|de)(/|$)|_en$|/privacy/$|/terms/$|/edit$|/개인정보/$')

# 분류 — 홈 카테고리 5개와 같다 (2026-11-20 전체 분류표 기준). 위에서부터 먼저 맞는 것.
STUDENT_WORK = ('유치원-레지오', '무엇이-옳은-건축', '미술관-면의', '종교시설-종교의', '공원-맵핑')
ART_ESSAYS = ('현대미술-어렵다', '아름다움에-대해', '그림자-adoration')
def category(path):
    if path in ('/모아보기/', '/새로운것/'):
        return '사이트'
    if path.startswith(('/notes/', '/work/', '/history/', '/의뢰/', '/사무실/', '/contact/')) or any(k in path for k in STUDENT_WORK):
        return '작업'
    if path.startswith(('/artists/', '/gallery/', '/museum/', '/draw/', '/그림판/', '/sheepdog/draw', '/sheepdog/그림판',
                        '/web-projects/paintcomfortfro', '/web-projects/game-world/pixel/')) or any(k in path for k in ART_ESSAYS):
        return '미술'
    if path.startswith(('/글/', '/magazine/', '/someday/', '/maejeum/')):
        return '에세이'
    if path.startswith(('/games/', '/web-projects/game-world/', '/wriggle/', '/sheepdog/', '/오늘/')):
        return '게임'
    return '유틸리티'

# 사람들이 실제로 치는 말 (경로 앞부분 기준, 겹치면 모두 붙음)
KEYWORDS = {
    '/web-projects/pdf300/': 'pdf 피디에프 pdf300',
    '/web-projects/pdf300/merge': '합치기 병합 여러개 하나로',
    '/web-projects/pdf300/split': '나누기 분할 자르기 페이지 빼기',
    '/web-projects/pdf300/compress': '용량 줄이기 압축 메일 첨부',
    '/web-projects/pdf300/hq-compress': '용량 줄이기 압축 고화질',
    '/web-projects/pdf300/target-size': '용량 맞추기 몇 메가 mb',
    '/web-projects/pdf300/rotate': '회전 돌리기',
    '/web-projects/pdf300/sign': '서명 사인',
    '/web-projects/pdf300/pdf-to-image': 'jpg png 이미지 변환',
    '/web-projects/pdf300/image-to-pdf': 'jpg 사진 이미지 pdf로',
    '/web-projects/pdf300/ocr': '글자 인식 텍스트 추출',
    '/web-projects/pdf300/protect': '암호 비밀번호 잠금',
    '/web-projects/pdf300/unlock': '암호 비밀번호 해제 풀기',
    '/web-projects/pdf300/office-to-pdf': '워드 엑셀 한글 ppt pdf로',
    '/web-projects/stamp/': '도장 인감 직인 배경 제거 투명 png',
    '/web-projects/iphone-heic/': 'heic jpg 아이폰 사진 변환',
    '/applications/iphoneheic/': 'heic jpg 아이폰 사진 변환',
    '/web-projects/freecomfortlab/': 'mp3 음악 소리 오디오 변환',
    '/web-projects/freecomfortlab/video-to-mp3': '동영상 소리 추출 mp3',
    '/web-projects/freecomfortlab/kakao-video-to-mp3': '카톡 카카오톡 동영상 mp3',
    '/web-projects/freecomfortlab/kakao-video-to-video': '카톡 카카오톡 동영상',
    '/web-projects/freecomfortlab/audio-editor': '오디오 편집 자르기 mp3',
    '/web-projects/video-compress/': '동영상 용량 줄이기 압축',
    '/web-projects/videotools/': '동영상 편집 자르기',
    '/web-projects/nukki/': '누끼 배경 제거 지우기',
    '/web-projects/imgworks/': '이미지 사진 크기 변환',
    '/web-projects/qr/': 'qr 큐알 코드 만들기',
    '/web-projects/paycheck/': '월급 급여 실수령액 계산기',
    '/web-projects/charcount/': '글자수 세기 자소서',
    '/web-projects/inspection-score/': '점검 안전점검 정밀점검 점수 상태평가',
    '/tools/hwp/': '한글 hwp 뷰어 열기',
    '/notes/cad-hwp-vector/': '캐드 cad 한글 hwp 도면',
    '/notes/cad-hangul-question-marks/': '캐드 cad 한글 물음표 깨짐',
    '/web-projects/malhae/': '말해요 말하기 의사소통 보완대체',
    '/games/2048/': '숫자 퍼즐',
    '/web-projects/game-world/suika/': '수박 과일',
    '/web-projects/game-world/dozer/': '동전 코인 오락실',
    '/games/mines/': '지뢰찾기',
    '/games/': '게임 놀이',
    '/contact/': '연락 문의 상담 메일',
    '/work/': '작품 건축 포트폴리오',
    '/history/': '이야기 소개',
}

def clean(s):
    s = re.sub(r'<[^>]+>', ' ', s or '')
    return re.sub(r'\s+', ' ', html.unescape(s)).strip()

def local_file(path):
    p = ROOT / path.lstrip('/')
    for c in ([p / 'index.html'] if path.endswith('/') else [p, p.with_name(p.name + '.html')]):
        if c.is_file():
            return c
    return None

def main():
    sm = (ROOT / 'sitemap.xml').read_text(encoding='utf-8')
    paths = [unquote(urlparse(u).path) for u in re.findall(r'<loc>([^<]+)</loc>', sm)]
    for extra in ('/work/',):  # sitemap 에 없지만 찾을 만한 곳
        if extra not in paths:
            paths.append(extra)
    out, seen = [], set()
    for path in paths:
        if path in seen or path == '/' or SKIP_LANG.search(path) or (path + 'ko/') in paths:
            continue
        seen.add(path)
        f = local_file(path)
        if not f:
            print('  (파일 없음, 건너뜀)', path, file=sys.stderr)
            continue
        src = f.read_text(encoding='utf-8', errors='ignore')
        m = re.search(r'<title[^>]*>(.*?)</title>', src, re.S | re.I)
        title = clean(m.group(1)) if m else path
        title = re.split(r'\s+\|\s+', title)[0]
        title = re.sub(r'\s+[·—–-]\s+(?:LeDeuxions|Ledeuxions|르듀종|L\.D 게임 나라|FreeComfortLab|게임월드).*$', '', title).strip() or path
        m = re.search(r'<meta\s+name=["\']description["\']\s+content=["\']([^"\']*)', src, re.I)
        desc = clean(m.group(1)) if m else ''
        m = re.search(r'<h1[^>]*>(.*?)</h1>', src, re.S | re.I)
        h1 = clean(m.group(1)) if m else ''
        cat = category(path)
        kw = ' '.join(v for k, v in KEYWORDS.items() if path.startswith(k) and (k.endswith('/') or path == k))
        item = {'t': title, 'u': path, 'c': cat}
        if desc: item['d'] = desc[:120]
        extra = ' '.join(x for x in (h1 if h1 != title else '', kw) if x)
        if extra: item['k'] = extra
        out.append(item)
    dest = ROOT / 'assets' / 'search-index.json'
    dest.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print(f'{len(out)}개 페이지 → {dest.relative_to(ROOT)} ({dest.stat().st_size // 1024}KB)')

if __name__ == '__main__':
    main()
