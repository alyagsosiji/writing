// ==========================================
// 🔔 0-A. 모바일 및 PC 알림 커스텀 설정 항목
// ==========================================
const NOTIFICATION_CONFIG = {
    postTitle: "수평선 너머의 서재",
    postBody: "새로운 기록이 수평선 너머, 바다에 새겨졌습니다.",
    letterTitle: "수평선 너머의 서재",
    letterBody: "수평선 너머, 바다 위로 새로운 편지가 띄워졌습니다.",
    icon: "하은.jpg",                         
    badge: "하은.jpg",                        
    vibrate: [200, 100, 200]                 
};
//.
// ==========================================
// 🎵 0-B. 음악 재생 목록 설정 배열 (아시님 커스텀 트랙)
// ==========================================
const MY_MUSIC_LIST = [
    { title: "Night Sky City 2026 - Plum", src: "Night_Sky_City_2026_Plum.mp3" },
    { title: "Night Sky City 2026 - Plum", src: "Night_Sky_City_2026_Plum.mp3" },
];

let currentTrackIndex = 0;
let isTrackPlaying = false;
let audioEngine = new Audio();

// ==========================================
// 🔔 0-C. 푸시 알림 및 브라우저 알림 권한 시스템
// ==========================================
function requestNotificationPermission() {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                sendNotification(NOTIFICATION_CONFIG.postTitle, "알림이 성공적으로 활성화되었습니다.");
            }
        });
    }
}

function sendNotification(title, body) {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(function(registration) {
                registration.showNotification(title, {
                    body: body,
                    icon: NOTIFICATION_CONFIG.icon,
                    badge: NOTIFICATION_CONFIG.badge,
                    vibrate: NOTIFICATION_CONFIG.vibrate
                });
            }).catch(function() {
                new Notification(title, { body: body, icon: NOTIFICATION_CONFIG.icon });
            });
        } else {
            new Notification(title, { body: body, icon: NOTIFICATION_CONFIG.icon });
        }
    }
}

// ==========================================
// 🛠️ 0-D. 최우선 라이프 사이클 매니저 (서비스 워커 등록단 보존)
// ==========================================
function hideLoadingScreen() {
    const loader = document.getElementById('loading-screen');
    if (loader) {
        loader.classList.add('fade-out');
    }
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    hideLoadingScreen();
} else {
    document.addEventListener('DOMContentLoaded', hideLoadingScreen);
}

document.addEventListener('DOMContentLoaded', function() {
    try {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(reg => console.log('모바일 알림 인프라 가동 완료 : ', reg.scope))
                .catch(err => console.error('모바일 알림 인프라 에러 : ', err));
        }

        if (localStorage.getItem('isAdminLoggedIn') === 'true') {
            isAdmin = true;
            loggedInUser = localStorage.getItem('loggedInUser') || ''; 
            requestNotificationPermission(); 
        }

        listenPosts();
        listenLetters();
        initMusicPlayerEngine(); 
        
        updateUI(); 
    } catch (e) {
        console.error("데이터 실시간 리스닝 및 엔진 로딩 중 예외 발생 : ", e);
        hideLoadingScreen();
    }
});

function initMusicPlayerEngine() {
    if (MY_MUSIC_LIST.length === 0) return;
    const playerTrigger = document.getElementById('mini-audio-trigger');
    loadTrack(currentTrackIndex);

    if (playerTrigger) {
        playerTrigger.addEventListener('click', togglePlayPause);
    }

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
            console.log("인터랙션 보호 오디오 차단 해제 패치 가동");
        });
    }
}

// ==========================================
// ⏱️ 24시간 형식 무결성 보정 엔진
// ==========================================
function formatTo24Hour(dateStr) {
    if (!dateStr) return '';
    let str = String(dateStr).trim();
    
    str = str.replace(/\b24(?=:\d{2})/g, '00');
    
    if (str.includes('오전') || str.includes('오후')) {
        const isPm = str.includes('오후');
        str = str.replace(/오전\s*|오후\s*/g, ''); 
        
        str = str.replace(/(\d{1,2})(?=:\d{2})/, function(match) {
            let h = parseInt(match, 10);
            if (isPm) {
                if (h !== 12) h += 12;
            } else {
                if (h === 12) h = 0;
            }
            return String(h).padStart(2, '0');
        });
    }
    return str;
}

