import { useState, useEffect, useCallback, memo } from 'react'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import HeroSection from '../components/HeroSection'
import ProductsPreview from '../components/ProductsPreview'
import ServerStatus from '../components/ServerStatus'

// API 기본 URL 설정
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002').replace(/\/api$/, '')
console.log('🔍 API_BASE_URL:', API_BASE_URL) // 디버깅용

const HomePage = memo(() => {
  const { token, user, fetchUserInfo } = useAuth()
  const [serverStatus, setServerStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [userLoading, setUserLoading] = useState(false)
  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [productsError, setProductsError] = useState('')

  const checkServerStatus = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/health')
      const data = await response.json()
      setServerStatus(data)
    } catch (error) {
      setServerStatus({
        status: 'error',
        message: '서버 연결 실패',
        error: error.message
      })
    } finally {
      setLoading(false)
    }
  }, [])

  // 상품 데이터 가져오기 (공개 API)
  const fetchProducts = useCallback(async () => {
    setProductsLoading(true)
    setProductsError('')
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/products?limit=20`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || '상품 데이터를 불러오는데 실패했습니다')
      }

      setProducts(result.data || [])
    } catch (error) {
      console.error('상품 데이터 로드 실패:', error)
      setProductsError(error.message)
    } finally {
      setProductsLoading(false)
    }
  }, [])

  // 유저 정보 가져오기
  const loadUserInfo = useCallback(async () => {
    if (token && !user) {
      setUserLoading(true)
      try {
        await fetchUserInfo()
      } catch (error) {
        console.error('유저 정보 로드 실패:', error)
      } finally {
        setUserLoading(false)
      }
    }
  }, [token, user, fetchUserInfo])

  // 디버깅: user 상태 변경 추적
  useEffect(() => {
    console.log('User state changed:', { 
      user, 
      token: token ? 'EXISTS' : 'NULL', 
      userLoading,
      userKeys: user ? Object.keys(user) : 'NO_USER',
      userName: user?.name || 'NO_NAME'
    })
  }, [user, token, userLoading])

  useEffect(() => {
    checkServerStatus()
    loadUserInfo()
    fetchProducts() // 토큰과 관계없이 상품 데이터 가져오기
  }, [token, checkServerStatus, loadUserInfo, fetchProducts])

  return (
    <div className="cider-app">
      <Navbar />
      
      <main className="cider-main">
        <HeroSection />
        <ProductsPreview 
          products={products}
          loading={productsLoading}
          error={productsError}
          onRetry={fetchProducts}
        />
        <ServerStatus 
          serverStatus={serverStatus}
          loading={loading}
          onCheckStatus={checkServerStatus}
        />
      </main>
    </div>
  )
})

HomePage.displayName = 'HomePage'

export default HomePage
