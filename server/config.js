// 환경 설정 파일
module.exports = {
  port: process.env.PORT || 3000,
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/demo'
  },
  nodeEnv: process.env.NODE_ENV || 'development'
};
