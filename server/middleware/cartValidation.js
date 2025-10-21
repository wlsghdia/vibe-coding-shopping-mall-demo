const { body, param, query, validationResult } = require('express-validator');

// 유효성 검사 결과 처리 미들웨어
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: '유효성 검사 실패',
      errors: errors.array()
    });
  }
  next();
};

// 장바구니 아이템 유효성 검사
const validateCartItem = [
  body('productId')
    .notEmpty()
    .withMessage('상품 ID는 필수입니다')
    .isMongoId()
    .withMessage('올바른 상품 ID 형식이 아닙니다'),
  
  body('quantity')
    .isInt({ min: 1, max: 99 })
    .withMessage('수량은 1-99 사이의 정수여야 합니다'),
  
  body('selectedSize')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 10 })
    .withMessage('사이즈는 10자를 초과할 수 없습니다'),
  
  body('selectedColor')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 20 })
    .withMessage('색상은 20자를 초과할 수 없습니다'),
  
  body('additionalOptions')
    .optional()
    .isObject()
    .withMessage('추가 옵션은 객체 형태여야 합니다'),
  
  handleValidationErrors
];

// 장바구니 아이템 ID 유효성 검사
const validateCartItemId = [
  param('itemId')
    .notEmpty()
    .withMessage('아이템 ID는 필수입니다')
    .isMongoId()
    .withMessage('올바른 아이템 ID 형식이 아닙니다'),
  
  handleValidationErrors
];

// 장바구니 쿼리 유효성 검사
const validateCartQuery = [
  query('populate')
    .optional()
    .isBoolean()
    .withMessage('populate는 boolean 값이어야 합니다'),
  
  query('includeInactive')
    .optional()
    .isBoolean()
    .withMessage('includeInactive는 boolean 값이어야 합니다'),
  
  handleValidationErrors
];

// 일괄 아이템 추가 유효성 검사
const validateBulkCartItems = [
  body('items')
    .isArray({ min: 1, max: 50 })
    .withMessage('아이템은 1-50개까지 추가할 수 있습니다'),
  
  body('items.*.productId')
    .notEmpty()
    .withMessage('상품 ID는 필수입니다')
    .isMongoId()
    .withMessage('올바른 상품 ID 형식이 아닙니다'),
  
  body('items.*.quantity')
    .isInt({ min: 1, max: 99 })
    .withMessage('수량은 1-99 사이의 정수여야 합니다'),
  
  body('items.*.selectedSize')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 10 })
    .withMessage('사이즈는 10자를 초과할 수 없습니다'),
  
  body('items.*.selectedColor')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 20 })
    .withMessage('색상은 20자를 초과할 수 없습니다'),
  
  body('items.*.additionalOptions')
    .optional()
    .isObject()
    .withMessage('추가 옵션은 객체 형태여야 합니다'),
  
  handleValidationErrors
];

// 수량 업데이트 유효성 검사
const validateQuantityUpdate = [
  body('quantity')
    .isInt({ min: 0, max: 99 })
    .withMessage('수량은 0-99 사이의 정수여야 합니다'),
  
  handleValidationErrors
];

// 아이템 옵션 업데이트 유효성 검사
const validateItemOptionsUpdate = [
  body('selectedSize')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 10 })
    .withMessage('사이즈는 10자를 초과할 수 없습니다'),
  
  body('selectedColor')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 20 })
    .withMessage('색상은 20자를 초과할 수 없습니다'),
  
  body('additionalOptions')
    .optional()
    .isObject()
    .withMessage('추가 옵션은 객체 형태여야 합니다'),
  
  handleValidationErrors
];

// 세션 장바구니 병합 유효성 검사
const validateSessionCartMerge = [
  body('sessionCartItems')
    .isArray({ min: 0, max: 50 })
    .withMessage('세션 장바구니 아이템은 0-50개까지 가능합니다'),
  
  body('sessionCartItems.*.productId')
    .notEmpty()
    .withMessage('상품 ID는 필수입니다')
    .isMongoId()
    .withMessage('올바른 상품 ID 형식이 아닙니다'),
  
  body('sessionCartItems.*.quantity')
    .isInt({ min: 1, max: 99 })
    .withMessage('수량은 1-99 사이의 정수여야 합니다'),
  
  body('sessionCartItems.*.selectedSize')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 10 })
    .withMessage('사이즈는 10자를 초과할 수 없습니다'),
  
  body('sessionCartItems.*.selectedColor')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 20 })
    .withMessage('색상은 20자를 초과할 수 없습니다'),
  
  handleValidationErrors
];

// 일괄 아이템 삭제 유효성 검사
const validateBulkItemDeletion = [
  body('itemIds')
    .isArray({ min: 1, max: 50 })
    .withMessage('삭제할 아이템 ID는 1-50개까지 가능합니다'),
  
  body('itemIds.*')
    .isMongoId()
    .withMessage('올바른 아이템 ID 형식이 아닙니다'),
  
  handleValidationErrors
];

// 장바구니 ID 유효성 검사
const validateCartId = [
  param('cartId')
    .notEmpty()
    .withMessage('장바구니 ID는 필수입니다')
    .isMongoId()
    .withMessage('올바른 장바구니 ID 형식이 아닙니다'),
  
  handleValidationErrors
];

module.exports = {
  validateCartItem,
  validateCartItemId,
  validateCartQuery,
  validateBulkCartItems,
  validateQuantityUpdate,
  validateItemOptionsUpdate,
  validateSessionCartMerge,
  validateBulkItemDeletion,
  validateCartId,
  handleValidationErrors
};
