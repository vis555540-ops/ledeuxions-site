#!/usr/bin/env bash
set -e

cd ~/문서/stamp-pages

# 기존 "지금 시작하기" 버튼 + 한 줄 설명을
# 3개의 버튼과 새로운 설명 문구로 교체
perl -0pi -e 's|<a href="welcome.html" class="btn-primary">지금 시작하기 →</a>\s*<div style="margin-top:12px; font-size:13px; opacity:0.8;">계정 없이 무료 사용 · 서버 미저장</div>|<div style="display:flex; flex-wrap:wrap; gap:8px; justify-content:center; margin-top:8px;">\n  <a href="welcome.html" class="btn-primary" style="background:#22c55e;">도장 추출기 (기본) →</a>\n  <a href="stamp-ai-seal.html" class="btn-primary" style="background:#4f46e5;">도장 추출 (고급 · AI) →</a>\n  <a href="stamp-ai-sign.html" class="btn-primary" style="background:#ec4899;">서명 추출 (고급 · AI) →</a>\n</div>\n<div style="margin-top:12px; font-size:13px; opacity:0.85;">도장·서명 추출 3가지 도구 제공 · 계정 없이 무료 사용 · 서버 미저장</div>|' index.html

git add index.html
git commit -m "feat: add basic and AI stamp/sign extract options to hero CTA"
git push origin main
