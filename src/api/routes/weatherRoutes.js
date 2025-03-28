/**
 * 天气相关API路由
 */

const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');

// 支持Vercel Serverless Functions和Express双重环境
let router;
if (typeof express === 'function') {
  router = express.Router();
} else {
  router = { get: (path, handler) => { router[`GET_${path}`] = handler; } };
}

const cache = new NodeCache({ stdTTL: 1800, checkperiod: 120 }); // 默认缓存30分钟

// 和风天气API配置
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
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
    
    // 设置缓存头
    if (process.env.VERCEL) {
      res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate');
    }
    
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
 * 获取城市ID工具函数
 * @param {string} cityName - 城市名称 
 * @returns {Promise<Object|null>} 城市信息
 */
async function getCityId(cityName) {
  try {
    const response = await axios.get('https://geoapi.qweather.com/v2/city/lookup', {
      params: {
        location: cityName,
        key: WEATHER_API_KEY
      }
    });
    
    if (response.data.code !== '200' || !response.data.location || response.data.location.length === 0) {
      return null;
    }
    
    return {
      id: response.data.location[0].id,
      name: response.data.location[0].name
    };
  } catch (error) {
    console.error('获取城市ID失败:', error);
    return null;
  }
}

// Vercel Serverless Function 处理
if (process.env.VERCEL) {
  module.exports = async (req, res) => {
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // 打印请求信息以便调试
    console.log(`处理请求: ${req.url}`);
    console.log(`查询参数:`, req.query);

    // 解析endpoint和其他参数
    const endpoint = req.query.endpoint || 'current';
    const city = req.query.city;
    const days = req.query.days || 3;

    // 根据endpoint调用对应的路由处理函数
    try {
      if (endpoint === 'current') {
        if (!router["GET_/current"]) {
          return res.status(404).json({ error: 'API路由不存在' });
        }
        return router["GET_/current"](req, res);
      } else if (endpoint === 'forecast') {
        if (!router["GET_/forecast"]) {
          return res.status(404).json({ error: 'API路由不存在' });
        }
        return router["GET_/forecast"](req, res);
      } else if (endpoint === 'hourly') {
        if (!router["GET_/hourly"]) {
          return res.status(404).json({ error: 'API路由不存在' });
        }
        return router["GET_/hourly"](req, res);
      } else {
        return res.status(400).json({ error: '不支持的天气接口' });
      }
    } catch (error) {
      console.error('API处理错误:', error);
      return res.status(500).json({ error: '处理请求时发生错误' });
    }
  };
} else {
  // Express环境导出路由
  module.exports = router;
} 