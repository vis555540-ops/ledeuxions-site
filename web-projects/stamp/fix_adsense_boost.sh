#!/usr/bin/env bash
set -e

echo "🔧 애드센스 부스터팩 재설치 (안전 모드 v2) 시작..."

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
echo "🔗 푸터 링크 연결 중..."

# 한국어 링크 HTML 조각 파일 생성
cat << 'HTML' > footer_link_ko.tmp
<a href="terms.html" style="color:#666;text-decoration:none;margin:0 10px;">이용약관</a> | <a href="privacy.html"
HTML

# 영어 링크 HTML 조각 파일 생성
cat << 'HTML' > footer_link_en.tmp
<a href="terms_en.html" style="color:#666;text-decoration:none;margin:0 10px;">Terms of Service</a> | <a href="privacy_en.html"
HTML

# 파일 하나씩 처리 (for loop)
for file in index.html welcome.html stamp-ai-sign.html; do
    if [ -f "$file" ]; then
        # '이용약관'이 없을 때만 추가
        if ! grep -q "terms.html" "$file"; then
            perl -i -pe 'BEGIN{local $/; open(F,"<","footer_link_ko.tmp"); $r=<F>; close F;} s|<a href="privacy.html"|$r|g' "$file"
            echo "✅ $file 업데이트 완료"
        fi
    fi
done

for file in index_en.html welcome_en.html stamp-ai-sign_en.html; do
    if [ -f "$file" ]; then
        if ! grep -q "terms_en.html" "$file"; then
            perl -i -pe 'BEGIN{local $/; open(F,"<","footer_link_en.tmp"); $r=<F>; close F;} s|<a href="privacy_en.html"|$r|g' "$file"
            echo "✅ $file (English) 업데이트 완료"
        fi
    fi
done

rm footer_link_ko.tmp footer_link_en.tmp

# --------------------------------------------
# 3. FAQ 섹션 추가
# --------------------------------------------
echo "💬 FAQ 섹션 추가 중..."

# 한국어 FAQ 파일
cat << 'HTML' > faq_ko.tmp
<section style="max-width:800px;margin:60px auto;padding:20px;background:#fff;border-top:1px solid #eee">
    <h2 style="text-align:center;margin-bottom:30px">자주 묻는 질문 (FAQ)</h2>
    <details open style="margin-bottom:15px;cursor:pointer"><summary style="font-weight:bold;font-size:1.1rem">Q. 정말 무료인가요?</summary><p style="margin-top:10px;color:#555">네, 모든 기능은 100% 무료이며 횟수 제한 없이 사용할 수 있습니다.</p></details>
    <details style="margin-bottom:15px;cursor:pointer"><summary style="font-weight:bold;font-size:1.1rem">Q. 제 도장 사진이 서버에 저장되나요?</summary><p style="margin-top:10px;color:#555">아니요, 절대 저장되지 않습니다. 모든 이미지 처리는 사용자의 컴퓨터(브라우저) 내부에서만 이루어지며, 서버로 전송되지 않는 안전한 방식입니다.</p></details>
    <details style="margin-bottom:15px;cursor:pointer"><summary style="font-weight:bold;font-size:1.1rem">Q. 배경이 투명하게 안 돼요.</summary><p style="margin-top:10px;color:#555">흰 종이에 그림자 없이 찍은 사진이 가장 잘 됩니다. '서명 추출(AI)' 메뉴에서 [감도 조절] 슬라이더를 움직여보세요.</p></details>
</section>
HTML

# 영어 FAQ 파일
cat << 'HTML' > faq_en.tmp
<section style="max-width:800px;margin:60px auto;padding:20px;background:#fff;border-top:1px solid #eee">
    <h2 style="text-align:center;margin-bottom:30px">Frequently Asked Questions</h2>
    <details open style="margin-bottom:15px;cursor:pointer"><summary style="font-weight:bold;font-size:1.1rem">Q. Is this tool really free?</summary><p style="margin-top:10px;color:#555">Yes, it is 100% free with no usage limits and no signup required.</p></details>
    <details style="margin-bottom:15px;cursor:pointer"><summary style="font-weight:bold;font-size:1.1rem">Q. Is my signature safe?</summary><p style="margin-top:10px;color:#555">Absolutely. We use client-side processing technology. Your images are processed in your browser and are NEVER uploaded to our servers.</p></details>
    <details style="margin-bottom:15px;cursor:pointer"><summary style="font-weight:bold;font-size:1.1rem">Q. How do I get the best results?</summary><p style="margin-top:10px;color:#555">Use white paper and a dark pen. Avoid shadows. Use the 'Threshold Slider' in our AI tool to fine-tune the transparency.</p></details>
</section>
HTML

# 중복 추가 방지
if ! grep -q "자주 묻는 질문" index.html; then
    perl -0777 -i -pe 'BEGIN{local $/; open(F,"<","faq_ko.tmp"); $c=<F>; close F;} s|<footer|$c\n<footer|' index.html
    echo "✅ index.html에 한국어 FAQ 추가됨"
fi

if ! grep -q "Frequently Asked Questions" index_en.html; then
    perl -0777 -i -pe 'BEGIN{local $/; open(F,"<","faq_en.tmp"); $c=<F>; close F;} s|<footer|$c\n<footer|' index_en.html
    echo "✅ index_en.html에 영어 FAQ 추가됨"
fi

rm faq_ko.tmp faq_en.tmp

# --------------------------------------------
# 4. Robots.txt 및 Sitemap.xml 생성
# --------------------------------------------
echo "🤖 검색엔진 최적화 파일 생성..."

# 여기서는 안쪽 내용물에 EOF를 써도, 바깥쪽이 END_SCRIPT라서 헷갈리지 않습니다.
cat << 'EOF' > robots.txt
User-agent: *
Allow: /
Sitemap: https://도장문서.store/sitemap.xml
EOF

cat << 'EOF' > sitemap.xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://도장문서.store/</loc><priority>1.0</priority></url>
  <url><loc>https://도장문서.store/index.html</loc><priority>0.8</priority></url>
  <url><loc>https://도장문서.store/index_en.html</loc><priority>0.8</priority></url>
  <url><loc>https://도장문서.store/stamp-ai-sign.html</loc><priority>0.8</priority></url>
  <url><loc>https://도장문서.store/stamp-ai-sign_en.html</loc><priority>0.8</priority></url>
  <url><loc>https://도장문서.store/welcome.html</loc><priority>0.6</priority></url>
  <url><loc>https://도장문서.store/welcome_en.html</loc><priority>0.6</priority></url>
</urlset>
EOF

git add .
git commit -m "fix: safely add Terms of Service link and FAQs with fixed heredoc"
git push origin main

echo "✨ 오류 수정 및 애드센스 대비 작업 완료! (진짜 완료)"
