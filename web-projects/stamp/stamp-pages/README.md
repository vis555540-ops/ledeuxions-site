# 도장 PNG 추출기

도장 이미지를 업로드하면 배경을 자동으로 제거하고 투명한 PNG 파일로 변환해주는 웹 애플리케이션입니다.

## 프로젝트 소개

흰 종이에 찍은 도장을 스마트폰으로 촬영한 후, 이 도구를 사용하면 배경이 투명한 PNG 파일로 자동 변환됩니다. 변환된 파일은 문서, 계약서, PDF 등에 바로 삽입하여 사용할 수 있습니다.

**⚡ 100% 클라이언트 측 처리**: 서버 없이 브라우저에서 모든 처리가 완료됩니다. 이미지가 서버로 전송되지 않아 개인정보가 안전합니다.

## 주요 기능

- **자동 배경 제거**: 흰색 배경을 자동으로 감지하고 제거
- **투명 PNG 변환**: 도장 부분만 남은 투명 배경 PNG 파일 생성
- **클라이언트 측 처리**: 서버 업로드 없이 브라우저에서 직접 처리
- **다운로드 기능**: 처리된 PNG 파일을 즉시 다운로드
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 모두 지원

## 파일 구조

```
stamp-pages/
├── index.html          # 메인 랜딩 페이지
├── welcome.html        # ⭐ 메인 작업 페이지 (클라이언트 전용)
├── stamp.html          # 대체 PNG 추출 도구 (클라이언트 전용)
├── work.html           # 🔬 서버 연동 실험 페이지 (백엔드 필요)
├── done.html           # work.html 결과 페이지
├── css/
│   └── style.css       # 반디집 스타일 공통 CSS
├── js/
│   ├── stamp.js        # 클라이언트 측 도장 추출 로직
│   └── pdf-stamp.js    # PDF 도장 삽입 로직
└── _worker.js          # Cloudflare Workers 스크립트
```

**📌 핵심**: `welcome.html`과 `stamp.html`은 서버 없이 작동하며, `work.html`만 서버 API가 필요합니다.

## 사용 방법

### 1. 도장 촬영
- A4 흰 종이에 도장을 크게 찍습니다
- 그림자나 반사가 없도록 정면에서 촬영합니다
- JPG 또는 PNG 형식으로 저장합니다

### 2. 이미지 업로드
- `welcome.html` 또는 `stamp.html` 페이지를 엽니다
- "도장 사진 업로드" 영역을 클릭하거나 파일을 드래그합니다
- 촬영한 도장 이미지를 선택합니다

### 3. 배경 제거 및 다운로드
- "도장 PNG 만들기" 버튼을 클릭합니다
- 자동으로 배경이 제거된 미리보기가 표시됩니다
- "PNG 다운로드" 버튼을 클릭하여 파일을 저장합니다

## 기술 스택

- **HTML5**: 웹 페이지 구조
- **CSS3**: 반응형 디자인 및 스타일링
- **JavaScript (Vanilla)**: 이미지 처리 로직
- **Canvas API**: 픽셀 단위 이미지 조작
- **FileReader API**: 클라이언트 측 파일 읽기

## 배경 제거 알고리즘

이 프로젝트는 다음과 같은 알고리즘을 사용하여 배경을 제거합니다:

1. **배경색 샘플링**: 이미지 네 모서리의 색상을 평균내어 배경색 추정
2. **유클리드 거리 계산**: 각 픽셀과 배경색 간의 색상 거리 측정
3. **밝기 필터링**: 밝은 픽셀(흰색 배경)을 우선적으로 제거
4. **알파 블렌딩**: 경계 부분을 부드럽게 처리하여 자연스러운 결과 생성

```javascript
// 주요 알고리즘 (간략화)
const distance = Math.sqrt(diffR * diffR + diffG * diffG + diffB * diffB);
const brightness = (r + g + b) / 3;

if (distance < threshold && brightness > 180) {
  // 배경으로 판단 - 투명 처리
  data[i + 3] = 0;
} else if (distance < threshold * 1.5 && brightness > 180) {
  // 경계 부분 - 부드럽게 처리
  const alpha = Math.max(0, 255 * (1 - (threshold * 1.5 - distance) / (threshold * 0.5)));
  data[i + 3] = Math.min(data[i + 3], alpha);
}
```

## 페이지별 설명

### 🎯 실제 사용 페이지 (서버 불필요)

#### index.html
- 프로젝트 소개 및 랜딩 페이지
- 사용 방법 안내 및 FAQ

#### welcome.html ⭐ **메인 작업 페이지**
- **100% 클라이언트 측 도장 추출 기능**
- 브라우저에서 직접 배경 제거
- 실시간 미리보기 및 PNG 다운로드
- **서버 연결 불필요** - 즉시 사용 가능

