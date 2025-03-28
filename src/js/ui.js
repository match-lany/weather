/**
 * UI渲染和交互模块
 */

/**
 * 初始化UI
 */
function initUI() {
  // 绑定事件
  bindEvents();
  
  // 初始化主题
  initTheme();
  
  // 添加主题切换按钮
  addThemeToggle();
}

/**
 * 绑定DOM事件
 */
function bindEvents() {
  // 城市选择器点击事件
  const citySelector = document.getElementById('city-selector');
  if (citySelector) {
    citySelector.addEventListener('click', () => {
      document.getElementById('city-select-modal').style.display = 'flex';
    });
  }
  
  // 关闭城市选择模态框
  const closeModalBtn = document.getElementById('close-modal-btn');
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      document.getElementById('city-select-modal').style.display = 'none';
    });
  }
  
  // 关闭定位错误模态框
  const closeErrorModalBtn = document.getElementById('close-error-modal-btn');
  if (closeErrorModalBtn) {
    closeErrorModalBtn.addEventListener('click', () => {
      document.getElementById('location-error-modal').style.display = 'none';
    });
  }
  
  // 打开城市选择按钮
  const openCitySelectBtn = document.getElementById('open-city-select-btn');
  if (openCitySelectBtn) {
    openCitySelectBtn.addEventListener('click', () => {
      document.getElementById('location-error-modal').style.display = 'none';
      document.getElementById('city-select-modal').style.display = 'flex';
    });
  }
  
  // 搜索城市
  const searchBtn = document.getElementById('search-btn');
  const citySearchInput = document.getElementById('city-search-input');
  if (searchBtn && citySearchInput) {
    // 使用防抖处理搜索
    const debouncedSearch = debounce(searchCities, 300);
    
    searchBtn.addEventListener('click', debouncedSearch);
    citySearchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        debouncedSearch();
      }
    });
  }
  
  // 刷新按钮
  const refreshBtn = document.getElementById('refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      const city = await getCurrentCity();
      await refreshWeather(city);
    });
  }
}

/**
 * 添加主题切换按钮
 */
function addThemeToggle() {
  const themeToggle = document.createElement('button');
  themeToggle.className = 'theme-toggle';
  themeToggle.setAttribute('aria-label', '切换主题');
  themeToggle.innerHTML = `
    <svg viewBox="0 0 24 24" width="24" height="24">
      <path fill="currentColor" d="M12,7c-2.76,0-5,2.24-5,5s2.24,5,5,5s5-2.24,5-5S14.76,7,12,7L12,7z M2,13l2,0c0.55,0,1-0.45,1-1s-0.45-1-1-1l-2,0 c-0.55,0-1,0.45-1,1S1.45,13,2,13z M20,13l2,0c0.55,0,1-0.45,1-1s-0.45-1-1-1l-2,0c-0.55,0-1,0.45-1,1S19.45,13,20,13z M11,2v2 c0,0.55,0.45,1,1,1s1-0.45,1-1V2c0-0.55-0.45-1-1-1S11,1.45,11,2z M11,20v2c0,0.55,0.45,1,1,1s1-0.45,1-1v-2c0-0.55-0.45-1-1-1 S11,19.45,11,20z M5.99,4.58c-0.39-0.39-1.03-0.39-1.41,0c-0.39,0.39-0.39,1.03,0,1.41l1.06,1.06c0.39,0.39,1.03,0.39,1.41,0 s0.39-1.03,0-1.41L5.99,4.58z M18.36,16.95c-0.39-0.39-1.03-0.39-1.41,0c-0.39,0.39-0.39,1.03,0,1.41l1.06,1.06 c0.39,0.39,1.03,0.39,1.41,0c0.39-0.39,0.39-1.03,0-1.41L18.36,16.95z M19.42,5.99c0.39-0.39,0.39-1.03,0-1.41 c-0.39-0.39-1.03-0.39-1.41,0l-1.06,1.06c-0.39,0.39-0.39,1.03,0,1.41s1.03,0.39,1.41,0L19.42,5.99z M7.05,18.36 c0.39-0.39,0.39-1.03,0-1.41c-0.39-0.39-1.03-0.39-1.41,0l-1.06,1.06c-0.39,0.39-0.39,1.03,0,1.41s1.03,0.39,1.41,0L7.05,18.36z" />
    </svg>
  `;
  
  themeToggle.addEventListener('click', () => {
    toggleTheme();
  });
  
  document.body.appendChild(themeToggle);
}