// ==========================================
// 1. 보안 인프라 (우클릭, 드래그, 개발자 단축키 차단)
// ==========================================
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('dragstart', e => e.preventDefault());
document.addEventListener('selectstart', e => e.preventDefault());
document.addEventListener('keydown', function(e) {
    if (e.key === "F12") { e.preventDefault(); return false; }
    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) { e.preventDefault(); return false; }
    if (e.ctrlKey && e.key === 'u') { e.preventDefault(); return false; }
});

// ==========================================
// 2. Base64 데이터 해독 및 무결성 Firebase 연결
// ==========================================
function decodeData(str) { return decodeURIComponent(escape(atob(str))); }

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

let isSubmitting = false;

// 실시간 자동 분산 복구 백업 시스템 제어용 인터셉터 잠금 플래그
let isInternalSyncAction = false; 

function showSystemAlert(message, callback) {
    const titleElem = document.getElementById('system-title');
    const msgElem = document.getElementById('system-message');
    const btnContainer = document.getElementById('system-buttons');
    const modalElem = document.getElementById('system-modal');

    if (titleElem) titleElem.innerText = "안내";
    if (msgElem) msgElem.innerText = message;
    
    if (btnContainer) {
        btnContainer.innerHTML = "";
        const okBtn = document.createElement('button');
        okBtn.innerText = "확인";
        okBtn.onclick = function() {
            if (modalElem) modalElem.style.display = 'none';
            if (callback) callback();
        };
        btnContainer.appendChild(okBtn);
    }
    if (modalElem) modalElem.style.display = 'flex';
}

function showSystemConfirm(message, onConfirm, onCancel) {
    const titleElem = document.getElementById('system-title');
    const msgElem = document.getElementById('system-message');
    const btnContainer = document.getElementById('system-buttons');
    const modalElem = document.getElementById('system-modal');

    if (titleElem) titleElem.innerText = "확인";
    if (msgElem) msgElem.innerText = message;
    
    if (btnContainer) {
        btnContainer.innerHTML = "";
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
        
        btnContainer.appendChild(confirmBtn);
        btnContainer.appendChild(cancelBtn);
    }
    if (modalElem) modalElem.style.display = 'flex';
}

function openModal() { 
    const modal = document.getElementById('login-modal');
    if (modal) modal.style.display = 'flex'; 
}

function closeModal() { 
    const modal = document.getElementById('login-modal');
    if (modal) modal.style.display = 'none'; 
}

function closeDetailModal() { 
    const modal = document.getElementById('detail-modal');
    if (modal) modal.style.display = 'none'; 
}

function openBackupModal() {
    if (!isAdmin) return;
    const modal = document.getElementById('backup-modal');
    if (modal) {
        modal.style.display = 'flex';
        loadBackupTimelineList();
    }
}

function closeBackupModal() {
    const modal = document.getElementById('backup-modal');
    if (modal) modal.style.display = 'none';
}

function login() {
    const idElem = document.getElementById('admin-id');
    const pwElem = document.getElementById('admin-pw');

    if (!idElem || !pwElem) return;

    const inputId = idElem.value.trim();
    const inputPw = pwElem.value;

    const haeunId = decodeData("7ZWY7J2A"); 

    let tempUser = null;
    if (inputId === secureAdmin.id && inputPw === secureAdmin.pw) {
        tempUser = "아시";
    } else if (inputId === haeunId && inputPw === atob("aGFldW4jMjYwNDE2")) {
        tempUser = "하은";
    }

    if (tempUser) {
        isAdmin = true;
        loggedInUser = tempUser; 
        localStorage.setItem('isAdminLoggedIn', 'true');
        localStorage.setItem('loggedInUser', loggedInUser);
        
        closeModal();
        idElem.value = '';
        pwElem.value = '';
        
        requestNotificationPermission();

        showSystemAlert(`환영합니다, 수평선 너머 바다의 기록자, ${loggedInUser}님.`, function() {
            updateUI();
        });
    } else {
        showSystemAlert('올바른 접근이 아닙니다.');
    }
}

