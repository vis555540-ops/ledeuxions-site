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
import json
import json
import os
import shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'web-projects', 'pdf300', 'en')
OUT = os.path.join(ROOT, 'dist', 'pdf300')
MAIN = 'https://ledeuxions.com'


QA = [
    ("Do my files get uploaded to a server?",
     "Not for the 14 browser tools — merge, split, crop, compress, sign, redact and the rest "
     "run entirely inside your browser, so the file never leaves your device. "
     "The 10 advanced tools (OCR, password, repair, Office→PDF) do need a server, "
     "because that work cannot be done in a browser. Those are clearly marked SRV."),
    ("Is PDF300 really free?",
     "Yes. All 24 tools are free to use right now, and the 14 browser tools stay free and unlimited, always."),
    ("Do I need to create an account?",
     "No. There is no sign-up, no login and no email required to use any tool."),
    ("Do you add watermarks to the output?",
     "No. Nothing we produce carries a watermark or a logo."),
    ("Is there a file size limit?",
     "The browser tools are limited only by your own device memory — large files work if your "
     "machine can hold them. The server tools have practical limits because the file has to travel."),
    ("Which tools need the server?",
     "High-quality compress, OCR, password protect, password remove, metadata strip, repair, "
     "page numbers, N-up, watermark and Office→PDF conversion."),
    ("Does it work without an internet connection?",
     "Once the page has loaded, the browser tools keep working even if you go offline. "
     "The server tools need a connection."),
]

FAQ_HTML = (
    '\n    <section class="faq container-narrow" id="faq" '
    'style="margin-top:var(--space-8,56px);">\n'
    '        <h2 style="font-size:1.2rem;margin:0 0 18px;">Questions people ask</h2>\n'
    + ''.join(
        '        <details style="border-bottom:1px solid var(--border,#2C2722);padding:14px 0;">\n'
        '            <summary style="cursor:pointer;font-weight:600;font-size:.95rem;">%s</summary>\n'
        '            <p style="margin:10px 0 0;font-size:.9rem;line-height:1.65;'
        'color:var(--text-secondary,#B7B0A4);">%s</p>\n'
        '        </details>\n' % (q, a) for q, a in QA)
    + '    </section>\n'
)