#### stamp.html
- 대체 PNG 추출 도구
- 간단한 UI로 빠른 작업
- **서버 연결 불필요** - 클라이언트 전용

### 🔬 실험용 페이지 (서버 필요)

#### work.html
- **서버 API 연동 실험용 페이지**
- `/api/stamp-extract` 엔드포인트 호출
- 우분투 백엔드가 구축되어 있을 때만 작동
- 현재는 실험/개발 목적으로만 사용

#### done.html
- work.html의 결과 표시 페이지
- sessionStorage를 통한 데이터 전달
- work.html과 함께 사용

---

**💡 일반 사용자는 `welcome.html` 또는 `stamp.html`만 사용하면 됩니다!**

## 🚀 빠른 시작 (Git & 배포)

### 1️⃣ GitHub에 코드 올리기

```bash
# 변경사항 확인
git status

# 모든 파일 스테이징
git add .

# 커밋 메시지와 함께 커밋
git commit -m "Update stamp pages"

# GitHub에 푸시
git push origin main
```

### 2️⃣ GitHub Pages로 즉시 배포

푸시 후 아래 단계만 따라하면 **바로 배포 완료!**

1. **GitHub 저장소**로 이동
2. **Settings** 탭 클릭
3. 왼쪽 메뉴에서 **Pages** 클릭
4. **Source**를 `Deploy from a branch` 선택
5. **Branch**를 `main` / `/ (root)` 선택
6. **Save** 버튼 클릭

⏱️ **1~2분 후** `https://<username>.github.io/<repository-name>/` 에서 접속 가능!

### 📍 배포 URL 확인하기

```
https://<GitHub-아이디>.github.io/<저장소-이름>/

예시: https://vis555540-ops.github.io/stamp-pages/
```

### 🔄 업데이트 배포하기

코드 수정 후 다시 배포하려면:

```bash
git add .
git commit -m "Update features"
git push origin main
```

푸시하면 **자동으로 재배포**됩니다! (1~2분 소요)

---

## 💻 로컬에서 테스트

### Python으로 실행

```bash
# 저장소 클론
git clone https://github.com/<username>/<repository>.git
cd stamp-pages

# Python 간단 서버 실행
python -m http.server 8000

# 브라우저에서 접속
http://localhost:8000
```

### Node.js로 실행

```bash
# 간단한 정적 서버 설치
npm install -g http-server

# 실행
http-server -p 8000

# 브라우저에서 접속
http://localhost:8000
```

### VS Code Live Server 사용

1. VS Code에서 프로젝트 열기
2. Live Server 확장 설치
3. `index.html` 우클릭 → "Open with Live Server"

## 브라우저 호환성

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

모든 최신 브라우저에서 Canvas API와 FileReader API를 지원합니다.

## 제한사항

- 현재는 **빨간색 도장**에 최적화되어 있습니다
- 배경이 복잡하거나 도장이 흐릿한 경우 결과가 좋지 않을 수 있습니다
- 매우 큰 이미지(10MB 이상)는 처리 시간이 오래 걸릴 수 있습니다
- 클라이언트 측 처리로 인해 브라우저 성능에 영향을 받습니다

## 개선 예정 사항

- [ ] 다양한 도장 색상 지원 (파랑, 검정 등)
- [ ] AI 기반 배경 제거 (ML 모델 통합)
- [ ] 일괄 처리 기능
- [ ] 도장 크기 자동 조정
- [ ] PDF에 직접 도장 삽입 기능 완성

## 기여 방법

1. 이 저장소를 Fork 합니다
2. 새로운 브랜치를 생성합니다 (`git checkout -b feature/improvement`)
3. 변경사항을 커밋합니다 (`git commit -am 'Add some feature'`)
4. 브랜치에 푸시합니다 (`git push origin feature/improvement`)
5. Pull Request를 생성합니다

## 라이선스

이 프로젝트는 실험용/교육용으로 제작되었습니다. 상업적 사용 시 별도 협의가 필요할 수 있습니다.

## 문의

- 프로젝트: FreeComfortLab 실험 프로젝트
- 웹사이트: https://freecomfortlab.com

## 변경 이력

### v1.1.0 (2025-01-XX)
- 배경 제거 알고리즘 개선 (네 모서리 샘플링)
- welcome.html 클라이언트 측 처리 구현
- 존재하지 않는 페이지 링크 제거
- 광고 중복 슬롯 문제 수정

### v1.0.0 (2024-11-XX)
- 초기 버전 릴리스
- 기본 도장 추출 기능
- 랜딩 페이지 및 UI 구현
