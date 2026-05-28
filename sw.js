/* sw.js - 로딩 정체 및 버튼 먹통 방지 최종 고도화 버전 */
const CACHE_NAME = 'we-final-v4'; // 버전을 갱신하여 브라우저의 구버전 캐시를 강제로 밀어냅니다.
const ASSETS_TO_CACHE = [
    './',
    'index.html',
    'style.css',
    'script.js',
    'manifest.json',
    '글_하은.png'
];

// 1. 서비스 워커 설치 및 초기 자산 캐싱
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        }).then(() => self.skipWaiting())
    );
});

// 2. 구버전 캐시 및 쓸데없는 찌꺼기 즉시 삭제 (버튼 먹통 방지)
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

// 3. ⚡ 핵심 인터셉터 가동 (네트워크 최우선 전략으로 로딩 멈춤 현상 원천 차단)
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // GET 요청이 아니거나 http/https 프로토콜이 아니면 즉시 가로채기 해제 (mailto, 외부 확장프로그램 호환)
    if (event.request.method !== 'GET' || !url.protocol.startsWith('http')) {
        return;
    }

    // 음악 파일(BGM) 스트리밍 에러 방지를 위해 무조건 네트워크로 직접 패스
    if (event.request.destination === 'audio' || url.pathname.endsWith('.mp3') || url.pathname.endsWith('.wav')) {
        return;
    }

    // 외부 아이콘(FontAwesome) 및 구글 폰트가 서비스 워커 때문에 깨져서 JS가 멈추는 현상 방지
    if (url.hostname.includes('cdnjs.cloudflare.com') || url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
        event.respondWith(
            fetch(event.request).catch(() => caches.match(event.request))
        );
        return;
    }

    // [핵심/Pro 모드] 네비게이션 요청(PC 앱 설치 요건) 및 코어 파일 처리 로직
    const isCoreFile = event.request.mode === 'navigate' || 
                       url.pathname.endsWith('index.html') || 
                       url.pathname.endsWith('script.js') || 
                       url.pathname.endsWith('style.css') || 
                       url.pathname === '/' || 
                       url.pathname.endsWith('./');

    if (isCoreFile) {
        // 🌐 온라인이면 언제나 새 파일을 가져오고, 완전히 오프라인일 때만 캐시를 열어 멈춤 현상을 방지합니다.
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
                    // 데스크탑 PWA 요건 충족을 위한 오프라인 폴백 처리
                    return caches.match(event.request).then((cachedResponse) => {
                        return cachedResponse || caches.match('index.html');
                    });
                })
        );
    } else {
        // 이미지는 속도를 위해 캐시 우선 전략 적용
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

importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

// script.js에 있던 암호화된 Firebase 접속 정보를 똑같이 가져옵니다.
const secureConfig = {
    apiKey: atob("QUl6YVN5QzducVFxRUpjRnBfamR5NHdWRzMzV1lYSWo1eFdKdVYw"),
    authDomain: atob("c3Rhci1ib2NrLmZpcmBiYXNlYXBwLmNvbQ=="),
    databaseURL: atob("aHR0cHM6Ly9zdGFyLWJvY2stZGVmYXVsdC1ydGRiLmZpcmViYXNlaW8uY29t"), 
    projectId: atob("c3Rhci1ib2Nr"),
    storageBucket: atob("c3Rhci1ib2NrLmZpcmViYXNlc3RvcmFnZS5hcHA="),
    messagingSenderId: atob("MzUxNTA3Nzg0NzE3"),
    appId: atob("MTozNTE1MDc3ODQ3MTc6d2ViOmUyMmJiNTcxOGMwZWJmYmQzY2ExNDQ="),
    measurementId: atob("Ry0zRU03OTQ3OUpU")
};

firebase.initializeApp(secureConfig);
const messaging = firebase.messaging();

// 💡 백그라운드 상태(앱이 꺼져있을 때)에서 알림을 수신하는 엔진
messaging.onBackgroundMessage((payload) => {
    console.log('[sw.js] 백그라운드 푸시 알림 수신: ', payload);

    const notificationTitle = payload.notification.title || "수평선 너머의 서재";
    const notificationOptions = {
        body: payload.notification.body,
        icon: "글_하은.png",
        badge: "멘헤라_하은.png",
        vibrate: [200, 100, 200]
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// 앞서 추가했던 업데이트 새로고침 기능 유지
self.addEventListener('message', (event) => {
    if (event.data && event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});
