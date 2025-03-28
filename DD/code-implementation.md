# 轻量版天气应用代码实现方案

根据PRD文档的要求，制定以下代码实现方案，确保与产品需求完全一致。

## 前端实现方案

### 技术选择

按照PRD文档的"技术实现"部分要求，我们选择轻量级技术栈：

1. **核心框架**：
   - 原生JavaScript + 少量轻量级库
   - 不使用复杂UI框架，确保轻量化

2. **UI实现**：
   - HTML5 + CSS3
   - CSS变量管理主题
   - Flexbox和Grid实现响应式布局

3. **HTTP请求**：
   - Fetch API（原生浏览器API）
   - 可选备选：axios（轻量级HTTP客户端）

4. **构建工具**：
   - Vite（轻量快速的构建工具）
   - 配置最小化，保持简单

5. **兼容性**：
   - 支持Chrome, Firefox, Safari, Edge最新两个版本
   - 支持iOS Safari和Android Chrome最新两个版本

### 项目结构

```
src/
├── assets/             # 静态资源文件
│   └── icons/          # 天气图标
├── js/                 # JavaScript文件
│   ├── api.js          # API调用封装
│   ├── weather.js      # 天气数据处理
│   ├── location.js     # 定位相关功能
│   ├── ui.js           # UI渲染和交互
│   └── utils.js        # 工具函数
├── css/                # 样式文件
│   ├── variables.css   # CSS变量定义
│   ├── main.css        # 主样式
│   ├── mobile.css      # 移动端适配
│   └── theme.css       # 主题相关样式
├── pages/              # 页面模板
│   ├── home.html       # 主页
│   └── city.html       # 城市选择页面
├── index.html          # 入口页面
└── manifest.json       # PWA配置
```

### 功能实现

#### 1. 城市选择功能

```javascript
// location.js
// 自动定位功能
async function detectCurrentLocation() {
  if (navigator.geolocation) {
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      
      const { latitude, longitude } = position.coords;
      return await reverseGeocode(latitude, longitude);
    } catch (error) {
      console.error("定位失败", error);
      showLocationError();
      return null;
    }
  } else {
    showLocationError("您的浏览器不支持地理定位");
    return null;
  }
}

// 根据经纬度获取城市
async function reverseGeocode(lat, lon) {
  try {
    const response = await fetch(`/api/cities/locate?lat=${lat}&lon=${lon}`);
    return await response.json();
  } catch (error) {
    console.error("获取城市信息失败", error);
    return null;
  }
}

// 城市搜索
async function searchCity(keyword) {
  try {
    const response = await fetch(`/api/cities/search?keyword=${encodeURIComponent(keyword)}`);
    return await response.json();
  } catch (error) {
    console.error("搜索城市失败", error);
    return [];
  }
}
```

#### 2. 天气信息展示

```javascript
// weather.js
// 获取当前天气
async function getCurrentWeather(city) {
  try {
    const response = await fetch(`/api/weather/current?city=${encodeURIComponent(city)}`);
    const data = await response.json();
    
    // 缓存天气数据
    localStorage.setItem(`weather_${city}_${new Date().toDateString()}`, JSON.stringify(data));
    return data;
  } catch (error) {
    console.error("获取当前天气失败", error);
    
    // 尝试从缓存获取
    const cachedData = localStorage.getItem(`weather_${city}_${new Date().toDateString()}`);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    
    return null;
  }
}

// 获取天气预报
async function getWeatherForecast(city, days = 3) {
  try {
    const response = await fetch(`/api/weather/forecast?city=${encodeURIComponent(city)}&days=${days}`);
    return await response.json();
  } catch (error) {
    console.error("获取天气预报失败", error);
    return null;
  }
}

// 获取24小时预报
async function getHourlyForecast(city) {
  try {
    const response = await fetch(`/api/weather/hourly?city=${encodeURIComponent(city)}`);
    return await response.json();
  } catch (error) {
    console.error("获取小时预报失败", error);
    return null;
  }
}
```

#### 3. UI渲染

