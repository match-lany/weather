/**
 * Service Worker 文件
 * 用于支持离线访问和PWA功能
 */

const CACHE_NAME = 'weather-app-v1';

// 需要缓存的静态资源
const urlsToCache = [
  '/',
  '/index.html',
  '/css/variables.css',
  '/css/main.css',
  '/css/theme.css',
  '/js/utils.js',
  '/js/api.js',
  '/js/location.js',
  '/js/weather.js',
  '/js/ui.js',
  '/js/main.js',
  '/pages/city.html',
  // 图标文件将在安装时动态添加
];

// 安装Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker: 安装中');
  
  // 确保安装完成前执行缓存操作
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: 打开缓存');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: 缓存完成');
        return self.skipWaiting();
      })
  );
});

// 激活Service Worker
self.addEventListener('activate', event => {
  console.log('Service Worker: 激活');
  
  // 删除旧缓存
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: 删除旧缓存', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: 已激活');
      return self.clients.claim();
    })
  );
});

// 拦截fetch请求
self.addEventListener('fetch', event => {
  // 只处理GET请求
  if (event.request.method !== 'GET') return;
  
  // API请求使用网络优先策略
  if (event.request.url.includes('/api/')) {
    event.respondWith(networkFirst(event.request));
  } else {
    // 静态资源使用缓存优先策略
    event.respondWith(cacheFirst(event.request));
  }
});

/**
 * 缓存优先策略
 * 先尝试从缓存获取，如果失败则从网络获取并更新缓存
 * @param {Request} request - 请求对象
 * @returns {Promise<Response>} 响应对象
 */
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    // 只缓存成功的响应
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Service Worker: 缓存优先策略失败', error);
    
    // 如果是HTML请求，返回离线页面
    if (request.headers.get('Accept').includes('text/html')) {
      return caches.match('/offline.html');
    }
    
    throw error;
  }
}

/**
 * 网络优先策略
 * 先尝试从网络获取，如果失败则从缓存获取
 * @param {Request} request - 请求对象
 * @returns {Promise<Response>} 响应对象
 */
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    // 缓存成功的响应
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: 从网络获取失败，尝试从缓存获取', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    console.error('Service Worker: 无法从缓存获取', error);
    throw error;
  }
} 