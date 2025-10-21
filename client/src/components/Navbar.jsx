import { useState, useEffect, useCallback, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Navbar = memo(() => {
  const navigate = useNavigate()
  const { token, user, logout } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)
  const [cartCount, setCartCount] = useState(0)

  // 장바구니 개수 가져오기
  const fetchCartCount = useCallback(async () => {
    if (!token) {
      setCartCount(0)
      return
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002'}/api/cart/count`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()

      if (response.ok) {
        setCartCount(result.data.count || 0)
      }
    } catch (error) {
      console.error('장바구니 개수 조회 실패:', error)
    }
  }, [token])

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.user-dropdown')) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  // 장바구니 개수 조회
  useEffect(() => {
    fetchCartCount()
  }, [fetchCartCount])

  // 장바구니 변경 이벤트 리스너
  useEffect(() => {
    const handleCartUpdate = () => {
      fetchCartCount()
    }

    window.addEventListener('cartUpdated', handleCartUpdate)
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate)
    }
  }, [fetchCartCount])

  // 로그아웃 처리
  const handleLogout = useCallback(async () => {
    try {
      await logout()
      setShowDropdown(false)
      navigate('/')
    } catch (error) {
      console.error('로그아웃 실패:', error)
    }
  }, [logout, navigate])

  return (
    <header className="cider-navbar">
      <div className="navbar-container">
        {/* 왼쪽: 브랜드 로고 및 카테고리 */}
        <div className="navbar-left">
          <div className="brand-logo">
            <h1>CIDER</h1>
          </div>
          <nav className="nav-categories">
            <a href="#" className="nav-link">NEW IN</a>
            <a href="#" className="nav-link">CLOTHING</a>
            <a href="#" className="nav-link">ACCESSORIES</a>
            <a href="#" className="nav-link">SALE</a>
          </nav>
        </div>

        {/* 중앙: 검색창 */}
        <div className="navbar-center">
          <div className="search-container">
            <span className="search-icon">🔍</span>
            <input 
              type="text" 
              placeholder="Search for items..." 
              className="search-input"
            />
          </div>
        </div>

        {/* 오른쪽: 사용자 액션 */}
        <div className="navbar-right">
          <div className="nav-icons">
            <button className="nav-icon">
              <span className="icon">♡</span>
            </button>
            
            {/* 로그인 상태별 표시 */}
            {token && user && user.name ? (
              <div className="user-dropdown">
                <button 
                  className="user-name-btn"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  {user.name}님 환영합니다
                  <span className="dropdown-arrow">
                    {showDropdown ? '▲' : '▼'}
                  </span>
                </button>
                
                {showDropdown && (
                  <div 
                    className="dropdown-menu"
                    onMouseEnter={() => setShowDropdown(true)}
                    onMouseLeave={() => setShowDropdown(false)}
                  >
                    <div className="dropdown-item user-info-item">
                      <div className="user-details">
                        <div className="user-name">{user.name}</div>
                        <div className="user-email-detail">{user.email}</div>
                        <div className="user-type">{user.user_type === 'admin' ? '관리자' : '일반 사용자'}</div>
                      </div>
                    </div>
                    <div className="dropdown-divider"></div>
                    <button 
                      className="dropdown-item order-list-btn"
                      onClick={() => {
                        navigate('/orders');
                        setShowDropdown(false);
                      }}
                    >
                      <span className="order-icon">📋</span>
                      내 주문 목록
                    </button>
                    <button 
                      className="dropdown-item logout-btn"
                      onClick={handleLogout}
                    >
                      <span className="logout-icon">🚪</span>
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="login-signup-buttons">
                <button 
                  onClick={() => navigate('/login')} 
                  className="login-btn-nav"
                >
                  로그인
                </button>
                <button 
                  onClick={() => navigate('/signup')} 
                  className="signup-btn-nav"
                >
                  회원가입
                </button>
              </div>
            )}

            {/* 어드민 버튼 (관리자만 표시) */}
            {user && user.user_type === 'admin' && (
              <button 
                className="admin-btn-nav"
                onClick={() => navigate('/admin')}
              >
                어드민
              </button>
            )}

            <button 
              className="nav-icon cart-icon"
              onClick={() => navigate('/cart')}
            >
              <span className="icon">🛍️</span>
              {cartCount > 0 && (
                <span className="cart-badge">{cartCount}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
})

Navbar.displayName = 'Navbar'

export default Navbar
