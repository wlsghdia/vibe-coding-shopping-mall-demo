# Demo Server

Node.js, Express, MongoDB를 사용한 서버 프로젝트입니다.

## 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. MongoDB 실행
MongoDB가 로컬에 설치되어 있어야 합니다. MongoDB를 실행하세요.

### 3. 서버 실행
```bash
node index.js
```

또는 개발 모드로 실행 (nodemon 사용):
```bash
npm run dev
```

## API 엔드포인트

- `GET /` - 서버 상태 확인
- `GET /api/health` - 헬스 체크 (데이터베이스 연결 상태 포함)

## 환경 설정

서버는 기본적으로 포트 3000에서 실행됩니다.
MongoDB는 `mongodb://localhost:27017/demo`에 연결됩니다.

환경변수를 통해 설정을 변경할 수 있습니다:
- `PORT`: 서버 포트 (기본값: 3000)
- `MONGODB_URI`: MongoDB 연결 URI (기본값: mongodb://localhost:27017/demo)
