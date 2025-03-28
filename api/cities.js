const axios = require('axios');

// 和风天气API配置
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

// 缓存时间(秒)
const CACHE_CONTROL = {
  search: 60 * 60 * 24, // 城市搜索缓存24小时
  locate: 60 * 60 * 24, // 地理定位缓存24小时
};

/**
 * Vercel API处理函数
 */
module.exports = async (req, res) => {
  // 启用CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 只接受GET请求
  if (req.method !== 'GET') {
    return res.status(405).json({ error: '只支持GET请求' });
  }

  try {
    const { query } = req;
    const endpoint = query.endpoint || 'search'; // 默认为城市搜索

    // 处理不同的城市端点
    let cacheTime;

    switch (endpoint) {
      case 'search': {
        const keyword = query.keyword;
        
        if (!keyword) {
          return res.status(400).json({ error: '缺少搜索关键词' });
        }
        
        cacheTime = CACHE_CONTROL.search;
        
        // 请求和风天气API
        const response = await axios.get('https://geoapi.qweather.com/v2/city/lookup', {
          params: {
            location: keyword,
            key: WEATHER_API_KEY,
            range: 'cn' // 仅中国城市
          }
        });
        
        if (response.data.code !== '200') {
          return res.status(500).json({ error: `城市API错误: ${response.data.code}` });
        }
        
        const cities = response.data.location.map(city => ({
          id: city.id,
          name: city.name,
          adm1: city.adm1, // 省份
          adm2: city.adm2, // 城市
          lat: city.lat,
          lon: city.lon
        }));
        
        // 设置缓存头
        res.setHeader('Cache-Control', `s-maxage=${cacheTime}, stale-while-revalidate`);
        
        return res.status(200).json(cities);
      }
      
      case 'locate': {
        const { lat, lon } = query;
        
        if (!lat || !lon) {
          return res.status(400).json({ error: '缺少经纬度参数' });
        }
        
        cacheTime = CACHE_CONTROL.locate;
        
        // 请求和风天气API
        const response = await axios.get('https://geoapi.qweather.com/v2/city/lookup', {
          params: {
            location: `${lon},${lat}`,
            key: WEATHER_API_KEY
          }
        });
        
        if (response.data.code !== '200' || !response.data.location || response.data.location.length === 0) {
          return res.status(404).json({ error: '找不到对应的城市' });
        }
        
        const city = {
          id: response.data.location[0].id,
          name: response.data.location[0].name,
          adm1: response.data.location[0].adm1,
          adm2: response.data.location[0].adm2,
          lat: response.data.location[0].lat,
          lon: response.data.location[0].lon
        };
        
        // 设置缓存头
        res.setHeader('Cache-Control', `s-maxage=${cacheTime}, stale-while-revalidate`);
        
        return res.status(200).json(city);
      }
      
      default:
        return res.status(400).json({ error: '不支持的城市接口' });
    }
  } catch (error) {
    console.error('城市查询失败:', error);
    return res.status(500).json({ error: '城市查询失败' });
  }
}; 