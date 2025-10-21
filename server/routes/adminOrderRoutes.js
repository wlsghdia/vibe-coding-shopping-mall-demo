const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { adminMiddleware } = require('../middleware/adminMiddleware');

// ==================== 관리자용 주문 관리 ====================

/**
 * @route   GET /api/admin/orders
 * @desc    관리자용 주문 목록 조회 (모든 사용자의 주문)
 * @access  Private (Admin only)
 */
router.get('/', authMiddleware, adminMiddleware, orderController.getAdminOrders);

/**
 * @route   GET /api/admin/orders/:orderId
 * @desc    관리자용 주문 상세 조회
 * @access  Private (Admin only)
 */
router.get('/:orderId', authMiddleware, adminMiddleware, orderController.getOrderById);

/**
 * @route   PUT /api/admin/orders/:orderId/status
 * @desc    관리자용 주문 상태 업데이트
 * @access  Private (Admin only)
 */
router.put('/:orderId/status', authMiddleware, adminMiddleware, orderController.updateOrderStatus);

/**
 * @route   PUT /api/admin/orders/:orderId/shipping
 * @desc    관리자용 배송 정보 업데이트
 * @access  Private (Admin only)
 */
router.put('/:orderId/shipping', authMiddleware, adminMiddleware, orderController.updateShippingInfo);

module.exports = router;