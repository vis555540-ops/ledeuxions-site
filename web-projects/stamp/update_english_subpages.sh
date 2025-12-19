#!/usr/bin/env bash
set -e

echo "🌍 영어 서브 페이지(기능 페이지) 생성 중..."

# 1. 서명 추출기 영문판 (stamp-ai-sign_en.html)
# 기존 디자인을 유지하되 텍스트만 영어로 변경합니다.
cat << 'HTML' > stamp-ai-sign_en.html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Signature Background Remover (AI)</title>
    <link rel="stylesheet" href="style.css">
    <style>
        /* 메인 스타일 재사용 + 영어 폰트 */
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f8f9fa; color: #333; }
        
        .hero-section {
            background: linear-gradient(135deg, #0056b3 0%, #004494 100%);
            color: white;
            padding: 60px 20px 100px 20px;
            text-align: center;
        }
        .hero-title { font-size: 2.2rem; font-weight: bold; margin-bottom: 10px; }
        .hero-desc { font-size: 1.1rem; opacity: 0.9; font-weight: 300; }

        .container { max-width: 800px; margin: -60px auto 40px auto; padding: 0 20px; }
        .tool-card { background: white; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); padding: 40px; text-align: center; }

        .upload-btn-wrapper { margin-bottom: 30px; }
        .btn-upload {
            display: inline-block; background-color: #f1f3f5; color: #495057; padding: 15px 30px;
            border-radius: 50px; cursor: pointer; font-weight: bold; border: 2px dashed #ced4da; transition: all 0.3s;
        }
        .btn-upload:hover { background-color: #e9ecef; border-color: #adb5bd; }
        .btn-upload span { font-size: 1.2rem; margin-right: 8px; }
        #uploadInput { display: none; }

        .canvas-container {
            margin: 20px auto; border: 1px solid #eee;
            background: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAH0lEQVQ4T2NkYGA4A8QgmAHzGV0eg4GhgXANGHPAAQCVmYEb520iEwAAAABJRU5ErkJggg==');
            border-radius: 8px; overflow: hidden; max-width: 100%; display: none;
        }
        canvas { max-width: 100%; height: auto; display: block; }

        .controls { display: none; background: #f8f9fa; padding: 20px; border-radius: 10px; margin-top: 20px; text-align: left; }
        .control-group { margin-bottom: 15px; }
        .control-group label { font-weight: bold; font-size: 0.9rem; display: block; margin-bottom: 8px; }
        input[type=range] { width: 100%; cursor: pointer; }

        .btn-save {
            background: linear-gradient(135deg, #0056b3 0%, #004494 100%); color: white; border: none; padding: 15px 0; width: 100%;
            border-radius: 8px; font-size: 1.1rem; font-weight: bold; cursor: pointer; margin-top: 20px;
            box-shadow: 0 4px 15px rgba(0, 86, 179, 0.3); transition: transform 0.2s;
        }
        .btn-save:hover { transform: translateY(-2px); }

        .nav-bar { padding: 15px 20px; text-align: left; background: white; border-bottom: 1px solid #eee; }
        .nav-logo { font-weight: bold; text-decoration: none; color: #333; font-size: 1.2rem; }
    </style>
</head>
<body>
    <nav class="nav-bar">
        <a href="index_en.html" class="nav-logo">🏠 Home</a>
    </nav>

    <header class="hero-section">
        <div class="hero-title">✍️ Signature Background Remover</div>
        <div class="hero-desc">Make your handwritten signature transparent instantly.</div>
    </header>

    <main class="container">
        <div class="tool-card">
            <div class="upload-btn-wrapper">
                <label for="uploadInput" class="btn-upload">
                    <span>📂</span> Upload Signature Image (Click)
                </label>
                <input type="file" id="uploadInput" accept="image/*">
            </div>

            <div id="workspaceArea">
                <div class="canvas-container">
                    <canvas id="mainCanvas"></canvas>
                </div>

                <div class="controls" id="controlPanel">
                    <div class="control-group">
                        <label>🎚️ Threshold Adjustment: <span id="thresholdVal" style="color:#0056b3">150</span></label>
                        <input type="range" id="thresholdRange" min="0" max="255" value="150">
                    </div>

                    <div class="control-group">
                        <label style="cursor:pointer; display:flex; align-items:center; gap:10px;">
                            <input type="checkbox" id="bwMode" checked style="width:20px; height:20px;">
                            <span>🔲 B&W Mode (Force Black Ink)</span>
                        </label>
                    </div>

                    <button onclick="downloadImage()" class="btn-save">💾 Save Transparent PNG</button>
                </div>
            </div>
        </div>
    </main>

    <footer style="text-align: center; margin: 50px 0; color: #888; font-size: 0.9rem;">
        <a href="privacy_en.html" style="color: #666; text-decoration: none;">Privacy Policy</a>
        <br><br>
        © 2025 Signature Extractor Tools
    </footer>

    <script>
        // Logic same as Korean version
        const uploadInput = document.getElementById('uploadInput');
        const canvas = document.getElementById('mainCanvas');
        const ctx = canvas.getContext('2d');
        const thresholdRange = document.getElementById('thresholdRange');
        const thresholdVal = document.getElementById('thresholdVal');
        const bwMode = document.getElementById('bwMode');
        const controlPanel = document.getElementById('controlPanel');
        const canvasContainer = document.querySelector('.canvas-container');
        
        let originalImageData = null; 

        uploadInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = new Image();
                img.onload = function() {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    canvasContainer.style.display = 'block';
                    controlPanel.style.display = 'block';
                    applyThreshold();
                }
                img.src = event.target.result;
            }
            reader.readAsDataURL(file);
        });

        thresholdRange.addEventListener('input', function() {
            thresholdVal.innerText = this.value;
            applyThreshold();
        });
        
        bwMode.addEventListener('change', applyThreshold);

        function applyThreshold() {
            if (!originalImageData) return;
            const threshold = parseInt(thresholdRange.value);
            const isBlackMode = bwMode.checked;
            const imageData = new ImageData(new Uint8ClampedArray(originalImageData.data), originalImageData.width, originalImageData.height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                const brightness = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                if (brightness > threshold) {
                    data[i + 3] = 0; 
                } else {
                    data[i + 3] = 255; 
                    if (isBlackMode) { data[i] = 0; data[i + 1] = 0; data[i + 2] = 0; }
                }
            }
            ctx.putImageData(imageData, 0, 0);
        }

        function downloadImage() {
            const link = document.createElement('a');
            link.download = 'signature_transparent.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        }
    </script>
</body>
</html>
HTML

# 2. 개인정보처리방침 영문판 (privacy_en.html)
cat << 'HTML' > privacy_en.html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Privacy Policy</title>
    <style>
        body { font-family: sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; color: #333; }
        h1 { border-bottom: 2px solid #eee; padding-bottom: 10px; }
        h2 { margin-top: 30px; font-size: 1.2rem; }
    </style>
</head>
<body>
    <h1>Privacy Policy</h1>
    <p>We value your privacy. This policy explains how 'Signature Extractor' handles your data.</p>
    
    <h2>1. No Server Storage</h2>
    <p>This service operates <strong>100% Client-side</strong>. Your images are processed entirely within your browser and are <strong>never uploaded</strong> to our servers. Your data disappears when you close the tab.</p>

    <h2>2. Cookies & Ads</h2>
    <p>We may use Google AdSense to serve ads. Google may use cookies to serve ads based on your prior visits to our website.</p>

    <h2>3. Contact</h2>
    <p>If you have any questions, please contact us via the link in the footer.</p>
    
    <div style="margin-top:50px; text-align:center;">
        <a href="index_en.html" style="text-decoration:none; color:blue;">← Back to Home</a>
    </div>
</body>
</html>
HTML

# 3. 도장 툴 영문판 (welcome_en.html)
# 기존 welcome.html을 복사한 뒤, 주요 한글 단어를 영어로 치환합니다.
if [ -f welcome.html ]; then
    cp welcome.html welcome_en.html
    # 한글 -> 영어 치환 (Perl 사용)
    perl -pi -e 's/도장 추출기/Stamp Extractor/g' welcome_en.html
    perl -pi -e 's/도장 만들기/Create Stamp/g' welcome_en.html
    perl -pi -e 's/이미지 선택/Select Image/g' welcome_en.html
    perl -pi -e 's/파일 선택/Choose File/g' welcome_en.html
    perl -pi -e 's/저장/Save/g' welcome_en.html
    perl -pi -e 's/다운로드/Download/g' welcome_en.html
    perl -pi -e 's/메인으로/Home/g' welcome_en.html
    perl -pi -e 's/돌아가기/Back/g' welcome_en.html
    perl -pi -e 's/index.html/index_en.html/g' welcome_en.html
else
    echo "⚠️ welcome.html 파일이 없어 영문 변환을 건너뜁니다."
fi

# 4. 영어 메인 페이지(index_en.html) 링크 수정
# 기존 링크들을 새로 만든 _en.html 파일들로 교체합니다.
perl -pi -e 's/stamp-ai-sign.html/stamp-ai-sign_en.html/g' index_en.html
perl -pi -e 's/welcome.html/welcome_en.html/g' index_en.html
perl -pi -e 's/privacy.html/privacy_en.html/g' index_en.html

git add .
git commit -m "feat: add english subpages and update links"
git push origin main

echo "✅ 모든 영어 페이지 생성 및 연결 완료!"
