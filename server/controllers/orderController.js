const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const mongoose = require('mongoose');
const axios = require('axios');

// ==================== 유틸리티 함수 ====================

/**
 * 주문 중복 체크
 */
const checkDuplicateOrder = async (userId, cartItems) => {
  try {
    // 최근 5분 내 동일한 상품으로 주문이 있는지 확인
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const recentOrders = await Order.find({
      user: userId,
      createdAt: { $gte: fiveMinutesAgo },
      status: { $in: ['pending', 'confirmed'] }
    }).populate('items.product');

    // 장바구니 아이템과 비교
    for (const recentOrder of recentOrders) {
      if (recentOrder.items.length === cartItems.length) {
        const isDuplicate = cartItems.every(cartItem => 
          recentOrder.items.some(orderItem => 
            orderItem.product._id.toString() === cartItem.product._id.toString() &&
            orderItem.quantity === cartItem.quantity
          )
        );
        
        if (isDuplicate) {
          return {
            isDuplicate: true,
            orderId: recentOrder._id,
            orderNumber: recentOrder.orderNumber
          };
        }
      }
    }
    
    return { isDuplicate: false };
  } catch (error) {
    console.error('주문 중복 체크 실패:', error);
    return { isDuplicate: false };
  }
};

/**
 * 포트원 결제 검증
 */
