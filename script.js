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
// 🎵 0-B. 음악 및 소리 엔진 설정 (저작권 프리 BGM)
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

// ==========================================
// 🌅 시간대별 배경 테마 적용 엔진 (실시간 감지 및 부드러운 전환)
// ==========================================
function applyTimeBasedThemeEngine() {
    const hour = new Date().getHours();
    let bgStyle = "";
    
    // 1. 아침 (06:00 ~ 11:59): 물안개 걷히는 청명한 새벽 바다 (딥 네이비 -> 맑은 청록)
    if (hour >= 6 && hour < 12) {
        bgStyle = "linear-gradient(135deg, #061121 0%, #153b50 50%, #00b4d8 100%)";
    } 
    // 2. 낮 (12:00 ~ 17:59): 햇살이 깊게 스며드는 눈부신 심해 (코발트 블루 -> 스카이 블루)
    else if (hour >= 12 && hour < 18) {
        bgStyle = "linear-gradient(135deg, #000428 0%, #004e92 60%, #90e0ef 100%)";
    } 
    // 3. 저녁 (18:00 ~ 19:59): 수평선 너머 타오르는 노을 바다 (어스름 -> 자홍빛 -> 코랄 산호색)
    else if (hour >= 18 && hour < 20) {
        bgStyle = "linear-gradient(135deg, #0b0f19 0%, #4a192c 50%, #f7a37f 100%)";
    } 
    // 4. 밤/심야 (20:00 ~ 05:59): 오로라가 흐르는 고요한 밤바다 (극심해 -> 짙은 보라)
    else {
        bgStyle = "linear-gradient(135deg, #02050d 0%, #09132b 60%, #1e1b4b 100%)";
    }
    
    // 💡 [핵심] 배경이 바뀔 때 딱딱하게 끊기지 않고 3초 동안 서서히 섞이며 변하도록 스무딩 처리
    document.body.style.transition = "background 3s ease-in-out";
    document.body.style.background = bgStyle;
}

// ---------------------------------------------------------
// ✨ 실시간 자동 테마 변경 로직 (새로고침 불필요)
// ---------------------------------------------------------
// 1. 유저가 서재에 처음 들어왔을 때 즉시 1회 실행하여 시간대에 맞는 배경을 렌더링
applyTimeBasedThemeEngine();

