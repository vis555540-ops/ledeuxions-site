#!/usr/bin/env bash
set -e

echo "🌍 글로벌화 및 SEO 업데이트 (안전 모드) 시작..."

# 1. 개인정보처리방침 (privacy.html) 생성
cat << 'HTML' > privacy.html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>개인정보처리방침 - 도장/서명 추출기</title>
    <style>
        body { font-family: sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; color: #333; }
        h1 { border-bottom: 2px solid #eee; padding-bottom: 10px; }
        h2 { margin-top: 30px; font-size: 1.2rem; }
    </style>
</head>
<body>
    <h1>개인정보처리방침 (Privacy Policy)</h1>
    <p>본 '도장 및 서명 추출기'(이하 "서비스")는 사용자의 개인정보를 소중하게 생각합니다.</p>
    
    <h2>1. 데이터의 저장 (No Server Storage)</h2>
    <p>본 서비스는 <strong>서버리스(Serverless) 방식</strong>으로 동작합니다. 사용자가 업로드한 도장 이미지나 서명 파일은 오직 사용자의 브라우저 내에서만 처리되며, 운영자의 서버로 전송되거나 저장되지 않습니다. 브라우저 창을 닫으면 데이터는 즉시 소멸됩니다.</p>

    <h2>2. 쿠키 및 광고 (Cookies & Ads)</h2>
    <p>본 서비스는 Google AdSense를 통해 광고를 게재할 수 있습니다. Google은 사용자의 웹사이트 방문 기록을 바탕으로 적절한 광고를 보여주기 위해 쿠키(Cookie)를 사용할 수 있습니다. 사용자는 브라우저 설정에서 쿠키 사용을 거부할 수 있습니다.</p>

    <h2>3. 문의하기</h2>
    <p>서비스 이용과 관련된 문의사항은 관리자 이메일(contact@example.com)로 문의해 주시기 바랍니다.</p>
    
    <div style="margin-top:50px; text-align:center;">
        <a href="index.html" style="text-decoration:none; color:blue;">← 메인으로 돌아가기</a>
    </div>
</body>
</html>
HTML

# 2. 영어 페이지 (index_en.html) 생성
cat << 'HTML' > index_en.html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Free Signature & Stamp Extractor (No Signup)</title>
    <link rel="stylesheet" href="style.css">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        .hero { padding: 80px 20px; text-align: center; }
        .hero h1 { font-size: 2.5rem; margin-bottom: 10px; color: #333; }
        .hero p { font-size: 1.2rem; color: #666; margin-bottom: 30px; }
        .trust-badge { background: #eef; color: #335; padding: 5px 10px; border-radius: 4px; font-size: 0.9rem; display: inline-block; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="hero">
        <div class="trust-badge">🔒 100% Client-Side Processing (No Server Uploads)</div>
        <h1>Make Your Signature Background Transparent</h1>
        <p>Digitize your handwritten signature or stamp instantly using AI.<br>Perfect for PDFs, Word docs, and contracts.</p>
        
        <div style="display:flex; gap:15px; justify-content:center; flex-wrap:wrap; margin-top:20px;">
            <a href="stamp-ai-sign.html" class="btn-primary" style="background:#007bff; color:white; padding:15px 30px; text-decoration:none; border-radius:8px; font-weight:bold;">Extract Signature (AI) →</a>
            <a href="welcome.html" class="btn-primary" style="background:#6c757d; color:white; padding:15px 30px; text-decoration:none; border-radius:8px; font-weight:bold;">Traditional Stamp Mode</a>
        </div>
    </div>

    <section style="max-width: 800px; margin: 0 auto; padding: 20px; text-align: center;">
        <h3 style="color:#333;">Why use this tool?</h3>
        <ul style="list-style:none; padding:0; color:#555; text-align: left; display: inline-block;">
            <li>✅ <strong>Privacy First:</strong> Your files never leave your device.</li>
            <li>✅ <strong>No Signup:</strong> Just upload and download.</li>
            <li>✅ <strong>High Quality:</strong> AI-powered background removal.</li>
        </ul>
    </section>

    <footer style="text-align: center; margin-top: 50px; padding-bottom: 20px;">
        <a href="privacy.html">Privacy Policy</a> | <a href="index.html">🇰🇷 한국어 버전</a>
    </footer>
</body>
</html>
HTML

# 3. [안전한 방식] SEO 섹션 임시 파일 생성
# 명령줄에 특수문자를 넣지 않고 파일로 먼저 만듭니다.
cat << 'HTML' > seo_snippet.tmp
<section style="max-width: 800px; margin: 60px auto; text-align: left; padding: 20px; background-color:#f9f9f9; border-radius:10px;">
    <h2 style="font-size: 1.5rem; margin-bottom: 20px;">온라인 도장/서명 만들기 팁</h2>
    <p style="color: #555;"><strong>깨끗한 서명 만들기:</strong> A4 용지 같은 흰 종이에 네임펜으로 굵게 서명한 뒤, 그림자 없이 밝은 곳에서 촬영하세요.</p>
    <p style="color: #555;"><strong>보안 안심:</strong> 이미지는 서버에 저장되지 않고 브라우저에서만 처리됩니다.</p>
</section>

<footer style="text-align: center; margin: 40px 0; font-size: 0.9rem; color: #777;">
    <a href="privacy.html" style="color: #555; text-decoration: none; margin: 0 10px;">개인정보처리방침</a> | 
    <a href="mailto:contact@example.com" style="color: #555; text-decoration: none; margin: 0 10px;">문의하기</a>
    <br><br>
    © 2025 Stamp Remover Tools
</footer>
HTML

# 4. [안전한 방식] index.html에 내용 주입
# 파일을 읽어서 </body> 태그 앞에 끼워 넣습니다. (특수문자 충돌 원천 차단)
perl -0777 -i -pe '
    BEGIN { local $/; open(F, "<", "seo_snippet.tmp"); $c = <F>; close F; }
    s|</body>|$c</body>|g
' index.html

# 5. [안전한 방식] 언어 감지 스크립트 주입
cat << 'JS' > lang_script.tmp
<script>
    var userLang = navigator.language || navigator.userLanguage; 
    if (!userLang.includes("ko") && !window.location.href.includes("index_en.html")) {
        if (!sessionStorage.getItem("lang_redirected")) {
            sessionStorage.setItem("lang_redirected", "true");
            window.location.href = "index_en.html";
        }
    }
</script>
JS

perl -0777 -i -pe '
    BEGIN { local $/; open(F, "<", "lang_script.tmp"); $c = <F>; close F; }
    s|<head>|<head>\n$c|g
' index.html

# 임시 파일 삭제
rm seo_snippet.tmp lang_script.tmp

# Git 저장
git add .
git commit -m "feat: complete global seo update"
git push origin main
echo "✅ 완료되었습니다! (이번엔 진짜입니다)"
