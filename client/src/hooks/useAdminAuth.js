import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const useAdminAuth = () => {
  const navigate = useNavigate();
  const { user, token, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      // 로그인하지 않은 경우
      if (!token || !user) {
        navigate('/login');
        return;
      }

      // 관리자가 아닌 경우
      if (user.user_type !== 'admin') {
        alert('관리자 권한이 필요합니다.');
        navigate('/');
        return;
      }
    }
  }, [user, token, loading, navigate]);

  return { user, token, loading, isAdmin: user?.user_type === 'admin' };
};
