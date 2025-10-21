import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

// 네트워크 오류 처리를 위한 axios 인스턴스 생성
const apiClient = axios.create({
  timeout: 10000, // 10초 타임아웃
  headers: {
    'Content-Type': 'application/json'
  }
})

// 요청 인터셉터 - 네트워크 상태 확인
apiClient.interceptors.request.use(
  (config) => {
    if (!navigator.onLine) {
      throw new Error('인터넷 연결을 확인해주세요.')
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 응답 인터셉터 - 네트워크 오류 처리
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!navigator.onLine) {
      error.message = '인터넷 연결이 끊어졌습니다. 연결을 확인하고 다시 시도해주세요.'
    }
    return Promise.reject(error)
  }
)

function SignupPage() {
  const navigate = useNavigate()
  const { token, user, fetchUserInfo } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    user_type: 'customer',
    agreeToAll: false,
    agreeToTerms: false,
    agreeToPrivacy: false,
    receiveMarketing: false
  })
  const [errors, setErrors] = useState({})
  const [submissionStatus, setSubmissionStatus] = useState(null)
  const [submissionMessage, setSubmissionMessage] = useState('')
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    const isComposing = e.nativeEvent && e.nativeEvent.isComposing
    
    // 이름 필드에서 띄어쓰기 및 특수문자 방지 (한글/영문/숫자 허용)
    if (name === 'name') {
      // 한글 입력기 조합 중에는 필터링하지 않음
      if (isComposing) {
        setFormData(prev => ({ ...prev, [name]: value }))
        return
      }
      const filteredValue = value
        .replace(/\s/g, '') // 모든 공백 제거
        .replace(/[^가-힣a-zA-Z0-9]/g, '') // 한글, 영문, 숫자 허용 (특수문자 제거)
      setFormData(prev => ({
        ...prev,
        [name]: filteredValue
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name) {
      newErrors.name = '이름은 필수입니다'
    } else if (formData.name.includes(' ')) {
      newErrors.name = '이름에는 공백을 포함할 수 없습니다'
    } else if (!/^[가-힣a-zA-Z0-9]+$/.test(formData.name)) {
      newErrors.name = '이름은 한글, 영문, 숫자만 입력 가능합니다'
    }
    if (!formData.email) {
      newErrors.email = '이메일은 필수입니다'
    } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다'
    }
    if (!formData.password) {
      newErrors.password = '비밀번호는 필수입니다'
    } else if (formData.password.length < 6) {
      newErrors.password = '비밀번호는 최소 6글자 이상이어야 합니다'
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다'
    }
    if (!formData.agreeToTerms) newErrors.agreeToTerms = '이용약관 동의는 필수입니다'
    if (!formData.agreeToPrivacy) newErrors.agreeToPrivacy = '개인정보처리방침 동의는 필수입니다'

    setErrors(newErrors)
    const priorityMessage =
      newErrors.name ||
      newErrors.email ||
      newErrors.password ||
      newErrors.confirmPassword ||
      newErrors.agreeToTerms ||
      newErrors.agreeToPrivacy || ''
    return { isValid: Object.keys(newErrors).length === 0, firstMessage: priorityMessage }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmissionStatus(null)

    const validation = validateForm()
    if (!validation.isValid) {
      setSubmissionStatus('error')
      if (validation.firstMessage) setSubmissionMessage(validation.firstMessage)
      return
    }

    try {
      const payload = {
        email: formData.email,
        name: formData.name,
        password: formData.password,
        user_type: formData.user_type
      }

      const response = await apiClient.post('/api/users', payload)
      console.log('회원가입 성공:', response.data)
      setSubmissionStatus('success')
      setSubmissionMessage('회원가입이 성공적으로 완료되었습니다!')
      alert('회원가입이 성공적으로 완료되었습니다!')
      navigate('/')
    } catch (error) {
      console.error('회원가입 실패:', error.response ? error.response.data : error.message)
      setSubmissionStatus('error')
      
      // 네트워크 오류 및 연결 문제 감지
      let errorMessage = '회원가입 중 오류가 발생했습니다'
      
      if (!navigator.onLine) {
        errorMessage = '인터넷 연결을 확인해주세요. 네트워크가 불안정합니다.'
      } else if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
        errorMessage = '서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.'
      } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        errorMessage = '요청 시간이 초과되었습니다. 인터넷 연결을 확인하고 다시 시도해주세요.'
      } else if (error.response?.status === 0) {
        errorMessage = '서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.'
      } else if (error.response?.status === 409) {
        errorMessage = '이미 사용 중인 이메일입니다'
        setErrors(prev => ({ ...prev, email: '이미 사용 중인 이메일입니다' }))
      } else if (error.response?.data?.errors) {
        // 서버가 필드별 에러를 반환하는 경우 반영
        const serverErrors = error.response.data.errors
        if (Array.isArray(serverErrors)) {
          const mapped = {}
          serverErrors.forEach(e => { if (e.field && e.message) mapped[e.field] = e.message })
          setErrors(prev => ({ ...prev, ...mapped }))
          errorMessage = Object.values(mapped)[0] || errorMessage
        } else if (typeof serverErrors === 'object') {
          setErrors(prev => ({ ...prev, ...serverErrors }))
          errorMessage = Object.values(serverErrors)[0] || errorMessage
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      }
      
      setSubmissionStatus('error')
      setSubmissionMessage(errorMessage)
      setErrors(prev => ({ ...prev, api: errorMessage }))
    }
  }

  // 전체 동의 처리
  useEffect(() => {
    if (formData.agreeToAll) {
      setFormData(prev => ({
        ...prev,
        agreeToTerms: true,
        agreeToPrivacy: true,
        receiveMarketing: true
      }))
    }
  }, [formData.agreeToAll])

  // 개별 체크박스에 따른 전체 동의 업데이트
  useEffect(() => {
    const allChecked = formData.agreeToTerms && formData.agreeToPrivacy && formData.receiveMarketing
    if (allChecked !== formData.agreeToAll) {
      setFormData(prev => ({ ...prev, agreeToAll: allChecked }))
    }
  }, [formData.agreeToTerms, formData.agreeToPrivacy, formData.receiveMarketing])

  // 네트워크 상태 모니터링
  useEffect(() => {
    const handleOnline = () => {
      console.log('인터넷 연결이 복구되었습니다.')
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.network
        return newErrors
      })
    }

    const handleOffline = () => {
      console.log('인터넷 연결이 끊어졌습니다.')
      setErrors(prev => ({
        ...prev,
        network: '인터넷 연결이 끊어졌습니다. 연결을 확인하고 다시 시도해주세요.'
      }))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // 인증 상태 확인 중일 때 로딩 표시
  if (isCheckingAuth) {
    return (
      <div className="signup-page-container">
        <header className="signup-header">
          <h1>회원가입</h1>
          <p>새로운 계정을 만들어 쇼핑을 시작하세요</p>
        </header>
        <div className="auth-checking">
          <div className="loading-spinner"></div>
          <p>인증 상태를 확인하고 있습니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="signup-page-container">
      <header className="signup-header">
        <h1>회원가입</h1>
        <p>새로운 계정을 만들어 쇼핑을 시작하세요</p>
      </header>

      <form onSubmit={handleSubmit} className="signup-form">
        {/* 네트워크 오류 메시지 */}
        {errors.network && (
          <div className="network-error">
            <i className="icon-wifi">📶</i>
            <p>{errors.network}</p>
          </div>
        )}
        
        {/* 상단 배너 - 제출 상태 메시지 */}
        {submissionStatus === 'error' && (
          <div className="api-error">
            <i className="icon-error">⚠️</i>
            <p>{submissionMessage || '입력 데이터가 올바르지 않습니다'}</p>
          </div>
        )}
        
        <div className="form-group">
          <label htmlFor="name">이름</label>
          <div className="input-with-icon">
            <i className="icon-person">👤</i>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="이름을 입력하세요"
              value={formData.name}
              onChange={handleChange}
              // 한글 IME 조합 문자 입력을 방해하는 키 차단 로직 제거
              className={errors.name ? 'input-error' : ''}
            />
          </div>
          {errors.name && <p className="error-message">{errors.name}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="email">이메일</label>
          <div className="input-with-icon">
            <i className="icon-email">✉️</i>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="이메일을 입력하세요"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'input-error' : ''}
            />
          </div>
          {errors.email && <p className="error-message">{errors.email}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="password">비밀번호</label>
          <div className="input-with-icon">
            <i className="icon-lock">🔒</i>
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              placeholder="비밀번호를 입력하세요"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? 'input-error' : ''}
            />
            <i
              className="icon-eye"
              role="button"
              aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
              onClick={() => setShowPassword(prev => !prev)}
              style={{ cursor: 'pointer' }}
            >👁️</i>
          </div>
          <p className="hint-text">8자 이상, 영문, 숫자, 특수문자 포함</p>
          {errors.password && <p className="error-message">{errors.password}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">비밀번호 확인</label>
          <div className="input-with-icon">
            <i className="icon-lock">🔒</i>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              placeholder="비밀번호를 다시 입력하세요"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={errors.confirmPassword ? 'input-error' : ''}
            />
            <i
              className="icon-eye"
              role="button"
              aria-label={showConfirmPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
              onClick={() => setShowConfirmPassword(prev => !prev)}
              style={{ cursor: 'pointer' }}
            >👁️</i>
          </div>
          {errors.confirmPassword && <p className="error-message">{errors.confirmPassword}</p>}
        </div>

        <div className="agreement-section">
          <div className="checkbox-group">
            <input
              type="checkbox"
              id="agreeToAll"
              name="agreeToAll"
              checked={formData.agreeToAll}
              onChange={handleChange}
            />
            <label htmlFor="agreeToAll">전체 동의</label>
          </div>

          <div className="checkbox-group sub-checkbox">
            <input
              type="checkbox"
              id="agreeToTerms"
              name="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={handleChange}
              className={errors.agreeToTerms ? 'input-error' : ''}
            />
            <label htmlFor="agreeToTerms">이용약관 동의 (필수)</label>
            <button type="button" className="view-button">보기</button>
            {errors.agreeToTerms && <p className="error-message">{errors.agreeToTerms}</p>}
          </div>

          <div className="checkbox-group sub-checkbox">
            <input
              type="checkbox"
              id="agreeToPrivacy"
              name="agreeToPrivacy"
              checked={formData.agreeToPrivacy}
              onChange={handleChange}
              className={errors.agreeToPrivacy ? 'input-error' : ''}
            />
            <label htmlFor="agreeToPrivacy">개인정보처리방침 동의 (필수)</label>
            <button type="button" className="view-button">보기</button>
            {errors.agreeToPrivacy && <p className="error-message">{errors.agreeToPrivacy}</p>}
          </div>

          <div className="checkbox-group sub-checkbox">
            <input
              type="checkbox"
              id="receiveMarketing"
              name="receiveMarketing"
              checked={formData.receiveMarketing}
              onChange={handleChange}
            />
            <label htmlFor="receiveMarketing">마케팅 정보 수신 동의 (선택)</label>
            <button type="button" className="view-button">보기</button>
          </div>
        </div>

        {errors.api && <p className="error-message api-error">{errors.api}</p>}
        {submissionStatus === 'success' && <p className="success-message">{submissionMessage}</p>}

        <button type="submit" className="submit-button">회원가입</button>
      </form>
    </div>
  )
}

export default SignupPage
