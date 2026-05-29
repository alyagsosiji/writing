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
// 🎵 0-B. 음악 및 소리 엔진 설정
// ==========================================
const MY_MUSIC_LIST = [
    { title: "Night Sky City 2026 - Plum", src: "Night_Sky_City_2026_Plum.mp3" },
    { title: "Night Sky City 2026 - Plum", src: "Night_Sky_City_2026_Plum.mp3" }
];

let currentTrackIndex = 0;
let isTrackPlaying = false;
let audioEngine = new Audio();
let asmrEngine = new Audio("waves.mp3"); 
asmrEngine.loop = true;
let isAsmrPlaying = false;

// [글로벌 환경 제어 변수 선제적 안전 초기화]
window.manualTimeOverride = 'auto';
window.manualWeatherOverride = 'auto';

function initDraftAutoSaveEngine() {
    const targetFields = ['post-title', 'post-content', 'letter-title', 'letter-content'];
    targetFields.forEach(id => {
        const field = document.getElementById(id);
        if (!field) return;
        const savedDraft = localStorage.getItem('draft_' + id);
        if (savedDraft) field.value = savedDraft;
        field.addEventListener('input', () => localStorage.setItem('draft_' + id, field.value));
    });
}

function clearDraftCacheStorage(type) {
    if (type === 'post') { localStorage.removeItem('draft_post-title'); localStorage.removeItem('draft_post-content'); } 
    else if (type === 'letter') { localStorage.removeItem('draft_letter-title'); localStorage.removeItem('draft_letter-content'); }
}

function openSoundModal() {
    let modal = document.getElementById('sound-modal');
    if(!modal) {
        modal = document.createElement('div');
        modal.id = 'sound-modal';
        modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); display:flex; justify-content:center; align-items:center; z-index:99999;';
        modal.innerHTML = `
            <div style="background:#0f172a; padding:25px; border-radius:12px; border:1px solid #38bdf8; width:320px; text-align:center; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
                <h3 style="color:#fff; margin-bottom:20px; font-size:1.1rem;">바다의 소리 설정</h3>
                <div style="margin-bottom:20px; background:rgba(255,255,255,0.05); padding:15px; border-radius:8px;">
                    <p style="color:#cbd5e1; font-size:0.85rem; margin-bottom:10px;">🎵 배경 음악 (BGM)</p>
                    <button id="btn-music-toggle" onclick="window.togglePlayPause()" style="padding:8px 16px; border-radius:6px; background:#0284c7; color:#fff; border:none; cursor:pointer; font-weight:bold;">${isTrackPlaying ? '일시정지' : '음악 재생'}</button>
                </div>
                <div style="margin-bottom:25px; background:rgba(255,255,255,0.05); padding:15px; border-radius:8px;">
                    <p style="color:#cbd5e1; font-size:0.85rem; margin-bottom:10px;">🌊 수평선 파도 소리 (ASMR)</p>
                    <button id="btn-asmr-toggle" onclick="window.toggleAsmr()" style="padding:8px 16px; border-radius:6px; background:#059669; color:#fff; border:none; cursor:pointer; font-weight:bold;">${isAsmrPlaying ? '파도 소리 끄기' : '파도 소리 켜기'}</button>
                </div>
                <button onclick="document.getElementById('sound-modal').style.display='none'" style="padding:6px 20px; border:1px solid #94a3b8; background:transparent; color:#94a3b8; border-radius:6px; cursor:pointer;">닫기</button>
            </div>
        `;
        document.body.appendChild(modal);
    } else {
        const mBtn = document.getElementById('btn-music-toggle'); if(mBtn) mBtn.innerText = isTrackPlaying ? '일시정지' : '음악 재생';
        const aBtn = document.getElementById('btn-asmr-toggle'); if(aBtn) aBtn.innerText = isAsmrPlaying ? '파도 소리 끄기' : '파도 소리 켜기';
    }
    modal.style.display = 'flex';
}
window.openSoundModal = openSoundModal;

function toggleAsmr() {
    const btn = document.getElementById('btn-asmr-toggle');
    if(isAsmrPlaying) { asmrEngine.pause(); isAsmrPlaying=false; if(btn) btn.innerText='파도 소리 켜기'; }
    else { asmrEngine.play().catch(()=>{}); isAsmrPlaying=true; if(btn) btn.innerText='파도 소리 끄기'; }
}
window.toggleAsmr = toggleAsmr;

function initMusicPlayerEngine() {
    if (MY_MUSIC_LIST.length === 0) return;
    const playerTrigger = document.getElementById('mini-audio-trigger');
    loadTrack(currentTrackIndex);
    if (playerTrigger) playerTrigger.addEventListener('click', openSoundModal);
    audioEngine.addEventListener('ended', () => {
        currentTrackIndex = (currentTrackIndex + 1) % MY_MUSIC_LIST.length;
        loadTrack(currentTrackIndex);
        audioEngine.play().then(() => { if (playerTrigger) playerTrigger.classList.add('playing'); }).catch(() => { isTrackPlaying = false; if (playerTrigger) playerTrigger.classList.remove('playing'); });
    });
}

function loadTrack(index) { if (index < 0 || index >= MY_MUSIC_LIST.length) return; audioEngine.src = MY_MUSIC_LIST[index].src; }

function togglePlayPause() {
    const playerTrigger = document.getElementById('mini-audio-trigger');
    const btn = document.getElementById('btn-music-toggle');
    if (isTrackPlaying) {
        audioEngine.pause(); isTrackPlaying = false;
        if (playerTrigger) playerTrigger.classList.remove('playing');
        if (btn) btn.innerText = '음악 재생';
    } else {
        audioEngine.play().then(() => {
            isTrackPlaying = true;
            if (playerTrigger) playerTrigger.classList.add('playing');
            if (btn) btn.innerText = '일시정지';
        }).catch(err => console.log("오디오 스트리밍 방어"));
    }
}
window.togglePlayPause = togglePlayPause;

function fetchWeatherWidget() {
    const cacheKey = 'weather_cache_payload';
    const cacheTimeKey = 'weather_cache_timestamp';
    const now = Date.now();
    const cachedData = localStorage.getItem(cacheKey);
    const cachedTime = localStorage.getItem(cacheTimeKey);

    if (cachedData && cachedTime && (now - parseInt(cachedTime) < 15 * 60 * 1000)) {
        renderWeatherHTML(JSON.parse(cachedData));
        return;
    }

    let wElem = document.getElementById('weather-widget');
    if(!wElem) {
        wElem = document.createElement('div');
        wElem.id = 'weather-widget';
        document.body.appendChild(wElem);
    }
    wElem.innerText = "⏳ 바다 읽는 중...";

    fetch('https://api.open-meteo.com/v1/forecast?latitude=35.1796&longitude=129.0756&current_weather=true')
    .then(res => res.json())
    .then(data => {
        localStorage.setItem(cacheKey, JSON.stringify(data));
        localStorage.setItem(cacheTimeKey, String(now));
        renderWeatherHTML(data);
    }).catch(e => {
        if (cachedData) renderWeatherHTML(JSON.parse(cachedData));
        else wElem.innerText = "☁️ 21°C";
    });
}

function renderWeatherHTML(data) {
    const code = data.current_weather.weathercode;
    let icon = '☁️';
    if(code === 0) icon = '☀️';
    else if(code > 0 && code <= 3) icon = '⛅';
    else if(code >= 51 && code <= 67) icon = '🌧️';
    else if(code >= 71 && code <= 77) icon = '❄️';
    
    let wElem = document.getElementById('weather-widget');
    if(!wElem) {
        wElem = document.createElement('div');
        wElem.id = 'weather-widget';
        document.body.appendChild(wElem);
    }
    wElem.innerHTML = `${icon} ${data.current_weather.temperature}°C`;
}

function injectRandomMemoryButton() {
    if (document.getElementById('random-memory-btn')) return;
    const btn = document.createElement('div');
    btn.id = 'random-memory-btn';
    btn.innerHTML = '🐚';
    btn.title = "파도에 밀려온 과거의 조각 (필터를 기준으로 랜덤 글 뽑기)";
    btn.onmouseenter = () => btn.style.transform = 'scale(1.1)';
    btn.onmouseleave = () => btn.style.transform = 'scale(1)';
    
    btn.onclick = () => {
        let filtered = allPosts;
        if (searchAuthor !== 'all') {
            filtered = filtered.filter(item => {
                const author = item.author || "기록자";
                return searchAuthor === "하은" ? author.includes("하은") : !author.includes("하은");
            });
        }

        if (filtered.length === 0) {
            return showSystemAlert(searchAuthor === 'all' ? '아직 바다에 기록된 추억이 없습니다.' : `현재 선택된 기록자(${searchAuthor} 님)의 글이 존재하지 않습니다.`);
        }
        
        const randomPost = filtered[Math.floor(Math.random() * filtered.length)];
        openDetailModal(randomPost.id);
    };
    document.body.appendChild(btn);
}

