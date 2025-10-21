const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, '이메일은 필수입니다'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, '올바른 이메일 형식이 아닙니다']
  },
  name: {
    type: String,
    required: [true, '이름은 필수입니다'],
    trim: true,
    minlength: [2, '이름은 최소 2글자 이상이어야 합니다'],
    maxlength: [50, '이름은 최대 50글자까지 가능합니다']
  },
  password: {
    type: String,
    required: [true, '비밀번호는 필수입니다'],
    minlength: [6, '비밀번호는 최소 6글자 이상이어야 합니다']
  },
  user_type: {
    type: String,
    required: [true, '사용자 타입은 필수입니다'],
    enum: {
      values: ['customer', 'admin'],
      message: '사용자 타입은 customer 또는 admin이어야 합니다'
    },
    default: 'customer'
  },
  address: {
    type: String,
    required: false,
    trim: true,
    maxlength: [200, '주소는 최대 200글자까지 가능합니다']
  }
}, {
  timestamps: true, // createdAt, updatedAt 자동 생성
  versionKey: false // __v 필드 제거
});

// 인덱스 설정 (email은 unique: true로 이미 인덱스가 생성됨)
userSchema.index({ user_type: 1 });

// 가상 필드 (password는 JSON으로 변환할 때 제외)
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

// 비밀번호를 포함한 사용자 객체를 반환하는 메서드 (로그인 시 필요)
userSchema.methods.toObjectWithPassword = function() {
  return this.toObject();
};

// 정적 메서드: 이메일로 사용자 찾기
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// 정적 메서드: 관리자 사용자 찾기
userSchema.statics.findAdmins = function() {
  return this.find({ user_type: 'admin' });
};

// 정적 메서드: 고객 사용자 찾기
userSchema.statics.findCustomers = function() {
  return this.find({ user_type: 'customer' });
};

module.exports = mongoose.model('User', userSchema);