function logout() {
    isAdmin = false;
    loggedInUser = ''; 
    localStorage.removeItem('isAdminLoggedIn');
    localStorage.removeItem('loggedInUser');
    cancelEdit();
    showSystemAlert('로그아웃 되었습니다.', function() {
        updateUI();
    });
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
    if (!isAdmin && view === 'letters') {
        currentView = 'posts';
        return;
    }

    currentView = view;
    currentPage = 1;
    
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
    const searchInput = document.getElementById('search-input');
    searchKeyword = searchInput ? searchInput.value.trim() : '';
    currentPage = 1; 
    renderUI();
}

// ==========================================
// 🔥 백업 및 알림 통합 연동형 실시간 리스너 엔진 
// ==========================================
let rawPostsSnapshot = null;
let rawLettersSnapshot = null;
let isInitialPostLoad = true;

function listenPosts() {
    if (!database) return;
    database.ref('posts').on('value', (snapshot) => {
        rawPostsSnapshot = snapshot.val();
        const postsData = rawPostsSnapshot;
        allPosts = [];
        let currentIds = new Set();
        let hasNewPost = false;

        if (postsData) {
            Object.keys(postsData).forEach((key) => {
                allPosts.push({ id: key, ...postsData[key] });
                currentIds.add(key);
                if (!isInitialPostLoad && !knownPostIds.has(key)) {
                    hasNewPost = true;
                }
            });
            allPosts.reverse(); 
        }

        // 💾 [실시간 변동 추적 무결성 자동 백업 엔진]
        if (!isInitialPostLoad && !isInternalSyncAction) {
            executeCloudBackupEngine(true);
        }

        if (hasNewPost && isAdmin && !isSubmitting) {
            sendNotification(NOTIFICATION_CONFIG.postTitle, NOTIFICATION_CONFIG.postBody);
        }

        knownPostIds = currentIds;
        isInitialPostLoad = false;

        if(currentView === 'posts') renderUI();
    });
}

let knownLetterIds = new Set();
let isInitialLetterLoad = true;

function listenLetters() {
    if (!database) return;
    database.ref('letters').on('value', (snapshot) => {
        rawLettersSnapshot = snapshot.val();
        const lettersData = rawLettersSnapshot;
        allLetters = [];
        let currentIds = new Set();
        let hasNewLetter = false;

        if (lettersData) {
            Object.keys(lettersData).forEach((key) => {
                allLetters.push({ id: key, ...lettersData[key] });
                currentIds.add(key);
                if (!isInitialLetterLoad && !knownLetterIds.has(key)) {
                    hasNewLetter = true;
                }
            });
            allLetters.reverse();
        }

        // 💾 [실시간 변동 추적 무결성 자동 백업 엔진]
        if (!isInitialLetterLoad && !isInternalSyncAction) {
            executeCloudBackupEngine(true);
        }

        if (hasNewLetter && isAdmin && !isSubmitting) {
            sendNotification(NOTIFICATION_CONFIG.letterTitle, NOTIFICATION_CONFIG.letterBody);
        }

        knownLetterIds = currentIds;
        isInitialLetterLoad = false;

        if(currentView === 'letters') renderUI();
    });
}

// ==========================================
// 💾 클라우드 연동 타임라인 복구 분산 엔진 (30일 보존 정책 완벽 내장)
// ==========================================
const CONTEXT_RETENTION_PERIOD = 30 * 24 * 60 * 60 * 1000; // 30일 환산 밀리초

