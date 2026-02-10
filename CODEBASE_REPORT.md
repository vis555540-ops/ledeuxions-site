# LeDeuxions-Site 코드베이스 분석 보고서

> 작성일: 2026-02-10
> 분석 대상: ledeuxions-site 저장소 전체

---

## 1. 프로젝트 요약

| 항목 | 내용 |
|------|------|
| **프로젝트명** | LeDeuxions-Site |
| **유형** | 정적 웹사이트 + 브라우저 기반 유틸리티 도구 모음 |
| **기술** | 순수 HTML5 / CSS3 / JavaScript (프레임워크 없음) |
| **빌드 도구** | 없음 (정적 파일 그대로 서빙) |
| **패키지 매니저** | 없음 (package.json 없음) |
| **테스트 프레임워크** | 없음 (수동 브라우저 테스트) |
| **린터/포매터** | 없음 |
| **CI/CD** | 없음 |
| **저작권** | © 2005–2026 LeDeuxions |

---

## 2. 저장소 통계

| 지표 | 수치 |
|------|------|
| 전체 크기 (.git 제외) | **1.3 MB** |
| HTML 파일 수 | **72개** |
| CSS 파일 수 | **7개** |
| JavaScript 파일 수 | **9개** |
| 이미지 파일 수 | **1개** |
| 전체 커밋 수 | **62개** |
| 지원 언어 | **2개** (한국어, 영어) |
| NPM 의존성 | **0개** |

---

## 3. 기술 스택 상세

### 프론트엔드
- **HTML5**: 시맨틱 태그, Open Graph 메타 태그, 모바일 반응형
- **CSS3**: 커스텀 속성(변수), Grid, Flexbox, 미디어 쿼리
- **JavaScript**: 순수 바닐라 JS, Canvas API, FileReader API, Fetch API, Drag & Drop API

### 서버리스/백엔드
- **Cloudflare Workers**: `_worker.js` 파일 3개 (stamp, freecomfortlab)
  - `/api/*` 요청을 로컬 백엔드(`192.168.0.12:5000`)로 프록시
- **Flask/Python API**: 도장 추출 백엔드 (선택사항, 없어도 기본 기능 동작)

### 외부 서비스
| 서비스 | 용도 |
|--------|------|
| Google AdSense | 광고 수익화 (ID: `ca-pub-2824624880449066`) |
| Google Analytics | 방문자 분석 |
| Google Fonts | 웹 폰트 (Cinzel, Oswald, Noto Sans KR) |
| Google Calendar | 연락처 페이지 일정 임베드 |
| Google Search Console | SEO 사이트 인증 |
| 네이버 웹마스터 도구 | 네이버 검색 사이트 인증 |
| Cloudflare Pages | 호스팅 및 Workers 배포 |

### PWA (Progressive Web App)
- HEIC 변환기에 `manifest.json` 적용
- 앱 이름: "HEIC Image Converter"
- 아이콘: 180x180, 192x192, 512x512 PNG
- 표시 모드: standalone

---

## 4. 디렉토리 구조 상세

