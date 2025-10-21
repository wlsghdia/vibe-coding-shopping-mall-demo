const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  // 상품 이름 (필수)
  name: {
    type: String,
    required: [true, '상품 이름은 필수입니다'],
    trim: true,
    maxlength: [100, '상품 이름은 100자를 초과할 수 없습니다']
  },

  // 상품 가격 (필수)
  price: {
    type: Number,
    required: [true, '상품 가격은 필수입니다'],
    min: [0, '상품 가격은 0 이상이어야 합니다'],
    max: [999999, '상품 가격은 999,999를 초과할 수 없습니다']
  },

  // 정가 (선택사항)
  originalPrice: {
    type: Number,
    min: [0, '정가는 0 이상이어야 합니다'],
    max: [999999, '정가는 999,999를 초과할 수 없습니다']
  },

  // 상품 카테고리 (필수)
  category: {
    type: String,
    required: [true, '상품 카테고리는 필수입니다'],
    enum: {
      values: ['상의', '하의', '원피스', '신발', '액세서리', '기타'],
      message: '유효하지 않은 카테고리입니다'
    }
  },

  // 상품 이미지 (필수)
  image: {
    type: String,
    required: [true, '상품 이미지는 필수입니다'],
    validate: {
      validator: function(v) {
        // URL 형식 검증
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
      },
      message: '유효한 이미지 URL을 입력해주세요'
    }
  },

  // 상품 설명 (선택사항)
  description: {
    type: String,
    trim: true,
    maxlength: [1000, '상품 설명은 1000자를 초과할 수 없습니다']
  },

  // SKU (Stock Keeping Unit) - 유니크 필수
  sku: {
    type: String,
    required: [true, 'SKU는 필수입니다'],
    unique: true,
    trim: true,
    uppercase: true,
    match: [/^[A-Z0-9-]+$/, 'SKU는 영문 대문자, 숫자, 하이픈만 사용 가능합니다'],
    minlength: [3, 'SKU는 최소 3자 이상이어야 합니다'],
    maxlength: [20, 'SKU는 20자를 초과할 수 없습니다']
  },

  // 재고 수량
  stock: {
    type: Number,
    default: 0,
    min: [0, '재고 수량은 0 이상이어야 합니다']
  },

  // 상품 상태
  status: {
    type: String,
    enum: ['판매중', '품절', '단종', '숨김'],
    default: '판매중'
  },

  // 태그 (검색용)
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, '태그는 20자를 초과할 수 없습니다']
  }],

  // 할인 정보
  discount: {
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage'
    },
    value: {
      type: Number,
      min: [0, '할인 값은 0 이상이어야 합니다'],
      max: [100, '할인율은 100%를 초과할 수 없습니다']
    },
    startDate: Date,
    endDate: Date
  },

  // 메타데이터
  metadata: {
    weight: Number, // 무게 (kg)
    dimensions: {
      length: Number, // 길이 (cm)
      width: Number,  // 너비 (cm)
      height: Number // 높이 (cm)
    },
    material: String, // 소재
    color: String,    // 색상
    size: String      // 사이즈
  },

  // 생성/수정 정보
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true, // createdAt, updatedAt 자동 생성
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 가상 필드: 할인된 가격
productSchema.virtual('discountedPrice').get(function() {
  if (!this.discount || !this.discount.value) {
    return this.price;
  }
  
  if (this.discount.type === 'percentage') {
    return Math.round(this.price * (1 - this.discount.value / 100));
  } else {
    return Math.max(0, this.price - this.discount.value);
  }
});

// 가상 필드: 할인 여부
productSchema.virtual('isOnSale').get(function() {
  if (!this.discount || !this.discount.value) {
    return false;
  }
  
  const now = new Date();
  const startDate = this.discount.startDate || new Date(0);
  const endDate = this.discount.endDate || new Date('2099-12-31');
  
  return now >= startDate && now <= endDate;
});

// 인덱스 설정
// sku는 필드에서 unique: true로 인덱스가 생성되므로 별도 index 중복 생성 제거
productSchema.index({ name: 'text', description: 'text', tags: 'text' }); // 텍스트 검색 인덱스
productSchema.index({ category: 1, status: 1 }); // 카테고리, 상태 복합 인덱스
productSchema.index({ price: 1 }); // 가격 인덱스
productSchema.index({ createdAt: -1 }); // 생성일 역순 인덱스

// 미들웨어: SKU 자동 생성 (선택사항)
productSchema.pre('save', function(next) {
  // SKU가 없으면 자동 생성
  if (!this.sku) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.sku = `PROD-${timestamp}-${random}`.toUpperCase();
  }
  next();
});

// 정적 메서드: SKU 중복 확인
productSchema.statics.isSkuUnique = async function(sku, excludeId = null) {
  const query = { sku: sku.toUpperCase() };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  const existingProduct = await this.findOne(query);
  return !existingProduct;
};

// 정적 메서드: 카테고리별 상품 조회
productSchema.statics.findByCategory = function(category, limit = 10) {
  return this.find({ 
    category, 
    status: '판매중' 
  }).limit(limit);
};

// 인스턴스 메서드: 재고 업데이트
productSchema.methods.updateStock = function(quantity) {
  this.stock = Math.max(0, this.stock + quantity);
  return this.save();
};

// 인스턴스 메서드: 상품 활성화/비활성화
productSchema.methods.toggleStatus = function() {
  this.status = this.status === '판매중' ? '숨김' : '판매중';
  return this.save();
};

module.exports = mongoose.model('Product', productSchema);
