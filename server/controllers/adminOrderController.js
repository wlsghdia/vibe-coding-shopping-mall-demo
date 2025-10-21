const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

// ==================== READ (조회) ====================

/**
 * 모든 주문 목록 조회 (관리자용)
 */
const getAllOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      startDate,
      endDate,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // 검색 조건 구성
    const query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'shipping.address.recipientName': { $regex: search, $options: 'i' } },
        { 'shipping.address.phone': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const orders = await Order.find(query)
      .populate('user', 'name email phone')
      .populate('items.product', 'name image category price')
      .sort(sortOptions)
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
 * 특정 주문 상세 조회 (관리자용)
 */
const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate('user', 'name email phone user_type')
      .populate('items.product', 'name image category price originalPrice stock');

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
 * 주문 통계 조회 (관리자용)
 */
const getOrderStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const match = {};
    
    if (startDate && endDate) {
      match.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // 상태별 통계
    const statusStats = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$pricing.total' }
        }
      }
    ]);

    // 일별 주문 통계 (최근 30일)
    const dailyStats = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$pricing.total' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // 총 통계
    const totalStats = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalAmount: { $sum: '$pricing.total' },
          averageOrderValue: { $avg: '$pricing.total' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        statusStats,
        dailyStats,
        totalStats: totalStats[0] || {
          totalOrders: 0,
          totalAmount: 0,
          averageOrderValue: 0
        }
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

/**
 * 주문 대시보드 데이터 조회
 */
const getDashboardData = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // 오늘 주문 수
    const todayOrders = await Order.countDocuments({
      createdAt: { $gte: startOfDay }
    });

    // 이번 주 주문 수
    const weekOrders = await Order.countDocuments({
      createdAt: { $gte: startOfWeek }
    });

    // 이번 달 주문 수
    const monthOrders = await Order.countDocuments({
      createdAt: { $gte: startOfMonth }
    });

    // 대기 중인 주문 수
    const pendingOrders = await Order.countDocuments({
      status: 'pending'
    });

    // 오늘 매출
    const todayRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay },
          status: { $in: ['confirmed', 'preparing', 'shipped', 'delivered'] }
        }
      },
      { $group: { _id: null, total: { $sum: '$pricing.total' } } }
    ]);

    // 최근 주문들
    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .populate('items.product', 'name image')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        summary: {
          todayOrders,
          weekOrders,
          monthOrders,
          pendingOrders,
          todayRevenue: todayRevenue[0]?.total || 0
        },
        recentOrders
      }
    });
  } catch (error) {
    console.error('대시보드 데이터 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '대시보드 데이터 조회 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

// ==================== UPDATE (수정) ====================

/**
 * 주문 상태 업데이트 (관리자용)
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, reason } = req.body;
    const adminId = req.user.userId;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다'
      });
    }

    // 상태 변경 가능 여부 확인
    const validTransitions = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['preparing', 'cancelled'],
      'preparing': ['shipped', 'cancelled'],
      'shipped': ['delivered', 'cancelled'],
      'delivered': [],
      'cancelled': []
    };

    if (!validTransitions[order.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `현재 상태(${order.status})에서 ${status}로 변경할 수 없습니다`
      });
    }

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
 * 배송 정보 업데이트 (관리자용)
 */
const updateShippingInfo = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { trackingNumber, carrier } = req.body;

    const order = await Order.findById(orderId);
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
 * 결제 정보 업데이트 (관리자용)
 */
const updatePaymentInfo = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, transactionId } = req.body;

    const order = await Order.findById(orderId);
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

/**
 * 주문 메모 추가/수정 (관리자용)
 */
const updateOrderNotes = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { notes } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다'
      });
    }

    order.notes = notes;
    await order.save();

    res.json({
      success: true,
      data: order,
      message: '주문 메모가 업데이트되었습니다'
    });
  } catch (error) {
    console.error('주문 메모 업데이트 실패:', error);
    res.status(500).json({
      success: false,
      message: '주문 메모 업데이트 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

// ==================== DELETE (삭제) ====================

/**
 * 주문 취소 (관리자용)
 */
const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
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
    await order.cancel();

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

/**
 * 여러 주문 일괄 취소 (관리자용)
 */
const bulkCancelOrders = async (req, res) => {
  try {
    const { orderIds } = req.body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '취소할 주문 ID 목록이 필요합니다'
      });
    }

    const orders = await Order.find({
      _id: { $in: orderIds },
      status: { $nin: ['delivered', 'cancelled'] }
    });

    if (orders.length === 0) {
      return res.status(400).json({
        success: false,
        message: '취소 가능한 주문이 없습니다'
      });
    }

    // 모든 주문 취소
    for (const order of orders) {
      await order.cancel();
      
      // 상품 재고 복구
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: item.quantity } }
        );
      }
    }

    res.json({
      success: true,
      data: { cancelledCount: orders.length },
      message: `${orders.length}개의 주문이 취소되었습니다`
    });
  } catch (error) {
    console.error('일괄 주문 취소 실패:', error);
    res.status(500).json({
      success: false,
      message: '일괄 주문 취소 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

// ==================== UTILITY (유틸리티) ====================

/**
 * 주문 환불 처리 (관리자용)
 */
const processRefund = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { refundAmount, reason } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다'
      });
    }

    // 환불 가능한 상태인지 확인
    if (order.status !== 'delivered') {
      return res.status(400).json({
        success: false,
        message: '배송 완료된 주문만 환불 가능합니다'
      });
    }

    // 환불 처리 (데모 버전에서는 단순히 상태만 변경)
    order.status = 'cancelled';
    order.payment.status = 'cancelled';
    await order.save();

    res.json({
      success: true,
      data: order,
      message: '환불이 처리되었습니다'
    });
  } catch (error) {
    console.error('환불 처리 실패:', error);
    res.status(500).json({
      success: false,
      message: '환불 처리 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

/**
 * 주문 데이터 내보내기 (관리자용)
 */
const exportOrders = async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;

    const query = {};
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('user', 'name email phone')
      .populate('items.product', 'name category price')
      .sort({ createdAt: -1 });

    // CSV 형태로 변환
    const csvData = orders.map(order => ({
      orderNumber: order.orderNumber,
      customerName: order.user?.name || '',
      customerEmail: order.user?.email || '',
      status: order.status,
      total: order.pricing.total,
      createdAt: order.createdAt.toISOString(),
      recipientName: order.shipping.address.recipientName,
      phone: order.shipping.address.phone,
      address: `${order.shipping.address.zipCode} ${order.shipping.address.mainAddress} ${order.shipping.address.detailAddress || ''}`
    }));

    res.json({
      success: true,
      data: csvData,
      message: '주문 데이터가 내보내기되었습니다'
    });
  } catch (error) {
    console.error('주문 데이터 내보내기 실패:', error);
    res.status(500).json({
      success: false,
      message: '주문 데이터 내보내기 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

/**
 * 주문 데이터 가져오기 (관리자용)
 */
const importOrders = async (req, res) => {
  try {
    // 데모 버전에서는 구현하지 않음
    res.status(501).json({
      success: false,
      message: '주문 데이터 가져오기 기능은 아직 구현되지 않았습니다'
    });
  } catch (error) {
    console.error('주문 데이터 가져오기 실패:', error);
    res.status(500).json({
      success: false,
      message: '주문 데이터 가져오기 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

module.exports = {
  // READ
  getAllOrders,
  getOrderById,
  getOrderStats,
  getDashboardData,
  // UPDATE
  updateOrderStatus,
  updateShippingInfo,
  updatePaymentInfo,
  updateOrderNotes,
  // DELETE
  cancelOrder,
  bulkCancelOrders,
  // UTILITY
  processRefund,
  exportOrders,
  importOrders
};
