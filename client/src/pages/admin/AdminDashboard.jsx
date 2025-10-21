import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './styles/AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const adminMenuItems = [
    {
      title: '상품 관리',
      description: '상품 등록, 수정, 삭제',
      icon: '📦',
      path: '/admin/products'
    },
    {
      title: '주문 관리',
      description: '주문 목록 조회 및 상태 관리',
      icon: '📋',
      path: '/admin/orders'
    },
    {
      title: '상품 등록',
      description: '새로운 상품 등록',
      icon: '➕',
      path: '/admin/product-registration'
    }
  ];

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="header-left">
          <h1 className="page-title">관리자 대시보드</h1>
        </div>
        <div className="header-right">
          <div className="user-info">
            <span className="welcome-text">안녕하세요, {user?.userName || '관리자'}님</span>
            <button 
              className="logout-btn"
              onClick={handleLogout}
            >
              로그아웃
            </button>
          </div>
          <button 
            className="back-to-shop"
            onClick={() => navigate('/')}
          >
            쇼핑몰로 돌아가기
          </button>
        </div>
      </header>

      <main className="admin-main">
        <div className="dashboard-content">
          <div className="welcome-section">
            <h2>관리자 패널에 오신 것을 환영합니다</h2>
            <p>아래 메뉴를 통해 쇼핑몰을 관리하실 수 있습니다.</p>
          </div>

          <div className="menu-grid">
            {adminMenuItems.map((item, index) => (
              <div 
                key={index}
                className="menu-card"
                onClick={() => navigate(item.path)}
              >
                <div className="menu-icon">{item.icon}</div>
                <h3 className="menu-title">{item.title}</h3>
                <p className="menu-description">{item.description}</p>
                <div className="menu-arrow">→</div>
              </div>
            ))}
          </div>

          <div className="quick-stats">
            <h3>빠른 통계</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📦</div>
                <div className="stat-content">
                  <div className="stat-number">-</div>
                  <div className="stat-label">총 상품 수</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📋</div>
                <div className="stat-content">
                  <div className="stat-number">-</div>
                  <div className="stat-label">총 주문 수</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">💰</div>
                <div className="stat-content">
                  <div className="stat-number">-</div>
                  <div className="stat-label">총 매출</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