```javascript
// ui.js
// 渲染当前天气
function renderCurrentWeather(data) {
  const weatherContainer = document.getElementById('current-weather');
  if (!data) {
    weatherContainer.innerHTML = '<p class="error">无法获取天气信息</p>';
    return;
  }
  
  weatherContainer.innerHTML = `
    <div class="weather-main">
      <div class="temperature">${data.temperature}°</div>
      <div class="weather-info">
        <img src="assets/icons/${data.icon}.svg" alt="${data.text}" class="weather-icon">
        <div class="weather-text">${data.text}</div>
      </div>
    </div>
    <div class="weather-details">
      <div class="detail-item">
        <span class="detail-label">湿度</span>
        <span class="detail-value">${data.humidity}%</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">风向</span>
        <span class="detail-value">${data.windDir} ${data.windScale}级</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">气压</span>
        <span class="detail-value">${data.pressure}hPa</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">能见度</span>
        <span class="detail-value">${data.vis}km</span>
      </div>
    </div>
  `;
}

// 渲染天气预报
function renderForecast(data) {
  const forecastContainer = document.getElementById('daily-forecast');
  if (!data || !data.length) {
    forecastContainer.innerHTML = '<p class="error">无法获取天气预报</p>';
    return;
  }
  
  const forecastHtml = data.map(day => `
    <div class="forecast-day">
      <div class="forecast-date">${day.date}</div>
      <img src="assets/icons/${day.iconDay}.svg" alt="${day.textDay}" class="forecast-icon">
      <div class="forecast-temp">
        <span class="temp-high">${day.tempMax}°</span>
        <span class="temp-low">${day.tempMin}°</span>
      </div>
    </div>
  `).join('');
  
  forecastContainer.innerHTML = forecastHtml;
}

// 渲染小时预报
function renderHourlyForecast(data) {
  const hourlyContainer = document.getElementById('hourly-forecast');
  if (!data || !data.length) {
    hourlyContainer.innerHTML = '<p class="error">无法获取小时预报</p>';
    return;
  }
  
  const hourlyHtml = data.map(hour => `
    <div class="hourly-item">
      <div class="hourly-time">${hour.time}</div>
      <img src="assets/icons/${hour.icon}.svg" alt="${hour.text}" class="hourly-icon">
      <div class="hourly-temp">${hour.temp}°</div>
    </div>
  `).join('');
  
  hourlyContainer.innerHTML = hourlyHtml;
}
```

#### 4. 离线缓存支持

```javascript
// 注册Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('ServiceWorker注册成功: ', registration.scope);
      })
      .catch(error => {
        console.log('ServiceWorker注册失败: ', error);
      });
  });
}

// Service Worker脚本 (sw.js)
const CACHE_NAME = 'weather-app-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/main.css',
  '/js/main.js',
  '/assets/icons/01d.svg',
  // 其他静态资源...
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 有缓存就返回缓存
        if (response) {
          return response;
        }
        
        // 无缓存就请求网络
        return fetch(event.request).then(
          response => {
            // 检查是否有效响应
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // 克隆响应
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
              
            return response;
          }
        );
      })
  );
});
```

### 响应式设计实现

使用媒体查询实现三种设备尺寸的适配：

