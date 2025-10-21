const express = require('express');
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = express.Router();

// POST /api/auth/login - 로그인
router.post('/login', authController.login);

// POST /api/auth/logout - 로그아웃
router.post('/logout', authController.logout);

// GET /api/auth/me - 현재 로그인한 사용자 정보 조회 (인증 필요)
router.get('/me', authMiddleware, authController.getMe);

// POST /api/auth/verify - 토큰 검증
router.post('/verify', authController.verifyToken);

module.exports = router;