function executeCloudBackupEngine(isAutomatic = true) {
    if (!database) return;
    
    const now = new Date();
    const timestamp = now.getTime();
    const dateString = `${now.getFullYear()}. ${now.getMonth() + 1}. ${now.getDate()}. ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    const backupPack = {
        timestamp: timestamp,
        date: dateString,
        type: isAutomatic ? "자동" : "수동",
        posts: rawPostsSnapshot || {},
        letters: rawLettersSnapshot || {}
    };

    database.ref('backups').push(backupPack).then(() => {
        cleanExpiredBackupsTimeline();
    }).catch(err => console.error("백업 생성 처리 실패:", err));
}

function cleanExpiredBackupsTimeline() {
    if (!database) return;
    const expirationThreshold = new Date().getTime() - CONTEXT_RETENTION_PERIOD;

    database.ref('backups').once('value').then((snapshot) => {
        const backups = snapshot.val();
        if (!backups) return;

        Object.keys(backups).forEach((key) => {
            if (backups[key].timestamp < expirationThreshold) {
                database.ref(`backups/${key}`).remove(); 
            }
        });
    }).catch(err => console.error("만료 파편 정화 중 오류:", err));
}

function triggerManualBackup() {
    if (!isAdmin) return;
    executeCloudBackupEngine(false);
    showSystemAlert('현재 바다의 모든 상태 스냅샷을 안전하게 기록하여 복구 시점을 영구 보존했습니다.');
    loadBackupTimelineList();
}

// 🛠️ [중요] 완벽한 예외처리(Promise) 구조로 개편된 리스트 로드 엔진 (호출 중 멈춤 버그 완전 해결)
function loadBackupTimelineList() {
    const container = document.getElementById('backup-list-container');
    const loadingMsg = document.getElementById('backup-loading-msg');
    if (!container || !database) return;

    container.innerHTML = '';
    if (loadingMsg) loadingMsg.style.display = 'block';

    const expirationThreshold = new Date().getTime() - CONTEXT_RETENTION_PERIOD;

    // 규칙 오류 및 프리징 대지 차단을 위해 프로미스 엔진 사용
    database.ref('backups').once('value')
        .then((snapshot) => {
            if (loadingMsg) loadingMsg.style.display = 'none';
            const backups = snapshot.val();

            if (!backups) {
                container.innerHTML = `<p style="color:#94a3b8; font-size:0.85rem; padding: 20px 0;">아직 보존된 복구 타임라인 시점이 없습니다.</p>`;
                return;
            }

            const timelineKeys = Object.keys(backups).reverse(); 
            let loadedItemsCount = 0;

            timelineKeys.forEach((key) => {
                const item = backups[key];
                if (item.timestamp < expirationThreshold) return; 

                loadedItemsCount++;
                const pCount = item.posts ? Object.keys(item.posts).length : 0;
                const lCount = item.letters ? Object.keys(item.letters).length : 0;
                const badgeClass = item.type === "자동" ? "auto" : "manual";

                const element = document.createElement('div');
                element.className = 'backup-item';
                element.innerHTML = `
                    <div class="backup-meta">
                        <div class="backup-time-title">
                            ${item.date} <span class="backup-badge-type ${badgeClass}">${item.type}</span>
                        </div>
                        <div class="backup-counts">글 기록 ${pCount}개 ㅣ 편지 데이터 ${lCount}개</div>
                    </div>
                    <button onclick="restoreFromTargetBackupPoint('${key}')" style="font-size:0.75rem; border-color:#f7a37f; color:#f7a37f; padding: 4px 12px; border-radius:6px;">복구</button>
                `;
                container.appendChild(element);
            });

            if (loadedItemsCount === 0) {
                container.innerHTML = `<p style="color:#94a3b8; font-size:0.85rem; padding: 20px 0;">30일 이내 유효한 복구 지점이 존재하지 않습니다.</p>`;
            }
        })
        .catch((error) => {
            if (loadingMsg) loadingMsg.style.display = 'none';
            container.innerHTML = `
                <p style="color:#ef4444; font-size:0.85rem; padding: 15px 0;">백업 목록 로드 실패: 권한 부족</p>
                <p style="color:#94a3b8; font-size:0.75rem; line-height:1.4; text-align:left; padding:0 10px;">Firebase Database 규칙(Rules) 탭에서 <span style="color:#90e0ef;">"backups"</span> 노드에 대한 읽기/쓰기가 허용되어 있는지 확인해 주세요.<br>예시 규칙:<br>".read": "auth != null" 또는 true</p>
            `;
            console.error("타임라인 동기화 실패:", error);
        });
}

function restoreFromTargetBackupPoint(key) {
    if (!isAdmin || !database) return;

    showSystemConfirm('선택하신 시점의 복구 스냅샷을 가동하여 현재 바다를 완전 동기화 복구하시겠습니까? 현재 바다 데이터는 덮어씌워집니다.', function() {
        database.ref(`backups/${key}`).once('value').then((snapshot) => {
            const targetBackup = snapshot.val();
            if (!targetBackup) {
                showSystemAlert('해당 세이브 파일이 유효하지 않거나 이미 만료 소멸되었습니다.');
                return;
            }

            isInternalSyncAction = true; // 무한 자동 백업 연쇄 루프 차단락 가동

            Promise.all([
                database.ref('posts').set(targetBackup.posts || null),
                database.ref('letters').set(targetBackup.letters || null)
            ]).then(() => {
                showSystemAlert('수평선 너머 바다가 선택한 복구 시점 타임라인 상태로 완전 복원되었습니다.', function() {
                    isInternalSyncAction = false;
                    closeBackupModal();
                });
            }).catch(err => {
                isInternalSyncAction = false;
                showSystemAlert('타임라인 인젝션 주입 실패: ' + err.message);
            });
        }).catch(err => {
            showSystemAlert('복구 데이터 스냅샷 로드 에러: ' + err.message);
        });
    });
}

// ==========================================
// 7. UI 데이터 렌더링 엔진 (실시간 개수 동적 인젝션)
// ==========================================
function renderUI() {
    const container = document.getElementById('posts-container');
    const paginationContainer = document.getElementById('pagination-container');
    const subtitleElem = document.querySelector('.section-subtitle');
    
    if (!container || !paginationContainer) return;
    
    container.innerHTML = '';
    paginationContainer.innerHTML = '';

    if (!isAdmin && currentView === 'letters') {
        currentView = 'posts';
    }

    if (subtitleElem) {
        if (currentView === 'posts') {
            subtitleElem.innerHTML = `아래 바다에 기록된 글들을 클릭하여 읽어주세요!<br><span style="color: #90e0ef; font-size: 0.85rem; display: inline-block; margin-top: 9px; letter-spacing: 1px; font-weight: 400; text-shadow: 0 0 5px rgba(144, 224, 239, 0.3);">기록된 글 : ${allPosts.length}개</span>`;
        } else {
            subtitleElem.innerHTML = `수평선 너머 바다 위에 띄워진 편지들.<br><span style="color: #ffd4ba; font-size: 0.85rem; display: inline-block; margin-top: 9px; letter-spacing: 1px; font-weight: 400; text-shadow: 0 0 5px rgba(255, 212, 186, 0.3);">띄워진 편지 : ${allLetters.length}개</span>`;
        }
    }

    let targetArray = (currentView === 'posts') ? allPosts : allLetters;

    if (searchKeyword) {
        targetArray = targetArray.filter(item => 
            String(item.title).toLowerCase().includes(searchKeyword.toLowerCase())
        );
    }

    if (targetArray.length === 0) {
        const text = searchKeyword 
            ? `'${searchKeyword}'이/가 포함된 내용(제목)이 바다에 존재하지 않습니다.` 
            : ((currentView === 'posts') ? "아직 채워지지 않은 수평선 너머, 바다입니다." : "띄워진 편지가 없습니다.");
        container.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color:#94a3b8; margin-top:40px; font-size:0.9rem; letter-spacing:1px;">${text}</p>`;
        return;
    }

    const totalPages = Math.ceil(targetArray.length / postsPerPage);
    const startIndex = (currentPage - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    const currentItems = targetArray.slice(startIndex, endIndex);

    currentItems.forEach((item) => {
        const card = document.createElement('div');
        card.className = 'post-card';
        card.onclick = () => openDetailModal(item.id);
        
        let mgmtButtonsHtml = '';
        if (isAdmin) {
            if (currentView === 'posts') {
                mgmtButtonsHtml = `
                    <div class="card-mgmt-btns">
                        <button class="mgmt-btn" onclick="event.stopPropagation(); prepareEdit('${item.id}')">수정</button>
                        <button class="mgmt-btn danger-btn" onclick="event.stopPropagation(); deletePost('${item.id}')">소멸</button>
                    </div>
                `;
            } else {
                mgmtButtonsHtml = `
                    <div class="card-mgmt-btns">
                        <button class="mgmt-btn danger-btn" onclick="event.stopPropagation(); deleteLetter('${item.id}')">소멸</button>
                    </div>
                `;
            }
        }

   const formattedDate = formatTo24Hour(item.date);
        // 데이터베이스에 저장된 작성자 닉네임을 가져옵니다. (예전 글은 '기록자'로 표시)
        const authorName = item.author ? item.author : "기록자";
        // 요청하신 '닉 | 날짜. 시간.' 포맷으로 변경
        const displayDate = (currentView === 'posts') ? `${authorName} | ${formattedDate}` : formattedDate;
        card.innerHTML = `
            <h3>${escapeHtml(item.title)}</h3>
            <div class="post-content-area">${escapeHtml(item.content)}</div>
            <div class="post-footer">
                <span class="date">${displayDate}</span>
                ${mgmtButtonsHtml}
            </div>
        `;
        container.appendChild(card);
    });

    if (totalPages > 1) {
        const maxPageButtons = 5; 
        let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
        let endPage = startPage + maxPageButtons - 1;

        if (endPage > totalPages) {
            endPage = totalPages;
            startPage = Math.max(1, endPage - maxPageButtons + 1);
        }

        if (currentPage > 1) {
            const prevBtn = document.createElement('div');
            prevBtn.className = 'page-btn';
            prevBtn.innerHTML = '&#139;';
            prevBtn.onclick = () => {
                currentPage--;
                window.scrollTo({ top: 0, behavior: 'smooth' });
                renderUI();
            };
            paginationContainer.appendChild(prevBtn);
        }

        for (let i = startPage; i <= endPage; i++) {
            const btn = document.createElement('div');
            btn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
            btn.innerText = i;
            btn.onclick = () => {
                currentPage = i;
                window.scrollTo({ top: 0, behavior: 'smooth' });
                renderUI();
            };
            paginationContainer.appendChild(btn);
        }

        if (currentPage < totalPages) {
            const nextBtn = document.createElement('div');
            nextBtn.className = 'page-btn';
            nextBtn.innerHTML = '&#155;';
            nextBtn.onclick = () => {
                currentPage++;
                window.scrollTo({ top: 0, behavior: 'smooth' });
                renderUI();
            };
            paginationContainer.appendChild(nextBtn);
        }
    }
}

