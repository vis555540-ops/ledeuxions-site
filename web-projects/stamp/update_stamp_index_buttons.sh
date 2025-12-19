#!/usr/bin/env bash
# 오류 발생 시 중단하지 않고 체크하기 위해 set -e 잠시 보류

cd ~/문서/stamp-pages

echo "🔄 index.html 버튼 교체 작업 시작..."

# 백업 파일 생성 (만약을 대비)
cp index.html index.html.bak

# Perl 정규식 설명:
# 1. (-0777) 파일을 통째로 읽음
# 2. <a ... href="welcome.html" ... > 패턴을 찾음 (공백/줄바꿈 허용)
# 3. </a> 까지의 내용을 3개의 버튼으로 교체
perl -0777 -pi -e 's|<a\s+href="welcome\.html"\s+class="btn-primary">.*?</a>|<div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap; margin-top:4px;">
  <a href="welcome.html" class="btn-primary">도장 추출기 →</a>
  <a href="stamp-ai-seal.html" class="btn-primary">도장 추출 (AI) →</a>
  <a href="stamp-ai-sign.html" class="btn-primary">서명 추출 (AI) →</a>
</div>|gs' index.html

# 변경 사항이 있는지 확인
if git diff --quiet index.html; then
    echo "⚠️ 주의: index.html 내용이 변경되지 않았습니다."
    echo "원본 파일의 HTML 태그 형태가 예상과 다를 수 있습니다. index.html.bak 파일을 확인해 주세요."
    rm index.html.bak
    exit 1
else
    echo "✅ 버튼 교체 성공!"
    rm index.html.bak # 백업 삭제
    
    git add index.html
    git commit -m "ui: split main CTA into 3 stamp/sign tools"
    git push origin main
    echo "🚀 Git 푸시 완료"
fi
