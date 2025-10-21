const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { authMiddleware } = require('../middleware/authMiddleware');
const {
  validateCartItem,
  validateCartItemId,
  validateCartQuery
} = require('../middleware/cartValidation');

// ==================== READ (조회) - 인증 필요 ====================
/**
 * @route   GET /api/cart
 * @desc    사용자 장바구니 조회
 * @access  Private (인증 필요)
 * @query   { populate? }
 */
router.get('/', authMiddleware, validateCartQuery, cartController.getCart);

/**
 * @route   GET /api/cart/items
 * @desc    장바구니 아이템 목록 조회 (간단한 정보만)
 * @access  Private (인증 필요)
 */
router.get('/items', authMiddleware, cartController.getCartItems);

/**
 * @route   GET /api/cart/summary
 * @desc    장바구니 요약 정보 조회 (총 금액, 아이템 수 등)
 * @access  Private (인증 필요)
 */
router.get('/summary', authMiddleware, cartController.getCartSummary);

/**
 * @route   GET /api/cart/count
 * @desc    장바구니 아이템 개수 조회
 * @access  Private (인증 필요)
 */
router.get('/count', authMiddleware, cartController.getCartCount);

// ==================== CREATE (생성) - 인증 필요 ====================
/**
 * @route   POST /api/cart/items
 * @desc    장바구니에 상품 추가
 * @access  Private (인증 필요)
 * @body    { productId, quantity, selectedSize?, selectedColor?, additionalOptions? }
 */
router.post('/items', authMiddleware, validateCartItem, cartController.addItem);

/**
 * @route   POST /api/cart/items/bulk
 * @desc    장바구니에 여러 상품 일괄 추가
 * @access  Private (인증 필요)
 * @body    { items: [{ productId, quantity, selectedSize?, selectedColor?, additionalOptions? }] }
 */
router.post('/items/bulk', authMiddleware, cartController.addBulkItems);

// ==================== UPDATE (수정) - 인증 필요 ====================
/**
 * @route   PUT /api/cart/items/:itemId
 * @desc    장바구니 아이템 수량 업데이트
 * @access  Private (인증 필요)
 * @params  { itemId }
 * @body    { quantity }
 */
router.put('/items/:itemId', authMiddleware, validateCartItemId, cartController.updateItemQuantity);

/**
 * @route   PATCH /api/cart/items/:itemId
 * @desc    장바구니 아이템 옵션 업데이트
 * @access  Private (인증 필요)
 * @params  { itemId }
 * @body    { selectedSize?, selectedColor?, additionalOptions? }
 */
router.patch('/items/:itemId', authMiddleware, validateCartItemId, cartController.updateItemOptions);

/**
 * @route   PATCH /api/cart/merge
 * @desc    세션 장바구니와 사용자 장바구니 병합
 * @access  Private (인증 필요)
 * @body    { sessionCartItems: [{ productId, quantity, selectedSize?, selectedColor? }] }
 */
router.patch('/merge', authMiddleware, cartController.mergeSessionCart);

// ==================== DELETE (삭제) - 인증 필요 ====================
/**
 * @route   DELETE /api/cart/items/:itemId
 * @desc    장바구니에서 특정 아이템 제거
 * @access  Private (인증 필요)
 * @params  { itemId }
 */
router.delete('/items/:itemId', authMiddleware, validateCartItemId, cartController.removeItem);

/**
 * @route   DELETE /api/cart/items
 * @desc    장바구니에서 여러 아이템 일괄 제거
 * @access  Private (인증 필요)
 * @body    { itemIds: [string] }
 */
router.delete('/items', authMiddleware, cartController.removeBulkItems);

/**
 * @route   DELETE /api/cart
 * @desc    장바구니 전체 비우기
 * @access  Private (인증 필요)
 */
router.delete('/', authMiddleware, cartController.clearCart);

// ==================== UTILITY (유틸리티) - 인증 필요 ====================
/**
 * @route   GET /api/cart/checkout/preview
 * @desc    체크아웃 미리보기 (주문 전 장바구니 검증)
 * @access  Private (인증 필요)
 */
router.get('/checkout/preview', authMiddleware, cartController.getCheckoutPreview);

/**
 * @route   POST /api/cart/validate
 * @desc    장바구니 유효성 검사 (재고, 가격 등)
 * @access  Private (인증 필요)
 */
router.post('/validate', authMiddleware, cartController.validateCart);

/**
 * @route   GET /api/cart/abandoned
 * @desc    사용자의 버려진 장바구니 조회
 * @access  Private (인증 필요)
 */
router.get('/abandoned', authMiddleware, cartController.getAbandonedCarts);

/**
 * @route   POST /api/cart/restore/:cartId
 * @desc    버려진 장바구니 복원
 * @access  Private (인증 필요)
 * @params  { cartId }
 */
router.post('/restore/:cartId', authMiddleware, cartController.restoreCart);

module.exports = router;
