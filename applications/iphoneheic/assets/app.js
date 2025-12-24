// API 엔드포인트 설정
const API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:5001/convert'
    : '/api/convert'; // 배포 시 프록시 또는 실제 API URL로 변경

let selectedFiles = [];

// DOM Elements
const fileInput = document.getElementById('fileInput');
const uploadButton = document.getElementById('uploadButton');
const fileList = document.getElementById('fileList');
const convertButton = document.getElementById('convertButton');
const progress = document.getElementById('progress');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');

// Event Listeners
uploadButton.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileSelect);
convertButton.addEventListener('click', handleConvert);

// 파일 선택 처리
function handleFileSelect(e) {
    const files = Array.from(e.target.files);

    // HEIC 파일만 필터링
    const heicFiles = files.filter(file => {
        const name = file.name.toLowerCase();
        return name.endsWith('.heic') || name.endsWith('.heif');
    });

    if (heicFiles.length === 0) {
        alert(getText('invalidFiles'));
        return;
    }

    // 파일 크기 체크 (50MB)
    const oversizedFiles = heicFiles.filter(file => file.size > 50 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
        alert(getText('fileTooLarge'));
        return;
    }

    selectedFiles = [...selectedFiles, ...heicFiles];
    updateFileList();

    // 입력 초기화 (같은 파일 다시 선택 가능)
    fileInput.value = '';
}

// 파일 리스트 업데이트
function updateFileList() {
    if (selectedFiles.length === 0) {
        fileList.classList.add('hidden');
        convertButton.classList.add('hidden');
        return;
    }

    fileList.classList.remove('hidden');
    convertButton.classList.remove('hidden');

    const listHTML = selectedFiles.map((file, index) => `
        <div class="file-item">
            <span class="file-name">${file.name}</span>
            <span class="file-size">${formatFileSize(file.size)}</span>
            <button class="remove-button" onclick="removeFile(${index})">✕</button>
        </div>
    `).join('');

    fileList.innerHTML = listHTML;
}

// 파일 제거
function removeFile(index) {
    selectedFiles.splice(index, 1);
    updateFileList();
}

// 파일 크기 포맷
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// 변환 처리
async function handleConvert() {
    if (selectedFiles.length === 0) return;

    // UI 업데이트
    convertButton.disabled = true;
    uploadButton.disabled = true;
    progress.classList.remove('hidden');
    progressText.textContent = getText('converting');

    const formData = new FormData();
    selectedFiles.forEach(file => {
        formData.append('files', file);
    });

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Conversion failed');
        }

        // 진행률 100%
        progressFill.style.width = '100%';
        progressText.textContent = getText('downloading');

        // 다운로드
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        // 파일명 결정
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'converted.jpg';

        if (contentDisposition) {
            const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
            if (matches && matches[1]) {
                filename = matches[1].replace(/['"]/g, '');
            }
        } else if (selectedFiles.length === 1) {
            filename = selectedFiles[0].name.replace(/\.heic$/i, '.jpg');
        } else {
            filename = 'converted.zip';
        }

        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        // 성공 후 초기화
        progressText.textContent = getText('success');
        setTimeout(resetApp, 1500);

    } catch (error) {
        console.error('Conversion error:', error);
        alert(getText('error') + ': ' + error.message);
        resetApp();
    }
}

// 앱 초기화
function resetApp() {
    selectedFiles = [];
    updateFileList();
    convertButton.disabled = false;
    uploadButton.disabled = false;
    progress.classList.add('hidden');
    progressFill.style.width = '0%';
}

// 다국어 텍스트 (HTML에서 설정)
function getText(key) {
    const texts = window.APP_TEXTS || {};
    return texts[key] || key;
}

// PWA 설치 프롬프트
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
});
