const { body, param, query, validationResult } = require('express-validator');

// 에러 처리 미들웨어
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: '입력 데이터가 올바르지 않습니다.',
      errors: errors.array()
    });
  }
  next();
};

// 상품 생성 검증
const validateCreateProduct = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('상품명은 필수입니다.')
    .isLength({ min: 1, max: 100 })
    .withMessage('상품명은 1-100자 사이여야 합니다.'),
  
  body('price')
    .isNumeric()
    .withMessage('가격은 숫자여야 합니다.')
    .isFloat({ min: 0, max: 999999 })
    .withMessage('가격은 0-999,999 사이여야 합니다.'),
  
  body('originalPrice')
    .optional()
    .isNumeric()
    .withMessage('정가는 숫자여야 합니다.')
    .isFloat({ min: 0, max: 999999 })
    .withMessage('정가는 0-999,999 사이여야 합니다.'),
  
  body('category')
    .isIn(['상의', '하의', '원피스', '신발', '액세서리', '기타'])
    .withMessage('유효하지 않은 카테고리입니다.'),
  
  body('sku')
    .trim()
    .notEmpty()
    .withMessage('SKU는 필수입니다.')
    .matches(/^[A-Z0-9-]+$/)
    .withMessage('SKU는 영문 대문자, 숫자, 하이픈만 사용 가능합니다.')
    .isLength({ min: 3, max: 50 })
    .withMessage('SKU는 3-50자 사이여야 합니다.'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('상품 설명은 1000자를 초과할 수 없습니다.'),
  
  body('image')
    .notEmpty()
    .withMessage('이미지는 필수입니다.')
    .isURL()
    .withMessage('유효한 이미지 URL이어야 합니다.'),
  
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('재고는 0 이상의 정수여야 합니다.'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('태그는 배열이어야 합니다.'),
  
  body('tags.*')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('각 태그는 50자를 초과할 수 없습니다.'),
  
  handleValidationErrors
];

// 상품 수정 검증
const validateUpdateProduct = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('상품명은 1-100자 사이여야 합니다.'),
  
  body('price')
    .optional()
    .isNumeric()
    .withMessage('가격은 숫자여야 합니다.')
    .isFloat({ min: 0, max: 999999 })
    .withMessage('가격은 0-999,999 사이여야 합니다.'),
  
  body('originalPrice')
    .optional()
    .isNumeric()
    .withMessage('정가는 숫자여야 합니다.')
    .isFloat({ min: 0, max: 999999 })
    .withMessage('정가는 0-999,999 사이여야 합니다.'),
  
  body('category')
    .optional()
    .isIn(['상의', '하의', '원피스', '신발', '액세서리', '기타'])
    .withMessage('유효하지 않은 카테고리입니다.'),
  
  body('sku')
    .optional()
    .trim()
    .matches(/^[A-Z0-9-]+$/)
    .withMessage('SKU는 영문 대문자, 숫자, 하이픈만 사용 가능합니다.')
    .isLength({ min: 3, max: 50 })
    .withMessage('SKU는 3-50자 사이여야 합니다.'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('상품 설명은 1000자를 초과할 수 없습니다.'),
  
  body('image')
    .optional()
    .isURL()
    .withMessage('유효한 이미지 URL이어야 합니다.'),
  
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('재고는 0 이상의 정수여야 합니다.'),
  
  body('status')
    .optional()
    .isIn(['판매중', '품절', '단종', '숨김'])
    .withMessage('유효하지 않은 상태입니다.'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('태그는 배열이어야 합니다.'),
  
  body('tags.*')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('각 태그는 50자를 초과할 수 없습니다.'),
  
  handleValidationErrors
];

// 상품 ID 검증
const validateProductId = [
  param('id')
    .isMongoId()
    .withMessage('유효하지 않은 상품 ID입니다.'),
  
  handleValidationErrors
];

// 상품 쿼리 검증
const validateProductQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('페이지는 1 이상의 정수여야 합니다.'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('제한은 1-100 사이의 정수여야 합니다.'),
  
  query('category')
    .optional()
    .isIn(['상의', '하의', '원피스', '신발', '액세서리', '기타'])
    .withMessage('유효하지 않은 카테고리입니다.'),
  
  query('status')
    .optional()
    .isIn(['판매중', '품절', '단종', '숨김'])
    .withMessage('유효하지 않은 상태입니다.'),
  
  query('minPrice')
    .optional()
    .isNumeric()
    .withMessage('최소 가격은 숫자여야 합니다.'),
  
  query('maxPrice')
    .optional()
    .isNumeric()
    .withMessage('최대 가격은 숫자여야 합니다.'),
  
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('검색어는 100자를 초과할 수 없습니다.'),
  
  handleValidationErrors
];

// 재고 업데이트 검증
const validateStockUpdate = [
  body('stock')
    .isInt({ min: 0 })
    .withMessage('재고는 0 이상의 정수여야 합니다.'),
  
  body('operation')
    .optional()
    .isIn(['add', 'subtract', 'set'])
    .withMessage('유효하지 않은 재고 작업입니다.'),
  
  handleValidationErrors
];

module.exports = {
  validateCreateProduct,
  validateUpdateProduct,
  validateProductId,
  validateProductQuery,
  validateStockUpdate,
  handleValidationErrors
};