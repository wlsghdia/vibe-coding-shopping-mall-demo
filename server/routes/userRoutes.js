const express = require('express');
const userController = require('../controllers/userController');
const router = express.Router();

// GET /api/users - 모든 사용자 조회
router.get('/', userController.getAllUsers);

// GET /api/users/:id - 특정 사용자 조회
router.get('/:id', userController.getUserById);

// POST /api/users - 새 사용자 생성
router.post('/', userController.createUser);

// PUT /api/users/:id - 사용자 정보 수정
router.put('/:id', userController.updateUser);

// DELETE /api/users/:id - 사용자 삭제
router.delete('/:id', userController.deleteUser);

// GET /api/users/email/:email - 이메일로 사용자 찾기
router.get('/email/:email', userController.getUserByEmail);

// GET /api/users/type/:user_type - 사용자 타입별 조회
router.get('/type/:user_type', userController.getUsersByType);

module.exports = router;
