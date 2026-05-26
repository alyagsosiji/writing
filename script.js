// ==========================================
// 🔔 0-A. 모바일 및 PC 알림 커스텀 설정 항목
// ==========================================
const NOTIFICATION_CONFIG = {
    postTitle: "수평선 너머의 서재",
    postBody: "새로운 기록이 수평선 너머, 바다에 새겨졌습니다.",
    letterTitle: "수평선 너머의 서재",
    letterBody: "새로운 편지가 수평선 너머, 바다 위로 띄워졌습니다.",
    icon: "글_하은.jpg",                         
    badge: "글_하은.jpg",                        
    vibrate: [200, 100, 200]                 
};

// ==========================================
// 🎵 0-B. 음악 재생 목록 설정 배열
// ==========================================
const MY_MUSIC_LIST = [
    { title: "Night Sky City 2026 - Plum", src: "Night_Sky_City_2026_Plum.mp3" },
    { title: "Night Sky City 2026 - Plum", src: "Night_Sky_City_2026_Plum.mp3" },
];

let currentTrackIndex = 0;
let isTrackPlaying = false;
let audioEngine = new Audio();

// ==========================================
// 🔔 0-C. 푸시 알림 및 브라우저 알림 권한 시스템 (FCM 버전)
// ==========================================
function requestNotificationPermission() {
    if (!("Notification" in window) || !database) return;
    
    Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
            console.log('알림 권한 허용됨. 토큰 발급 시작...');
            const messaging = firebase.messaging();
            
            // 🚨 [핵심 패치] 깃허브 하위 폴더(/writing/)에서 우체부를 찾을 수 있도록 길 강제 안내
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.ready.then((registration) => {
                    messaging.getToken({ 
                        vapidKey: 'BP8mVTuhszB5HkdHqMC3Lo-flElm8Jj06TGct_qEdzhn30bmgxfYKlG8z0n2DE0BD6L_upJVfliSX9Ua0vCg5Pg',
                        serviceWorkerRegistration: registration 
                    })
                    .then((currentToken) => {
                        if (currentToken) {
                            console.log('발급된 기기 토큰:', currentToken);
                            const tokenKey = currentToken.replace(/[.#$\[\]]/g, '_');
                            database.ref('fcmTokens/' + tokenKey).set(currentToken);
                        } else {
                            console.log('토큰 발급 실패: 권한이 부족합니다.');
                        }
                    }).catch((err) => {
                        console.error('토큰 가져오기 에러 원인:', err);
                    });
                });
            }
        } else {
            console.log('사용자가 알림 권한을 차단했거나 무시했습니다.');
        }
    });
}

function sendNotification(title, body) {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    new Notification(title, { body: body, icon: NOTIFICATION_CONFIG.icon });
}

// ==========================================
// 🛠️ 0-D. 최우선 라이프 사이클 매니저
// ==========================================
function hideLoadingScreen() {
    const loader = document.getElementById('loading-screen');
    if (loader) loader.classList.add('fade-out');
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    hideLoadingScreen();
} else {
    document.addEventListener('DOMContentLoaded', hideLoadingScreen);
}

document.addEventListener('DOMContentLoaded', function() {
    try {
        if (localStorage.getItem('isAdminLoggedIn') === 'true') {
            isAdmin = true;
            loggedInUser = localStorage.getItem('loggedInUser') || ''; 
            requestNotificationPermission(); 
        }

        listenPosts();
        listenLetters();
        initMusicPlayerEngine(); 
        checkAndTriggerDailyBackup(); 
        updateUI(); 
    } catch (e) {
        console.error("엔진 로딩 예외 발생 : ", e);
        hideLoadingScreen();
    }
});

// 🔄 PWA 서비스 워커 안전 등록 및 실시간 업데이트 감지 엔진
let newWorker;
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('firebase-messaging-sw.js', { scope: './' }).then((reg) => {
            console.log('PWA 및 모바일 알림 통합 인프라 가동 완료:', reg.scope);
            
            if (typeof firebase !== 'undefined' && firebase.messaging) {
                firebase.messaging().useServiceWorker(reg);
            }
            
            reg.addEventListener('updatefound', () => {
                newWorker = reg.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        const updateToast = document.getElementById('update-toast');
                        if (updateToast) updateToast.classList.add('show');
                    }
                });
            });
        }).catch((err) => console.error('서비스 워커 등록 실패:', err));
    });

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
            refreshing = true;
            window.location.reload();
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const reloadBtn = document.getElementById('update-reload-btn');
    const dismissBtn = document.getElementById('update-dismiss-btn');
    const updateToast = document.getElementById('update-toast');

    if (reloadBtn) {
        reloadBtn.addEventListener('click', () => {
            if (updateToast) updateToast.classList.remove('show');
            if (newWorker) newWorker.postMessage({ action: 'skipWaiting' });
        });
    }
    if (dismissBtn) {
        dismissBtn.addEventListener('click', () => {
            if (updateToast) updateToast.classList.remove('show');
        });
    }
});

