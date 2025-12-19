// PDF 도장 삽입 기능
document.addEventListener('DOMContentLoaded', function() {
    const { PDFDocument } = PDFLib;

    const pdfUploadArea = document.getElementById('pdfUploadArea');
    const pdfInput = document.getElementById('pdfInput');
    const stampUploadSection = document.getElementById('stampUploadSection');
    const stampUploadArea = document.getElementById('stampUploadArea');
    const stampInput = document.getElementById('stampInput');
    const positionSection = document.getElementById('positionSection');
    const insertBtn = document.getElementById('insertBtn');
    const spinner = document.getElementById('spinner');
    const resultArea = document.getElementById('resultArea');
    const downloadBtn = document.getElementById('downloadBtn');
    const resetBtn = document.getElementById('resetBtn');

    let pdfBytes = null;
    let stampImageBytes = null;
    let stampImageType = null;
    let modifiedPdfBytes = null;

    // PDF 업로드 영역 클릭
    pdfUploadArea.addEventListener('click', () => {
        pdfInput.click();
    });

    // PDF 파일 선택
    pdfInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async function(event) {
                pdfBytes = new Uint8Array(event.target.result);
                pdfUploadArea.innerHTML = `
                    <div style="color: var(--success-color);">
                        <svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="margin: 0 auto 0.5rem;">
                            <path d="M5 13l4 4L19 7"></path>
                        </svg>
                        <h4>PDF 업로드 완료</h4>
                        <p style="color: #6b7280; margin-top: 0.5rem;">${file.name}</p>
                    </div>
                `;
                stampUploadSection.style.display = 'block';
            };
            reader.readAsArrayBuffer(file);
        }
    });

    // 도장 업로드 영역 클릭
    stampUploadArea.addEventListener('click', () => {
        stampInput.click();
    });

    // 도장 파일 선택
    stampInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            stampImageType = file.type;
            const reader = new FileReader();
            reader.onload = function(event) {
                stampImageBytes = new Uint8Array(event.target.result);
                stampUploadArea.innerHTML = `
                    <div style="color: var(--success-color);">
                        <svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="margin: 0 auto 0.5rem;">
                            <path d="M5 13l4 4L19 7"></path>
                        </svg>
                        <h4>도장 업로드 완료</h4>
                        <p style="color: #6b7280; margin-top: 0.5rem;">${file.name}</p>
                    </div>
                `;
                positionSection.style.display = 'block';
            };
            reader.readAsArrayBuffer(file);
        }
    });

    // 도장 삽입
    insertBtn.addEventListener('click', async () => {
        if (!pdfBytes || !stampImageBytes) {
            alert('PDF와 도장 이미지를 모두 업로드해주세요.');
            return;
        }

        spinner.classList.add('active');
        resultArea.classList.remove('active');

        try {
            // PDF 문서 로드
            const pdfDoc = await PDFDocument.load(pdfBytes);

            // 도장 이미지 임베드
            let stampImage;
            if (stampImageType === 'image/png') {
                stampImage = await pdfDoc.embedPng(stampImageBytes);
            } else {
                stampImage = await pdfDoc.embedJpg(stampImageBytes);
            }

            // 설정 값 가져오기
            const pageNum = parseInt(document.getElementById('pageNumber').value) - 1;
            const x = parseInt(document.getElementById('xPosition').value);
            const y = parseInt(document.getElementById('yPosition').value);
            const size = parseInt(document.getElementById('stampSize').value);

            // 페이지 가져오기
            const pages = pdfDoc.getPages();
            if (pageNum < 0 || pageNum >= pages.length) {
                alert(`유효하지 않은 페이지 번호입니다. 1부터 ${pages.length} 사이의 값을 입력하세요.`);
                spinner.classList.remove('active');
                return;
            }

            const page = pages[pageNum];

            // 도장 비율 유지
            const stampDims = stampImage.scale(size / stampImage.width);

            // 도장 삽입
            page.drawImage(stampImage, {
                x: x,
                y: y,
                width: stampDims.width,
                height: stampDims.height,
                opacity: 0.95
            });

            // PDF 저장
            modifiedPdfBytes = await pdfDoc.save();

            spinner.classList.remove('active');
            resultArea.classList.add('active');

        } catch (error) {
            console.error('Error:', error);
            alert('도장 삽입 중 오류가 발생했습니다. 파일과 설정을 확인해주세요.');
            spinner.classList.remove('active');
        }
    });

    // PDF 다운로드
    downloadBtn.addEventListener('click', () => {
        if (modifiedPdfBytes) {
            const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'stamped_document_' + Date.now() + '.pdf';
            link.click();
            URL.revokeObjectURL(url);
        }
    });

    // 다시 시작
    resetBtn.addEventListener('click', () => {
        location.reload();
    });
});
