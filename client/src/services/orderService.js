// API 기본 URL 설정
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';

// 공통 API 호출 함수
const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'API 호출에 실패했습니다');
  }

  return data;
};

// 주문 서비스
export const orderService = {
  // 주문 목록 조회
  getOrders: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.status) queryParams.append('status', params.status);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);

    const queryString = queryParams.toString();
    const endpoint = `/api/orders${queryString ? `?${queryString}` : ''}`;
    
    return await apiCall(endpoint);
  },

  // 주문 상세 조회
  getOrderById: async (orderId) => {
    return await apiCall(`/api/orders/${orderId}`);
  },

  // 주문 통계 조회
  getOrderStats: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);

    const queryString = queryParams.toString();
    const endpoint = `/api/orders/stats${queryString ? `?${queryString}` : ''}`;
    
    return await apiCall(endpoint);
  },

  // 주문 상태 업데이트
  updateOrderStatus: async (orderId, status, reason = '') => {
    return await apiCall(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, reason })
    });
  },

  // 배송 정보 업데이트
  updateShippingInfo: async (orderId, trackingNumber, carrier) => {
    return await apiCall(`/api/orders/${orderId}/shipping`, {
      method: 'PUT',
      body: JSON.stringify({ trackingNumber, carrier })
    });
  },

  // 주문 취소
  cancelOrder: async (orderId) => {
    return await apiCall(`/api/orders/${orderId}/cancel`, {
      method: 'PUT'
    });
  }
};

// 데이터 변환 유틸리티 함수들
export const orderUtils = {
  // API 응답을 UI에서 사용할 형태로 변환
  transformOrderData: (apiOrder) => {
    return {
      id: apiOrder._id,
      orderNumber: apiOrder.orderNumber,
      orderDate: new Date(apiOrder.createdAt).toISOString().split('T')[0],
      status: apiOrder.status,
      statusText: getStatusText(apiOrder.status),
      totalAmount: apiOrder.totalAmount || apiOrder.pricing?.total || 0,
      items: apiOrder.items?.map(item => ({
        id: item._id || item.product?._id,
        name: item.product?.name || '상품명',
        size: item.selectedSize || 'M',
        color: item.selectedColor || '기본',
        quantity: item.quantity || 1,
        price: item.price || 0,
        image: item.product?.image || '/placeholder.jpg'
      })) || [],
      deliveryInfo: {
        status: apiOrder.status,
        expectedDate: getExpectedDeliveryDate(apiOrder.status, apiOrder.createdAt),
        completedDate: apiOrder.status === 'delivered' ? 
          new Date(apiOrder.updatedAt).toLocaleDateString('ko-KR') : null,
        trackingNumber: apiOrder.shipping?.trackingNumber || null
      }
    };
  },

  // 여러 주문 데이터 변환
  transformOrdersData: (apiResponse) => {
    if (apiResponse.data?.orders) {
      return apiResponse.data.orders.map(order => orderUtils.transformOrderData(order));
    }
    return [];
  }
};

// 상태 텍스트 변환
const getStatusText = (status) => {
  const statusMap = {
    'pending': '처리중',
    'confirmed': '확인됨',
    'preparing': '준비중',
    'shipped': '배송중',
    'delivered': '완료',
    'cancelled': '취소됨'
  };
  return statusMap[status] || '알 수 없음';
};

// 예상 배송일 계산
const getExpectedDeliveryDate = (status, createdAt) => {
  const orderDate = new Date(createdAt);
  
  if (status === 'delivered') {
    return null; // 완료된 주문은 completedDate 사용
  }
  
  // 주문일로부터 3-5일 후 예상 배송일
  const deliveryDate = new Date(orderDate);
  deliveryDate.setDate(deliveryDate.getDate() + 3);
  
  const endDate = new Date(orderDate);
  endDate.setDate(endDate.getDate() + 5);
  
  return `${deliveryDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}-${endDate.getDate()}, ${endDate.getFullYear()}`;
};
