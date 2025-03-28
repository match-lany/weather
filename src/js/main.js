/**
 * 应用主入口文件
 */

// 当文档加载完成后执行
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // 初始化UI
    initUI();
    
    // 获取当前城市
    const city = await getCurrentCity();
    
    // 更新城市显示
    updateCityDisplay(city);
    
    // 加载天气数据
    await loadWeather(city);
    
    // 注册Service Worker（PWA支持）
    registerServiceWorker();
  } catch (error) {
    console.error('应用初始化失败:', error);
  }
});

/**
 * 更新城市显示
 * @param {string} cityName - 城市名称
 */
function updateCityDisplay(cityName) {
  const cityElement = document.getElementById('current-city');
  if (cityElement) {
    cityElement.textContent = cityName;
  }
}

/**
 * 注册Service Worker
 */
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('ServiceWorker注册成功:', registration.scope);
        })
        .catch(error => {
          console.error('ServiceWorker注册失败:', error);
        });
    });
  }
} 