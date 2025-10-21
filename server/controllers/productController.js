const Product = require('../models/Product');
const mongoose = require('mongoose');

// 상품 생성
const createProduct = async (req, res) => {
  try {
    const {
      name,
      price,
      originalPrice,
      category,
      image,
      description,
      sku,
      stock = 0,
      tags = [],
      discount,
      metadata = {}
    } = req.body;

    // 필수 필드 검증
    if (!name || !price || !category || !image || !sku) {
      return res.status(400).json({
        success: false,
        message: '필수 필드가 누락되었습니다',
        required: ['name', 'price', 'category', 'image', 'sku']
      });
    }

    // SKU 중복 확인
    const isSkuUnique = await Product.isSkuUnique(sku);
    if (!isSkuUnique) {
      return res.status(400).json({
        success: false,
        message: '이미 존재하는 SKU입니다',
        sku: sku
      });
    }

    // 상품 생성
    const product = new Product({
      name,
      price,
      originalPrice: originalPrice || undefined, // 0이면 undefined로 처리
      category,
      image,
      description,
      sku: sku.toUpperCase(),
      stock: stock || 100, // 재고가 없으면 기본값 100으로 설정
      tags,
      discount,
      metadata,
      createdBy: req.user.userId
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: '상품이 성공적으로 등록되었습니다',
      data: product
    });

  } catch (error) {
    console.error('상품 생성 오류:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'SKU가 이미 존재합니다',
        field: 'sku'
      });
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: '입력 데이터가 유효하지 않습니다',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다',
      error: error.message
    });
  }
};

// 상품 목록 조회
const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 2, // 기본값을 2개로 변경
      category,
      status = '판매중',
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // 쿼리 빌더
    let query = {};
    
    if (category) {
      query.category = category;
    }
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // 정렬 설정
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // 페이지네이션
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(query)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('상품 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '상품 목록을 불러오는데 실패했습니다',
      error: error.message
    });
  }
};

// 상품 상세 조회
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 상품 ID입니다'
      });
    }

    const product = await Product.findById(id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다'
      });
    }

    res.json({
      success: true,
      data: product
    });

  } catch (error) {
    console.error('상품 상세 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '상품 정보를 불러오는데 실패했습니다',
      error: error.message
    });
  }
};

// 상품 수정
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 상품 ID입니다'
      });
    }

    // SKU 변경 시 중복 확인
    if (updateData.sku) {
      const isSkuUnique = await Product.isSkuUnique(updateData.sku, id);
      if (!isSkuUnique) {
        return res.status(400).json({
          success: false,
          message: '이미 존재하는 SKU입니다',
          sku: updateData.sku
        });
      }
      updateData.sku = updateData.sku.toUpperCase();
    }

    updateData.updatedBy = req.user.userId;

    const product = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email')
     .populate('updatedBy', 'name email');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다'
      });
    }

    res.json({
      success: true,
      message: '상품이 성공적으로 수정되었습니다',
      data: product
    });

  } catch (error) {
    console.error('상품 수정 오류:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'SKU가 이미 존재합니다',
        field: 'sku'
      });
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: '입력 데이터가 유효하지 않습니다',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: '상품 수정에 실패했습니다',
      error: error.message
    });
  }
};

// 상품 삭제
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 상품 ID입니다'
      });
    }

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다'
      });
    }

    res.json({
      success: true,
      message: '상품이 성공적으로 삭제되었습니다',
      data: { id: product._id, name: product.name }
    });

  } catch (error) {
    console.error('상품 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '상품 삭제에 실패했습니다',
      error: error.message
    });
  }
};

// 재고 업데이트
const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, operation = 'add' } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 상품 ID입니다'
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다'
      });
    }

    const newStock = operation === 'add' 
      ? product.stock + quantity 
      : product.stock - quantity;

    if (newStock < 0) {
      return res.status(400).json({
        success: false,
        message: '재고가 부족합니다',
        currentStock: product.stock,
        requestedQuantity: quantity
      });
    }

    product.stock = newStock;
    product.updatedBy = req.user.userId;
    await product.save();

    res.json({
      success: true,
      message: '재고가 성공적으로 업데이트되었습니다',
      data: {
        productId: product._id,
        productName: product.name,
        previousStock: product.stock - (operation === 'add' ? -quantity : quantity),
        currentStock: product.stock,
        operation,
        quantity
      }
    });

  } catch (error) {
    console.error('재고 업데이트 오류:', error);
    res.status(500).json({
      success: false,
      message: '재고 업데이트에 실패했습니다',
      error: error.message
    });
  }
};

