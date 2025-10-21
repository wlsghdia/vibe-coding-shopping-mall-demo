# Demo Client

React + Vite로 구축된 프론트엔드 클라이언트입니다.

## 기술 스택

- **React 18** - UI 라이브러리
- **Vite** - 빌드 도구 및 개발 서버
- **React Router DOM** - 클라이언트 사이드 라우팅
- **Axios** - HTTP 클라이언트

## 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 개발 서버 실행
```bash
npm run dev
```

개발 서버는 `http://localhost:5173`에서 실행됩니다.

### 3. 빌드
```bash
npm run build
```

### 4. 미리보기
```bash
npm run preview
```

## 프로젝트 구조

```
client/
├── public/
│   └── vite.svg
├── src/
│   ├── components/     # 재사용 가능한 컴포넌트
│   ├── App.jsx        # 메인 앱 컴포넌트
│   ├── App.css        # 앱 스타일
│   ├── main.jsx       # 앱 진입점
│   └── index.css      # 글로벌 스타일
├── index.html         # HTML 템플릿
├── package.json       # 프로젝트 설정
├── vite.config.js     # Vite 설정
└── README.md          # 프로젝트 문서
```

## 주요 기능

- ✅ React 18 + Vite 개발 환경
- ✅ Express 서버와 API 연동
- ✅ 서버 상태 실시간 확인
- ✅ 반응형 디자인
- ✅ 모던 CSS 스타일링
- ✅ 개발 서버 핫 리로드

## API 연동

Vite 설정에서 `/api` 경로를 Express 서버(`http://localhost:3002`)로 프록시하도록 설정되어 있습니다.

```javascript
// vite.config.js
proxy: {
  '/api': {
    target: 'http://localhost:3002',
    changeOrigin: true,
    secure: false,
  }
}
```

## 개발 팁

- `npm run dev`로 개발 서버 실행
- `Ctrl+C`로 서버 종료
- 파일 저장 시 자동 리로드
- 브라우저 개발자 도구로 네트워크 요청 확인