JSONLD = '\n<script type="application/ld+json">' + json.dumps({
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "WebApplication",
            "name": "PDF300",
            "url": "https://pdf300.com/",
            "applicationCategory": "UtilitiesApplication",
            "operatingSystem": "Any (web browser)",
            "browserRequirements": "Requires JavaScript",
            "description": "24 free PDF tools. The 14 browser tools run on your device, "
                           "so your files are never uploaded.",
            "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"},
            "featureList": [
                "Merge PDF", "Split PDF", "Rotate and reorder pages", "Crop PDF", "N-up layout",
                "Add page numbers", "Watermark", "Signature and stamp", "Redact", "PDF to image",
                "Image to PDF", "PDF to text", "Compress PDF", "Edit metadata",
                "High-quality compress", "OCR", "Password protect", "Password remove",
                "Strip metadata", "Repair PDF", "Office to PDF",
            ],
        },
        {
            "@type": "FAQPage",
            "mainEntity": [
                {"@type": "Question", "name": q,
                 "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in QA
            ],
        },
    ],
}, ensure_ascii=False) + '</script>'


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
    for name in ('pdf300.js', 'pdf300-server.js', 'early-access.js', 'paywall.js', 'promo.js'):
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

    # --- SEO: FAQ 섹션 + 구조화 데이터 ---
    # 도구 사이트는 본문 텍스트가 거의 없어 검색에 불리하다. FAQ가 그 공백을 메우고,
    # JSON-LD 로 검색결과에 리치 스니펫(FAQ 아코디언)이 뜰 수 있게 한다.
    # 답변은 실제 동작만 쓴다 — 서버 도구가 파일을 어떻게 처리하는지 확인 못 한 부분은 단정하지 않는다.
    html = html.replace('</main>', FAQ_HTML + '\n</main>', 1)
    html = html.replace('</head>', JSONLD + '\n</head>', 1)

    open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(html)

    # --- 도구별 SEO 랜딩페이지 ---
    # 이유: 도구가 index.html 한 장에 해시로만 있어서 'merge pdf' 같은 검색어에 안 걸린다.
    # 경쟁사는 도구마다 독립 URL을 가진다. 얄팍한 페이지는 구글이 벌주므로 실제 내용을 넣는다.
    import importlib.util as _il
    _spec = _il.spec_from_file_location('landing', os.path.join(ROOT, 'tools', 'pdf300_landing_data.py'))
    _m = _il.module_from_spec(_spec); _spec.loader.exec_module(_m)
    TOOLS = _m.TOOLS

    nav_links = ' · '.join(
        '<a href="/%s/">%s</a>' % (t['slug'], t['h1']) for t in TOOLS)

    for t in TOOLS:
        d = os.path.join(OUT, t['slug'])
        os.makedirs(d, exist_ok=True)
        app = t['anchor'] if t['anchor'].startswith('/') else '/' + t['anchor']
        steps = ''.join('<li>%s</li>' % s for s in t['steps'])
        faq = ''.join(
            '<div class="faq"><h3>%s</h3><p>%s</p></div>' % (q, a) for q, a in t['faq'])
        faq_ld = ','.join(
            '{"@type":"Question","name":%s,"acceptedAnswer":{"@type":"Answer","text":%s}}'
            % (json.dumps(q), json.dumps(a)) for q, a in t['faq'])
        html_pg = """<!doctype html>
<html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#14110F">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="https://pdf300.com/{slug}/">
<meta property="og:type" content="article">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<link rel="stylesheet" href="/assets/css/claude-design.css">
<style>
  body{{background:#14110F;color:#F6F2EA;}}
  .wrap{{max-width:720px;margin:0 auto;padding:48px 20px 80px;}}
  .crumb{{font-size:.85rem;color:#837C70;margin-bottom:24px}}
  .crumb a{{color:#E8895F;text-decoration:none}}
  h1{{font-size:2rem;line-height:1.25;margin:0 0 14px}}
  .lede{{color:#B7B0A4;font-size:1.02rem;line-height:1.6;margin:0 0 28px}}
  .cta{{display:inline-block;background:#E8895F;color:#14110F;font-weight:600;
       padding:14px 22px;border-radius:12px;text-decoration:none;margin:6px 0 30px}}
  .chips{{list-style:none;display:flex;flex-wrap:wrap;gap:8px;padding:0;margin:0 0 32px}}
  .chips li{{font-size:.8rem;color:#B7B0A4;background:#1E1A16;
       border:1px solid rgba(255,255,255,.08);border-radius:999px;padding:6px 13px}}
  h2{{font-size:1.15rem;margin:32px 0 10px}}
  ol{{color:#B7B0A4;line-height:1.8;padding-left:20px}}
  .faq h3{{font-size:1rem;margin:20px 0 6px}}
  .faq p{{color:#B7B0A4;line-height:1.6;margin:0}}
  .more{{margin-top:44px;padding-top:22px;border-top:1px solid rgba(255,255,255,.08);
       font-size:.85rem;line-height:2;color:#837C70}}
  .more a{{color:#B7B0A4;text-decoration:none}}
</style>
<script type="application/ld+json">
{{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{faq_ld}]}}
</script>
</head><body><div class="wrap">
<div class="crumb"><a href="/">PDF300</a> › {h1}</div>
<h1>{h1}</h1>
<p class="lede">{what}</p>
<a class="cta" href="{app}">Open the tool →</a>
<ul class="chips"><li>🔒 No upload for browser tools</li><li>✅ No sign-up</li>
<li>🚫 No watermark</li><li>♾️ Free while in beta</li></ul>
<h2>How to use it</h2>
<ol>{steps}</ol>
<h2>Questions</h2>
{faq}
<div class="more"><strong>All tools:</strong><br>{nav}</div>
</div></body></html>
""".format(title=t['title'], desc=t['desc'], slug=t['slug'], h1=t['h1'],
           what=t['what'], app=app, steps=steps, faq=faq, faq_ld=faq_ld, nav=nav_links)
        open(os.path.join(d, 'index.html'), 'w', encoding='utf-8').write(html_pg)

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
        + ''.join('  <url>\n    <loc>https://pdf300.com/%s/</loc>\n'
                  '    <changefreq>monthly</changefreq>\n    <priority>0.9</priority>\n  </url>\n'
                  % t['slug'] for t in TOOLS)
        + '</urlset>\n')

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
