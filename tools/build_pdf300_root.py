#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""pdf300.com 루트용 영어판 배포 번들 생성.

소스(진실): web-projects/pdf300/en/  (영어판. 이건 build_en.py 가 한국어판에서 생성)
출력      : dist/pdf300/             (루트가 곧 영어 앱인 정적 사이트)

pdf300.com 은 별도 Cloudflare Pages 프로젝트('pdf300')로 서빙하므로
루트 기준 경로(/assets/...)로 바꾸고, 사이트 공용 nav 링크는 ledeuxions.com 절대주소로 돌린다.

사용:  python3 tools/build_pdf300_root.py
배포:  npx wrangler pages deploy dist/pdf300 --project-name pdf300
"""
import os
import shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'web-projects', 'pdf300', 'en')
OUT = os.path.join(ROOT, 'dist', 'pdf300')
MAIN = 'https://ledeuxions.com'


def main():
    if os.path.isdir(OUT):
        shutil.rmtree(OUT)
    os.makedirs(os.path.join(OUT, 'assets', 'css'))
    os.makedirs(os.path.join(OUT, 'assets', 'js'))

    # --- 공용 에셋 (루트 기준으로 복사) ---
    shutil.copy2(os.path.join(ROOT, 'assets', 'css', 'claude-design.css'),
                 os.path.join(OUT, 'assets', 'css', 'claude-design.css'))
    shutil.copy2(os.path.join(ROOT, 'assets', 'js', 'common.js'),
                 os.path.join(OUT, 'assets', 'js', 'common.js'))
    # 애드센스 소유 확인용
    shutil.copy2(os.path.join(ROOT, 'ads.txt'), os.path.join(OUT, 'ads.txt'))

    # --- 앱 파일 ---
    for name in ('pdf300.js', 'pdf300-server.js'):
        shutil.copy2(os.path.join(SRC, name), os.path.join(OUT, name))
    if os.path.exists(os.path.join(SRC, 'target-size.html')):
        shutil.copy2(os.path.join(SRC, 'target-size.html'),
                     os.path.join(OUT, 'target-size.html'))

    # --- index.html: 경로를 루트 기준으로 ---
    html = open(os.path.join(SRC, 'index.html'), encoding='utf-8').read()
    html = html.replace('="../../../assets/', '="/assets/')
    # 사이트 공용 nav 는 본사이트(ledeuxions.com)로 절대주소
    for path in ('/web-projects/', '/work/', '/contact/'):
        html = html.replace('href="%s"' % path, 'href="%s%s"' % (MAIN, path))
    html = html.replace('<a href="/" class="nav-link"', '<a href="%s/" class="nav-link"' % MAIN)
    open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(html)

    # --- SEO 파일 ---
    open(os.path.join(OUT, 'robots.txt'), 'w', encoding='utf-8').write(
        'User-agent: *\nAllow: /\n\nSitemap: https://pdf300.com/sitemap.xml\n')
    open(os.path.join(OUT, 'sitemap.xml'), 'w', encoding='utf-8').write(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
        'xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
        '  <url>\n'
        '    <loc>https://pdf300.com/</loc>\n'
        '    <xhtml:link rel="alternate" hreflang="en" href="https://pdf300.com/"/>\n'
        '    <xhtml:link rel="alternate" hreflang="ko" '
        'href="https://ledeuxions.com/web-projects/pdf300/"/>\n'
        '    <changefreq>weekly</changefreq>\n'
        '    <priority>1.0</priority>\n'
        '  </url>\n'
        '  <url>\n'
        '    <loc>https://pdf300.com/target-size</loc>\n'
        '    <changefreq>monthly</changefreq>\n'
        '    <priority>0.8</priority>\n'
        '  </url>\n'
        '</urlset>\n')

    # --- 점검 ---
    bad = [l for l in open(os.path.join(OUT, 'index.html'), encoding='utf-8')
           if '../../../' in l or 'href="/web-projects/"' in l]
    print('output:', OUT)
    for root, _, files in os.walk(OUT):
        for f in sorted(files):
            p = os.path.join(root, f)
            print('  %8d  %s' % (os.path.getsize(p), os.path.relpath(p, OUT)))
    print('leftover bad refs:', len(bad))
    for l in bad:
        print('   ', l.strip()[:120])


if __name__ == '__main__':
    main()
