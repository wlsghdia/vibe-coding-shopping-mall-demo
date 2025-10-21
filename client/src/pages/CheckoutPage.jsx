import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import './styles/CheckoutPage.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);

  // 배송 정보 폼 상태 (테스트용 기본값 설정)
  const [shippingInfo, setShippingInfo] = useState({
    firstName: user?.name?.split(' ')[0] || '홍',
    lastName: user?.name?.split(' ')[1] || '길동',
    email: user?.email || 'test@example.com',
    phone: '01012345678',
    address: '서울특별시 강남구 테스트주소',
    city: '서울',
    zipCode: '12345'
  });

  // 배송 방법 상태
  const [deliveryMethod, setDeliveryMethod] = useState('standard');

  // 결제 정보 상태
  const [paymentInfo, setPaymentInfo] = useState({
    method: 'kakao_pay',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: ''
  });

  // 장바구니 데이터 가져오기
  const fetchCart = useCallback(async () => {
    if (!token) {
      setError('로그인이 필요합니다');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/cart/summary`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '장바구니 데이터를 불러오는데 실패했습니다');
      }

      setCartItems(result.data.items || []);
      setTotalAmount(result.data.totalAmount || 0);
      setTotalItems(result.data.totalItems || 0);
    } catch (error) {
      console.error('장바구니 로드 실패:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // 배송 정보 입력 핸들러
  const handleShippingChange = (e) => {
    const { name, value } = e.target;
    setShippingInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 결제 정보 입력 핸들러
  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setPaymentInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 배송 방법 변경 핸들러
  const handleDeliveryMethodChange = (method) => {
    setDeliveryMethod(method);
  };

  // 결제 방법 변경 핸들러
  const handlePaymentMethodChange = (method) => {
    setPaymentInfo(prev => ({
      ...prev,
      method: method
    }));
  };

  // 포트원(아임포트) 초기화
  useEffect(() => {
    // KG이니시스 쿠키 문제 완전 해결
    const completelyFixCookieIssues = () => {
      // 1. 모든 문제 쿠키 완전 삭제
      const deleteAllCookies = () => {
        const cookies = ['SCOUTER', 'scouter', 'Scouter', 'SCOUTER_SESSION', 'scouter_session'];
        const domains = [
          'stdpay.inicis.com', 
          '.stdpay.inicis.com', 
          'localhost', 
          '.localhost', 
          '127.0.0.1',
          '.127.0.0.1',
          '',
          window.location.hostname,
          `.${window.location.hostname}`
        ];
        const paths = ['/', '/checkout', '/payment', '/api', ''];

        cookies.forEach(cookie => {
          domains.forEach(domain => {
            paths.forEach(path => {
              // 모든 가능한 조합으로 쿠키 삭제
              document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}; domain=${domain}`;
              document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}; domain=${domain}; SameSite=None`;
              document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}; domain=${domain}; SameSite=Lax`;
              document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}; domain=${domain}; SameSite=Strict`;
              document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}; domain=${domain}; Secure`;
              document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}; domain=${domain}; Secure; SameSite=None`;
              document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}; domain=${domain}; Secure; SameSite=Lax`;
              document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}; domain=${domain}; Secure; SameSite=Strict`;
            });
          });
        });
      };

      // 2. 쿠키 완전 삭제 실행
      deleteAllCookies();

      // 3. 올바른 쿠키 설정 (로컬 개발용)
      document.cookie = "SCOUTER=disabled; path=/; SameSite=Lax; Secure=false; Max-Age=0";
      document.cookie = "scouter=disabled; path=/; SameSite=Lax; Secure=false; Max-Age=0";
      
      // 4. 브라우저 쿠키 캐시 강제 클리어
      if (navigator.cookieEnabled) {
        // 쿠키 설정 강제 업데이트
        document.cookie = "cookie_test=test; path=/; SameSite=Lax; Secure=false; Max-Age=1";
        setTimeout(() => {
          document.cookie = "cookie_test=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
        }, 100);
      }
    };

    // 즉시 실행
    completelyFixCookieIssues();

    // 주기적으로 쿠키 정리 (1초마다)
    const interval = setInterval(completelyFixCookieIssues, 1000);

    if (window.IMP) {
      window.IMP.init('imp31113166'); // 고객사 식별코드
      console.log('✅ 포트원 결제 모듈 초기화 완료');
    }

    return () => clearInterval(interval);
  }, []);


  // 결제 성공 처리
  const handlePaymentSuccess = async (paymentResponse, orderData) => {
    try {
      console.log('결제 성공 응답:', paymentResponse);
      console.log('주문 데이터:', orderData);

      // 디버깅: 전송할 데이터 확인
      const requestData = {
        shippingAddress: orderData.shippingAddress,
        paymentMethod: orderData.paymentMethod,
        notes: orderData.notes || '',
        impUid: paymentResponse.imp_uid,
        merchantUid: paymentResponse.merchant_uid
      };
      console.log('전송할 데이터:', requestData);
      console.log('배송지 정보 상세:', {
        recipientName: orderData.shippingAddress.recipientName,
        phone: orderData.shippingAddress.phone,
        zipCode: orderData.shippingAddress.address.zipCode,
        mainAddress: orderData.shippingAddress.address.mainAddress
      });

      // 유효성 검사 사전 확인
      if (orderData.shippingAddress.recipientName.length < 2) {
        throw new Error('수령인명은 2자 이상이어야 합니다');
      }
      if (orderData.shippingAddress.phone.length < 10) {
        throw new Error('전화번호는 10자 이상이어야 합니다');
      }
      if (orderData.shippingAddress.address.zipCode.length < 5) {
        throw new Error('우편번호는 5자 이상이어야 합니다');
      }
      if (orderData.shippingAddress.address.mainAddress.length < 5) {
        throw new Error('주소는 5자 이상이어야 합니다');
      }

      // 기존 주문 생성 API 사용 (from-cart)
      const response = await fetch(`${API_BASE_URL}/api/orders/from-cart`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      const result = await response.json();
      console.log('주문 생성 응답:', result);

      if (!response.ok) {
        throw new Error(result.message || '주문 생성에 실패했습니다');
      }

      // 주문 생성 후 결제 정보 업데이트
      const orderId = result.data._id;
      const paymentUpdateResponse = await fetch(`${API_BASE_URL}/api/orders/${orderId}/payment`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'completed',
          transactionId: paymentResponse.imp_uid
        })
      });

      if (!paymentUpdateResponse.ok) {
        console.warn('결제 정보 업데이트 실패, 하지만 주문은 생성됨');
      }

      // 주문 성공 페이지로 이동
      navigate('/order-success', {
        state: {
          orderData: {
            orderNumber: result.data.orderNumber,
            totalAmount: result.data.totalAmount,
            cartItems: result.data.items,
            shippingAddress: orderData.shippingAddress
          },
          paymentData: paymentResponse
        }
      });
    } catch (error) {
      console.error('결제 성공 처리 실패:', error);
      // 주문 실패 페이지로 이동
      navigate('/order-failure', {
        state: {
          errorMessage: error.message,
          orderData: orderData
        }
      });
    }
  };

  // 결제 실패 처리
  const handlePaymentFailure = (paymentResponse) => {
    console.error('결제 실패:', paymentResponse);
    // 결제 실패 페이지로 이동
    navigate('/order-failure', {
      state: {
        errorMessage: paymentResponse.error_msg || '결제가 취소되었습니다.',
        orderData: {
          totalAmount,
          cartItems
        }
      }
    });
  };

  // 주문 생성 (포트원 결제 연동)
  const handlePlaceOrder = async () => {
    if (!token) {
      alert('로그인이 필요합니다.');
      return;
    }

    // 필수 정보 검증 (더 엄격하게)
    if (!shippingInfo.firstName?.trim() || !shippingInfo.lastName?.trim() || !shippingInfo.email?.trim() || 
        !shippingInfo.phone?.trim() || !shippingInfo.address?.trim() || !shippingInfo.city?.trim() || !shippingInfo.zipCode?.trim()) {
      alert('배송 정보를 모두 입력해주세요.\n- 이름, 이메일, 전화번호, 주소, 도시, 우편번호를 모두 입력해주세요.');
      return;
    }

    // 포트원 모듈 확인
    if (!window.IMP) {
      alert('결제 모듈을 불러오는데 실패했습니다. 페이지를 새로고침해주세요.');
      return;
    }

    try {
      // 배송지 정보 구성 (테스트용 데이터로 변환)
      const shippingAddress = {
        recipientName: `${shippingInfo.firstName || ''} ${shippingInfo.lastName || ''}`.trim() || '홍길동',
        phone: (shippingInfo.phone || '').replace(/[^0-9]/g, '') || '01012345678',
        address: {
          zipCode: (shippingInfo.zipCode || '').replace(/[^0-9]/g, '') || '12345',
          mainAddress: (shippingInfo.address || '').trim() || '서울특별시 강남구 테스트주소',
          detailAddress: ''
        }
      };

      // 주문 데이터 구성
      const orderData = {
        shippingAddress,
        paymentMethod: paymentInfo.method,
        notes: '',
        totalAmount,
        totalItems,
        cartItems
      };

      // 🎯 IMP.request_pay로 결제 창 띄우기
      const { IMP } = window;
      
      // KG이니시스 쿠키 문제 완전 해결 (SameSite=None 오류 완전 방지)
      const completelyFixAllCookieIssues = () => {
        const deleteAllCookies = () => {
          const cookies = ['SCOUTER', 'scouter', 'Scouter', 'SCOUTER_SESSION', 'scouter_session'];
          const domains = [
            'stdpay.inicis.com', 
            '.stdpay.inicis.com', 
            'localhost', 
            '.localhost', 
            '127.0.0.1',
            '.127.0.0.1',
            '',
            window.location.hostname,
            `.${window.location.hostname}`
          ];
          const paths = ['/', '/checkout', '/payment', '/api', ''];

          cookies.forEach(cookie => {
            domains.forEach(domain => {
              paths.forEach(path => {
                // 모든 가능한 조합으로 쿠키 삭제
                document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}; domain=${domain}`;
                document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}; domain=${domain}; SameSite=None`;
                document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}; domain=${domain}; SameSite=Lax`;
                document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}; domain=${domain}; SameSite=Strict`;
                document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}; domain=${domain}; Secure`;
                document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}; domain=${domain}; Secure; SameSite=None`;
                document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}; domain=${domain}; Secure; SameSite=Lax`;
                document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}; domain=${domain}; Secure; SameSite=Strict`;
              });
            });
          });
        };

        deleteAllCookies();

        // 올바른 쿠키 설정 (로컬 개발용)
        document.cookie = "SCOUTER=disabled; path=/; SameSite=Lax; Secure=false; Max-Age=0";
        document.cookie = "scouter=disabled; path=/; SameSite=Lax; Secure=false; Max-Age=0";
      };
      
      completelyFixAllCookieIssues();
      
      const paymentData = {
        pg: 'html5_inicis', // PG사 (KG이니시스)
        pay_method: 'card', // 결제수단 (카드)
        merchant_uid: `order_${Date.now()}`, // 주문번호 (고유값)
        name: `주문상품 ${totalItems}개`, // 상품명
        amount: totalAmount, // 결제금액
        buyer_email: shippingInfo.email, // 구매자 이메일
        buyer_name: `${shippingInfo.firstName} ${shippingInfo.lastName}`, // 구매자 이름
        buyer_tel: shippingInfo.phone, // 구매자 전화번호
        buyer_addr: shippingInfo.address, // 구매자 주소
        buyer_postcode: shippingInfo.zipCode, // 구매자 우편번호
        m_redirect_url: `${window.location.origin}/checkout/complete` // 모바일 결제 완료 후 리디렉션 URL
      };

      // 💳 실제 결제 창 띄우기
      IMP.request_pay(paymentData, (response) => {
        if (response.success) {
          // ✅ 결제 성공
          handlePaymentSuccess(response, orderData);
        } else {
          // ❌ 결제 실패
          handlePaymentFailure(response);
        }
      });

    } catch (error) {
      console.error('주문 처리 실패:', error);
      alert(error.message);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  if (loading) {
    return (
      <div className="cider-app">
        <Navbar />
        <main className="cider-main">
          <div className="checkout-page">
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>주문 정보를 불러오는 중...</p>
            </div>
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
          <div className="checkout-page">
            <div className="error-container">
              <p className="error-message">{error}</p>
              <button className="retry-btn" onClick={fetchCart}>
                다시 시도
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="cider-app">
        <Navbar />
        <main className="cider-main">
          <div className="checkout-page">
            <div className="login-required">
              <h2>로그인이 필요합니다</h2>
              <p>주문하려면 로그인해주세요</p>
              <button 
                className="login-btn"
                onClick={() => navigate('/login')}
              >
                로그인하기
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="cider-app">
        <Navbar />
        <main className="cider-main">
          <div className="checkout-page">
            <div className="empty-cart">
              <div className="empty-cart-icon">🛒</div>
              <h2>장바구니가 비어있습니다</h2>
              <p>주문할 상품을 장바구니에 추가해주세요</p>
              <button 
                className="continue-shopping-btn"
                onClick={() => navigate('/')}
              >
                쇼핑 계속하기
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
        <div className="checkout-page">
          <div className="checkout-container">
            {/* 헤더 */}
            <div className="checkout-header">
              <button 
                className="back-btn"
                onClick={() => navigate('/cart')}
              >
                ←
              </button>
              <h1>Checkout</h1>
            </div>

            {/* 진행 단계 */}
            <div className="progress-steps">
              <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
                <span className="step-number">1</span>
                <span className="step-label">Shipping</span>
              </div>
              <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
                <span className="step-number">2</span>
                <span className="step-label">Payment</span>
              </div>
              <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
                <span className="step-number">3</span>
                <span className="step-label">Review</span>
              </div>
            </div>

            <div className="checkout-content">
              {/* 왼쪽: 배송 정보 */}
              <div className="shipping-section">
                {/* 배송지 정보 */}
                <div className="shipping-info-section">
                  <div className="section-header">
                    <span className="section-icon">📍</span>
                    <h2>배송지 정보</h2>
                  </div>

                  <div className="form-group">
                  <div className="form-row">
                    <div className="form-field">
                      <label>First Name</label>
                      <input
                        type="text"
                        name="firstName"
                        value={shippingInfo.firstName}
                        onChange={handleShippingChange}
                        placeholder="John"
                        required
                      />
                    </div>
                    <div className="form-field">
                      <label>Last Name</label>
                      <input
                        type="text"
                        name="lastName"
                        value={shippingInfo.lastName}
                        onChange={handleShippingChange}
                        placeholder="Doe"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <div className="form-field">
                    <label>Email</label>
                    <div className="input-with-icon">
                      <span className="input-icon">✉️</span>
                      <input
                        type="email"
                        name="email"
                        value={shippingInfo.email}
                        onChange={handleShippingChange}
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <div className="form-field">
                    <label>Phone Number</label>
                    <div className="input-with-icon">
                      <span className="input-icon">📞</span>
                      <input
                        type="tel"
                        name="phone"
                        value={shippingInfo.phone}
                        onChange={handleShippingChange}
                        placeholder="+1 (555) 123-4567"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <div className="form-field">
                    <label>Address</label>
                    <div className="input-with-icon">
                      <span className="input-icon">📍</span>
                      <input
                        type="text"
                        name="address"
                        value={shippingInfo.address}
                        onChange={handleShippingChange}
                        placeholder="123 Main Street"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <div className="form-row">
                    <div className="form-field">
                      <label>City</label>
                      <input
                        type="text"
                        name="city"
                        value={shippingInfo.city}
                        onChange={handleShippingChange}
                        placeholder="New York"
                        required
                      />
                    </div>
                    <div className="form-field">
                      <label>ZIP Code</label>
                      <input
                        type="text"
                        name="zipCode"
                        value={shippingInfo.zipCode}
                        onChange={handleShippingChange}
                        placeholder="10001"
                        required
                      />
                    </div>
                  </div>
                </div>
                </div>

                {/* 배송 방법 */}
                <div className="delivery-method-section">
                  <div className="section-header">
                    <span className="section-icon">🚚</span>
                    <h2>배송 방법</h2>
                  </div>
                  
                  <div className="delivery-options">
                    <label className="delivery-option">
                      <input
                        type="radio"
                        name="deliveryMethod"
                        value="standard"
                        checked={deliveryMethod === 'standard'}
                        onChange={() => handleDeliveryMethodChange('standard')}
                      />
                      <div className="option-content">
                        <div className="option-name">일반 배송</div>
                        <div className="option-details">3-5 영업일</div>
                        <div className="option-price">무료</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* 결제 정보 */}
                <div className="payment-method-section">
                  <div className="section-header">
                    <span className="section-icon">💳</span>
                    <h2>결제 정보</h2>
                  </div>
                  
                  <div className="payment-options">
                    <label className="payment-option">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="card"
                        checked={paymentInfo.method === 'card'}
                        onChange={() => handlePaymentMethodChange('card')}
                      />
                      <span className="option-label">신용카드</span>
                    </label>
                    
                    <label className="payment-option">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="bank_transfer"
                        checked={paymentInfo.method === 'bank_transfer'}
                        onChange={() => handlePaymentMethodChange('bank_transfer')}
                      />
                      <span className="option-label">계좌이체</span>
                    </label>
                    
                    <label className="payment-option">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="kakao_pay"
                        checked={paymentInfo.method === 'kakao_pay'}
                        onChange={() => handlePaymentMethodChange('kakao_pay')}
                      />
                      <span className="option-label">카카오페이</span>
                    </label>
                    
                    <label className="payment-option">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="naver_pay"
                        checked={paymentInfo.method === 'naver_pay'}
                        onChange={() => handlePaymentMethodChange('naver_pay')}
                      />
                      <span className="option-label">네이버페이</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 오른쪽: 주문 요약 */}
              <div className="order-summary">
                <div className="summary-header">
                  <h2>주문 요약</h2>
                </div>

                <div className="order-items">
                  {cartItems.map((item) => (
                    <div key={item._id} className="order-item">
                      <div className="item-image">
                        <img 
                          src={item.product?.image} 
                          alt={item.product?.name}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div className="image-placeholder">
                          <span>📦</span>
                        </div>
                      </div>
                      <div className="item-info">
                        <h3 className="item-name">{item.product?.name}</h3>
                        <p className="item-options">
                          {item.selectedSize && `${item.selectedSize} · `}
                          {item.selectedColor && `${item.selectedColor}`}
                        </p>
                        <div className="item-price">
                          <span className="current-price">₩{item.product?.price?.toLocaleString()}</span>
                          {item.product?.originalPrice && item.product.originalPrice > item.product.price && (
                            <span className="original-price">₩{item.product.originalPrice?.toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="cost-breakdown">
                  <div className="cost-row">
                    <span>상품 수량 ({totalItems}개)</span>
                    <span>₩{totalAmount?.toLocaleString()}</span>
                  </div>
                  <div className="cost-row">
                    <span>배송비</span>
                    <span className="free-shipping">무료</span>
                  </div>
                  <div className="cost-divider"></div>
                  <div className="cost-row total-row">
                    <span>총 결제금액</span>
                    <span className="total-amount">₩{totalAmount?.toLocaleString()}</span>
                  </div>
                </div>

                <button 
                  className="place-order-btn"
                  onClick={handlePlaceOrder}
                >
                  주문하기
                </button>

                <p className="terms-message">
                  주문을 완료하시면 개인정보처리방침 및 이용약관에 동의하는 것으로 간주됩니다.
                </p>

                <div className="payment-methods">
                  <span className="payment-method">VISA</span>
                  <span className="payment-method">MC</span>
                  <span className="payment-method">AMEX</span>
                  <span className="payment-method">PAYPAL</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CheckoutPage;
