const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const https = require('https');
const fs = require('fs');
const path = require('path');

// 환경변수 로드 (server/.env 고정 경로)
const envPath = path.join(__dirname, '.env');
console.log('🔍 .env 파일 경로:', envPath);
console.log('🔍 .env 파일 존재 여부:', fs.existsSync(envPath));

const result = require('dotenv').config({ path: envPath });
if (result.error) {
  console.error('❌ .env 파일 로딩 오류:', result.error);
} else {
  console.log('✅ .env 파일 로딩 성공');
}
// 추가 디버그: dotenv 직후 JWT_SECRET 로드 여부 확인
console.log('JWT_SECRET 로드 상태:', process.env.JWT_SECRET ? '✅ 로드됨' : '❌ 로드 안 됨');

// 환경변수 검증 및 기본값 설정 (ATLAS 우선, 없으면 로컬로 폴백)
const envConfig = {
  JWT_SECRET: process.env.JWT_SECRET || 'default-jwt-secret-for-development-only',
  MONGODB_ATLAS_URL: process.env.MONGODB_ATLAS_URL || '',
  MONGODB_URI: process.env.MONGODB_ATLAS_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/demo',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d', // 개발용으로 7일로 연장
  NODE_ENV: process.env.NODE_ENV || 'development'
};

// 환경변수 로딩 확인
console.log('🔧 환경변수 로딩 상태:');
console.log(`  JWT_SECRET: ${process.env.JWT_SECRET ? '✅ 로딩됨' : '❌ 누락'}`);
console.log(`  MONGODB_ATLAS_URL: ${process.env.MONGODB_ATLAS_URL ? '✅ 로딩됨' : '❌ 누락'}`);
console.log(`  MONGODB_URI(실제 연결에 사용됨): ${envConfig.MONGODB_URI ? '✅ 설정됨' : '❌ 누락'}`);
console.log(`  IMP_KEY: ${process.env.IMP_KEY ? '✅ 로딩됨' : '❌ 누락'}`);
console.log(`  IMP_SECRET: ${process.env.IMP_SECRET ? '✅ 로딩됨' : '❌ 누락'}`);

// 추가 디버그 로깅 제거 (원상 복구)

if (process.env.JWT_SECRET && (process.env.MONGODB_ATLAS_URL || process.env.MONGODB_URI) && process.env.IMP_KEY && process.env.IMP_SECRET) {
  console.log('✅ 모든 환경변수가 올바르게 설정되었습니다.');
} else {
  console.warn('⚠️ 일부 환경변수가 누락되었습니다. .env 파일을 확인해주세요.');
}

const app = express();
const HTTP_PORT = process.env.HTTP_PORT || 3002;
const PORT = process.env.PORT || 3443; // HTTPS를 기본 포트로 설정

// SSL 인증서 로드
let httpsOptions = null;
try {
  const sslPath = path.join(__dirname, 'ssl');
  const keyPath = path.join(sslPath, 'private-key.pem');
  const certPath = path.join(sslPath, 'certificate.pem');
  
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    httpsOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    };
    console.log('✅ SSL 인증서를 로드했습니다.');
  } else {
    console.log('⚠️ SSL 인증서를 찾을 수 없습니다. HTTP만 사용됩니다.');
  }
} catch (error) {
  console.log('⚠️ SSL 인증서 로드 실패:', error.message);
}

// 미들웨어 설정
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:5173', 
    'https://localhost:5173',
    'http://211.199.247.220:5173',
    'http://211.199.247.20:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'] // 쿠키 헤더 허용
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser()); // 쿠키 파서 미들웨어 추가

// MongoDB 연결 (최신 설정)
mongoose.connect(envConfig.MONGODB_URI, {
})
.then(() => {
  console.log('✅ MongoDB 연결 성공');
})
.catch((err) => {
  console.error('❌ MongoDB 연결 실패:', err.message);
  console.warn('⚠️ 서버는 계속 실행되지만 데이터베이스 기능이 제한됩니다.');
  console.warn('MongoDB가 실행 중인지 확인해주세요.');
});

// 기본 라우트
app.get('/', (req, res) => {
  res.json({
    message: '서버가 정상적으로 실행 중입니다!',
    status: 'success',
    timestamp: new Date().toISOString()
  });
});

// 라우터 import
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminOrderRoutes = require('./routes/adminOrderRoutes');

// API 라우트
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    environment: {
      NODE_ENV: envConfig.NODE_ENV,
      JWT_SECRET_SET: !!process.env.JWT_SECRET,
      MONGODB_URI_SET: !!process.env.MONGODB_URI
    }
  });
});

// User 라우터 연결
app.use('/api/users', userRoutes);

// Auth 라우터 연결
app.use('/api/auth', authRoutes);

// Product 라우터 연결
app.use('/api/products', productRoutes);

// Cart 라우터 연결
app.use('/api/cart', cartRoutes);

// Order 라우터 연결
app.use('/api/orders', orderRoutes);

// Admin Order 라우터 연결
app.use('/api/admin/orders', adminOrderRoutes);

// 404 에러 핸들러
app.use('*', (req, res) => {
  res.status(404).json({
    message: '요청한 경로를 찾을 수 없습니다',
    status: 'error'
  });
});

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: '서버 내부 오류가 발생했습니다',
    status: 'error'
  });
});

// 개발 환경에서는 HTTP 우선, 프로덕션에서는 HTTPS 우선
const isDevelopment = process.env.NODE_ENV !== 'production';

if (isDevelopment) {
  // 개발 환경: HTTP 서버만 시작 (로컬 개발용)
  app.listen(HTTP_PORT, () => {
    console.log(`🌐 HTTP 서버가 포트 ${HTTP_PORT}에서 실행 중입니다 (개발 모드)`);
    console.log(`http://localhost:${HTTP_PORT} 에서 확인하세요`);
    console.log('서버가 정상적으로 시작되었습니다!');
  });
} else {
  // 프로덕션 환경: HTTPS 우선
  if (httpsOptions) {
    https.createServer(httpsOptions, app).listen(PORT, () => {
      console.log(`🔒 HTTPS 서버가 포트 ${PORT}에서 실행 중입니다 (프로덕션)`);
      console.log(`https://localhost:${PORT} 에서 확인하세요`);
    });
    
    // HTTP에서 HTTPS로 리다이렉트
    const httpApp = express();
    httpApp.use((req, res) => {
      res.redirect(301, `https://localhost:${PORT}${req.url}`);
    });
    
    httpApp.listen(HTTP_PORT, () => {
      console.log(`🌐 HTTP 서버가 포트 ${HTTP_PORT}에서 실행 중입니다 (HTTPS로 리다이렉트)`);
    });
  } else {
    console.log('⚠️ SSL 인증서가 없습니다. HTTP 서버만 시작합니다.');
    app.listen(HTTP_PORT, () => {
      console.log(`🌐 HTTP 서버가 포트 ${HTTP_PORT}에서 실행 중입니다`);
    });
  }
}

console.log('서버 종료: Ctrl + C');
console.log('nodemon 테스트 - 파일 변경 감지됨!');

// Graceful shutdown - 완전한 종료
const gracefulShutdown = () => {
  console.log('\n서버를 종료합니다...');
  mongoose.connection.close(() => {
    console.log('MongoDB 연결이 종료되었습니다.');
    console.log('서버가 완전히 종료되었습니다.');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// 포트 해제 확인
process.on('exit', () => {
  console.log('프로세스가 완전히 종료되었습니다.');
});