function initMusicPlayerEngine() {
    if (MY_MUSIC_LIST.length === 0) return;
    const playerTrigger = document.getElementById('mini-audio-trigger');
    loadTrack(currentTrackIndex);

    if (playerTrigger) playerTrigger.addEventListener('click', togglePlayPause);

    audioEngine.addEventListener('ended', () => {
        currentTrackIndex = (currentTrackIndex + 1) % MY_MUSIC_LIST.length;
        loadTrack(currentTrackIndex);
        audioEngine.play().then(() => {
            if (playerTrigger) playerTrigger.classList.add('playing');
        }).catch(() => {
            isTrackPlaying = false;
            if (playerTrigger) playerTrigger.classList.remove('playing');
        });
    });
}

function loadTrack(index) {
    if (index < 0 || index >= MY_MUSIC_LIST.length) return;
    audioEngine.src = MY_MUSIC_LIST[index].src;
}

function togglePlayPause() {
    const playerTrigger = document.getElementById('mini-audio-trigger');
    if (!playerTrigger) return;

    if (isTrackPlaying) {
        audioEngine.pause();
        isTrackPlaying = false;
        playerTrigger.classList.remove('playing');
    } else {
        audioEngine.play().then(() => {
            isTrackPlaying = true;
            playerTrigger.classList.add('playing');
        }).catch(err => {
            console.log("오디오 차단 해제 패치 가동");
        });
    }
}

function formatTo24Hour(dateStr) {
    if (!dateStr) return '';
    let str = String(dateStr).trim();
    str = str.replace(/\b24(?=:\d{2})/g, '00');
    if (str.includes('오전') || str.includes('오후')) {
        const isPm = str.includes('오후');
        str = str.replace(/오전\s*|오후\s*/g, ''); 
        str = str.replace(/(\d{1,2})(?=:\d{2})/, function(match) {
            let h = parseInt(match, 10);
            if (isPm) { if (h !== 12) h += 12; } else { if (h === 12) h = 0; }
            return String(h).padStart(2, '0');
        });
    }
    return str;
}

// 보안 시스템
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('dragstart', e => e.preventDefault());
document.addEventListener('selectstart', e => e.preventDefault());
document.addEventListener('keydown', function(e) {
    if (e.key === "F12") { e.preventDefault(); return false; }
    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) { e.preventDefault(); return false; }
    if (e.ctrlKey && e.key === 'u') { e.preventDefault(); return false; }
});

function decodeData(str) { return decodeURIComponent(escape(atob(str))); }

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

const secureAdmin = {
    id: decodeData("7JWE7Iuc"), 
    pw: atob("YXNoaSMyNjA0MTY=")        
};

let database = null;
try {
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(secureConfig); 
        database = firebase.database();
    } else {
        console.error("Firebase SDK가 로드되지 않았습니다.");
    }
} catch (error) {
    console.error("Firebase 초기화 중 에러 발생 : ", error);
}

let isAdmin = false;
let loggedInUser = ''; 
let currentView = 'posts'; 
let currentPage = 1;
const postsPerPage = 6;
let allPosts = [];
let allLetters = []; 
let editTargetKey = null; 
let searchKeyword = ''; 
let searchAuthor = 'all';
let isSubmitting = false;
let isInternalSyncAction = false; 

function showSystemAlert(message, callback) {
    const modalElem = document.getElementById('system-modal');
    if (document.getElementById('system-title')) document.getElementById('system-title').innerText = "안내";
    if (document.getElementById('system-message')) document.getElementById('system-message').innerText = message;
    if (document.getElementById('system-buttons')) {
        document.getElementById('system-buttons').innerHTML = "";
        const okBtn = document.createElement('button');
        okBtn.innerText = "확인";
        okBtn.onclick = function() {
            if (modalElem) modalElem.style.display = 'none';
            if (callback) callback();
        };
        document.getElementById('system-buttons').appendChild(okBtn);
    }
    if (modalElem) modalElem.style.display = 'flex';
}

function showSystemConfirm(message, onConfirm, onCancel) {
    const modalElem = document.getElementById('system-modal');
    if (document.getElementById('system-title')) document.getElementById('system-title').innerText = "확인";
    if (document.getElementById('system-message')) document.getElementById('system-message').innerText = message;
    if (document.getElementById('system-buttons')) {
        document.getElementById('system-buttons').innerHTML = "";
        const confirmBtn = document.createElement('button');
        confirmBtn.innerText = "확인";
        confirmBtn.onclick = function() {
            if (modalElem) modalElem.style.display = 'none';
            if (onConfirm) onConfirm();
        };
        const cancelBtn = document.createElement('button');
        cancelBtn.innerText = "취소";
        cancelBtn.className = "cancel-btn";
        cancelBtn.onclick = function() {
            if (modalElem) modalElem.style.display = 'none';
            if (onCancel) onCancel();
        };
        document.getElementById('system-buttons').appendChild(confirmBtn);
        document.getElementById('system-buttons').appendChild(cancelBtn);
    }
    if (modalElem) modalElem.style.display = 'flex';
}

