// sw.js - 모바일 백그라운드 알림 활성화용 서비스 워커
self.addEventListener('install', function(event) {
    self.skipWaiting();
});

self.addEventListener('activate', function(event) {
    event.waitUntil(self.clients.claim());
});

// 알림 클릭 시 앱 창으로 포커스 이동
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            if (clientList.length > 0) {
                return clientList[0].focus();
            }
            return clients.openWindow('/');
        })
    );
});
const CACHE_NAME = 'horizon-library-v3';
const ASSETS_TO_CACHE = [
    'index.html',
    'style.css',
    'script.js',
    '글_하은.jpg',
    '멘헤라_하은.jpg'
];

// 1. 서비스 워커 설치 및 하위 레포지토리 자산 로컬 캐싱
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        }).then(() => self.skipWaiting())
    );
});

// 2. 구버전 캐시 자동 청소
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// 3. ⚡ 네트워크 인터셉터 (하위 폴더 스코프 우회 가동)
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || fetch(event.request).catch(() => {
                // 오프라인 방어선 예외 처리
            });
        })
    );
});