```
ledeuxions-site/
│
├── [루트 페이지]
│   ├── index.html                      메인 랜딩 페이지 ("LeDeuxions's World")
│   ├── ad-transition.html              카운트다운 광고 전환 페이지
│   ├── google57984ecd22eb2d52.html     구글 사이트 인증
│   ├── ads.txt                         AdSense 게시자 인증
│   ├── robots.txt                      검색 엔진 크롤러 규칙
│   ├── sitemap.xml                     사이트맵
│   └── review_report.md               내부 QA/감사 체크리스트
│
├── [정보 페이지]
│   ├── contact/index.html              연락처 (구글 캘린더 임베드)
│   ├── privacy/index.html              개인정보처리방침
│   ├── terms/index.html                이용약관
│   ├── history/index.html              작업 이력/포트폴리오
│   └── work/index.html                 프로젝트 포트폴리오
│
├── web-projects/                       ★ 주요 유틸리티 앱 모음
│   ├── index.html                      프로젝트 목록/카탈로그 페이지
│   │
│   ├── pdf300/                         [PDF 편집 도구]
│   │   └── index.html
│   │
│   ├── stamp/                          [도장 PNG 추출 도구 v1.1.0]
│   │   ├── index.html                  랜딩 페이지
│   │   ├── welcome.html                메인 UI (도장 PNG 추출)
│   │   ├── stamp.html                  대체 도장 도구
│   │   ├── work.html                   서버 API 실험 (백엔드 필요)
│   │   ├── done.html                   결과 표시 페이지
│   │   ├── board.html                  게시판
│   │   ├── guide.html                  사용 가이드
│   │   ├── seal-info.html              도장 정보
│   │   ├── privacy.html                개인정보처리방침
│   │   ├── terms.html                  이용약관
│   │   ├── css/style.css               반디집 스타일 디자인 시스템
│   │   ├── js/stamp.js                 ★ 도장 추출 핵심 로직
│   │   ├── js/pdf-stamp.js            ★ PDF 도장 삽입 로직
│   │   ├── _worker.js                  Cloudflare Worker
│   │   ├── README.md                   프로젝트 문서
│   │   └── stamp-pages/               ⚠️ stamp/ 복제본 (동기화 필요)
│   │       ├── [위와 동일한 파일 구조]
│   │       └── README.md
│   │
│   ├── freecomfortlab/                 [미디어 변환 도구 모음]
│   │   ├── index.html                  랜딩 페이지
│   │   ├── audio-to-mp3.html          오디오→MP3 변환
│   │   ├── video-to-mp3.html          비디오→MP3 변환
│   │   ├── convert.html                범용 변환
│   │   ├── stamp-extract.html          도장 추출
│   │   ├── kakao-video-to-mp3.html    카카오 비디오→MP3
│   │   ├── kakao-video-to-video.html  카카오 비디오 변환
│   │   ├── studio-projects.html        스튜디오 프로젝트
│   │   ├── done.html                   결과 표시
│   │   ├── contact.html                연락처
│   │   ├── privacy.html                개인정보처리방침
│   │   ├── beta.html                   베타 기능
│   │   ├── theme-overhaul.css          테마 CSS
│   │   ├── _worker.js                  Cloudflare Worker
│   │   ├── pages-worker.js            Pages Worker
│   │   └── en/                         영어 버전
│   │       ├── index.html
│   │       ├── audio-to-mp3.html
│   │       ├── video-to-mp3.html
│   │       └── privacy.html
│   │
│   └── iphone-heic/                    [HEIC→JPG 변환기 (PWA)]
│       ├── index.html                  언어 감지 리다이렉터
│       ├── manifest.json               PWA 설정
│       ├── ko/index.html               한국어 버전
│       ├── en/index.html               영어 버전
│       └── assets/
│           ├── style.css               iOS 네이티브 스타일
│           ├── app.js                  변환 로직 + API 호출
│           └── icons/                  PWA 아이콘 (32~512px)
│
└── applications/                       설치형 앱 버전
    └── iphoneheic/                     ⚠️ iphone-heic 복제본 (동기화 필요)
        ├── index.html
        ├── manifest.json
        ├── ko/index.html
        ├── en/index.html
        ├── assets/ (style.css, app.js, icons/)
        └── README.md
```

---

## 5. 주요 앱별 분석

### 5.1 도장 PNG 추출기 (`web-projects/stamp/`)

| 항목 | 내용 |
|------|------|
| 버전 | v1.1.0 |
| 기능 | 이미지에서 도장 배경을 제거하고 투명 PNG로 추출 |
| 핵심 파일 | `js/stamp.js`, `js/pdf-stamp.js` |
| 디자인 | 반디집(Bandizip) 스타일 UI |
| 백엔드 | Cloudflare Worker → Flask API (선택사항) |