function openModal() { if (document.getElementById('login-modal')) document.getElementById('login-modal').style.display = 'flex'; }
function closeModal() { if (document.getElementById('login-modal')) document.getElementById('login-modal').style.display = 'none'; }
function closeDetailModal() { if (document.getElementById('detail-modal')) { document.getElementById('detail-modal').style.display = 'none'; document.body.classList.remove('no-scroll'); } }
function openBackupModal() { if (!isAdmin) return; if (document.getElementById('backup-modal')) { document.getElementById('backup-modal').style.display = 'flex'; loadBackupTimelineList(); } }
function closeBackupModal() { if (document.getElementById('backup-modal')) document.getElementById('backup-modal').style.display = 'none'; }

function login() {
    const idElem = document.getElementById('admin-id');
    const pwElem = document.getElementById('admin-pw');
    if (!idElem || !pwElem) return;
    const inputId = idElem.value.trim();
    const inputPw = pwElem.value;
    const haeunId = decodeData("7ZWY7J2A"); 

    let tempUser = null;
    if (inputId === secureAdmin.id && inputPw === secureAdmin.pw) { tempUser = "아시"; }
    else if (inputId === haeunId && inputPw === atob("aGFldW4jMjYwNDE2")) { tempUser = "하은"; }

    if (tempUser) {
        isAdmin = true; loggedInUser = tempUser; 
        localStorage.setItem('isAdminLoggedIn', 'true');
        localStorage.setItem('loggedInUser', loggedInUser);
        closeModal();
        idElem.value = ''; pwElem.value = '';
        requestNotificationPermission();
        showSystemAlert(`환영합니다, 수평선 너머 바다의 기록자, ${loggedInUser}님.`, function() { updateUI(); });
    } else {
        showSystemAlert('올바른 접근이 아닙니다.');
    }
}

function logout() {
    isAdmin = false; loggedInUser = ''; 
    localStorage.removeItem('isAdminLoggedIn'); localStorage.removeItem('loggedInUser');
    cancelEdit();
    showSystemAlert('로그아웃 되었습니다.', function() { updateUI(); });
}

function updateUI() {
    const writeSection = document.getElementById('write-section');
    const letterSection = document.getElementById('letter-section');
    const loginBtn = document.getElementById('login-btn');
    const adminMenu = document.getElementById('admin-menu');
    const tabContainer = document.getElementById('view-tab-container');
    const currentUserBtn = document.getElementById('current-user-btn'); 
    const backupTrigger = document.getElementById('mini-backup-trigger');

    if (isAdmin) {
        if (writeSection) writeSection.style.display = 'block';
        if (letterSection) letterSection.style.display = 'none'; 
        if (loginBtn) loginBtn.style.display = 'none';
        if (adminMenu) adminMenu.style.display = 'flex'; 
        if (tabContainer) tabContainer.style.display = 'flex'; 
        if (currentUserBtn) currentUserBtn.innerText = `기록자 ${loggedInUser}님`; 
        if (backupTrigger) backupTrigger.style.display = 'flex'; 
        switchView(currentView);
    } else {
        if (writeSection) writeSection.style.display = 'none';
        if (letterSection) letterSection.style.display = 'block'; 
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (adminMenu) adminMenu.style.display = 'none';
        if (tabContainer) tabContainer.style.display = 'none'; 
        if (backupTrigger) backupTrigger.style.display = 'none'; 
        switchView('posts'); 
    }
}

function switchView(view) {
    if (!isAdmin && view === 'letters') { currentView = 'posts'; return; }
    currentView = view; currentPage = 1;
    const tabPosts = document.getElementById('tab-posts');
    const tabLetters = document.getElementById('tab-letters');
    const mainTitle = document.getElementById('section-main-title');
    if (tabPosts) tabPosts.classList.remove('active');
    if (tabLetters) tabLetters.classList.remove('active');
    if(view === 'posts') {
        if (tabPosts) tabPosts.classList.add('active');
        if (mainTitle) mainTitle.innerText = "바다의 기록";
    } else {
        if (tabLetters) tabLetters.classList.add('active');
        if (mainTitle) mainTitle.innerText = "띄워진 편지";
    }
    renderUI();
}

function handleSearch() {
    searchKeyword = document.getElementById('search-input') ? document.getElementById('search-input').value.trim() : '';
    searchAuthor = document.getElementById('author-filter') ? document.getElementById('author-filter').value : 'all';
    currentPage = 1; renderUI();
}

let rawPostsSnapshot = null;
let rawLettersSnapshot = null;
let isInitialPostLoad = true;
let knownPostIds = new Set();

