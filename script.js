// ==========================================
// 🛠️ 0. 최우선 라이프 사이클 매니저 (이미지 지연으로 인한 무한 로딩 원천 차단)
// ==========================================
function hideLoadingScreen() {
    const loader = document.getElementById('loading-screen');
    if (loader && loader.style.display !== 'none') {
        loader.style.opacity = '0'; // 부드러운 투명화 애니메이션 가동
        
        // CSS transition(0.8초) 시간과 연동하여 안전하게 display 레이어 제거
        setTimeout(function() {
            loader.style.display = 'none';
        }, 800);
    }
}

// 무거운 이미지 완료 여부와 상관없이, 스크립트와 화면 구조가 준비되면 즉시 로딩창 제거!
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    hideLoadingScreen();
} else {
    document.addEventListener('DOMContentLoaded', hideLoadingScreen);
}

// 구조 준비 완료 즉시 실시간 데이터 동기화 리스너 가동
document.addEventListener('DOMContentLoaded', function() {
    try {
        listenPosts();
        listenLetters();
    } catch (e) {
        console.error("데이터 실시간 리스닝 시작 중 예외 발생:", e);
        hideLoadingScreen(); // 예외가 발생하더라도 로딩창은 무조건 투명하게 치워줌
    }
});

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
// 2. Base64 데이터 해독 및 무결성 Firebase 연결 (도메인 오타 정밀 수정 완료)
// ==========================================
function decodeData(str) { return decodeURIComponent(escape(atob(str))); }

const secureConfig = {
    apiKey: atob("QUl6YVN5QzducVFxRUpjRnBfamR5NHdWRzMzV1lYSWo1eFdKdVYw"),
    authDomain: atob("c3Rhci1ib2NrLmZpcmViYXNlYXBwLmNvbQ=="), // 🛠️ 도메인 디코딩 오타 정밀 복구 완료
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
        console.error("Firebase SDK가 로드되지 않았습니다. 인터넷 연결이나 스크립트 태그를 확인하세요.");
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

// 🛠️ [연타 방지 기능] 중복 발송을 원천 차단하기 위한 글로벌 제어 플래그
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

    document.getElementById('detail-title').innerText = item.title;
    document.getElementById('detail-date').innerText = item.date;
    document.getElementById('detail-text').innerText = item.content;
    document.getElementById('detail-modal').style.display = 'flex';
}

function closeDetailModal() { document.getElementById('detail-modal').style.display = 'none'; }

function savePost() {
    if (!isAdmin || !database) return;
    if (isSubmitting) return; 

    const title = document.getElementById('post-title').value.trim();
    const content = document.getElementById('post-content').value.trim();
    const date = new Date().toLocaleString('ko-KR', { hour12: false }); 

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
    const date = new Date().toLocaleString('ko-KR', { hour12: false }); 

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
}
