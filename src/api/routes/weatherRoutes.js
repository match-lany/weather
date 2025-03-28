/**
 * 天气相关API路由
 */

const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');

const router = express.Router();
const cache = new NodeCache({ stdTTL: 1800, checkperiod: 120 }); // 默认缓存30分钟

// 和风天气API配置
const WEATHER_API_KEY = process.env.WEATHER_API_KEY || '2699c0e0c6b94d188b1c207f46547b5a';
const WEATHER_API_BASE = 'https://devapi.qweather.com/v7';

/**
 * 获取当前天气
 * GET /api/weather/current?city=cityname
 */
router.get('/current', async (req, res) => {
  try {
    const { city } = req.query;
    
    if (!city) {
      return res.status(400).json({
        status: 'error',
        message: '缺少城市参数'
      });
    }
    
    // 尝试从缓存中获取
    const cacheKey = `current_${city}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }
    
    // 获取城市ID
    const locationData = await getCityId(city);
    if (!locationData) {
      return res.status(404).json({
        status: 'error',
        message: '城市不存在'
      });
    }
    
    // 请求和风天气API
    const response = await axios.get(`${WEATHER_API_BASE}/weather/now`, {
      params: {
        location: locationData.id,
        key: WEATHER_API_KEY
      }
    });
    
    if (response.data.code !== '200') {
      throw new Error(`天气API错误: ${response.data.code}`);
    }
    
    // 处理响应数据
    const weatherData = {
      temperature: response.data.now.temp,
      feelsLike: response.data.now.feelsLike,
      text: response.data.now.text,
      icon: response.data.now.icon,
      windDir: response.data.now.windDir,
      windScale: response.data.now.windScale,
      windSpeed: response.data.now.windSpeed,
      humidity: response.data.now.humidity,
      precip: response.data.now.precip,
      pressure: response.data.now.pressure,
      vis: response.data.now.vis,
      updateTime: response.data.updateTime
    };
    
    // 存入缓存
    cache.set(cacheKey, weatherData, 1800); // 缓存30分钟
    
    res.json(weatherData);
  } catch (error) {
    console.error('获取当前天气失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取天气数据失败'
    });
  }
});

/**
 * 获取天气预报
 * GET /api/weather/forecast?city=cityname&days=3
 */
router.get('/forecast', async (req, res) => {
  try {
    const { city, days = 3 } = req.query;
    
    if (!city) {
      return res.status(400).json({
        status: 'error',
        message: '缺少城市参数'
      });
    }
    
    // 尝试从缓存中获取
    const cacheKey = `forecast_${city}_${days}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }
    
    // 获取城市ID
    const locationData = await getCityId(city);
    if (!locationData) {
      return res.status(404).json({
        status: 'error',
        message: '城市不存在'
      });
    }
    
    // 请求和风天气API
    const response = await axios.get(`${WEATHER_API_BASE}/weather/${days}d`, {
      params: {
        location: locationData.id,
        key: WEATHER_API_KEY
      }
    });
    
    if (response.data.code !== '200') {
      throw new Error(`天气API错误: ${response.data.code}`);
    }
    
    // 处理响应数据
    const forecastData = {
      daily: response.data.daily,
      updateTime: response.data.updateTime
    };
    
    // 存入缓存
    cache.set(cacheKey, forecastData, 7200); // 缓存2小时
    
    res.json(forecastData);
  } catch (error) {
    console.error('获取天气预报失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取天气预报失败'
    });
  }
});

/**
 * 获取逐小时预报
 * GET /api/weather/hourly?city=cityname
 */
router.get('/hourly', async (req, res) => {
  try {
    const { city } = req.query;
    
    if (!city) {
      return res.status(400).json({
        status: 'error',
        message: '缺少城市参数'
      });
    }
    
    // 尝试从缓存中获取
    const cacheKey = `hourly_${city}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }
    
    // 获取城市ID
    const locationData = await getCityId(city);
    if (!locationData) {
      return res.status(404).json({
        status: 'error',
        message: '城市不存在'
      });
    }
    
    // 请求和风天气API
    const response = await axios.get(`${WEATHER_API_BASE}/weather/24h`, {
      params: {
        location: locationData.id,
        key: WEATHER_API_KEY
      }
    });
    
    if (response.data.code !== '200') {
      throw new Error(`天气API错误: ${response.data.code}`);
    }
    
    // 处理响应数据
    const hourlyData = {
      hourly: response.data.hourly,
      updateTime: response.data.updateTime
    };
    
    // 存入缓存
    cache.set(cacheKey, hourlyData, 3600); // 缓存1小时
    
    res.json(hourlyData);
  } catch (error) {
    console.error('获取小时预报失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取小时预报失败'
    });
  }
});

/**
 * 通过城市名称获取城市ID
 * @param {string} cityName - 城市名称
 * @returns {Promise<Object|null>} 城市信息
 */
async function getCityId(cityName) {
  try {
    // 先从缓存中查找
    const cacheKey = `city_id_${cityName}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    
    // 请求和风天气API
    const response = await axios.get('https://geoapi.qweather.com/v2/city/lookup', {
      params: {
        location: cityName,
        key: WEATHER_API_KEY
      }
    });
    
    if (response.data.code !== '200' || !response.data.location || response.data.location.length === 0) {
      return null;
    }
    
    const cityData = {
      id: response.data.location[0].id,
      name: response.data.location[0].name,
      lat: response.data.location[0].lat,
      lon: response.data.location[0].lon
    };
    
    // 存入缓存（7天）
    cache.set(cacheKey, cityData, 7 * 24 * 60 * 60);
    
    return cityData;
  } catch (error) {
    console.error('获取城市ID失败:', error);
    return null;
  }
}

module.exports = router; 