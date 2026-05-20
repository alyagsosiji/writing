// ==========================================
// 🛠️ 0. 최우선 라이프 사이클 매니저 (타임아웃 제외 보존형)
// ==========================================
function hideLoadingScreen() {
    const loader = document.getElementById('loading-screen');
    if (loader) {
        // 스타일 충돌 방지 패치 클래스 가동
        loader.classList.add('fade-out');
    }
}

// 브라우저가 화면 구조 해석을 완료(interactive)하면 무거운 이미지 완료와 상관없이 로딩 강제 해제 보장
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    hideLoadingScreen();
} else {
    document.addEventListener('DOMContentLoaded', hideLoadingScreen);
}

document.addEventListener('DOMContentLoaded', function() {
    try {
        listenPosts();
        listenLetters();
    } catch (e) {
        console.error("데이터 실시간 리스닝 시작 중 예외 발생:", e);
        hideLoadingScreen();
    }
});

// ==========================================
// ⏱️ 24시간 형식 무결성 보정 엔진 (과거 데이터 실시간 강제 소급 적용 연동)
// ==========================================
function formatTo24Hour(dateStr) {
    if (!dateStr) return '';
    let str = String(dateStr).trim();
    
    // 특정 모바일 브라우저 환경에서 오전 12시를 '24:'로 표출하는 치명적 뷰 버그 '00:' 강제 변환
    str = str.replace(/\b24(?=:\d{2})/g, '00');
    
    // 원래 적혀있던 과거 데이터 분해 및 24시간 표준 포맷 하이재킹 연산
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
    id: decodeData("7JWE7Iuc"), // 아시
    pw: atob("YXNoaSMyNjA0MTY=")        // ashi#260416
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
    console.error("Firebase 초기화 중 에러 발생:", error);
}

let isAdmin = false;
let currentView = 'posts'; 
let currentPage = 1;
const postsPerPage = 6;

let allPosts = [];
let allLetters = []; 
let editTargetKey = null; 
let searchKeyword = ''; 

// 🛠️ [연타 방지 기능] 중복 발송 차단 글로벌 잠금 플래그
let isSubmitting = false;

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
    if (!database) return;
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
    if (!database) return;
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

// ==========================================
// 7. UI 데이터 렌더링 엔진 (소급 적용 보정 함수 강제 결합)
// ==========================================
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

        // 기존에 적혀있던 모든 구형 날짜 포맷도 실시간 00시 규격으로 출력 처리
        const formattedDate = formatTo24Hour(item.date);
        const displayDate = (currentView === 'posts') ? `아시ㅣ ${formattedDate}` : formattedDate;

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

// ==========================================
// 8. 데이터 상세 조회 및 트랜잭션 관리 매니저
// ==========================================
function openDetailModal(key) {
    if (!isAdmin && currentView === 'letters') return;

    const searchPool = (currentView === 'posts') ? allPosts : allLetters;
    const item = searchPool.find(p => p.id === key);
    if (!item) return;

    document.getElementById('detail-title').innerText = item.title;
    // 팝업 모달 상세 보기창의 날짜 출력도 무결성 변환을 거칩니다.
    document.getElementById('detail-date').innerText = formatTo24Hour(item.date);
    document.getElementById('detail-text').innerText = item.content;
    document.getElementById('detail-modal').style.display = 'flex';
}

function closeDetailModal() { document.getElementById('detail-modal').style.display = 'none'; }

