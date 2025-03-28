/**
 * 城市相关API路由
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

const cache = new NodeCache({ stdTTL: 7 * 24 * 60 * 60, checkperiod: 600 }); // 默认缓存7天

// 和风天气API配置
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

/**
 * 获取所有城市列表
 * GET /api/cities/all
 */
router.get('/all', async (req, res) => {
  try {
    // 尝试从缓存中获取
    const cacheKey = 'cities_all';
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }
    
    // 获取中国的省份列表
    const provinces = [
      { name: '北京市', code: '110000' },
      { name: '天津市', code: '120000' },
      { name: '河北省', code: '130000' },
      { name: '山西省', code: '140000' },
      { name: '内蒙古自治区', code: '150000' },
      { name: '辽宁省', code: '210000' },
      { name: '吉林省', code: '220000' },
      { name: '黑龙江省', code: '230000' },
      { name: '上海市', code: '310000' },
      { name: '江苏省', code: '320000' },
      { name: '浙江省', code: '330000' },
      { name: '安徽省', code: '340000' },
      { name: '福建省', code: '350000' },
      { name: '江西省', code: '360000' },
      { name: '山东省', code: '370000' },
      { name: '河南省', code: '410000' },
      { name: '湖北省', code: '420000' },
      { name: '湖南省', code: '430000' },
      { name: '广东省', code: '440000' },
      { name: '广西壮族自治区', code: '450000' },
      { name: '海南省', code: '460000' },
      { name: '重庆市', code: '500000' },
      { name: '四川省', code: '510000' },
      { name: '贵州省', code: '520000' },
      { name: '云南省', code: '530000' },
      { name: '西藏自治区', code: '540000' },
      { name: '陕西省', code: '610000' },
      { name: '甘肃省', code: '620000' },
      { name: '青海省', code: '630000' },
      { name: '宁夏回族自治区', code: '640000' },
      { name: '新疆维吾尔自治区', code: '650000' },
      { name: '台湾省', code: '710000' },
      { name: '香港特别行政区', code: '810000' },
      { name: '澳门特别行政区', code: '820000' }
    ];
    
    // 模拟为每个省份添加城市，实际中应该分别请求和风天气API
    const result = provinces.map(province => {
      return {
        name: province.name,
        code: province.code,
        cities: getMockCitiesForProvince(province.code, province.name)
      };
    });
    
    // 设置缓存头（Vercel）
    if (process.env.VERCEL) {
      res.setHeader('Cache-Control', 's-maxage=604800, stale-while-revalidate');
    }
    
    // 存入缓存
    cache.set(cacheKey, result, 7 * 24 * 60 * 60); // 缓存7天
    
    res.json(result);
  } catch (error) {
    console.error('获取城市列表失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取城市列表失败'
    });
  }
});

/**
 * 搜索城市
 * GET /api/cities/search?keyword=北京
 */
router.get('/search', async (req, res) => {
  try {
    const { keyword } = req.query;
    
    if (!keyword) {
      return res.status(400).json({
        status: 'error',
        message: '缺少搜索关键词'
      });
    }
    
    // 缓存键
    const cacheKey = `cities_search_${keyword}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }
    
    // 请求和风天气API
    const response = await axios.get('https://geoapi.qweather.com/v2/city/lookup', {
      params: {
        location: keyword,
        key: WEATHER_API_KEY,
        range: 'cn' // 仅中国城市
      }
    });
    
    if (response.data.code !== '200') {
      throw new Error(`城市API错误: ${response.data.code}`);
    }
    
    const cities = response.data.location.map(city => ({
      id: city.id,
      name: city.name,
      adm1: city.adm1, // 省份
      adm2: city.adm2, // 城市
      lat: city.lat,
      lon: city.lon
    }));
    
    // 设置缓存头（Vercel）
    if (process.env.VERCEL) {
      res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
    }
    
    // 存入缓存
    cache.set(cacheKey, cities, 24 * 60 * 60); // 缓存24小时
    
    res.json(cities);
  } catch (error) {
    console.error('搜索城市失败:', error);
    res.status(500).json({
      status: 'error',
      message: '搜索城市失败'
    });
  }
});

/**
 * 根据地理位置获取城市
 * GET /api/cities/locate?lat=39.90&lon=116.40
 */
router.get('/locate', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({
        status: 'error',
        message: '缺少经纬度参数'
      });
    }
    
    // 缓存键
    const cacheKey = `cities_locate_${lat}_${lon}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }
    
    // 请求和风天气API
    const response = await axios.get('https://geoapi.qweather.com/v2/city/lookup', {
      params: {
        location: `${lon},${lat}`,
        key: WEATHER_API_KEY
      }
    });
    
    if (response.data.code !== '200' || !response.data.location || response.data.location.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: '找不到对应的城市'
      });
    }
    
    const city = {
      id: response.data.location[0].id,
      name: response.data.location[0].name,
      adm1: response.data.location[0].adm1,
      adm2: response.data.location[0].adm2,
      lat: response.data.location[0].lat,
      lon: response.data.location[0].lon
    };
    
    // 设置缓存头（Vercel）
    if (process.env.VERCEL) {
      res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
    }
    
    // 存入缓存
    cache.set(cacheKey, city, 24 * 60 * 60); // 缓存24小时
    
    res.json(city);
  } catch (error) {
    console.error('根据位置获取城市失败:', error);
    res.status(500).json({
      status: 'error',
      message: '根据位置获取城市失败'
    });
  }
});