function openDetailModal(key) {
    if (!isAdmin && currentView === 'letters') return;

    const searchPool = (currentView === 'posts') ? allPosts : allLetters;
    const item = searchPool.find(p => p.id === key);
    if (!item) return;

    const titleElem = document.getElementById('detail-title');
    const dateElem = document.getElementById('detail-date');
    const textElem = document.getElementById('detail-text');
    const modalElem = document.getElementById('detail-modal');

    if (titleElem) titleElem.innerText = item.title;
    if (dateElem) dateElem.innerText = formatTo24Hour(item.date);
    if (textElem) textElem.innerText = item.content;
    if (modalElem) modalElem.style.display = 'flex';
}

function savePost() {
    if (!isAdmin || !database) return;
    if (isSubmitting) return; 

    const titleInput = document.getElementById('post-title');
    const contentInput = document.getElementById('post-content');

    if (!titleInput || !contentInput) return;

    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    
    const now = new Date();
    const date = `${now.getFullYear()}. ${now.getMonth() + 1}. ${now.getDate()}. ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    if (!title || !content) {
        showSystemAlert('바다에 새길 내용을 모두 입력해주세요.');
        return;
    }

    isSubmitting = true; 
    // 글 데이터에 로그인한 작성자의 닉네임(author)을 함께 저장합니다.
    const postData = { title: title, content: content, date: date, author: loggedInUser };

    if (editTargetKey) {
        database.ref('posts/' + editTargetKey).update(postData)
            .then(() => {
                showSystemAlert('기록이 수정되어 수평선 너머, 바다에 다시 새겨졌습니다.');
                cancelEdit();
            }).catch(err => showSystemAlert("수정 오류 : " + err.message))
            .finally(() => { isSubmitting = false; }); 
    } else {
        database.ref('posts').push(postData)
            .then(() => {
                titleInput.value = '';
                contentInput.value = '';
                currentPage = 1;
                showSystemAlert('수평선 너머, 바다에 새로운 기록이 성공적으로 새겨졌습니다.');
            }).catch(err => showSystemAlert("기록 오류 : " + err.message))
            .finally(() => { isSubmitting = false; }); 
    }
}

function saveLetter() {
    if (!database || isSubmitting) return; 

    const titleInput = document.getElementById('letter-title');
    const contentInput = document.getElementById('letter-content');

    if (!titleInput || !contentInput) return;

    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    
    const now = new Date();
    const date = `${now.getFullYear()}. ${now.getMonth() + 1}. ${now.getDate()}. ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    if (!title || !content) {
        showSystemAlert('편지 제목과 내용을 모두 채워주세요.');
        return;
    }

    isSubmitting = true; 
    const letterData = { title: title, content: content, date: date };

    database.ref('letters').push(letterData)
        .then(() => {
            titleInput.value = '';
            contentInput.value = '';
            showSystemAlert('아시님에게 보낼 편지가 넓은 수평선 너머, 바다 위로 안전하게 띄워졌습니다.');
            currentPage = 1;
            renderUI();
        }).catch(err => showSystemAlert("편지 발송 에러 : " + err.message))
        .finally(() => { isSubmitting = false; }); 
}