const verifyPayment = async (impUid, merchantUid) => {
  try {
    console.log('🔍 포트원 API 검증 시작:', { impUid, merchantUid });
    console.log('🔑 사용할 API 키:', process.env.IMP_KEY || 'imp31113166');
    
    // 포트원 토큰 발급
    console.log('📡 포트원 토큰 발급 요청 중...');
    const tokenResponse = await axios.post('https://api.iamport.kr/users/getToken', {
      imp_key: process.env.IMP_KEY, // 포트원 REST API 키
      imp_secret: process.env.IMP_SECRET // 포트원 REST API Secret
    });
    
    console.log('✅ 토큰 발급 성공:', tokenResponse.data);

    const accessToken = tokenResponse.data.response.access_token;

    // 결제 정보 조회
    console.log('💳 결제 정보 조회 요청 중...', { impUid });
    const paymentResponse = await axios.get(`https://api.iamport.kr/payments/${impUid}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    console.log('✅ 결제 정보 조회 성공:', paymentResponse.data);
    const payment = paymentResponse.data.response;
    
    // 결제 검증
    if (payment.status === 'paid' && payment.merchant_uid === merchantUid) {
      return {
        success: true,
        data: payment
      };
    } else {
      return {
        success: false,
        message: '결제 상태가 유효하지 않습니다'
      };
    }
  } catch (error) {
    console.error('❌ 결제 검증 실패 상세 정보:');
    console.error('📊 에러 타입:', error.name);
    console.error('📝 에러 메시지:', error.message);
    console.error('🔗 응답 상태:', error.response?.status);
    console.error('📄 응답 데이터:', error.response?.data);
    console.error('🌐 요청 URL:', error.config?.url);
    console.error('📋 요청 헤더:', error.config?.headers);
    
    return {
      success: false,
      message: `결제 검증 중 오류가 발생했습니다: ${error.message}`
    };
  }
};

// ==================== READ (조회) ====================

/**
 * 관리자용 주문 목록 조회 (모든 사용자의 주문)
 */
const getAdminOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      startDate,
      endDate
    } = req.query;

    const query = {};
    
    // 상태 필터
    if (status) {
      query.status = status;
    }
    
    // 날짜 필터
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // 검색 필터 (주문번호 또는 사용자명)
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    
    const orders = await Order.find(query)
      .populate('user', 'name email')
      .populate('items.product', 'name image category price')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('관리자 주문 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '주문 목록을 불러오는데 실패했습니다',
      error: error.message
    });
  }
};

/**
 * 주문 목록 조회 (사용자별)
 */
const getOrders = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      page = 1,
      limit = 10,
      status,
      startDate,
      endDate
    } = req.query;

    const query = { user: userId };
    
    if (status) {
      query.status = status;
    }
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const skip = (page - 1) * limit;
    
    const orders = await Order.find(query)
      .populate('items.product', 'name image category price')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('주문 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '주문 목록 조회 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

/**
 * 특정 주문 상세 조회
 */
const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.userId;

    const order = await Order.findOne({ _id: orderId, user: userId })
      .populate('items.product', 'name image category price originalPrice stock')
      .populate('user', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('주문 상세 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '주문 상세 조회 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

/**
 * 주문 통계 조회
 */
const getOrderStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { startDate, endDate } = req.query;

    const match = { user: userId };
    
    if (startDate && endDate) {
      match.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const stats = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$pricing.total' }
        }
      }
    ]);

    const totalOrders = await Order.countDocuments(match);
    const totalAmount = await Order.aggregate([
      { $match: match },
      { $group: { _id: null, total: { $sum: '$pricing.total' } } }
    ]);

    res.json({
      success: true,
      data: {
        statusStats: stats,
        totalOrders,
        totalAmount: totalAmount[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('주문 통계 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '주문 통계 조회 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

// ==================== CREATE (생성) ====================

/**
 * 주문 생성 (장바구니에서)
 */
const createOrderFromCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { shippingAddress, paymentMethod, notes, impUid, merchantUid } = req.body;

    // 장바구니 조회
    const cart = await Cart.findOne({ user: userId, status: 'active' })
      .populate('items.product', 'name price originalPrice stock status');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: '장바구니가 비어있습니다'
      });
    }

    // 1. 주문 중복 체크
    const duplicateCheck = await checkDuplicateOrder(userId, cart.items);
    if (duplicateCheck.isDuplicate) {
      return res.status(400).json({
        success: false,
        message: `최근 5분 내 동일한 주문이 이미 존재합니다. 주문번호: ${duplicateCheck.orderNumber}`,
        duplicateOrderId: duplicateCheck.orderId
      });
    }

    // 2. 결제 검증 (포트원 결제인 경우)
    if (paymentMethod === 'kakao_pay' || paymentMethod === 'naver_pay' || paymentMethod === 'card') {
      if (!impUid || !merchantUid) {
        return res.status(400).json({
          success: false,
          message: '결제 정보가 누락되었습니다'
        });
      }

      console.log('결제 검증 시작...', { impUid, merchantUid });
      const paymentVerification = await verifyPayment(impUid, merchantUid);
      console.log('결제 검증 결과:', paymentVerification);
      
      if (!paymentVerification.success) {
        return res.status(400).json({
          success: false,
          message: `결제 검증 실패: ${paymentVerification.message}`
        });
      }
    }

    // 상품 재고 확인 및 가격 계산
    const orderItems = [];
    let subtotal = 0;

    for (const cartItem of cart.items) {
      const product = cartItem.product;
      
      // 상품 상태 확인
      if (product.status !== '판매중') {
        return res.status(400).json({
          success: false,
          message: `상품 "${product.name}"이 현재 판매 중이 아닙니다`
        });
      }

      // 재고 확인
      if (product.stock < cartItem.quantity) {
        return res.status(400).json({
          success: false,
          message: `상품 "${product.name}"의 재고가 부족합니다 (현재 재고: ${product.stock}개)`
        });
      }

      const itemPrice = product.price;
      const itemTotal = itemPrice * cartItem.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product: product._id,
        quantity: cartItem.quantity,
        price: itemPrice,
        originalPrice: product.originalPrice,
        selectedSize: cartItem.selectedSize,
        selectedColor: cartItem.selectedColor,
        additionalOptions: cartItem.additionalOptions
      });
    }

    // 데모 버전에서는 배송비 없음
    const total = subtotal;

    // 주문 번호 생성
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const orderNumber = `ORD${year}${month}${day}${Date.now().toString().slice(-4)}`;

    // 로컬 MongoDB 환경에서는 트랜잭션 없이 순차적으로 처리
    // 각 단계별로 실패 시 이전 단계를 되돌리는 로직 포함
    let createdOrder = null;
    
    try {
      // 1단계: 주문 생성
      createdOrder = new Order({
        orderNumber, // 수동으로 orderNumber 설정
        user: userId,
        items: orderItems,
        pricing: {
          subtotal,
          total
        },
        totalAmount: total, // totalAmount 필드 추가
        shipping: {
          address: shippingAddress,
          method: 'standard'
        },
        payment: {
          method: paymentMethod,
          status: paymentMethod === 'kakao_pay' || paymentMethod === 'naver_pay' || paymentMethod === 'card' ? 'completed' : 'pending',
          transactionId: impUid || null,
          paidAt: paymentMethod === 'kakao_pay' || paymentMethod === 'naver_pay' || paymentMethod === 'card' ? new Date() : null
        },
        notes,
        status: paymentMethod === 'kakao_pay' || paymentMethod === 'naver_pay' || paymentMethod === 'card' ? 'confirmed' : 'pending'
      });

      await createdOrder.save();
      console.log('✅ 주문 생성 완료:', createdOrder._id);

      // 2단계: 장바구니 비우기
      try {
        await cart.clear();
        console.log('✅ 장바구니 비우기 완료');
      } catch (cartError) {
        console.error('❌ 장바구니 비우기 실패:', cartError);
        // 장바구니 비우기 실패해도 주문은 유지 (사용자가 수동으로 비울 수 있음)
      }

      // 3단계: 상품 재고 차감
      try {
        for (const item of orderItems) {
          await Product.findByIdAndUpdate(
            item.product,
            { $inc: { stock: -item.quantity } }
          );
        }
        console.log('✅ 재고 차감 완료');
      } catch (stockError) {
        console.error('❌ 재고 차감 실패:', stockError);
        // 재고 차감 실패 시 주문을 취소 상태로 변경
        if (createdOrder) {
          createdOrder.status = 'cancelled';
          createdOrder.notes = (createdOrder.notes || '') + ' [재고 부족으로 자동 취소]';
          await createdOrder.save();
          console.log('⚠️ 주문을 취소 상태로 변경 (재고 부족)');
        }
        throw new Error('재고 부족으로 주문을 처리할 수 없습니다');
      }

    } catch (error) {
      // 주문 생성 실패 시 생성된 주문이 있다면 삭제
      if (createdOrder && createdOrder._id) {
        try {
          await Order.findByIdAndDelete(createdOrder._id);
          console.log('✅ 실패한 주문 삭제 완료');
        } catch (deleteError) {
          console.error('❌ 실패한 주문 삭제 실패:', deleteError);
        }
      }
      
      console.error('주문 생성 실패:', error);
      throw error;
    }

    // 생성된 주문 정보 반환
    const populatedOrder = await Order.findById(createdOrder._id)
      .populate('items.product', 'name image category price');

    res.status(201).json({
      success: true,
      data: populatedOrder,
      message: '주문이 성공적으로 생성되었습니다'
    });
  } catch (error) {
    console.error('주문 생성 실패:', error);
    res.status(500).json({
      success: false,
      message: '주문 생성 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

/**
 * 직접 주문 생성 (상품 상세 페이지에서)
 */
const createDirectOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { 
      productId, 
      quantity, 
      selectedSize, 
      selectedColor, 
      shippingAddress, 
      paymentMethod, 
      notes 
    } = req.body;

    // 상품 조회
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다'
      });
    }

    // 상품 상태 확인
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
        message: `재고가 부족합니다 (현재 재고: ${product.stock}개)`
      });
    }

    // 가격 계산
    const itemPrice = product.price;
    const subtotal = itemPrice * quantity;
    const total = subtotal;

    // 주문 생성
    const order = new Order({
      user: userId,
      items: [{
        product: productId,
        quantity,
        price: itemPrice,
        originalPrice: product.originalPrice,
        selectedSize,
        selectedColor
      }],
      pricing: {
        subtotal,
        total
      },
      totalAmount: total, // totalAmount 필드 추가
      shipping: {
        address: shippingAddress,
        method: 'standard'
      },
      payment: {
        method: paymentMethod,
        status: 'pending'
      },
      notes,
      status: 'pending'
    });

    await order.save();

    // 상품 재고 차감
    await Product.findByIdAndUpdate(
      productId,
      { $inc: { stock: -quantity } }
    );

    // 생성된 주문 정보 반환
    const populatedOrder = await Order.findById(createdOrder._id)
      .populate('items.product', 'name image category price');

    res.status(201).json({
      success: true,
      data: populatedOrder,
      message: '주문이 성공적으로 생성되었습니다'
    });
  } catch (error) {
    console.error('직접 주문 생성 실패:', error);
    res.status(500).json({
      success: false,
      message: '직접 주문 생성 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

// ==================== UPDATE (수정) ====================

/**
 * 주문 상태 업데이트
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, reason } = req.body;
    const userId = req.user.userId;

    // 관리자인지 확인
    const user = await require('../models/User').findById(userId);
    const isAdmin = user && user.user_type === 'admin';

    // 관리자는 모든 주문 수정 가능, 일반 사용자는 자신의 주문만
    const query = isAdmin ? { _id: orderId } : { _id: orderId, user: userId };
    
    const order = await Order.findOne(query);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다'
      });
    }

    // 테스트 모드: 관리자는 모든 상태로 자유롭게 변경 가능
    // 상태 변경 제한 없음

    order.status = status;

    await order.save();

    res.json({
      success: true,
      data: order,
      message: '주문 상태가 업데이트되었습니다'
    });
  } catch (error) {
    console.error('주문 상태 업데이트 실패:', error);
    res.status(500).json({
      success: false,
      message: '주문 상태 업데이트 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

/**
 * 배송 정보 업데이트
 */
const updateShippingInfo = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { trackingNumber, carrier } = req.body;
    const userId = req.user.userId;

    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다'
      });
    }

    order.shipping.trackingNumber = trackingNumber;
    order.shipping.carrier = carrier;
    order.status = 'shipped';

    await order.save();

    res.json({
      success: true,
      data: order,
      message: '배송 정보가 업데이트되었습니다'
    });
  } catch (error) {
    console.error('배송 정보 업데이트 실패:', error);
    res.status(500).json({
      success: false,
      message: '배송 정보 업데이트 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

/**
 * 결제 정보 업데이트
 */
const updatePaymentInfo = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, transactionId } = req.body;
    const userId = req.user.userId;

    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다'
      });
    }

    order.payment.status = status;
    if (transactionId) {
      order.payment.transactionId = transactionId;
    }
    if (status === 'completed') {
      order.payment.paidAt = new Date();
    }

    await order.save();

    res.json({
      success: true,
      data: order,
      message: '결제 정보가 업데이트되었습니다'
    });
  } catch (error) {
    console.error('결제 정보 업데이트 실패:', error);
    res.status(500).json({
      success: false,
      message: '결제 정보 업데이트 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

// ==================== DELETE (삭제) ====================

/**
 * 주문 취소
 */
const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.userId;

    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다'
      });
    }

    // 취소 가능한 상태인지 확인
    if (['delivered', 'cancelled'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: '취소할 수 없는 주문입니다'
      });
    }

    // 주문 취소
    await order.cancel(userId);

    // 상품 재고 복구
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: item.quantity } }
      );
    }

    res.json({
      success: true,
      data: order,
      message: '주문이 취소되었습니다'
    });
  } catch (error) {
    console.error('주문 취소 실패:', error);
    res.status(500).json({
      success: false,
      message: '주문 취소 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

module.exports = {
  // READ
  getAdminOrders,
  getOrders,
  getOrderById,
  getOrderStats,
  // CREATE
  createOrderFromCart,
  createDirectOrder,
  // UPDATE
  updateOrderStatus,
  updateShippingInfo,
  updatePaymentInfo,
  // DELETE
  cancelOrder
};
