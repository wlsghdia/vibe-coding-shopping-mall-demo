import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './styles/ProductDetail.css';

// API 기본 URL 설정
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');

  // 상품 상세 정보 가져오기
  const fetchProduct = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '상품 정보를 불러오는데 실패했습니다');
      }

      setProduct(result.data);
    } catch (error) {
      console.error('상품 정보 로드 실패:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  // 수량 증가
  const increaseQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  // 수량 감소
  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  // 장바구니 추가
  const addToBag = async () => {
    if (!token) {
      alert('로그인이 필요합니다. 로그인 페이지로 이동합니다.');
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/cart/items`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId: product._id,
          quantity: quantity,
          selectedSize: selectedSize || undefined,
          selectedColor: selectedColor || undefined
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '장바구니 추가에 실패했습니다');
      }

      alert(`${product.name}을(를) 장바구니에 추가했습니다!`);
      
      // 네비게이션 바의 장바구니 개수 업데이트
      window.dispatchEvent(new CustomEvent('cartUpdated'));
      
      // 장바구니 페이지로 이동할지 확인
      if (window.confirm('장바구니 페이지로 이동하시겠습니까?')) {
        navigate('/cart');
      }
    } catch (error) {
      console.error('장바구니 추가 실패:', error);
      alert(error.message);
    }
  };

  // 위시리스트 추가
  const addToWishlist = () => {
    // TODO: 위시리스트 추가 로직 구현
    alert(`${product.name}을(를) 위시리스트에 추가했습니다!`);
  };

  // 탭 렌더링 함수
  const renderTabContent = () => {
    switch (activeTab) {
      case 'description':
        return (
          <div className="tab-content">
            <h3>상품 설명</h3>
            <div className="product-description">
              <p><strong>스타일 Deets</strong></p>
              <ul>
                <li>핏 유형: 레귤러</li>
                <li>체스트 패드: 패딩 없음</li>
                <li>안감: 안감이 없는</li>
                <li>길이: 레귤러</li>
                <li>넥: V넥</li>
              </ul>
              <p><strong>디자인 정보</strong></p>
              <ul>
                <li>상황: 휴가</li>
                <li>패턴 유형: 무지</li>
                <li>의류 디테일: 러플</li>
              </ul>
              <p>{product.description || '고품질 소재로 제작된 프리미엄 상품입니다.'}</p>
            </div>
          </div>
        );
      case 'reviews':
        return (
          <div className="tab-content">
            <h3>리뷰 (124)</h3>
            <div className="reviews-summary">
              <div className="rating-overview">
                <span className="overall-rating">4.8</span>
                <div className="stars">⭐⭐⭐⭐⭐</div>
                <span className="review-count">124개 리뷰</span>
              </div>
            </div>
            <div className="reviews-list">
              <div className="review-item">
                <div className="review-header">
                  <span className="reviewer-name">김**</span>
                  <div className="review-rating">⭐⭐⭐⭐⭐</div>
                  <span className="review-date">2024.01.15</span>
                </div>
                <p className="review-text">정말 만족스러운 구매였습니다. 품질이 좋고 디자인도 예뻐요!</p>
              </div>
              <div className="review-item">
                <div className="review-header">
                  <span className="reviewer-name">이**</span>
                  <div className="review-rating">⭐⭐⭐⭐</div>
                  <span className="review-date">2024.01.10</span>
                </div>
                <p className="review-text">사이즈가 딱 맞고 착용감이 좋습니다. 추천해요!</p>
              </div>
            </div>
          </div>
        );
      case 'shipping':
        return (
          <div className="tab-content">
            <h3>배송 및 반품</h3>
            <div className="shipping-info">
              <div className="info-item">
                <div className="info-icon">📦</div>
                <div className="info-text">
                  <h4>무료 배송</h4>
                  <p>10만원 이상 주문시 무료배송</p>
                </div>
              </div>
              <div className="info-item">
                <div className="info-icon">↩️</div>
                <div className="info-text">
                  <h4>쉬운 반품</h4>
                  <p>30일 반품 정책</p>
                </div>
              </div>
              <div className="info-item">
                <div className="info-icon">🔒</div>
                <div className="info-text">
                  <h4>안전한 결제</h4>
                  <p>SSL 암호화</p>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="product-detail">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>상품 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-detail">
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button className="retry-btn" onClick={fetchProduct}>
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-detail">
        <div className="no-product">
          <p>상품을 찾을 수 없습니다.</p>
          <button className="back-btn" onClick={() => navigate('/')}>
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 할인율 계산
  const discountPercentage = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="product-detail">
      {/* 헤더 */}
      <div className="product-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ←
        </button>
        <h1 className="product-title">{product.name}</h1>
        <div className="header-actions">
          <button className="action-btn share-btn">📤</button>
          <button className="action-btn wishlist-btn">♡</button>
        </div>
      </div>

      <div className="product-content">
        {/* 상품 이미지 섹션 */}
        <div className="product-media">
          <div className="main-image">
            <img 
              src={product.image} 
              alt={product.name}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="image-placeholder">
              <span className="placeholder-icon">📦</span>
            </div>
          </div>
        </div>

        {/* 상품 정보 섹션 */}
        <div className="product-info">
          {/* 태그 */}
          <div className="product-tags">
            <span className="tag new-tag">NEW</span>
            {discountPercentage > 0 && (
              <span className="tag sale-tag">SALE</span>
            )}
          </div>

          {/* 상품명 */}
          <h2 className="product-name">{product.name}</h2>

          {/* 평점 */}
          <div className="product-rating">
            <span className="stars">⭐</span>
            <span className="rating-text">4.8 (124 reviews)</span>
          </div>

          {/* 가격 */}
          <div className="product-price">
            <span className="current-price">₩{product.price?.toLocaleString()}</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <>
                <span className="original-price">₩{product.originalPrice?.toLocaleString()}</span>
                <span className="discount-tag">{discountPercentage}% OFF</span>
              </>
            )}
          </div>

          {/* 사이즈 선택 */}
          <div className="size-selection">
            <label className="selection-label">Size</label>
            <div className="size-options">
              {['XS', 'S', 'M', 'L', 'XL'].map(size => (
                <button
                  key={size}
                  className={`size-btn ${selectedSize === size ? 'selected' : ''}`}
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* 색상 선택 */}
          <div className="color-selection">
            <label className="selection-label">Color:</label>
            <div className="color-options">
              <button className="color-btn selected" style={{backgroundColor: '#4A90E2'}}></button>
              <button className="color-btn" style={{backgroundColor: '#000000'}}></button>
              <button className="color-btn" style={{backgroundColor: '#87CEEB'}}></button>
            </div>
          </div>

          {/* 수량 선택 */}
          <div className="quantity-selection">
            <label className="selection-label">Quantity</label>
            <div className="quantity-controls">
              <button className="quantity-btn" onClick={decreaseQuantity}>-</button>
              <span className="quantity-value">{quantity}</span>
              <button className="quantity-btn" onClick={increaseQuantity}>+</button>
            </div>
            <span className="stock-info">Only 5 left in stock</span>
          </div>

          {/* 액션 버튼들 */}
          <div className="action-buttons">
            <button className="add-to-bag-btn" onClick={addToBag}>
              <span className="bag-icon">🛍️</span>
              ADD TO BAG - ₩{(product.price * quantity).toLocaleString()}
            </button>
            <button className="add-to-wishlist-btn" onClick={addToWishlist}>
              <span className="heart-icon">♡</span>
              ADD TO WISHLIST
            </button>
          </div>
        </div>
      </div>

      {/* 상품 상세 정보 탭 섹션 */}
      <div className="product-details-section">
        <div className="product-details-container">
          {/* 탭 네비게이션 */}
          <div className="tab-navigation">
            <button 
              className={`tab-btn ${activeTab === 'description' ? 'active' : ''}`}
              onClick={() => setActiveTab('description')}
            >
              설명
            </button>
            <button 
              className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              리뷰 (124)
            </button>
            <button 
              className={`tab-btn ${activeTab === 'shipping' ? 'active' : ''}`}
              onClick={() => setActiveTab('shipping')}
            >
              배송 & 반품
            </button>
          </div>

          {/* 탭 콘텐츠 */}
          <div className="tab-content-wrapper">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
