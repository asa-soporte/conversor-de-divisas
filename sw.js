const CACHE_NAME = 'globalxchange-v3.4';
const ASSETS = [
    './',
    './index.html',
    'https://cdn.tailwindcss.com',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
    'https://unpkg.com/lucide@latest',
    'https://mindicador.cl/api/dolar',
    'https://open.er-api.com/v6/latest/USD'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS).catch((err) => console.warn('Cache pre-fill warning:', err));
        }).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) return caches.delete(key);
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Estrategia Network-First para APIs de tipo de cambio en tiempo real
    if (url.origin.includes('mindicador.cl') || url.origin.includes('open.er-api.com')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    if (response.status === 200) {
                        const copy = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
                    }
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
    } else {
        // Estrategia Cache-First para recursos estáticos e interfaz gráfica
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) return cachedResponse;
                return fetch(event.request).then((response) => {
                    if (response.status === 200 && event.request.method === 'GET') {
                        const copy = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
                    }
                    return response;
                });
            }).catch(() => fetch(event.request))
        );
    }
});
