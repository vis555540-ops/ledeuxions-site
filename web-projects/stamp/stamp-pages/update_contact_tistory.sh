#!/usr/bin/env bash
set -e

echo "🔗 문의하기 링크를 티스토리 방명록으로 연결 중..."

# 1. 한국어 메인 및 서명 페이지 수정
# mailto: 링크를 찾아서 티스토리 방명록 주소로 교체하고, 새 창(_blank)으로 열리게 설정
# (기존에 contact@example.com 등으로 되어 있던 부분을 통째로 바꿉니다)

find . -name "*.html" -print0 | xargs -0 perl -pi -e 's|href="mailto:[^"]*"|href="https://playnstock.tistory.com/guestbook" target="_blank"|g'

# 2. 혹시 "문의하기" 텍스트 근처의 링크가 아직 수정 안 된 게 있는지 확인 사살
# (HTML 구조상 명시적으로 티스토리 주소를 넣습니다)
perl -pi -e 's|contact\\@example.com|https://playnstock.tistory.com/guestbook|g' privacy.html

git add .
git commit -m "feat: link contact button to tistory guestbook"
git push origin main

echo "✅ 연결 완료! 이제 '문의하기'를 누르면 블로그 방명록이 뜹니다."
