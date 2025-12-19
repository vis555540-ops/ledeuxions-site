#!/usr/bin/env bash
set -e

echo "🌍 영어권 사용자 전용 페이지(index_en.html) 전면 개편 시작..."

# 새로운 index_en.html 파일 생성
cat << 'HTML' > index_en.html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Free Signature Extractor & Transparent PNG Maker (Private & Secure)</title>
    <meta name="description" content="Instantly remove backgrounds from handwritten signatures and stamps. 100% free, no signup, and files never leave your browser for maximum privacy.">
    <link rel="stylesheet" href="style.css"> <style>
        /* 영어 페이지 전용 스타일 오버라이드 */
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #fff; /* 깔끔한 흰색 배경 */
            color: #333;
        }

        /* 상단 네비게이션 */
        .nav-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 30px;
            border-bottom: 1px solid #eee;
        }
        .nav-logo { font-weight: 800; font-size: 1.2rem; color: #0061f2; text-decoration: none; }
        .lang-switch a { text-decoration: none; color: #666; font-weight: 600; padding: 8px 12px; border-radius: 20px; background: #f8f9fa; transition: background 0.2s; }
        .lang-switch a:hover { background: #e9ecef; color: #333; }

        /* 히어로 섹션 (메인 배너) - 신뢰 강조 스타일 */
        .hero-en {
            text-align: center;
            padding: 80px 20px 60px;
            max-width: 900px;
            margin: 0 auto;
        }
        .trust-badge {
            display: inline-block;
            background-color: #e7f1ff;
            color: #0061f2;
            font-weight: 600;
            font-size: 0.9rem;
            padding: 8px 16px;
            border-radius: 30px;
            margin-bottom: 25px;
        }
        .hero-en h1 {
            font-size: 3rem;
            line-height: 1.2;
            margin-bottom: 20px;
            color: #1a1a1a;
        }
        .hero-en p {
            font-size: 1.25rem;
            color: #666;
            margin-bottom: 40px;
            line-height: 1.6;
        }

        /* CTA 버튼 그룹 */
        .cta-group {
            display: flex;
            gap: 15px;
            justify-content: center;
            flex-wrap: wrap;
        }
        .btn-en-primary {
            background-color: #0061f2;
            color: white;
            padding: 18px 36px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 700;
            font-size: 1.1rem;
            transition: transform 0.2s, background-color 0.2s;
            border: none;
        }
        .btn-en-primary:hover { background-color: #0051cb; transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,97,242,0.15); }
        .btn-en-secondary {
            background-color: #f8f9fa;
            color: #333;
            padding: 18px 36px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 700;
            font-size: 1.1rem;
            border: 2px solid #eee;
            transition: all 0.2s;
        }
        .btn-en-secondary:hover { border-color: #ccc; background-color: #eee; }

        /* 기능 소개 섹션 (3단 그리드) */
        .features-en {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 30px;
            max-width: 1000px;
            margin: 60px auto;
            padding: 0 20px;
        }
        .feature-box {
            text-align: left;
            padding: 30px;
            background: #f8f9fa;
            border-radius: 12px;
        }
        .feature-icon { font-size: 2rem; margin-bottom: 15px; }
        .feature-box h3 { margin-bottom: 10px; color: #333; }
        .feature-box p { color: #666; line-height: 1.5; font-size: 0.95rem; }

        /* 모바일 대응 */
        @media (max-width: 768px) {
            .hero-en h1 { font-size: 2.2rem; }
            .hero-en p { font-size: 1.1rem; }
            .btn-en-primary, .btn-en-secondary { width: 100%; text-align: center; }
        }
    </style>
</head>
<body>

    <nav class="nav-bar">
        <a href="index_en.html" class="nav-logo">✍️ SignatureExtractor.io</a>
        <div class="lang-switch">
            <a href="index.html">🇰🇷 한국어</a>
        </div>
    </nav>

    <header class="hero-en">
        <div class="trust-badge">
            🔒 100% Private: Files never leave your device.
        </div>
        <h1>The Easiest Way to Digitize Your Signature</h1>
        <p>
            Instantly remove backgrounds from handwritten signatures or stamps using AI.<br>
            Get a clean, transparent PNG for PDFs, Word docs, and contracts without signing up.
        </p>
        
        <div class="cta-group">
            <a href="stamp-ai-sign.html" class="btn-en-primary">
                🚀 Start Signature Extraction (AI)
            </a>
            <a href="welcome.html" class="btn-en-secondary">
                Traditional Stamp Mode
            </a>
        </div>
    </header>

    <section class="features-en">
        <div class="feature-box">
            <div class="feature-icon">🛡️</div>
            <h3>Bank-Grade Privacy</h3>
            <p>We use client-side technology. Your images are processed locally in your browser and are never uploaded to any server.</p>
        </div>
        <div class="feature-box">
            <div class="feature-icon">⚡</div>
            <h3>Instant & Free</h3>
            <p>No account required. Just upload your photo, adjust the settings, and download the transparent PNG immediately.</p>
        </div>
        <div class="feature-box">
            <div class="feature-icon">🎚️</div>
            <h3>Precision Control</h3>
            <p>Use our new threshold slider and dark mode to perfectly isolate signatures, even from messy scans.</p>
        </div>
    </section>

    <section style="max-width: 800px; margin: 60px auto; padding: 20px; color: #555; line-height: 1.8;">
        <h2 style="text-align: center; color: #333; margin-bottom: 30px;">How to Create a Digital Signature</h2>
        <ol style="padding-left: 20px;">
            <li style="margin-bottom: 15px;"><strong>Sign on paper:</strong> Use a thick dark pen (like a Sharpie) on plain white paper for the best results.</li>
            <li style="margin-bottom: 15px;"><strong>Take a photo:</strong> Ensure good lighting with no shadows across the signature.</li>
            <li style="margin-bottom: 15px;"><strong>Upload & refine:</strong> Use our AI tool to automatically remove the paper background. Adjust the threshold slider if needed.</li>
            <li><strong>Download PNG:</strong> Save the transparent image and insert it into any digital document.</li>
        </ol>
    </section>

    <footer style="text-align: center; margin-top: 80px; padding: 30px 0; border-top: 1px solid #eee; color: #888; font-size: 0.9rem;">
        <a href="privacy.html" style="color: #666; text-decoration: none; margin: 0 10px;">Privacy Policy</a> | 
        <a href="https://playnstock.tistory.com/guestbook" target="_blank" style="color: #666; text-decoration: none; margin: 0 10px;">Contact / Feedback</a>
        <br><br>
        © 2025 SignatureExtractor.io - All rights reserved.
    </footer>

</body>
</html>
HTML

# 한국어 메인 페이지(index.html)의 언어 감지 스크립트 강화
# (혹시 지워졌을 경우를 대비해 다시 안전하게 주입)
cat << 'JS' > lang_script.tmp
<script>
    // 브라우저 언어 감지 및 리다이렉트 (최초 1회만)
    var userLang = navigator.language || navigator.userLanguage; 
    if (!userLang.includes("ko") && !window.location.href.includes("index_en.html")) {
        if (!sessionStorage.getItem("lang_redirected_v2")) {
            sessionStorage.setItem("lang_redirected_v2", "true");
            window.location.href = "index_en.html";
        }
    }
</script>
JS

# 기존 스크립트가 있다면 제거하고 새로 주입 (중복 방지)
perl -0777 -i -pe 's|<script>.*?userLang.*?</script>||gs' index.html
perl -0777 -i -pe '
    BEGIN { local $/; open(F, "<", "lang_script.tmp"); $c = <F>; close F; }
    s|<head>|<head>\n$c|g
' index.html
rm lang_script.tmp


git add .
git commit -m "feat: launch redesigned english landing page targeting western users"
git push origin main

echo "✅ 글로벌 영어 페이지(index_en.html) 구축 완료!"
echo "브라우저 주소창에 /index_en.html 을 붙여서 접속해보세요."
