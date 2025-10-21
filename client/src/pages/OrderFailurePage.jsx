import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './styles/OrderFailurePage.css';

const OrderFailurePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // 실패 정보 (location.state에서 받아옴)
  const errorMessage = location.state?.errorMessage || '주문 처리 중 오류가 발생했습니다.';
  const orderData = location.state?.orderData || {};

  return (
    <div className="cider-app">
      <Navbar />
      <main className="cider-main">
        <div className="order-failure-page">
          <div className="failure-container">
            
            {/* 실패 메시지 섹션 */}
            <div className="failure-message-section">
              <div className="failure-icon">
                <div className="error-mark">✕</div>
              </div>
              <h1 className="failure-title">주문 처리에 실패했습니다</h1>
              <p className="failure-subtitle">죄송합니다. 주문 처리 중 문제가 발생했습니다.</p>
              <p className="failure-description">{errorMessage}</p>
              
              {/* 장바구니 유지 안내 */}
              <div className="cart-preserved-notice">
                <div className="notice-icon">🛒</div>
                <div className="notice-content">
                  <h3>장바구니가 보존되었습니다</h3>
                  <p>주문이 실패했지만 장바구니의 상품들은 그대로 유지되어 있습니다. 다시 주문하거나 장바구니를 확인해보세요.</p>
                </div>
              </div>
            </div>

            {/* 오류 정보 섹션 */}
            <div className="error-info-section">
              <div className="section-header">
                <div className="section-icon">⚠️</div>
                <h2>오류 정보</h2>
              </div>
              
              <div className="error-details">
                <div className="error-message-box">
                  <p className="error-text">{errorMessage}</p>
                </div>
                
                {orderData.orderNumber && (
                  <div className="order-reference">
                    <span className="label">주문 번호</span>
                    <span className="value">{orderData.orderNumber}</span>
                  </div>
                )}
                
                <div className="error-time">
                  <span className="label">발생 시간</span>
                  <span className="value">{new Date().toLocaleString('ko-KR')}</span>
                </div>
              </div>
            </div>

            {/* 해결 방법 섹션 */}
            <div className="solution-section">
              <div className="section-header">
                <div className="section-icon">💡</div>
                <h2>해결 방법</h2>
              </div>
              
              <div className="solutions">
                <div className="solution-item">
                  <div className="solution-number">1</div>
                  <div className="solution-content">
                    <h3>다시 시도하기</h3>
                    <p>일시적인 오류일 수 있습니다. 잠시 후 다시 주문을 시도해보세요.</p>
                  </div>
                </div>
                
                <div className="solution-item">
                  <div className="solution-number">2</div>
                  <div className="solution-content">
                    <h3>결제 방법 확인</h3>
                    <p>결제 정보를 다시 확인하고 다른 결제 방법을 시도해보세요.</p>
                  </div>
                </div>
                
                <div className="solution-item">
                  <div className="solution-number">3</div>
                  <div className="solution-content">
                    <h3>고객 지원 문의</h3>
                    <p>문제가 지속되면 고객 지원팀에 문의해주세요.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 액션 버튼들 */}
            <div className="action-buttons">
              <button 
                className="btn-primary"
                onClick={() => navigate('/checkout')}
              >
                다시 주문하기
              </button>
              <button 
                className="btn-secondary"
                onClick={() => navigate('/cart')}
              >
                장바구니 확인하기
              </button>
              <button 
                className="btn-outline"
                onClick={() => navigate('/')}
              >
                홈으로 돌아가기
              </button>
            </div>

            {/* 고객 지원 섹션 */}
            <div className="support-section">
              <h3>도움이 필요하신가요?</h3>
              <p>문제가 지속되면 언제든지 문의해주세요.</p>
              <div className="contact-info">
                <div className="contact-item">
                  <div className="contact-icon">✉️</div>
                  <span>support@cider.com</span>
                </div>
                <div className="contact-item">
                  <div className="contact-icon">📞</div>
                  <span>1-800-CIDER-1</span>
                </div>
                <div className="contact-item">
                  <div className="contact-icon">💬</div>
                  <span>실시간 채팅</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default OrderFailurePage;