function listenPosts() {
    if (!database) return;
    database.ref('posts').on('value', (snapshot) => {
        rawPostsSnapshot = snapshot.val();
        allPosts = []; let currentIds = new Set(); let hasNewPost = false;
        if (rawPostsSnapshot) {
            Object.keys(rawPostsSnapshot).forEach((key) => {
                allPosts.push({ id: key, ...rawPostsSnapshot[key] });
                currentIds.add(key);
                if (!isInitialPostLoad && !knownPostIds.has(key)) hasNewPost = true;
            });
            allPosts.reverse(); 
        }
        if (!isInitialPostLoad && !isInternalSyncAction) executeCloudBackupEngine(true);
        if (hasNewPost && isAdmin && !isSubmitting) {
            sendNotification(NOTIFICATION_CONFIG.postTitle, NOTIFICATION_CONFIG.postBody);
        }
        knownPostIds = currentIds; isInitialPostLoad = false;
        if(currentView === 'posts') renderUI();
    });
}

let knownLetterIds = new Set();
let isInitialLetterLoad = true;

function listenLetters() {
    if (!database) return;
    database.ref('letters').on('value', (snapshot) => {
        rawLettersSnapshot = snapshot.val();
        allLetters = []; let currentIds = new Set(); let hasNewLetter = false;
        if (rawLettersSnapshot) {
            Object.keys(rawLettersSnapshot).forEach((key) => {
                allLetters.push({ id: key, ...rawLettersSnapshot[key] });
                currentIds.add(key);
                if (!isInitialLetterLoad && !knownLetterIds.has(key)) hasNewLetter = true;
            });
            allLetters.reverse();
        }
        if (!isInitialLetterLoad && !isInternalSyncAction) executeCloudBackupEngine(true);
        if (hasNewLetter && isAdmin && !isSubmitting) {
            sendNotification(NOTIFICATION_CONFIG.letterTitle, NOTIFICATION_CONFIG.letterBody);
        }
        knownLetterIds = currentIds; isInitialLetterLoad = false;
        if(currentView === 'letters') renderUI();
    });
}

const CONTEXT_RETENTION_PERIOD = 30 * 24 * 60 * 60 * 1000;

