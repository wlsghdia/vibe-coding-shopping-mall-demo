import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 컴포넌트 마운트 시 저장된 인증 정보 확인
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    
    setIsLoading(false);
  }, []);

  // 로그인 함수
  const login = async (email, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setToken(data.data.token);
        setUser(data.data.user);
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      return { success: false, error: '서버 연결에 실패했습니다.' };
    }
  };

  // 로그아웃 함수
  const logout = async () => {
    try {
      // 서버에 로그아웃 요청 (선택적)
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('로그아웃 요청 실패:', error);
    } finally {
      // 로컬 상태 초기화
      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('rememberMe');
    }
  };

  // 토큰 검증 함수
  const verifyToken = async () => {
    if (!token) return false;
    
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (response.ok) {
        setUser(data.data.user);
        return true;
      } else {
        // 토큰이 유효하지 않으면 로그아웃
        logout();
        return false;
      }
    } catch (error) {
      console.error('토큰 검증 실패:', error);
      logout();
      return false;
    }
  };

  // 토큰 만료 확인
  const isTokenExpired = (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      return true; // 토큰 파싱 실패 시 만료된 것으로 간주
    }
  };

  // 현재 사용자 정보 조회 (토큰 만료 처리 포함)
  const getCurrentUser = async () => {
    if (!token) return null;
    
    // 토큰 만료 확인
    if (isTokenExpired(token)) {
      console.log('토큰이 만료되었습니다. 로그아웃 처리합니다.');
      logout();
      return null;
    }
    
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (response.ok) {
        setUser(data.data.user);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        return data.data.user;
      } else if (response.status === 401) {
        console.log('서버에서 토큰 만료 확인. 로그아웃 처리합니다.');
        logout();
        return null;
      } else {
        logout();
        return null;
      }
    } catch (error) {
      console.error('사용자 정보 조회 실패:', error);
      logout();
      return null;
    }
  };

  // fetchUserInfo 함수 추가 (HomePage에서 사용)
  const fetchUserInfo = getCurrentUser;

  const value = {
    user,
    token,
    isLoading,
    login,
    logout,
    verifyToken,
    getCurrentUser,
    fetchUserInfo,
    isAuthenticated: !!user && !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
