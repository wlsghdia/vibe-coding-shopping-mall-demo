const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authMiddleware } = require('../middleware/authMiddleware');
const {
  validateCreateProduct,
  validateUpdateProduct,
  validateProductId,
  validateProductQuery,
  validateStockUpdate
} = require('../middleware/productValidation');

// ==================== READ (조회) - 공개 API ====================
/**
 * @route   GET /api/products
 * @desc    상품 목록 조회 (페이지네이션, 검색, 필터링 지원)
 * @access  Public (공개)
 * @query   { page?, limit?, category?, status?, search?, sortBy?, sortOrder?, minPrice?, maxPrice? }
 */
router.get('/', validateProductQuery, productController.getProducts);

// ==================== CREATE (생성) - 인증 필요 ====================
/**
 * @route   POST /api/products
 * @desc    새 상품 등록
 * @access  Private (인증 필요)
 * @body    { name, price, category, image, sku, description?, stock?, tags?, discount?, metadata? }
 */
router.post('/', authMiddleware, validateCreateProduct, productController.createProduct);

/**
 * @route   GET /api/products/search
 * @desc    상품 검색 (고급 검색)
 * @access  Public (공개)
 * @query   { q, category?, minPrice?, maxPrice?, inStock?, sortBy?, sortOrder? }
 */
router.get('/search', validateProductQuery, productController.searchProducts);

/**
 * @route   GET /api/products/category/:category
 * @desc    카테고리별 상품 조회
 * @access  Public (공개)
 * @params  { category }
 * @query   { limit? }
 */
router.get('/category/:category', productController.getProductsByCategory);

/**
 * @route   GET /api/products/featured
 * @desc    추천 상품 조회
 * @access  Public (공개)
 * @query   { limit? }
 */
router.get('/featured', productController.getFeaturedProducts);

/**
 * @route   GET /api/products/out-of-stock
 * @desc    품절 상품 조회
 * @access  Private (인증 필요)
 * @query   { page?, limit? }
 */
router.get('/out-of-stock', authMiddleware, productController.getOutOfStockProducts);

/**
 * @route   GET /api/products/check-sku/:sku
 * @desc    SKU 중복 확인
 * @access  Private (인증 필요)
 * @params  { sku }
 * @query   { excludeId? }
 */
router.get('/check-sku/:sku', authMiddleware, productController.checkSkuUnique);

/**
 * @route   GET /api/products/:id
 * @desc    상품 상세 조회
 * @access  Public (공개)
 * @params  { id }
 */
router.get('/:id', validateProductId, productController.getProductById);

// ==================== UPDATE (수정) - 인증 필요 ====================
/**
 * @route   PUT /api/products/:id
 * @desc    상품 정보 수정
 * @access  Private (인증 필요)
 * @params  { id }
 * @body    { name?, price?, category?, image?, sku?, description?, stock?, status?, tags?, discount?, metadata? }
 */
router.put('/:id', authMiddleware, validateProductId, validateUpdateProduct, productController.updateProduct);

/**
 * @route   PATCH /api/products/:id/status
 * @desc    상품 상태 변경
 * @access  Private (인증 필요)
 * @params  { id }
 * @body    { status }
 */
router.patch('/:id/status', authMiddleware, validateProductId, productController.updateProductStatus);

/**
 * @route   PATCH /api/products/:id/stock
 * @desc    재고 수량 업데이트
 * @access  Private (인증 필요)
 * @params  { id }
 * @body    { quantity, operation? }
 */
router.patch('/:id/stock', authMiddleware, validateProductId, validateStockUpdate, productController.updateStock);

/**
 * @route   PATCH /api/products/:id/discount
 * @desc    할인 정보 업데이트
 * @access  Private (인증 필요)
 * @params  { id }
 * @body    { discount }
 */
router.patch('/:id/discount', authMiddleware, validateProductId, productController.updateDiscount);

/**
 * @route   PATCH /api/products/:id/tags
 * @desc    태그 업데이트
 * @access  Private (인증 필요)
 * @params  { id }
 * @body    { tags }
 */
router.patch('/:id/tags', authMiddleware, validateProductId, productController.updateTags);

// ==================== DELETE (삭제) - 인증 필요 ====================
/**
 * @route   DELETE /api/products/:id
 * @desc    상품 삭제
 * @access  Private (인증 필요)
 * @params  { id }
 */
router.delete('/:id', authMiddleware, validateProductId, productController.deleteProduct);

/**
 * @route   DELETE /api/products/bulk
 * @desc    여러 상품 일괄 삭제
 * @access  Private (인증 필요)
 * @body    { productIds }
 */
router.delete('/bulk', authMiddleware, productController.bulkDeleteProducts);

// ==================== UTILITY (유틸리티) - 인증 필요 ====================
/**
 * @route   GET /api/products/stats/overview
 * @desc    상품 통계 조회
 * @access  Private (인증 필요)
 */
router.get('/stats/overview', authMiddleware, productController.getProductStats);

/**
 * @route   GET /api/products/export
 * @desc    상품 데이터 내보내기
 * @access  Private (인증 필요)
 * @query   { format?, category?, status? }
 */
router.get('/export', authMiddleware, productController.exportProducts);

/**
 * @route   POST /api/products/import
 * @desc    상품 데이터 가져오기
 * @access  Private (인증 필요)
 * @body    { products }
 */
router.post('/import', authMiddleware, productController.importProducts);

module.exports = router;