// 🚨 [트래픽 최적화] 메타데이터(backups)와 실제 데이터(backupData) 분리 저장 엔진
function executeCloudBackupEngine(isAutomatic = true) {
    if (!database) return;
    const now = new Date(); const timestamp = now.getTime();
    const dateString = `${now.getFullYear()}. ${now.getMonth() + 1}. ${now.getDate()}. ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    // 카운트 계산
    const pCount = rawPostsSnapshot ? Object.keys(rawPostsSnapshot).length : 0;
    const lCount = rawLettersSnapshot ? Object.keys(rawLettersSnapshot).length : 0;

    // 가벼운 목차 정보
    const backupMeta = { timestamp: timestamp, date: dateString, type: isAutomatic ? "자동" : "수동", pCount: pCount, lCount: lCount };
    // 무거운 텍스트 덩어리
    const backupPayload = { posts: rawPostsSnapshot || {}, letters: rawLettersSnapshot || {} };

    const newBackupRef = database.ref('backups').push();
    const backupKey = newBackupRef.key;

    // 두 곳에 동시에 안전하게 저장
    Promise.all([
        newBackupRef.set(backupMeta),
        database.ref(`backupData/${backupKey}`).set(backupPayload)
    ]).then(() => { 
        cleanExpiredBackupsTimeline(); 
    }).catch(err => console.error(err));
}

// 🚨 [트래픽 최적화] 서버 측에서 만료된 데이터만 골라내어 삭제
function cleanExpiredBackupsTimeline() {
    if (!database) return;
    const expirationThreshold = new Date().getTime() - CONTEXT_RETENTION_PERIOD;
    
    database.ref('backups').orderByChild('timestamp').endAt(expirationThreshold).once('value').then((snapshot) => {
        const expiredBackups = snapshot.val(); 
        if (!expiredBackups) return;
        
        Object.keys(expiredBackups).forEach((key) => { 
            // 메타데이터와 실제 데이터를 모두 소멸
            database.ref(`backups/${key}`).remove(); 
            database.ref(`backupData/${key}`).remove(); 
        });
    });
}

function checkAndTriggerDailyBackup() {
    if (!database) return;
    database.ref('backups').orderByChild('timestamp').limitToLast(1).once('value').then((snapshot) => {
        let lastBackupTimestamp = 0;
        if (snapshot.exists()) {
            snapshot.forEach((child) => {
                lastBackupTimestamp = child.val().timestamp || 0;
            });
        }
        const now = new Date().getTime();
        const ONE_DAY = 24 * 60 * 60 * 1000; 
        
        if (now - lastBackupTimestamp >= ONE_DAY) {
            console.log("[스케줄러] 마지막 안전 백업 지점으로부터 1일이 경과하여 일일 자동 백업을 집행합니다.");
            executeCloudBackupEngine(true);
        }
    }).catch(err => console.error("일일 정기 백업 프로세스 조회 실패:", err));
}

function triggerManualBackup() { if (!isAdmin) return; executeCloudBackupEngine(false); showSystemAlert('모든 상태 스냅샷을 안전하게 기록했습니다.'); loadBackupTimelineList(); }

// ==========================================
// 💡 백업 다중 선택 및 삭제 매니저
// ==========================================
function toggleAllBackups(source) {
    const checkboxes = document.querySelectorAll('.backup-checkbox');
    checkboxes.forEach(cb => cb.checked = source.checked);
}

function selectBackupsByPeriod(days) {
    const checkboxes = document.querySelectorAll('.backup-checkbox');
    const selectAllCb = document.getElementById('backup-select-all');
    if(selectAllCb) selectAllCb.checked = false;

    if (!days) {
        checkboxes.forEach(cb => cb.checked = false);
        return;
    }
    
    const now = new Date().getTime();
    const threshold = days === 'all' ? now + 999999999 : now - (parseInt(days) * 24 * 60 * 60 * 1000);
    
    let allChecked = true;
    checkboxes.forEach(cb => {
        const ts = parseInt(cb.getAttribute('data-timestamp'));
        if (days === 'all') {
            cb.checked = true;
        } else {
            cb.checked = ts < threshold; 
        }
        if(!cb.checked) allChecked = false;
    });
    
    if (selectAllCb) selectAllCb.checked = allChecked;
}

function deleteSelectedBackups() {
    if (!isAdmin || !database) return;
    const checkboxes = document.querySelectorAll('.backup-checkbox:checked');
    const keysToDelete = Array.from(checkboxes).map(cb => cb.value);
    
    if (keysToDelete.length === 0) {
        showSystemAlert('소멸시킬 백업 지점을 선택해주세요.');
        return;
    }

    showSystemConfirm(`선택하신 ${keysToDelete.length}개의 백업 기록을 영구히 소멸시키겠습니까?\n(이 작업은 되돌릴 수 없습니다)`, function() {
        // 🚨 선택한 백업의 메타데이터와 실제 덩어리 데이터를 모두 지움
        const deletePromises = keysToDelete.map(key => {
            return Promise.all([
                database.ref(`backups/${key}`).remove(),
                database.ref(`backupData/${key}`).remove()
            ]);
        });
        
        Promise.all(deletePromises).then(() => {
            showSystemAlert('선택한 백업이 바다에서 성공적으로 소멸되었습니다.');
            loadBackupTimelineList(); 
        }).catch(err => {
            console.error("백업 소멸 에러:", err);
            showSystemAlert('백업 소멸 중 오류가 발생했습니다.');
        });
    });
}

// 🚨 [트래픽 최적화 + UI 패치 적용] 백업 로드 함수
function loadBackupTimelineList() {
    const wrapper = document.querySelector('.backup-timeline-wrapper');
    const container = document.getElementById('backup-list-container'); 
    if (!container || !database) return; 
    container.innerHTML = '';

    let controlsWrapper = document.getElementById('backup-delete-controls');
    if (!controlsWrapper && wrapper) {
        controlsWrapper = document.createElement('div');
        controlsWrapper.id = 'backup-delete-controls';
        controlsWrapper.style.display = 'none'; 
        controlsWrapper.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; padding:0 5px;">
                <label style="font-size:0.85rem; color:#cbd5e1; display:flex; align-items:center; gap:6px; cursor:pointer;">
                    <input type="checkbox" id="backup-select-all" onclick="toggleAllBackups(this)" style="accent-color:#f7a37f; width:15px; height:15px; margin:0; cursor:pointer;"> 
                    <span style="line-height:1;">전체 선택</span>
                </label>
                <div style="display:flex; gap:8px;">
                    <select id="backup-period-select" onchange="selectBackupsByPeriod(this.value)" style="background:rgba(3,10,23,0.8); border:1px solid rgba(247,163,127,0.3); color:#fff; padding:4px 8px; border-radius:6px; font-size:0.75rem; outline:none; cursor:pointer;">
                        <option value="">기간 선택 지우기</option>
                        <option value="7">7일 이전 기록</option>
                        <option value="14">14일 이전 기록</option>
                        <option value="all">모두 선택</option>
                    </select>
                    <button onclick="deleteSelectedBackups()" class="danger-btn" style="padding:4px 12px; font-size:0.75rem; border-radius:6px;">선택 소멸</button>
                </div>
            </div>
        `;
        wrapper.insertBefore(controlsWrapper, wrapper.firstChild);
    } else if (controlsWrapper) {
        const selectAllCb = document.getElementById('backup-select-all');
        if(selectAllCb) selectAllCb.checked = false;
        const periodSelect = document.getElementById('backup-period-select');
        if(periodSelect) periodSelect.value = "";
        controlsWrapper.style.display = 'none';
    }

    if (document.getElementById('backup-loading-msg')) document.getElementById('backup-loading-msg').style.display = 'block';
    const expirationThreshold = new Date().getTime() - CONTEXT_RETENTION_PERIOD;
    
    // 이 backups 노드는 이제 메타데이터(수십 바이트)만 담겨 있으므로 불러와도 트래픽을 차지하지 않음.
    database.ref('backups').once('value').then((snapshot) => {
        if (document.getElementById('backup-loading-msg')) document.getElementById('backup-loading-msg').style.display = 'none';
        const backups = snapshot.val(); 
        
        if (!backups) { 
            container.innerHTML = `<p style="color:#94a3b8; font-size:0.85rem; padding: 20px 0;">복구 지점이 없습니다.</p>`; 
            return; 
        }

        const keys = Object.keys(backups).filter(key => backups[key].timestamp >= expirationThreshold).reverse();
        if (keys.length === 0) {
            container.innerHTML = `<p style="color:#94a3b8; font-size:0.85rem; padding: 20px 0;">복구 지점이 없습니다.</p>`; 
            return; 
        }

        if (controlsWrapper) controlsWrapper.style.display = 'block';

        keys.forEach((key) => {
            const item = backups[key];
            // 구버전 백업과 신버전(메타 분리) 백업 간의 호환성 100% 대응
            const pCount = item.pCount !== undefined ? item.pCount : (item.posts ? Object.keys(item.posts).length : 0); 
            const lCount = item.lCount !== undefined ? item.lCount : (item.letters ? Object.keys(item.letters).length : 0);
            const badgeClass = item.type === "자동" ? "auto" : "manual";
            
            const element = document.createElement('div'); element.className = 'backup-item';
            // 🚨 리스트 내 체크박스도 위치 고정을 위해 margin 강제 패치
            element.innerHTML = `
                <div style="display:flex; align-items:center; width:100%;">
                    <input type="checkbox" class="backup-checkbox" value="${key}" data-timestamp="${item.timestamp}" style="margin-right:12px; margin-top:0; margin-bottom:0; accent-color:#f7a37f; width:16px; height:16px; cursor:pointer; flex-shrink:0;">
                    <div class="backup-meta" style="flex-grow: 1; padding-right: 10px;">
                        <div class="backup-time-title">${item.date} <span class="backup-badge-type ${badgeClass}">${item.type}</span></div>
                        <div class="backup-counts">글 ${pCount}개 ㅣ 편지 ${lCount}개</div>
                    </div>
                    <button onclick="restoreFromTargetBackupPoint('${key}')" style="font-size:0.75rem; border-color:#f7a37f; color:#f7a37f; padding: 4px 12px; border-radius:6px; flex-shrink:0;">복구</button>
                </div>
            `;
            container.appendChild(element);
        });
    });
}

