/**
 * API服务入口文件
 */

// 这个文件对Vercel Serverless Functions不是必需的，但对本地开发很有用

const express = require('express');
const cors = require('cors');
const weatherRoutes = require('./routes/weatherRoutes');
const cityRoutes = require('./routes/cityRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 路由
app.use('/api/weather', weatherRoutes);
app.use('/api/cities', cityRoutes);

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err.stack);
  res.status(500).json({
    status: 'error',
    message: '服务器内部错误'
  });
});

// 只在直接运行时启动服务器
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`API服务器运行在 http://localhost:${PORT}`);
  });
}

module.exports = app; 