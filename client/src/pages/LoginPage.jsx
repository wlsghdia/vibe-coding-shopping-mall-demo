import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import './styles/LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, token, user, fetchUserInfo } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [emailError, setEmailError] = useState('');

  // 이미 로그인된 사용자인지 확인
  useEffect(() => {
    const checkAuthStatus = async () => {
      if (token && !user) {
        // 토큰은 있지만 유저 정보가 없는 경우, 유저 정보 가져오기
        try {
          await fetchUserInfo();
        } catch (error) {
          console.error('유저 정보 로드 실패:', error);
        }
      }
      
      // 토큰과 유저 정보가 모두 있으면 메인페이지로 리다이렉트
      if (token && user) {
        navigate('/', { replace: true });
        return;
      }
      
      setIsCheckingAuth(false);
    };
    
    checkAuthStatus();
  }, [token, user, navigate, fetchUserInfo]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 이메일 실시간 검증
    if (name === 'email') {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
        setEmailError('올바른 이메일 형식을 입력해주세요.');
      } else {
        setEmailError('');
      }
    }
  };

  // 폼 검증 함수
  const validateForm = () => {
    const errors = [];
    
    // 이메일 검증
    if (!formData.email || formData.email.trim() === '') {
      errors.push('이메일을 입력해주세요.');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.push('올바른 이메일 형식을 입력해주세요.');
    }
    
    // 비밀번호 검증
    if (!formData.password || formData.password.trim() === '') {
      errors.push('비밀번호를 입력해주세요.');
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    // 폼 검증
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors[0]);
      setIsLoading(false);
      return;
    }
    
    // 이메일 정규화 (소문자 변환, 공백 제거)
    const normalizedEmail = formData.email.trim().toLowerCase();
    const trimmedPassword = formData.password.trim();
    
    const result = await login(normalizedEmail, trimmedPassword);
    
    if (result.success) {
      // 로그인 상태 유지 설정
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberMe');
      }
      
      setSuccess('로그인에 성공했습니다!');
      
      // 1초 후 홈페이지로 리다이렉트
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } else {
      setError(result.error || '로그인에 실패했습니다.');
    }
    
    setIsLoading(false);
  };

  // 인증 상태 확인 중일 때 로딩 표시
  if (isCheckingAuth) {
    return (
      <div className="cider-app">
        <Navbar />
        <div className="login-container">
          <div className="login-card">
            <div className="login-content">
              <div className="auth-checking">
                <div className="loading-spinner"></div>
                <p>인증 상태를 확인하고 있습니다...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cider-app">
      <Navbar />
      
      <div className="login-container">
        <div className="login-card">
          <div className="login-content">
            <h2 className="login-title">로그인</h2>
            <p className="login-subtitle">계정에 로그인하여 쇼핑을 시작하세요</p>
            
            {/* 에러 메시지 */}
            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}
            
            {/* 성공 메시지 */}
            {success && (
              <div className="success-message">
                <span className="success-icon">✅</span>
                {success}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="email" className="form-label">이메일</label>
                <div className="input-container">
                  <span className="input-icon">📧</span>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your@email.com"
                    className={`form-input ${emailError ? 'error' : ''}`}
                    autoComplete="email"
                    required
                  />
                </div>
                {emailError && (
                  <div className="field-error">
                    <span className="error-icon">⚠️</span>
                    {emailError}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">비밀번호</label>
                <div className="input-container">
                  <span className="input-icon">🔒</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="비밀번호를 입력하세요"
                    className="form-input"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="form-options">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="checkmark"></span>
                  로그인 상태 유지
                </label>
                <Link to="/forgot-password" className="forgot-password">
                  비밀번호 찾기
                </Link>
              </div>

              <button
                type="submit"
                className="login-button"
                disabled={isLoading}
              >
                {isLoading ? '로그인 중...' : '로그인'}
              </button>
            </form>

            <div className="divider">
              <span>또는</span>
            </div>

            <div className="social-login">
              <button className="social-button google">
                <span className="social-icon">🔍</span>
                Google로 로그인
              </button>
              <button className="social-button facebook">
                <span className="social-icon">📘</span>
                Facebook으로 로그인
              </button>
              <button className="social-button apple">
                <span className="social-icon">🍎</span>
                Apple로 로그인
              </button>
            </div>

            <div className="signup-link">
              <span>아직 계정이 없으신가요? </span>
              <Link to="/signup" className="signup-text">회원가입</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;