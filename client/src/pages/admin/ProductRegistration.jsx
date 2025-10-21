import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './styles/ProductRegistration.css';

// API 기본 URL 설정
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';

const ProductRegistration = () => {
  const navigate = useNavigate();
  const { token, logout, isAuthenticated } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    originalPrice: '',
    category: '',
    sku: '',
    description: '',
    image: null,
    imageUrl: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cloudinaryWidget, setCloudinaryWidget] = useState(null);
  const [submitMessage, setSubmitMessage] = useState('');

  const categories = ['상의', '하의', '액세서리'];

  // 인증 상태 확인
  useEffect(() => {
    if (!isAuthenticated) {
      setSubmitMessage('로그인이 필요합니다. 로그인 페이지로 이동합니다.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    }
  }, [isAuthenticated, navigate]);

  // Cloudinary 환경변수 검증
  const validateCloudinaryConfig = () => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    
    if (!cloudName || !uploadPreset) {
      console.error('❌ Cloudinary 설정이 누락되었습니다.');
      console.error('필요한 환경변수:');
      console.error('- VITE_CLOUDINARY_CLOUD_NAME');
      console.error('- VITE_CLOUDINARY_UPLOAD_PRESET');
      console.error('client/.env 파일을 생성하고 환경변수를 설정해주세요.');
      return false;
    }
    
    console.log('✅ Cloudinary 설정 확인됨:', { cloudName, uploadPreset });
    return true;
  };

  // Cloudinary 위젯 초기화
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://upload-widget.cloudinary.com/global/all.js';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.cloudinary) {
        // 환경변수 검증
        if (!validateCloudinaryConfig()) {
          return;
        }

        // 환경변수에서 설정값 가져오기
        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
        const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY;

        const widget = window.cloudinary.createUploadWidget(
          {
            cloudName: cloudName,
            uploadPreset: uploadPreset,
            apiKey: apiKey, // 선택사항
            sources: ['local', 'url', 'camera'],
            multiple: false,
            cropping: true,
            croppingAspectRatio: 1,
            croppingShowDimensions: true,
            showAdvancedOptions: false,
            showSkipCropButton: false,
            showPoweredBy: false,
            folder: 'products',
            maxFileSize: 10000000, // 10MB
            clientAllowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
            theme: 'minimal'
          },
          (error, result) => {
            if (error) {
              console.error('Cloudinary 업로드 오류:', error);
              alert('이미지 업로드에 실패했습니다. 다시 시도해주세요.');
              return;
            }
            
            if (result && result.event === 'success') {
              console.log('이미지 업로드 성공:', result.info);
              setFormData(prev => ({
                ...prev,
                imageUrl: result.info.secure_url,
                image: result.info.secure_url
              }));
            }
          }
        );
        setCloudinaryWidget(widget);
      }
    };

    return () => {
      if (cloudinaryWidget) {
        cloudinaryWidget.destroy();
      }
    };
  }, []);

  // Cloudinary 위젯 열기
  const openCloudinaryWidget = () => {
    if (cloudinaryWidget) {
      cloudinaryWidget.open();
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 에러 메시지 제거
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // 이미지 제거
  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      image: null,
      imageUrl: ''
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = '상품명을 입력해주세요';
    }

    if (!formData.price || formData.price <= 0) {
      newErrors.price = '판매가격을 입력해주세요';
    }

    if (!formData.category) {
      newErrors.category = '카테고리를 선택해주세요';
    }

    if (!formData.sku.trim()) {
      newErrors.sku = 'SKU를 입력해주세요';
    } else if (!/^[A-Z0-9-]+$/.test(formData.sku)) {
      newErrors.sku = 'SKU는 영문 대문자, 숫자, 하이픈만 사용 가능합니다';
    }

    if (!formData.image) {
      newErrors.image = '메인 이미지를 선택해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // API 호출을 위한 데이터 준비
      const submitData = {
        name: formData.name,
        price: parseFloat(formData.price),
        category: formData.category,
        sku: formData.sku.toUpperCase(),
        description: formData.description,
        image: formData.imageUrl
      };

      if (formData.originalPrice && parseFloat(formData.originalPrice) > 0) {
        submitData.originalPrice = parseFloat(formData.originalPrice);
      }

      // API 호출
      const response = await fetch(`${API_BASE_URL}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(submitData)
      });

      const result = await response.json();

      if (!response.ok) {
        // 토큰 만료 처리
        if (response.status === 401 && result.message === '토큰이 만료되었습니다') {
          setSubmitMessage('세션이 만료되었습니다. 다시 로그인해주세요.');
          logout();
          setTimeout(() => {
            navigate('/login');
          }, 2000);
          return;
        }
        
        // 서버에서 반환된 에러 메시지 처리
        if (result.errors && Array.isArray(result.errors)) {
          const fieldErrors = {};
          result.errors.forEach(err => {
            if (err.path) {
              fieldErrors[err.path] = err.msg;
            }
          });
          setErrors(fieldErrors);
          throw new Error('입력 데이터를 확인해주세요');
        }
        throw new Error(result.message || '상품 등록에 실패했습니다');
      }

      // 성공 처리
      setSubmitMessage('상품이 성공적으로 등록되었습니다!');
      console.log('상품 등록 성공:', result.data);
      
      // 폼 초기화
      setFormData({
        name: '',
        price: '',
        originalPrice: '',
        category: '',
        sku: '',
        description: '',
        image: null,
        imageUrl: ''
      });
      
      // 성공 메시지 3초 후 제거
      setTimeout(() => {
        setSubmitMessage('');
      }, 3000);
      
    } catch (error) {
      console.error('상품 등록 오류:', error);
      setSubmitMessage(`상품 등록에 실패했습니다: ${error.message}`);
      
      // 에러 메시지 5초 후 제거
      setTimeout(() => {
        setSubmitMessage('');
      }, 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 인증되지 않은 사용자는 로딩 표시
  if (!isAuthenticated) {
    return (
      <div className="product-registration">
        <div className="form-container">
          <div className="submit-message error">
            {submitMessage || '로그인이 필요합니다...'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="product-registration">
      {/* 상단 헤더 */}
      <header className="admin-header">
        <div className="header-left">
          <Link to="/admin" className="back-btn">← 상품 관리</Link>
          <h1>상품 관리</h1>
        </div>
        <div className="header-right">
          <Link to="/" className="back-to-shop">쇼핑몰로 돌아가기</Link>
        </div>
      </header>

      {/* 탭 네비게이션 */}
      <div className="tab-navigation">
        <Link to="/admin/products" className="tab-item inactive">
          상품 목록
        </Link>
        <div className="tab-item active">
          상품 등록
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <main className="product-main">
        <div className="form-container">
          <h2 className="form-title">새 상품 등록</h2>
          
          {/* 성공/에러 메시지 */}
          {submitMessage && (
            <div className={`submit-message ${submitMessage.includes('성공') ? 'success' : 'error'}`}>
              {submitMessage}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="product-form">
            <div className="form-columns">
              {/* 왼쪽 컬럼 */}
              <div className="form-column left">
                {/* 상품명 */}
                <div className="form-group">
                  <label htmlFor="name" className="form-label">상품명</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="상품명을 입력하세요"
                    className={`form-input ${errors.name ? 'error' : ''}`}
                  />
                  {errors.name && <span className="error-message">{errors.name}</span>}
                </div>

                {/* 판매가격 & 정가 */}
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="price" className="form-label">판매가격</label>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="0"
                      className={`form-input ${errors.price ? 'error' : ''}`}
                    />
                    {errors.price && <span className="error-message">{errors.price}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="originalPrice" className="form-label">정가(선택)</label>
                    <input
                      type="number"
                      id="originalPrice"
                      name="originalPrice"
                      value={formData.originalPrice}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="form-input"
                    />
                  </div>
                </div>

                {/* 카테고리 */}
                <div className="form-group">
                  <label htmlFor="category" className="form-label">카테고리</label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className={`form-select ${errors.category ? 'error' : ''}`}
                  >
                    <option value="">카테고리 선택</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  {errors.category && <span className="error-message">{errors.category}</span>}
                </div>

                {/* SKU 등록 */}
                <div className="form-group">
                  <label htmlFor="sku" className="form-label">SKU 등록</label>
                  <input
                    type="text"
                    id="sku"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    placeholder="예: PROD-001"
                    className={`form-input ${errors.sku ? 'error' : ''}`}
                  />
                  {errors.sku && <span className="error-message">{errors.sku}</span>}
                </div>
              </div>

              {/* 오른쪽 컬럼 */}
              <div className="form-column right">
                {/* 상품 설명 */}
                <div className="form-group">
                  <label htmlFor="description" className="form-label">상품 설명</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="상품에 대한 자세한 설명을 입력하세요"
                    className="form-textarea"
                    rows="6"
                  />
                </div>

                {/* 메인 이미지 */}
                <div className="form-group">
                  <label className="form-label">메인 이미지</label>
                  
                  {/* 이미지 미리보기 */}
                  {formData.imageUrl && (
                    <div className="image-preview">
                      <img 
                        src={formData.imageUrl} 
                        alt="상품 미리보기" 
                        className="preview-image"
                      />
                      <button 
                        type="button" 
                        className="remove-image-btn"
                        onClick={removeImage}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                  
                  {/* Cloudinary 업로드 버튼 */}
                  <div className="cloudinary-upload">
                    <button 
                      type="button" 
                      className="cloudinary-button"
                      onClick={openCloudinaryWidget}
                    >
                      {formData.imageUrl ? '이미지 변경' : '이미지 업로드'}
                    </button>
                    <span className="upload-status">
                      {formData.imageUrl ? '이미지가 업로드되었습니다' : '이미지를 선택해주세요'}
                    </span>
                  </div>
                  
                  {errors.image && <span className="error-message">{errors.image}</span>}
                </div>
              </div>
            </div>

            {/* 제출 버튼 */}
            <div className="form-actions">
              <button
                type="submit"
                className="submit-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? '등록 중...' : '새 상품 등록'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default ProductRegistration;
