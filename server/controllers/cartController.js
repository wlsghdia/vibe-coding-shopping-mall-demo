const Cart = require('../models/Cart');
const Product = require('../models/Product');

// ==================== READ (조회) ====================

/**
 * 사용자 장바구니 조회
 */
const getCart = async (req, res) => {
  try {
    const { populate = 'true' } = req.query;
    const userId = req.user.userId;

    let cart = await Cart.findOne({ user: userId, status: 'active' });

    if (!cart) {
      // 장바구니가 없으면 새로 생성
      cart = new Cart({
        user: userId,
        items: [],
        status: 'active'
      });
      await cart.save();
    }

    // populate 옵션이 true이면 상품 정보도 함께 조회
    if (populate === 'true') {
      await cart.populate({
        path: 'items.product',
        select: 'name price originalPrice image category stock status'
      });
    }

    res.json({
      success: true,
      data: cart,
      message: '장바구니 조회 성공'
    });
  } catch (error) {
    console.error('장바구니 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '장바구니 조회 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

/**
 * 장바구니 아이템 목록 조회 (간단한 정보만)
 */
const getCartItems = async (req, res) => {
  try {
    const userId = req.user.userId;

    const cart = await Cart.findOne({ user: userId, status: 'active' })
      .populate({
        path: 'items.product',
        select: 'name price originalPrice image category stock status'
      });

    if (!cart) {
      return res.json({
        success: true,
        data: [],
        message: '장바구니가 비어있습니다'
      });
    }

    res.json({
      success: true,
      data: cart.items,
      message: '장바구니 아이템 조회 성공'
    });
  } catch (error) {
    console.error('장바구니 아이템 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '장바구니 아이템 조회 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

/**
 * 장바구니 요약 정보 조회
 */
const getCartSummary = async (req, res) => {
  try {
    const userId = req.user.userId;

    const cart = await Cart.findOne({ user: userId, status: 'active' })
      .populate({
        path: 'items.product',
        select: 'name price originalPrice image category stock status'
      });

    if (!cart || cart.items.length === 0) {
      return res.json({
        success: true,
        data: {
          totalItems: 0,
          totalAmount: 0,
          items: []
        },
        message: '장바구니가 비어있습니다'
      });
    }

    // 총 금액과 아이템 수 계산
    let totalAmount = 0;
    let totalItems = 0;

    cart.items.forEach(item => {
      if (item.product && item.product.status === '판매중') {
        totalAmount += item.product.price * item.quantity;
        totalItems += item.quantity;
      }
    });

    res.json({
      success: true,
      data: {
        totalItems,
        totalAmount,
        items: cart.items.map(item => ({
          _id: item._id,
          product: item.product,
          quantity: item.quantity,
          selectedSize: item.selectedSize,
          selectedColor: item.selectedColor,
          addedAt: item.addedAt
        }))
      },
      message: '장바구니 요약 조회 성공'
    });
  } catch (error) {
    console.error('장바구니 요약 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '장바구니 요약 조회 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

/**
 * 장바구니 아이템 개수 조회
 */
const getCartCount = async (req, res) => {
  try {
    const userId = req.user.userId;

    const cart = await Cart.findOne({ user: userId, status: 'active' });

    if (!cart) {
      return res.json({
        success: true,
        data: { count: 0 },
        message: '장바구니가 비어있습니다'
      });
    }

    const count = cart.items.reduce((total, item) => total + item.quantity, 0);

    res.json({
      success: true,
      data: { count },
      message: '장바구니 아이템 개수 조회 성공'
    });
  } catch (error) {
    console.error('장바구니 아이템 개수 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '장바구니 아이템 개수 조회 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

// ==================== CREATE (생성) ====================

/**
 * 장바구니에 상품 추가
 */
const addItem = async (req, res) => {
  try {
    const { productId, quantity, selectedSize, selectedColor, additionalOptions } = req.body;
    const userId = req.user.userId;

    // 상품 존재 여부 확인
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다'
      });
    }

    // 상품이 판매 중인지 확인
    if (product.status !== '판매중') {
      return res.status(400).json({
        success: false,
        message: '현재 판매 중이 아닌 상품입니다'
      });
    }

    // 재고 확인
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `재고가 부족합니다. (현재 재고: ${product.stock}개)`
      });
    }

    // 장바구니 찾기 또는 생성
    let cart = await Cart.findOne({ user: userId, status: 'active' });
    if (!cart) {
      cart = new Cart({
        user: userId,
        items: [],
        status: 'active'
      });
    }

    // 상품 추가
    await cart.addItem(productId, quantity, {
      selectedSize,
      selectedColor,
      additionalOptions
    });

    // 최신 정보로 다시 조회
    await cart.populate({
      path: 'items.product',
      select: 'name price originalPrice image category stock status'
    });

    res.status(201).json({
      success: true,
      data: cart,
      message: '상품이 장바구니에 추가되었습니다'
    });
  } catch (error) {
    console.error('장바구니 상품 추가 실패:', error);
    res.status(500).json({
      success: false,
      message: '장바구니 상품 추가 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

/**
 * 장바구니에 여러 상품 일괄 추가
 */
const addBulkItems = async (req, res) => {
  try {
    const { items } = req.body;
    const userId = req.user.userId;

    // 장바구니 찾기 또는 생성
    let cart = await Cart.findOne({ user: userId, status: 'active' });
    if (!cart) {
      cart = new Cart({
        user: userId,
        items: [],
        status: 'active'
      });
    }

    const results = [];
    const errors = [];

    for (const item of items) {
      try {
        // 상품 존재 여부 확인
        const product = await Product.findById(item.productId);
        if (!product) {
          errors.push({
            productId: item.productId,
            error: '상품을 찾을 수 없습니다'
          });
          continue;
        }

        // 상품이 판매 중인지 확인
        if (product.status !== '판매중') {
          errors.push({
            productId: item.productId,
            error: '현재 판매 중이 아닌 상품입니다'
          });
          continue;
        }

        // 재고 확인
        if (product.stock < item.quantity) {
          errors.push({
            productId: item.productId,
            error: `재고가 부족합니다. (현재 재고: ${product.stock}개)`
          });
          continue;
        }

        // 상품 추가
        await cart.addItem(item.productId, item.quantity, {
          selectedSize: item.selectedSize,
          selectedColor: item.selectedColor,
          additionalOptions: item.additionalOptions
        });

        results.push({
          productId: item.productId,
          success: true
        });
      } catch (error) {
        errors.push({
          productId: item.productId,
          error: error.message
        });
      }
    }

    // 최신 정보로 다시 조회
    await cart.populate({
      path: 'items.product',
      select: 'name price originalPrice image category stock status'
    });

    res.status(201).json({
      success: true,
      data: cart,
      results,
      errors,
      message: `총 ${results.length}개 상품이 추가되었습니다${errors.length > 0 ? `, ${errors.length}개 실패` : ''}`
    });
  } catch (error) {
    console.error('장바구니 일괄 상품 추가 실패:', error);
    res.status(500).json({
      success: false,
      message: '장바구니 일괄 상품 추가 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

// ==================== UPDATE (수정) ====================

/**
 * 장바구니 아이템 수량 업데이트
 */
const updateItemQuantity = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const userId = req.user.userId;

    const cart = await Cart.findOne({ user: userId, status: 'active' });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: '장바구니를 찾을 수 없습니다'
      });
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: '장바구니 아이템을 찾을 수 없습니다'
      });
    }

    // 상품 정보 조회하여 재고 확인
    const product = await Product.findById(item.product);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다'
      });
    }

    if (quantity > 0 && product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `재고가 부족합니다. (현재 재고: ${product.stock}개)`
      });
    }

    // 수량 업데이트
    await cart.updateItemQuantity(itemId, quantity);

    // 최신 정보로 다시 조회
    await cart.populate({
      path: 'items.product',
      select: 'name price originalPrice image category stock status'
    });

    res.json({
      success: true,
      data: cart,
      message: quantity === 0 ? '상품이 장바구니에서 제거되었습니다' : '수량이 업데이트되었습니다'
    });
  } catch (error) {
    console.error('장바구니 아이템 수량 업데이트 실패:', error);
    res.status(500).json({
      success: false,
      message: '장바구니 아이템 수량 업데이트 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

/**
 * 장바구니 아이템 옵션 업데이트
 */
const updateItemOptions = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { selectedSize, selectedColor, additionalOptions } = req.body;
    const userId = req.user.userId;

    const cart = await Cart.findOne({ user: userId, status: 'active' });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: '장바구니를 찾을 수 없습니다'
      });
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: '장바구니 아이템을 찾을 수 없습니다'
      });
    }

    // 옵션 업데이트
    if (selectedSize !== undefined) item.selectedSize = selectedSize;
    if (selectedColor !== undefined) item.selectedColor = selectedColor;
    if (additionalOptions !== undefined) item.additionalOptions = additionalOptions;

    await cart.save();

    // 최신 정보로 다시 조회
    await cart.populate({
      path: 'items.product',
      select: 'name price originalPrice image category stock status'
    });

    res.json({
      success: true,
      data: cart,
      message: '아이템 옵션이 업데이트되었습니다'
    });
  } catch (error) {
    console.error('장바구니 아이템 옵션 업데이트 실패:', error);
    res.status(500).json({
      success: false,
      message: '장바구니 아이템 옵션 업데이트 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

/**
 * 세션 장바구니와 사용자 장바구니 병합
 */
const mergeSessionCart = async (req, res) => {
  try {
    const { sessionCartItems } = req.body;
    const userId = req.user.userId;

    // 장바구니 찾기 또는 생성
    let cart = await Cart.findOne({ user: userId, status: 'active' });
    if (!cart) {
      cart = new Cart({
        user: userId,
        items: [],
        status: 'active'
      });
    }

    const results = [];
    const errors = [];

    for (const item of sessionCartItems) {
      try {
        // 상품 존재 여부 확인
        const product = await Product.findById(item.productId);
        if (!product) {
          errors.push({
            productId: item.productId,
            error: '상품을 찾을 수 없습니다'
          });
          continue;
        }

        // 상품이 판매 중인지 확인
        if (product.status !== '판매중') {
          errors.push({
            productId: item.productId,
            error: '현재 판매 중이 아닌 상품입니다'
          });
          continue;
        }

        // 재고 확인
        if (product.stock < item.quantity) {
          errors.push({
            productId: item.productId,
            error: `재고가 부족합니다. (현재 재고: ${product.stock}개)`
          });
          continue;
        }

        // 상품 추가 또는 수량 업데이트
        await cart.addItem(item.productId, item.quantity, {
          selectedSize: item.selectedSize,
          selectedColor: item.selectedColor,
          additionalOptions: item.additionalOptions
        });

        results.push({
          productId: item.productId,
          success: true
        });
      } catch (error) {
        errors.push({
          productId: item.productId,
          error: error.message
        });
      }
    }

    // 최신 정보로 다시 조회
    await cart.populate({
      path: 'items.product',
      select: 'name price originalPrice image category stock status'
    });

    res.json({
      success: true,
      data: cart,
      results,
      errors,
      message: `총 ${results.length}개 상품이 병합되었습니다${errors.length > 0 ? `, ${errors.length}개 실패` : ''}`
    });
  } catch (error) {
    console.error('세션 장바구니 병합 실패:', error);
    res.status(500).json({
      success: false,
      message: '세션 장바구니 병합 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

// ==================== DELETE (삭제) ====================

/**
 * 장바구니에서 특정 아이템 제거
 */
const removeItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user.userId;

    console.log('장바구니 아이템 제거 요청:', { itemId, userId });

    const cart = await Cart.findOne({ user: userId, status: 'active' });
    if (!cart) {
      console.log('장바구니를 찾을 수 없음:', userId);
      return res.status(404).json({
        success: false,
        message: '장바구니를 찾을 수 없습니다'
      });
    }

    console.log('장바구니 찾음, 아이템 수:', cart.items.length);

    const item = cart.items.id(itemId);
    if (!item) {
      console.log('아이템을 찾을 수 없음:', itemId);
      return res.status(404).json({
        success: false,
        message: '장바구니 아이템을 찾을 수 없습니다'
      });
    }

    console.log('아이템 찾음:', item.product);

    // 아이템 제거
    try {
      await cart.removeItem(itemId);
      console.log('아이템 제거 완료');
    } catch (removeError) {
      console.error('removeItem 메서드 오류:', removeError);
      throw removeError;
    }

    // 최신 정보로 다시 조회
    await cart.populate({
      path: 'items.product',
      select: 'name price originalPrice image category stock status'
    });

    console.log('장바구니 재조회 완료, 남은 아이템 수:', cart.items.length);

    res.json({
      success: true,
      data: cart,
      message: '상품이 장바구니에서 제거되었습니다'
    });
  } catch (error) {
    console.error('장바구니 아이템 제거 실패:', error);
    res.status(500).json({
      success: false,
      message: '장바구니 아이템 제거 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

/**
 * 장바구니에서 여러 아이템 일괄 제거
 */
const removeBulkItems = async (req, res) => {
  try {
    const { itemIds } = req.body;
    const userId = req.user.userId;

    const cart = await Cart.findOne({ user: userId, status: 'active' });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: '장바구니를 찾을 수 없습니다'
      });
    }

    const results = [];
    const errors = [];

    for (const itemId of itemIds) {
      try {
        const item = cart.items.id(itemId);
        if (!item) {
          errors.push({
            itemId,
            error: '장바구니 아이템을 찾을 수 없습니다'
          });
          continue;
        }

        cart.items.id(itemId).remove();
        results.push({
          itemId,
          success: true
        });
      } catch (error) {
        errors.push({
          itemId,
          error: error.message
        });
      }
    }

    await cart.save();

    // 최신 정보로 다시 조회
    await cart.populate({
      path: 'items.product',
      select: 'name price originalPrice image category stock status'
    });

    res.json({
      success: true,
      data: cart,
      results,
      errors,
      message: `총 ${results.length}개 상품이 제거되었습니다${errors.length > 0 ? `, ${errors.length}개 실패` : ''}`
    });
  } catch (error) {
    console.error('장바구니 일괄 아이템 제거 실패:', error);
    res.status(500).json({
      success: false,
      message: '장바구니 일괄 아이템 제거 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

/**
 * 장바구니 전체 비우기
 */
const clearCart = async (req, res) => {
  try {
    const userId = req.user.userId;

    const cart = await Cart.findOne({ user: userId, status: 'active' });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: '장바구니를 찾을 수 없습니다'
      });
    }

    // 장바구니 비우기
    await cart.clear();

    res.json({
      success: true,
      data: cart,
      message: '장바구니가 비워졌습니다'
    });
  } catch (error) {
    console.error('장바구니 비우기 실패:', error);
    res.status(500).json({
      success: false,
      message: '장바구니 비우기 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

// ==================== UTILITY (유틸리티) ====================

/**
 * 체크아웃 미리보기
 */
const getCheckoutPreview = async (req, res) => {
  try {
    const userId = req.user.userId;

    const cart = await Cart.findOne({ user: userId, status: 'active' })
      .populate({
        path: 'items.product',
        select: 'name price originalPrice image category stock status'
      });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: '장바구니가 비어있습니다'
      });
    }

    // 유효성 검사
    const validationResults = [];
    let totalAmount = 0;
    let totalItems = 0;

    for (const item of cart.items) {
      if (!item.product) {
        validationResults.push({
          itemId: item._id,
          error: '상품 정보를 찾을 수 없습니다'
        });
        continue;
      }

      if (item.product.status !== '판매중') {
        validationResults.push({
          itemId: item._id,
          productName: item.product.name,
          error: '현재 판매 중이 아닌 상품입니다'
        });
        continue;
      }

      if (item.product.stock < item.quantity) {
        validationResults.push({
          itemId: item._id,
          productName: item.product.name,
          error: `재고가 부족합니다. (현재 재고: ${item.product.stock}개)`
        });
        continue;
      }

      totalAmount += item.product.price * item.quantity;
      totalItems += item.quantity;
    }

    res.json({
      success: true,
      data: {
        cart,
        totalAmount,
        totalItems,
        validationResults,
        isValid: validationResults.length === 0
      },
      message: validationResults.length === 0 ? '체크아웃 준비 완료' : '일부 상품에 문제가 있습니다'
    });
  } catch (error) {
    console.error('체크아웃 미리보기 실패:', error);
    res.status(500).json({
      success: false,
      message: '체크아웃 미리보기 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

/**
 * 장바구니 유효성 검사
 */
const validateCart = async (req, res) => {
  try {
    const userId = req.user.userId;

    const cart = await Cart.findOne({ user: userId, status: 'active' })
      .populate({
        path: 'items.product',
        select: 'name price originalPrice stock status'
      });

    if (!cart || cart.items.length === 0) {
      return res.json({
        success: true,
        data: {
          isValid: true,
          issues: []
        },
        message: '장바구니가 비어있습니다'
      });
    }

    const issues = [];

    for (const item of cart.items) {
      if (!item.product) {
        issues.push({
          itemId: item._id,
          error: '상품 정보를 찾을 수 없습니다'
        });
        continue;
      }

      if (item.product.status !== '판매중') {
        issues.push({
          itemId: item._id,
          productName: item.product.name,
          error: '현재 판매 중이 아닌 상품입니다'
        });
      }

      if (item.product.stock < item.quantity) {
        issues.push({
          itemId: item._id,
          productName: item.product.name,
          error: `재고가 부족합니다. (현재 재고: ${item.product.stock}개)`
        });
      }
    }

    res.json({
      success: true,
      data: {
        isValid: issues.length === 0,
        issues
      },
      message: issues.length === 0 ? '장바구니가 유효합니다' : `${issues.length}개의 문제가 발견되었습니다`
    });
  } catch (error) {
    console.error('장바구니 유효성 검사 실패:', error);
    res.status(500).json({
      success: false,
      message: '장바구니 유효성 검사 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

/**
 * 사용자의 버려진 장바구니 조회
 */
const getAbandonedCarts = async (req, res) => {
  try {
    const userId = req.user.userId;

    const abandonedCarts = await Cart.find({ 
      user: userId, 
      status: 'abandoned' 
    })
    .populate({
      path: 'items.product',
      select: 'name price originalPrice image category'
    })
    .sort({ lastUpdated: -1 });

    res.json({
      success: true,
      data: abandonedCarts,
      message: '버려진 장바구니 조회 성공'
    });
  } catch (error) {
    console.error('버려진 장바구니 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '버려진 장바구니 조회 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

/**
 * 버려진 장바구니 복원
 */
const restoreCart = async (req, res) => {
  try {
    const { cartId } = req.params;
    const userId = req.user.userId;

    const cart = await Cart.findOne({ 
      _id: cartId, 
      user: userId, 
      status: 'abandoned' 
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: '복원할 장바구니를 찾을 수 없습니다'
      });
    }

    // 현재 활성 장바구니가 있는지 확인
    const activeCart = await Cart.findOne({ user: userId, status: 'active' });
    
    if (activeCart) {
      // 기존 활성 장바구니와 병합
      for (const item of cart.items) {
        await activeCart.addItem(item.product, item.quantity, {
          selectedSize: item.selectedSize,
          selectedColor: item.selectedColor,
          additionalOptions: item.additionalOptions
        });
      }
      
      // 버려진 장바구니 삭제
      await Cart.findByIdAndDelete(cartId);
      
      // 최신 정보로 다시 조회
      await activeCart.populate({
        path: 'items.product',
        select: 'name price originalPrice image category stock status'
      });

      res.json({
        success: true,
        data: activeCart,
        message: '장바구니가 현재 장바구니와 병합되었습니다'
      });
    } else {
      // 버려진 장바구니를 활성화
      cart.status = 'active';
      cart.lastUpdated = new Date();
      await cart.save();

      // 최신 정보로 다시 조회
      await cart.populate({
        path: 'items.product',
        select: 'name price originalPrice image category stock status'
      });

      res.json({
        success: true,
        data: cart,
        message: '장바구니가 복원되었습니다'
      });
    }
  } catch (error) {
    console.error('장바구니 복원 실패:', error);
    res.status(500).json({
      success: false,
      message: '장바구니 복원 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

module.exports = {
  // READ
  getCart,
  getCartItems,
  getCartSummary,
  getCartCount,
  
  // CREATE
  addItem,
  addBulkItems,
  
  // UPDATE
  updateItemQuantity,
  updateItemOptions,
  mergeSessionCart,
  
  // DELETE
  removeItem,
  removeBulkItems,
  clearCart,
  
  // UTILITY
  getCheckoutPreview,
  validateCart,
  getAbandonedCarts,
  restoreCart
};
