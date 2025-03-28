/**
 * 城市相关API路由
 */

const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');

// 创建缓存实例
const cache = new NodeCache({ stdTTL: 7 * 24 * 60 * 60, checkperiod: 600 }); // 默认缓存7天

// 和风天气API配置
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

// 路由映射
const routes = {
  'search': handleSearch,
  'all': handleAllCities,
  'locate': handleLocate,
  'hot': handleHotCities
};

// 主处理函数 - Vercel Serverless入口点
module.exports = async (req, res) => {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 日志记录
  console.log(`处理API请求: ${req.url}`);

  try {
    // 解析endpoint参数
    const endpoint = req.query.endpoint;
    console.log(`请求的endpoint: ${endpoint}`);

    // 查找对应的处理函数
    const handler = routes[endpoint];
    
    if (handler) {
      // 调用对应的处理函数
      await handler(req, res);
    } else {
      res.status(400).json({
        status: 'error',
        message: `不支持的endpoint: ${endpoint}`
      });
    }
  } catch (error) {
    console.error('API处理错误:', error);
    res.status(500).json({
      status: 'error',
      message: '服务器内部错误'
    });
  }
};

/**
 * 获取所有城市列表
 */
async function handleAllCities(req, res) {
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
    res.setHeader('Cache-Control', 's-maxage=604800, stale-while-revalidate');
    
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
}

/**
 * 搜索城市
 */
async function handleSearch(req, res) {
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
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
    
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
}

/**
 * 根据地理位置获取城市
 */
async function handleLocate(req, res) {
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
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
    
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
}

/**
 * 获取热门城市
 */
function handleHotCities(req, res) {
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
}

/**
 * 为省份生成模拟城市数据
 * @param {string} provinceCode - 省份代码
 * @param {string} provinceName - 省份名称
 * @returns {Array} 城市列表
 */
function getMockCitiesForProvince(provinceCode, provinceName) {
  // 根据省份代码的前两位，生成一些模拟城市
  const prefix = provinceCode.substr(0, 2);
  
  // 直辖市特殊处理
  if (['11', '12', '31', '50'].includes(prefix)) {
    return [
      { id: `101${prefix}0100`, name: provinceName.replace('市', '') }
    ];
  }
  
  // 其他省份生成3-5个城市
  const cities = [];
  const cityCount = Math.floor(Math.random() * 3) + 3; // 3-5个城市
  
  for (let i = 1; i <= cityCount; i++) {
    cities.push({
      id: `101${prefix}${i.toString().padStart(2, '0')}00`,
      name: `${provinceName.replace('省', '').replace('自治区', '')}城市${i}`
    });
  }
  
  return cities;
} 