import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import './styles/CartPage.css';

// API 기본 URL 설정
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';

const CartPage = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

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

  // 수량 업데이트
  const updateQuantity = async (itemId, newQuantity) => {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/cart/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quantity: newQuantity })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '수량 업데이트에 실패했습니다');
      }

      // 장바구니 다시 로드
      await fetchCart();
      
      // 네비게이션 바의 장바구니 개수 업데이트
      window.dispatchEvent(new CustomEvent('cartUpdated'));
    } catch (error) {
      console.error('수량 업데이트 실패:', error);
      alert(error.message);
    }
  };

  // 아이템 제거
  const removeItem = async (itemId) => {
    if (!token) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      console.log('아이템 제거 시도:', itemId);
      
      const response = await fetch(`${API_BASE_URL}/api/cart/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('응답 상태:', response.status);
      
      const result = await response.json();
      console.log('응답 데이터:', result);

      if (!response.ok) {
        throw new Error(result.message || '아이템 제거에 실패했습니다');
      }

      // 장바구니 다시 로드
      await fetchCart();
      
      // 네비게이션 바의 장바구니 개수 업데이트
      window.dispatchEvent(new CustomEvent('cartUpdated'));
    } catch (error) {
      console.error('아이템 제거 실패:', error);
      alert(`아이템 제거 실패: ${error.message}`);
    }
  };

  // 장바구니 비우기
  const clearCart = async () => {
    if (!token) return;

    if (!window.confirm('장바구니를 비우시겠습니까?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/cart`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '장바구니 비우기에 실패했습니다');
      }

      // 장바구니 다시 로드
      await fetchCart();
      
      // 네비게이션 바의 장바구니 개수 업데이트
      window.dispatchEvent(new CustomEvent('cartUpdated'));
    } catch (error) {
      console.error('장바구니 비우기 실패:', error);
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
          <div className="cart-page">
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>장바구니를 불러오는 중...</p>
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
          <div className="cart-page">
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
          <div className="cart-page">
            <div className="login-required">
              <h2>로그인이 필요합니다</h2>
              <p>장바구니를 보려면 로그인해주세요</p>
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
          <div className="cart-page">
            <div className="empty-cart">
              <div className="empty-cart-icon">🛒</div>
              <h2>장바구니가 비어있습니다</h2>
              <p>원하는 상품을 장바구니에 추가해보세요</p>
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
        <div className="cart-page">
          <div className="cart-container">
            <div className="cart-header">
              <h1>장바구니 ({totalItems}개)</h1>
              <button 
                className="clear-cart-btn"
                onClick={clearCart}
              >
                전체 삭제
              </button>
            </div>

            <div className="cart-content">
              <div className="cart-items">
                {cartItems.map((item) => (
                  <div key={item._id} className="cart-item">
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

                    <div className="item-details">
                      <h3 className="item-name">{item.product?.name}</h3>
                      <p className="item-category">{item.product?.category}</p>
                      {item.selectedSize && (
                        <p className="item-option">사이즈: {item.selectedSize}</p>
                      )}
                      {item.selectedColor && (
                        <p className="item-option">색상: {item.selectedColor}</p>
                      )}
                    </div>

                    <div className="item-price">
                      <span className="price">₩{item.product?.price?.toLocaleString()}</span>
                      {item.product?.originalPrice && item.product.originalPrice > item.product.price && (
                        <span className="original-price">₩{item.product.originalPrice?.toLocaleString()}</span>
                      )}
                    </div>

                    <div className="item-quantity">
                      <button 
                        className="quantity-btn"
                        onClick={() => updateQuantity(item._id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        -
                      </button>
                      <span className="quantity">{item.quantity}</span>
                      <button 
                        className="quantity-btn"
                        onClick={() => updateQuantity(item._id, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>

                    <div className="item-total">
                      <span className="total-price">
                        ₩{(item.product?.price * item.quantity)?.toLocaleString()}
                      </span>
                    </div>

                    <button 
                      className="remove-btn"
                      onClick={() => removeItem(item._id)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div className="cart-summary">
                <div className="summary-header">
                  <h3>주문 요약</h3>
                </div>
                
                <div className="summary-details">
                  <div className="summary-row">
                    <span>상품 수량</span>
                    <span>{totalItems}개</span>
                  </div>
                  <div className="summary-row">
                    <span>상품 금액</span>
                    <span>₩{totalAmount?.toLocaleString()}</span>
                  </div>
                  <div className="summary-row">
                    <span>배송비</span>
                    <span>무료</span>
                  </div>
                  <div className="summary-divider"></div>
                  <div className="summary-row total-row">
                    <span>총 결제금액</span>
                    <span>₩{totalAmount?.toLocaleString()}</span>
                  </div>
                </div>

                <button 
                  className="checkout-btn"
                  onClick={() => navigate('/checkout')}
                >
                  주문하기
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CartPage;
