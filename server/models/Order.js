const mongoose = require('mongoose');

// 주문 아이템 스키마 (서브도큐먼트)
const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, '수량은 1개 이상이어야 합니다']
  },
  price: {
    type: Number,
    required: true,
    min: [0, '가격은 0 이상이어야 합니다']
  },
  selectedSize: {
    type: String,
    trim: true
  },
  selectedColor: {
    type: String,
    trim: true
  }
}, { _id: true });

// 배송지 정보 스키마 (서브도큐먼트)
const shippingAddressSchema = new mongoose.Schema({
  recipientName: {
    type: String,
    required: true,
    trim: true,
    maxlength: [50, '수령인명은 50자를 초과할 수 없습니다']
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    match: [/^[0-9-+\s()]+$/, '올바른 전화번호 형식이 아닙니다']
  },
  address: {
    zipCode: {
      type: String,
      required: true,
      trim: true,
      match: [/^\d{5}$/, '우편번호는 5자리 숫자여야 합니다']
    },
    mainAddress: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, '주소는 200자를 초과할 수 없습니다']
    },
    detailAddress: {
      type: String,
      trim: true,
      maxlength: [200, '상세주소는 200자를 초과할 수 없습니다']
    }
  }
}, { _id: false });

// 결제 정보 스키마 (서브도큐먼트)
const paymentInfoSchema = new mongoose.Schema({
  method: {
    type: String,
    required: true,
    enum: {
      values: ['card', 'bank_transfer', 'kakao_pay', 'naver_pay', 'toss_pay', 'paypal'],
      message: '지원하지 않는 결제 방법입니다'
    }
  },
  status: {
    type: String,
    required: true,
    enum: {
      values: ['pending', 'completed', 'failed', 'cancelled'],
      message: '올바르지 않은 결제 상태입니다'
    },
    default: 'pending'
  },
  transactionId: {
    type: String,
    trim: true
  },
  paidAt: {
    type: Date
  }
}, { _id: false });

// 주문 스키마
const orderSchema = new mongoose.Schema({
  // 기본 정보
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // 주문 상태
  status: {
    type: String,
    required: true,
    enum: {
      values: [
        'pending',        // 주문 대기
        'confirmed',      // 주문 확인
        'preparing',      // 상품 준비 중
        'shipped',        // 배송 중
        'delivered',      // 배송 완료
        'cancelled'       // 주문 취소
      ],
      message: '올바르지 않은 주문 상태입니다'
    },
    default: 'pending',
    index: true
  },
  
  // 주문 아이템들
  items: [orderItemSchema],
  
  // 가격 정보
  pricing: {
    subtotal: {
      type: Number,
      required: true,
      min: [0, '소계는 0 이상이어야 합니다']
    },
    total: {
      type: Number,
      required: true,
      min: [0, '총 금액은 0 이상이어야 합니다']
    }
  },
  
  // 총 금액 (호환성을 위한 별도 필드)
  totalAmount: {
    type: Number,
    required: true,
    min: [0, '총 금액은 0 이상이어야 합니다']
  },
  
  // 배송 정보
  shipping: {
    address: shippingAddressSchema,
    method: {
      type: String,
      enum: ['standard', 'express'],
      default: 'standard'
    },
    trackingNumber: {
      type: String,
      trim: true
    },
    carrier: {
      type: String,
      trim: true
    }
  },
  
  // 결제 정보
  payment: paymentInfoSchema,
  
  // 주문 메모 (관리자용)
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, '주문 메모는 1000자를 초과할 수 없습니다']
  },
  
  // 만료 시간 (미결제 주문 자동 취소용)
  expiresAt: {
    type: Date,
    index: { expires: 0 } // TTL 인덱스
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 가상 필드: 총 아이템 수
orderSchema.virtual('totalItems').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// 가상 필드: 주문 요약
orderSchema.virtual('summary').get(function() {
  return {
    orderNumber: this.orderNumber,
    status: this.status,
    totalItems: this.totalItems,
    total: this.pricing.total,
    createdAt: this.createdAt
  };
});

// 인덱스 설정
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ 'payment.transactionId': 1 });
orderSchema.index({ 'shipping.trackingNumber': 1 });

// 미들웨어: 주문 번호 자동 생성
orderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    // 같은 날짜의 주문 수를 세어서 순번 생성
    const todayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    
    const count = await this.constructor.countDocuments({
      createdAt: { $gte: todayStart, $lt: todayEnd }
    });
    
    const sequence = (count + 1).toString().padStart(4, '0');
    this.orderNumber = `ORD${year}${month}${day}${sequence}`;
  }
  next();
});


// 미들웨어: 만료 시간 설정 (미결제 주문의 경우)
orderSchema.pre('save', function(next) {
  if (this.isNew && this.status === 'pending' && this.payment.status === 'pending') {
    // 30분 후 만료
    this.expiresAt = new Date(Date.now() + 30 * 60 * 1000);
  }
  next();
});

// 인스턴스 메서드: 주문 취소
orderSchema.methods.cancel = function(userId) {
  if (this.status === 'delivered' || this.status === 'cancelled') {
    throw new Error('배송 완료된 주문이거나 이미 취소된 주문입니다');
  }
  
  this.status = 'cancelled';
  return this.save();
};

// 인스턴스 메서드: 배송 상태 업데이트
orderSchema.methods.updateShipping = function(trackingNumber, carrier) {
  this.shipping.trackingNumber = trackingNumber;
  this.shipping.carrier = carrier;
  this.status = 'shipped';
  
  return this.save();
};

// 정적 메서드: 사용자별 주문 조회
orderSchema.statics.findByUser = function(userId, options = {}) {
  const query = { user: userId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  return this.find(query)
    .populate('items.product', 'name image category')
    .sort({ createdAt: -1 })
    .limit(options.limit || 20)
    .skip(options.skip || 0);
};

// 정적 메서드: 주문 통계
orderSchema.statics.getStats = function(startDate, endDate) {
  const match = {};
  
  if (startDate && endDate) {
    match.createdAt = { $gte: startDate, $lte: endDate };
  }
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$pricing.total' }
      }
    }
  ]);
};

module.exports = mongoose.model('Order', orderSchema);
