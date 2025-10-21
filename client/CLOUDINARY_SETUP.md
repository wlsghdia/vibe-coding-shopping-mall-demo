# Cloudinary 설정 가이드

## 🔧 필요한 환경변수

### 1. Cloudinary 계정 생성
1. [Cloudinary](https://cloudinary.com)에 가입
2. 대시보드에서 Cloud Name 확인
3. Settings > Upload > Upload presets에서 새 프리셋 생성

### 2. 환경변수 설정

#### `client/.env` 파일 생성:
```env
# Cloudinary 설정
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=your-upload-preset
VITE_CLOUDINARY_API_KEY=your-api-key

# 서버 설정
VITE_API_BASE_URL=http://localhost:3002/api
```

### 3. Upload Preset 설정

#### Cloudinary 대시보드에서:
1. **Settings** > **Upload** > **Upload presets**
2. **Add upload preset** 클릭
3. 설정:
   - **Preset name**: `product-images` (또는 원하는 이름)
   - **Signing Mode**: `Unsigned` (중요!)
   - **Folder**: `products`
   - **Allowed formats**: `jpg, jpeg, png, gif, webp`
   - **Max file size**: `10MB`
   - **Transformations**: 필요에 따라 설정

### 4. 환경변수 값 찾기

#### Cloud Name:
- Cloudinary 대시보드 상단에 표시
- 예: `dxy8b8k9x`

#### Upload Preset:
- Settings > Upload > Upload presets에서 확인
- 예: `product-images`

#### API Key (선택사항):
- Settings > Security > API Keys에서 확인

## 🚀 사용법

1. `.env` 파일에 실제 값 입력
2. 개발 서버 재시작: `npm run dev`
3. 상품 등록 페이지에서 이미지 업로드 테스트

## ⚠️ 주의사항

- `.env` 파일은 `.gitignore`에 추가하여 버전 관리에서 제외
- 프로덕션에서는 서버 환경변수로 설정
- Upload Preset은 반드시 `Unsigned`로 설정
