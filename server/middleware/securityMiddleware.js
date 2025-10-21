const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// 보안 헤더 설정
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// 로그인 시도 제한
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 5, // 최대 5번 시도
  message: {
    status: 'error',
    message: '너무 많은 로그인 시도가 있었습니다. 15분 후 다시 시도해주세요.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// API 요청 제한
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // 최대 100번 요청
  message: {
    status: 'error',
    message: '너무 많은 요청이 있었습니다. 잠시 후 다시 시도해주세요.'
  }
});

module.exports = {
  securityHeaders,
  loginLimiter,
  apiLimiter
};
