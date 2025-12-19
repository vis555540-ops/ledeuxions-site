#!/usr/bin/env bash
set -e

echo "📈 애드센스 승인 확률 높이기 작업 시작..."

# --------------------------------------------
# 1. 이용약관 (Terms of Service) 페이지 생성
# --------------------------------------------
echo "📜 이용약관 페이지 생성 중..."

# 한국어 약관
cat << 'HTML' > terms.html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>이용약관 - 도장/서명 추출기</title>
    <style>body{font-family:sans-serif;line-height:1.6;max-width:800px;margin:0 auto;padding:20px;color:#333}h1{border-bottom:2px solid #eee;padding-bottom:10px}</style>
</head>
<body>
    <h1>이용약관 (Terms of Service)</h1>
    <p>본 약관은 도장 및 서명 추출기(이하 "서비스")의 이용 조건을 규정합니다.</p>
    <h3>1. 서비스의 제공</h3>
    <p>본 서비스는 사용자가 업로드한 이미지를 브라우저 내에서 처리하여 배경을 제거하는 기능을 무료로 제공합니다. 별도의 회원가입은 필요하지 않습니다.</p>
    <h3>2. 책임의 한계</h3>
    <p>본 서비스는 기술적 오류가 없음을 보장하지 않으며, 결과물 사용으로 인해 발생하는 어떠한 손해에 대해서도 책임을 지지 않습니다. 생성된 도장/서명 이미지의 법적 효력에 대한 책임은 사용자 본인에게 있습니다.</p>
    <h3>3. 저작권</h3>
    <p>사용자가 생성한 이미지의 저작권은 사용자에게 있습니다. 서비스 제공자는 사용자의 이미지를 수집하거나 저장하지 않습니다.</p>
    <div style="margin-top:40px;text-align:center"><a href="index.html">메인으로 돌아가기</a></div>
</body>
</html>
HTML

# 영어 약관
cat << 'HTML' > terms_en.html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Terms of Service</title>
    <style>body{font-family:sans-serif;line-height:1.6;max-width:800px;margin:0 auto;padding:20px;color:#333}h1{border-bottom:2px solid #eee;padding-bottom:10px}</style>
</head>
<body>
    <h1>Terms of Service</h1>
    <p>By using Signature Extractor (the "Service"), you agree to these terms.</p>
    <h3>1. Service Usage</h3>
    <p>We provide free image processing tools. No account is required. The Service operates client-side only.</p>
    <h3>2. Disclaimer</h3>
    <p>The Service is provided "as is". We are not liable for any damages arising from the use of the Service. You are solely responsible for the legal validity of any signatures created.</p>
    <h3>3. Copyright</h3>
    <p>You retain full ownership of your images. We do not store or claim rights to your content.</p>
    <div style="margin-top:40px;text-align:center"><a href="index_en.html">Back to Home</a></div>
</body>
</html>
HTML

# --------------------------------------------
# 2. 푸터에 이용약관 링크 추가
# --------------------------------------------
echo "🔗 푸터에 이용약관 링크 연결 중..."
# 한국어 페이지들
find . -name "*.html" ! -name "*_en.html" -print0 | xargs -0 perl -pi -e 's|개인정보처리방침</a>|<a href="terms.html" style="color:#666;text-decoration:none;margin:0 10px;">이용약관</a> | <a href="privacy.html" style="color:#666;text-decoration:none;margin:0 10px;">개인정보처리방침</a>|g'

# 영어 페이지들
find . -name "*_en.html" -print0 | xargs -0 perl -pi -e 's|Privacy Policy</a>|<a href="terms_en.html" style="color:#666;text-decoration:none;margin:0 10px;">Terms of Service</a> | <a href="privacy_en.html" style="color:#666;text-decoration:none;margin:0 10px;">Privacy Policy</a>|g'


# --------------------------------------------
# 3. FAQ 섹션 추가 (텍스트 보강의 핵심!)
# --------------------------------------------
echo "💬 FAQ(자주 묻는 질문) 섹션 추가 중..."

# 한국어 FAQ 내용 생성
cat << 'HTML' > faq_ko.tmp
<section style="max-width:800px;margin:60px auto;padding:20px;background:#fff;border-top:1px solid #eee">
    <h2 style="text-align:center;margin-bottom:30px">자주 묻는 질문 (FAQ)</h2>
    <details open style="margin-bottom:15px;cursor:pointer"><summary style="font-weight:bold;font-size:1.1rem">Q. 정말 무료인가요?</summary><p style="margin-top:10px;color:#555">네, 모든 기능은 100% 무료이며 횟수 제한 없이 사용할 수 있습니다.</p></details>
    <details style="margin-bottom:15px;cursor:pointer"><summary style="font-weight:bold;font-size:1.1rem">Q. 제 도장 사진이 서버에 저장되나요?</summary><p style="margin-top:10px;color:#555">아니요, 절대 저장되지 않습니다. 모든 이미지 처리는 사용자의 컴퓨터(브라우저) 내부에서만 이루어지며, 서버로 전송되지 않는 안전한 방식입니다.</p></details>
    <details style="margin-bottom:15px;cursor:pointer"><summary style="font-weight:bold;font-size:1.1rem">Q. 배경이 투명하게 안 돼요.</summary><p style="margin-top:10px;color:#555">흰 종이에 그림자 없이 찍은 사진이 가장 잘 됩니다. '서명 추출(AI)' 메뉴에서 [감도 조절] 슬라이더를 움직여보세요.</p></details>
</section>
HTML

# 영어 FAQ 내용 생성
cat << 'HTML' > faq_en.tmp
<section style="max-width:800px;margin:60px auto;padding:20px;background:#fff;border-top:1px solid #eee">
    <h2 style="text-align:center;margin-bottom:30px">Frequently Asked Questions</h2>
    <details open style="margin-bottom:15px;cursor:pointer"><summary style="font-weight:bold;font-size:1.1rem">Q. Is this tool really free?</summary><p style="margin-top:10px;color:#555">Yes, it is 100% free with no usage limits and no signup required.</p></details>
    <details style="margin-bottom:15px;cursor:pointer"><summary style="font-weight:bold;font-size:1.1rem">Q. Is my signature safe?</summary><p style="margin-top:10px;color:#555">Absolutely. We use client-side processing technology. Your images are processed in your browser and are NEVER uploaded to our servers.</p></details>
    <details style="margin-bottom:15px;cursor:pointer"><summary style="font-weight:bold;font-size:1.1rem">Q. How do I get the best results?</summary><p style="margin-top:10px;color:#555">Use white paper and a dark pen. Avoid shadows. Use the 'Threshold Slider' in our AI tool to fine-tune the transparency.</p></details>
</section>
HTML

# index.html (한국어)에 FAQ 주입 (푸터 바로 위에)
perl -0777 -i -pe 'BEGIN{local $/; open(F,"<","faq_ko.tmp"); $c=<F>; close F;} s|<footer|$c\n<footer|' index.html

# index_en.html (영어)에 FAQ 주입
perl -0777 -i -pe 'BEGIN{local $/; open(F,"<","faq_en.tmp"); $c=<F>; close F;} s|<footer|$c\n<footer|' index_en.html

rm faq_ko.tmp faq_en.tmp


# --------------------------------------------
# 4. Robots.txt 및 Sitemap.xml 생성
# --------------------------------------------
echo "🤖 검색엔진 최적화 파일 생성 중..."

# robots.txt (모든 검색엔진 허용)
cat << 'EOF' > robots.txt
User-agent: *
Allow: /
Sitemap: https://도장문서.store/sitemap.xml
