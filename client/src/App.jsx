import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import HomePage from './pages/HomePage'
import SignupPage from './pages/SignupPage'
import LoginPage from './pages/LoginPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminOrdersPage from './pages/admin/AdminOrdersPage'
import ProductManagement from './pages/admin/ProductManagement'
import ProductRegistration from './pages/admin/ProductRegistration'
import ProductDetail from './pages/ProductDetail'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import OrderSuccessPage from './pages/OrderSuccessPage'
import OrderFailurePage from './pages/OrderFailurePage'
import OrdersPage from './pages/OrdersPage'
import OrderDetailPage from './pages/OrderDetailPage'
import './App.css'

function App() {
  console.log('App 컴포넌트 실행됨!')
  return (
    <AuthProvider>
      <div>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/orders" element={<AdminOrdersPage />} />
          <Route path="/admin/orders/:orderId" element={<OrderDetailPage />} />
          <Route path="/admin/products" element={<ProductManagement />} />
          <Route path="/admin/products/new" element={<ProductRegistration />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-success" element={<OrderSuccessPage />} />
          <Route path="/order-failure" element={<OrderFailurePage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:orderId" element={<OrderDetailPage />} />
        </Routes>
      </div>
    </AuthProvider>
  )
}

export default App