// 2. 백그라운드 타이머를 켜서 1분(60초)마다 현재 시간을 몰래 확인하고, 
//    시간대가 바뀌면 새로고침 없이 실시간으로 다음 배경으로 스르륵 물들게 함!
setInterval(() => {
    applyTimeBasedThemeEngine();
}, 60000);

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

    fetch('https://api.open-meteo.com/v1/forecast?latitude=35.1796&longitude=129.0756&current_weather=true')
    .then(res => res.json())
    .then(data => {
        localStorage.setItem(cacheKey, JSON.stringify(data));
        localStorage.setItem(cacheTimeKey, String(now));
        renderWeatherHTML(data);
    }).catch(e => {
        if (cachedData) renderWeatherHTML(JSON.parse(cachedData));
        console.log("기상 트래픽 백오프");
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
    
    // 🛠️ [정렬 기준 반영 완료] 현재 선택된 기록자 필터(searchAuthor)에 맞춰 랜덤 추출되도록 로직 개조
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
let isGridView = false; 
let backupTriggerQueued = false; 

window.toggleGridView = function() {
    isGridView = !isGridView;
    renderUI();
};

document.addEventListener('DOMContentLoaded', function() {
    try {
        if (localStorage.getItem('isAdminLoggedIn') === 'true') { isAdmin = true; loggedInUser = localStorage.getItem('loggedInUser') || ''; requestNotificationPermission(); }
        applyTimeBasedThemeEngine();
        initDraftAutoSaveEngine();
        injectRandomMemoryButton();
        injectTimeGearButton();
        fetchWeatherWidget();
        syncWeatherAndWidget(); // 💡 처음에 한 번 날씨 불러오기
        setInterval(syncWeatherAndWidget, 30 * 60000); // 💡 30분마다 날씨 갱신
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

const secureConfig = {
    apiKey: atob("QUl6YVN5QzducVFxRUpjRnBfamR5NHdWRzMzV1lYSWo1eFdKdVYw"),
    authDomain: atob("c3Rhci1ib2NrLmZpcmViYXNlcGFwcC5jb20="),
    databaseURL: atob("aHR0cHM6Ly9zdGFyLWJvY2stZGVmYXVsdC1ydGRiLmZpcmViYXNlaW8uY29t"), 
    projectId: atob("c3Rhci1ib2Nr"),
    storageBucket: atob("c3Rhci1ib2NrLmZpcmViYXNlc3RvcmFnZS5hcHA="),
    messagingSenderId: atob("MzUxNTA3Nzg0NzE3"),
    appId: atob("MTozNTE1MDc3ODQ3MTc6d2ViOmUyMmJiNTcxOGMwZWJmYmQzY2ExNDQ="),
    measurementId: atob("Ry0zRU03OTQ3OUpU")
};

const secureAdmin = { id: decodeData("7JWE7Iuc"), pw: atob("YXNoaSMyNjA0MTY=") };

let database = null;
try { if (typeof firebase !== 'undefined') { firebase.initializeApp(secureConfig); database = firebase.database(); } } 
catch (error) { console.error("Firebase 초기화 에러:", error); }

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

// 🛠️ [신택스오류 제거 및 30일 보존 문구 유실 차단 완성형 탭 스위처]
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
        if(subtitleSpan) subtitleSpan.style.setProperty('display', 'block', 'important'); // 백업 탭 진입 시 보존 문구 가동
        if(timelineWrapper) timelineWrapper.style.setProperty('display', 'block', 'important');
        loadBackupTimelineList();
    } else if (tab === 'settings') {
        if(btnSettings) { btnSettings.style.color = '#f7a37f'; btnSettings.style.borderBottom = '2px solid #f7a37f'; }
        if(btnBackup) { btnBackup.style.color = '#64748b'; btnBackup.style.borderBottom = '2px solid transparent'; }
        if(listContainer) listContainer.style.setProperty('display', 'none', 'important');
        if(delControls) delControls.style.setProperty('display', 'none', 'important'); // 런타임 오류 완전히 수정 완료
        if(settingsContainer) settingsContainer.style.setProperty('display', 'block', 'important');
        if(subtitleSpan) subtitleSpan.style.setProperty('display', 'none', 'important'); // 설정 탭 진입 시 보존 문구 철저히 소멸
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

// 🛠️ [레이스 컨디션 해결] 목적 타겟 상태 선제 매핑을 통한 반대 출력 문제 완치
function toggleRestMode() {
    if(!isAdmin || !database) return;
    const targetState = !isRestMode; // 비동기 쓰기 이전에 타겟 상태 완벽 변수 바인딩
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
    if (inputId === secureAdmin.id && inputPw === secureAdmin.pw) { tempUser = "아시"; }
    else if (inputId === haeunId && inputPw === atob("aGFldW4jMjYwNDE2")) { tempUser = "하은"; }

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
        // ✨ [추가] 로그인 시 body에 클래스를 추가하여 소라게를 위로 올립니다.
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
        // ✨ [추가] 로그아웃 시 클래스를 제거하여 소라게를 다시 밑으로 내립니다.
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
            allPosts.reverse(); 
        }
        // ✨ 자동 백업 꼬임 방지를 위해 리스너에서는 알림만 담당합니다.
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
            allLetters.reverse();
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
                    <div style="display:flex; gap:4px; flex-shrink:0; align-items:center;">
                        <button onclick="window.downloadBackupFile('${key}', 'txt')" style="font-size:0.7rem; border:1px solid #90e0ef; color:#90e0ef; padding: 3px 6px; border-radius:5px; background:transparent; cursor:pointer;">TXT</button>
                        <button onclick="window.downloadBackupFile('${key}', 'pdf')" style="font-size:0.7rem; border:1px solid #ffd4ba; color:#ffd4ba; padding: 3px 6px; border-radius:5px; background:transparent; cursor:pointer;">PDF</button>
                        <button onclick="window.restoreFromTargetBackupPoint('${key}')" style="font-size:0.75rem; border-color:#f7a37f; color:#f7a37f; padding: 4px 10px; border-radius:6px; background:transparent; cursor:pointer;">복구</button>
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

function renderUI() {
    const container = document.getElementById('posts-container'); const paginationContainer = document.getElementById('pagination-container');
    const subtitleElem = document.querySelector('.section-subtitle'); const authorStatsContainer = document.getElementById('author-stats'); const authorFilterContainer = document.getElementById('author-filter-container');
    if (!container || !paginationContainer) return; container.innerHTML = ''; paginationContainer.innerHTML = '';

    if (isGridView) container.classList.add('posts-grid-view'); else container.classList.remove('posts-grid-view');

    if (subtitleElem) {
        let subtitleText = currentView === 'posts' 
            ? `아래 바다에 기록된 글들을 클릭하여 읽어주세요!<br><span style="color: #90e0ef; font-size: 0.85rem; display: inline-block; margin-top: 9px;">총 기록된 글 : ${allPosts.length}개</span>` 
            : `수평선 너머 바다 위에 띄워진 편지들.<br><span style="color: #ffd4ba; font-size: 0.85rem; display: inline-block; margin-top: 9px;">띄워진 편지 : ${allLetters.length}개</span>`;
        
        let gridBtnText = isGridView ? '📄 리스트 모드로 보기' : '🔲 갤러리 모드로 보기';
        
        let gridBtnHtml = `
            <div style="margin-top:14px;">
                <button onclick="window.toggleGridView()" style="font-size:0.8rem; background:rgba(255, 255, 255, 0.03); border:1px solid rgba(0, 180, 216, 0.15); color:#fff; padding:7px 16px; border-radius:25px; cursor:pointer; font-weight:500; letter-spacing:0.3px; transition:0.2s; outline:none; box-shadow:0 2px 8px rgba(0,0,0,0.2);">
                    ${gridBtnText}
                </button>
            </div>
        `;
        subtitleElem.innerHTML = subtitleText + gridBtnHtml;
    }

    if (currentView === 'posts') {
        if (authorStatsContainer) authorStatsContainer.style.display = 'flex'; if (authorFilterContainer) authorFilterContainer.style.display = 'block';
        let ashiCount = 0; let haeunCount = 0; allPosts.forEach(post => { if ((post.author || "").includes("하은")) haeunCount++; else ashiCount++; });
        if (authorStatsContainer) authorStatsContainer.innerHTML = `<span class="stat-badge">아시 : ${ashiCount}개</span><span class="stat-badge">하은 : ${haeunCount}개</span>`;
    } else {
        if (authorStatsContainer) authorStatsContainer.style.display = 'none'; if (authorFilterContainer) authorFilterContainer.style.display = 'none';
    }

    let targetArray = (currentView === 'posts') ? allPosts : allLetters;
    if (currentView === 'posts' && searchAuthor !== 'all') { targetArray = targetArray.filter(item => { const author = item.author || "기록자"; return searchAuthor === "하은" ? author.includes("하은") : !author.includes("하은"); }); }
    if (searchKeyword) targetArray = targetArray.filter(item => String(item.title).toLowerCase().includes(searchKeyword.toLowerCase()));

    if (targetArray.length === 0) { container.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color:#94a3b8; margin-top:40px;">존재하지 않습니다.</p>`; return; }

    const totalPages = Math.ceil(targetArray.length / postsPerPage);
    const currentItems = targetArray.slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage);

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
        card.innerHTML = `<h3>${escapeHtml(item.title)}${readBadgeHtml}</h3><div class="post-content-area">${escapeHtml(item.content)}</div><div class="post-footer"><span class="date">${displayDate}</span>${mgmtButtonsHtml}</div>`;
        container.appendChild(card);
    });

    if (totalPages > 1) {
        const maxPageButtons = 5; const currentGroup = Math.ceil(currentPage / maxPageButtons);
        let startPage = (currentGroup - 1) * maxPageButtons + 1; let endPage = Math.min(currentGroup * maxPageButtons, totalPages);
        if (startPage > 1) { const prevBtn = document.createElement('div'); prevBtn.className = 'page-btn'; prevBtn.innerHTML = '&#139;'; prevBtn.onclick = () => { currentPage = startPage - 1; renderUI(); scrollToPosts(); }; paginationContainer.appendChild(prevBtn); }
        for (let i = startPage; i <= endPage; i++) { const btn = document.createElement('div'); btn.className = `page-btn ${i === currentPage ? 'active' : ''}`; btn.innerText = i; btn.onclick = () => { currentPage = i; renderUI(); scrollToPosts(); }; paginationContainer.appendChild(btn); }
        if (endPage < totalPages) { const nextBtn = document.createElement('div'); nextBtn.className = 'page-btn'; nextBtn.innerHTML = '&#155;'; nextBtn.onclick = () => { currentPage = endPage + 1; renderUI(); scrollToPosts(); }; paginationContainer.appendChild(nextBtn); }
    }
}

function openDetailModal(key) {
    if (!isAdmin && currentView === 'letters') return;
    const item = ((currentView === 'posts') ? allPosts : allLetters).find(p => p.id === key); if (!item) return;

    if (currentView === 'letters' && isAdmin && !item.read) database.ref('letters/' + key).update({ read: true });

    if (document.getElementById('detail-title')) document.getElementById('detail-title').innerHTML = escapeHtml(item.title);
    
    // 🛠️ [작성자가 안 뜨는 문제 수정 완료] 글 모드일 때 작성자 정보가 날짜와 함께 바인딩되도록 교정
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
            setTimeout(() => window.executeCloudBackupEngine(true), 800); // ✨ 작성/수정 완료 시 확실한 자동 백업
        }).finally(() => { isSubmitting = false; }); 
    } else { 
        database.ref('posts').push(postData).then(() => { 
            document.getElementById('post-title').value = ''; document.getElementById('post-content').value = ''; clearDraftCacheStorage('post'); currentPage = 1; 
            showSystemAlert('성공적으로 새겨졌습니다.'); 
            setTimeout(() => window.executeCloudBackupEngine(true), 800); // ✨ 작성 완료 시 확실한 자동 백업
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
            setTimeout(() => window.executeCloudBackupEngine(true), 800); // ✨ 편지 작성 시 확실한 자동 백업
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
            setTimeout(() => window.executeCloudBackupEngine(true), 800); // ✨ 삭제 완료 시 확실한 자동 백업
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
            setTimeout(() => window.executeCloudBackupEngine(true), 800); // ✨ 삭제 완료 시 확실한 자동 백업
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

// ==========================================
// 📡 0-C. 오프라인(인터넷 끊김) 감지 방어 시스템
// ==========================================
window.addEventListener('offline', () => {
    // 인터넷이 끊겼을 때 띄우는 알림
    showSystemAlert('수평선 너머와의 연결이 끊어졌습니다. 네트워크를 확인해 주세요.');
});

window.addEventListener('online', () => {
    // 인터넷이 다시 연결되었을 때 띄우는 알림
    showSystemAlert('다시 수평선 너머로 연결되었습니다.');
});

// 🌅 [수정] 수동 설정을 감지하는 배경 테마 엔진
function applyTimeBasedThemeEngine() {
    const hour = new Date().getHours();
    let bgStyle = "";
    
    let mode = window.manualTimeOverride || 'auto';
    if (mode === 'auto') {
        if (hour >= 6 && hour < 12) mode = 'morning';
        else if (hour >= 12 && hour < 18) mode = 'day';
        else if (hour >= 18 && hour < 20) mode = 'evening';
        else mode = 'night';
    }

    if (mode === 'morning') bgStyle = "linear-gradient(135deg, #061121 0%, #153b50 50%, #00b4d8 100%)";
    else if (mode === 'day') bgStyle = "linear-gradient(135deg, #000428 0%, #004e92 60%, #90e0ef 100%)";
    else if (mode === 'evening') bgStyle = "linear-gradient(135deg, #0b0f19 0%, #4a192c 50%, #f7a37f 100%)";
    else bgStyle = "linear-gradient(135deg, #02050d 0%, #09132b 60%, #1e1b4b 100%)";
    
    document.body.style.transition = "background 3s ease-in-out";
    document.body.style.background = bgStyle;
}

// ⛅ [수정] 수동 설정을 감지하는 날씨 동기화 엔진
function applyManualWeatherEffect(type) {
    let overlay = document.getElementById('weather-overlay-layer');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'weather-overlay-layer';
        overlay.className = 'weather-overlay';
        document.body.insertBefore(overlay, document.body.firstChild);
    }
    let wElem = document.getElementById('weather-widget');

    if (type === 'rain') {
        overlay.className = 'weather-overlay rain';
        if (wElem && window.manualWeatherOverride !== 'auto') wElem.innerText = "🌧️ 비 내리는 바다";
    } else if (type === 'snow') {
        overlay.className = 'weather-overlay snow';
        if (wElem && window.manualWeatherOverride !== 'auto') wElem.innerText = "❄️ 눈 내리는 바다";
    } else {
        overlay.className = 'weather-overlay';
        if (wElem && window.manualWeatherOverride !== 'auto') wElem.innerText = "☀️ 평온한 바다";
    }
}

function syncWeatherAndWidget() {
    if (window.manualWeatherOverride !== 'auto') {
        applyManualWeatherEffect(window.manualWeatherOverride);
        return;
    }

    const defaultLat = 35.1796;
    const defaultLon = 129.0756;
    
    function fetchWeatherData(lat, lon) {
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`)
        .then(res => res.json())
        .then(data => {
            if (window.manualWeatherOverride !== 'auto') return; 
            
            const code = data.current_weather.weathercode;
            const temp = data.current_weather.temperature;
            let icon = '☁️';
            let weatherType = 'clear';

            if(code === 0) icon = '☀️';
            else if(code > 0 && code <= 3) icon = '⛅';
            else if((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) { icon = '🌧️'; weatherType = 'rain'; }
            else if((code >= 71 && code <= 77) || code === 85 || code === 86) { icon = '❄️'; weatherType = 'snow'; }
            
            let wElem = document.getElementById('weather-widget');
            if(!wElem) {
                wElem = document.createElement('div');
                wElem.id = 'weather-widget';
                document.body.appendChild(wElem);
            }
            wElem.innerHTML = `${icon} ${temp}°C`;
            applyManualWeatherEffect(weatherType);
        })
        .catch(err => console.log("날씨 정보를 불러오지 못했습니다."));
    }

    if (!navigator.geolocation) { fetchWeatherData(defaultLat, defaultLon); return; }

    navigator.geolocation.getCurrentPosition(
        (position) => fetchWeatherData(position.coords.latitude, position.coords.longitude),
        (error) => fetchWeatherData(defaultLat, defaultLon),
        { timeout: 7000 }
    );
}
// ==========================================
// 🌟 1. 검색어 야광 플랑크톤(하이라이트) 엔진
// ==========================================
window.highlightSearchKeyword = function(text, keyword) {
    // 보안을 위해 먼저 HTML 태그를 무력화(이스케이프) 합니다.
    const escaped = String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    if (!keyword) return escaped;
    
    // 검색어가 존재하면 야광 CSS를 씌워서 반환
    const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    return escaped.replace(regex, match => `<span style="background: rgba(144, 224, 239, 0.25); color: #fff; box-shadow: 0 0 8px rgba(144, 224, 239, 0.6); border-radius: 3px; padding: 0 3px;">${match}</span>`);
};

// ==========================================
// ⚙️ 2. 환경 수동 조작(톱니바퀴) 엔진 (기본값: 자동)
// ==========================================
window.manualTimeOverride = 'auto'; 
window.manualWeatherOverride = 'auto'; 

window.injectTimeGearButton = function() {
    if (document.getElementById('time-gear-btn')) return;
    const btn = document.createElement('div');
    btn.id = 'time-gear-btn';
    btn.innerHTML = '⚙️';
    btn.title = "환경 설정 (시간/날씨 수동 조작)";
    btn.onclick = openEnvironmentSettingsModal;
    document.body.appendChild(btn);
};

window.openEnvironmentSettingsModal = function() {
    let modal = document.getElementById('env-modal');
    if(!modal) {
        modal = document.createElement('div');
        modal.id = 'env-modal';
        modal.className = 'modal';
        modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); display:flex; justify-content:center; align-items:center; z-index:99999; backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px);';
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width:340px; padding:30px;">
                <h3 style="color:#fff; margin-bottom:20px; font-size:1.15rem;">서재 환경 조작</h3>
                <div style="margin-bottom:20px; text-align:left;">
                    <label style="color:#cbd5e1; font-size:0.85rem; margin-bottom:8px; display:block;">🌅 시간대 배경</label>
                    <select id="time-select" style="width:100%; padding:12px; border-radius:8px; background:rgba(0,0,0,0.4); border:1px solid rgba(144,224,239,0.3); color:#fff; outline:none; font-size:0.9rem;">
                        <option value="auto">자동 (실시간 동기화)</option>
                        <option value="morning">아침 (물안개 청록)</option>
                        <option value="day">낮 (스카이 블루)</option>
                        <option value="evening">저녁 (코랄빛 노을)</option>
                        <option value="night">밤 (오로라 심해)</option>
                    </select>
                </div>
                <div style="margin-bottom:25px; text-align:left;">
                    <label style="color:#cbd5e1; font-size:0.85rem; margin-bottom:8px; display:block;">⛅ 날씨 효과</label>
                    <select id="weather-select" style="width:100%; padding:12px; border-radius:8px; background:rgba(0,0,0,0.4); border:1px solid rgba(144,224,239,0.3); color:#fff; outline:none; font-size:0.9rem;">
                        <option value="auto">자동 (현재 위치 기반)</option>
                        <option value="clear">맑음 (평온한 바다)</option>
                        <option value="rain">비 (비 내리는 바다)</option>
                        <option value="snow">눈 (눈 내리는 바다)</option>
                    </select>
                </div>
                <div style="display:flex; gap:10px; justify-content:center;">
                    <button onclick="applyEnvironmentSettings()" style="flex:1; padding:10px; border-radius:8px; background:#00b4d8; color:#02050d; border:none; cursor:pointer; font-weight:bold;">적용</button>
                    <button onclick="document.getElementById('env-modal').style.display='none'" style="flex:1; padding:10px; border:1px solid #94a3b8; background:transparent; color:#94a3b8; border-radius:8px; cursor:pointer;">닫기</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    document.getElementById('time-select').value = window.manualTimeOverride;
    document.getElementById('weather-select').value = window.manualWeatherOverride;
    modal.style.display = 'flex';
};

window.applyEnvironmentSettings = function() {
    window.manualTimeOverride = document.getElementById('time-select').value;
    window.manualWeatherOverride = document.getElementById('weather-select').value;
    
    applyTimeBasedThemeEngine(); // 배경 업데이트
    syncWeatherAndWidget(); // 날씨 업데이트
    document.getElementById('env-modal').style.display = 'none';
};