function prepareEdit(key) {
    const post = allPosts.find(p => p.id === key);
    if (!post) return;

    editTargetKey = key;
    
    const writeTitle = document.getElementById('write-title');
    const postTitle = document.getElementById('post-title');
    const postContent = document.getElementById('post-content');
    const submitBtn = document.getElementById('submit-post-btn');
    const cancelBtn = document.getElementById('cancel-edit-btn');
    const writeSection = document.getElementById('write-section');

    if (writeTitle) writeTitle.innerText = "기록 수정하기";
    if (postTitle) postTitle.value = post.title;
    if (postContent) postContent.value = post.content;
    if (submitBtn) submitBtn.innerText = "수정하기";
    if (cancelBtn) cancelBtn.style.display = "inline-block";
    if (writeSection) writeSection.scrollIntoView({ behavior: 'smooth' });
}

function cancelEdit() {
    editTargetKey = null;
    const writeTitle = document.getElementById('write-title');
    const postTitle = document.getElementById('post-title');
    const postContent = document.getElementById('post-content');
    const submitBtn = document.getElementById('submit-post-btn');
    const cancelBtn = document.getElementById('cancel-edit-btn');

    if (writeTitle) writeTitle.innerText = "새로운 기록 남기기";
    if (postTitle) postTitle.value = '';
    if (postContent) postContent.value = '';
    if (submitBtn) submitBtn.innerText = "기록하기";
    if (cancelBtn) cancelBtn.style.display = "none";
}