// 🚨 [트래픽 최적화] 복구를 클릭했을 때만 무거운 실제 데이터를 다운로드 받음
function restoreFromTargetBackupPoint(key) {
    if (!isAdmin || !database) return;
    showSystemConfirm('선택하신 시점으로 바다 데이터를 덮어씌워 복구하시겠습니까?', function() {
        
        // 1. 새롭게 분리된 무거운 데이터 저장소(backupData)에서 먼저 찾음
        database.ref(`backupData/${key}`).once('value').then((snapshot) => {
            let targetBackup = snapshot.val(); 
            
            if (!targetBackup) {
                // 2. 만약 없다면 과거에 저장했던 통짜 무거운 백업(backups)에서 찾음 (과거 백업 복구용)
                database.ref(`backups/${key}`).once('value').then((oldSnap) => {
                    executeRestore(oldSnap.val());
                });
            } else {
                executeRestore(targetBackup);
            }
        });
    });
}

// 복구 처리 엔진
function executeRestore(targetBackup) {
    if (!targetBackup) return;
    isInternalSyncAction = true;
    Promise.all([
        database.ref('posts').set(targetBackup.posts || null), 
        database.ref('letters').set(targetBackup.letters || null)
    ]).then(() => {
        showSystemAlert('수평선 너머 바다가 완전 복원되었습니다.', function() { isInternalSyncAction = false; closeBackupModal(); });
    });
}

function scrollToPosts() {
    const postsSection = document.getElementById('posts-section');
    if (postsSection) { const yOffset = postsSection.getBoundingClientRect().top + window.scrollY - 40; window.scrollTo({ top: yOffset, behavior: 'smooth' }); }
}

