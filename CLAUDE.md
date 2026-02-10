# CLAUDE.md - AI Assistant Guide for LeDeuxions-Site

## Project Overview

A static personal website and web utility suite for LeDeuxions. Hosts multiple browser-based tools (PDF manipulation, stamp maker, media converters, HEIC-to-JPG converter) alongside portfolio/contact pages. Bilingual (Korean/English) with automatic language detection.

## Tech Stack

- **Frontend**: Vanilla HTML5, CSS3, JavaScript (zero frameworks, zero NPM dependencies)
- **Build**: None required - pure static files served directly
- **Serverless**: Cloudflare Workers (`_worker.js` files) for API routing
- **Optional Backend**: Flask/Python API at `192.168.0.12:5000` (stamp extraction)
- **Hosting**: Static file hosting (Cloudflare Pages / GitHub Pages)
- **Monetization**: Google AdSense
- **Analytics**: Google Analytics

## Repository Structure

```
/
├── index.html                      # Main landing page
├── ad-transition.html              # Ad transition page with countdown
├── ads.txt                         # AdSense publisher verification
├── robots.txt / sitemap.xml        # SEO files
├── review_report.md                # Internal QA/audit checklist
│
├── web-projects/                   # Main utility applications
│   ├── index.html                  # Project catalog page
│   ├── pdf300/                     # PDF manipulation tool
│   ├── stamp/                      # Stamp PNG extraction tool (v1.1.0)
│   │   ├── js/stamp.js            # Core stamp extraction logic
│   │   ├── js/pdf-stamp.js        # PDF stamp insertion
│   │   ├── css/style.css           # Bandizip-inspired design system
│   │   ├── _worker.js              # Cloudflare Worker API routing
│   │   └── stamp-pages/            # Variant/duplicate of stamp tool
│   ├── freecomfortlab/             # Media conversion suite
│   │   ├── *.html                  # Audio/video conversion pages
│   │   ├── _worker.js              # Cloudflare Worker
│   │   └── en/                     # English versions
│   └── iphone-heic/               # HEIC-to-JPG converter (PWA)
│       ├── manifest.json           # PWA configuration
│       ├── ko/ & en/               # Localized versions
│       └── assets/                 # Styles, scripts, icons
│
├── applications/                   # Installable app variants
│   └── iphoneheic/                 # HEIC converter (duplicate/variant)
│
├── contact/                        # Contact page (Google Calendar embed)
├── privacy/                        # Privacy policy
├── terms/                          # Terms of service
├── history/                        # Work history/portfolio
└── work/                           # Project portfolio
```

## Development Commands

```bash
# Local development (no build step needed)
python -m http.server 8000
# or
npx http-server .
# or use VS Code Live Server extension

# Git workflow
git add <files>
git commit -m "descriptive message"
git push origin main
```

There is **no package.json**, no build pipeline, no test runner, no linter configuration. Changes are tested manually in-browser.

## Code Conventions

### HTML
- Each page is self-contained with inline `<style>` blocks (except stamp project which uses external CSS)
- Mobile-first responsive design using `@media` queries
- Proper semantic HTML5 with Open Graph meta tags for SEO
- Google AdSense script tags and ad units embedded in pages
- Naver and Google site verification meta tags on key pages

### CSS
- CSS custom properties (variables) for theming:
  ```css
  --primary: #0078d7;
  --secondary: #2d8659;
  --accent: #ff8c00;
  --bg-main: #f5f5f5;
  ```
- System font stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, ...`
- Shadow scale: `--shadow-sm`, `--shadow-md`, `--shadow-lg`
- `box-sizing: border-box` applied globally
- CSS Grid and Flexbox for layout
- Bandizip-inspired clean, professional design system in stamp project

### JavaScript
- 100% vanilla JS - no frameworks, no transpilation
- Client-side processing preferred (Canvas API, FileReader API)
- `sessionStorage` for passing data between pages
- `fetch` API for HTTP requests to Cloudflare Workers
- Drag & drop file upload support on conversion tools
- Language detection pattern:
  ```javascript
  const userLang = navigator.language || navigator.userLanguage;
  if (!userLang.includes('ko')) {
      window.location.href = 'en/index.html';
  }
  ```

### Bilingual Support
- Korean is the default language
- English versions live in `en/` subdirectories
- Automatic redirect based on `navigator.language`
- Each language version is a separate HTML file (not dynamic i18n)

## Key Algorithms

### Stamp Background Removal (`stamp/js/stamp.js`)
- 4-corner background color sampling
- Euclidean distance calculation for color matching
- Alpha blending for smooth edges
- Brightness filtering (threshold > 180) for white backgrounds

### HEIC Conversion (`iphone-heic/assets/app.js`)
- Client-side processing with optional API fallback
- PWA-capable with manifest and icons (32px-512px)

## Cloudflare Workers

`_worker.js` files route `/api/*` requests to the backend server. These are deployed alongside static files on Cloudflare Pages.

## Important Notes

- **No automated tests** - all testing is manual/browser-based
- **No linting or formatting tools** - code is manually formatted
- **No CI/CD pipeline** - deployment is manual
- **Duplicate code exists** between `stamp/` and `stamp/stamp-pages/` (keep both in sync if editing)
- **Duplicate code exists** between `web-projects/iphone-heic/` and `applications/iphoneheic/`
- **Privacy-first approach** - most tools process files entirely client-side
- `review_report.md` tracks ad placement compliance and QA items
- Copyright: 2005-2026 LeDeuxions

## Common Tasks

### Adding a new web tool
1. Create a directory under `web-projects/`
2. Add an `index.html` with inline styles or an external CSS file
3. Follow existing design patterns (responsive, bilingual, ad placements)
4. Add a link from `web-projects/index.html`
5. Update `sitemap.xml` with new pages

### Modifying the stamp tool
- Edit files in both `stamp/` and `stamp/stamp-pages/` to keep them in sync
- Core logic is in `js/stamp.js` and `js/pdf-stamp.js`
- Styling is in `css/style.css`

### Updating ads or analytics
- AdSense client ID: `ca-pub-2824624880449066`
- Ad units are embedded inline in HTML pages
- Check `review_report.md` for ad placement audit status