function savePost() {
    if (!isAdmin || !database) return;
    if (isSubmitting) return; 

    const title = document.getElementById('post-title').value.trim();
    const content = document.getElementById('post-content').value.trim();
    
    // 신규 수평선 기록 데이터 엄격 표준 00시 포맷 강제 정의
    const now = new Date();
    const date = `${now.getFullYear()}. ${now.getMonth() + 1}. ${now.getDate()}. ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    if (!title || !content) {
        showSystemAlert('수평선에 새길 내용을 모두 입력해주세요.');
        return;
    }

    isSubmitting = true; 

    const postData = { title: title, content: content, date: date };

    if (editTargetKey) {
        database.ref('posts/' + editTargetKey).update(postData)
            .then(() => {
                showSystemAlert('기록이 수정되어 바다에 다시 새겨졌습니다.');
                cancelEdit();
            }).catch(err => showSystemAlert("수정 오류 : " + err.message))
            .finally(() => { isSubmitting = false; }); 
    } else {
        database.ref('posts').push(postData)
            .then(() => {
                document.getElementById('post-title').value = '';
                document.getElementById('post-content').value = '';
                currentPage = 1;
                showSystemAlert('바다에 새로운 기록이 성공적으로 수평선 너머에 새겨졌습니다.');
            }).catch(err => showSystemAlert("기록 오류: " + err.message))
            .finally(() => { isSubmitting = false; }); 
    }
}

function saveLetter() {
    if (!database || isSubmitting) return; 

    const title = document.getElementById('letter-title').value.trim();
    const content = document.getElementById('letter-content').value.trim();
    
    // 신규 편지 발송 데이터 표준 00시 규격화 연산
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
            document.getElementById('letter-title').value = '';
            document.getElementById('letter-content').value = '';
            showSystemAlert('아시님에게 보낼 편지가 넓은 바다 위로 안전하게 띄워졌습니다.');
            currentPage = 1;
            renderUI();
        }).catch(err => showSystemAlert("편지 발송 에러 : " + err.message))
        .finally(() => { isSubmitting = false; }); 
}

function prepareEdit(key) {
    const post = allPosts.find(p => p.id === key);
    if (!post) return;

    editTargetKey = key;
    document.getElementById('write-title').innerText = "기록 수정하기";
    document.getElementById('post-title').value = post.title;
    document.getElementById('post-content').value = post.content;
    document.getElementById('submit-post-btn').innerText = "수정하기";
    document.getElementById('cancel-edit-btn').style.display = "inline-block";
    document.getElementById('write-section').scrollIntoView({ behavior: 'smooth' });
}

function cancelEdit() {
    editTargetKey = null;
    document.getElementById('write-title').innerText = "새로운 기록 남기기";
    document.getElementById('post-title').value = '';
    document.getElementById('post-content').value = '';
    document.getElementById('submit-post-btn').innerText = "기록하기";
    document.getElementById('cancel-edit-btn').style.display = "none";
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
        }).catch(err => showSystemAlert("소멸 처리 오류: " + err.message));
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
    
    showSystemConfirm('🚨 [치명적 대량 소멸 경고]\n수평선 너머 모든 글과 편지들이 흔적도 없이 사라집니다. 초기화할까요?', function() {
        setTimeout(function() {
            showSystemConfirm('이 작업은 절대 되돌릴 수 없습니다. 정말 모든 기록과 편지를 영구 파괴할까요?', function() {
                Promise.all([
                    database.ref('posts').remove(),
                    database.ref('letters').remove()
                ]).then(() => {
                    cancelEdit();
                    currentPage = 1;
                    showSystemAlert('바다가 완전히 정화되어 공백의 초기 상태가 되었습니다.');
                }).catch((error) => showSystemAlert('초기화 실패 : ' + error.message));
            });
        }, 150);
    });
}

function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}    // 2. 데이터베이스에 '오전/오후 12시' 등으로 저장되어 있던 과거 데이터(원래 썼던 글) 정밀 파싱
    if (str.includes('오전') || str.includes('오후')) {
        const isPm = str.includes('오후');
        str = str.replace(/오전\s*|오후\s*/g, ''); // 오전/오후 글자 제거
        
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
    id: decodeData("7JWE7Iuc"), // 아시
    pw: atob("YXNoaSMyNjA0MTY=")        // ashi#260416
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
    console.error("Firebase 초기화 중 에러 발생:", error);
}

let isAdmin = false;
let currentView = 'posts'; 
let currentPage = 1;
const postsPerPage = 6;

let allPosts = [];
let allLetters = []; 
let editTargetKey = null; 
let searchKeyword = ''; 

// 🛠️ [연타 방지 기능] 중복 발송 차단 글로벌 잠금 플래그
let isSubmitting = false;

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
    if (!database) return;
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
    if (!database) return;
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

// ==========================================
// 7. UI 데이터 렌더링 엔진 (소급 적용 24시간 형식 연동)
// ==========================================
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

        // 🛠️ 원래 썼던 기존 글과 편지에도 무조건 00시 형식이 나오도록 실시간 보정 처리
        const formattedDate = formatTo24Hour(item.date);
        const displayDate = (currentView === 'posts') ? `아시ㅣ${formattedDate}` : formattedDate;

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

// ==========================================
// 8. 데이터 상세 조회 및 트랜잭션 관리 매니저
// ==========================================
function openDetailModal(key) {
    if (!isAdmin && currentView === 'letters') return;

    const searchPool = (currentView === 'posts') ? allPosts : allLetters;
    const item = searchPool.find(p => p.id === key);
    if (!item) return;

    document.getElementById('detail-title').innerText = item.title;
    // 🛠️ 팝업 모달창 내부의 날짜도 예외 없이 보정 함수를 통과시킵니다.
    document.getElementById('detail-date').innerText = formatTo24Hour(item.date);
    document.getElementById('detail-text').innerText = item.content;
    document.getElementById('detail-modal').style.display = 'flex';
}

function closeDetailModal() { document.getElementById('detail-modal').style.display = 'none'; }

function savePost() {
    if (!isAdmin || !database) return;
    if (isSubmitting) return; 

    const title = document.getElementById('post-title').value.trim();
    const content = document.getElementById('post-content').value.trim();
    
    // 🛠️ 앞으로 작성될 신규 글은 브라우저 오차 없이 강제로 00시 표준 포맷팅으로 저장되도록 선제 조치
    const now = new Date();
    const date = `${now.getFullYear()}. ${now.getMonth() + 1}. ${now.getDate()}. ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    if (!title || !content) {
        showSystemAlert('수평선에 새길 내용을 모두 입력해주세요.');
        return;
    }

    isSubmitting = true; 

    const postData = { title: title, content: content, date: date };

    if (editTargetKey) {
        database.ref('posts/' + editTargetKey).update(postData)
            .then(() => {
                showSystemAlert('기록이 수정되어 바다에 다시 새겨졌습니다.');
                cancelEdit();
            }).catch(err => showSystemAlert("수정 오류 : " + err.message))
            .finally(() => { isSubmitting = false; }); 
    } else {
        database.ref('posts').push(postData)
            .then(() => {
                document.getElementById('post-title').value = '';
                document.getElementById('post-content').value = '';
                currentPage = 1;
                showSystemAlert('바다에 새로운 기록이 성공적으로 수평선 너머에 새겨졌습니다.');
            }).catch(err => showSystemAlert("기록 오류: " + err.message))
            .finally(() => { isSubmitting = false; }); 
    }
}

