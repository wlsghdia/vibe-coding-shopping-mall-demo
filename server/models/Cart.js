const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  // 상품 ID (참조)
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, '상품 ID는 필수입니다']
  },

  // 수량 (필수)
  quantity: {
    type: Number,
    required: [true, '수량은 필수입니다'],
    min: [1, '수량은 최소 1개 이상이어야 합니다'],
    max: [99, '수량은 최대 99개까지 가능합니다']
  },

  // 선택된 사이즈 (선택사항)
  selectedSize: {
    type: String,
    trim: true,
    maxlength: [10, '사이즈는 10자를 초과할 수 없습니다']
  },

  // 선택된 색상 (선택사항)
  selectedColor: {
    type: String,
    trim: true,
    maxlength: [20, '색상은 20자를 초과할 수 없습니다']
  },

  // 추가 옵션 (선택사항)
  additionalOptions: {
    type: Map,
    of: String
  },

  // 장바구니에 추가된 시간
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const cartSchema = new mongoose.Schema({
  // 사용자 ID (참조)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '사용자 ID는 필수입니다'],
    unique: true
  },

  // 장바구니 아이템들
  items: [cartItemSchema],

  // 장바구니 총 금액 (자동 계산)
  totalAmount: {
    type: Number,
    default: 0,
    min: [0, '총 금액은 0 이상이어야 합니다']
  },

  // 장바구니 총 아이템 수 (자동 계산)
  totalItems: {
    type: Number,
    default: 0,
    min: [0, '총 아이템 수는 0 이상이어야 합니다']
  },

  // 장바구니 상태
  status: {
    type: String,
    enum: {
      values: ['active', 'abandoned', 'converted'],
      message: '장바구니 상태는 active, abandoned, converted 중 하나여야 합니다'
    },
    default: 'active'
  },

  // 마지막 업데이트 시간
  lastUpdated: {
    type: Date,
    default: Date.now
  },

  // 만료 시간 (30일 후 자동 삭제)
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30일 후
    }
  }
}, {
  timestamps: true, // createdAt, updatedAt 자동 생성
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 가상 필드: 총 금액 계산
cartSchema.virtual('calculatedTotalAmount').get(function() {
  return this.items.reduce((total, item) => {
    // 상품 가격이 populate된 경우
    if (item.product && typeof item.product === 'object' && item.product.price) {
      return total + (item.product.price * item.quantity);
    }
    return total;
  }, 0);
});

// 가상 필드: 총 아이템 수 계산
cartSchema.virtual('calculatedTotalItems').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// 미들웨어: 저장 전에 총 금액과 아이템 수 업데이트
cartSchema.pre('save', function(next) {
  this.totalAmount = this.calculatedTotalAmount;
  this.totalItems = this.calculatedTotalItems;
  this.lastUpdated = new Date();
  next();
});

// 미들웨어: 업데이트 전에 총 금액과 아이템 수 업데이트
cartSchema.pre('findOneAndUpdate', function(next) {
  this.set({ lastUpdated: new Date() });
  next();
});

// 정적 메서드: 사용자 장바구니 찾기 또는 생성
cartSchema.statics.findOrCreateByUser = async function(userId) {
  let cart = await this.findOne({ user: userId, status: 'active' });
  
  if (!cart) {
    cart = new this({
      user: userId,
      items: [],
      status: 'active'
    });
    await cart.save();
  }
  
  return cart;
};

// 인스턴스 메서드: 상품 추가
cartSchema.methods.addItem = async function(productId, quantity = 1, options = {}) {
  const existingItem = this.items.find(item => 
    item.product.toString() === productId.toString() &&
    item.selectedSize === options.selectedSize &&
    item.selectedColor === options.selectedColor
  );

  if (existingItem) {
    // 기존 아이템이 있으면 수량 증가
    existingItem.quantity = Math.min(existingItem.quantity + quantity, 99);
  } else {
    // 새 아이템 추가
    this.items.push({
      product: productId,
      quantity: Math.min(quantity, 99),
      selectedSize: options.selectedSize || '',
      selectedColor: options.selectedColor || '',
      additionalOptions: options.additionalOptions || new Map()
    });
  }

  return await this.save();
};

// 인스턴스 메서드: 상품 수량 업데이트
cartSchema.methods.updateItemQuantity = async function(itemId, quantity) {
  const item = this.items.id(itemId);
  if (!item) {
    throw new Error('장바구니 아이템을 찾을 수 없습니다');
  }

  if (quantity <= 0) {
    item.remove();
  } else {
    item.quantity = Math.min(quantity, 99);
  }

  return await this.save();
};

// 인스턴스 메서드: 상품 제거
cartSchema.methods.removeItem = async function(itemId) {
  const itemIndex = this.items.findIndex(item => item._id.toString() === itemId.toString());
  if (itemIndex === -1) {
    throw new Error('장바구니 아이템을 찾을 수 없습니다.');
  }
  
  // 배열에서 아이템 제거
  this.items.splice(itemIndex, 1);
  return await this.save();
};

// 인스턴스 메서드: 장바구니 비우기
cartSchema.methods.clear = async function() {
  this.items = [];
  return await this.save();
};

// 인스턴스 메서드: 장바구니 아이템 찾기
cartSchema.methods.findItem = function(productId, selectedSize = '', selectedColor = '') {
  return this.items.find(item => 
    item.product.toString() === productId.toString() &&
    item.selectedSize === selectedSize &&
    item.selectedColor === selectedColor
  );
};

// 인덱스 설정
cartSchema.index({ user: 1, status: 1 });
cartSchema.index({ 'items.product': 1 });
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Cart', cartSchema);