window.openLibraryModal = function() {
    if (document.getElementById('library-modal')) {
        document.getElementById('library-modal').style.display = 'flex';
        document.body.classList.add('no-scroll');
    }
}
window.closeLibraryModal = function() {
    if (document.getElementById('library-modal')) {
        document.getElementById('library-modal').style.display = 'none';
        document.body.classList.remove('no-scroll');
    }
}

function requestNotificationPermission() {
    if (!("Notification" in window) || !database) return;
    Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
            const messaging = firebase.messaging();
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.ready.then((registration) => {
                    messaging.getToken({ vapidKey: 'BP8mVTuhszB5HkdHqMC3Lo-flElm8Jj06TGct_qEdzhn30bmgxfYKlG8z0n2DE0BD6L_upJVfliSX9Ua0vCg5Pg', serviceWorkerRegistration: registration })
                    .then((currentToken) => {
                        if (currentToken) {
                            const lastToken = localStorage.getItem('last_registered_fcm_token');
                            if (lastToken === currentToken) return;
                            
                            database.ref('fcmTokens/' + currentToken.replace(/[.#$\[\]]/g, '_')).set(currentToken)
                            .then(() => {
                                localStorage.setItem('last_registered_fcm_token', currentToken);
                            });
                        }
                    });
                });
            }
        }
    });
}

function sendNotification(title, body) {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    new Notification(title, { body: body, icon: NOTIFICATION_CONFIG.icon });
}

function hideLoadingScreen() {
    const loader = document.getElementById('loading-screen');
    if (loader) {
        loader.classList.add('fade-out');
        setTimeout(() => {
            if (localStorage.getItem('library_welcomed') !== 'true') {
                localStorage.setItem('library_welcomed', 'true');
                window.openLibraryModal();
            }
        }, 300);
    }
}

if (document.readyState === 'complete' || document.readyState === 'interactive') { hideLoadingScreen(); } 
else { document.addEventListener('DOMContentLoaded', hideLoadingScreen); }

let isRestMode = false; 
let currentDisplayMode = 'list'; // 💡 3가지 모드 제어: 'list', 'grid', 'infinite'
let backupTriggerQueued = false; 

// 💡 셀렉트 박스에서 모드를 선택할 때마다 작동하는 변경 함수
window.setDisplayMode = function(mode) {
    currentDisplayMode = mode;
    currentPage = 1; // 모드가 바뀌면 1페이지부터 다시 정렬
    // 무한 스크롤 관찰자 초기화
    if (window.infiniteObserver) {
        window.infiniteObserver.disconnect();
        window.infiniteObserver = null;
    }
    renderUI();
};

const secureConfig = {
    apiKey: "AIzaSyC7nqQqEJcFp_jdy4wVG33WYXIj5xWJuV0",
    authDomain: "star-bock.firebaseapp.com",
    databaseURL: "https://star-bock-default-rtdb.firebaseio.com", 
    projectId: "star-bock",
    storageBucket: "star-bock.appspot.com",
    messagingSenderId: "351507784717",
    appId: "1:351507784717:web:e22bb5718c0ebfbd3ca144",
    measurementId: "G-3EM79479JT"
};

let database = null;
try { if (typeof firebase !== 'undefined') { firebase.initializeApp(secureConfig); database = firebase.database(); } } 
catch (error) { console.error("Firebase 초기화 에러:", error); }

document.addEventListener('DOMContentLoaded', function() {
    try {
        if (localStorage.getItem('isAdminLoggedIn') === 'true') { isAdmin = true; loggedInUser = localStorage.getItem('loggedInUser') || ''; requestNotificationPermission(); }
        applyTimeBasedThemeEngine();
        initDraftAutoSaveEngine();
        injectRandomMemoryButton();
        injectTimeGearButton();
        
        let preWeather = document.getElementById('weather-widget');
        if(!preWeather && document.body) {
            preWeather = document.createElement('div');
            preWeather.id = 'weather-widget';
            document.body.appendChild(preWeather);
        }
        if(preWeather) preWeather.innerText = "⏳ 바다 읽는 중...";

        fetchWeatherWidget();
        syncWeatherAndWidget(); 
        setInterval(syncWeatherAndWidget, 30 * 60000); 
        listenPosts();
        listenLetters();
        initMusicPlayerEngine(); 
        
        if(typeof firebase !== 'undefined' && database) {
            database.ref('settings').on('value', snap => {
                const settings = snap.val() || {};
                isRestMode = settings.restMode || false;
                updateUI();
            });
        }
    } catch (e) {
        console.error("인프라 가동 실패 예외 : ", e);
        hideLoadingScreen();
    }
});

let newWorker;
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('firebase-messaging-sw.js', { scope: './' }).then((reg) => {
            if (typeof firebase !== 'undefined' && firebase.messaging) { firebase.messaging().useServiceWorker(reg); }
            reg.addEventListener('updatefound', () => {
                newWorker = reg.installing;
                newWorker.addEventListener('statechange', () => { if (newWorker.state === 'installed' && navigator.serviceWorker.controller) { const updateToast = document.getElementById('update-toast'); if (updateToast) updateToast.classList.add('show'); } });
            });
        }).catch((err) => console.error(err));
    });
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (!refreshing) { refreshing = true; window.location.reload(); } });
}

document.addEventListener('DOMContentLoaded', () => {
    const reloadBtn = document.getElementById('update-reload-btn'); const dismissBtn = document.getElementById('update-dismiss-btn'); const updateToast = document.getElementById('update-toast');
    if (reloadBtn) reloadBtn.addEventListener('click', () => { if (updateToast) updateToast.classList.remove('show'); if (newWorker) newWorker.postMessage({ action: 'skipWaiting' }); });
    if (dismissBtn) dismissBtn.addEventListener('click', () => { if (updateToast) updateToast.classList.remove('show'); });
});

function formatTo24Hour(dateStr) {
    if (!dateStr) return '';
    let str = String(dateStr).trim(); str = str.replace(/\b24(?=:\d{2})/g, '00');
    if (str.includes('오전') || str.includes('오후')) {
        const isPm = str.includes('오후'); str = str.replace(/오전\s*|오후\s*/g, ''); 
        str = str.replace(/(\d{1,2})(?=:\d{2})/, function(match) {
            let h = parseInt(match, 10);
            if (isPm) { if (h !== 12) h += 12; } else { if (h === 12) h = 0; }
            return String(h).padStart(2, '0');
        });
    }
    return str;
}

document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('dragstart', e => e.preventDefault());
document.addEventListener('selectstart', e => e.preventDefault());
document.addEventListener('keydown', function(e) {
    if (e.key === "F12") { e.preventDefault(); return false; }
    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) { e.preventDefault(); return false; }
    if (e.ctrlKey && e.key === 'u') { e.preventDefault(); return false; }
});

function decodeData(str) { return decodeURIComponent(escape(atob(str))); }

// 🛠️ [긴급 수리 완료] 원인 문법 결함 파편 제거 및 완전무결한 오리지널 해시 토큰 원복 복구 완료
const secureAdmin = { id: decodeData("7JWE7Iuc"), pw: atob("YXNoaSMyNjA0MTY=") };

let isAdmin = false; let loggedInUser = ''; let currentView = 'posts'; let currentPage = 1; const postsPerPage = 6;
let allPosts = []; let allLetters = []; let editTargetKey = null; let searchKeyword = ''; let searchAuthor = 'all';
let isSubmitting = false; let isInternalSyncAction = false; 

function showSystemAlert(message, callback) {
    const modalElem = document.getElementById('system-modal');
    if (document.getElementById('system-title')) document.getElementById('system-title').innerText = "안내";
    if (document.getElementById('system-message')) document.getElementById('system-message').innerText = message;
    if (document.getElementById('system-buttons')) {
        document.getElementById('system-buttons').innerHTML = "";
        const okBtn = document.createElement('button'); okBtn.innerText = "확인";
        okBtn.onclick = function() { if (modalElem) modalElem.style.display = 'none'; if (callback) callback(); };
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
        const confirmBtn = document.createElement('button'); confirmBtn.innerText = "확인";
        confirmBtn.onclick = function() { if (modalElem) modalElem.style.display = 'none'; if (onConfirm) onConfirm(); };
        const cancelBtn = document.createElement('button'); cancelBtn.innerText = "취소"; cancelBtn.className = "cancel-btn";
        cancelBtn.onclick = function() { if (modalElem) modalElem.style.display = 'none'; if (onCancel) onCancel(); };
        document.getElementById('system-buttons').appendChild(confirmBtn); document.getElementById('system-buttons').appendChild(cancelBtn);
    }
    if (modalElem) modalElem.style.display = 'flex';
}

