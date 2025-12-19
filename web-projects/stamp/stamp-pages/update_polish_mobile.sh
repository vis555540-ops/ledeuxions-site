#!/usr/bin/env bash
set -e

echo "📱 모바일 최적화 및 BETA 태그 제거 작업 시작..."

# 1. 모든 HTML 파일에서 'BETA' 또는 'Beta' 단어 삭제
# (버튼이나 뱃지에 붙어있는 텍스트 제거)
# perl을 사용하여 파일 내용을 직접 수정합니다.
find . -name "*.html" -print0 | xargs -0 perl -pi -e 's/BETA//ig'
find . -name "*.html" -print0 | xargs -0 perl -pi -e 's/계정 없이 무료 사용 · 서버 미저장/무료 사용 · 개인정보 보호 (서버 저장 X)/g'

# 2. 모바일 최적화 CSS 추가 (style.css 업데이트)
# 기존 style.css 끝부분에 모바일 전용 스타일(@media)을 추가합니다.

cat << 'CSS' >> style.css

/* === 📱 모바일 최적화 추가 (Mobile Responsive) === */
@media (max-width: 768px) {
    /* 1. 헤더 영역 줄이기 */
    .hero, .hero-section {
        padding: 40px 20px 80px 20px !important;
        text-align: center;
    }
    .hero h1, .hero-title {
        font-size: 1.8rem !important; /* 제목 크기 축소 */
        word-break: keep-all; /* 단어 단위 줄바꿈 */
    }
    
    /* 2. 카드 박스 여백 조정 */
    .tool-card, .container {
        padding: 20px !important;
        margin-top: -40px !important; /* 헤더와 겹치는 부분 조정 */
        width: 90% !important;
        margin-left: auto;
        margin-right: auto;
    }

    /* 3. 버튼 큼직하게 (터치하기 좋게) */
    .btn-primary, .btn-action, .btn-save, .upload-btn-wrapper .btn-upload {
        width: 100% !important; /* 가로 꽉 차게 */
        display: block;
        margin-bottom: 10px;
        padding: 15px 0 !important;
        font-size: 1.1rem !important;
    }

    /* 4. Flex 박스 줄바꿈 (버튼들이 세로로 쌓이게) */
    div[style*="display:flex"] {
        flex-direction: column;
        gap: 10px !important;
    }
    
    /* 5. 캔버스 화면 맞춤 */
    canvas {
        max-width: 100% !important;
        height: auto !important;
    }
}
CSS

# 3. 각 HTML 파일 헤드에 뷰포트(Viewport) 메타 태그 재확인 및 style.css 연결 강화
# 혹시 누락된 파일이 있을까봐 강제로 확인합니다.
perl -pi -e 's|</head>|<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">\n<link rel="stylesheet" href="style.css">\n</head>|g' stamp-ai-sign.html

git add .
git commit -m "polish: remove beta tags and optimize for mobile layout"
git push origin main

echo "✅ BETA 딱지 제거 & 모바일 최적화 완료!"
echo "📲 스마트폰이나 브라우저 창을 좁혀서 확인해보세요."
