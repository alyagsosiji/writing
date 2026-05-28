/* firebase-messaging-sw.js - PWA 자산 캐싱 및 백그라운드 푸시 통합 최종 보정 버전 (Pro Mode) */

// 1. PWA 캐시 설정 (버전 갱신을 통해 브라우저의 구버전 캐시를 즉각 밀어냅니다)
const CACHE_NAME = 'we-final-v4';
const ASSETS_TO_CACHE = [
    './',
    'index.html',
    'style.css',
    'script.js',
    'manifest.json', /* 🚨 [핵심 수정] 이게 있어야 웹앱 설치가 뜹니다! */
    '글_하은.png',
    '멘헤라_하은.png'
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

// ⚡ 인터셉터 가동 (데스크탑 PWA 완벽 지원을 위한 Pro 라우팅 전략)
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // GET 요청이 아니거나 http/https 스킴이 아닌 경우 패스 (크롬 확장프로그램 등 에러 방지)
    if (event.request.method !== 'GET' || !url.protocol.startsWith('http')) {
        return;
    }

    // 오디오 파일은 캐싱하지 않고 무조건 스트리밍 패스 (메모리 폭발 방지)
    if (event.request.destination === 'audio' || url.pathname.endsWith('.mp3') || url.pathname.endsWith('.wav')) {
        return;
    }

    // 외부 CDN 폰트/라이브러리 통신
    if (url.hostname.includes('cdnjs.cloudflare.com') || url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
        event.respondWith(
            fetch(event.request).catch(() => caches.match(event.request))
        );
        return;
    }

    // 💡 [핵심] 데스크탑 PWA 설치 요건: HTML 네비게이션 요청에 대해 완벽한 오프라인 폴백(Fallback) 지원
    // PC 브라우저는 앱 설치 가능 여부를 판단할 때 오프라인 상태에서도 start_url(index.html)이 열리는지 깐깐하게 검사합니다.
    if (event.request.mode === 'navigate' || url.pathname.endsWith('index.html') || url.pathname === '/' || url.pathname.endsWith('./')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    if (response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
                    }
                    return response;
                })
                .catch(() => {
                    // 네트워크가 끊겼을 때 데스크탑 브라우저가 무조건 캐시된 index.html을 반환받도록 강제 매핑 (설치 버튼 활성화의 핵심)
                    return caches.match(event.request).then((cachedResponse) => {
                        return cachedResponse || caches.match('index.html');
                    });
                })
        );
        return;
    }

    // 그 외 핵심 자산 (JS, CSS, Manifest)은 항상 최신 버전을 확인하는 네트워크 최우선 (Network-First) 전략
    const isCoreAsset = url.pathname.endsWith('script.js') || 
                        url.pathname.endsWith('style.css') || 
                        url.pathname.endsWith('manifest.json');

    if (isCoreAsset) {
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
        // 이미지 등 정적 자원은 로딩 속도를 극대화하는 캐시 최우선 (Cache-First) 전략
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

// 🚨 [핵심 수정] firbase 오타 완전 교정 완료 (authDomain, storageBucket)
const secureConfig = {
    apiKey: atob("QUl6YVN5QzducVFxRUpjRnBfamR5NHdWRzMzV1lYSWo1eFdKdVYw"),
    authDomain: atob("c3Rhci1ib2NrLmZpcmViYXNlYXBwLmNvbQ=="),
    databaseURL: atob("aHR0cHM6Ly9zdGFyLWJvY2stZGVmYXVsdC1ydGRiLmZpcmViYXNlaW8uY29t"), 
    projectId: atob("c3Rhci1ib2Nr"),
    storageBucket: atob("c3Rhci1ib2NrLmZpcmViYXNlc3RvcmFnZS5hcHA="),
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
        icon: "글_하은.png",
        badge: "글_하은.png",
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