function openModal() { if (document.getElementById('login-modal')) document.getElementById('login-modal').style.display = 'flex'; }
function closeModal() { if (document.getElementById('login-modal')) document.getElementById('login-modal').style.display = 'none'; }
function closeDetailModal() { if (document.getElementById('detail-modal')) { document.getElementById('detail-modal').style.display = 'none'; document.body.classList.remove('no-scroll'); } }
window.openModal = openModal; window.closeModal = closeModal; window.closeDetailModal = closeDetailModal;

function openBackupModal() { 
    if (!isAdmin) return; 
    if (document.getElementById('backup-modal')) { 
        document.getElementById('backup-modal').style.display = 'flex'; 
        window.switchAdminTab('backup'); 
    } 
}
function closeBackupModal() { if (document.getElementById('backup-modal')) document.getElementById('backup-modal').style.display = 'none'; }
window.openBackupModal = openBackupModal; window.closeBackupModal = closeBackupModal;

window.switchAdminTab = function(tab) {
    const btnBackup = document.getElementById('admin-btn-backup');
    const btnSettings = document.getElementById('admin-btn-settings');
    const listContainer = document.getElementById('backup-list-container');
    const delControls = document.getElementById('backup-delete-controls');
    const settingsContainer = document.getElementById('admin-settings-container');
    const subtitleSpan = document.getElementById('backup-modal-subtitle');
    const timelineWrapper = document.querySelector('.backup-timeline-wrapper');

    if (tab === 'backup') {
        if(btnBackup) { btnBackup.style.color = '#f7a37f'; btnBackup.style.borderBottom = '2px solid #f7a37f'; }
        if(btnSettings) { btnSettings.style.color = '#64748b'; btnSettings.style.borderBottom = '2px solid transparent'; }
        if(listContainer) listContainer.style.setProperty('display', 'block', 'important');
        if(delControls) delControls.style.setProperty('display', 'flex', 'important');
        if(settingsContainer) settingsContainer.style.setProperty('display', 'none', 'important');
        if(subtitleSpan) subtitleSpan.style.setProperty('display', 'block', 'important'); 
        if(timelineWrapper) timelineWrapper.style.setProperty('display', 'block', 'important');
        loadBackupTimelineList();
    } else if (tab === 'settings') {
        if(btnSettings) { btnSettings.style.color = '#f7a37f'; btnSettings.style.borderBottom = '2px solid #f7a37f'; }
        if(btnBackup) { btnBackup.style.color = '#64748b'; btnBackup.style.borderBottom = '2px solid transparent'; }
        if(listContainer) listContainer.style.setProperty('display', 'none', 'important');
        if(delControls) delControls.style.setProperty('display', 'none', 'important'); 
        if(settingsContainer) settingsContainer.style.setProperty('display', 'block', 'important');
        if(subtitleSpan) subtitleSpan.style.setProperty('display', 'none', 'important'); 
        if(timelineWrapper) timelineWrapper.style.setProperty('display', 'none', 'important');
        renderAdminSettings();
    }
}

function renderAdminSettings() {
    const container = document.getElementById('admin-settings-container');
    if(!container) return;
    container.innerHTML = `
        <div style="background:rgba(3,10,23,0.5); padding:20px; border-radius:10px; border:1px solid rgba(255,255,255,0.05); text-align:left; margin-bottom: 15px;">
            <h3 style="color:#fff; margin-bottom:15px; font-size:1.05rem; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:10px;">관리자 전용 제어 시스템</h3>
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div style="padding-right:10px;">
                    <div style="color:#e2e8f0; font-weight:bold; margin-bottom:5px;">🌊 바다 휴식 모드 (수신 차단)</div>
                    <div style="color:#94a3b8; font-size:0.75rem; line-height:1.4;">활성화 시, 일반 방문객들의 편지 수신 작성이 제한되고 안내 문구가 표시됩니다.</div>
                </div>
                <button onclick="window.toggleRestMode()" style="flex-shrink:0; padding:8px 14px; font-size:0.8rem; border-radius:6px; background:${isRestMode ? '#ef4444' : '#475569'}; color:#fff; border:none; cursor:pointer;">
                    ${isRestMode ? '휴식 중 (해제하기)' : '휴식 모드 켜기'}
                </button>
            </div>
        </div>
    `;
}

function toggleRestMode() {
    if(!isAdmin || !database) return;
    const targetState = !isRestMode; 
    database.ref('settings/restMode').set(targetState).then(() => {
        showSystemAlert(targetState ? '바다가 휴식에 들어갑니다. 편지 수신이 차단됩니다.' : '바다의 휴식이 끝났습니다. 편지 수신이 재개됩니다.');
        renderAdminSettings();
    });
}
window.toggleRestMode = toggleRestMode;

function login() {
    const idElem = document.getElementById('admin-id'); const pwElem = document.getElementById('admin-pw');
    if (!idElem || !pwElem) return;
    const inputId = idElem.value.trim(); const inputPw = pwElem.value;
    const haeunId = decodeData("7ZWY7J2A"); 

    let tempUser = null;
    if (inputId === secureAdmin.id && inputPw === secureAdmin.pw) { tempUser = decodeData("7JWE7Iuc"); }
    else if (inputId === haeunId && inputPw === atob("aGFldW4jMjYwNDE2")) { tempUser = decodeData("7ZWY7J2A"); }

    if (tempUser) {
        isAdmin = true; loggedInUser = tempUser; 
        localStorage.setItem('isAdminLoggedIn', 'true'); localStorage.setItem('loggedInUser', loggedInUser);
        closeModal(); idElem.value = ''; pwElem.value = ''; requestNotificationPermission();
        showSystemAlert(`환영합니다, 수평선 너머 바다의 기록자, ${loggedInUser}님.`, function() { updateUI(); });
    } else showSystemAlert('올바른 접근이 아닙니다.');
}
window.login = login;

function logout() { isAdmin = false; loggedInUser = ''; localStorage.removeItem('isAdminLoggedIn'); localStorage.removeItem('loggedInUser'); cancelEdit(); showSystemAlert('로그아웃 되었습니다.', function() { updateUI(); }); }
window.logout = logout;

function updateUI() {
    const writeSection = document.getElementById('write-section'); 
    const letterSection = document.getElementById('letter-section');
    const loginBtn = document.getElementById('login-btn'); 
    const adminMenu = document.getElementById('admin-menu');
    const tabContainer = document.getElementById('view-tab-container'); 
    const currentUserBtn = document.getElementById('current-user-btn'); 
    const backupTrigger = document.getElementById('mini-backup-trigger');

    if (isAdmin) {
        document.body.classList.add('admin-logged-in'); 
        if (writeSection) writeSection.style.display = 'block'; 
        if (letterSection) letterSection.style.display = 'none'; 
        if (loginBtn) loginBtn.style.display = 'none'; 
        if (adminMenu) adminMenu.style.display = 'flex'; 
        if (tabContainer) tabContainer.style.display = 'flex'; 
        if (currentUserBtn) currentUserBtn.innerText = `기록자 ${loggedInUser}님`; 
        if (backupTrigger) backupTrigger.style.display = 'flex'; 
        switchView(currentView);
    } else {
        document.body.classList.remove('admin-logged-in');
        if (writeSection) writeSection.style.display = 'none'; 
        if (letterSection) letterSection.style.display = 'block'; 
        if (loginBtn) loginBtn.style.display = 'inline-block'; 
        if (adminMenu) adminMenu.style.display = 'none';
        if (tabContainer) tabContainer.style.display = 'none'; 
        if (backupTrigger) backupTrigger.style.display = 'none'; 
        switchView('posts'); 
    }

    const letterSubmitBtn = document.getElementById('submit-letter-btn');
    const letterContent = document.getElementById('letter-content');
    if (isRestMode) {
        if(letterSubmitBtn) { letterSubmitBtn.disabled = true; letterSubmitBtn.innerText = '바다가 쉬어가는 중입니다'; letterSubmitBtn.style.opacity = '0.5'; }
        if(letterContent) { letterContent.disabled = true; letterContent.placeholder = '현재 수평선 너머로 편지를 띄울 수 없습니다. 바다가 고요히 쉬고 있습니다.'; }
    } else {
        if(letterSubmitBtn) { letterSubmitBtn.disabled = false; letterSubmitBtn.innerText = '편지 띄우기'; letterSubmitBtn.style.opacity = '1'; }
        if(letterContent) { letterContent.disabled = false; letterContent.placeholder = '기록자 분들에게 띄워 보낼 편지의 내용을 입력해주세요.'; }
    }
}

