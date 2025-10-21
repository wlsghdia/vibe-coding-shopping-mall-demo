const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

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

// JWT_EXPIRES_IN을 함수로 변경하여 호출 시점에 환경변수 읽기
const getJWTExpiresIn = () => {
  return process.env.JWT_EXPIRES_IN || '7d'; // 개발용으로 7일로 연장
};

// 로그인 입력 데이터 검증
const validateLoginInput = (data) => {
  const errors = [];
  
  if (!data.email) errors.push('이메일은 필수입니다');
  if (!data.password) errors.push('비밀번호는 필수입니다');
  
  // 이메일 형식 검증
  if (data.email && !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(data.email)) {
    errors.push('올바른 이메일 형식이 아닙니다');
  }
  
  return errors;
};

// POST /api/auth/login - 로그인
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 입력 데이터 검증
    const validationErrors = validateLoginInput(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: '입력 데이터가 올바르지 않습니다',
        errors: validationErrors
      });
    }
    
    // 이메일로 사용자 찾기 (비밀번호 포함)
    const user = await User.findByEmail(email.toLowerCase());
    
    // user 객체가 존재하는지 확인
    if (!user || typeof user !== 'object') {
      console.error('❌ 사용자를 찾을 수 없습니다:', email);
      return res.status(401).json({
        status: 'error',
        message: '이메일 또는 비밀번호가 올바르지 않습니다'
      });
    }
    
    // user.password가 존재하는지 안전하게 확인
    if (!user.password || typeof user.password !== 'string') {
      console.error('❌ 사용자 비밀번호가 없습니다:', user.email || email);
      return res.status(500).json({
        status: 'error',
        message: '사용자 비밀번호 정보를 가져올 수 없습니다'
      });
    }
    
    // bcrypt.compare() 안전하게 실행
    let isPasswordValid = false;
    try {
      isPasswordValid = await bcrypt.compare(password, user.password);
    } catch (bcryptError) {
      console.error('❌ 비밀번호 비교 중 오류:', bcryptError.message);
      return res.status(500).json({
        status: 'error',
        message: '비밀번호 검증 중 오류가 발생했습니다'
      });
    }
    
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: '이메일 또는 비밀번호가 올바르지 않습니다'
      });
    }
    
    // JWT 토큰 생성
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        user_type: user.user_type
      },
      getJWTSecret(),
      { expiresIn: getJWTExpiresIn() }
    );
    
    // 비밀번호 제외하고 사용자 정보 반환
    const userInfo = {
      id: user._id,
      email: user.email,
      name: user.name,
      user_type: user.user_type,
      address: user.address,
      createdAt: user.createdAt
    };
    
    // JWT 토큰을 쿠키로 설정 (환경별 설정)
    const cookieOptions = {
      httpOnly: true, // XSS 공격 방지
      secure: process.env.NODE_ENV === 'production' || req.secure, // HTTPS에서만 Secure
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 프로덕션에서는 none, 개발에서는 lax
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7일 (밀리초)
    };
    
    res.cookie('jwt', token, cookieOptions);
    
    res.json({
      status: 'success',
      message: '로그인에 성공했습니다',
      data: {
        user: userInfo,
        token: token,
        expiresIn: getJWTExpiresIn()
      }
    });
    
  } catch (error) {
    console.error('❌ 로그인 오류:', error);
    console.error('❌ 에러 스택:', error.stack);
    
    // 에러 타입별 처리
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        status: 'error',
        message: '입력 데이터가 올바르지 않습니다',
        error: error.message
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        status: 'error',
        message: '잘못된 데이터 형식입니다',
        error: error.message
      });
    }
    
    // 일반적인 서버 오류
    res.status(500).json({
      status: 'error',
      message: '로그인 처리 중 오류가 발생했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : '서버 내부 오류'
    });
  }
};

// POST /api/auth/logout - 로그아웃 (쿠키 삭제)
const logout = async (req, res) => {
  try {
    // JWT 쿠키 삭제 (환경별 설정)
    res.clearCookie('jwt', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' || req.secure, // HTTPS에서만 Secure
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax' // 프로덕션에서는 none, 개발에서는 lax
    });
    
    res.json({
      status: 'success',
      message: '로그아웃되었습니다'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: '로그아웃 처리 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

// GET /api/auth/me - 현재 로그인한 사용자 정보 조회
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: '사용자를 찾을 수 없습니다'
      });
    }
    
    res.json({
      status: 'success',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: '사용자 정보를 가져오는데 실패했습니다',
      error: error.message
    });
  }
};

// POST /api/auth/verify - 토큰 검증
const verifyToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: '토큰이 제공되지 않았습니다'
      });
    }
    
    const decoded = jwt.verify(token, getJWTSecret());
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: '유효하지 않은 토큰입니다'
      });
    }
    
    res.json({
      status: 'success',
      message: '토큰이 유효합니다',
      data: {
        user: user,
        token: token
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({
        status: 'error',
        message: '유효하지 않은 토큰입니다'
      });
    } else if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        status: 'error',
        message: '토큰이 만료되었습니다'
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: '토큰 검증 중 오류가 발생했습니다',
        error: error.message
      });
    }
  }
};

module.exports = {
  login,
  logout,
  getMe,
  verifyToken
};
