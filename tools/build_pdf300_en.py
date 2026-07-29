#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""PDF300 영어판 빌더 — index.html + pdf300.js + pdf300-server.js 를 en/ 로 번역 복제.
소스는 절대 건드리지 않음. 반복 실행 가능(idempotent: en/ 를 소스에서 매번 새로 생성)."""

import os, re, shutil, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'web-projects', 'pdf300')
DST = os.path.join(SRC, 'en')

# ---------------------------------------------------------------- JS 문자열
# 키에 따옴표를 포함해 정확히 문자열 리터럴만 치환 (코드/정규식 오염 방지)
JS = {
    "'위로'": "'Move up'",
    "'아래로'": "'Move down'",
    "'제거'": "'Remove'",
    "'제외'": "'Exclude'",
    "'좌'": "'Rotate left'",
    "'우'": "'Rotate right'",
    "'처리 중…'": "'Processing…'",
    "'완료 · '": "'Done · '",
    "'완료 · 메타데이터 제거됨'": "'Done · metadata removed'",
    "'완료'": "'Done'",
    "' 저장'": "' saved'",
    "'오류: '": "'Error: '",
    "'페이지'": "' pages'",
    "'페이지 더 있음'": "' more pages'",
    "'예: 1-'": "'e.g. 1-'",
    "'분할 중…'": "'Splitting…'",
    "'유효한 범위가 없습니다.'": "'No valid page range.'",
    "'개 파일'": "' files'",
    "'개 영역'": "' areas'",
    "'곳 서명'": "' placements'",
    "'개'": "' images'",
    "'자'": "' chars'",
    "'미리보기 생성 중…'": "'Generating preview…'",
    "'저장 중…'": "'Saving…'",
    "'남아있는 페이지가 없습니다.'": "'No pages left.'",
    "'자르는 중…'": "'Cropping…'",
    "'재구성 중…'": "'Rebuilding…'",
    "'페이지 번호 추가 중…'": "'Adding page numbers…'",
    "'워터마크 추가 중…'": "'Adding watermark…'",
    "'먼저 트레이에서 서명을 선택하세요.'": "'Pick a signature from the tray first.'",
    "'서명 삽입 중…'": "'Placing signature…'",
    "'변환 중…'": "'Converting…'",
    "'변환 중… ('": "'Converting… ('",
    "'PDF 생성 중…'": "'Building PDF…'",
    "' 준비됨'": "' ready'",
    "'텍스트 추출 중…'": "'Extracting text…'",
    "'추출 중… ('": "'Extracting… ('",
    "'클립보드에 복사되었습니다.'": "'Copied to clipboard.'",
    "'압축 중…'": "'Compressing…'",
    "'압축 중… ('": "'Compressing… ('",
    "'(없음)'": "'(none)'",
    "'메타데이터 제거 중…'": "'Removing metadata…'",
    # 큰 문자열 안에 박힌 HTML 조각 (따옴표 앵커가 안 먹는 것들)
    'title="위로"': 'title="Move up"',
    'title="아래로"': 'title="Move down"',
    'title="제거"': 'title="Remove"',
    'title="제외"': 'title="Exclude"',
    'title="좌"': 'title="Rotate left"',
    'title="우"': 'title="Rotate right"',
    '"status">미리보기 생성 중…</div>': '"status">Generating preview…</div>',
    "+ '페이지 더 있음</div>'": "+ ' more pages</div>'",
    "+ '페이지 · '": "+ ' pages · '",
    # server.js
    "'서버 오류 '": "'Server error '",
    "'서버 연결됨'": "'Server online'",
    "'서버 오프라인'": "'Server offline'",
    "'서버에 연결할 수 없습니다. 잠시 후 다시 시도하세요.'":
        "'Cannot reach the server. Please try again in a moment.'",
    "'서버에서 처리 중…'": "'Processing on server…'",
    "'자 인식'": "' characters recognized'",
    "'비밀번호를 입력하세요.'": "'Enter a password.'",
    "'행과 열은 1 이상이어야 합니다.'": "'Rows and columns must both be at least 1.'",
    "'워터마크 텍스트를 입력하세요.'": "'Enter watermark text.'",
}

# ---------------------------------------------------------------- HTML 문자열
HTML = {
    # --- nav / hero
    'aria-label="메뉴"': 'aria-label="Menu"',
    '>홈</a>': '>Home</a>',
    '>웹 도구</a>': '>Web Tools</a>',
    '>작품</a>': '>Work</a>',
    '>연락</a>': '>Contact</a>',
    '병합부터 OCR·암호화까지 — 가벼운 작업은 브라우저에서, 무거운 작업은 서버에서. 기본 도구는 파일을 절대 업로드하지 않습니다.':
        'From merging to OCR and encryption — light jobs run in your browser, heavy jobs on our server. '
        'The browser tools never upload your file.',

    # --- section headers
    '🔒 브라우저 도구': '🔒 Browser tools',
    '⚡ 고급 도구': '⚡ Advanced tools',
    '14 · 오프라인': '14 · offline',
    'OCR·암호화·복구처럼 무거운 작업은 pdf.ledeuxions.com 서버에서 처리합니다.':
        'Heavy jobs like OCR, encryption and repair are handled on our pdf.ledeuxions.com server.',
    '서버 확인 중…': 'Checking server…',
    '🔴 현재 서버에 연결할 수 없어 고급 도구를 사용할 수 없습니다. 위쪽 ':
        '🔴 The server is unreachable right now, so the advanced tools are unavailable. The ',
    '는 평소처럼 정상 작동합니다.': ' above keep working as usual.',
    '브라우저 도구': 'browser tools',

    # --- browser tool cards
    '>병합</h4>': '>Merge</h4>',
    '여러 PDF를 하나로': 'Combine several PDFs into one',
    '>분할</h4>': '>Split</h4>',
    '페이지 범위로 자르기': 'Cut by page range',
    '>회전·재정렬</h4>': '>Rotate &amp; reorder</h4>',
    '페이지 순서·방향': 'Page order and rotation',
    '>자르기</h4>': '>Crop</h4>',
    '여백 제거·트리밍': 'Trim margins',
    '2장·4장 합치기': '2 or 4 pages per sheet',
    '>페이지 번호</h4>': '>Page numbers</h4>',
    '자동 페이지 번호': 'Automatic numbering',
    '>워터마크</h4>': '>Watermark</h4>',
    '텍스트 워터마크': 'Text watermark',
    '>서명·도장</h4>': '>Signature &amp; stamp</h4>',
    '이미지를 PDF에 삽입': 'Drop an image onto the PDF',
    '>가림 (Redact)</h4>': '>Redact</h4>',
    '비밀 영역 검정 처리': 'Black out private areas',
    '>PDF → 이미지</h4>': '>PDF → Image</h4>',
    '페이지를 PNG/JPG로': 'Pages to PNG / JPG',
    '>이미지 → PDF</h4>': '>Image → PDF</h4>',
    '사진을 PDF로': 'Photos into a PDF',
    '>PDF → 텍스트</h4>': '>PDF → Text</h4>',
    '본문만 추출': 'Extract body text',
    '>압축</h4>': '>Compress</h4>',
    '이미지 모드 재인코딩': 'Image-mode re-encoding',
    '>메타데이터</h4>': '>Metadata</h4>',
    '제목·저자 편집': 'Edit title and author',

    # --- server tool cards
    '>고화질 압축</h4>': '>High-quality compress</h4>',
    '화질 유지하며 용량 축소': 'Smaller file, quality kept',
    '>OCR 텍스트 추출</h4>': '>OCR text extraction</h4>',
    '스캔 PDF에서 글자 인식': 'Read text from scanned PDFs',
    '>비밀번호 설정</h4>': '>Set password</h4>',
    'PDF 암호화 보호': 'Encrypt and protect a PDF',
    '>비밀번호 해제</h4>': '>Remove password</h4>',
    '>암호 제거</p>': '>Strip encryption</p>',
    '>메타데이터 제거</h4>': '>Remove metadata</h4>',
    '개인정보 완전 삭제': 'Erase hidden personal data',
    '>PDF 복구</h4>': '>Repair PDF</h4>',
    '손상된 파일 복원': 'Restore damaged files',
    '서버 정밀 삽입': 'Precise server-side insertion',
    '>N-up 모아찍기</h4>': '>N-up layout</h4>',
    '행·열 자유 배치': 'Any rows and columns',
    '>오피스 → PDF</h4>': '>Office → PDF</h4>',
    'Word·Excel·PPT 변환': 'Convert Word, Excel, PPT',
    '서버 워터마크 삽입': 'Server-side watermarking',

    # --- merge panel
    '<h2>PDF 병합</h2>': '<h2>Merge PDF</h2>',
    '여러 PDF를 순서대로 하나로 합칩니다.': 'Combine multiple PDFs into one, in order.',
    'PDF 파일을 끌어 놓거나': 'Drop PDF files here',
    '클릭해 선택': 'or click to browse',
    '병합하여 다운로드': 'Merge &amp; download',
    '💡 항목을 ▲▼ 버튼으로 순서를 바꿀 수 있습니다.': '💡 Reorder items with the ▲▼ buttons.',

    # --- split panel
    '<h2>PDF 분할</h2>': '<h2>Split PDF</h2>',
    '페이지 범위, 낱장, N장 묶음으로 분할합니다.': 'Split by page range, single pages, or fixed-size groups.',
    'PDF 한 개를 선택': 'Choose one PDF',
    '해 페이지 범위로 자릅니다.': ' to cut it by page range.',
    '>분할 모드</label>': '>Split mode</label>',
    '>페이지 범위로</option>': '>By page range</option>',
    '>한 페이지씩</option>': '>Every single page</option>',
    '>N 페이지마다</option>': '>Every N pages</option>',
    '>범위 (예: 1-3, 5, 7-10)</label>': '>Range (e.g. 1-3, 5, 7-10)</label>',
    '>묶음 크기</label>': '>Group size</label>',
    '분할하여 다운로드 (ZIP)': 'Split &amp; download (ZIP)',

    # --- organize panel
    '<h2>회전·재정렬</h2>': '<h2>Rotate &amp; reorder</h2>',
    '페이지별로 회전, 제외, 순서를 정리합니다.': 'Rotate, drop and reorder individual pages.',
    '<strong>PDF를 선택하면 페이지 미리보기</strong>가 펼쳐집니다.':
        '<strong>Choose a PDF</strong> and its page previews open up.',
    '>전체 회전</label>': '>Rotate all</label>',
    '저장하여 다운로드': 'Save &amp; download',

    # --- crop panel
    '<h2>여백 자르기</h2>': '<h2>Crop margins</h2>',
    '모든 페이지에 동일한 여백을 잘라냅니다.': 'Trim the same margin from every page.',
    '해 미리보기를 확인하세요.': ' to see the preview.',
    '<h3>여백 (mm)</h3>': '<h3>Margins (mm)</h3>',
    '>상</label>': '>Top</label>',
    '>하</label>': '>Bottom</label>',
    '>좌</label>': '>Left</label>',
    '>우</label>': '>Right</label>',
    '자르기 실행': 'Crop now',

    # --- n-up panel
    '<h2>N-up · 페이지 합치기</h2>': '<h2>N-up · pages per sheet</h2>',
    '두 페이지 또는 네 페이지를 한 장에 모아 인쇄용으로 만듭니다.':
        'Put two or four pages on a single sheet, ready to print.',
    '>레이아웃</label>': '>Layout</label>',
    '>방향</label>': '>Orientation</label>',
    '>자동</button>': '>Auto</button>',
    '>가로</button>': '>Landscape</button>',
    '>세로</button>': '>Portrait</button>',
    '>여백 (pt)</label>': '>Margin (pt)</label>',
    'N-up 만들기': 'Create N-up',

    # --- page numbers panel
    '<h2>페이지 번호 추가</h2>': '<h2>Add page numbers</h2>',
    '자동으로 페이지 번호를 삽입합니다.': 'Insert page numbers automatically.',
    '>위치</label>': '>Position</label>',
    '>형식</label>': '>Format</label>',
    '>크기 (pt)</label>': '>Size (pt)</label>',
    '>시작 번호</label>': '>Start number</label>',
    '페이지 번호 추가': 'Add page numbers',

    # --- watermark panel
    '<h2>워터마크 추가</h2>': '<h2>Add watermark</h2>',
    '전체 페이지에 텍스트 워터마크를 삽입합니다.': 'Stamp a text watermark across every page.',
    '해 워터마크를 추가합니다.': ' to add a watermark.',
    '>텍스트</label>': '>Text</label>',
    '>크기</label>': '>Size</label>',
    '>투명도(%)</label>': '>Opacity (%)</label>',
    '>색상</label>': '>Color</label>',
    '>각도</label>': '>Angle</label>',
    '워터마크 추가': 'Add watermark',

    # --- signature panel
    '<h2>서명·도장 삽입</h2>': '<h2>Insert signature or stamp</h2>',
    '서명 또는 도장 이미지(PNG)를 원하는 페이지의 원하는 위치에 배치합니다.':
        'Place a signature or stamp image (PNG) anywhere on any page.',
    '하세요. 그 다음 서명 이미지를 올리고 클릭해 배치합니다.':
        '. Then upload a signature image and click the preview to place it.',
    '<h3>서명 이미지</h3>': '<h3>Signature image</h3>',
    '투명 PNG를 권장합니다. 도장 추출기로 만든 PNG를 그대로 쓸 수 있어요.':
        'A transparent PNG works best. A PNG made with a stamp extractor can be used as-is.',
    '+ 추가': '+ Add',
    '>크기 (배율)</label>': '>Size (scale)</label>',
    '마지막 배치 취소': 'Undo last placement',
    '💡 트레이에서 서명을 선택한 뒤, 미리보기를 클릭하면 그 자리에 배치됩니다.':
        '💡 Pick a signature from the tray, then click the preview to drop it there.',

    # --- redact panel
    '<h2>가림 (Redact)</h2>': '<h2>Redact</h2>',
    '검정 사각형으로 비밀 영역을 영구히 가립니다.': 'Permanently cover private areas with black boxes.',
    '한 뒤, 미리보기에서 드래그해 영역을 지정하세요.': ', then drag on the preview to mark areas.',
    '현재 페이지 박스 모두 지우기': 'Clear every box on this page',
    '💡 드래그로 사각 영역을 그립니다. 동일 위치에 검정 사각형이 영구 삽입됩니다.':
        '💡 Drag to draw a rectangle. A black box is permanently burned in at that spot.',

    # --- pdf to image panel
    '<h2>PDF → 이미지</h2>': '<h2>PDF → Image</h2>',
    '페이지별로 PNG/JPG/WebP로 추출합니다.': 'Export each page as PNG, JPG or WebP.',
    '>해상도</label>': '>Resolution</label>',
    '>JPG/WebP 품질</label>': '>JPG / WebP quality</label>',
    '이미지로 추출 (ZIP)': 'Extract images (ZIP)',

    # --- image to pdf panel
    '<h2>이미지 → PDF</h2>': '<h2>Image → PDF</h2>',
    'JPG/PNG를 한 PDF로 묶습니다.': 'Bundle JPG / PNG files into one PDF.',
    '이미지를 끌어 놓거나': 'Drop images here',
    '>페이지 크기</label>': '>Page size</label>',
    '>이미지 크기에 맞춤</option>': '>Fit to image size</option>',
    '>자동</option>': '>Auto</option>',
    '>세로</option>': '>Portrait</option>',
    '>가로</option>': '>Landscape</option>',
    '>여백 (mm)</label>': '>Margin (mm)</label>',
    'PDF 만들기': 'Create PDF',

    # --- pdf to text panel
    '<h2>PDF → 텍스트</h2>': '<h2>PDF → Text</h2>',
    '본문 텍스트만 추출해서 .txt로 저장합니다. (스캔 이미지 PDF는 OCR 필요)':
        'Pulls out the body text and saves it as .txt. (Scanned image PDFs need OCR.)',
    '하면 텍스트를 추출합니다.': ' and its text is extracted.',
    'placeholder="추출된 텍스트가 여기에 표시됩니다…"': 'placeholder="Extracted text appears here…"',
    '>페이지 구분</label>': '>Page separator</label>',
    r'>폼피드 (\\f)</option>': r'>Form feed (\\f)</option>',
    '>빈 줄만</option>': '>Blank line only</option>',
    '텍스트 추출': 'Extract text',
    '.txt 다운로드': 'Download .txt',
    '📋 클립보드에 복사': '📋 Copy to clipboard',
    '클립보드에 복사': 'Copy to clipboard',

    # --- compress panel
    '<h2>압축 (이미지 모드)</h2>': '<h2>Compress (image mode)</h2>',
    '각 페이지를 이미지로 다시 그려 JPG로 압축한 PDF를 만듭니다. 텍스트 검색은 불가능해지지만 크기가 크게 줄어듭니다.':
        'Redraws every page as a JPG image, producing a far smaller PDF. Text search is lost in exchange.',
    '해 압축합니다.': ' to compress it.',
    '>압축 강도</label>': '>Compression level</label>',
    '>낮음</button>': '>Low</button>',
    '>중간</button>': '>Medium</button>',
    '>높음</button>': '>High</button>',
    '>극한</button>': '>Extreme</button>',
    '>최대 페이지 폭 (px)</label>': '>Max page width (px)</label>',
    '>JPG 품질</label>': '>JPG quality</label>',
    '압축 실행': 'Compress now',
    '⚠️ 압축 후에는 PDF가 이미지로 구성됩니다. 텍스트 선택·검색이 불가능합니다.':
        '⚠️ After compression the PDF is image-based — text selection and search will no longer work.',

    # --- metadata panel
    '<h2>메타데이터 편집</h2>': '<h2>Edit metadata</h2>',
    'PDF의 제목·저자·키워드 등 메타데이터를 보고 편집합니다.':
        'View and edit the title, author, keywords and other metadata of a PDF.',
    '<h3>현재 메타데이터</h3>': '<h3>Current metadata</h3>',
    '<h3>새 메타데이터</h3>': '<h3>New metadata</h3>',
    '>제목</label>': '>Title</label>',
    '>저자</label>': '>Author</label>',
    '>주제</label>': '>Subject</label>',
    '>키워드 (쉼표 구분)</label>': '>Keywords (comma separated)</label>',
    '모든 메타데이터 제거': 'Remove all metadata',

    # --- server: high quality compress
    '<h2>고화질 압축 ': '<h2>High-quality compress ',
    '서버에서 이미지를 재최적화해 화질 손실을 최소화하며 용량을 줄입니다.':
        'The server re-optimises the images, shrinking the file with minimal quality loss.',
    '해 서버 압축을 실행합니다.': ' to run server-side compression.',
    '파일이 서버로 전송되어 처리 후 즉시 반환됩니다.':
        'Your file is sent to the server, processed, and returned right away.',

    # --- server: OCR
    '<h2>OCR 텍스트 추출 ': '<h2>OCR text extraction ',
    '스캔되거나 이미지로 된 PDF에서 글자를 인식해 텍스트로 변환합니다.':
        'Recognises characters in scanned or image-only PDFs and turns them into text.',
    '해 글자를 인식합니다.': ' to recognise its text.',
    'placeholder="인식된 텍스트가 여기에 표시됩니다…"': 'placeholder="Recognised text appears here…"',
    '>인식 언어</label>': '>Recognition language</label>',
    '>한국어 + 영어</option>': '>Korean + English</option>',
    '>한국어</option>': '>Korean</option>',
    '>영어</option>': '>English</option>',
    '>일본어</option>': '>Japanese</option>',
    '>중국어(간체)</option>': '>Chinese (Simplified)</option>',

    # --- server: protect / unlock
    '<h2>비밀번호 설정 ': '<h2>Set password ',
    'PDF를 열 때 비밀번호를 요구하도록 암호화합니다.': 'Encrypt the PDF so a password is required to open it.',
    '>비밀번호</label>': '>Password</label>',
    'placeholder="설정할 비밀번호"': 'placeholder="Password to set"',
    '암호화하여 다운로드': 'Encrypt &amp; download',
    '<h2>비밀번호 해제 ': '<h2>Remove password ',
    '비밀번호를 알고 있는 PDF의 암호를 제거합니다.': 'Strip the password from a PDF you already know the password for.',
    '암호화된 PDF를 선택': 'Choose an encrypted PDF',
    '>현재 비밀번호</label>': '>Current password</label>',
    'placeholder="PDF 비밀번호"': 'placeholder="PDF password"',
    '암호 제거하여 다운로드': 'Remove password &amp; download',

    # --- server: strip / repair
    '<h2>메타데이터 제거 ': '<h2>Remove metadata ',
    '제목·저자·생성도구 등 숨은 정보를 서버에서 완전히 제거합니다.':
        'Completely wipes hidden info such as title, author and producer on the server.',
    '메타데이터 제거': 'Remove metadata',
    '<h2>PDF 복구 ': '<h2>Repair PDF ',
    '열리지 않거나 손상된 PDF의 구조를 재구성해 복원을 시도합니다.':
        'Rebuilds the internal structure of a corrupt or unopenable PDF and tries to recover it.',
    '손상된 PDF를 선택': 'Choose a damaged PDF',
    '복구 시도': 'Try repair',

    # --- server: numbers / nup / office / watermark
    '<h2>페이지 번호 ': '<h2>Page numbers ',
    '서버에서 페이지 번호를 정밀하게 삽입합니다.': 'Inserts page numbers precisely, on the server.',
    '>하단 중앙</option>': '>Bottom center</option>',
    '>하단 우측</option>': '>Bottom right</option>',
    '>하단 좌측</option>': '>Bottom left</option>',
    '>상단 중앙</option>': '>Top center</option>',
    '>상단 우측</option>': '>Top right</option>',
    '>상단 좌측</option>': '>Top left</option>',
    '<h2>N-up 모아찍기 ': '<h2>N-up layout ',
    '여러 페이지를 한 장에 행·열로 배치합니다.': 'Arrange several pages on one sheet in rows and columns.',
    '>행 (rows)</label>': '>Rows</label>',
    '>열 (cols)</label>': '>Columns</label>',
    '<h2>오피스 → PDF ': '<h2>Office → PDF ',
    'Word·Excel·PowerPoint·HWP 문서를 PDF로 변환합니다.':
        'Convert Word, Excel, PowerPoint and HWP documents into PDF.',
    '문서를 선택': 'Choose a document',
    '.docx · .xlsx · .pptx · .doc · .hwp · .odt 등': '.docx · .xlsx · .pptx · .doc · .hwp · .odt and more',
    'PDF로 변환': 'Convert to PDF',
    '<h2>워터마크 ': '<h2>Watermark ',
    '서버에서 전체 페이지에 텍스트 워터마크를 삽입합니다.':
        'Stamps a text watermark across every page, on the server.',
    '>워터마크 텍스트</label>': '>Watermark text</label>',

    # --- shared short labels / buttons (anchored)
    '<h3>설정</h3>': '<h3>Settings</h3>',
    '<h3>실행</h3>': '<h3>Run</h3>',
    '>출력 파일명</label>': '>Output filename</label>',
    'PDF를 선택': 'Choose a PDF',
    '하세요.': '.',
    '>저장</button>': '>Save</button>',
    '>서버</span>': '>Server</span>',

    # --- footer
    '14 브라우저 + 10 서버 도구': '14 browser + 10 server tools',
    '← 다른 도구': '← More tools',
}


def apply(text, table):
    """긴 키부터 치환 (짧은 키가 긴 문구를 깨뜨리지 않게)."""
    for k in sorted(table, key=len, reverse=True):
        text = text.replace(k, table[k])
    return text


def main():
    os.makedirs(DST, exist_ok=True)

    # ---------- JS 2개 ----------
    for name in ('pdf300.js', 'pdf300-server.js'):
        src = open(os.path.join(SRC, name), encoding='utf-8').read()
        out = apply(src, JS)
        open(os.path.join(DST, name), 'w', encoding='utf-8').write(out)

    # ---------- index.html ----------
    html = open(os.path.join(SRC, 'index.html'), encoding='utf-8').read()

    # 0) 한국어 전용 블록 제거 (FAQ · JSON-LD)
    #    영어판 것은 build_pdf300_root.py 가 따로 주입한다. 여기 두면 한국어가 그대로 새어나간다.
    for tag in ('FAQ:KO', 'LDJSON:KO'):
        s = html.find('<!-- %s:START' % tag)
        e = html.find('<!-- %s:END -->' % tag)
        if s != -1 and e != -1:
            html = html[:s] + html[e + len('<!-- %s:END -->' % tag):]

    # 1) head (SEO) 통째 교체
    old_head = html[html.index('<meta name="description"'):html.index('</title>') + len('</title>')]
    new_head = (
        '<meta name="description" content="PDF300 — 24 free PDF tools in one page. Merge, split, '
        'rotate, crop, compress, add page numbers, watermark, sign, redact, convert to image or text, '
        'plus server-side OCR, password protection and repair. Browser tools never upload your file.">\n'
        '<meta name="keywords" content="merge pdf, split pdf, compress pdf, rotate pdf, crop pdf, '
        'pdf to image, image to pdf, pdf to text, pdf watermark, sign pdf, redact pdf, pdf ocr, '
        'unlock pdf, protect pdf, repair pdf, office to pdf, free pdf tools, ilovepdf alternative">\n'
        '<link rel="canonical" href="https://pdf300.com/">\n'
        '<link rel="alternate" hreflang="en" href="https://pdf300.com/">\n'
        '<link rel="alternate" hreflang="ko" href="https://ledeuxions.com/web-projects/pdf300/">\n'
        '<link rel="alternate" hreflang="x-default" href="https://pdf300.com/">\n'
        '<meta property="og:type" content="website">\n'
        '<meta property="og:locale" content="en_US">\n'
        '<meta property="og:url" content="https://pdf300.com/">\n'
        '<meta property="og:title" content="PDF300 — 24 free PDF tools, no upload">\n'
        '<meta property="og:description" content="Merge, split, compress, sign, redact and convert PDFs '
        'right in your browser. Your files never leave your device for the 14 browser tools.">\n'
        '<meta name="twitter:card" content="summary_large_image">\n'
        '<meta name="twitter:title" content="PDF300 — 24 free PDF tools, no upload">\n'
        '<meta name="twitter:description" content="Merge, split, compress, sign, redact and convert PDFs '
        'right in your browser.">\n'
        '<title>PDF300 — 24 Free PDF Tools (Merge, Split, Compress, OCR)</title>'
    )
    assert old_head in html
    html = html.replace(old_head, new_head, 1)

    # 2) lang 속성
    html = html.replace('<html lang="ko">', '<html lang="en">', 1)

    # 3) 상대경로: en/ 한 단계 깊어짐
    html = html.replace('href="../../assets/', 'href="../../../assets/')
    html = html.replace('src="../../assets/', 'src="../../../assets/')
    html = html.replace('href="/web-projects/">← ', 'href="/web-projects/">← ')  # no-op, 명시용

    # 4) 본문 번역
    html = apply(html, HTML)

    # 5) OCR 기본 언어를 English 로 (해외 타겟)
    html = html.replace('<option value="kor+eng" selected>Korean + English</option>',
                        '<option value="kor+eng">Korean + English</option>')
    html = html.replace('<option value="eng">English</option>',
                        '<option value="eng" selected>English</option>')

    # 6) 언어 전환 링크 (nav 마지막에)
    html = html.replace(
        '<a href="/contact/" class="nav-link" data-nav-link>Contact</a>',
        '<a href="/contact/" class="nav-link" data-nav-link>Contact</a>\n'
        '            <a href="https://ledeuxions.com/web-projects/pdf300/" class="nav-link" '
        'hreflang="ko" data-nav-link>한국어</a>', 1)

    # 6-b) 신뢰 배지 — 경쟁사 대비 우리 차별점을 첫 화면에 명시.
    #      (리서치: 신뢰·사회적 증거 있으면 체험 시작률 2배. Smallpdf=워터마크·2회, iLovePDF=15MB 제한)
    lead_end = '</p>'
    lead_start = html.find('<p class="lead">')
    if lead_start != -1:
        cut = html.find(lead_end, lead_start) + len(lead_end)
        chip_html = (
            '\n        <ul class="trust-row" aria-label="Why PDF300">'
            '<li>🔒 Files never uploaded</li>'
            '<li>✅ No sign-up</li>'
            '<li>🚫 No watermark</li>'
            '<li>♾️ Browser tools unlimited</li>'
            '</ul>')
        html = html[:cut] + chip_html + html[cut:]
        html = html.replace('</style>', """
    .trust-row{list-style:none;display:flex;flex-wrap:wrap;gap:10px;justify-content:center;
        margin:var(--space-4,18px) 0 0;padding:0;}
    .trust-row li{font-size:.82rem;color:var(--text-secondary,#B7B0A4);
        background:var(--bg-card,#1E1A16);border:1px solid var(--border,rgba(255,255,255,.08));
        border-radius:999px;padding:6px 14px;white-space:nowrap;}
    @media (max-width:640px){.trust-row{gap:6px}.trust-row li{font-size:.75rem;padding:5px 10px}}
</style>""", 1)

    # 7) 얼리 액세스 이메일 수집 스크립트 (영어판 전용, 결제 오픈 전 한시 운영)
    html = html.replace(
        '<script src="pdf300-server.js"></script>',
        '<script src="paywall.js"></script>\n'
        '<script src="pdf300-server.js"></script>\n'
        '<script src="early-access.js"></script>\n'
        '<script src="promo.js"></script>', 1)

    open(os.path.join(DST, 'index.html'), 'w', encoding='utf-8').write(html)

    # ---------- 검증: 남은 한글 ----------
    print('=== leftover Korean ===')
    leftovers = 0
    for name in ('index.html', 'pdf300.js', 'pdf300-server.js'):
        p = os.path.join(DST, name)
        for i, line in enumerate(open(p, encoding='utf-8'), 1):
            if re.search(r'[가-힣]', line):
                leftovers += 1
                print('%s:%d: %s' % (name, i, line.rstrip()[:160]))
    print('total leftover lines: %d' % leftovers)


if __name__ == '__main__':
    main()