```css
/* variables.css */
:root {
  /* 基础颜色 */
  --color-primary: #4a6fa5;
  --color-secondary: #ff8c42;
  --color-text: #333333;
  --color-text-light: #666666;
  --color-background: #ffffff;
  --color-card: #f5f5f5;
  
  /* 字体大小 */
  --font-size-xl: 2.5rem;
  --font-size-lg: 1.5rem;
  --font-size-md: 1.1rem;
  --font-size-sm: 0.9rem;
  --font-size-xs: 0.7rem;
  
  /* 间距 */
  --spacing-xl: 2rem;
  --spacing-lg: 1.5rem;
  --spacing-md: 1rem;
  --spacing-sm: 0.5rem;
  --spacing-xs: 0.25rem;
  
  /* 圆角 */
  --border-radius: 0.5rem;
  
  /* 阴影 */
  --box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

/* 深色模式 */
@media (prefers-color-scheme: dark) {
  :root {
    --color-text: #ffffff;
    --color-text-light: #cccccc;
    --color-background: #121212;
    --color-card: #1e1e1e;
    --box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  }
}

/* main.css */
body {
  font-family: 'Helvetica Neue', Arial, sans-serif;
  margin: 0;
  padding: 0;
  background-color: var(--color-background);
  color: var(--color-text);
  line-height: 1.5;
}

/* 移动端样式 */
.container {
  padding: var(--spacing-md);
  max-width: 100%;
}

/* 平板和PC端适配 */
@media (min-width: 768px) {
  .container {
    padding: var(--spacing-lg);
    max-width: 90%;
    margin: 0 auto;
  }
  
  .forecast-container {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-md);
  }
}

@media (min-width: 1200px) {
  .container {
    max-width: 1140px;
  }
  
  .main-layout {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: var(--spacing-xl);
  }
  
  .forecast-container {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

## 后端实现方案

按照PRD要求，后端采用RESTful API设计，与前端松耦合。

### 技术选择

1. **核心框架**：Node.js + Express.js
   - 轻量级、易于维护
   - 适合作为API中间层

2. **数据源**：和风天气API
   - 免费版提供基础天气数据
   - 支持城市搜索和位置服务

3. **缓存策略**：
   - 内存缓存 + 本地文件缓存
   - 减少API调用次数，避免超出免费限额

4. **部署方案**：
   - Vercel Serverless Functions
   - 符合PRD中的"部署平台：Vercel"要求

### API设计

```javascript
// app.js - Express服务入口
const express = require('express');
const cors = require('cors');
const weatherRoutes = require('./routes/weatherRoutes');
const cityRoutes = require('./routes/cityRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// 路由
app.use('/api/weather', weatherRoutes);
app.use('/api/cities', cityRoutes);

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: '服务器内部错误'
  });
});

module.exports = app;
```

#### 1. 天气API路由

```javascript
// routes/weatherRoutes.js
const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weatherController');

// 获取当前天气
router.get('/current', weatherController.getCurrentWeather);

// 获取天气预报
router.get('/forecast', weatherController.getWeatherForecast);

// 获取小时预报
router.get('/hourly', weatherController.getHourlyForecast);

module.exports = router;
```

#### 2. 城市API路由

```javascript
// routes/cityRoutes.js
const express = require('express');
const router = express.Router();
const cityController = require('../controllers/cityController');

// 搜索城市
router.get('/search', cityController.searchCity);

// 热门城市
router.get('/hot', cityController.getHotCities);

// 根据经纬度定位城市
router.get('/locate', cityController.locateCity);

module.exports = router;
```

#### 3. 天气控制器

```javascript
// controllers/weatherController.js
const weatherService = require('../services/weatherService');
const cache = require('../utils/cache');

exports.getCurrentWeather = async (req, res) => {
  try {
    const { city, lat, lon } = req.query;
    
    // 参数验证
    if (!city && !(lat && lon)) {
      return res.status(400).json({
        status: 'error',
        message: '请提供城市名称或经纬度'
      });
    }
    
    // 从缓存获取数据
    const cacheKey = city ? `current_${city}` : `current_${lat}_${lon}`;
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      return res.json(cachedData);
    }
    
    // 调用服务获取数据
    const data = await weatherService.getCurrentWeather(city, lat, lon);
    
    // 缓存数据(30分钟)
    cache.set(cacheKey, data, 1800);
    
    res.json(data);
  } catch (error) {
    console.error('获取当前天气出错:', error);
    res.status(500).json({
      status: 'error',
      message: '获取天气数据失败'
    });
  }
};

exports.getWeatherForecast = async (req, res) => {
  try {
    const { city, lat, lon, days = 3 } = req.query;
    
    // 参数验证
    if (!city && !(lat && lon)) {
      return res.status(400).json({
        status: 'error',
        message: '请提供城市名称或经纬度'
      });
    }
    
    // 从缓存获取数据
    const cacheKey = city ? `forecast_${city}_${days}` : `forecast_${lat}_${lon}_${days}`;
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      return res.json(cachedData);
    }
    
    // 调用服务获取数据
    const data = await weatherService.getWeatherForecast(city, lat, lon, days);
    
    // 缓存数据(2小时)
    cache.set(cacheKey, data, 7200);
    
    res.json(data);
  } catch (error) {
    console.error('获取天气预报出错:', error);
    res.status(500).json({
      status: 'error',
      message: '获取天气预报失败'
    });
  }
};

