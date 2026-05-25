/* firebase-messaging-sw.js - PWA 자산 캐싱 및 백그라운드 푸시 통합 최종 보정 버전 */

// 1. PWA 캐시 설정
const CACHE_NAME = 'we-final-v3';
const ASSETS_TO_CACHE = [
    './',
    'index.html',
    'style.css',
    'script.js',
    '글_하은.jpg',
    '멘헤라_하은.jpg'
];

// 서비스 워커 설치 및 초기 자산 캐싱
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        }).then(() => self.skipWaiting())
    );
});

// 구버전 캐시 및 쓸데없는 찌꺼기 즉시 삭제 (버튼 먹통 방지)
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

// ⚡ 인터셉터 가동 (네트워크 최우선 전략으로 로딩 멈춤 현상 원천 차단)
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    if (event.request.method !== 'GET' || !url.protocol.startsWith('http')) {
        return;
    }

    if (event.request.destination === 'audio' || url.pathname.endsWith('.mp3') || url.pathname.endsWith('.wav')) {
        return;
    }

    if (url.hostname.includes('cdnjs.cloudflare.com') || url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
        event.respondWith(
            fetch(event.request).catch(() => caches.match(event.request))
        );
        return;
    }

    const isCoreFile = url.pathname.endsWith('index.html') || 
                       url.pathname.endsWith('script.js') || 
                       url.pathname.endsWith('style.css') || 
                       url.pathname === '/' || 
                       url.pathname.endsWith('./');

    if (isCoreFile) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    if (response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
                    }
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
    } else {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(event.request).then((response) => {
                    if (response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
                    }
                    return response;
                }).catch(() => {
                    return new Response('Offline Asset Unavailable', { status: 503 });
                });
            })
        );
    }
});

// 2. Firebase Cloud Messaging 라이브러리 로드 및 백그라운드 수신 가동
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

const secureConfig = {
    apiKey: atob("QUl6YVN5QzducVFxRUpjRnBfamR5NHdWRzMzV1lYSWo1eFdKdVYw"),
    authDomain: atob("c3Rhci1ib2NrLmZpcmBiYXNlYXBwLmNvbQ=="),
    databaseURL: atob("aHR0cHM6Ly9zdGFyLWJvY2stZGVmYXVsdC1ydGRiLmZpcmViYXNlaW8uY29t"), 
    projectId: atob("c3Rhci1ib2Nr"),
    storageBucket: atob("c3Rhci1ib2NrLmZpcmBiYXNlc3RvcmFnZS5hcHA="),
    messagingSenderId: atob("MzUxNTA3Nzg0NzE3"),
    appId: atob("MTozNTE1MDc3ODQ3MTc6d2ViOmUyMmJiNTcxOGMwZWJmYmQzY2ExNDQ="),
    measurementId: atob("Ry0zRU03OTQ3OUpU")
};

firebase.initializeApp(secureConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[sw.js] 백그라운드 푸시 알림 수신: ', payload);

    const notificationTitle = payload.notification.title || "수평선 너머의 서재";
    const notificationOptions = {
        body: payload.notification.body,
        icon: "글_하은.jpg",
        badge: "글_하은.jpg",
        vibrate: [200, 100, 200]
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// 새로고침 업데이트 관리 수신 리스너
self.addEventListener('message', (event) => {
    if (event.data && event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});
