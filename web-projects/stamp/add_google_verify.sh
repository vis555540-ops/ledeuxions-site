#!/usr/bin/env bash
set -e

echo "🔑 구글 서치 콘솔 인증 코드 삽입 중..."

# 1. 인증 코드를 담은 임시 파일 생성
# (따옴표 오류를 방지하기 위해 별도 파일로 만듭니다)
cat << 'HTML' > google_meta.tmp
<meta name="google-site-verification" content="nP7RR4X6tw05gK99oBXmq8AxVl6z2BGq6Z2hkRgrck4" />
HTML

# 2. index.html (한국어 메인)의 <head> 바로 아래에 삽입
# 이미 코드가 있는지 확인하고 없으면 넣습니다.
if ! grep -q "nP7RR4X6tw05gK99oBXmq8AxVl6z2BGq6Z2hkRgrck4" index.html; then
    perl -0777 -i -pe 'BEGIN{local $/; open(F,"<","google_meta.tmp"); $c=<F>; close F;} s|<head>|<head>\n    $c|' index.html
    echo "✅ index.html에 인증 코드 삽입 완료"
else
    echo "⚠️ index.html에 이미 인증 코드가 있습니다."
fi

# 3. index_en.html (영어 메인)에도 삽입 (확실하게 하기 위해)
if [ -f index_en.html ]; then
    if ! grep -q "nP7RR4X6tw05gK99oBXmq8AxVl6z2BGq6Z2hkRgrck4" index_en.html; then
        perl -0777 -i -pe 'BEGIN{local $/; open(F,"<","google_meta.tmp"); $c=<F>; close F;} s|<head>|<head>\n    $c|' index_en.html
        echo "✅ index_en.html에 인증 코드 삽입 완료"
    fi
fi

# 임시 파일 삭제
rm google_meta.tmp

# 4. 깃허브에 배포
git add .
git commit -m "chore: add google site verification meta tag"
git push origin main

echo "🚀 배포 완료! 약 1~2분 뒤에 구글 서치 콘솔에서 [확인] 버튼을 눌러보세요."
