# HEIC → JPG Converter

아이폰 사진(HEIC)을 JPG로 변환하는 iOS 스타일 웹 앱

## 구조

```
iphoneheic/
├── index.html          # 언어 감지 및 리디렉트
├── ko/
│   └── index.html      # 한국어 페이지
├── en/
│   └── index.html      # 영어 페이지
├── assets/
│   ├── style.css       # iOS 스타일 CSS
│   ├── app.js          # 변환 로직
│   └── icons/          # PWA 아이콘
└── manifest.json       # PWA 설정
```

## 특징

- **iOS 네이티브 느낌**: 아이폰 기본 앱처럼 자연스러운 디자인
- **간단한 UX**: 사진 선택 → 변환 → 다운로드
- **다중 파일 지원**: 여러 HEIC 파일 동시 변환
- **자동 다운로드**: 변환 후 즉시 다운로드 (단일: JPG, 다중: ZIP)
- **PWA 지원**: 홈 화면에 추가 가능

## API 연동

Flask 백엔드 API 엔드포인트:
- **로컬 개발**: `http://localhost:5001/convert`
- **배포**: `assets/app.js`에서 `API_URL` 수정 필요

```javascript
// app.js 1-3번째 줄
const API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:5001/convert'
    : '/api/convert'; // 실제 API URL로 변경
```

## 아이콘 생성

`assets/icons/` 디렉토리에 다음 크기의 PNG 아이콘 필요:
- icon-32.png (32x32)
- icon-72.png (72x72)
- icon-96.png (96x96)
- icon-128.png (128x128)
- icon-144.png (144x144)
- icon-152.png (152x152)
- icon-180.png (180x180) - iOS 기본
- icon-192.png (192x192)
- icon-512.png (512x512)

간단한 카메라 이모지(📸) 아이콘 권장

## 로컬 테스트

1. Flask 서버 실행:
```bash
cd heic-converter
./start.sh
```

2. 정적 파일 서버 실행:
```bash
cd iphoneheic
python3 -m http.server 8000
```

3. 브라우저에서 열기:
```
http://localhost:8000
```

## GitHub Pages 배포

1. `freecomfort/lab-pages` 저장소의 `/iphoneheic` 경로에 업로드
2. `assets/app.js`에서 API_URL을 실제 서버 주소로 변경
3. GitHub Pages 설정 활성화

## CORS 설정 (필수)

Flask 서버에 CORS 설정 필요:

```python
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=['https://freecomfort.github.io'])
```

또는 nginx/프록시로 `/api` 경로를 Flask 서버로 전달

## 브라우저 지원

- iOS Safari 14+
- Chrome/Edge (모바일/데스크톱)
- 기타 모던 브라우저

## 라이선스

MIT
