import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './styles/OrderSuccessPage.css';

const OrderSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // 주문 정보 (location.state에서 받아옴)
  const orderData = location.state?.orderData || {};
  const paymentData = location.state?.paymentData || {};

  return (
    <div className="cider-app">
      <Navbar />
      <main className="cider-main">
        <div className="order-success-page">
          <div className="success-container">
            
            {/* 성공 메시지 섹션 */}
            <div className="success-message-section">
              <div className="success-icon">
                <div className="checkmark">✓</div>
              </div>
              <h1 className="success-title">주문이 성공적으로 완료되었습니다!</h1>
              <p className="success-subtitle">주문해 주셔서 감사합니다.</p>
              <p className="success-description">주문 확인 이메일을 곧 받으실 수 있습니다.</p>
            </div>

            {/* 주문 정보 섹션 */}
            <div className="order-info-section">
              <div className="section-header">
                <div className="section-icon">📦</div>
                <h2>주문 정보</h2>
              </div>
              
              <div className="order-details">
                <div className="order-number">
                  <span className="label">주문 번호</span>
                  <span className="value">{orderData.orderNumber || 'ORD-2024-001234'}</span>
                </div>
                <div className="order-date">
                  <span className="label">주문 날짜</span>
                  <span className="value">{new Date().toLocaleDateString('ko-KR', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </div>
              </div>

              <div className="order-items">
                <h3>주문 상품</h3>
                {orderData.cartItems?.map((item, index) => (
                  <div key={index} className="order-item">
                    <div className="item-info">
                      <h4 className="item-name">{item.product?.name || '상품명'}</h4>
                      <p className="item-details">
                        {item.selectedSize && `사이즈: ${item.selectedSize}`}
                        {item.selectedSize && item.selectedColor && ' · '}
                        {item.selectedColor && `색상: ${item.selectedColor}`}
                      </p>
                      <p className="item-quantity">수량: {item.quantity}</p>
                    </div>
                    <div className="item-price">
                      ₩{item.product?.price?.toLocaleString() || '0'}
                    </div>
                  </div>
                ))}
              </div>

              <div className="total-amount">
                <span className="label">총 금액</span>
                <span className="value">₩{orderData.totalAmount?.toLocaleString() || '0'}</span>
              </div>
            </div>

            {/* 배송 정보 섹션 */}
            <div className="delivery-info-section">
              <div className="section-header">
                <div className="section-icon">🚚</div>
                <h2>배송 정보</h2>
              </div>
              
              <div className="delivery-details">
                <div className="delivery-date">
                  <div className="calendar-icon">📅</div>
                  <div className="date-info">
                    <span className="label">예상 배송일</span>
                    <span className="date-range">2025년 1월 2일 - 2025년 1월 4일</span>
                  </div>
                </div>
                
                <div className="delivery-address">
                  <span className="label">배송 주소</span>
                  <div className="address-details">
                    <p>{orderData.shippingAddress?.recipientName || '홍길동'}</p>
                    <p>{orderData.shippingAddress?.phone || '010-1234-5678'}</p>
                    <p>{orderData.shippingAddress?.address?.zipCode || '12345'}</p>
                    <p>{orderData.shippingAddress?.address?.mainAddress || '서울특별시 강남구'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 다음 단계 섹션 */}
            <div className="next-steps-section">
              <div className="section-header">
                <div className="section-icon">📋</div>
                <h2>다음 단계</h2>
              </div>
              
              <div className="steps">
                <div className="step">
                  <div className="step-number step-1">1</div>
                  <div className="step-content">
                    <h3>주문 확인 이메일</h3>
                    <p>주문 세부 정보가 포함된 확인 이메일을 받으실 수 있습니다.</p>
                  </div>
                </div>
                
                <div className="step">
                  <div className="step-number step-2">2</div>
                  <div className="step-content">
                    <h3>주문 처리</h3>
                    <p>1-2 영업일 내에 주문을 처리하고 포장합니다.</p>
                  </div>
                </div>
                
                <div className="step">
                  <div className="step-number step-3">3</div>
                  <div className="step-content">
                    <h3>배송 시작</h3>
                    <p>배송이 시작되면 추적 번호를 이메일로 보내드립니다.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 액션 버튼들 */}
            <div className="action-buttons">
              <button 
                className="btn-primary"
                onClick={() => navigate('/orders')}
              >
                주문 목록 보기
              </button>
              <button 
                className="btn-secondary"
                onClick={() => navigate('/')}
              >
                계속 쇼핑하기
              </button>
            </div>

            {/* 고객 지원 섹션 */}
            <div className="support-section">
              <h3>문의사항이 있으신가요?</h3>
              <div className="contact-info">
                <div className="contact-item">
                  <div className="contact-icon">✉️</div>
                  <span>support@cider.com</span>
                </div>
                <div className="contact-item">
                  <div className="contact-icon">📞</div>
                  <span>1-800-CIDER-1</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default OrderSuccessPage;
