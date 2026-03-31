// S-RETC Service Worker v1.0
// Cache tĩnh để app chạy offline (login page + shell)

const CACHE_NAME = 'sretc-v1';
const SHELL = ['./', './index.html'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Chỉ cache GET request, bỏ qua Firebase API + Groq API
  if (e.request.method !== 'GET') return;
  const url = e.request.url;
  if (url.includes('firebasedatabase') || url.includes('groq.com') ||
      url.includes('api.') || url.includes('chrome-extension')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetchPromise = fetch(e.request).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
