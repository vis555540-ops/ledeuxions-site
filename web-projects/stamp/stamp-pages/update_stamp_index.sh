#!/usr/bin/env bash
set -e

# 이 스크립트가 있는 폴더(= stamp-pages)로 이동
cd "$(dirname "$0")"

# 새 index.html 덮어쓰기
cat << 'HTML' > index.html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="naver-site-verification" content="67407c86256b78a687de37b03a945eda2e4b64c7" />
  <title>도장 PNG 추출기 – 도장만 쏙 빼주는 자동 변환</title>
  <meta name="description" content="흰 종이에 찍은 도장을 사진만 업로드하면, 자동으로 배경을 제거하고 투명 PNG로 추출해 주는 웹 서비스입니다." />

  <!-- Google AdSense -->
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2824624880449066" crossorigin="anonymous"></script>

  <link rel="stylesheet" href="css/style.css">

  <style>
    /* 인덱스 전용 레이아웃 (기존 색 변수 재사용) */
    .main-hero {
      background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
      color: #fff;
      padding: 64px 32px;
      border-radius: 16px;
      margin-bottom: 48px;
      text-align: center;
      box-shadow: 0 18px 45px rgba(0,0,0,0.18);
    }
    .main-hero h1 {
      font-size: 34px;
      margin-bottom: 16px;
      font-weight: 700;
      line-height: 1.4;
    }
    .main-hero p {
      font-size: 16px;
      opacity: 0.96;
      line-height: 1.7;
      margin-bottom: 24px;
    }
    .main-hero-tag {
      font-size: 13px;
      margin-bottom: 12px;
      opacity: 0.9;
    }
    .main-hero-meta {
      margin-top: 12px;
      font-size: 13px;
      opacity: 0.85;
    }

    .btn-primary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 14px 32px;
      border-radius: 999px;
      background: #22c55e;
      color: #fff;
      font-weight: 600;
      font-size: 16px;
      text-decoration: none;
      box-shadow: 0 12px 32px rgba(34,197,94,0.38);
      transition: all 0.18s ease-out;
      gap: 6px;
    }
    .btn-primary:hover {
      background: #16a34a;
      transform: translateY(-2px);
      box-shadow: 0 16px 40px rgba(22,163,74,0.45);
    }

    .feature-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 20px;
      margin-top: 24px;
    }
    .feature-card {
      background: var(--bg-white);
      border-radius: 14px;
      padding: 20px 20px 18px;
      border: 1px solid var(--border-light);
      box-shadow: 0 10px 24px rgba(15,23,42,0.04);
    }
    .feature-icon {
      font-size: 26px;
      margin-bottom: 8px;
    }
    .feature-card h3 {
      font-size: 16px;
      margin-bottom: 6px;
      font-weight: 600;
    }
    .feature-card p {
      font-size: 14px;
      color: var(--text-secondary);
      line-height: 1.6;
    }

    .steps-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 24px;
      margin-top: 40px;
    }
    .step-item {
      text-align: center;
      padding: 16px;
    }
    .step-number {
      width: 48px;
      height: 48px;
      background: var(--primary);
      color: #fff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      font-weight: 700;
      margin: 0 auto 12px;
      box-shadow: 0 10px 22px rgba(129,140,248,0.4);
    }
    .step-item h3 {
      font-size: 15px;
      margin-bottom: 4px;
      font-weight: 600;
    }
    .step-item p {
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.5;
    }

    .faq-section {
      background: var(--bg-white);
      padding: 32px 28px;
      border-radius: 16px;
      border: 1px solid var(--border-light);
      margin-top: 40px;
      box-shadow: 0 12px 30px rgba(15,23,42,0.05);
    }
    .faq-section h2 {
      font-size: 18px;
      margin-bottom: 14px;
    }
    .faq-item {
      border-top: 1px solid var(--border-light);
      padding: 14px 0;
    }
    .faq-item:first-of-type {
      border-top: none;
    }
    .faq-item h3 {
      font-size: 15px;
      margin-bottom: 4px;
      font-weight: 600;
    }
    .faq-item p {
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.6;
    }

    .hero-cta-secondary {
      margin-top: 10px;
      font-size: 13px;
      opacity: 0.85;
    }

    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 999px;
      background: rgba(255,255,255,0.14);
      font-size: 12px;
      margin-top: 12px;
    }

    @media (max-width: 900px) {
      .feature-grid,
      .steps-grid {
        grid-template-columns: 1fr;
      }
      .main-hero {
        padding: 40px 20px;
      }
      .main-hero h1 {
        font-size: 24px;
      }
    }
  </style>
