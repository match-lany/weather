/**
 * 工具函数集合
 */

/**
 * 格式化日期
 * @param {Date|string} date - 日期对象或日期字符串
 * @param {string} format - 格式化模板，例如 'YYYY-MM-DD hh:mm:ss'
 * @returns {string} 格式化后的日期字符串
 */
function formatDate(date, format = 'YYYY-MM-DD') {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const formatMap = {
    YYYY: d.getFullYear().toString(),
    MM: (d.getMonth() + 1).toString().padStart(2, '0'),
    DD: d.getDate().toString().padStart(2, '0'),
    hh: d.getHours().toString().padStart(2, '0'),
    mm: d.getMinutes().toString().padStart(2, '0'),
    ss: d.getSeconds().toString().padStart(2, '0'),
  };
  
  let result = format;
  for (const [key, value] of Object.entries(formatMap)) {
    result = result.replace(key, value);
  }
  
  return result;
}

/**
 * 格式化时间，将24小时格式转为更友好的显示方式
 * @param {string} timeString - 时间字符串，例如 "12:00"
 * @returns {string} 格式化后的时间
 */
function formatTime(timeString) {
  const parts = timeString.split(':');
  const hour = parseInt(parts[0], 10);
  
  return `${hour}:${parts[1]}`;
}

/**
 * 获取星期几
 * @param {Date} date - 日期对象
 * @returns {string} 星期几的中文表示
 */
function getDayOfWeek(date) {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return days[date.getDay()];
}

/**
 * 存储数据到本地存储
 * @param {string} key - 键名
 * @param {any} value - 要存储的值
 * @param {number} expireTime - 过期时间（毫秒），默认24小时
 */
function saveToStorage(key, value, expireTime = 24 * 60 * 60 * 1000) {
  const data = {
    value,
    expireTime: Date.now() + expireTime,
  };
  
  localStorage.setItem(key, JSON.stringify(data));
}

/**
 * 从本地存储获取数据
 * @param {string} key - 键名
 * @returns {any|null} 存储的值，如果已过期或不存在则返回null
 */
function getFromStorage(key) {
  const dataString = localStorage.getItem(key);
  if (!dataString) return null;
  
  try {
    const data = JSON.parse(dataString);
    if (Date.now() > data.expireTime) {
      localStorage.removeItem(key);
      return null;
    }
    
    return data.value;
  } catch (error) {
    console.error('解析存储数据出错:', error);
    return null;
  }
}

/**
 * 防抖函数
 * @param {Function} func - 要执行的函数
 * @param {number} wait - 等待时间
 * @returns {Function} 防抖处理后的函数
 */
function debounce(func, wait = 300) {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 根据温度获取色彩代码
 * @param {number} temp - 温度值
 * @returns {string} 色彩代码
 */
function getTempColor(temp) {
  if (temp <= 0) return '#9db9cf';
  if (temp <= 10) return '#7ca9d8';
  if (temp <= 20) return '#7cba59';
  if (temp <= 30) return '#ee9a33';
  if (temp <= 40) return '#e95640';
  return '#d6355b';
}

/**
 * 根据系统暗黑模式设置页面主题
 */
function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
    return;
  }
  
  // 如果用户已设置系统暗黑模式，自动切换
  const prefersDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.setAttribute('data-theme', prefersDarkTheme ? 'dark' : 'light');
}

/**
 * 切换主题
 */
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
}

/**
 * 处理和风天气图标代码
 * @param {string} iconCode - 和风天气的图标代码
 * @returns {string} 图标文件名(不含扩展名)
 */
function mapWeatherIcon(iconCode) {
  // 检查图标代码是否存在
  if (!iconCode || iconCode === '999') {
    return '999';
  }
  
  // 判断当前是否是白天
  const currentHour = new Date().getHours();
  const isDayTime = currentHour >= 6 && currentHour < 18;
  
  // 白天和夜间图标对应关系
  const dayToNightMap = {
    '100': '150',  // 晴
    '101': '151',  // 多云
    '102': '152',  // 少云
    '103': '153',  // 晴间多云
    '104': '154',  // 阴
  };
  
  // 如果是夜间且存在对应的夜间图标
  if (!isDayTime && dayToNightMap[iconCode]) {
    return dayToNightMap[iconCode];
  }
  
  return iconCode;
} 