#!/usr/bin/env bash
set -e

echo "🎨 서명 추출 페이지 디자인 리뉴얼 중..."

# stamp-ai-sign.html을 메인 페이지 스타일로 전면 교체
cat << 'HTML' > stamp-ai-sign.html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>서명 배경 제거 (AI Signature Extractor)</title>
    <link rel="stylesheet" href="style.css">
    <style>
        /* 기본 리셋 및 폰트 */
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background-color: #f8f9fa; color: #333; }
        
        /* 1. 헤더 (메인 페이지와 동일한 그라데이션) */
        .hero-section {
            background: linear-gradient(135deg, #0061f2 0%, #00ba94 100%);
            color: white;
            padding: 60px 20px 100px 20px; /* 하단 패딩을 길게 줘서 카드가 겹치게 */
            text-align: center;
        }
        .hero-title { font-size: 2.2rem; font-weight: bold; margin-bottom: 10px; }
        .hero-desc { font-size: 1.1rem; opacity: 0.9; font-weight: 300; }

        /* 2. 메인 컨테이너 (카드 레이아웃) */
        .container {
            max-width: 800px;
            margin: -60px auto 40px auto; /* 헤더 위로 살짝 올라오게 */
            padding: 0 20px;
        }
        
        .tool-card {
            background: white;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            padding: 40px;
            text-align: center;
        }

        /* 3. 파일 업로드 버튼 꾸미기 */
        .upload-btn-wrapper { margin-bottom: 30px; }
        .btn-upload {
            display: inline-block;
            background-color: #f1f3f5;
            color: #495057;
            padding: 15px 30px;
            border-radius: 50px;
            cursor: pointer;
            font-weight: bold;
            border: 2px dashed #ced4da;
            transition: all 0.3s;
        }
        .btn-upload:hover { background-color: #e9ecef; border-color: #adb5bd; }
        .btn-upload span { font-size: 1.2rem; margin-right: 8px; }
        #uploadInput { display: none; } /* 원래 못생긴 파일 input 숨김 */

        /* 4. 캔버스 및 컨트롤 */
        .canvas-container {
            margin: 20px auto;
            border: 1px solid #eee;
            background: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAH0lEQVQ4T2NkYGA4A8QgmAHzGV0eg4GhgXANGHPAAQCVmYEb520iEwAAAABJRU5ErkJggg=='); /* 투명 체크무늬 */
            border-radius: 8px;
            overflow: hidden;
            max-width: 100%;
            display: none; /* 초기엔 숨김 */
        }
        canvas { max-width: 100%; height: auto; display: block; }

        .controls {
            display: none; /* 초기엔 숨김 */
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            margin-top: 20px;
            text-align: left;
        }
        .control-group { margin-bottom: 15px; }
        .control-group label { font-weight: bold; font-size: 0.9rem; display: block; margin-bottom: 8px; }
        
        input[type=range] { width: 100%; cursor: pointer; }

        /* 5. 저장 버튼 */
        .btn-save {
            background: linear-gradient(135deg, #0061f2 0%, #00ba94 100%);
            color: white;
            border: none;
            padding: 15px 0;
            width: 100%;
            border-radius: 8px;
            font-size: 1.1rem;
            font-weight: bold;
            cursor: pointer;
            margin-top: 20px;
            box-shadow: 0 4px 15px rgba(0, 186, 148, 0.3);
            transition: transform 0.2s;
        }
        .btn-save:hover { transform: translateY(-2px); }

        /* 모바일 대응 */
        @media (max-width: 600px) {
            .hero-title { font-size: 1.8rem; }
            .tool-card { padding: 20px; }
        }

        /* 네비게이션 (간단 ver) */
        .nav-bar { padding: 15px 20px; text-align: left; background: white; border-bottom: 1px solid #eee; }
        .nav-logo { font-weight: bold; text-decoration: none; color: #333; font-size: 1.2rem; }
    </style>
</head>
<body>

    <nav class="nav-bar">
        <a href="index.html" class="nav-logo">🏠 홈으로</a>
    </nav>

    <header class="hero-section">
        <div class="hero-title">✍️ 서명 배경 제거 (AI Signature)</div>
        <div class="hero-desc">흐릿한 서명을 선명하게 만들고 투명 배경으로 저장하세요.</div>
    </header>

    <main class="container">
        <div class="tool-card">
            
            <div class="upload-btn-wrapper">
                <label for="uploadInput" class="btn-upload">
                    <span>📂</span> 서명 이미지 불러오기 (Click)
                </label>
                <input type="file" id="uploadInput" accept="image/*">
            </div>

            <div id="workspaceArea">
                <div class="canvas-container">
                    <canvas id="mainCanvas"></canvas>
                </div>

                <div class="controls" id="controlPanel">
                    <div class="control-group">
                        <label>🎚️ 선명도 조절 (Threshold): <span id="thresholdVal" style="color:#0061f2">150</span></label>
                        <input type="range" id="thresholdRange" min="0" max="255" value="150">
                    </div>

                    <div class="control-group">
                        <label style="cursor:pointer; display:flex; align-items:center; gap:10px;">
                            <input type="checkbox" id="bwMode" checked style="width:20px; height:20px;">
                            <span>🔲 흑백 모드 (검은색 잉크로 통일)</span>
                        </label>
                    </div>

                    <button onclick="downloadImage()" class="btn-save">💾 투명 PNG 서명 저장하기</button>
                </div>
            </div>

        </div>
    </main>

    <footer style="text-align: center; margin: 50px 0; color: #888; font-size: 0.9rem;">
        <a href="privacy.html" style="color: #666; text-decoration: none;">개인정보처리방침</a>
        <br><br>
        © 2025 Stamp Remover Tools
    </footer>

    <script>
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
                    
                    // UI 활성화
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
            
            const imageData = new ImageData(
                new Uint8ClampedArray(originalImageData.data),
                originalImageData.width,
                originalImageData.height
            );
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                
                const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

                if (brightness > threshold) {
                    data[i + 3] = 0; 
                } else {
                    data[i + 3] = 255; 
                    if (isBlackMode) {
                        data[i] = 0;
                        data[i + 1] = 0;
                        data[i + 2] = 0;
                    }
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

git add stamp-ai-sign.html
git commit -m "design: update sign tool ui to match index page"
git push origin main
echo "✅ 디자인 리뉴얼 완료! 브라우저 새로고침 해보세요."