function renderUI() {
    const container = document.getElementById('posts-container'); const paginationContainer = document.getElementById('pagination-container');
    const subtitleElem = document.querySelector('.section-subtitle'); const authorStatsContainer = document.getElementById('author-stats'); const authorFilterContainer = document.getElementById('author-filter-container');
    if (!container || !paginationContainer) return; container.innerHTML = ''; paginationContainer.innerHTML = '';

    if (subtitleElem) {
        if (currentView === 'posts') { subtitleElem.innerHTML = `아래 바다에 기록된 글들을 클릭하여 읽어주세요!<br><span style="color: #90e0ef; font-size: 0.85rem; display: inline-block; margin-top: 9px;">총 기록된 글 : ${allPosts.length}개</span>`; } 
        else { subtitleElem.innerHTML = `수평선 너머 바다 위에 띄워진 편지들.<br><span style="color: #ffd4ba; font-size: 0.85rem; display: inline-block; margin-top: 9px;">띄워진 편지 : ${allLetters.length}개</span>`; }
    }

    if (currentView === 'posts') {
        if (authorStatsContainer) authorStatsContainer.style.display = 'flex'; if (authorFilterContainer) authorFilterContainer.style.display = 'block';
        let ashiCount = 0; let haeunCount = 0; allPosts.forEach(post => { if ((post.author || "").includes("하은")) haeunCount++; else ashiCount++; });
        if (authorStatsContainer) authorStatsContainer.innerHTML = `<span class="stat-badge">아시 : ${ashiCount}개</span><span class="stat-badge">하은 : ${haeunCount}개</span>`;
    } else {
        if (authorStatsContainer) authorStatsContainer.style.display = 'none'; if (authorFilterContainer) authorFilterContainer.style.display = 'none';
    }

    let targetArray = (currentView === 'posts') ? allPosts : allLetters;
    if (currentView === 'posts' && searchAuthor !== 'all') {
        targetArray = targetArray.filter(item => { const author = item.author || "기록자"; return searchAuthor === "하은" ? author.includes("하은") : !author.includes("하은"); });
    }
    if (searchKeyword) targetArray = targetArray.filter(item => String(item.title).toLowerCase().includes(searchKeyword.toLowerCase()));

    if (targetArray.length === 0) { container.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color:#94a3b8; margin-top:40px;">존재하지 않습니다.</p>`; return; }

    const totalPages = Math.ceil(targetArray.length / postsPerPage);
    const currentItems = targetArray.slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage);

    currentItems.forEach((item) => {
        const card = document.createElement('div'); card.className = 'post-card'; card.onclick = () => openDetailModal(item.id);
        let mgmtButtonsHtml = '';
        if (isAdmin) {
            mgmtButtonsHtml = currentView === 'posts' 
                ? `<div class="card-mgmt-btns"><button class="mgmt-btn" onclick="event.stopPropagation(); prepareEdit('${item.id}')">수정</button><button class="mgmt-btn danger-btn" onclick="event.stopPropagation(); deletePost('${item.id}')">소멸</button></div>`
                : `<div class="card-mgmt-btns"><button class="mgmt-btn danger-btn" onclick="event.stopPropagation(); deleteLetter('${item.id}')">소멸</button></div>`;
        }
        const displayDate = (currentView === 'posts') ? `${item.author || "기록자"} | ${formatTo24Hour(item.date)}` : formatTo24Hour(item.date);
        card.innerHTML = `<h3>${escapeHtml(item.title)}</h3><div class="post-content-area">${escapeHtml(item.content)}</div><div class="post-footer"><span class="date">${displayDate}</span>${mgmtButtonsHtml}</div>`;
        container.appendChild(card);
    });

    if (totalPages > 1) {
        const maxPageButtons = 5; 
        const currentGroup = Math.ceil(currentPage / maxPageButtons);
        let startPage = (currentGroup - 1) * maxPageButtons + 1;
        let endPage = Math.min(currentGroup * maxPageButtons, totalPages);
        
        if (startPage > 1) {
            const prevBtn = document.createElement('div'); prevBtn.className = 'page-btn'; prevBtn.innerHTML = '&#139;';
            prevBtn.onclick = () => { 
                currentPage = startPage - 1; 
                renderUI(); 
                scrollToPosts(); 
            }; 
            paginationContainer.appendChild(prevBtn);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const btn = document.createElement('div'); btn.className = `page-btn ${i === currentPage ? 'active' : ''}`; btn.innerText = i;
            btn.onclick = () => { currentPage = i; renderUI(); scrollToPosts(); }; paginationContainer.appendChild(btn);
        }
        
        if (endPage < totalPages) {
            const nextBtn = document.createElement('div'); nextBtn.className = 'page-btn'; nextBtn.innerHTML = '&#155;';
            nextBtn.onclick = () => { 
                currentPage = endPage + 1; 
                renderUI(); 
                scrollToPosts(); 
            }; 
            paginationContainer.appendChild(nextBtn);
        }
    }
}

function openDetailModal(key) {
    if (!isAdmin && currentView === 'letters') return;
    const item = ((currentView === 'posts') ? allPosts : allLetters).find(p => p.id === key); if (!item) return;
    if (document.getElementById('detail-title')) document.getElementById('detail-title').innerHTML = escapeHtml(item.title);
    if (document.getElementById('detail-date')) document.getElementById('detail-date').innerText = formatTo24Hour(item.date);
    if (document.getElementById('detail-text')) document.getElementById('detail-text').innerHTML = escapeHtml(item.content); 
    if (document.getElementById('detail-modal')) { document.getElementById('detail-modal').style.display = 'flex'; document.body.classList.add('no-scroll'); }
}