/**
 * 搜索城市
 */
async function searchCities() {
  const searchInput = document.getElementById('city-search-input');
  const cityList = document.getElementById('city-list');
  
  if (!searchInput || !cityList) return;
  
  const keyword = searchInput.value.trim();
  if (!keyword) return;
  
  // 显示加载状态
  cityList.innerHTML = '<div class="loading-spinner"></div>';
  
  try {
    const cities = await searchCity(keyword);
    renderCityList(cities);
  } catch (error) {
    console.error('搜索城市失败:', error);
    cityList.innerHTML = '<p class="error-message">搜索失败，请重试</p>';
  }
}

/**
 * 渲染城市列表
 * @param {Array} cities - 城市列表
 */
function renderCityList(cities) {
  const cityList = document.getElementById('city-list');
  if (!cityList) return;
  
  // 如果没有城市，显示提示
  if (!cities || cities.length === 0) {
    cityList.innerHTML = '<p class="empty-message">没有找到匹配的城市</p>';
    return;
  }
  
  // 清空列表
  cityList.innerHTML = '';
  
  // 添加城市项
  cities.forEach(city => {
    const cityItem = document.createElement('div');
    cityItem.className = 'city-item';
    cityItem.textContent = city.name;
    cityItem.addEventListener('click', () => {
      selectCity(city.name);
    });
    
    cityList.appendChild(cityItem);
  });
}

/**
 * 选择城市
 * @param {string} cityName - 城市名称
 */
async function selectCity(cityName) {
  // 保存选择的城市
  localStorage.setItem('selectedCity', cityName);
  
  // 关闭模态框
  document.getElementById('city-select-modal').style.display = 'none';
  
  // 更新城市显示
  document.getElementById('current-city').textContent = cityName;
  
  // 加载该城市的天气数据
  await loadWeather(cityName);
}

/**
 * 加载并显示天气数据
 * @param {string} city - 城市名称
 */
async function loadWeather(city) {
  try {
    // 加载天气数据
    const weatherData = await loadWeatherData(city);
    
    // 渲染天气数据
    renderWeather(weatherData);
  } catch (error) {
    console.error('加载天气失败:', error);
  }
}

/**
 * 刷新天气数据
 * @param {string} city - 城市名称
 */
async function refreshWeather(city) {
  try {
    // 显示加载状态
    showLoading(true);
    
    // 刷新天气数据
    const weatherData = await refreshWeatherData(city);
    
    // 渲染天气数据
    renderWeather(weatherData);
    
    // 隐藏加载状态
    showLoading(false);
    
    // 更新最后更新时间
    updateLastUpdateTime();
  } catch (error) {
    console.error('刷新天气失败:', error);
    
    // 隐藏加载状态
    showLoading(false);
    
    // 显示错误信息
    showErrorMessage('刷新天气失败，请稍后重试');
  }
}

/**
 * 渲染天气数据到页面
 * @param {Object} data - 天气数据
 */
function renderWeather(data) {
  if (!data) return;
  
  // 渲染当前天气
  renderCurrentWeather(data.current);
  
  // 渲染24小时预报
  renderHourlyForecast(data.hourly);
  
  // 渲染3天预报
  renderDailyForecast(data.forecast);
  
  // 渲染详细信息
  renderWeatherDetails(data.current, data.forecast[0]);
}

/**
 * 渲染当前天气
 * @param {Object} data - 当前天气数据
 */
