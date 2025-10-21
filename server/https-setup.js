const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');

// HTTPS 서버 설정 예시
const app = express();

// SSL 인증서 파일 경로 (실제 인증서가 필요)
const options = {
  key: fs.readFileSync('path/to/private-key.pem'),
  cert: fs.readFileSync('path/to/certificate.pem')
};

// HTTPS 서버 시작
const PORT = process.env.HTTPS_PORT || 3443;
https.createServer(options, app).listen(PORT, () => {
  console.log(`HTTPS 서버가 포트 ${PORT}에서 실행 중입니다`);
  console.log(`https://localhost:${PORT} 에서 확인하세요`);
});

module.exports = app;
