/**
 * API接口封装
 * 负责与后端API进行通信
 */

// API基础URL，检测当前环境，在生产环境中使用相对路径
const BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : '/api';

// 默认缓存时间
const DEFAULT_CACHE_TIME = {
  current: 30 * 60 * 1000, // 当前天气缓存30分钟
  forecast: 2 * 60 * 60 * 1000, // 天气预报缓存2小时
  hourly: 1 * 60 * 60 * 1000, // 小时预报缓存1小时
  cities: 7 * 24 * 60 * 60 * 1000, // 城市列表缓存7天
};

/**
 * 通用API请求函数
 * @param {string} url - 请求URL
 * @param {Object} options - 请求选项
 * @param {string} cacheKey - 缓存键名
 * @param {number} cacheTime - 缓存时间
 * @returns {Promise<any>} 响应数据
 */
async function apiRequest(url, options = {}, cacheKey = null, cacheTime = 0) {
  // 如果提供了缓存键，尝试从缓存获取数据
  if (cacheKey) {
    const cachedData = getFromStorage(cacheKey);
    if (cachedData) return cachedData;
  }

  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // 如果提供了缓存键和缓存时间，将数据存入缓存
    if (cacheKey && cacheTime > 0) {
      saveToStorage(cacheKey, data, cacheTime);
    }
    
    return data;
  } catch (error) {
    console.error('API请求错误:', error);
    throw error;
  }
}

/**
 * 获取当前天气数据
 * @param {string} city - 城市名称
 * @returns {Promise<Object>} 当前天气数据
 */
async function getCurrentWeather(city) {
  const cacheKey = `weather_current_${city}`;
  return apiRequest(
    `${BASE_URL}/weather?endpoint=current&city=${encodeURIComponent(city)}`, 
    {}, 
    cacheKey, 
    DEFAULT_CACHE_TIME.current
  );
}

/**
 * 获取天气预报数据
 * @param {string} city - 城市名称
 * @param {number} days - 预报天数，默认3天
 * @returns {Promise<Object>} 天气预报数据
 */
async function getWeatherForecast(city, days = 3) {
  const cacheKey = `weather_forecast_${city}_${days}`;
  return apiRequest(
    `${BASE_URL}/weather?endpoint=forecast&city=${encodeURIComponent(city)}&days=${days}`, 
    {}, 
    cacheKey, 
    DEFAULT_CACHE_TIME.forecast
  );
}

/**
 * 获取小时预报数据
 * @param {string} city - 城市名称
 * @returns {Promise<Object>} 小时预报数据
 */
async function getHourlyForecast(city) {
  const cacheKey = `weather_hourly_${city}`;
  return apiRequest(
    `${BASE_URL}/weather?endpoint=hourly&city=${encodeURIComponent(city)}`, 
    {}, 
    cacheKey, 
    DEFAULT_CACHE_TIME.hourly
  );
}

/**
 * 获取城市列表
 * @returns {Promise<Array>} 城市列表数据
 */
async function getCityList() {
  const cacheKey = 'city_list';
  return apiRequest(
    `${BASE_URL}/cities?endpoint=all`, 
    {}, 
    cacheKey, 
    DEFAULT_CACHE_TIME.cities
  );
}

/**
 * 搜索城市
 * @param {string} keyword - 搜索关键词
 * @returns {Promise<Array>} 搜索结果
 */
async function searchCity(keyword) {
  return apiRequest(
    `${BASE_URL}/cities?endpoint=search&keyword=${encodeURIComponent(keyword)}`
  );
}

/**
 * 根据地理位置获取城市
 * @param {number} lat - 纬度
 * @param {number} lon - 经度
 * @returns {Promise<Object>} 城市信息
 */
async function getCityByLocation(lat, lon) {
  return apiRequest(
    `${BASE_URL}/cities?endpoint=locate&lat=${lat}&lon=${lon}`
  );
}

/**
 * 获取热门城市
 * @returns {Promise<Array>} 热门城市列表
 */
async function getHotCities() {
  const cacheKey = 'hot_cities';
  return apiRequest(
    `${BASE_URL}/cities?endpoint=hot`, 
    {}, 
    cacheKey, 
    DEFAULT_CACHE_TIME.cities
  );
}

/**
 * 从localStorage获取数据
 * @param {string} key - 存储键名
 * @returns {any|null} 存储的数据或null
 */
function getFromStorage(key) {
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;
    
    const data = JSON.parse(item);
    const now = new Date().getTime();
    
    // 检查是否过期
    if (data.expiry && data.expiry < now) {
      localStorage.removeItem(key);
      return null;
    }
    
    return data.value;
  } catch (error) {
    console.error('从缓存获取数据失败:', error);
    return null;
  }
}

/**
 * 保存数据到localStorage
 * @param {string} key - 存储键名
 * @param {any} value - 要存储的数据
 * @param {number} ttl - 过期时间（毫秒）
 */
function saveToStorage(key, value, ttl) {
  try {
    const now = new Date().getTime();
    const item = {
      value: value,
      expiry: now + ttl
    };
    localStorage.setItem(key, JSON.stringify(item));
  } catch (error) {
    console.error('保存数据到缓存失败:', error);
  }
}

/**
 * 刷新天气数据
 * @param {string} city - 城市名称
 * @returns {Promise<Object>} 合并后的天气数据
 */
async function refreshWeatherData(city) {
  try {
    // 清除缓存
    localStorage.removeItem(`weather_current_${city}`);
    localStorage.removeItem(`weather_forecast_${city}_3`);
    localStorage.removeItem(`weather_hourly_${city}`);
    
    // 重新获取数据
    const [current, forecast, hourly] = await Promise.all([
      getCurrentWeather(city),
      getWeatherForecast(city),
      getHourlyForecast(city)
    ]);
    
    return {
      current,
      forecast,
      hourly,
      updateTime: new Date().toISOString()
    };
  } catch (error) {
    console.error('刷新天气数据失败:', error);
    throw error;
  }
} 