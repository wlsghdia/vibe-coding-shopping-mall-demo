const { body, param, query, validationResult } = require('express-validator');
const mongoose = require('mongoose');

// 유효성 검사 에러 처리 미들웨어
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('=== 유효성 검사 오류 발생 ===');
    console.log('요청 데이터:', JSON.stringify(req.body, null, 2));
    console.log('오류 상세:', errors.array());
    console.log('===============================');
    
    return res.status(400).json({ 
      success: false, 
      message: '유효성 검사 오류', 
      errors: errors.array() 
    });
  }
  next();
};

// 주문 생성 유효성 검사
const validateCreateOrder = [
  // 주문 아이템 검증
  body('items')
    .isArray({ min: 1 })
    .withMessage('주문 아이템은 최소 1개 이상이어야 합니다'),
  
  body('items.*.productId')
    .notEmpty()
    .withMessage('상품 ID는 필수입니다')
    .isMongoId()
    .withMessage('유효하지 않은 상품 ID 형식입니다'),
  
  body('items.*.quantity')
    .notEmpty()
    .withMessage('수량은 필수입니다')
    .isInt({ min: 1, max: 99 })
    .withMessage('수량은 1에서 99 사이의 정수여야 합니다'),
  
  body('items.*.price')
    .notEmpty()
    .withMessage('가격은 필수입니다')
    .isFloat({ min: 0 })
    .withMessage('가격은 0 이상이어야 합니다'),
  
  
  body('items.*.selectedSize')
    .optional()
    .isString()
    .withMessage('선택된 사이즈는 문자열이어야 합니다')
    .trim()
    .isLength({ max: 20 })
    .withMessage('사이즈는 20자를 초과할 수 없습니다'),
  
  body('items.*.selectedColor')
    .optional()
    .isString()
    .withMessage('선택된 색상은 문자열이어야 합니다')
    .trim()
    .isLength({ max: 20 })
    .withMessage('색상은 20자를 초과할 수 없습니다'),
  
  // 배송지 정보 검증
  body('shippingAddress.recipientName')
    .notEmpty()
    .withMessage('수령인명은 필수입니다')
    .isString()
    .withMessage('수령인명은 문자열이어야 합니다')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('수령인명은 2자 이상 50자 이하여야 합니다'),
  
  body('shippingAddress.phone')
    .notEmpty()
    .withMessage('전화번호는 필수입니다')
    .isString()
    .withMessage('전화번호는 문자열이어야 합니다')
    .trim()
    .matches(/^[0-9-+\s()]+$/)
    .withMessage('올바른 전화번호 형식이 아닙니다'),
  
  body('shippingAddress.address.zipCode')
    .notEmpty()
    .withMessage('우편번호는 필수입니다')
    .isString()
    .withMessage('우편번호는 문자열이어야 합니다')
    .trim()
    .matches(/^\d{5}$/)
    .withMessage('우편번호는 5자리 숫자여야 합니다'),
  
  body('shippingAddress.address.mainAddress')
    .notEmpty()
    .withMessage('주소는 필수입니다')
    .isString()
    .withMessage('주소는 문자열이어야 합니다')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('주소는 5자 이상 200자 이하여야 합니다'),
  
  body('shippingAddress.address.detailAddress')
    .optional()
    .isString()
    .withMessage('상세주소는 문자열이어야 합니다')
    .trim()
    .isLength({ max: 200 })
    .withMessage('상세주소는 200자를 초과할 수 없습니다'),
  
  
  // 가격 정보 검증
  body('pricing.subtotal')
    .notEmpty()
    .withMessage('소계는 필수입니다')
    .isFloat({ min: 0 })
    .withMessage('소계는 0 이상이어야 합니다'),
  
  
  body('pricing.total')
    .notEmpty()
    .withMessage('총 금액은 필수입니다')
    .isFloat({ min: 0 })
    .withMessage('총 금액은 0 이상이어야 합니다'),
  
  // 결제 정보 검증
  body('payment.method')
    .notEmpty()
    .withMessage('결제 방법은 필수입니다')
    .isIn(['card', 'bank_transfer', 'kakao_pay', 'naver_pay', 'toss_pay', 'paypal'])
    .withMessage('지원하지 않는 결제 방법입니다'),
  
  body('payment.transactionId')
    .optional()
    .isString()
    .withMessage('거래 ID는 문자열이어야 합니다')
    .trim()
    .isLength({ max: 100 })
    .withMessage('거래 ID는 100자를 초과할 수 없습니다'),
  
  
  handleValidationErrors
];

// 주문 ID 유효성 검사
const validateOrderId = [
  param('orderId')
    .notEmpty()
    .withMessage('주문 ID는 필수입니다')
    .isMongoId()
    .withMessage('유효하지 않은 주문 ID 형식입니다'),
  handleValidationErrors
];