**배경 제거 알고리즘:**
1. 이미지 4개 모서리에서 배경색 샘플링
2. 유클리드 거리 계산으로 배경색과 유사한 픽셀 식별
3. 알파 블렌딩으로 부드러운 가장자리 처리
4. 밝기 필터링 (임계값 > 180)으로 흰 배경 판별

### 5.2 미디어 변환 도구 (`web-projects/freecomfortlab/`)

| 항목 | 내용 |
|------|------|
| 기능 | 오디오→MP3, 비디오→MP3, 카카오 비디오 변환 등 |
| 이중 언어 | `en/` 폴더에 영어 버전 |
| 서버리스 | Cloudflare Worker + Pages Worker |

### 5.3 HEIC 변환기 (`web-projects/iphone-heic/`)

| 항목 | 내용 |
|------|------|
| 기능 | iPhone HEIC 이미지를 JPG로 변환 |
| PWA | manifest.json, 아이콘 세트 포함 |
| 이중 언어 | `ko/`, `en/` 폴더 |
| 처리 방식 | 클라이언트 측 우선, API 폴백 |

### 5.4 PDF 편집기 (`web-projects/pdf300/`)

| 항목 | 내용 |
|------|------|
| 기능 | PDF 문서 편집/조작 |
| 파일 | 단일 `index.html` |

---

## 6. 코드 패턴 및 규칙

### CSS 테마 변수 (공통 패턴)
```css
:root {
    --primary: #0078d7;       /* 메인 파란색 */
    --secondary: #2d8659;     /* 보조 녹색 */
    --accent: #ff8c00;        /* 강조 주황색 */
    --bg-main: #f5f5f5;       /* 배경 밝은 회색 */
    --shadow-sm / --shadow-md / --shadow-lg  /* 그림자 3단계 */
}
```

### JavaScript 언어 감지 (공통 패턴)
```javascript
const userLang = navigator.language || navigator.userLanguage;
if (!userLang.includes('ko')) {
    window.location.href = 'en/index.html';
}
```

### 페이지 간 데이터 전달
```javascript
// 저장
sessionStorage.setItem('key', JSON.stringify(data));
// 읽기
const data = JSON.parse(sessionStorage.getItem('key'));
```

### 파일 업로드 (드래그 앤 드롭)
- 모든 변환 도구에서 드래그 앤 드롭 파일 업로드 지원
- `FileReader` API로 클라이언트 측 파일 읽기

---

## 7. ⚠️ 중복 코드 현황

아래 디렉토리 쌍은 **동일한 코드**를 포함하고 있어 수정 시 반드시 양쪽을 동기화해야 합니다:

| 원본 | 복제본 | 파일 수 |
|------|--------|---------|
| `web-projects/stamp/` | `web-projects/stamp/stamp-pages/` | 20개 HTML + CSS + JS |
| `web-projects/iphone-heic/` | `applications/iphoneheic/` | HTML + CSS + JS + 아이콘 |

**권장사항:** 향후 코드 중복을 줄이기 위해 심볼릭 링크 또는 빌드 시 복사 방식을 검토할 것.

---

## 8. 외부 서비스 의존성 정리

```
Google AdSense     ← 광고 수익화
  └─ ca-pub-2824624880449066
Google Analytics   ← 방문자 추적
Google Fonts       ← Cinzel, Oswald, Noto Sans KR
Google Calendar    ← 연락처 페이지 일정 표시
Google 사이트 인증  ← google57984ecd22eb2d52.html
네이버 사이트 인증   ← 메타 태그
Cloudflare Workers ← API 라우팅 (3개 파일)
Cloudflare Pages   ← 정적 호스팅
Flask API          ← 192.168.0.12:5000 (도장 추출, 선택사항)
```

---

## 9. SEO 설정 현황