</head>
<body>
  <header>
    <nav>
      <a href="index.html" class="logo">도장 PNG 추출기</a>
      <div class="nav-links">
        <a href="guide.html" style="color:#22c55e; font-weight:bold;">✨ 도장 상식</a>
        <a href="welcome.html">도장 만들기</a>
        <a href="board.html">문의하기</a>
        <a href="seal-info.html" style="color:#22c55e; font-weight:bold;">📝 도장 용어집</a>
      </div>
    </nav>
  </header>

  <main class="container">
    <!-- 메인 히어로 -->
    <section class="main-hero">
      <div class="main-hero-tag">온라인 도장 작업실</div>
      <h1>흰 종이에 찍은 도장만<br />깨끗한 투명 PNG로 추출합니다.</h1>
      <p>
        인감, 직인, 이름 도장을 A4 흰 종이에 찍고 사진만 올리면,<br />
        배경은 지우고 도장 부분만 투명 PNG로 만들어 줍니다.
      </p>
      <a href="welcome.html" class="btn-primary">
        <span>지금 시작하기</span>
        <span>→</span>
      </a>
      <div class="hero-badge">
        <span style="font-size:11px; background:#fef3c7; color:#d97706; padding:2px 6px; border-radius:999px;">BETA</span>
        <span style="font-size:12px;">계정 없이 무료 사용 · 서버 미저장</span>
      </div>
    </section>

    <!-- 주요 기능 -->
    <section>
      <h2 style="margin-bottom:16px;">주요 기능</h2>
      <div class="feature-grid">
        <div class="feature-card">
          <div class="feature-icon">🎯</div>
          <h3>자동 배경 제거</h3>
          <p>흰색 배경을 자동으로 감지하고 제거하여 도장 부분만 남깁니다.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">💎</div>
          <h3>투명 PNG 변환</h3>
          <p>배경이 투명한 PNG 파일로 변환하여 문서, 계약서, 전자서명에 바로 붙여넣을 수 있습니다.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">⚡</div>
          <h3>빠른 처리 속도</h3>
          <p>모든 처리는 브라우저에서만 수행되며, 업로드된 이미지는 서버에 저장되지 않습니다.</p>
        </div>
      </div>
    </section>

    <!-- 사용 방법 -->
    <section class="steps-section">
      <h2 style="margin-top:40px; margin-bottom:12px;">사용 방법</h2>
      <div class="steps-grid">
        <div class="step-item">
          <div class="step-number">1</div>
          <h3>도장 촬영</h3>
          <p>A4 흰 종이에 도장을 크게, 그림자 없이 찍어 주세요.</p>
        </div>
        <div class="step-item">
          <div class="step-number">2</div>
          <h3>사진 업로드</h3>
          <p><strong>도장 만들기</strong> 페이지에서 사진을 업로드하면 자동으로 배경을 제거합니다.</p>
        </div>
        <div class="step-item">
          <div class="step-number">3</div>
          <h3>PNG 다운로드</h3>
          <p>투명 배경 PNG 파일로 저장하여 문서 작업에 활용하실 수 있습니다.</p>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="faq-section">
      <h2>자주 묻는 질문</h2>
      <div class="faq-item">
        <h3>어떤 도장을 사용할 수 있나요?</h3>
        <p>빨간색 인감, 직인, 막도장 등에 최적화되어 있습니다. 번지는 잉크, 복잡한 바탕 무늬는 인식이 떨어질 수 있습니다.</p>
      </div>
      <div class="faq-item">
        <h3>사진을 서버에 저장하나요?</h3>
        <p>저장하지 않습니다. 가능한 한 브라우저 내 처리만 사용하며, 서버로 전송되는 데이터도 작업 완료 후 바로 폐기됩니다.</p>
      </div>
      <div class="faq-item">
        <h3>결과물이 깨끗하지 않아요.</h3>
        <p>그림자가 지거나 배경이 어두우면 인식이 어려울 수 있습니다. 밝은 곳에서 종이를 평평하게 두고 촬영한 사진을 사용해 주세요.</p>
      </div>
    </section>

    <!-- 하단 CTA -->
    <div style="text-align:center; margin-top:36px;">
      <a href="welcome.html" class="btn-primary" style="font-size:15px; padding:12px 28px;">
        도장 만들러 가기 →
      </a>
    </div>
  </main>

  <footer style="margin-top:60px; padding:28px 0; text-align:center; color:#888; border-top:1px solid #eee; font-size:13px;">
    <p>&copy; 2025 도장 PNG 추출기 · <span style="background:#fef3c7; color:#d97706; padding:2px 6px; border-radius:4px; font-size:11px;">BETA</span></p>
    <div style="margin-top:10px;">
      <a href="index.html" style="margin:0 8px; color:#666; text-decoration:none;">홈</a>
      <a href="guide.html" style="margin:0 8px; color:#666; text-decoration:none;">도장 상식</a>
      <a href="work.html" style="margin:0 8px; color:#666; text-decoration:none;">사용법</a>
      <a href="board.html" style="margin:0 8px; color:#666; text-decoration:none;">문의하기</a>
      <a href="privacy.html" style="margin:0 8px; color:#666; text-decoration:none;">개인정보처리방침</a>
    </div>
  </footer>
</body>
</html>
HTML

# git 커밋 & 푸시
git add index.html update_stamp_index.sh
git commit -m "feat: renew stamp index hero and layout"
git push origin main
