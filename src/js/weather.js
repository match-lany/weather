/**
 * 天气数据处理模块
 */

/**
 * 加载某个城市的天气数据
 * @param {string} city - 城市名称
 * @returns {Promise<Object>} 处理后的天气数据
 */
async function loadWeatherData(city) {
  try {
    // 显示加载状态
    showLoading(true);
    
    // 并行请求各类天气数据
    const [current, forecast, hourly] = await Promise.all([
      getCurrentWeather(city),
      getForecast(city),
      getHourlyForecast(city)
    ]);
    
    // 格式化和处理数据
    const processedData = processWeatherData(current, forecast, hourly);
    
    // 更新最后更新时间
    updateLastUpdateTime();
    
    // 隐藏加载状态
    showLoading(false);
    
    return processedData;
  } catch (error) {
    console.error('加载天气数据失败:', error);
    
    // 隐藏加载状态
    showLoading(false);
    
    // 显示错误提示
    showErrorMessage('获取天气信息失败，请稍后重试');
    
    throw error;
  }
}

/**
 * 处理天气数据，将API原始数据转换为应用需要的格式
 * @param {Object} current - 当前天气数据
 * @param {Object} forecast - 天气预报数据
 * @param {Object} hourly - 小时预报数据
 * @returns {Object} 处理后的数据
 */
function processWeatherData(current, forecast, hourly) {
  return {
    current: formatCurrentWeather(current),
    forecast: formatForecastWeather(forecast),
    hourly: formatHourlyWeather(hourly),
    updateTime: new Date()
  };
}

/**
 * 格式化当前天气数据
 * @param {Object} data - 原始当前天气数据
 * @returns {Object} 格式化后的当前天气数据
 */
function formatCurrentWeather(data) {
  return {
    temperature: data.temperature,
    feelsLike: data.feelsLike,
    text: data.text,
    icon: data.icon,
    humidity: data.humidity,
    pressure: data.pressure,
    windDir: data.windDir,
    windScale: data.windScale,
    windSpeed: data.windSpeed,
    vis: data.vis,
    updateTime: data.updateTime
  };
}

/**
 * 格式化天气预报数据
 * @param {Object} data - 原始天气预报数据
 * @returns {Array} 格式化后的天气预报数据
 */
function formatForecastWeather(data) {
  if (!data || !data.daily) return [];
  
  return data.daily.map(day => ({
    date: formatDate(day.fxDate),
    dayOfWeek: getDayOfWeek(new Date(day.fxDate)),
    tempMax: day.tempMax,
    tempMin: day.tempMin,
    textDay: day.textDay,
    textNight: day.textNight,
    iconDay: day.iconDay,
    iconNight: day.iconNight,
    humidity: day.humidity,
    precip: day.precip,
    windDir: day.windDirDay,
    windScale: day.windScaleDay,
    sunrise: day.sunrise,
    sunset: day.sunset
  }));
}

/**
 * 格式化小时预报数据
 * @param {Object} data - 原始小时预报数据
 * @returns {Array} 格式化后的小时预报数据
 */
function formatHourlyWeather(data) {
  if (!data || !data.hourly) return [];
  
  return data.hourly.map(hour => {
    // 提取小时部分
    const time = hour.fxTime.substring(11, 16);
    
    return {
      time: formatTime(time),
      temp: hour.temp,
      icon: hour.icon,
      text: hour.text,
      windDir: hour.windDir,
      windScale: hour.windScale,
      humidity: hour.humidity,
      pop: hour.pop, // 降水概率
      precip: hour.precip // 降水量
    };
  });
}

/**
 * 显示/隐藏加载状态
 * @param {boolean} isLoading - 是否正在加载
 */
function showLoading(isLoading) {
  const loadingElements = document.querySelectorAll('.weather-loading');
  
  loadingElements.forEach(el => {
    el.style.display = isLoading ? 'flex' : 'none';
  });
}

/**
 * 显示错误信息
 * @param {string} message - 错误信息
 */
function showErrorMessage(message) {
  // 当前天气区域显示错误信息
  const weatherContainer = document.getElementById('current-weather');
  if (weatherContainer) {
    weatherContainer.innerHTML = `<p class="error-message">${message}</p>`;
  }
}

/**
 * 更新最后更新时间
 */
function updateLastUpdateTime() {
  const updateTimeElement = document.getElementById('last-update-time');
  if (updateTimeElement) {
    const now = new Date();
    updateTimeElement.textContent = formatDate(now, 'YYYY-MM-DD hh:mm');
  }
} 