import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import './ProductsPreview.css'

const ProductsPreview = memo(({ products = [], loading = false, error = '', onRetry }) => {
  const navigate = useNavigate();

  // 상품 카드 클릭 핸들러
  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };
  // 로딩 상태
  if (loading) {
    return (
      <section className="products-preview" style={{backgroundColor: 'transparent'}}>
        <h2>상품 미리보기</h2>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>상품을 불러오는 중...</p>
        </div>
      </section>
    )
  }

  // 에러 상태
  if (error) {
    return (
      <section className="products-preview" style={{backgroundColor: 'transparent'}}>
        <h2>상품 미리보기</h2>
        <div className="error-container">
          <p className="error-message">{error}</p>
          {onRetry && (
            <button className="retry-btn" onClick={onRetry}>
              다시 시도
            </button>
          )}
        </div>
      </section>
    )
  }

  // 상품이 없는 경우
  if (products.length === 0) {
    return (
      <section className="products-preview" style={{backgroundColor: 'transparent'}}>
        <h2>상품 미리보기</h2>
        <div className="no-products">
          <span className="no-products-icon">📦</span>
          <p>등록된 상품이 없습니다.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="products-preview" style={{backgroundColor: 'transparent'}}>
      <h2>상품 미리보기</h2>
      <div className="products-grid">
        {products.slice(0, 10).map((product) => (
          <div 
            key={product._id} 
            className="product-card"
            onClick={() => handleProductClick(product._id)}
          >
            <div className="product-image">
              <img 
                src={product.image} 
                alt={product.name}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
                onLoad={(e) => {
                  e.target.nextSibling.style.display = 'none';
                }}
              />
              <div className="image-placeholder" style={{display: 'none'}}>
                <span className="placeholder-icon">📦</span>
              </div>
            </div>
            <div className="product-info">
              <h3 className="product-name">{product.name}</h3>
              <div className="product-price">
                <span className="current-price">₩{product.price?.toLocaleString()}</span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="original-price">₩{product.originalPrice?.toLocaleString()}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {products.length > 10 && (
        <div className="more-products">
          <p>+ {products.length - 10}개의 상품 더 보기</p>
        </div>
      )}
    </section>
  )
})

ProductsPreview.displayName = 'ProductsPreview'

export default ProductsPreview
