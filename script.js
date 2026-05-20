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
    authDomain: atob("c3Rhci1ib2NrLmZpcmViYXNlYXBwLmNvbQ=="), 
    databaseURL: atob("aHR0cHM6Ly9zdGFyLWJvY2stZGVmYXVsdC1ydGRiLmZpcmViYXNlaW8uY29t"), 
    projectId: atob("c3Rhci1ib2Nr"),
    storageBucket: atob("c3Rhci1ib2NrLmZpcmViYXNlc3RvcmFnZS5hcHA="),
    messagingSenderId: atob("MzUxNTA3Nzg0NzE3"),
    appId: atob("MTozNTE1MDc3ODQ3MTc6d2ViOmUyMmJiNTcxOGMwZWJmYmQzY2ExNDQ="),
    measurementId: atob("Ry0zRU03OTQ3OUpU")
};

const secureAdmin = {
    id: decodeData("7JWE7Iuc"), // 아시
    pw: atob("YXNoaSMyNjA0MTY=")        // ashi#260416 반영 완료
};

firebase.initializeApp(secureConfig);
const database = firebase.database();

let isAdmin = false;
let currentView = 'posts'; 
let currentPage = 1;
const postsPerPage = 6;

let allPosts = [];
let allLetters = []; 
let editTargetKey = null; 
let searchKeyword = ''; 

// 🛠️ [연타 방지 기능] 중복 발송을 원천 차단하기 위한 글로벌 제어 플래그
let isSubmitting = false;

// ==========================================
// 3. 라이프 사이클 매니저 (요청에 따라 강제 종료 타이머 제거 완료)
// ==========================================
function hideLoadingScreen() {
    const loader = document.getElementById('loading-screen');
    if (loader && loader.style.display !== 'none') {
        loader.style.opacity = '0';
        setTimeout(() => loader.style.display = 'none', 800);
    }
}

// HTML 구조가 준비되면 즉시 데이터 조회 가동
window.addEventListener('DOMContentLoaded', function() {
    try {
        listenPosts();
        listenLetters();
    } catch (e) {
        console.error("데이터 로드 중 예외 발생:", e);
    }
});

// 모든 리소스 및 Firebase 연결 로드가 최종 완료되면 로딩 화면 해제
window.addEventListener('load', hideLoadingScreen);

// ==========================================
// 4. 컴팩트 시스템 안내 / 컨펌 모달 윈도우 대체기
// ==========================================
function showSystemAlert(message, callback) {
    document.getElementById('system-title').innerText = "안내";
    document.getElementById('system-message').innerText = message;
    const buttonContainer = document.getElementById('system-buttons');
    buttonContainer.innerHTML = "";
    
    const okBtn = document.createElement('button');
    okBtn.innerText = "확인";
    okBtn.onclick = function() {
        document.getElementById('system-modal').style.display = 'none';
        if (callback) callback();
    };
    buttonContainer.appendChild(okBtn);
    document.getElementById('system-modal').style.display = 'flex';
}

function showSystemConfirm(message, onConfirm, onCancel) {
    document.getElementById('system-title').innerText = "확인";
    document.getElementById('system-message').innerText = message;
    const buttonContainer = document.getElementById('system-buttons');
    buttonContainer.innerHTML = "";
    
    const confirmBtn = document.createElement('button');
    confirmBtn.innerText = "확인";
    confirmBtn.onclick = function() {
        document.getElementById('system-modal').style.display = 'none';
        if (onConfirm) onConfirm();
    };
    
    const cancelBtn = document.createElement('button');
    cancelBtn.innerText = "취소";
    cancelBtn.className = "cancel-btn";
    cancelBtn.onclick = function() {
        document.getElementById('system-modal').style.display = 'none';
        if (onCancel) onCancel();
    };
    
    buttonContainer.appendChild(confirmBtn);
    buttonContainer.appendChild(cancelBtn);
    document.getElementById('system-modal').style.display = 'flex';
}

// ==========================================
// 5. 로그인 / 로그아웃 인증 매니저 (가시성 철저 제어)
// ==========================================
function openModal() { document.getElementById('login-modal').style.display = 'flex'; }
function closeModal() { document.getElementById('login-modal').style.display = 'none'; }

function login() {
    const inputId = document.getElementById('admin-id').value;
    const inputPw = document.getElementById('admin-pw').value;

    if (inputId === secureAdmin.id && inputPw === secureAdmin.pw) {
        isAdmin = true;
        closeModal();
        showSystemAlert('환영합니다, 수평선 너머 바다의 기록자, 아시님.', function() {
            updateUI();
        });
    } else {
        showSystemAlert('올바른 접근이 아닙니다.');
    }
}

function logout() {
    isAdmin = false;
    cancelEdit();
    showSystemAlert('로그아웃 되었습니다.', function()
