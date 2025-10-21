const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authMiddleware } = require('../middleware/authMiddleware');
const {
  validateCreateOrder,
  validateCreateOrderFromCart,
  validateOrderId,
  validateOrderStatusUpdate,
  validateShippingUpdate,
  validateOrderQuery,
  validatePaymentUpdate
} = require('../middleware/orderValidation');

// ==================== READ (조회) - 인증 필요 ====================

/**
 * @route   GET /api/orders
 * @desc    사용자 주문 목록 조회
 * @access  Private
 */
router.get('/', authMiddleware, validateOrderQuery, orderController.getOrders);

/**
 * @route   GET /api/orders/stats
 * @desc    주문 통계 조회
 * @access  Private
 */
router.get('/stats', authMiddleware, validateOrderQuery, orderController.getOrderStats);

/**
 * @route   GET /api/orders/:orderId
 * @desc    특정 주문 상세 조회
 * @access  Private
 */
router.get('/:orderId', authMiddleware, validateOrderId, orderController.getOrderById);

// ==================== CREATE (생성) - 인증 필요 ====================

/**
 * @route   POST /api/orders/from-cart
 * @desc    장바구니에서 주문 생성
 * @access  Private
 */
router.post('/from-cart', authMiddleware, validateCreateOrderFromCart, orderController.createOrderFromCart);

/**
 * @route   POST /api/orders/direct
 * @desc    상품 상세 페이지에서 직접 주문 생성
 * @access  Private
 */
router.post('/direct', authMiddleware, validateCreateOrder, orderController.createDirectOrder);

// ==================== UPDATE (수정) - 인증 필요 ====================

/**
 * @route   PATCH /api/orders/:orderId/status
 * @desc    주문 상태 업데이트
 * @access  Private
 */
router.patch('/:orderId/status', authMiddleware, validateOrderStatusUpdate, orderController.updateOrderStatus);

/**
 * @route   PATCH /api/orders/:orderId/shipping
 * @desc    배송 정보 업데이트
 * @access  Private
 */
router.patch('/:orderId/shipping', authMiddleware, validateShippingUpdate, orderController.updateShippingInfo);

/**
 * @route   PATCH /api/orders/:orderId/payment
 * @desc    결제 정보 업데이트
 * @access  Private
 */
router.patch('/:orderId/payment', authMiddleware, validatePaymentUpdate, orderController.updatePaymentInfo);

// ==================== DELETE (삭제) - 인증 필요 ====================

/**
 * @route   DELETE /api/orders/:orderId
 * @desc    주문 취소
 * @access  Private
 */
router.delete('/:orderId', authMiddleware, validateOrderId, orderController.cancelOrder);

module.exports = router;