exports.getHourlyForecast = async (req, res) => {
  // 类似实现...
};
```

#### 4. 天气服务

```javascript
// services/weatherService.js
const axios = require('axios');
const config = require('../config');

const apiKey = config.QWEATHER_API_KEY;
const baseUrl = 'https://devapi.qweather.com/v7';

exports.getCurrentWeather = async (city, lat, lon) => {
  try {
    let response;
    
    if (city) {
      // 先获取城市ID
      const locationRes = await axios.get(`https://geoapi.qweather.com/v2/city/lookup`, {
        params: {
          location: city,
          key: apiKey
        }
      });
      
      const locationId = locationRes.data.location[0].id;
      
      // 获取天气数据
      response = await axios.get(`${baseUrl}/weather/now`, {
        params: {
          location: locationId,
          key: apiKey
        }
      });
    } else {
      // 使用经纬度
      response = await axios.get(`${baseUrl}/weather/now`, {
        params: {
          location: `${lon},${lat}`,
          key: apiKey
        }
      });
    }
    
    // 格式化数据
    const weatherData = response.data.now;
    
    return {
      temperature: weatherData.temp,
      feelsLike: weatherData.feelsLike,
      text: weatherData.text,
      icon: weatherData.icon,
      humidity: weatherData.humidity,
      pressure: weatherData.pressure,
      windDir: weatherData.windDir,
      windScale: weatherData.windScale,
      windSpeed: weatherData.windSpeed,
      vis: weatherData.vis,
      updateTime: response.data.updateTime
    };
  } catch (error) {
    console.error('和风天气API调用失败:', error);
    throw new Error('获取天气数据失败');
  }
};

exports.getWeatherForecast = async (city, lat, lon, days) => {
  // 类似实现...
};

exports.getHourlyForecast = async (city, lat, lon) => {
  // 类似实现...
};
```

### 缓存工具

```javascript
// utils/cache.js
const NodeCache = require('node-cache');
const cache = new NodeCache();

module.exports = {
  get: (key) => {
    return cache.get(key);
  },
  
  set: (key, value, ttl) => {
    cache.set(key, value, ttl);
  },
  
  del: (key) => {
    cache.del(key);
  },
  
  flush: () => {
    cache.flushAll();
  }
};
```

### Vercel部署配置

```javascript
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "api/**/*.js",
      "use": "@vercel/node"
    },
    {
      "src": "public/**/*",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1.js"
    },
    {
      "src": "/(.*)",
      "dest": "/public/$1"
    }
  ],
  "env": {
    "QWEATHER_API_KEY": "@qweather_api_key"
  }
}
```

## 开发计划

按照PRD中的项目规划，开发将分为以下阶段：

### 1. 需求分析与设计（1周）
- ✅ 完成需求文档
- ✅ 设计UI/UX原型

### 2. MVP开发（2周）
- **前端基础界面实现**
  - 实现移动端基础UI
  - 实现定位和城市选择功能
  - 实现天气数据展示
  
- **后端API集成**
  - 实现和风天气API封装
  - 实现缓存策略
  - 部署到Vercel

- **基本功能测试**
  - 功能测试
  - 性能测试
  - 跨设备兼容性测试

### 3. 迭代优化（1周）
- 功能完善
- 性能优化
- 用户体验优化

## 需要的支持

1. **和风天气API密钥**
   - 需要提供有效的API密钥用于开发和测试

2. **Vercel账号**
   - 用于部署应用
   - 需要配置环境变量

3. **测试设备**
   - 不同尺寸的移动设备进行测试
   - 不同浏览器环境测试

## 下一步计划

待您确认后，我们将：

1. 设置前端项目基础结构
2. 实现基本UI组件
3. 设置后端API端点
4. 集成和风天气API
5. 部署测试版应用到Vercel 