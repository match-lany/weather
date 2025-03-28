const axios = require('axios');

// 和风天气API配置
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const WEATHER_API_BASE = 'https://devapi.qweather.com/v7';

// 缓存时间(秒)
const CACHE_CONTROL = {
  current: 60 * 30, // 当前天气缓存30分钟
  forecast: 60 * 60 * 2, // 天气预报缓存2小时
  hourly: 60 * 60, // 小时预报缓存1小时
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
    const endpoint = query.endpoint || 'current'; // 默认获取当前天气
    const city = query.city;
    const days = query.days || 3;

    if (!city) {
      return res.status(400).json({ error: '缺少城市参数' });
    }

    // 处理不同的天气端点
    let weatherAPI;
    let cacheTime;

    switch (endpoint) {
      case 'current':
        weatherAPI = `${WEATHER_API_BASE}/weather/now`;
        cacheTime = CACHE_CONTROL.current;
        break;
      case 'forecast':
        weatherAPI = `${WEATHER_API_BASE}/weather/${days}d`;
        cacheTime = CACHE_CONTROL.forecast;
        break;
      case 'hourly':
        weatherAPI = `${WEATHER_API_BASE}/weather/24h`;
        cacheTime = CACHE_CONTROL.hourly;
        break;
      default:
        return res.status(400).json({ error: '不支持的天气接口' });
    }

    // 先获取城市ID
    const locationResponse = await axios.get('https://geoapi.qweather.com/v2/city/lookup', {
      params: {
        location: city,
        key: WEATHER_API_KEY
      }
    });

    if (locationResponse.data.code !== '200' || !locationResponse.data.location || locationResponse.data.location.length === 0) {
      return res.status(404).json({ error: '找不到对应的城市' });
    }

    const locationId = locationResponse.data.location[0].id;

    // 请求和风天气API
    const weatherResponse = await axios.get(weatherAPI, {
      params: {
        location: locationId,
        key: WEATHER_API_KEY
      }
    });

    if (weatherResponse.data.code !== '200') {
      return res.status(500).json({ error: `天气API错误: ${weatherResponse.data.code}` });
    }

    // 设置缓存头
    res.setHeader('Cache-Control', `s-maxage=${cacheTime}, stale-while-revalidate`);

    // 返回数据
    if (endpoint === 'current') {
      return res.status(200).json(weatherResponse.data.now);
    } else if (endpoint === 'forecast') {
      return res.status(200).json({
        daily: weatherResponse.data.daily,
        updateTime: weatherResponse.data.updateTime
      });
    } else if (endpoint === 'hourly') {
      return res.status(200).json({
        hourly: weatherResponse.data.hourly,
        updateTime: weatherResponse.data.updateTime
      });
    }
  } catch (error) {
    console.error('获取天气数据失败:', error);
    return res.status(500).json({ error: '获取天气数据失败' });
  }
}; 