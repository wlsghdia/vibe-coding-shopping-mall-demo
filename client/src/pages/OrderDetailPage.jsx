import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { orderService, orderUtils } from '../services/orderService';
import Navbar from '../components/Navbar';
import './styles/OrderDetailPage.css';

const OrderDetailPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 주문 상세 정보 가져오기
  const fetchOrderDetail = async () => {
    if (!token) {
      setError('로그인이 필요합니다');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await orderService.getOrderById(orderId);
      const transformedOrder = orderUtils.transformOrderData(response.data);
      
      setOrder(transformedOrder);
    } catch (error) {
      console.error('주문 상세 조회 실패:', error);
      setError(error.message || '주문 상세 정보를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  // 주문 취소 처리
  const handleCancelOrder = async () => {
    if (!window.confirm('정말로 이 주문을 취소하시겠습니까?')) {
      return;
    }

    try {
      await orderService.cancelOrder(orderId);
      alert('주문이 취소되었습니다');
      navigate('/orders');
    } catch (error) {
      console.error('주문 취소 실패:', error);
      alert(error.message || '주문 취소에 실패했습니다');
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [orderId, token]);

  // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (!token && !loading) {
      navigate('/login');
    }
  }, [token, loading, navigate]);

  if (loading) {
    return (
      <div className="cider-app">
        <Navbar />
        <main className="cider-main">
          <div className="order-detail-page">
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
          <div className="order-detail-page">
            <div className="error-state">
              <div className="error-icon">⚠️</div>
              <h3>오류가 발생했습니다</h3>
              <p>{error}</p>
              <button 
                className="btn-primary"
                onClick={() => fetchOrderDetail()}
              >
                다시 시도
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="cider-app">
        <Navbar />
        <main className="cider-main">
          <div className="order-detail-page">
            <div className="not-found">
              <h3>주문을 찾을 수 없습니다</h3>
              <button 
                className="btn-primary"
                onClick={() => navigate('/orders')}
              >
                주문 목록으로 돌아가기
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
        <div className="order-detail-page">
          <div className="order-detail-container">
            
            {/* 헤더 */}
            <div className="order-detail-header">
              <button 
                className="back-button"
                onClick={() => navigate('/orders')}
              >
                ←
              </button>
              <h1 className="page-title">주문 상세</h1>
            </div>

            {/* 주문 정보 카드 */}
            <div className="order-info-card">
              <div className="card-header">
                <h2>주문 정보</h2>
                <div className={`status-badge ${getStatusClass(order.status)}`}>
                  {order.statusText}
                </div>
              </div>
              
              <div className="order-details">
                <div className="detail-row">
                  <span className="label">주문 번호</span>
                  <span className="value">{order.orderNumber}</span>
                </div>
                <div className="detail-row">
                  <span className="label">주문 날짜</span>
                  <span className="value">{order.orderDate}</span>
                </div>
                <div className="detail-row">
                  <span className="label">총 금액</span>
                  <span className="value total-amount">${order.totalAmount}</span>
                </div>
              </div>
            </div>

            {/* 주문 상품들 */}
            <div className="order-items-card">
              <h2>주문 상품</h2>
              <div className="items-list">
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
                      <h3 className="item-name">{item.name}</h3>
                      <p className="item-specs">
                        사이즈: {item.size} • 색상: {item.color}
                      </p>
                      <p className="item-quantity">수량: {item.quantity}</p>
                      <p className="item-price">${item.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 배송 정보 */}
            <div className="delivery-info-card">
              <h2>배송 정보</h2>
              <div className="delivery-details">
                <div className="delivery-status">
                  <p className="delivery-text">
                    {getDeliveryText(order.deliveryInfo)}
                  </p>
                  {order.deliveryInfo.trackingNumber && (
                    <p className="tracking-number">
                      추적번호: {order.deliveryInfo.trackingNumber}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 액션 버튼들 */}
            <div className="action-buttons">
              {order.status === 'pending' && (
                <button 
                  className="btn-danger"
                  onClick={handleCancelOrder}
                >
                  주문 취소
                </button>
              )}
              {order.status === 'shipping' && (
                <button 
                  className="btn-secondary"
                  onClick={() => console.log('배송 추적')}
                >
                  배송 추적
                </button>
              )}
              {order.status === 'delivered' && (
                <button 
                  className="btn-primary"
                  onClick={() => console.log('다시 주문')}
                >
                  다시 주문하기
                </button>
              )}
              <button 
                className="btn-secondary"
                onClick={() => navigate('/orders')}
              >
                주문 목록으로 돌아가기
              </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  );

  // 상태별 스타일 클래스
  function getStatusClass(status) {
    switch (status) {
      case 'pending': return 'status-processing';
      case 'shipped': return 'status-shipping';
      case 'delivered': return 'status-completed';
      default: return 'status-processing';
    }
  }

  // 배송 정보 텍스트
  function getDeliveryText(deliveryInfo) {
    if (deliveryInfo.status === 'delivered') {
      return `배송 완료: ${deliveryInfo.completedDate}`;
    } else if (deliveryInfo.status === 'shipped') {
      return `배송 중입니다! 예상 도착: ${deliveryInfo.expectedDate}`;
    } else {
      return `예상 배송일: ${deliveryInfo.expectedDate}`;
    }
  }
};

export default OrderDetailPage;