function switchView(view) {
    if (!isAdmin && view === 'letters') { currentView = 'posts'; return; }
    currentView = view; currentPage = 1;
    const tabPosts = document.getElementById('tab-posts'); const tabLetters = document.getElementById('tab-letters');
    const mainTitle = document.getElementById('section-main-title');
    if (tabPosts) tabPosts.classList.remove('active'); if (tabLetters) tabLetters.classList.remove('active');
    if(view === 'posts') { if (tabPosts) tabPosts.classList.add('active'); if (mainTitle) mainTitle.innerText = "바다의 기록"; } 
    else { if (tabLetters) tabLetters.classList.add('active'); if (mainTitle) mainTitle.innerText = "띄워진 편지"; }
    renderUI();
}
window.switchView = switchView;

function handleSearch() { searchKeyword = document.getElementById('search-input') ? document.getElementById('search-input').value.trim() : ''; searchAuthor = document.getElementById('author-filter') ? document.getElementById('author-filter').value : 'all'; currentPage = 1; renderUI(); }
window.handleSearch = handleSearch;

function parseCustomDate(dateStr) {
    if (!dateStr) return 0;
    const cleaned = String(dateStr).replace(/\s+/g, '');
    const parts = cleaned.split('.');
    if (parts.length < 4) return 0;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const timeParts = parts[3].split(':');
    const hours = parseInt(timeParts[0], 10) || 0;
    const minutes = parseInt(timeParts[1], 10) || 0;
    const seconds = parseInt(timeParts[2], 10) || 0;
    return new Date(year, month, day, hours, minutes, seconds).getTime();
}

let rawPostsSnapshot = null; let rawLettersSnapshot = null; let isInitialPostLoad = true; let knownPostIds = new Set();
function listenPosts() {
    if (!database) return;
    database.ref('posts').off();
    database.ref('posts').on('value', (snapshot) => {
        rawPostsSnapshot = snapshot.val(); allPosts = []; let currentIds = new Set(); let hasNewPost = false;
        if (rawPostsSnapshot) {
            Object.keys(rawPostsSnapshot).forEach((key) => {
                allPosts.push({ id: key, ...rawPostsSnapshot[key] }); currentIds.add(key);
                if (!isInitialPostLoad && !knownPostIds.has(key)) hasNewPost = true;
            });
            // 시간차 역순 안전 예외 방어 정렬
            allPosts.sort((a, b) => {
                const timeA = parseCustomDate(a.date) || 0;
                const timeB = parseCustomDate(b.date) || 0;
                if (timeB !== timeA) return timeB - timeA;
                return b.id.localeCompare(a.id);
            });
        }
        if (hasNewPost && isAdmin && !isSubmitting) sendNotification(NOTIFICATION_CONFIG.postTitle, NOTIFICATION_CONFIG.postBody);
        knownPostIds = currentIds; isInitialPostLoad = false;
        if(currentView === 'posts') renderUI();
    });
}

let knownLetterIds = new Set(); let isInitialLetterLoad = true;
function listenLetters() {
    if (!database) return;
    database.ref('letters').off();
    database.ref('letters').on('value', (snapshot) => {
        rawLettersSnapshot = snapshot.val(); allLetters = []; let currentIds = new Set(); let hasNewLetter = false;
        if (rawLettersSnapshot) {
            Object.keys(rawLettersSnapshot).forEach((key) => {
                allLetters.push({ id: key, ...rawLettersSnapshot[key] }); currentIds.add(key);
                if (!isInitialLetterLoad && !knownLetterIds.has(key)) hasNewLetter = true;
            });
            allLetters.sort((a, b) => {
                const timeA = parseCustomDate(a.date) || 0;
                const timeB = parseCustomDate(b.date) || 0;
                if (timeB !== timeA) return timeB - timeA;
                return b.id.localeCompare(a.id);
            });
        }
        if (hasNewLetter && isAdmin && !isSubmitting) sendNotification(NOTIFICATION_CONFIG.letterTitle, NOTIFICATION_CONFIG.letterBody);
        knownLetterIds = currentIds; isInitialLetterLoad = false;
        if(currentView === 'letters') renderUI();
    });
}

