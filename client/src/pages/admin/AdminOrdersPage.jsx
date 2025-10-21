import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import './styles/AdminOrdersPage.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';

const AdminOrdersPage = () => {
  const navigate = useNavigate();
  const { user, token, loading: authLoading, isAdmin } = useAdminAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orderCounts, setOrderCounts] = useState({
    all: 0,
    pending: 0,
    confirmed: 0,
    preparing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0
  });

  // 탭 필터 - 모든 주문 상태 포함
  const tabs = [
    { id: 'all', label: '전체' },
    { id: 'pending', label: '주문대기' },
    { id: 'confirmed', label: '주문확인' },
    { id: 'preparing', label: '상품준비중' },
    { id: 'shipped', label: '배송중' },
    { id: 'delivered', label: '배송완료' },
    { id: 'cancelled', label: '주문취소' }
  ];

  // 주문 데이터 가져오기
  const fetchOrders = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      params.append('page', '1');
      params.append('limit', '50');
      
      // 검색어가 있으면 추가
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      // 탭에 따른 상태 필터링 - 각 상태별로 서버에 요청
      if (activeTab !== 'all') {
        params.append('status', activeTab);
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/orders?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('주문 목록을 불러오는데 실패했습니다');
      }

      const data = await response.json();
      const transformedOrders = (data.data?.orders || []).map(order => ({
        id: order._id,
        orderNumber: order.orderNumber,
        customer: order.user?.name || '알 수 없음',
        email: order.user?.email || '',
        phone: order.shipping?.address?.phone || '',
        date: new Date(order.createdAt).toISOString().split('T')[0],
        status: getStatusText(order.status),
        statusColor: getStatusColor(order.status),
        amount: order.totalAmount || order.pricing?.total || 0,
        items: order.items?.length || 0,
        address: order.shipping?.address ? 
          `${order.shipping.address.address?.mainAddress || ''} ${order.shipping.address.address?.detailAddress || ''}`.trim() : '',
        trackingNumber: order.shipping?.trackingNumber || null,
        originalStatus: order.status // 원본 상태 저장
      }));

      setOrders(transformedOrders);
      
      // 주문 개수 계산 (전체 주문에서)
      await calculateOrderCounts();
    } catch (error) {
      console.error('주문 목록 조회 실패:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin && token) {
      fetchOrders();
    }
  }, [isAdmin, token, activeTab, searchTerm]);

  // 컴포넌트 마운트 시 주문 개수 계산
  useEffect(() => {
    if (isAdmin && token) {
      calculateOrderCounts();
    }
  }, [isAdmin, token]);

  // 검색어 변경 시 디바운스 처리
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isAdmin && token) {
        fetchOrders();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // 주문 개수 계산 (전체 주문에서 계산)
  const calculateOrderCounts = async () => {
    if (!token) return;

    try {
      // 전체 주문을 가져와서 개수 계산
      const response = await fetch(`${API_BASE_URL}/api/admin/orders?page=1&limit=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) return;

      const data = await response.json();
      const allOrders = data.data?.orders || [];

      const counts = {
        all: allOrders.length,
        pending: allOrders.filter(order => order.status === 'pending').length,
        confirmed: allOrders.filter(order => order.status === 'confirmed').length,
        preparing: allOrders.filter(order => order.status === 'preparing').length,
        shipped: allOrders.filter(order => order.status === 'shipped').length,
        delivered: allOrders.filter(order => order.status === 'delivered').length,
        cancelled: allOrders.filter(order => order.status === 'cancelled').length
      };
      setOrderCounts(counts);
    } catch (error) {
      console.error('주문 개수 계산 실패:', error);
    }
  };

  // 필터링된 주문 (API에서 이미 필터링되므로 orders 그대로 사용)
  const filteredOrders = orders;

  // 상태 텍스트 변환
  const getStatusText = (status) => {
    const statusMap = {
      'pending': '처리중',
      'confirmed': '확인됨',
      'preparing': '준비중',
      'shipped': '배송중',
      'delivered': '배송완료',
      'cancelled': '취소됨'
    };
    return statusMap[status] || '알 수 없음';
  };

  // 상태 색상 변환
  const getStatusColor = (status) => {
    const colorMap = {
      'pending': 'processing',
      'confirmed': 'processing',
      'preparing': 'processing',
      'shipped': 'shipping',
      'delivered': 'completed',
      'cancelled': 'cancelled'
    };
    return colorMap[status] || 'processing';
  };

  // 상태별 스타일 클래스
  const getStatusClass = (statusColor) => {
    switch (statusColor) {
      case 'processing': return 'status-processing';
      case 'shipping': return 'status-shipping';
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-processing';
    }
  };

  // 주문 상세보기
  const handleViewDetails = (orderId) => {
    navigate(`/admin/orders/${orderId}`);
  };

  // 주문 상태 업데이트
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '주문 상태 업데이트에 실패했습니다');
      }

      // 주문 목록 새로고침
      await fetchOrders();
      // 주문 개수도 새로고침
      await calculateOrderCounts();
    } catch (error) {
      console.error('주문 상태 업데이트 실패:', error);
      alert(error.message);
    }
  };

  // 배송 시작
  const handleStartShipping = async (orderId) => {
    if (window.confirm('배송을 시작하시겠습니까?')) {
      await updateOrderStatus(orderId, 'shipped');
    }
  };

  // 주문 취소
  const handleCancelOrder = async (orderId) => {
    if (window.confirm('주문을 취소하시겠습니까?')) {
      await updateOrderStatus(orderId, 'cancelled');
    }
  };

  // 상태 변경 드롭다운 핸들러
  const handleStatusChange = async (orderId, newStatus) => {
    if (window.confirm(`주문 상태를 "${getStatusText(newStatus)}"로 변경하시겠습니까?`)) {
      await updateOrderStatus(orderId, newStatus);
      
      // 상태에 따라 탭 자동 이동
      setActiveTab(newStatus);
    }
  };

  // 권한 체크 중
  if (authLoading) {
    return (
      <div className="admin-orders-page">
        <div className="loading">권한 확인 중...</div>
      </div>
    );
  }

  // 관리자가 아닌 경우 (useAdminAuth에서 리다이렉트됨)
  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="admin-orders-page">
        <div className="loading">주문 목록을 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="admin-orders-page">
      {/* 상단 헤더 */}
      <header className="admin-header">
        <div className="header-left">
          <button 
            className="back-button"
            onClick={() => navigate('/admin')}
          >
            ←
          </button>
          <h1 className="page-title">주문 관리</h1>
        </div>
        <div className="header-right">
          <button 
            className="back-to-shop"
            onClick={() => navigate('/')}
          >
            쇼핑몰로 돌아가기
          </button>
        </div>
      </header>

      <main className="admin-main">
        {/* 검색 및 필터 영역 */}
        <div className="search-filter-section">
          <div className="search-box">
            <div className="search-icon">Q</div>
            <input
              type="text"
              placeholder="주문번호 또는 고객명으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <button className="filter-button">
            <span className="filter-icon">▽</span>
            필터
          </button>
        </div>

        {/* 탭 네비게이션 */}
        <div className="tabs-container">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label} {orderCounts[tab.id] > 0 && `(${orderCounts[tab.id]})`}
            </button>
          ))}
        </div>

        {/* 주문 목록 */}
        <div className="orders-list">
          {filteredOrders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <h3>주문이 없습니다</h3>
              <p>선택한 조건에 맞는 주문이 없습니다.</p>
            </div>
          ) : (
            filteredOrders.map(order => (
              <div key={order.id} className="order-card">
                {/* 주문 헤더 */}
                <div className="order-header">
                  <div className="order-info">
                    <div className="order-number">
                      {order.orderNumber}
                    </div>
                    <div className="customer-info">
                      {order.customer} • {order.email}
                    </div>
                    <div className="order-date">
                      {new Date(order.date).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                  <div className="order-status-section">
                    <div className={`status-badge ${getStatusClass(order.statusColor)}`}>
                      {order.status}
                    </div>
                    <button 
                      className="view-details-btn"
                      onClick={() => handleViewDetails(order.id)}
                    >
                      <span className="eye-icon">⊙</span>
                      상세보기
                    </button>
                  </div>
                </div>

                {/* 주문 상품 및 배송 주소 */}
                <div className="order-details">
                  <div className="detail-section">
                    <h4 className="section-title">주문 상품</h4>
                    <div className="product-name">Lace Ruffle Hem Knotted Knit Crop Top</div>
                    <div className="status-dropdown-container">
                      <select 
                        className="status-dropdown"
                        value={order.originalStatus}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      >
                        <option value="pending">주문확인</option>
                        <option value="confirmed">주문확인</option>
                        <option value="preparing">상품준비중</option>
                        <option value="shipped">배송시작</option>
                        <option value="delivered">배송완료</option>
                        <option value="cancelled">주문취소</option>
                      </select>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h4 className="section-title">배송 주소</h4>
                    <div className="shipping-address">{order.address}</div>
                  </div>
                </div>

                {/* 총 결제 금액 및 액션 버튼 */}
                <div className="order-footer">
                  <div className="total-amount">₩{order.amount.toLocaleString()}</div>
                  <div className="action-buttons">
                    <button 
                      className="action-btn start-shipping"
                      onClick={() => handleStartShipping(order.id)}
                    >
                      배송 시작
                    </button>
                    <button 
                      className="action-btn cancel-order"
                      onClick={() => handleCancelOrder(order.id)}
                    >
                      주문 취소
                    </button>
                    <button 
                      className="view-details-btn"
                      onClick={() => handleViewDetails(order.id)}
                    >
                      <span className="eye-icon">⊙</span>
                      상세보기
                    </button>
                  </div>
                </div>

                {/* 추적번호 (배송중/완료인 경우) */}
                {order.trackingNumber && (
                  <div className="tracking-section">
                    <div className="tracking-number">
                      추적번호: {order.trackingNumber}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminOrdersPage;