// 카테고리별 상품 조회
const getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 10 } = req.query;

    const products = await Product.findByCategory(category, parseInt(limit));

    res.json({
      success: true,
      data: products,
      category,
      count: products.length
    });

  } catch (error) {
    console.error('카테고리별 상품 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '카테고리별 상품 조회에 실패했습니다',
      error: error.message
    });
  }
};

// SKU 중복 확인
const checkSkuUnique = async (req, res) => {
  try {
    const { sku } = req.params;
    const { excludeId } = req.query;

    const isUnique = await Product.isSkuUnique(sku, excludeId);

    res.json({
      success: true,
      data: {
        sku,
        isUnique
      }
    });

  } catch (error) {
    console.error('SKU 중복 확인 오류:', error);
    res.status(500).json({
      success: false,
      message: 'SKU 중복 확인에 실패했습니다',
      error: error.message
    });
  }
};

// 고급 검색
const searchProducts = async (req, res) => {
  try {
    const {
      q,
      category,
      minPrice,
      maxPrice,
      inStock,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    let query = {};

    // 텍스트 검색
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ];
    }

    // 카테고리 필터
    if (category) {
      query.category = category;
    }

    // 가격 범위 필터
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // 재고 필터
    if (inStock === 'true') {
      query.stock = { $gt: 0 };
    } else if (inStock === 'false') {
      query.stock = 0;
    }

    // 정렬
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // 페이지네이션
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(query)
      .populate('createdBy', 'name email')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      },
      searchQuery: {
        q, category, minPrice, maxPrice, inStock
      }
    });

  } catch (error) {
    console.error('상품 검색 오류:', error);
    res.status(500).json({
      success: false,
      message: '상품 검색에 실패했습니다',
      error: error.message
    });
  }
};

// 추천 상품 조회
const getFeaturedProducts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const products = await Product.find({
      status: '판매중',
      stock: { $gt: 0 }
    })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .populate('createdBy', 'name email');

    res.json({
      success: true,
      data: products,
      count: products.length
    });

  } catch (error) {
    console.error('추천 상품 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '추천 상품 조회에 실패했습니다',
      error: error.message
    });
  }
};

// 품절 상품 조회
const getOutOfStockProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find({
      stock: 0,
      status: { $in: ['판매중', '품절'] }
    })
    .populate('createdBy', 'name email')
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const total = await Product.countDocuments({
      stock: 0,
      status: { $in: ['판매중', '품절'] }
    });

    res.json({
      success: true,
      data: products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('품절 상품 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '품절 상품 조회에 실패했습니다',
      error: error.message
    });
  }
};

// 상품 상태 변경
const updateProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 상품 ID입니다'
      });
    }

    const validStatuses = ['판매중', '품절', '단종', '숨김'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 상품 상태입니다',
        validStatuses
      });
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { 
        status,
        updatedBy: req.user.userId
      },
      { new: true }
    ).populate('createdBy', 'name email')
     .populate('updatedBy', 'name email');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다'
      });
    }

    res.json({
      success: true,
      message: '상품 상태가 성공적으로 변경되었습니다',
      data: product
    });

  } catch (error) {
    console.error('상품 상태 변경 오류:', error);
    res.status(500).json({
      success: false,
      message: '상품 상태 변경에 실패했습니다',
      error: error.message
    });
  }
};

// 할인 정보 업데이트
const updateDiscount = async (req, res) => {
  try {
    const { id } = req.params;
    const { discount } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 상품 ID입니다'
      });
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { 
        discount,
        updatedBy: req.user.userId
      },
      { new: true }
    ).populate('createdBy', 'name email')
     .populate('updatedBy', 'name email');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다'
      });
    }

    res.json({
      success: true,
      message: '할인 정보가 성공적으로 업데이트되었습니다',
      data: product
    });

  } catch (error) {
    console.error('할인 정보 업데이트 오류:', error);
    res.status(500).json({
      success: false,
      message: '할인 정보 업데이트에 실패했습니다',
      error: error.message
    });
  }
};

