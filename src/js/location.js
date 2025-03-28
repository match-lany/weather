/**
 * 位置服务相关功能
 */

// 定位权限状态
const PERMISSION_STATUS = {
  GRANTED: 'granted',
  DENIED: 'denied',
  PROMPT: 'prompt',
  UNKNOWN: 'unknown'
};

// 默认城市（定位失败时使用）
const DEFAULT_CITY = '北京';

/**
 * 检查地理位置权限状态
 * @returns {Promise<string>} 权限状态
 */
async function checkLocationPermission() {
  // 如果浏览器不支持权限API，返回未知状态
  if (!navigator.permissions) {
    return navigator.geolocation ? PERMISSION_STATUS.PROMPT : PERMISSION_STATUS.DENIED;
  }
  
  try {
    const permission = await navigator.permissions.query({ name: 'geolocation' });
    return permission.state;
  } catch (error) {
    console.error('检查地理位置权限失败:', error);
    return PERMISSION_STATUS.UNKNOWN;
  }
}

/**
 * 获取当前位置
 * @returns {Promise<{latitude: number, longitude: number}>} 位置坐标
 */
function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('浏览器不支持地理定位'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      position => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      error => {
        console.error('获取位置失败:', error.message);
        reject(error);
      },
      {
        enableHighAccuracy: false, // 使用低精度以提高响应速度
        timeout: 15000, // 增加超时时间到15秒
        maximumAge: 120000 // 允许使用2分钟内的缓存位置
      }
    );
  });
}

/**
 * 根据坐标获取城市信息
 * @param {number} latitude - 纬度
 * @param {number} longitude - 经度
 * @returns {Promise<Object>} 城市信息
 */
async function getCityFromCoords(latitude, longitude) {
  try {
    return await getCityByLocation(latitude, longitude);
  } catch (error) {
    console.error('根据坐标获取城市失败:', error);
    throw error;
  }
}

/**
 * 自动获取当前城市
 * @returns {Promise<Object>} 城市信息
 */
async function autoDetectCity() {
  const permissionStatus = await checkLocationPermission();
  
  // 如果权限已被拒绝，直接使用默认城市
  if (permissionStatus === PERMISSION_STATUS.DENIED) {
    return { name: DEFAULT_CITY }; // 返回默认城市对象，而不是抛出错误
  }
  
  try {
    const position = await getCurrentPosition();
    const cityInfo = await getCityFromCoords(position.latitude, position.longitude);
    
    // 保存到本地存储
    saveToStorage('last_detected_city', cityInfo, 24 * 60 * 60 * 1000); // 保存24小时
    
    return cityInfo;
  } catch (error) {
    console.error('自动检测城市失败:', error);
    
    // 尝试从缓存获取上次成功定位的城市
    const lastCity = getFromStorage('last_detected_city');
    if (lastCity) {
      return lastCity;
    }
    
    // 如果没有缓存，返回默认城市对象，而不是抛出错误
    return { name: DEFAULT_CITY };
  }
}

/**
 * 获取当前选择的城市
 * @returns {Promise<string>} 城市名称
 */
async function getCurrentCity() {
  // 先检查用户手动选择的城市
  const selectedCity = localStorage.getItem('selectedCity');
  if (selectedCity) {
    return selectedCity;
  }
  
  // 尝试自动定位
  try {
    const cityInfo = await autoDetectCity();
    return cityInfo.name;
  } catch (error) {
    console.error('获取当前城市失败:', error);
    // 直接返回默认城市，不再抛出错误
    return DEFAULT_CITY;
  }
}

/**
 * 显示定位错误提示
 * @param {string} message - 错误信息
 */
function showLocationError(message = '无法获取您的位置，请手动选择城市。') {
  const errorModal = document.getElementById('location-error-modal');
  const errorMessage = document.getElementById('location-error-message');
  
  if (errorModal && errorMessage) {
    errorMessage.textContent = message;
    errorModal.style.display = 'flex';
  }
} 