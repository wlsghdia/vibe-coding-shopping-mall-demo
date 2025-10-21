import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { orderService, orderUtils } from '../services/orderService';
import Navbar from '../components/Navbar';
import './styles/OrdersPage.css';

const OrdersPage = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 탭 필터 (Order.js의 상태값과 매핑)
  const tabs = [
    { id: 'all', label: '전체' },
    { id: 'pending', label: '주문대기' },
    { id: 'confirmed', label: '주문확인' },
    { id: 'preparing', label: '상품준비중' },
    { id: 'shipped', label: '배송중' },
    { id: 'delivered', label: '배송완료' }
  ];

  // 주문 데이터 가져오기
  const fetchOrders = async () => {
    if (!token) {
      setError('로그인이 필요합니다');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const params = {
        page: 1,
        limit: 20
      };

      // 탭에 따른 상태 필터링
      if (activeTab !== 'all') {
        params.status = activeTab; // Order.js의 상태값과 직접 매핑
      }

      const response = await orderService.getOrders(params);
      const transformedOrders = orderUtils.transformOrdersData(response);
      
      setOrders(transformedOrders);
    } catch (error) {
      console.error('주문 목록 조회 실패:', error);
      setError(error.message || '주문 목록을 불러오는데 실패했습니다');
      
      // 에러 발생 시 샘플 데이터 표시 (개발용)
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [activeTab, token]);

  // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (!token && !loading) {
      navigate('/login');
    }
  }, [token, loading, navigate]);

  // 상태별 스타일 클래스
  const getStatusClass = (status) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'confirmed': return 'status-confirmed';
      case 'preparing': return 'status-preparing';
      case 'shipped': return 'status-shipping';
      case 'delivered': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-pending';
    }
  };

  // 배송 정보 텍스트
  const getDeliveryText = (deliveryInfo) => {
    if (deliveryInfo.status === 'delivered') {
      return `배송 완료: ${deliveryInfo.completedDate}`;
    } else if (deliveryInfo.status === 'shipped') {
      return `배송 중입니다! 예상 도착: ${deliveryInfo.expectedDate}`;
    } else {
      return `예상 배송일: ${deliveryInfo.expectedDate}`;
    }
  };

  // 액션 버튼들
  const getActionButtons = (order) => {
    const buttons = [
      { label: '주문 상세보기', action: () => navigate(`/orders/${order.id}`) }
    ];

    if (order.status === 'shipped') {
      buttons.push({ label: '배송 추적', action: () => console.log('배송 추적') });
    } else if (order.status === 'delivered') {
      buttons.push({ label: '다시 주문하기', action: () => console.log('다시 주문') });
    }

    return buttons;
  };

  if (loading) {
    return (
      <div className="cider-app">
        <Navbar />
        <main className="cider-main">
          <div className="orders-page">
            <div className="loading">로딩 중...</div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cider-app">
        <Navbar />
        <main className="cider-main">
          <div className="orders-page">
            <div className="error-state">
              <div className="error-icon">⚠️</div>
              <h3>오류가 발생했습니다</h3>
              <p>{error}</p>
              <button 
                className="btn-primary"
                onClick={() => fetchOrders()}
              >
                다시 시도
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="cider-app">
      <Navbar />
      <main className="cider-main">
        <div className="orders-page">
          <div className="orders-container">
            
            {/* 헤더 */}
            <div className="orders-header">
              <button 
                className="back-button"
                onClick={() => navigate(-1)}
              >
                ←
              </button>
              <h1 className="page-title">주문 내역</h1>
            </div>

            {/* 탭 네비게이션 */}
            <div className="tabs-container">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* 주문 목록 */}
            <div className="orders-list">
              {orders.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📦</div>
                  <h3>주문 내역이 없습니다</h3>
                  <p>아직 주문한 상품이 없습니다.</p>
                  <button 
                    className="btn-primary"
                    onClick={() => navigate('/')}
                  >
                    쇼핑하러 가기
                  </button>
                </div>
              ) : (
                orders.map(order => (
                  <div key={order.id} className="order-card">
                    
                    {/* 주문 헤더 */}
                    <div className="order-header">
                      <div className="order-info">
                        <div className="order-header-top">
                          <div className="order-number">
                            주문 #{order.orderNumber}
                          </div>
                          <div className="order-total">
                            <div className={`status-badge ${getStatusClass(order.status)}`}>
                              {order.statusText}
                            </div>
                          </div>
                        </div>
                        <div className="order-date">
                          주문일: {order.orderDate}
                        </div>
                      </div>
                    </div>

                    {/* 주문 상품들 */}
                    <div className="order-items">
                      {order.items.map(item => (
                        <div key={item.id} className="order-item">
                          <div className="item-image">
                            {item.image && item.image !== '/placeholder.jpg' ? (
                              <img 
                                src={item.image} 
                                alt={item.name}
                                className="product-image"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div className="image-placeholder" style={{ display: item.image && item.image !== '/placeholder.jpg' ? 'none' : 'flex' }}>
                              📦
                            </div>
                          </div>
                          <div className="item-details">
                            <h4 className="item-name">{item.name}</h4>
                            <p className="item-specs">
                              사이즈: {item.size} • 색상: {item.color}
                            </p>
                            <p className="item-quantity">수량: {item.quantity}</p>
                          </div>
                        </div>
                      ))}
                      
                      {/* 배송 정보 */}
                      <div className="delivery-info">
                        <p className="delivery-text">
                          {getDeliveryText(order.deliveryInfo)}
                        </p>
                        {order.deliveryInfo.trackingNumber && (
                          <p className="tracking-number">
                            추적번호: {order.deliveryInfo.trackingNumber}
                          </p>
                        )}
                      </div>

                      {/* 가격 및 액션 버튼 */}
                      <div className="price-and-actions">
                        <div className="total-price">
                          ₩{order.totalAmount.toLocaleString()}
                        </div>
                        <div className="action-buttons">
                          {getActionButtons(order).map((button, index) => (
                            <button
                              key={index}
                              className="action-button"
                              onClick={button.action}
                            >
                              {button.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                  </div>
                ))
              )}
            </div>

            {/* 하단 CTA 버튼 */}
            {orders.length > 0 && (
              <div className="bottom-cta">
                <button 
                  className="cta-button"
                  onClick={() => navigate('/')}
                >
                  홈으로 가기
                </button>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
};

export default OrdersPage;
