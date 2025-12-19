// 도장 PNG 추출 기능
document.addEventListener('DOMContentLoaded', function() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const spinner = document.getElementById('spinner');
    const resultArea = document.getElementById('resultArea');
    const resultCanvas = document.getElementById('resultCanvas');
    const downloadBtn = document.getElementById('downloadBtn');
    const resetBtn = document.getElementById('resetBtn');

    // 업로드 영역 클릭
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    // 파일 선택
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            processImage(file);
        }
    });

    // 드래그 앤 드롭
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');

        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            processImage(file);
        }
    });

    // 이미지 처리
    function processImage(file) {
        spinner.classList.add('active');
        resultArea.classList.remove('active');

        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                removeBackground(img);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // 배경 제거 (개선된 색상 기반 알고리즘)
    function removeBackground(img) {
        const canvas = resultCanvas;
        const ctx = canvas.getContext('2d');

        // 캔버스 크기 설정
        canvas.width = img.width;
        canvas.height = img.height;

        // 이미지 그리기
        ctx.drawImage(img, 0, 0);

        // 이미지 데이터 가져오기
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // 배경색 샘플링 (네 모서리 평균)
        const corners = [
            [0, 0], // 좌상
            [canvas.width - 1, 0], // 우상
            [0, canvas.height - 1], // 좌하
            [canvas.width - 1, canvas.height - 1] // 우하
        ];

        let bgR = 0, bgG = 0, bgB = 0;
        corners.forEach(([x, y]) => {
            const idx = (y * canvas.width + x) * 4;
            bgR += data[idx];
            bgG += data[idx + 1];
            bgB += data[idx + 2];
        });
        bgR = Math.round(bgR / 4);
        bgG = Math.round(bgG / 4);
        bgB = Math.round(bgB / 4);

        // 임계값 설정 (흰색 배경 기준)
        const threshold = 80;

        // 픽셀 순회하며 배경 제거
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // 배경색과의 유클리드 거리 계산
            const diffR = r - bgR;
            const diffG = g - bgG;
            const diffB = b - bgB;
            const distance = Math.sqrt(diffR * diffR + diffG * diffG + diffB * diffB);

            // 흰색에 가까운 픽셀 제거 (도장은 보통 빨강/파랑/검정)
            const brightness = (r + g + b) / 3;

            if (distance < threshold && brightness > 180) {
                // 배경으로 판단 - 투명하게
                data[i + 3] = 0;
            } else if (distance < threshold * 1.5 && brightness > 180) {
                // 경계 부분 - 부드럽게 처리
                const alpha = Math.max(0, 255 * (1 - (threshold * 1.5 - distance) / (threshold * 0.5)));
                data[i + 3] = Math.min(data[i + 3], alpha);
            }
            // 도장 부분은 그대로 유지
        }

        // 처리된 이미지 데이터 적용
        ctx.putImageData(imageData, 0, 0);

        // UI 업데이트
        spinner.classList.remove('active');
        resultArea.classList.add('active');
    }

    // PNG 다운로드
    downloadBtn.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = 'stamp_' + Date.now() + '.png';
        link.href = resultCanvas.toDataURL('image/png');
        link.click();
    });

    // 다시 시작
    resetBtn.addEventListener('click', () => {
        fileInput.value = '';
        resultArea.classList.remove('active');
        spinner.classList.remove('active');
    });
});