const CONTEXT_RETENTION_PERIOD = 30 * 24 * 60 * 60 * 1000;
function executeCloudBackupEngine(isAutomatic = true) {
    if (!database) return Promise.reject(new Error("Database connection lost"));
    const now = new Date(); const timestamp = now.getTime();
    const dateString = `${now.getFullYear()}. ${now.getMonth() + 1}. ${now.getDate()}. ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const pCount = rawPostsSnapshot ? Object.keys(rawPostsSnapshot).length : 0; const lCount = rawLettersSnapshot ? Object.keys(rawLettersSnapshot).length : 0;
    const backupMeta = { timestamp: timestamp, date: dateString, type: isAutomatic ? "자동" : "수동", pCount: pCount, lCount: lCount };
    const backupPayload = { posts: rawPostsSnapshot || {}, letters: rawLettersSnapshot || {} };
    const newBackupKey = database.ref().push().key;
    return Promise.all([ database.ref(`backupMeta/${newBackupKey}`).set(backupMeta), database.ref(`backupData/${newBackupKey}`).set(backupPayload) ])
    .then(() => { cleanExpiredBackupsTimeline(); loadBackupTimelineList(); });
}
window.executeCloudBackupEngine = executeCloudBackupEngine;

window.triggerManualBackup = function() {
    if (!isAdmin || !database) return showSystemAlert("권한이 누락되었습니다.");
    window.executeCloudBackupEngine(false)
    .then(() => showSystemAlert("현재 바다 상태 스냅샷 수동 저장이 완료되었습니다."))
    .catch(err => showSystemAlert("수동 백업 실패: " + err.message));
};
window.triggerManualBackup = triggerManualBackup;

function cleanExpiredBackupsTimeline() {
    if (!database) return;
    const expirationThreshold = new Date().getTime() - CONTEXT_RETENTION_PERIOD;
    database.ref('backupMeta').orderByChild('timestamp').endAt(expirationThreshold).once('value').then((snapshot) => {
        const expiredBackups = snapshot.val(); if (!expiredBackups) return;
        Object.keys(expiredBackups).forEach((key) => { database.ref(`backupMeta/${key}`).remove(); database.ref(`backupData/${key}`).remove(); });
    });
}

function toggleAllBackups(source) { document.querySelectorAll('.backup-checkbox').forEach(cb => cb.checked = source.checked); }
window.toggleAllBackups = toggleAllBackups;

function selectBackupsByPeriod(days) {
    const checkboxes = document.querySelectorAll('.backup-checkbox'); const selectAllCb = document.getElementById('backup-select-all');
    if(selectAllCb) selectAllCb.checked = false;
    if (!days) { checkboxes.forEach(cb => cb.checked = false); return; }
    const now = new Date().getTime(); const threshold = days === 'all' ? now + 999999999 : now - (parseInt(days) * 24 * 60 * 60 * 1000);
    let allChecked = true;
    checkboxes.forEach(cb => { const ts = parseInt(cb.getAttribute('data-timestamp')); if (days === 'all') cb.checked = true; else cb.checked = ts < threshold; if(!cb.checked) allChecked = false; });
    if (selectAllCb) selectAllCb.checked = allChecked;
}
window.selectBackupsByPeriod = selectBackupsByPeriod;

function deleteSelectedBackups() {
    if (!isAdmin || !database) return;
    const checkboxes = document.querySelectorAll('.backup-checkbox:checked'); const keysToDelete = Array.from(checkboxes).map(cb => cb.value);
    if (keysToDelete.length === 0) return showSystemAlert('소멸시킬 백업 지점을 선택해주세요.');
    showSystemConfirm(`선택하신 ${keysToDelete.length}개의 백업 기록을 영구히 소멸시키겠습니까?`, function() {
        const deletePromises = keysToDelete.map(key => { return Promise.all([ database.ref(`backupMeta/${key}`).remove(), database.ref(`backupData/${key}`).remove() ]); });
        Promise.all(deletePromises).then(() => { showSystemAlert('선택한 백업이 완전 소멸되었습니다.'); loadBackupTimelineList(); });
    });
}
window.deleteSelectedBackups = deleteSelectedBackups;

function loadBackupTimelineList() {
    let container = document.getElementById('backup-list-container'); 
    if (!container) return; container.innerHTML = '';
    
    const selectAllCb = document.getElementById('backup-select-all'); if(selectAllCb) selectAllCb.checked = false;
    const periodSelect = document.getElementById('backup-period-select'); if(periodSelect) periodSelect.value = "";

    if (document.getElementById('backup-loading-msg')) document.getElementById('backup-loading-msg').style.display = 'block';
    const expirationThreshold = new Date().getTime() - CONTEXT_RETENTION_PERIOD;
    
    database.ref('backupMeta').once('value').then((snapshot) => {
        if (document.getElementById('backup-loading-msg')) document.getElementById('backup-loading-msg').style.display = 'none';
        const backups = snapshot.val(); 
        if (!backups) { container.innerHTML = `<p style="color:#94a3b8; font-size:0.85rem; padding: 20px 0; text-align:center;">복구 지점이 없습니다.</p>`; return; }
        const keys = Object.keys(backups).filter(key => backups[key].timestamp >= expirationThreshold).reverse();
        if (keys.length === 0) { container.innerHTML = `<p style="color:#94a3b8; font-size:0.85rem; padding: 20px 0; text-align:center;">복구 지점이 없습니다.</p>`; return; }

        keys.forEach((key) => {
            const item = backups[key]; const pCount = item.pCount || 0; const lCount = item.lCount || 0; const badgeClass = item.type === "자동" ? "auto" : "manual";
            const element = document.createElement('div'); element.className = 'backup-item';
            
            element.innerHTML = `
                <div style="display:flex; align-items:center; width:100%;">
                    <input type="checkbox" class="backup-checkbox" value="${key}" data-timestamp="${item.timestamp}" style="margin-right:12px; accent-color:#f7a37f; width:16px; height:16px; cursor:pointer; flex-shrink:0;">
                    <div class="backup-meta" style="flex-grow: 1; padding-right: 8px;">
                        <div class="backup-time-title">${item.date} <span class="backup-badge-type ${badgeClass}">${item.type}</span></div>
                        <div class="backup-counts">글 ${pCount}개 ㅣ 편지 ${lCount}개</div>
                    </div>
                    <div style="display:flex; gap:8px; flex-shrink:0; align-items:center;">
                        <button onclick="window.downloadBackupFile('${key}', 'txt')" style="font-size:0.75rem; border:1px solid rgba(144,224,239,0.35); color:#90e0ef; padding: 5px 9px; border-radius:6px; background:rgba(144,224,239,0.04); cursor:pointer; font-weight:500; transition:all 0.2s;">TXT</button>
                        <button onclick="window.downloadBackupFile('${key}', 'pdf')" style="font-size:0.75rem; border:1px solid rgba(255,212,186,0.35); color:#ffd4ba; padding: 5px 9px; border-radius:6px; background:rgba(255,212,186,0.04); cursor:pointer; font-weight:500; transition:all 0.2s;">PDF</button>
                        <button onclick="window.restoreFromTargetBackupPoint('${key}')" style="font-size:0.75rem; border:1px solid #f7a37f; color:#fff; background:linear-gradient(135deg, #f7a37f, #e76f51); padding: 5px 12px; border-radius:6px; cursor:pointer; font-weight:bold; transition:all 0.2s; box-shadow:0 2px 6px rgba(247,163,127,0.25);">복구</button>
                    </div>
                </div>
            `;
            container.appendChild(element);
        });
    }).catch(err => {
        if (document.getElementById('backup-loading-msg')) document.getElementById('backup-loading-msg').style.display = 'none';
        container.innerHTML = `<p style="color:#ef4444; font-size:0.82rem; padding: 20px 0; text-align:center;">인프라 클라우드 연동 차단 상태</p>`;
    });
}
window.loadBackupTimelineList = loadBackupTimelineList;

function downloadBackupFile(key, format) {
    if (!isAdmin || !database) return;
    database.ref(`backupData/${key}`).once('value').then((snapshot) => {
        const data = snapshot.val();
        if (!data) return showSystemAlert("백업 파일이 유실되었습니다.");
        const posts = data.posts || {}; const letters = data.letters || {};
        
        if (format === 'txt') {
            let textResult = `=========================================\n  수평선 너머의 서재 백업 기록 파일 (${key})\n=========================================\n\n[1. 바다의 기록 (글)]\n`;
            Object.keys(posts).forEach(k => { textResult += `▶ 제목: ${posts[k].title}\n▶ 기록자: ${posts[k].author || '기록자'}\n▶ 날짜: ${posts[k].date}\n▶ 내용:\n${posts[k].content}\n-----------------------------------------\n`; });
            textResult += `\n[2. 띄워진 편지]\n`;
            Object.keys(letters).forEach(k => { textResult += `▶ 제목: ${letters[k].title}\n▶ 날짜: ${letters[k].date}\n▶ 상태: ${letters[k].read ? '수거됨' : '미수거'}\n▶ 내용:\n${letters[k].content}\n-----------------------------------------\n`; });
            const blob = new Blob([textResult], { type: "text/plain;charset=utf-8" }); const url = URL.createObjectURL(blob);
            const a = document.createElement("a"); a.href = url; a.download = `서재_백업데이터_${key}.txt`; a.click(); URL.revokeObjectURL(url);
        } else if (format === 'pdf') {
            const printWindow = window.open("", "_blank");
            if (!printWindow) return showSystemAlert("브라우저 팝업 차단을 해제해주세요.");
            let htmlContent = `<html><head><title>수평선 너머의 서재 백업 리포트</title><style>body { font-family: sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; } h1 { border-bottom: 2px solid #0f172a; padding-bottom: 12px; font-size: 22px; } h2 { color: #0284c7; margin-top: 32px; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; font-size: 16px; } .item { margin-bottom: 24px; page-break-inside: avoid; } .meta { font-size: 12px; color: #64748b; margin-bottom: 6px; } .content { background: #f8fafc; padding: 14px; border-radius: 6px; white-space: pre-wrap; font-size: 14px; border: 1px solid #e2e8f0; }</style></head><body><h1>수평선 너머의 서재 스냅샷 백업 [시점: ${key}]</h1><h2>[바다의 기록 - 글 목록]</h2>`;
            Object.keys(posts).forEach(k => { htmlContent += `<div class="item"><strong>${escapeHtml(posts[k].title)}</strong><div class="meta">작성자: ${posts[k].author || '기록자'} ㅣ 일시: ${posts[k].date}</div><div class="content">${escapeHtml(posts[k].content)}</div></div>`; });
            htmlContent += `<h2>[띄워진 편지 목록]</h2>`;
            Object.keys(letters).forEach(k => { htmlContent += `<div class="item"><strong>${escapeHtml(letters[k].title)}</strong><div class="meta">일시: ${letters[k].date} ㅣ 처리 상태: ${letters[k].read ? '수거됨' : '미수거'}</div><div class="content">${escapeHtml(letters[k].content)}</div></div>`; });
            htmlContent += `<script>window.onload = function() { window.print(); window.close(); }</script></body></html>`;
            printWindow.document.write(htmlContent); printWindow.document.close();
        }
    }).catch(err => showSystemAlert("다운로드 파일 추출 실패"));
}
window.downloadBackupFile = downloadBackupFile;

function restoreFromTargetBackupPoint(key) {
    if (!isAdmin || !database) return;
    showSystemConfirm('선택하신 시점으로 바다 데이터를 덮어씌워 복구하시겠습니까?', function() { database.ref(`backupData/${key}`).once('value').then((snapshot) => { executeRestore(snapshot.val()); }); });
}
window.restoreFromTargetBackupPoint = restoreFromTargetBackupPoint;

function executeRestore(targetBackup) {
    if (!targetBackup) return; isInternalSyncAction = true;
    database.ref('posts').off(); database.ref('letters').off();
    Promise.all([ database.ref('posts').set(targetBackup.posts || null), database.ref('letters').set(targetBackup.letters || null) ]).then(() => {
        listenPosts(); listenLetters(); showSystemAlert('수평선 너머 바다가 완전 복원되었습니다.', function() { isInternalSyncAction = false; closeBackupModal(); });
    }).catch(() => { listenPosts(); listenLetters(); });
}

function scrollToPosts() { const postsSection = document.getElementById('posts-section'); if (postsSection) { const yOffset = postsSection.getBoundingClientRect().top + window.scrollY - 40; window.scrollTo({ top: yOffset, behavior: 'smooth' }); } }

