import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './styles/ProductManagement.css';

// API 기본 URL 설정
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';

const ProductManagement = () => {
  const navigate = useNavigate();
  const { token, logout, isAuthenticated } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const categories = [
    { value: 'all', label: '전체' },
    { value: '상의', label: '상의' },
    { value: '하의', label: '하의' },
    { value: '원피스', label: '원피스' },
    { value: '신발', label: '신발' },
    { value: '액세서리', label: '액세서리' },
    { value: '기타', label: '기타' }
  ];

  // 상품 목록 조회 API 호출
  const fetchProducts = async (page = 1, search = '', category = 'all') => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '2'
      });

      if (search) {
        params.append('search', search);
      }

      if (category !== 'all') {
        params.append('category', category);
      }

      const response = await fetch(`${API_BASE_URL}/api/products?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setError('인증이 만료되었습니다. 다시 로그인해주세요.');
          logout();
          navigate('/login');
          return;
        }
        throw new Error(result.message || '상품 목록을 불러오는데 실패했습니다');
      }

      setProducts(result.data || []);
      setTotalPages(result.pagination?.totalPages || 1);
      setTotalItems(result.pagination?.totalItems || 0);
      setCurrentPage(page);

    } catch (error) {
      console.error('상품 목록 조회 오류:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 상품 삭제 API 호출
  const deleteProduct = async (productId) => {
    if (!window.confirm('정말로 이 상품을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setError('인증이 만료되었습니다. 다시 로그인해주세요.');
          logout();
          navigate('/login');
          return;
        }
        throw new Error(result.message || '상품 삭제에 실패했습니다');
      }

      // 삭제 성공 시 목록 새로고침
      await fetchProducts(currentPage, searchTerm, selectedCategory);
      alert('상품이 성공적으로 삭제되었습니다.');

    } catch (error) {
      console.error('상품 삭제 오류:', error);
      alert(`상품 삭제에 실패했습니다: ${error.message}`);
    }
  };

  // 컴포넌트 마운트 시 상품 목록 조회
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchProducts(1, '', 'all');
    } else if (!isAuthenticated) {
      setError('로그인이 필요합니다.');
      navigate('/login');
    }
  }, [isAuthenticated, token, navigate]);

  // 검색어 변경 시 API 호출
  useEffect(() => {
    if (isAuthenticated && token) {
      const timeoutId = setTimeout(() => {
        fetchProducts(1, searchTerm, selectedCategory);
      }, 500); // 500ms 디바운스

      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm, selectedCategory, isAuthenticated, token]);

  // 페이지 변경 핸들러
  const handlePageChange = (page) => {
    fetchProducts(page, searchTerm, selectedCategory);
  };

  // 카테고리 변경 핸들러
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  // 로딩 중이거나 에러가 있을 때 표시할 컴포넌트
  if (loading) {
    return (
      <div className="product-management">
        <header className="admin-header">
          <div className="header-left">
            <Link to="/admin" className="back-btn">← 상품 관리</Link>
            <h1>상품 관리</h1>
          </div>
        </header>
        <main className="product-main">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>상품 목록을 불러오는 중...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-management">
        <header className="admin-header">
          <div className="header-left">
            <Link to="/admin" className="back-btn">← 상품 관리</Link>
            <h1>상품 관리</h1>
          </div>
        </header>
        <main className="product-main">
          <div className="error-container">
            <p className="error-message">{error}</p>
            <button 
              className="retry-btn"
              onClick={() => fetchProducts(currentPage, searchTerm, selectedCategory)}
            >
              다시 시도
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="product-management">
      {/* 상단 헤더 */}
      <header className="admin-header">
        <div className="header-left">
          <Link to="/admin" className="back-btn">← 상품 관리</Link>
          <h1>상품 관리</h1>
        </div>
        <div className="header-right">
          <Link to="/admin/products/new" className="new-product-btn">
            <span className="plus-icon">+</span>
            새상품 등록
          </Link>
        </div>
      </header>

      {/* 탭 네비게이션 */}
      <div className="tab-navigation">
        <div className="tab-item active">
          상품 목록
        </div>
        <Link to="/admin/products/new" className="tab-item inactive">
          상품 등록
        </Link>
      </div>

      {/* 메인 콘텐츠 */}
      <main className="product-main">
        <div className="search-filter-section">
          <div className="search-box">
            <span className="search-icon">Q</span>
            <input 
              type="text" 
              placeholder="상품명으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filter-dropdown">
            <select 
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="category-select"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 상품 테이블 */}
        <div className="products-table-container">
          <table className="products-table">
            <thead>
              <tr>
                <th>이미지</th>
                <th>상품명</th>
                <th>카테고리</th>
                <th>가격</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan="5" className="no-data-cell">
                    <div className="no-data">
                      <span className="no-data-icon">📦</span>
                      <p>등록된 상품이 없습니다.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product, index) => (
                  <tr key={product._id || index} className="product-row">
                    <td className="image-cell">
                      <div className="product-image-placeholder">
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="product-image"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                        <div className="image-placeholder" style={{display: 'none'}}>
                          <span className="placeholder-icon">📦</span>
                        </div>
                      </div>
                    </td>
                    <td className="name-cell">
                      <div className="product-name">{product.name}</div>
                    </td>
                    <td className="category-cell">
                      <div className="product-category">{product.category}</div>
                    </td>
                    <td className="price-cell">
                      <div className="price-container">
                        <span className="current-price">₩{product.price?.toLocaleString()}</span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="original-price">₩{product.originalPrice?.toLocaleString()}</span>
                        )}
                      </div>
                    </td>
                    <td className="action-cell">
                      <div className="action-buttons">
                        <button 
                          className="edit-btn" 
                          title="수정"
                          onClick={() => navigate(`/admin/products/edit/${product._id}`)}
                        >
                          <span className="edit-icon">✏️</span>
                        </button>
                        <button 
                          className="delete-btn" 
                          title="삭제"
                          onClick={() => deleteProduct(product._id)}
                        >
                          <span className="delete-icon">🗑️</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="pagination">
            <button 
              className="page-btn prev"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              이전
            </button>
            <div className="page-numbers">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button 
                  key={page}
                  className={`page-number ${currentPage === page ? 'active' : ''}`}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              ))}
            </div>
            <button 
              className="page-btn next"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              다음
            </button>
          </div>
        )}

        {/* 상품 개수 정보 */}
        <div className="product-info">
          <p>총 {totalItems}개의 상품이 있습니다.</p>
        </div>
      </main>
    </div>
  );
};

export default ProductManagement;