function saveLetter() {
    if (!database || isSubmitting) return; 

    const title = document.getElementById('letter-title').value.trim();
    const content = document.getElementById('letter-content').value.trim();
    
    // 🛠️ 신규 편지 발송 시에도 무조건 안전한 포맷팅 준수
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
            document.getElementById('letter-title').value = '';
            document.getElementById('letter-content').value = '';
            showSystemAlert('아시님에게 보낼 편지가 넓은 바다 위로 안전하게 띄워졌습니다.');
            currentPage = 1;
            renderUI();
        }).catch(err => showSystemAlert("편지 발송 에러 : " + err.message))
        .finally(() => { isSubmitting = false; }); 
}

function prepareEdit(key) {
    const post = allPosts.find(p => p.id === key);
    if (!post) return;

    editTargetKey = key;
    document.getElementById('write-title').innerText = "기록 수정하기";
    document.getElementById('post-title').value = post.title;
    document.getElementById('post-content').value = post.content;
    document.getElementById('submit-post-btn').innerText = "수정하기";
    document.getElementById('cancel-edit-btn').style.display = "inline-block";
    document.getElementById('write-section').scrollIntoView({ behavior: 'smooth' });
}

function cancelEdit() {
    editTargetKey = null;
    document.getElementById('write-title').innerText = "새로운 기록 남기기";
    document.getElementById('post-title').value = '';
    document.getElementById('post-content').value = '';
    document.getElementById('submit-post-btn').innerText = "기록하기";
    document.getElementById('cancel-edit-btn').style.display = "none";
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

// 편지 제거 소멸 기능
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
    
    showSystemConfirm('🚨 [치명적 대량 소멸 경고]\n수평선 너머 모든 글과 편지들이 흔적도 없이 사라집니다. 초기화할까요?', function() {
        setTimeout(function() {
            showSystemConfirm('이 작업은 절대 되돌릴 수 없습니다. 정말 모든 기록과 편지를 영구 파괴할까요?', function() {
                Promise.all([
                    database.ref('posts').remove(),
                    database.ref('letters').remove()
                ]).then(() => {
                    cancelEdit();
                    currentPage = 1;
                    showSystemAlert('바다가 완전히 정화되어 공백의 초기 상태가 되었습니다.');
                }).catch((error) => showSystemAlert('초기화 실패 : ' + error.message));
            });
        }, 150);
    });
}

function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