// 💡 무한 스크롤 append 처리를 위해 매개변수 isAppend 추가
function renderUI(isAppend = false) {
    const container = document.getElementById('posts-container'); 
    const paginationContainer = document.getElementById('pagination-container');
    const subtitleElem = document.querySelector('.section-subtitle'); 
    const authorStatsContainer = document.getElementById('author-stats'); 
    const authorFilterContainer = document.getElementById('author-filter-container');
    
    if (!container || !paginationContainer) return; 

    // 무한 스크롤 작동 중이 아닐 때만 화면을 비우고 새로 그림
    if (!isAppend) {
        container.innerHTML = ''; 
        paginationContainer.innerHTML = '';

        if (currentDisplayMode === 'grid' || currentDisplayMode === 'infinite') {
            container.classList.add('posts-grid-view'); 
        } else {
            container.classList.remove('posts-grid-view');
        }

        if (subtitleElem) {
            let subtitleText = currentView === 'posts' 
                ? `<span style="color:#ffffff; font-size:1.02rem; font-weight:500; letter-spacing:0.5px; text-shadow:0 0 10px rgba(144,224,239,0.6); background:linear-gradient(120deg, #fff, #b9efff); -webkit-background-clip:text; -webkit-text-fill-color:transparent; display:inline-block;">아래 바다에 기록된 글들을 클릭하여 읽어주세요!</span><br><span style="color: #90e0ef; font-size: 0.85rem; display: inline-block; margin-top: 9px;">총 기록된 글 : ${allPosts.length}개</span>` 
                : `수평선 너머 바다 위에 띄워진 편지들.<br><span style="color: #ffd4ba; font-size: 0.85rem; display: inline-block; margin-top: 9px;">띄워진 편지 : ${allLetters.length}개</span>`;
            
            // 💡 단순 버튼 형태를 정렬(필터) 버튼과 같은 직관적인 select 드롭다운 UI로 교체 완료
            let selectHtml = `
                <div style="margin-top:20px; display:flex; justify-content:center; width:100%;">
                    <select onchange="window.setDisplayMode(this.value)" style="height: 38px; width: 100%; max-width: 180px; -webkit-appearance: none; -moz-appearance: none; appearance: none; background-color: rgba(255, 255, 255, 0.04); background-image: url('data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'%23fff\\' stroke-width=\\'2\\' stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\'%3E%3Cpolyline points=\\'6 9 12 15 18 9\\'%3E%3C/polyline%3E%3C/svg%3E'); background-repeat: no-repeat; background-position: right 15px center; background-size: 14px; border: 1px solid rgba(0, 180, 216, 0.25); color: #fff; padding: 0 35px 0 20px; border-radius: 25px; font-size: 0.85rem; font-weight:500; outline: none; cursor: pointer; transition: all 0.25s ease; text-align: center; box-shadow:0 4px 12px rgba(0,0,0,0.35); letter-spacing:0.5px;">
                        <option value="list" ${currentDisplayMode === 'list' ? 'selected' : ''} style="background: #030a16; color: #fff;">📄 리스트 모드</option>
                        <option value="grid" ${currentDisplayMode === 'grid' ? 'selected' : ''} style="background: #030a16; color: #fff;">🔲 갤러리 모드</option>
                        <option value="infinite" ${currentDisplayMode === 'infinite' ? 'selected' : ''} style="background: #030a16; color: #fff;">🌊 무한 스크롤</option>
                    </select>
                </div>
            `;
            
            subtitleElem.innerHTML = subtitleText + selectHtml;
        }

        if (currentView === 'posts') {
            if (authorStatsContainer) authorStatsContainer.style.display = 'flex'; if (authorFilterContainer) authorFilterContainer.style.display = 'block';
            let ashiCount = 0; let haeunCount = 0; allPosts.forEach(post => { if ((post.author || "").includes("하은")) haeunCount++; else ashiCount++; });
            if (authorStatsContainer) authorStatsContainer.innerHTML = `<span class="stat-badge">아시 : ${ashiCount}개</span><span class="stat-badge">하은 : ${haeunCount}개</span>`;
        } else {
            if (authorStatsContainer) authorStatsContainer.style.display = 'none'; if (authorFilterContainer) authorFilterContainer.style.display = 'none';
        }
    }

    let targetArray = (currentView === 'posts') ? allPosts : allLetters;
    if (currentView === 'posts' && searchAuthor !== 'all') { targetArray = targetArray.filter(item => { const author = item.author || "기록자"; return searchAuthor === "하은" ? author.includes("하은") : !author.includes("하은"); }); }
    if (searchKeyword) targetArray = targetArray.filter(item => String(item.title).toLowerCase().includes(searchKeyword.toLowerCase()));

    if (targetArray.length === 0) { 
        if (!isAppend) container.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color:#94a3b8; margin-top:40px;">존재하지 않습니다.</p>`; 
        return; 
    }

    const totalPages = Math.ceil(targetArray.length / postsPerPage);
    let currentItems = [];

    // 무한 스크롤일 때 배열 보존 분기 처리
    if (currentDisplayMode === 'infinite') {
        if (isAppend) {
            currentItems = targetArray.slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage);
        } else {
            currentItems = targetArray.slice(0, currentPage * postsPerPage);
        }
    } else {
        currentItems = targetArray.slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage);
    }

    const cardFragment = document.createDocumentFragment();

    currentItems.forEach((item) => {
        const card = document.createElement('div'); card.className = 'post-card'; card.onclick = () => openDetailModal(item.id);
        let mgmtButtonsHtml = '';
        if (isAdmin) {
            mgmtButtonsHtml = currentView === 'posts' 
                ? `<div class="card-mgmt-btns"><button class="mgmt-btn" onclick="event.stopPropagation(); window.prepareEdit('${item.id}')">수정</button><button class="mgmt-btn danger-btn" onclick="event.stopPropagation(); window.deletePost('${item.id}')">소멸</button></div>`
                : `<div class="card-mgmt-btns"><button class="mgmt-btn danger-btn" onclick="event.stopPropagation(); window.deleteLetter('${item.id}')">소멸</button></div>`;
        }
        
        let readBadgeHtml = ''; if (currentView === 'letters' && item.read === true) { readBadgeHtml = `<span class="read-badge" style="font-size:0.7rem; background:rgba(247,163,127,0.15); color:#f7a37f; border:1px solid rgba(247,163,127,0.35); padding:2px 5px; border-radius:4px; margin-left:8px; font-weight:bold; vertical-align:middle; display:inline-block;">수거됨</span>`; }

        const displayDate = (currentView === 'posts') ? `${item.author || "기록자"} ㅣ ${formatTo24Hour(item.date)}` : formatTo24Hour(item.date);
        
        card.innerHTML = `<h3>${highlightSearchKeyword(item.title, searchKeyword)}${readBadgeHtml}</h3><div class="post-content-area">${item.content}</div><div class="post-footer"><span class="date">${displayDate}</span>${mgmtButtonsHtml}</div>`;
        cardFragment.appendChild(card);
    });
    
    // 깜빡임 없이 리스트 맨 뒤에 이어붙이기
    container.appendChild(cardFragment);

    // 💡 하단 페이지네이션 및 무한 스크롤 교차 관찰자(Observer) 동작 로직
    if (currentDisplayMode === 'infinite') {
        if (!isAppend) {
            paginationContainer.innerHTML = '';
            // 페이지가 남았다면 스크롤 감지 센서(Sentinel) 이식
            if (currentPage < totalPages) {
                const sentinel = document.createElement('div');
                sentinel.id = 'infinite-sentinel';
                sentinel.style.cssText = 'width: 100%; height: 20px; grid-column: 1/-1; margin-top: 20px; background: transparent;';
                paginationContainer.appendChild(sentinel);

                if (window.infiniteObserver) window.infiniteObserver.disconnect();
                window.infiniteObserver = new IntersectionObserver((entries) => {
                    // 유저가 밑바닥 센서 근처(150px)에 도달하면 다음 페이지 조용히 로드
                    if (entries[0].isIntersecting) {
                        if (currentPage < Math.ceil(targetArray.length / postsPerPage)) {
                            currentPage++;
                            renderUI(true);
                        }
                    }
                }, { rootMargin: '150px' });
                window.infiniteObserver.observe(sentinel);
            }
        } else {
            // 끝까지 스크롤하여 더 이상 불러올 게 없으면 관찰자 제거
            if (currentPage >= totalPages && window.infiniteObserver) {
                window.infiniteObserver.disconnect();
                const sentinel = document.getElementById('infinite-sentinel');
                if (sentinel) sentinel.remove();
            }
        }
    } else {
        // 기존 리스트, 갤러리 모드의 버튼식 페이지네이션 생성
        if (!isAppend && totalPages > 1) {
            const pageFragment = document.createDocumentFragment();
            const maxPageButtons = 5; const currentGroup = Math.ceil(currentPage / maxPageButtons);
            let startPage = (currentGroup - 1) * maxPageButtons + 1; let endPage = Math.min(currentGroup * maxPageButtons, totalPages);
            
            if (startPage > 1) { const prevBtn = document.createElement('div'); prevBtn.className = 'page-btn'; prevBtn.innerHTML = '&#139;'; prevBtn.onclick = () => { currentPage = startPage - 1; renderUI(); scrollToPosts(); }; pageFragment.appendChild(prevBtn); }
            for (let i = startPage; i <= endPage; i++) { const btn = document.createElement('div'); btn.className = `page-btn ${i === currentPage ? 'active' : ''}`; btn.innerText = i; btn.onclick = () => { currentPage = i; renderUI(); scrollToPosts(); }; pageFragment.appendChild(btn); }
            if (endPage < totalPages) { const nextBtn = document.createElement('div'); nextBtn.className = 'page-btn'; nextBtn.innerHTML = '&#155;'; nextBtn.onclick = () => { currentPage = endPage + 1; renderUI(); scrollToPosts(); }; pageFragment.appendChild(nextBtn); }
            
            paginationContainer.appendChild(pageFragment);
        }
    }
}