function savePost() {
    if (!isAdmin || !database || isSubmitting) return;
    const title = document.getElementById('post-title')?.value.trim(); const content = document.getElementById('post-content')?.value.trim();
    if (!title || !content) { showSystemAlert('내용을 모두 입력해주세요.'); return; }
    const now = new Date(); const date = `${now.getFullYear()}. ${now.getMonth() + 1}. ${now.getDate()}. ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    isSubmitting = true; const postData = { title: title, content: content, date: date, author: loggedInUser };
    if (editTargetKey) { database.ref('posts/' + editTargetKey).update(postData).then(() => { showSystemAlert('기록이 수정되었습니다.'); cancelEdit(); }).finally(() => { isSubmitting = false; }); } 
    else { database.ref('posts').push(postData).then(() => { document.getElementById('post-title').value = ''; document.getElementById('post-content').value = ''; currentPage = 1; showSystemAlert('성공적으로 새겨졌습니다.'); }).finally(() => { isSubmitting = false; }); }
}

function saveLetter() {
    if (!database || isSubmitting) return;
    const title = document.getElementById('letter-title')?.value.trim(); const content = document.getElementById('letter-content')?.value.trim();
    if (!title || !content) { showSystemAlert('제목과 내용을 모두 채워주세요.'); return; }
    if (document.getElementById('agree-terms') && !document.getElementById('agree-terms').checked) { showSystemAlert('안내 및 약관에 동의해주세요.'); return; }
    const now = new Date(); const date = `${now.getFullYear()}. ${now.getMonth() + 1}. ${now.getDate()}. ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    isSubmitting = true; const letterData = { title: title, content: content, date: date };
    database.ref('letters').push(letterData).then(() => {
        document.getElementById('letter-title').value = ''; document.getElementById('letter-content').value = ''; if (document.getElementById('agree-terms')) document.getElementById('agree-terms').checked = false;
        showSystemAlert('편지가 바다 위로 안전하게 띄워졌습니다.'); currentPage = 1; renderUI();
    }).finally(() => { isSubmitting = false; });
}

function prepareEdit(key) {
    const post = allPosts.find(p => p.id === key); if (!post) return; editTargetKey = key;
    if (document.getElementById('write-title')) document.getElementById('write-title').innerText = "기록 수정하기";
    if (document.getElementById('post-title')) document.getElementById('post-title').value = post.title;
    if (document.getElementById('post-content')) document.getElementById('post-content').value = post.content;
    if (document.getElementById('submit-post-btn')) document.getElementById('submit-post-btn').innerText = "수정하기";
    if (document.getElementById('cancel-edit-btn')) document.getElementById('cancel-edit-btn').style.display = "inline-block";
    if (document.getElementById('write-section')) document.getElementById('write-section').scrollIntoView({ behavior: 'smooth' });
}

function cancelEdit() {
    editTargetKey = null;
    if (document.getElementById('write-title')) document.getElementById('write-title').innerText = "새로운 기록 남기기";
    if (document.getElementById('post-title')) document.getElementById('post-title').value = '';
    if (document.getElementById('post-content')) document.getElementById('post-content').value = '';
    if (document.getElementById('submit-post-btn')) document.getElementById('submit-post-btn').innerText = "기록하기";
    if (document.getElementById('cancel-edit-btn')) document.getElementById('cancel-edit-btn').style.display = "none";
}

function deletePost(key) {
    if (!isAdmin || !database) return;
    showSystemConfirm('이 기록을 완전히 소멸시키겠습니까?', function() {
        if(editTargetKey === key) cancelEdit();
        database.ref('posts/' + key).remove().then(() => { const totalPagesAfterDelete = Math.ceil((allPosts.length - 1) / postsPerPage); if (currentPage > totalPagesAfterDelete && currentPage > 1) currentPage = totalPagesAfterDelete; });
    });
}

function deleteLetter(key) {
    if (!isAdmin || !database) return;
    showSystemConfirm('이 편지를 바다에서 완전히 소멸시키겠습니까?', function() {
        database.ref('letters/' + key).remove().then(() => { const totalPagesAfterDelete = Math.ceil((allLetters.length - 1) / postsPerPage); if (currentPage > totalPagesAfterDelete && currentPage > 1) currentPage = totalPagesAfterDelete; });
    });
}

function clearDatabase() {
    if (!isAdmin || !database) return;
    showSystemConfirm('🚨 모든 기록들이 사라집니다. 초기화할까요?', function() {
        setTimeout(function() {
            showSystemConfirm('정말 소멸시킬까요?', function() { Promise.all([database.ref('posts').remove(), database.ref('letters').remove()]).then(() => { cancelEdit(); currentPage = 1; showSystemAlert('초기 상태가 되었습니다.'); }); });
        }, 150);
    });
}

function escapeHtml(text) { return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"); }
