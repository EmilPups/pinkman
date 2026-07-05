const CACHE_NAME = 'olprog-v4';
const urlsToCache = [
  '/pinkman/',
  '/pinkman/manifest.json',
  '/pinkman/icons/iconk.png'
];

// Устанавливаем кэш
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Кэшируем файлы...');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.warn('⚠️ Ошибка кэширования:', err))
  );
  self.skipWaiting();
});

// Отдаём из кэша или из сети
self.addEventListener('fetch', event => {
  // Пропускаем запросы к Supabase и внешним API
  if (event.request.url.includes('supabase') || 
      event.request.url.includes('telegram') ||
      event.request.url.includes('cdnjs') ||
      event.request.url.includes('jsdelivr')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Если есть в кэше - отдаём
        if (response) {
          return response;
        }
        // Если нет - грузим из сети
        return fetch(event.request).then(networkResponse => {
          // Кэшируем успешные ответы
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        });
      })
      .catch(() => {
        // Если офлайн и нет в кэше - показываем fallback
        return caches.match('/');
      })
  );
});

// Обновляем кэш при новой версии
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Удаляем старый кэш:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  event.waitUntil(clients.claim());
});