function openDetailModal(key) {
    if (!isAdmin && currentView === 'letters') return;
    const item = ((currentView === 'posts') ? allPosts : allLetters).find(p => p.id === key); if (!item) return;

    if (currentView === 'letters' && isAdmin && !item.read) database.ref('letters/' + key).update({ read: true });

    if (document.getElementById('detail-title')) document.getElementById('detail-title').innerHTML = highlightSearchKeyword(item.title, searchKeyword);
    
    if (document.getElementById('detail-date')) {
        const displayInfo = (currentView === 'posts') ? `${item.author || "기록자"} ㅣ ${formatTo24Hour(item.date)}` : formatTo24Hour(item.date);
        document.getElementById('detail-date').innerText = displayInfo;
    }
    
    if (document.getElementById('detail-text')) document.getElementById('detail-text').innerHTML = escapeHtml(item.content); 
    if (document.getElementById('detail-modal')) { document.getElementById('detail-modal').style.display = 'flex'; document.body.classList.add('no-scroll'); }
}

function triggerBottleAnimation(callback) {
    const bottle = document.createElement('div'); bottle.innerHTML = '🍾'; 
    bottle.style.cssText = 'position:fixed; bottom:15%; left:-100px; font-size:60px; z-index:99999 !important; transition: all 2.5s cubic-bezier(0.42, 0, 0.58, 1); filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5));';
    document.body.appendChild(bottle);
    setTimeout(() => { bottle.style.left = '120%'; bottle.style.transform = 'rotate(720deg) translateY(-80px)'; }, 50);
    setTimeout(() => { bottle.remove(); if(callback) callback(); }, 2500);
}

function savePost() {
    if (!isAdmin || !database || isSubmitting) return;
    const title = document.getElementById('post-title')?.value.trim(); const content = document.getElementById('post-content')?.value.trim();
    if (!title || !content) { showSystemAlert('내용을 모두 입력해주세요.'); return; }
    if (!navigator.onLine) { showSystemAlert('인터넷이 끊겨 글을 기록할 수 없습니다.'); return; }
    const now = new Date(); const date = `${now.getFullYear()}. ${now.getMonth() + 1}. ${now.getDate()}. ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    isSubmitting = true; 
    const postData = { title: title, content: content, date: date, author: loggedInUser };

    if (editTargetKey) { 
        database.ref('posts/' + editTargetKey).update(postData).then(() => { 
            showSystemAlert('기록이 수정되었습니다.'); clearDraftCacheStorage('post'); cancelEdit(); 
            setTimeout(() => window.executeCloudBackupEngine(true), 800);
        }).finally(() => { isSubmitting = false; }); 
    } else { 
        database.ref('posts').push(postData).then(() => { 
            document.getElementById('post-title').value = ''; document.getElementById('post-content').value = ''; clearDraftCacheStorage('post'); currentPage = 1; 
            showSystemAlert('성공적으로 새겨졌습니다.'); 
            setTimeout(() => window.executeCloudBackupEngine(true), 800);
        }).finally(() => { isSubmitting = false; }); 
    }
}
window.savePost = savePost;

function saveLetter() {
    if (!database || isSubmitting || isRestMode) return;
    const title = document.getElementById('letter-title')?.value.trim(); const content = document.getElementById('letter-content')?.value.trim();
    if (!title || !content) { showSystemAlert('제목과 내용을 모두 채워주세요.'); return; }
    if (!navigator.onLine) { showSystemAlert('인터넷이 끊겨 편지를 띄울 수 없습니다.'); return; }
    if (document.getElementById('agree-terms') && !document.getElementById('agree-terms').checked) { showSystemAlert('안내 및 약관에 동의해주세요.'); return; }

    const now = new Date(); const date = `${now.getFullYear()}. ${now.getMonth() + 1}. ${now.getDate()}. ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    isSubmitting = true; 
    const letterData = { title: title, content: content, date: date };

    triggerBottleAnimation(() => {
        database.ref('letters').push(letterData).then(() => {
            document.getElementById('letter-title').value = ''; document.getElementById('letter-content').value = '';
            if (document.getElementById('agree-terms')) document.getElementById('agree-terms').checked = false;
            clearDraftCacheStorage('letter'); showSystemAlert('편지가 바다 위로 안전하게 띄워졌습니다.'); currentPage = 1; renderUI();
            setTimeout(() => window.executeCloudBackupEngine(true), 800);
        }).finally(() => { isSubmitting = false; });
    });
}
window.saveLetter = saveLetter;

function prepareEdit(key) {
    const post = allPosts.find(p => p.id === key); if (!post) return; editTargetKey = key;
    if (document.getElementById('write-title')) document.getElementById('write-title').innerText = "기록 수정하기";
    if (document.getElementById('post-title')) document.getElementById('post-title').value = post.title;
    if (document.getElementById('post-content')) document.getElementById('post-content').value = post.content;
    if (document.getElementById('submit-post-btn')) document.getElementById('submit-post-btn').innerText = "수정하기";
    if (document.getElementById('cancel-edit-btn')) document.getElementById('cancel-edit-btn').style.display = "inline-block";
    if (document.getElementById('write-section')) document.getElementById('write-section').scrollIntoView({ behavior: 'smooth' });
}
window.prepareEdit = prepareEdit;

function cancelEdit() {
    editTargetKey = null;
    if (document.getElementById('write-title')) document.getElementById('write-title').innerText = "새로운 기록 남기기";
    if (document.getElementById('post-title')) document.getElementById('post-title').value = '';
    if (document.getElementById('post-content')) document.getElementById('post-content').value = '';
    if (document.getElementById('submit-post-btn')) document.getElementById('submit-post-btn').innerText = "기록하기";
    if (document.getElementById('cancel-edit-btn')) document.getElementById('cancel-edit-btn').style.display = "none";
    clearDraftCacheStorage('post'); 
}
window.cancelEdit = cancelEdit;

function deletePost(key) {
    if (!isAdmin || !database) return;
    showSystemConfirm('이 기록을 완전히 소멸시키겠습니까?', function() {
        if(editTargetKey === key) cancelEdit();
        database.ref('posts/' + key).remove().then(() => { 
            const totalPagesAfterDelete = Math.ceil((allPosts.length - 1) / postsPerPage); 
            if (currentPage > totalPagesAfterDelete && currentPage > 1) currentPage = totalPagesAfterDelete; 
            renderUI(); 
            setTimeout(() => window.executeCloudBackupEngine(true), 800);
        });
    });
}
window.deletePost = deletePost;

function deleteLetter(key) {
    if (!isAdmin || !database) return;
    showSystemConfirm('이 편지를 바다에서 완전히 소멸시키겠습니까?', function() {
        database.ref('letters/' + key).remove().then(() => { 
            const totalPagesAfterDelete = Math.ceil((allLetters.length - 1) / postsPerPage); 
            if (currentPage > totalPagesAfterDelete && currentPage > 1) currentPage = totalPagesAfterDelete; 
            renderUI(); 
            setTimeout(() => window.executeCloudBackupEngine(true), 800);
        });
    });
}
window.deleteLetter = deleteLetter;

function clearDatabase() {
    if (!isAdmin || !database) return;
    showSystemConfirm('🚨 모든 기록들이 사라집니다. 초기화할까요?', function() { setTimeout(function() { showSystemConfirm('정말 소멸시킬까요?', function() { Promise.all([database.ref('posts').remove(), database.ref('letters').remove()]).then(() => { cancelEdit(); currentPage = 1; showSystemAlert('초기 상태가 되었습니다.'); backupTriggerQueued = true; }); }); }, 150); });
}
window.clearDatabase = clearDatabase;