// 주문 상태 업데이트 유효성 검사
const validateOrderStatusUpdate = [
  param('orderId')
    .notEmpty()
    .withMessage('주문 ID는 필수입니다')
    .isMongoId()
    .withMessage('유효하지 않은 주문 ID 형식입니다'),
  
  body('status')
    .notEmpty()
    .withMessage('주문 상태는 필수입니다')
    .isIn(['pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('올바르지 않은 주문 상태입니다'),
  
  body('reason')
    .optional()
    .isString()
    .withMessage('사유는 문자열이어야 합니다')
    .trim()
    .isLength({ max: 500 })
    .withMessage('사유는 500자를 초과할 수 없습니다'),
  
  handleValidationErrors
];

// 배송 정보 업데이트 유효성 검사
const validateShippingUpdate = [
  param('orderId')
    .notEmpty()
    .withMessage('주문 ID는 필수입니다')
    .isMongoId()
    .withMessage('유효하지 않은 주문 ID 형식입니다'),
  
  body('trackingNumber')
    .notEmpty()
    .withMessage('송장번호는 필수입니다')
    .isString()
    .withMessage('송장번호는 문자열이어야 합니다')
    .trim()
    .isLength({ min: 5, max: 50 })
    .withMessage('송장번호는 5자 이상 50자 이하여야 합니다'),
  
  body('carrier')
    .notEmpty()
    .withMessage('택배사는 필수입니다')
    .isString()
    .withMessage('택배사는 문자열이어야 합니다')
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('택배사는 2자 이상 30자 이하여야 합니다'),
  
  handleValidationErrors
];

// 주문 취소 유효성 검사
const validateOrderCancellation = [
  param('orderId')
    .notEmpty()
    .withMessage('주문 ID는 필수입니다')
    .isMongoId()
    .withMessage('유효하지 않은 주문 ID 형식입니다'),
  
  
  handleValidationErrors
];

// 주문 조회 쿼리 유효성 검사
const validateOrderQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('페이지는 1 이상의 정수여야 합니다')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('제한은 1에서 100 사이의 정수여야 합니다')
    .toInt(),
  
  query('status')
    .optional()
    .isIn(['pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('올바르지 않은 주문 상태입니다'),
  
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('시작 날짜는 올바른 날짜 형식이어야 합니다'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('종료 날짜는 올바른 날짜 형식이어야 합니다'),
  
  handleValidationErrors
];

// 결제 정보 업데이트 유효성 검사
const validatePaymentUpdate = [
  param('orderId')
    .notEmpty()
    .withMessage('주문 ID는 필수입니다')
    .isMongoId()
    .withMessage('유효하지 않은 주문 ID 형식입니다'),
  
  body('status')
    .notEmpty()
    .withMessage('결제 상태는 필수입니다')
    .isIn(['pending', 'completed', 'failed', 'cancelled'])
    .withMessage('올바르지 않은 결제 상태입니다'),
  
  body('transactionId')
    .optional()
    .isString()
    .withMessage('거래 ID는 문자열이어야 합니다')
    .trim()
    .isLength({ max: 100 })
    .withMessage('거래 ID는 100자를 초과할 수 없습니다'),
  
  
  handleValidationErrors
];

// 장바구니에서 주문 생성 유효성 검사 (간소화된 버전)
const validateCreateOrderFromCart = [
  // 배송지 정보 검증
  body('shippingAddress.recipientName')
    .notEmpty()
    .withMessage('수령인명은 필수입니다')
    .isString()
    .withMessage('수령인명은 문자열이어야 합니다')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('수령인명은 2자 이상 50자 이하여야 합니다'),
  
  body('shippingAddress.phone')
    .notEmpty()
    .withMessage('전화번호는 필수입니다')
    .isString()
    .withMessage('전화번호는 문자열이어야 합니다')
    .trim()
    .matches(/^[0-9-+\s()]+$/)
    .withMessage('올바른 전화번호 형식이 아닙니다'),
  
  body('shippingAddress.address.zipCode')
    .notEmpty()
    .withMessage('우편번호는 필수입니다')
    .isString()
    .withMessage('우편번호는 문자열이어야 합니다')
    .trim()
    .matches(/^\d{5}$/)
    .withMessage('우편번호는 5자리 숫자여야 합니다'),
  
  body('shippingAddress.address.mainAddress')
    .notEmpty()
    .withMessage('주소는 필수입니다')
    .isString()
    .withMessage('주소는 문자열이어야 합니다')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('주소는 5자 이상 200자 이하여야 합니다'),
  
  body('shippingAddress.address.detailAddress')
    .optional()
    .isString()
    .withMessage('상세주소는 문자열이어야 합니다')
    .trim()
    .isLength({ max: 200 })
    .withMessage('상세주소는 200자를 초과할 수 없습니다'),
  
  // 결제 방법 검증
  body('paymentMethod')
    .notEmpty()
    .withMessage('결제 방법은 필수입니다')
    .isIn(['card', 'bank_transfer', 'kakao_pay', 'naver_pay', 'toss_pay', 'paypal'])
    .withMessage('지원하지 않는 결제 방법입니다'),
  
  // 주문 메모 (선택사항)
  body('notes')
    .optional()
    .isString()
    .withMessage('주문 메모는 문자열이어야 합니다')
    .trim()
    .isLength({ max: 1000 })
    .withMessage('주문 메모는 1000자를 초과할 수 없습니다'),
  
  handleValidationErrors
];

module.exports = {
  validateCreateOrder,
  validateCreateOrderFromCart,
  validateOrderId,
  validateOrderStatusUpdate,
  validateShippingUpdate,
  validateOrderQuery,
  validatePaymentUpdate
};