function renderCurrentWeather(data) {
  const container = document.getElementById('current-weather');
  if (!container || !data) return;
  
  container.innerHTML = `
    <div class="weather-main">
      <div class="temperature">${data.temperature}°</div>
      <div class="weather-info">
        <img src="assets/icons/new/${mapWeatherIcon(data.icon)}.svg" alt="${data.text}" class="weather-icon" onerror="this.onerror=null; this.parentNode.innerHTML='<i class=\\'qi-${mapWeatherIcon(data.icon)}\\' style=\\'font-size: 64px\\'></i>';">
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

/**
 * 渲染小时预报
 * @param {Array} data - 小时预报数据
 */
function renderHourlyForecast(data) {
  const container = document.getElementById('hourly-forecast');
  if (!container || !data) return;
  
  // 确保data是数组
  if (!Array.isArray(data)) {
    console.error('小时预报数据不是数组:', data);
    return;
  }
  
  // 如果数组为空，直接返回
  if (data.length === 0) return;
  
  // 只显示24小时
  const hourlyData = data.slice(0, 24);
  
  const hourlyItems = hourlyData.map(hour => `
    <div class="hourly-item">
      <div class="hourly-time">${hour.time}</div>
      <img src="assets/icons/new/${mapWeatherIcon(hour.icon)}.svg" alt="${hour.text}" class="hourly-icon" onerror="this.onerror=null; this.outerHTML='<i class=\\'qi-${mapWeatherIcon(hour.icon)}\\' style=\\'font-size: 32px\\'></i>';">
      <div class="hourly-temp">${hour.temp}°</div>
    </div>
  `).join('');
  
  container.innerHTML = hourlyItems;
}

/**
 * 渲染每日预报
 * @param {Array} data - 每日预报数据
 */
function renderDailyForecast(data) {
  const container = document.getElementById('daily-forecast');
  if (!container || !data) return;
  
  // 确保data是数组
  if (!Array.isArray(data)) {
    console.error('每日预报数据不是数组:', data);
    return;
  }
  
  // 如果数组为空，直接返回
  if (data.length === 0) return;
  
  // 最多显示7天
  const forecastData = data.slice(0, 7);
  
  const forecastItems = forecastData.map(day => `
    <div class="forecast-day">
      <div class="forecast-date">${day.date} ${day.dayOfWeek}</div>
      <img src="assets/icons/new/${mapWeatherIcon(day.iconDay)}.svg" alt="${day.textDay}" class="forecast-icon" onerror="this.onerror=null; this.outerHTML='<i class=\\'qi-${mapWeatherIcon(day.iconDay)}\\' style=\\'font-size: 32px\\'></i>';">
      <div class="forecast-temp">
        <span class="temp-high">${day.tempMax}°</span>
        <span class="temp-low">${day.tempMin}°</span>
      </div>
    </div>
  `).join('');
  
  container.innerHTML = forecastItems;
}

/**
 * 渲染天气详细信息
 * @param {Object} current - 当前天气数据
 * @param {Object} today - 今日预报数据
 */
function renderWeatherDetails(current, today) {
  const container = document.getElementById('weather-details');
  if (!container || !current) return;
  
  // 合并当前天气和今日预报数据
  const data = { ...current, ...today };
  
  container.innerHTML = `
    <div class="weather-detail-card">
      <div class="detail-card-title">日出时间</div>
      <div class="detail-card-value">${data.sunrise || '--'}</div>
    </div>
    <div class="weather-detail-card">
      <div class="detail-card-title">日落时间</div>
      <div class="detail-card-value">${data.sunset || '--'}</div>
    </div>
    <div class="weather-detail-card">
      <div class="detail-card-title">降水概率</div>
      <div class="detail-card-value">${data.pop || 0}%</div>
    </div>
    <div class="weather-detail-card">
      <div class="detail-card-title">降水量</div>
      <div class="detail-card-value">${data.precip || 0}mm</div>
    </div>
    <div class="weather-detail-card">
      <div class="detail-card-title">体感温度</div>
      <div class="detail-card-value">${data.feelsLike || '--'}°</div>
    </div>
    <div class="weather-detail-card">
      <div class="detail-card-title">风速</div>
      <div class="detail-card-value">${data.windSpeed || '--'}km/h</div>
    </div>
  `;
} 