| 파일 | 상태 | 설명 |
|------|------|------|
| `robots.txt` | 있음 | 모든 크롤러 허용 |
| `sitemap.xml` | 있음 | 사이트맵 제공 |
| `ads.txt` | 있음 | AdSense 게시자 인증 |
| Open Graph 태그 | 있음 | 주요 페이지에 적용 |
| 구글 사이트 인증 | 있음 | HTML 파일 방식 |
| 네이버 사이트 인증 | 있음 | 메타 태그 방식 |

---

## 10. Git 커밋 이력 (최근 20개)

```
b9c545d  Add CLAUDE.md with comprehensive codebase guide for AI assistants
88ef0fe  Add HEIC converter page
4c6205f  fix: replace iphone-heic folder links with html file
f92d79c  feat: Update footer year and optimize FreeComfortLab ads
feb3e5b  chore: remove internal adsense scan log
9b9fa1f  chore(adsense): remove all ad placeholders and keep auto ads only
c0c35b5  Fix ads.txt formatting issue
8b64f5b  Remove leading hyphen from ads.txt entry
81e98d9  Update Google AdSense publisher ID in ads.txt
2827127  Update Google publisher ID in ads.txt
d334ca2  Add ads.txt for Google AdSense
d564b5c  Update Google publisher ID in ads.txt
12cf476  Remove duplicate script tag for Google Ads
862db0e  Add async Google Ads script to index.html
f2b7242  Add Google AdSense script to index.html
c79a84d  Change AdSense client ID in index.html
1277977  Revise history page layout and text
e5052a5  Revamp footer layout and update links
0f2e242  Revamp footer with new styles and links
8e8c7dd  Revamp contact page layout and styles
```

**총 커밋 수: 62개**

---

## 11. 로컬 개발 방법

### 사전 요구사항
- 웹 브라우저 (Chrome 권장)
- 로컬 HTTP 서버 (아래 중 택 1)

### 서버 실행
```bash
# 방법 1: Python
cd ledeuxions-site
python -m http.server 8000
# → http://localhost:8000 에서 확인

# 방법 2: Node.js
npx http-server . -p 8000

# 방법 3: VS Code
# Live Server 확장 설치 후 index.html에서 "Go Live" 클릭
```

### 도장 백엔드 API (선택사항)
```bash
# Flask 서버가 192.168.0.12:5000에서 실행되어야 함
# Cloudflare Worker가 /api/* 요청을 이 주소로 프록시
# 로컬에서는 _worker.js의 IP 주소를 localhost로 변경 필요
```

---

## 12. 알려진 이슈 및 개선 사항

| 구분 | 내용 | 심각도 |
|------|------|--------|
| 파일명 오류 | `web-projects/iphone-heic/index .html` (파일명에 공백 포함) | 중간 |
| 코드 중복 | stamp/ ↔ stamp-pages/ 동일 코드 유지보수 부담 | 낮음 |
| 코드 중복 | iphone-heic/ ↔ applications/iphoneheic/ 동일 코드 | 낮음 |
| 테스트 없음 | 자동화된 테스트 프레임워크 미설정 | 낮음 |
| 린터 없음 | 코드 품질 자동 검사 미설정 | 낮음 |
| CI/CD 없음 | 배포 자동화 미설정 | 낮음 |

---

## 13. 요약

이 프로젝트는 **빌드 도구 없이 순수 HTML/CSS/JS로 작성된 정적 웹사이트**입니다. 모든 유틸리티 도구는 **클라이언트 측에서 처리**되어 사용자 프라이버시를 보호합니다. 한국어/영어 이중 언어를 지원하며, Google AdSense로 수익화하고, Cloudflare Pages/Workers로 호스팅합니다.

주요 강점:
- 의존성 제로로 유지보수가 단순함
- 클라이언트 측 처리로 프라이버시 보호
- PWA 지원으로 모바일 앱처럼 설치 가능 (HEIC 변환기)

주요 개선 포인트:
- 중복 코드 통합 (stamp-pages, applications/iphoneheic)
- 파일명 공백 오류 수정 (`index .html`)
- 기본적인 린팅/테스트 도입 검토
