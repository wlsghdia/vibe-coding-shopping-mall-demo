const User = require('../models/User');
const bcrypt = require('bcrypt');

// 입력 데이터 검증 함수 (표준 에러 포맷: { field, message })
const validateUserInput = (data, isUpdate = false) => {
  const errors = [];
  const pushErr = (field, message) => errors.push({ field, message });

  // 필수 필드 검증 (생성 시에만)
  if (!isUpdate) {
    if (!data.email) pushErr('email', '이메일은 필수입니다');
    if (!data.name) pushErr('name', '이름은 필수입니다');
    if (!data.password) pushErr('password', '비밀번호는 필수입니다');
    if (!data.user_type) pushErr('user_type', '사용자 타입은 필수입니다');
  }

  // 이메일 형식 검증
  if (data.email && !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(data.email)) {
    pushErr('email', '올바른 이메일 형식이 아닙니다');
  }
  
  // 이름 길이 검증
  if (data.name && (data.name.length < 2 || data.name.length > 50)) {
    pushErr('name', '이름은 2-50글자 사이여야 합니다');
  }
  
  // 이름 공백 검증
  if (data.name && data.name.includes(' ')) {
    pushErr('name', '이름에는 공백을 포함할 수 없습니다');
  }
  
  // 이름 문자 검증 (한글/영문/숫자 허용 - 클라이언트와 일치)
  if (data.name && !/^[가-힣a-zA-Z0-9]+$/.test(data.name)) {
    pushErr('name', '이름은 한글, 영문, 숫자만 입력 가능합니다');
  }
  
  // 비밀번호 길이 검증
  if (data.password && data.password.length < 6) {
    pushErr('password', '비밀번호는 최소 6글자 이상이어야 합니다');
  }
  
  // 사용자 타입 검증
  if (data.user_type && !['customer', 'admin'].includes(data.user_type)) {
    pushErr('user_type', '사용자 타입은 customer 또는 admin이어야 합니다');
  }
  
  // 주소 길이 검증
  if (data.address && data.address.length > 200) {
    pushErr('address', '주소는 최대 200글자까지 가능합니다');
  }
  
  return errors;
};

// GET /api/users - 모든 사용자 조회
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, user_type, search } = req.query;
    const skip = (page - 1) * limit;
    
    // 쿼리 조건 구성
    const query = {};
    if (user_type) query.user_type = user_type;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const users = await User.find(query)
      .select('-password') // password 필드 제외
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments(query);
    
    res.json({
      status: 'success',
      data: users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total: total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: '사용자 목록을 가져오는데 실패했습니다',
      error: error.message
    });
  }
};

// GET /api/users/:id - 특정 사용자 조회
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: '사용자를 찾을 수 없습니다'
      });
    }
    
    res.json({
      status: 'success',
      data: user
    });
  } catch (error) {
    if (error.name === 'CastError') {
      res.status(400).json({
        status: 'error',
        message: '올바르지 않은 사용자 ID입니다'
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: '사용자 정보를 가져오는데 실패했습니다',
        error: error.message
      });
    }
  }
};

// POST /api/users - 새 사용자 생성
const createUser = async (req, res) => {
  try {
    const { email, name, password, user_type, address } = req.body;
    
    // 입력 데이터 검증
    const validationErrors = validateUserInput(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: '입력 데이터가 올바르지 않습니다',
        errors: validationErrors
      });
    }
    
    // 이메일 중복 확인
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        code: 'DUPLICATE_EMAIL',
        message: '이미 사용 중인 이메일입니다',
        errors: [{ field: 'email', message: '이미 사용 중인 이메일입니다' }]
      });
    }
    
    // 패스워드 암호화
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    const user = new User({
      email: email.toLowerCase(),
      name,
      password: hashedPassword,
      user_type,
      address: address || undefined
    });
    
    await user.save();
    
    res.status(201).json({
      success: true,
      message: '사용자가 성공적으로 생성되었습니다',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: '사용자 생성에 실패했습니다',
      error: error.message
    });
  }
};

// PUT /api/users/:id - 사용자 정보 수정
const updateUser = async (req, res) => {
  try {
    const { name, password, user_type, address } = req.body;
    
    // 입력 데이터 검증 (업데이트용)
    const validationErrors = validateUserInput(req.body, true);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: '입력 데이터가 올바르지 않습니다',
        errors: validationErrors
      });
    }
    
    const updateData = {};
    if (name) updateData.name = name;
    if (password) {
      // 패스워드 암호화
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(password, saltRounds);
    }
    if (user_type) updateData.user_type = user_type;
    if (address !== undefined) updateData.address = address;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: '사용자를 찾을 수 없습니다'
      });
    }
    
    res.json({
      status: 'success',
      message: '사용자 정보가 성공적으로 수정되었습니다',
      data: user
    });
  } catch (error) {
    if (error.name === 'CastError') {
      res.status(400).json({
        status: 'error',
        message: '올바르지 않은 사용자 ID입니다'
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: '사용자 정보 수정에 실패했습니다',
        error: error.message
      });
    }
  }
};

// DELETE /api/users/:id - 사용자 삭제
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: '사용자를 찾을 수 없습니다'
      });
    }
    
    res.json({
      status: 'success',
      message: '사용자가 성공적으로 삭제되었습니다',
      data: { id: user._id, email: user.email }
    });
  } catch (error) {
    if (error.name === 'CastError') {
      res.status(400).json({
        status: 'error',
        message: '올바르지 않은 사용자 ID입니다'
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: '사용자 삭제에 실패했습니다',
        error: error.message
      });
    }
  }
};

// GET /api/users/email/:email - 이메일로 사용자 찾기
const getUserByEmail = async (req, res) => {
  try {
    const user = await User.findByEmail(req.params.email);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: '사용자를 찾을 수 없습니다'
      });
    }
    
    res.json({
      status: 'success',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: '사용자 검색에 실패했습니다',
      error: error.message
    });
  }
};

// GET /api/users/type/:user_type - 사용자 타입별 조회
const getUsersByType = async (req, res) => {
  try {
    const { user_type } = req.params;
    
    if (!['customer', 'admin'].includes(user_type)) {
      return res.status(400).json({
        status: 'error',
        message: '올바르지 않은 사용자 타입입니다'
      });
    }
    
    const users = user_type === 'admin' 
      ? await User.findAdmins() 
      : await User.findCustomers();
    
    res.json({
      status: 'success',
      data: users,
      count: users.length
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: '사용자 목록을 가져오는데 실패했습니다',
      error: error.message
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserByEmail,
  getUsersByType
};