function escapeHtml(text) { return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"); }

window.addEventListener('offline', () => { showSystemAlert('수평선 너머와의 연결이 끊어졌습니다. 네트워크를 확인해 주세요.'); });
window.addEventListener('online', () => { showSystemAlert('다시 수평선 너머로 연결되었습니다.'); });

function highlightSearchKeyword(text, keyword) {
    const escaped = String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    if (!keyword) return escaped;
    const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    return escaped.replace(regex, match => `<span style="background: rgba(144, 224, 239, 0.25); color: #fff; box-shadow: 0 0 8px rgba(144, 224, 239, 0.6); border-radius: 3px; padding: 0 3px;">${match}</span>`);
}
window.highlightSearchKeyword = highlightSearchKeyword;

function applyTimeBasedThemeEngine() {
    const hour = new Date().getHours();
    let bgStyle = ""; let themeText = "";
    let mode = window.manualTimeOverride || 'auto';
    if (mode === 'auto') {
        if (hour >= 6 && hour < 12) mode = 'morning';
        else if (hour >= 12 && hour < 18) mode = 'day';
        else if (hour >= 18 && hour < 20) mode = 'evening';
        else mode = 'night';
    }
    if (mode === 'morning') { bgStyle = "linear-gradient(135deg, #061121 0%, #153b50 50%, #00b4d8 100%)"; themeText = "🌅 아침의 바다"; }
    else if (mode === 'day') { bgStyle = "linear-gradient(135deg, #000428 0%, #004e92 60%, #90e0ef 100%)"; themeText = "☀️ 낮의 바다"; }
    else if (mode === 'evening') { bgStyle = "linear-gradient(135deg, #0b0f19 0%, #4a192c 50%, #f7a37f 100%)"; themeText = "🌇 저녁의 바다"; }
    else { bgStyle = "linear-gradient(135deg, #02050d 0%, #09132b 60%, #1e1b4b 100%)"; themeText = "🌌 밤의 바다"; }
    if (document.body) {
        document.body.style.transition = "background 3s ease-in-out"; document.body.style.background = bgStyle;
        let tElem = document.getElementById('theme-widget'); if (!tElem) { tElem = document.createElement('div'); tElem.id = 'theme-widget'; document.body.appendChild(tElem); }
        tElem.innerText = themeText;
    }
}

function syncWeatherAndWidget() {
    let wElem = document.getElementById('weather-widget');
    if (!wElem && document.body) { wElem = document.createElement('div'); wElem.id = 'weather-widget'; document.body.appendChild(wElem); }
    
    if (wElem && (!wElem.innerText || wElem.innerText.trim() === "")) {
        wElem.innerText = "⏳ 바다 읽는 중...";
    }
    
    if (window.manualWeatherOverride && window.manualWeatherOverride !== 'auto') { applyManualWeatherEffect(window.manualWeatherOverride); return; }
    const defaultLat = 35.1796; const defaultLon = 129.0756;
    function fetchWeatherData(lat, lon) {
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`)
        .then(res => res.json())
        .then(data => {
            if (window.manualWeatherOverride && window.manualWeatherOverride !== 'auto') return; 
            const code = data.current_weather.weathercode; const temp = data.current_weather.temperature;
            let icon = '☁️'; let weatherType = 'clear';
            if(code === 0) icon = '☀️'; else if(code > 0 && code <= 3) icon = '⛅';
            else if((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) { icon = '🌧️'; weatherType = 'rain'; }
            else if((code >= 71 && code <= 77) || code === 85 || code === 86) { icon = '❄️'; weatherType = 'snow'; }
            if (wElem) { wElem.innerText = `${icon} ${temp}°C`; }
            applyManualWeatherEffect(weatherType);
        })
        .catch(err => {
            if (wElem && (!window.manualWeatherOverride || window.manualWeatherOverride === 'auto')) { wElem.innerText = "☁️ 21°C"; }
            applyManualWeatherEffect('clear');
        });
    }
    if (!navigator.geolocation) { fetchWeatherData(defaultLat, defaultLon); return; }
    navigator.geolocation.getCurrentPosition((position) => fetchWeatherData(position.coords.latitude, position.coords.longitude), (error) => fetchWeatherData(defaultLat, defaultLon), { timeout: 5000 });
}

function applyManualWeatherEffect(type) {
    let overlay = document.getElementById('weather-overlay-layer');
    if (!overlay && document.body) { overlay = document.createElement('div'); overlay.id = 'weather-overlay-layer'; document.body.insertBefore(overlay, document.body.firstChild); }
    if (type === 'rain') {
        if (overlay) overlay.className = 'weather-overlay rain';
        if (window.manualWeatherOverride !== 'auto') { const wElem = document.getElementById('weather-widget'); if (wElem) wElem.innerText = "🌧️ 비 내리는 바다"; }
    } else if (type === 'snow') {
        if (overlay) overlay.className = 'weather-overlay snow';
        if (window.manualWeatherOverride !== 'auto') { const wElem = document.getElementById('weather-widget'); if (wElem) wElem.innerText = "❄️ 눈 내리는 바다"; }
    } else if (type === 'clear') {
        if (overlay) overlay.className = 'weather-overlay';
        if (window.manualWeatherOverride !== 'auto') { const wElem = document.getElementById('weather-widget'); if (wElem) wElem.innerText = "☀️ 평온한 바다"; }
    } else { if (overlay) overlay.className = 'weather-overlay'; }
}

applyTimeBasedThemeEngine();
setInterval(() => { applyTimeBasedThemeEngine(); }, 60000);

window.injectTimeGearButton = function() {
    if (document.getElementById('time-gear-btn')) return;
    const btn = document.createElement('div'); btn.id = 'time-gear-btn'; btn.innerHTML = '⚙️'; btn.title = "환경 설정 (시간/날씨 수동 조작)"; btn.onclick = openEnvironmentSettingsModal; document.body.appendChild(btn);
};

window.openEnvironmentSettingsModal = function() {
    let modal = document.getElementById('env-modal');
    if(!modal) {
        modal = document.createElement('div'); modal.id = 'env-modal'; modal.className = 'modal';
        modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(2, 6, 15, 0.85); display:flex; justify-content:center; align-items:center; z-index:99999; backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px);';
        modal.innerHTML = `
            <div class="modal-content" style="width: 90%; max-width:360px; padding:35px; background:linear-gradient(145deg, #0a1b36, #040d1c); border:1px solid rgba(0, 180, 216, 0.3); border-radius:18px; box-shadow:0 20px 50px rgba(0,0,0,0.7); text-align:center;">
                <h3 style="margin-bottom:25px; font-size:1.3rem; color:#fff; display:flex; align-items:center; justify-content:center;">
                    <span style="background:transparent !important; -webkit-background-clip:padding-box !important; -webkit-text-fill-color:#e2e8f0 !important; color:#e2e8f0 !important; text-shadow:none !important; display:inline-block; font-family:'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif !important; margin-right:8px; font-weight:normal !important;">⚙️</span><span style="background:linear-gradient(135deg, #a9efff, #90e0ef); -webkit-background-clip:text; -webkit-text-fill-color:transparent; font-weight: bold;">서재 환경 조작</span>
                </h3>
                <div class="env-panel-area">
                    <label class="env-label" style="color: #90e0ef;">🌅 시간대 배경</label>
                    <select id="time-select" class="env-select-box">
                        <option value="auto">⏱️ 자동 (실시간 동기화)</option>
                        <option value="morning">🌅 아침 (물안개 청록)</option>
                        <option value="day">☀️ 낮 (스카이 블루)</option>
                        <option value="evening">🌇 저녁 (코랄빛 노을)</option>
                        <option value="night">🌌 밤 (오로라 심해)</option>
                    </select>
                </div>
                <div class="env-panel-area" style="margin-bottom: 32px;">
                    <label class="env-label" style="color: #f7a37f;">⛅ 날씨 효과</label>
                    <select id="weather-select" class="env-select-box" style="border-color: rgba(247, 163, 127, 0.3);">
                        <option value="auto">📍 자동 (현재 위치 기반)</option>
                        <option value="clear">☀️ 맑음 (평온한 바다)</option>
                        <option value="rain">🌧️ 비 (비 내리는 바다)</option>
                        <option value="snow">❄️ 눈 (눈 내리는 바다)</option>
                    </select>
                </div>
                <div style="display:flex; gap:12px; justify-content:center;">
                    <button onclick="applyEnvironmentSettings()" style="flex:1; padding:14px; border-radius:12px; background:linear-gradient(135deg, #00b4d8, #0077b6); color:#fff; border:none; cursor:pointer; font-weight:bold; font-size:1rem; box-shadow:0 4px 15px rgba(0, 180, 216, 0.3); transition:transform 0.2s;">설정 적용</button>
                    <button onclick="document.getElementById('env-modal').style.display='none'" style="flex:1; padding:14px; border:1px solid rgba(255,255,255,0.2); background:rgba(255,255,255,0.05); color:#cbd5e1; border-radius:12px; cursor:pointer; font-size:1rem; transition:background 0.2s;">닫기</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    document.getElementById('time-select').value = window.manualTimeOverride || 'auto';
    document.getElementById('weather-select').value = window.manualWeatherOverride || 'auto';
    modal.style.display = 'flex';
};

window.applyEnvironmentSettings = function() {
    window.manualTimeOverride = document.getElementById('time-select').value;
    window.manualWeatherOverride = document.getElementById('weather-select').value;
    applyTimeBasedThemeEngine(); 
    let wElem = document.getElementById('weather-widget');
    if (window.manualWeatherOverride === 'auto' && wElem) { wElem.innerText = "⏳ 바다 읽는 중..."; }
    syncWeatherAndWidget(); 
    document.getElementById('env-modal').style.display = 'none';
};