// 태그 업데이트
const updateTags = async (req, res) => {
  try {
    const { id } = req.params;
    const { tags } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 상품 ID입니다'
      });
    }

    if (!Array.isArray(tags)) {
      return res.status(400).json({
        success: false,
        message: '태그는 배열 형태여야 합니다'
      });
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { 
        tags,
        updatedBy: req.user.userId
      },
      { new: true }
    ).populate('createdBy', 'name email')
     .populate('updatedBy', 'name email');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다'
      });
    }

    res.json({
      success: true,
      message: '태그가 성공적으로 업데이트되었습니다',
      data: product
    });

  } catch (error) {
    console.error('태그 업데이트 오류:', error);
    res.status(500).json({
      success: false,
      message: '태그 업데이트에 실패했습니다',
      error: error.message
    });
  }
};

// 일괄 삭제
const bulkDeleteProducts = async (req, res) => {
  try {
    const { productIds } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '삭제할 상품 ID 배열이 필요합니다'
      });
    }

    // 유효한 ObjectId 검증
    const validIds = productIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length !== productIds.length) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 상품 ID가 포함되어 있습니다'
      });
    }

    const result = await Product.deleteMany({
      _id: { $in: validIds }
    });

    res.json({
      success: true,
      message: `${result.deletedCount}개의 상품이 성공적으로 삭제되었습니다`,
      data: {
        deletedCount: result.deletedCount,
        requestedCount: productIds.length
      }
    });

  } catch (error) {
    console.error('일괄 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '일괄 삭제에 실패했습니다',
      error: error.message
    });
  }
};

// 상품 통계
const getProductStats = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ status: '판매중' });
    const outOfStockProducts = await Product.countDocuments({ stock: 0 });
    const categories = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const priceStats = await Product.aggregate([
      { $group: {
        _id: null,
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }}
    ]);

    res.json({
      success: true,
      data: {
        totalProducts,
        activeProducts,
        outOfStockProducts,
        categories,
        priceStats: priceStats[0] || { avgPrice: 0, minPrice: 0, maxPrice: 0 }
      }
    });

  } catch (error) {
    console.error('상품 통계 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '상품 통계 조회에 실패했습니다',
      error: error.message
    });
  }
};

// 상품 내보내기
const exportProducts = async (req, res) => {
  try {
    const { format = 'json', category, status } = req.query;

    let query = {};
    if (category) query.category = category;
    if (status) query.status = status;

    const products = await Product.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    if (format === 'csv') {
      // CSV 형식으로 변환 (간단한 구현)
      const csvData = products.map(product => ({
        name: product.name,
        price: product.price,
        category: product.category,
        sku: product.sku,
        stock: product.stock,
        status: product.status,
        createdAt: product.createdAt
      }));

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=products.csv');
      res.json(csvData);
    } else {
      res.json({
        success: true,
        data: products,
        count: products.length,
        exportedAt: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('상품 내보내기 오류:', error);
    res.status(500).json({
      success: false,
      message: '상품 내보내기에 실패했습니다',
      error: error.message
    });
  }
};

// 상품 가져오기
const importProducts = async (req, res) => {
  try {
    const { products } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: '가져올 상품 데이터가 필요합니다'
      });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    for (const productData of products) {
      try {
        // SKU 중복 확인
        const isSkuUnique = await Product.isSkuUnique(productData.sku);
        if (!isSkuUnique) {
          results.failed++;
          results.errors.push({
            sku: productData.sku,
            error: 'SKU가 이미 존재합니다'
          });
          continue;
        }

        const product = new Product({
          ...productData,
          createdBy: req.user.userId
        });

        await product.save();
        results.success++;

      } catch (error) {
        results.failed++;
        results.errors.push({
          sku: productData.sku,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: '상품 가져오기가 완료되었습니다',
      data: results
    });

  } catch (error) {
    console.error('상품 가져오기 오류:', error);
    res.status(500).json({
      success: false,
      message: '상품 가져오기에 실패했습니다',
      error: error.message
    });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  updateStock,
  getProductsByCategory,
  checkSkuUnique,
  searchProducts,
  getFeaturedProducts,
  getOutOfStockProducts,
  updateProductStatus,
  updateDiscount,
  updateTags,
  bulkDeleteProducts,
  getProductStats,
  exportProducts,
  importProducts
};