function deletePost(key) {
    if (!isAdmin || !database) return;
    
    showSystemConfirm('이 기록을 완전히 소멸시키겠습니까?', function() {
        if(editTargetKey === key) cancelEdit();
        database.ref('posts/' + key).remove().then(() => {
            const totalPagesAfterDelete = Math.ceil((allPosts.length - 1) / postsPerPage);
            if (currentPage > totalPagesAfterDelete && currentPage > 1) {
                currentPage = totalPagesAfterDelete;
            }
        }).catch(err => showSystemAlert("소멸 처리 오류 : " + err.message));
    });
}

function deleteLetter(key) {
    if (!isAdmin || !database) return;

    showSystemConfirm('이 편지를 바다에서 완전히 소멸시키겠습니까?', function() {
        database.ref('letters/' + key).remove().then(() => {
            const totalPagesAfterDelete = Math.ceil((allLetters.length - 1) / postsPerPage);
            if (currentPage > totalPagesAfterDelete && currentPage > 1) {
                currentPage = totalPagesAfterDelete;
            }
        }).catch(err => showSystemAlert("편지 제거 오류 : " + err.message));
    });
}

function clearDatabase() {
    if (!isAdmin || !database) return;
    
    showSystemConfirm('🚨 [치명적 대량 소멸 경고]\n수평선 너머 바다에 모든 기록들이 흔적도 없이 사라집니다. 초기화할까요?', function() {
        setTimeout(function() {
            showSystemConfirm('이 작업은 절대 되돌릴 수 없습니다. 정말 모든 기록과 편지를 영구 소멸시킬까요?', function() {
                Promise.all([
                    database.ref('posts').remove(),
                    database.ref('letters').remove()
                ]).then(() => {
                    cancelEdit();
                    currentPage = 1;
                    showSystemAlert('수평선 너머 바자가 완전히 정화되어 공백의 초기 상태가 되었습니다.');
                }).catch((error) => showSystemAlert('초기화 실패 : ' + error.message));
            });
        }, 150);
    });
}

function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
