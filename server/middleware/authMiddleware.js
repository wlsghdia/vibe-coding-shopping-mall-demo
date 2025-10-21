const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT 시크릿 키 (환경변수에서만 가져오기 - 보안상 중요!)
const getJWTSecret = () => {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    console.warn('⚠️ JWT_SECRET 환경변수가 설정되지 않았습니다!');
    console.warn('서버/.env 파일에 JWT_SECRET을 설정해주세요.');
    console.warn('현재는 기본값을 사용합니다.');
    return 'default-jwt-secret-for-development-only';
  }
  return JWT_SECRET;
};

// JWT 토큰 검증 미들웨어
const authMiddleware = async (req, res, next) => {
  try {
    let token = null;
    
    // 1. 쿠키에서 토큰 추출 (우선순위)
    if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    }
    // 2. Authorization 헤더에서 토큰 추출 (fallback)
    else {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }
    
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: '인증 토큰이 제공되지 않았습니다'
      });
    }
    
    // 토큰 검증
    const decoded = jwt.verify(token, getJWTSecret());
    
    // 사용자 존재 확인
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: '유효하지 않은 토큰입니다'
      });
    }
    
    // req.user에 사용자 정보 저장
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      user_type: decoded.user_type
    };
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: '유효하지 않은 토큰입니다'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: '토큰이 만료되었습니다'
      });
    } else {
      console.error('인증 미들웨어 오류:', error);
      return res.status(500).json({
        status: 'error',
        message: '인증 처리 중 오류가 발생했습니다'
      });
    }
  }
};

// 관리자 권한 확인 미들웨어
const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.user_type === 'admin') {
    next();
  } else {
    return res.status(403).json({
      status: 'error',
      message: '관리자 권한이 필요합니다'
    });
  }
};

// 선택적 인증 미들웨어 (토큰이 있으면 검증, 없어도 통과)
const optionalAuth = async (req, res, next) => {
  try {
    let token = null;
    
    // 1. 쿠키에서 토큰 추출 (우선순위)
    if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    }
    // 2. Authorization 헤더에서 토큰 추출 (fallback)
    else {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }
    
    if (!token) {
      req.user = null;
      return next();
    }
    
    const decoded = jwt.verify(token, getJWTSecret());
    const user = await User.findById(decoded.userId);
    
    if (user) {
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        user_type: decoded.user_type
      };
    } else {
      req.user = null;
    }
    
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

module.exports = {
  authMiddleware,
  adminMiddleware,
  optionalAuth
};
