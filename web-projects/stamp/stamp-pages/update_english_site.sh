#!/usr/bin/env bash
set -e

echo "🌍 Global Site Update: Creating Western-style Landing Page..."

# 1. 영문 페이지 (index_en.html) 작성
# 특징: 흰색 배경, 파란색 신뢰 컬러, 서버 저장 없음을 최상단에 강조
cat << 'HTML' > index_en.html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Free Signature Extractor - Transparent Background (Private & Secure)</title>
    <meta name="description" content="Digitize your handwritten signature instantly. Free AI tool to remove background from signatures and stamps. 100% Client-side privacy.">
    <link rel="stylesheet" href="style.css">
    <style>
        /* Western Style Overrides */
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #ffffff;
            color: #111;
        }
        
        /* Navigation */
        .nav-global {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 5%;
            border-bottom: 1px solid #f0f0f0;
        }
        .brand-logo { font-weight: 800; font-size: 1.2rem; color: #0056b3; text-decoration: none; }
        .lang-btn { text-decoration: none; color: #555; font-size: 0.9rem; padding: 6px 12px; border: 1px solid #ddd; border-radius: 20px; transition: all 0.2s; }
        .lang-btn:hover { background: #f8f9fa; color: #000; border-color: #999; }

        /* Hero Section */
        .hero-en {
            text-align: center;
            padding: 80px 20px 60px;
            max-width: 800px;
            margin: 0 auto;
        }
        .security-badge {
            display: inline-block;
            background: #e3f2fd;
            color: #0d47a1;
            padding: 8px 16px;
            border-radius: 50px;
            font-size: 0.85rem;
            font-weight: 600;
            margin-bottom: 24px;
        }
        .hero-en h1 {
            font-size: 2.8rem;
            line-height: 1.2;
            margin-bottom: 20px;
            color: #222;
            letter-spacing: -0.5px;
        }
        .hero-en p {
            font-size: 1.2rem;
            color: #555;
            margin-bottom: 40px;
            line-height: 1.6;
        }

        /* Buttons */
        .btn-group-en { display: flex; gap: 15px; justify-content: center; flex-wrap: wrap; }
        .btn-main {
            background-color: #0056b3;
            color: white;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 700;
            text-decoration: none;
            font-size: 1.1rem;
            transition: transform 0.2s, background 0.2s;
            border: none;
        }
        .btn-main:hover { background-color: #004494; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,86,179,0.2); }
        .btn-sub {
            background-color: white;
            color: #333;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            text-decoration: none;
            font-size: 1.1rem;
            border: 2px solid #e0e0e0;
            transition: all 0.2s;
        }
        .btn-sub:hover { border-color: #bbb; background-color: #f9f9f9; }

        /* Features */
        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 40px;
            max-width: 1000px;
            margin: 60px auto;
            padding: 0 20px;
        }
        .feature-item h3 { font-size: 1.2rem; margin-bottom: 10px; color: #111; }
        .feature-item p { color: #666; line-height: 1.5; }

        /* Footer */
        footer { margin-top: 100px; padding: 40px 0; border-top: 1px solid #f0f0f0; text-align: center; color: #888; font-size: 0.9rem; }
        footer a { color: #555; text-decoration: none; margin: 0 10px; }
        footer a:hover { text-decoration: underline; }

        @media (max-width: 768px) {
            .hero-en h1 { font-size: 2rem; }
            .btn-main, .btn-sub { width: 100%; display: block; text-align: center; margin-bottom: 10px; }
        }
    </style>
</head>
<body>

    <nav class="nav-global">
        <a href="index_en.html" class="brand-logo">✍️ SignatureExtractor.io</a>
        <a href="index.html" class="lang-btn">🇰🇷 한국어 Site</a>
    </nav>

    <header class="hero-en">
        <div class="security-badge">🔒 Private & Secure: Files never leave your browser</div>
        <h1>Digitize Your Signature<br>in Seconds</h1>
        <p>
            Remove backgrounds from handwritten signatures or stamps using AI.<br>
            Get a transparent PNG instantly. No signup required.
        </p>

        <div class="btn-group-en">
            <a href="stamp-ai-sign.html" class="btn-main">Make Transparent Signature (AI)</a>
            <a href="welcome.html" class="btn-sub">Traditional Stamp Tool</a>
        </div>
    </header>

    <section class="features-grid">
        <div class="feature-item">
            <h3>⚡ Instant Processing</h3>
            <p>Everything happens in your browser. No waiting for server uploads or downloads.</p>
        </div>
        <div class="feature-item">
            <h3>🛡️ 100% Private</h3>
            <p>We do not store your data. Your signature files are processed locally and vanish when you close the tab.</p>
        </div>
        <div class="feature-item">
            <h3>✨ High Quality</h3>
            <p>Use our Threshold Slider and B&W Mode to clean up messy scans and get crisp lines.</p>
        </div>
    </section>

    <footer>
        <a href="privacy.html">Privacy Policy</a>
        <a href="https://playnstock.tistory.com/guestbook" target="_blank">Contact</a>
        <br><br>
        © 2025 Signature Extractor Tools
    </footer>

</body>
</html>
HTML

# 2. 한국어 메인(index.html)에 언어 감지 스크립트 안전하게 주입
# 기존에 스크립트가 있다면 지우고 새로 넣는 방식 (중복 방지)

# 임시 파일에 스크립트 작성
cat << 'JS' > lang_redirect.tmp
<script>
    // User Language Detection & Redirection
    (function() {
        try {
            var userLang = navigator.language || navigator.userLanguage; 
            // 만약 한국어가 아니고(not KO) && 현재 페이지가 영어페이지가 아니라면
            if (userLang && !userLang.includes('ko') && !window.location.href.includes('index_en.html')) {
                // 세션 스토리지 체크 (이미 한 번 리다이렉트 했거나, 유저가 일부러 한국어 페이지를 클릭했으면 이동 안 함)
                if (!sessionStorage.getItem('lang_redirected')) {
                    sessionStorage.setItem('lang_redirected', 'true');
                    window.location.href = 'index_en.html';
                }
            }
        } catch(e) { console.log('Lang detection error', e); }
    })();
</script>
JS

# index.html에서 기존 스크립트 부분 청소 (혹시 모를 중복 제거)
perl -0777 -i -pe 's|<script>.*?userLang.*?</script>||gs' index.html

# 헤드 태그 바로 뒤에 새 스크립트 삽입
perl -0777 -i -pe '
    BEGIN { local $/; open(F, "<", "lang_redirect.tmp"); $c = <F>; close F; }
    s|<head>|<head>\n$c|g
' index.html

# 임시 파일 삭제
rm lang_redirect.tmp

echo "✅ English page created and language redirection logic updated."
