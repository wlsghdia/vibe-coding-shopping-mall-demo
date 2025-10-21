const User = require('../models/User');

/**
 * 관리자 권한 확인 미들웨어
 */
const adminMiddleware = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    
    // 사용자 정보 조회
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다'
      });
    }

    // 관리자 권한 확인
    if (user.user_type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '관리자 권한이 필요합니다'
      });
    }

    next();
  } catch (error) {
    console.error('관리자 권한 확인 실패:', error);
    res.status(500).json({
      success: false,
      message: '권한 확인 중 오류가 발생했습니다'
    });
  }
};

module.exports = {
  adminMiddleware
};
