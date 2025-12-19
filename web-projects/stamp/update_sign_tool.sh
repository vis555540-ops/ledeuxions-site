#!/usr/bin/env bash
set -e

echo "✍️ 서명 추출기(슬라이더 포함) 기능 업데이트 중..."

# stamp-ai-sign.html 파일을 새로 작성합니다.
cat << 'HTML' > stamp-ai-sign.html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>서명 추출 (AI Signature Extractor)</title>
    <link rel="stylesheet" href="style.css">
    <style>
        /* 이 페이지 전용 스타일 */
        .workspace { display: flex; flex-direction: column; align-items: center; gap: 20px; padding: 20px; }
        .canvas-container { 
            max-width: 100%; 
            border: 2px dashed #ccc; 
            padding: 10px; 
            background: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAH0lEQVQ4T2NkYGA4A8QgmAHzGV0eg4GhgXANGHPAAQCVmYEb520iEwAAAABJRU5ErkJggg=='); /* 투명 배경 체크무늬 */
        }
        canvas { max-width: 100%; height: auto; }
        
        .controls { 
            width: 100%; 
            max-width: 500px; 
            background: #fff; 
            padding: 20px; 
            border-radius: 12px; 
            box-shadow: 0 4px 15px rgba(0,0,0,0.1); 
        }
        .control-group { margin-bottom: 15px; text-align: left; }
        .control-group label { font-weight: bold; display: block; margin-bottom: 5px; }
        input[type="range"] { width: 100%; cursor: pointer; }
        
        .btn-action { background-color: #007bff; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 1rem; font-weight: bold; width: 100%; margin-top: 10px; }
        .btn-action:hover { background-color: #0056b3; }
        .file-upload { margin-bottom: 20px; }
    </style>
</head>
<body>

    <header style="text-align:center; padding: 30px 20px;">
        <h1>✍️ 서명 배경 제거 (Signature Extractor)</h1>
        <p>슬라이더를 조절하여 서명을 선명하게 만드세요.</p>
    </header>

    <div class="workspace">
        <div class="file-upload">
            <input type="file" id="uploadInput" accept="image/*" class="btn-primary">
        </div>

        <div class="canvas-container" id="canvasArea" style="display:none;">
            <canvas id="mainCanvas"></canvas>
        </div>

        <div class="controls" id="controlPanel" style="display:none;">
            <div class="control-group">
                <label for="thresholdRange">🎚️ 감도 조절 (Threshold): <span id="thresholdVal">150</span></label>
                <input type="range" id="thresholdRange" min="0" max="255" value="150">
                <small style="color:#666;">왼쪽: 더 많이 남김 / 오른쪽: 배경 더 제거</small>
            </div>

            <div class="control-group">
                <label>
                    <input type="checkbox" id="bwMode" checked> 🔲 흑백 모드 (서명을 검은색으로 통일)
                </label>
            </div>

            <button onclick="downloadImage()" class="btn-action">💾 투명 PNG 저장하기</button>
        </div>
    </div>

    <div style="text-align:center; margin-top:30px;">
        <a href="index.html">← 메인으로 돌아가기</a>
    </div>

    <script>
        const uploadInput = document.getElementById('uploadInput');
        const canvas = document.getElementById('mainCanvas');
        const ctx = canvas.getContext('2d');
        const thresholdRange = document.getElementById('thresholdRange');
        const thresholdVal = document.getElementById('thresholdVal');
        const bwMode = document.getElementById('bwMode');
        
        let originalImageData = null; // 원본 데이터 저장용

        // 1. 이미지 업로드 처리
        uploadInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(event) {
                const img = new Image();
                img.onload = function() {
                    // 캔버스 크기 맞춤
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    
                    // 원본 데이터 저장 (슬라이더 조절 시 깨짐 방지)
                    originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    
                    // UI 표시
                    document.getElementById('canvasArea').style.display = 'block';
                    document.getElementById('controlPanel').style.display = 'block';
                    
                    // 최초 1회 실행
                    applyThreshold();
                }
                img.src = event.target.result;
            }
            reader.readAsDataURL(file);
        });

        // 2. 슬라이더 및 체크박스 이벤트
        thresholdRange.addEventListener('input', function() {
            thresholdVal.innerText = this.value;
            applyThreshold();
        });
        
        bwMode.addEventListener('change', applyThreshold);

        // 3. 핵심 알고리즘: Thresholding (배경 제거)
        function applyThreshold() {
            if (!originalImageData) return;

            const threshold = parseInt(thresholdRange.value);
            const isBlackMode = bwMode.checked;

            // 원본에서 복사본 생성 (원본 훼손 방지)
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
                
                // 밝기 계산 (사람 눈에 맞는 공식)
                const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

                if (brightness > threshold) {
                    // 밝으면(배경이면) 투명하게
                    data[i + 3] = 0; 
                } else {
                    // 어두우면(글자면) 불투명하게
                    data[i + 3] = 255;
                    
                    if (isBlackMode) {
                        // 흑백 모드면 강제 검은색
                        data[i] = 0;
                        data[i + 1] = 0;
                        data[i + 2] = 0;
                    }
                }
            }
            
            ctx.putImageData(imageData, 0, 0);
        }

        // 4. 다운로드 기능
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
git commit -m "feat: add threshold slider and bw mode to sign tool"
git push origin main
echo "✅ 서명 추출기 업데이트 완료!"
