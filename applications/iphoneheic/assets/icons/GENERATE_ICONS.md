# 아이콘 생성 가이드

## 방법 1: 이모지를 PNG로 변환 (간단)

1. https://emoji-to-png.com/ 접속
2. 📸 이모지 입력
3. 다양한 크기로 다운로드:
   - 32, 72, 96, 128, 144, 152, 180, 192, 512

## 방법 2: Figma/디자인 툴 (커스텀)

1. 512x512 캔버스 생성
2. 카메라 아이콘 디자인 (iOS 스타일)
3. 각 크기로 Export

## 방법 3: ImageMagick (자동)

```bash
# 512x512 원본 아이콘 준비 (icon-original.png)
convert icon-original.png -resize 32x32 icon-32.png
convert icon-original.png -resize 72x72 icon-72.png
convert icon-original.png -resize 96x96 icon-96.png
convert icon-original.png -resize 128x128 icon-128.png
convert icon-original.png -resize 144x144 icon-144.png
convert icon-original.png -resize 152x152 icon-152.png
convert icon-original.png -resize 180x180 icon-180.png
convert icon-original.png -resize 192x192 icon-192.png
convert icon-original.png -resize 512x512 icon-512.png
```

## 방법 4: 온라인 생성기

https://realfavicongenerator.net/
- 원본 이미지 업로드
- iOS/PWA 옵션 선택
- 자동 생성

## 디자인 가이드

- **배경**: 흰색 또는 투명
- **아이콘**: 간단한 카메라 심볼
- **색상**: iOS 블루(#007AFF) 또는 검정
- **여백**: 적절한 padding (전체의 15-20%)
- **스타일**: 미니멀, iOS 네이티브 느낌

## 임시 아이콘

현재는 placeholder로 사용 가능:
- 이모지 📸 사용 (브라우저 렌더링)
- 나중에 정식 아이콘으로 교체
