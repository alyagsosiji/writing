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
// 3. 라이프 사이클 매니저
// ==========================================
window.addEventListener('load', function() {
    setTimeout(function() {
        const loader = document.getElementById('loading-screen');
        loader.style.opacity = '0';
        setTimeout(() => loader.style.display = 'none', 800);
    }, 1200);
    listenPosts();
    listenLetters();
});

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

    if (isAdmin) {
        writeSection.style.display = 'block';
        letterSection.style.display = 'none'; 
        loginBtn.style.display = 'none';
        adminMenu.style.display = 'flex'; 
        tabContainer.style.display = 'flex'; 
    } else {
        writeSection.style.display = 'none';
        letterSection.style.display = 'block'; 
        loginBtn.style.display = 'inline-block';
        adminMenu.style.display = 'none';
        tabContainer.style.display = 'none'; 
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
    
    document.getElementById('tab-posts').classList.remove('active');
    document.getElementById('tab-letters').classList.remove('active');
    
    if(view === 'posts') {
        document.getElementById('tab-posts').classList.add('active');
        document.getElementById('section-main-title').innerText = "기록된 바다";
    } else {
        document.getElementById('tab-letters').classList.add('active');
        document.getElementById('section-main-title').innerText = "도착한 편지";
    }
    renderUI();
}

function handleSearch() {
    searchKeyword = document.getElementById('search-input').value.trim();
    currentPage = 1; 
    renderUI();
}

// ==========================================
// 6. 실시간 동기화 데이터베이스 제어 인터페이스
// ==========================================
function listenPosts() {
    database.ref('posts').on('value', (snapshot) => {
        const postsData = snapshot.val();
        allPosts = [];
        if (postsData) {
            Object.keys(postsData).forEach((key) => {
                allPosts.push({ id: key, ...postsData[key] });
            });
            allPosts.reverse(); 
        }
        if(currentView === 'posts') renderUI();
    });
}

function listenLetters() {
    database.ref('letters').on('value', (snapshot) => {
        const lettersData = snapshot.val();
        allLetters = [];
        if (lettersData) {
            Object.keys(lettersData).forEach((key) => {
                allLetters.push({ id: key, ...lettersData[key] });
            });
            allLetters.reverse();
        }
        if(currentView === 'letters') renderUI();
    });
}

function renderUI() {
    const container = document.getElementById('posts-container');
    const paginationContainer = document.getElementById('pagination-container');
    
    container.innerHTML = '';
    paginationContainer.innerHTML = '';

    if (!isAdmin && currentView === 'letters') {
        currentView = 'posts';
    }

    let targetArray = (currentView === 'posts') ? allPosts : allLetters;

    if (searchKeyword) {
        targetArray = targetArray.filter(item => 
            String(item.title).toLowerCase().includes(searchKeyword.toLowerCase())
        );
    }

    if (targetArray.length === 0) {
        const text = searchKeyword 
            ? `'${searchKeyword}'가 포함된 내용이 바다에 존재하지 않습니다.` 
            : ((currentView === 'posts') ? "아직 채워지지 않은 수평선 너머 바다입니다." : "도착한 편지가 없습니다.");
        container.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color:#9c9197; margin-top:40px; font-size:0.9rem; letter-spacing:1px;">${text}</p>`;
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

        // 기록된 바다 탭일 때만 날짜 문자열 앞에 '아시ㅣ ' 접두사 결합
        const displayDate = (currentView === 'posts') ? `아시ㅣ ${item.date}` : item.date;

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

        for (let i = startPage; i <= end