/**
 * 获取热门城市
 * GET /api/cities/hot
 */
router.get('/hot', (req, res) => {
  // 热门城市列表
  const hotCities = [
    { id: '101010100', name: '北京' },
    { id: '101020100', name: '上海' },
    { id: '101280101', name: '广州' },
    { id: '101280601', name: '深圳' },
    { id: '101210101', name: '杭州' },
    { id: '101190101', name: '南京' },
    { id: '101200101', name: '武汉' },
    { id: '101230101', name: '福州' },
    { id: '101040100', name: '重庆' },
    { id: '101270101', name: '成都' }
  ];
  
  res.json(hotCities);
});

/**
 * 为省份生成模拟城市数据
 * @param {string} provinceCode - 省份代码
 * @param {string} provinceName - 省份名称
 * @returns {Array} 城市列表
 */
function getMockCitiesForProvince(provinceCode, provinceName) {
  // 这里只是模拟数据，实际应用中应该调用和风天气API获取真实城市列表
  const mockCities = {
    '110000': [{ id: '101010100', name: '北京' }],
    '120000': [{ id: '101030100', name: '天津' }],
    '130000': [
      { id: '101090101', name: '石家庄' },
      { id: '101090201', name: '保定' },
      { id: '101090301', name: '张家口' }
    ],
    '310000': [{ id: '101020100', name: '上海' }],
    '440000': [
      { id: '101280101', name: '广州' },
      { id: '101280601', name: '深圳' },
      { id: '101281001', name: '珠海' }
    ],
    '500000': [{ id: '101040100', name: '重庆' }]
  };
  
  // 如果没有预设数据，返回一个空数组
  return mockCities[provinceCode] || [];
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
    console.log(`处理城市请求: ${req.url}`);
    console.log(`查询参数:`, req.query);

    // 解析endpoint和其他参数
    const endpoint = req.query.endpoint || 'search';
    
    // 根据endpoint调用对应的路由处理函数
    try {
      if (endpoint === 'search') {
        if (!router["GET_/search"]) {
          return res.status(404).json({ error: 'API路由不存在' });
        }
        return router["GET_/search"](req, res);
      } else if (endpoint === 'all') {
        if (!router["GET_/all"]) {
          return res.status(404).json({ error: 'API路由不存在' });
        }
        return router["GET_/all"](req, res);
      } else if (endpoint === 'locate') {
        if (!router["GET_/locate"]) {
          return res.status(404).json({ error: 'API路由不存在' });
        }
        return router["GET_/locate"](req, res);
      } else if (endpoint === 'hot') {
        // 热门城市可能未实现
        return res.status(501).json({ error: '热门城市功能尚未实现' });
      } else {
        return res.status(400).json({ error: '不支持的城市接口' });
      }
    } catch (error) {
      console.error('城市API处理错误:', error);
      return res.status(500).json({ error: '处理请求时发生错误' });
    }
  };
} else {
  // Express环境导出路由
  module.exports = router;
} 